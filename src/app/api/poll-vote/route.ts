import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { pollCode, optionCode } = await request.json() as {
      pollCode: number
      optionCode: number
    }

    if (!pollCode || !optionCode) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Verify option belongs to poll
    const rows = await query<{ option_code: number }>(
      `SELECT option_code FROM ox_poll_option WHERE option_code = $1 AND poll_code = $2`,
      [optionCode, pollCode]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid option' }, { status: 400 })
    }

    await query(
      `UPDATE ox_poll_option SET votes = votes + 1 WHERE option_code = $1`,
      [optionCode]
    )

    // Return updated results
    const results = await query<{ option_code: number; option_text: string; votes: number }>(
      `SELECT option_code, option_text, votes FROM ox_poll_option WHERE poll_code = $1 ORDER BY option_code`,
      [pollCode]
    )

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
