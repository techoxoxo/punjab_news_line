
const { query } = require('./src/lib/db');

async function test() {
  const categories = await query('SELECT acgr_code as code, acgr_name as name FROM ox_acategory WHERE active = 2 ORDER BY acgr_code');
  console.log(JSON.stringify(categories, null, 2));
}

test();
