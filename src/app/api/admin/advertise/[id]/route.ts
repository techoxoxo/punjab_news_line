import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { revalidateAdPages } from '@/lib/revalidate-ads'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await query(
      `SELECT * FROM ox_advt WHERE advt_code = $1`,
      [id]
    )

    if (result.length === 0) {
      return NextResponse.json({ error: 'Advertisement not found' }, { status: 404 })
    }

    const row: any = result[0]
    const ymd = (d: unknown) => {
      if (!d) return null
      const dt = d instanceof Date ? d : new Date(d as string)
      if (isNaN(dt.getTime())) return null
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
    }
    return NextResponse.json({ ...row, start_date: ymd(row.start_date), end_date: ymd(row.end_date) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { advt_head, advt_body, permalink, active, geo_enabled, geo_regions, start_date, end_date } = body

    await query(
      `UPDATE ox_advt 
       SET advt_head = $1, advt_body = $2, permalink = $3, active = $4,
           geo_enabled = $5, geo_regions = COALESCE($6, geo_regions), start_date = $7, end_date = $8,
           updated_at = CURRENT_TIMESTAMP 
       WHERE advt_code = $9`,
      [advt_head, advt_body, permalink, active, geo_enabled ?? false, geo_regions ?? null, start_date || null, end_date || null, id]
    )

    revalidateAdPages(permalink)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await query(`DELETE FROM ox_advt WHERE advt_code = $1`, [parseInt(id)])

    // Remove the banner so a future ad reusing this code can't show the old image
    if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET) {
      try {
        const s3 = new S3Client({
          region: 'auto',
          endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          },
        })
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: `images/ads/full${parseInt(id)}.jpg` }))
      } catch (e) {
        console.error('Failed to delete ad image from R2:', e)
      }
    }
    
    revalidateAdPages()
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await query(`UPDATE ox_advt SET updated_at = CURRENT_TIMESTAMP WHERE advt_code = $1`, [id])
    
    revalidateAdPages()
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
