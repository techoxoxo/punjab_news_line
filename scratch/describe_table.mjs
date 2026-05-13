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

async function describeTable() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'ox_article'
      ORDER BY ordinal_position
    `);
    console.table(res.rows);

    const constraints = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'ox_article'::regclass
    `);
    console.log('Constraints:');
    console.table(constraints.rows);

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

describeTable();
