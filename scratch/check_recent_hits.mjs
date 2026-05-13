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

async function checkRecentHits() {
  try {
    const res = await pool.query('SELECT article_code, article_head, hits, date FROM ox_article WHERE active = 2 ORDER BY date DESC LIMIT 20');
    console.log('Recent articles by date:');
    console.table(res.rows);

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkRecentHits();
