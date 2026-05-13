import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const video = await query(
      `SELECT * FROM ox_video WHERE video_code = $1`,
      [id]
    )
    
    if (video.length === 0) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json(video[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const {
      video_head,
      video_desc,
      video_body,
      cgry_code,
      permalink,
      active,
      vlink,
      meta_title,
      meta_desc,
      meta_keys,
      lang_code
    } = body

    await query(
      `UPDATE ox_video SET 
        video_head = $1, 
        video_desc = $2, 
        video_body = $3,
        cgry_code = $4, 
        permalink = $5, 
        active = $6, 
        vlink = $7,
        meta_title = $8, 
        meta_desc = $9, 
        meta_keys = $10,
        lang_code = $11
       WHERE video_code = $12`,
      [
        video_head,
        video_desc,
        video_body || '',
        cgry_code,
        permalink,
        active,
        vlink,
        meta_title,
        meta_desc,
        meta_keys,
        lang_code,
        id
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
