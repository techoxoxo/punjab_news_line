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

const pool = new Pool({ connectionString: databaseUrl });

async function checkMediaHits() {
  try {
    const videos = await pool.query('SELECT video_code, video_head, hits FROM ox_video ORDER BY hits DESC LIMIT 5');
    console.log('Top Videos:');
    console.table(videos.rows);

    const galleries = await pool.query('SELECT gallery_code, gallery_head, hits FROM ox_gallery ORDER BY hits DESC LIMIT 5');
    console.log('Top Galleries:');
    console.table(galleries.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkMediaHits();
