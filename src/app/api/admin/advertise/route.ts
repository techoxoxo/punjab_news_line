import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { advt_head, advt_body, permalink, active } = body

    // Manually get the next code since it's not a SERIAL column
    const nextCodeResult = await query('SELECT COALESCE(MAX(advt_code), 0) + 1 as next_code FROM ox_advt')
    const nextCode = (nextCodeResult[0] as any).next_code

    // We'll perform a safe insert into the legacy table
    const result = await query(
      `INSERT INTO ox_advt (advt_code, advt_head, advt_body, permalink, active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING advt_code`,
      [nextCode, advt_head, advt_body, permalink, active]
    )

    return NextResponse.json({ 
      success: true, 
      code: (result[0] as any).advt_code 
    })
  } catch (error: any) {
    console.error('Error creating advertisement:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const result = await query(`
      SELECT advt_code, advt_head, permalink, active, advt_body 
      FROM ox_advt 
      ORDER BY advt_code DESC
    `)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
