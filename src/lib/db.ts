import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 8, // Set to 8 to accommodate Next.js 9-worker builds (9 * 8 = 72) within a 100-conn limit
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  let retries = 3
  while (retries > 0) {
    try {
      const { rows } = await pool.query(sql, params)
      return rows as T[]
    } catch (err: any) {
      if (err.code === '53300' && retries > 1) { // 53300 = too_many_connections
        retries--
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }
      throw err
    }
  }
  throw new Error('Query failed after retries')
}

export async function queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}
