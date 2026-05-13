import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ multi_code: string }> }
) {
  const { multi_code } = await params
  try {
    await query(
      `DELETE FROM ox_multiphoto WHERE multi_code = $1`,
      [multi_code]
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ multi_code: string }> }
) {
  const { multi_code } = await params
  try {
    const data = await request.json()
    if (data.photo_caption !== undefined) {
      await query(
        `UPDATE ox_multiphoto SET photo_caption = $1 WHERE multi_code = $2`,
        [data.photo_caption, multi_code]
      )
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
