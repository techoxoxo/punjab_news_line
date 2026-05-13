import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const polls = await query('SELECT * FROM ox_pollx ORDER BY pllx_code DESC')
    return NextResponse.json(polls)
  } catch (error) {
    console.error('Failed to fetch polls:', error)
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    
    // Get next code
    const nextCodeResult = await query('SELECT COALESCE(MAX(pllx_code), 0) + 1 as next_code FROM ox_pollx')
    const nextCode = (nextCodeResult[0] as any).next_code

    await query(
      `INSERT INTO ox_pollx (
        pllx_code, 
        date, 
        pllx_head, 
        poll1, poll2, poll3, poll4, poll5, poll6,
        count1, count2, count3, count4, count5, count6,
        permalink, 
        active,
        lang_code
      ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, 0, 0, 0, $9, $10, $11)`,
      [
        nextCode,
        data.pllx_head,
        data.poll1 || '',
        data.poll2 || '',
        data.poll3 || '',
        data.poll4 || '',
        data.poll5 || '',
        data.poll6 || '',
        data.permalink || '',
        data.active || 2,
        data.lang_code || 1
      ]
    )

    return NextResponse.json({ success: true, code: nextCode })
  } catch (error) {
    console.error('Failed to create poll:', error)
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })
  }
}
