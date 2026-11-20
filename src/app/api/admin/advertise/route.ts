import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { advt_head, advt_body, permalink, active, geo_enabled, geo_regions, start_date, end_date } = body

    // advt_code is not a SERIAL column: compute next code atomically in the INSERT
    // and retry if a concurrent request grabbed the same code (unique violation).
    let result: any[] = []
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        result = await query(
          `INSERT INTO ox_advt (advt_code, advt_head, advt_body, permalink, active, geo_enabled, geo_regions, start_date, end_date, updated_at)
           SELECT COALESCE(MAX(advt_code), 0) + 1, $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP FROM ox_advt
           RETURNING advt_code`,
          [advt_head, advt_body, permalink, active, geo_enabled ?? false, geo_regions ?? 'punjab', start_date || null, end_date || null]
        )
        break
      } catch (e: any) {
        if (e.code === '23505' && attempt < 4) continue
        throw e
      }
    }

    const { revalidatePath } = await import('next/cache')
    revalidatePath('/')
    revalidatePath('/news/[slug]', 'page')
    revalidatePath('/category/[slug]', 'page')
    revalidatePath('/advertisement')
    revalidatePath('/admin/advertise')

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
      SELECT advt_code, advt_head, permalink, active, advt_body, updated_at, geo_enabled, geo_regions, start_date, end_date 
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
