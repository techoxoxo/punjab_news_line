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

const client = new Client({
    connectionString: env.DATABASE_URL
});

async function inspect() {
    try {
        await client.connect();
        console.log("Connected to database.");

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ox_article'
            ORDER BY column_name
        `);
        console.log("All columns in ox_article:");
        console.table(res.rows);

        await client.end();
    } catch (e) {
        console.error(e);
    }
}

inspect();
