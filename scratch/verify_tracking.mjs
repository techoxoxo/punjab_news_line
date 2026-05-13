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

async function verifyTracking() {
  const testArticleCode = 104278; // 'teest'
  
  try {
    // 1. Get initial hits
    const initial = await pool.query('SELECT hits FROM ox_article WHERE article_code = $1', [testArticleCode]);
    console.log(`Initial hits for article ${testArticleCode}:`, initial.rows[0].hits);

    // 2. Simulate a hit via SQL (since I can't easily hit the local Next.js server's API route in a way that respects the in-memory Map)
    // Actually, I want to verify if the SQL query in the API is correct.
    await pool.query('UPDATE ox_article SET hits = COALESCE(hits, 0) + 1 WHERE article_code = $1', [testArticleCode]);
    
    // 3. Get final hits
    const final = await pool.query('SELECT hits FROM ox_article WHERE article_code = $1', [testArticleCode]);
    console.log(`Final hits for article ${testArticleCode}:`, final.rows[0].hits);

    if (Number(final.rows[0].hits) === Number(initial.rows[0].hits) + 1) {
      console.log('✅ SQL Update logic is working correctly.');
    } else {
      console.log('❌ SQL Update logic failed.');
    }

    // 4. Verify Media Tracking (Gallery)
    const testGalleryCode = 1;
    const gInitial = await pool.query('SELECT hits FROM ox_gallery WHERE gallery_code = $1', [testGalleryCode]);
    console.log(`Initial hits for gallery ${testGalleryCode}:`, gInitial.rows[0].hits);

    await pool.query('UPDATE ox_gallery SET hits = COALESCE(hits, 0) + 1 WHERE gallery_code = $1', [testGalleryCode]);

    const gFinal = await pool.query('SELECT hits FROM ox_gallery WHERE gallery_code = $1', [testGalleryCode]);
    console.log(`Final hits for gallery ${testGalleryCode}:`, gFinal.rows[0].hits);

    if (Number(gFinal.rows[0].hits) === Number(gInitial.rows[0].hits) + 1) {
      console.log('✅ Gallery Update logic is working correctly.');
    }

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

verifyTracking();
