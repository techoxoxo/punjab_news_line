const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8')
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .reduce((acc, line) => {
        const [key, ...value] = line.split('=');
        acc[key.trim()] = value.join('=').trim();
        return acc;
    }, {});

const client = new Client({ connectionString: env.DATABASE_URL });

async function check() {
    await client.connect();
    const res = await client.query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE is_nullable = 'NO' 
        AND column_default IS NULL 
        AND table_name IN ('ox_advt', 'ox_article')
    `);
    console.table(res.rows);
    await client.end();
}
check();
