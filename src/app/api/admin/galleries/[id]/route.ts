import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const gallery = await query(
      `SELECT * FROM ox_gallery WHERE gallery_code = $1`,
      [id]
    )
    
    if (gallery.length === 0) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    const photos = await query(
      `SELECT * FROM ox_multiphoto WHERE photo_code = $1 ORDER BY sorting ASC`,
      [id]
    )

    return NextResponse.json({
      ...(gallery as any[])[0],
      photos
    })
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
      gallery_head,
      gallery_desc,
      cgry_code,
      permalink,
      active,
      meta_title,
      meta_desc,
      meta_keys,
      lang_code
    } = body

    await query(
      `UPDATE ox_gallery SET 
        gallery_head = $1, 
        gallery_desc = $2, 
        cgry_code = $3, 
        permalink = $4, 
        active = $5, 
        meta_title = $6, 
        meta_desc = $7, 
        meta_keys = $8,
        lang_code = $9
       WHERE gallery_code = $10`,
      [
        gallery_head,
        gallery_desc,
        cgry_code,
        permalink,
        active,
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
