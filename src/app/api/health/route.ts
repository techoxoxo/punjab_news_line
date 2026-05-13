import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: true, service: 'next_punjabnewsline' }, { status: 200 })
}
