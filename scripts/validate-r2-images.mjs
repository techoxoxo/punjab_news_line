#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { Pool } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_URL || '').replace(/\/$/, '')
const LIMIT = Number.parseInt(process.env.VALIDATE_IMAGE_LIMIT || '100', 10)
const TIMEOUT_MS = Number.parseInt(process.env.VALIDATE_IMAGE_TIMEOUT_MS || '8000', 10)

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}

if (!R2_PUBLIC_URL) {
  console.error('Missing R2_PUBLIC_URL or NEXT_PUBLIC_R2_URL')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 4 })

const timeoutSignal = () => AbortSignal.timeout(TIMEOUT_MS)

async function checkUrl(url) {
  const headRes = await fetch(url, { method: 'HEAD', signal: timeoutSignal() }).catch(() => null)
  if (headRes && headRes.ok) return { ok: true, status: headRes.status, method: 'HEAD' }

  const getRes = await fetch(url, {
    method: 'GET',
    headers: { Range: 'bytes=0-0' },
    signal: timeoutSignal(),
  }).catch(() => null)

  if (getRes && (getRes.ok || getRes.status === 206)) {
    return { ok: true, status: getRes.status, method: 'GET' }
  }

  return {
    ok: false,
    status: getRes?.status ?? headRes?.status ?? 0,
    method: getRes ? 'GET' : (headRes ? 'HEAD' : 'NONE'),
  }
}

async function main() {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `SELECT article_code, permalink, date
       FROM ox_article
       WHERE active = 2
       ORDER BY date DESC NULLS LAST, article_code DESC
       LIMIT $1`,
      [LIMIT]
    )

    const failures = []
    let ok = 0

    for (const row of rows) {
      const url = `${R2_PUBLIC_URL}/images/news/full${row.article_code}-0.jpg`
      const result = await checkUrl(url)
      if (result.ok) {
        ok += 1
      } else {
        failures.push(`${result.status}\t${row.article_code}\t${row.permalink ?? ''}\t${url}`)
      }
    }

    const auditDir = path.join(process.cwd(), 'audit')
    await fs.mkdir(auditDir, { recursive: true })
    const reportPath = path.join(auditDir, 'r2-missing-images.txt')
    await fs.writeFile(
      reportPath,
      failures.length > 0
        ? failures.join('\n')
        : 'All checked article hero images returned HTTP 200/206.\n',
      'utf8'
    )

    console.log(`Checked: ${rows.length}`)
    console.log(`Passed:  ${ok}`)
    console.log(`Failed:  ${failures.length}`)
    console.log(`Report:  ${reportPath}`)

    process.exit(failures.length > 0 ? 2 : 0)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
