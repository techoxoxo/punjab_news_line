import { query } from './src/lib/db';

async function inspect() {
    try {
        console.log("Inspecting ox_advt...");
        const advtSchema = await query(`
            SELECT column_name, column_default, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ox_advt'
        `);
        console.log(JSON.stringify(advtSchema, null, 2));

        console.log("\nInspecting ox_article...");
        const articleSchema = await query(`
            SELECT column_name, column_default, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ox_article'
        `);
        console.log(JSON.stringify(articleSchema, null, 2));

        console.log("\nChecking sequences...");
        const sequences = await query(`
            SELECT sequence_name FROM information_schema.sequences
        `);
        console.log(JSON.stringify(sequences, null, 2));

    } catch (e) {
        console.error(e);
    }
}

inspect();
