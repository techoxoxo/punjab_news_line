#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { Pool } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL
const APPLY = process.argv.includes('--apply')
const AUDIT_DIR = path.join(process.cwd(), 'audit')
const GENERATED_SLUG_FILE = path.join(AUDIT_DIR, 'generated-slugs.txt')
const DUPLICATE_FILE = path.join(AUDIT_DIR, 'duplicate-permalinks.txt')

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 4 })

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[-\s]+/g, '-')
}

function cleanPermalink(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019\u201C\u201D]/g, '') // Smart quotes
    .replace(/\u00A0/g, '-') // NBSP to hyphen
    .replace(/[^a-z0-9-]/g, '-') // Everything else to hyphen
    .replace(/-+/g, '-') // Multiple hyphens to single
    .replace(/^-+|-+$/g, '') // Trim hyphens
}

async function ensureUniqueSlug(client, baseSlug, articleCode) {
  let candidate = baseSlug || `article-${articleCode}`
  let suffix = 1
  while (true) {
    const row = await client.query(
      `SELECT 1 FROM ox_article WHERE permalink = $1 AND article_code != $2 LIMIT 1`,
      [candidate, articleCode]
    )
    if (row.rowCount === 0) return candidate
    candidate = `${baseSlug}-${suffix++}`
  }
}

async function main() {
  const client = await pool.connect()
  try {
    await fs.mkdir(AUDIT_DIR, { recursive: true })
    const generated = []
    const cleaned = []

    // 1. Clean dirty permalinks
    const dirty = await client.query(
      `SELECT article_code, permalink FROM ox_article WHERE active = 2 AND permalink ~ '[^a-z0-9-]'`
    )
    console.log(`Found ${dirty.rowCount} dirty permalinks.`)

    for (const row of dirty.rows) {
      const clean = cleanPermalink(row.permalink)
      if (clean !== row.permalink) {
        const unique = await ensureUniqueSlug(client, clean, row.article_code)
        cleaned.push({ old: row.permalink, new: unique, code: row.article_code })
        
        if (APPLY) {
          await client.query(
            `UPDATE ox_article SET permalink = $1 WHERE article_code = $2`,
            [unique, row.article_code]
          )
          // Also insert into seo_redirects if table exists
          await client.query(
            `INSERT INTO seo_redirects (source, destination, type) 
             VALUES ($1, $2, 301) 
             ON CONFLICT (source) DO NOTHING`,
            [`/news/${row.permalink}`, `/news/${unique}`]
          )
        }
      }
    }
    console.log(`Cleaned ${cleaned.length} permalinks.`)

    const missing = await client.query(
      `SELECT article_code, article_head, permalink
       FROM ox_article
       WHERE active = 2
         AND (permalink IS NULL OR btrim(permalink) = '')
       ORDER BY article_code`
    )

    for (const row of missing.rows) {
      const base = slugify(row.article_head) || `article-${row.article_code}`
      const unique = await ensureUniqueSlug(client, base, row.article_code)
      generated.push(`${row.article_code}\t${row.article_head ?? ''}\t${unique}`)

      if (APPLY) {
        await client.query(
          `UPDATE ox_article SET permalink = $1 WHERE article_code = $2`,
          [unique, row.article_code]
        )
      }
    }

    await fs.writeFile(
      GENERATED_SLUG_FILE,
      generated.length > 0
        ? generated.join('\n') + '\n'
        : 'No missing permalinks found.\n',
      'utf8'
    )

    const duplicates = await client.query(
      `SELECT permalink, COUNT(*)::text AS count
       FROM ox_article
       WHERE permalink IS NOT NULL AND btrim(permalink) != ''
       GROUP BY permalink
       HAVING COUNT(*) > 1
       ORDER BY COUNT(*) DESC, permalink`
    )

    await fs.writeFile(
      DUPLICATE_FILE,
      duplicates.rowCount > 0
        ? duplicates.rows.map((r) => `${r.count}\t${r.permalink}`).join('\n') + '\n'
        : 'No duplicate permalinks found.\n',
      'utf8'
    )

    if (APPLY && duplicates.rowCount > 0) {
      console.log(`Fixing ${duplicates.rowCount} duplicate permalink groups...`)
      for (const group of duplicates.rows) {
        // Find all articles with this permalink
        const members = await client.query(
          `SELECT article_code, article_head FROM ox_article WHERE permalink = $1 ORDER BY article_code`,
          [group.permalink]
        )
        // Keep the first one as is, fix the rest
        for (let i = 1; i < members.rows.length; i++) {
          const row = members.rows[i]
          const unique = await ensureUniqueSlug(client, group.permalink, row.article_code)
          console.log(`  Fixing duplicate: ${row.article_code} [${group.permalink}] -> [${unique}]`)
          await client.query(
            `UPDATE ox_article SET permalink = $1 WHERE article_code = $2`,
            [unique, row.article_code]
          )
        }
      }
    }

    if (APPLY) {
      console.log('Applying unique constraint...')
      await client.query(
        `DO $$
         BEGIN
           IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_article_permalink') THEN
             ALTER TABLE ox_article ADD CONSTRAINT uq_article_permalink UNIQUE (permalink);
           END IF;
         END $$;`
      )
    }

    console.log(`Missing permalinks: ${missing.rowCount}`)
    console.log(`Generated slugs:    ${generated.length}`)
    console.log(`Duplicates:         ${duplicates.rowCount}`)
    console.log(`Generated report:   ${GENERATED_SLUG_FILE}`)
    console.log(`Duplicate report:   ${DUPLICATE_FILE}`)
    console.log(`Mode:               ${APPLY ? 'apply' : 'dry-run'}`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
