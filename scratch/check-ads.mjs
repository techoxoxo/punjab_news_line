import pg from 'pg';
const { Client } = pg;

async function check() {
  const connectionString = 'postgres://postgres:Anuj%40123@localhost:5432/punjabnewsline';
  const client = new Client({ connectionString });
  await client.connect();
  
  const res = await client.query('SELECT advt_code, advt_head, advt_body, geo_enabled, geo_regions, start_date, end_date FROM ox_advt WHERE active = 2');
  console.log(JSON.stringify(res.rows, null, 2));
  
  await client.end();
}

check().catch(console.error);
