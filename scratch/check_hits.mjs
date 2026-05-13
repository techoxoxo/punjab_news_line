import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?(.+?)["']?(\s|$)/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : null;

if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function checkHits() {
  try {
    const res = await pool.query('SELECT article_code, article_head, hits FROM ox_article WHERE active = 2 ORDER BY hits DESC LIMIT 10');
    console.log('Top articles by hits:');
    console.table(res.rows);

    const totalHits = await pool.query('SELECT sum(hits) FROM ox_article');
    console.log('Total hits across all articles:', totalHits.rows[0].sum);

    const zeroHits = await pool.query('SELECT count(*) FROM ox_article WHERE hits = 0 OR hits IS NULL');
    console.log('Articles with 0 hits:', zeroHits.rows[0].count);

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkHits();
