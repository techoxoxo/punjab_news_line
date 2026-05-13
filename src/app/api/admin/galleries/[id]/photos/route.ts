import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { file_name, photo_caption, sorting, active } = body

    const result = await query(
      `INSERT INTO ox_multiphoto (photo_code, file_name, photo_caption, sorting, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING multi_code`,
      [id, file_name, photo_caption || '', sorting || 0, active || 2]
    )

    return NextResponse.json({ success: true, multi_code: (result as any[])[0]?.multi_code })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
