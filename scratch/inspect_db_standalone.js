const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Basic .env parser
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

        console.log("\nInspecting ox_advt...");
        const advtRes = await client.query(`
            SELECT column_name, column_default, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ox_advt'
            ORDER BY ordinal_position
        `);
        console.table(advtRes.rows);

        console.log("\nInspecting ox_article...");
        const articleRes = await client.query(`
            SELECT column_name, column_default, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ox_article'
            ORDER BY ordinal_position
        `);
        console.table(articleRes.rows);

        console.log("\nChecking sequences...");
        const seqRes = await client.query(`
            SELECT sequence_name FROM information_schema.sequences
        `);
        console.table(seqRes.rows);

        await client.end();
    } catch (e) {
        console.error(e);
    }
}

inspect();
