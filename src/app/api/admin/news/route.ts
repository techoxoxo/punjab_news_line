import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    
    // Manually get the next code since it's not a SERIAL column
    const nextCodeResult = await query('SELECT COALESCE(MAX(article_code), 0) + 1 as next_code FROM ox_article')
    const nextCode = (nextCodeResult[0] as any).next_code

    const result = await query<{ article_code: number }>(
      `INSERT INTO ox_article (
        article_code,
        article_head, 
        article_desc, 
        article_body, 
        cgry_code, 
        permalink, 
        meta_title, 
        meta_desc, 
        meta_keys,
        active, 
        date, 
        lang_code,
        hits,
        cgry_list,
        group_list,
        vlink,
        reporter,
        reflink,
        photo_caption,
        sgmt_code,
        team_code,
        mode_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, 0, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING article_code`,
      [
        nextCode,
        data.article_head,
        data.article_desc,
        data.article_body,
        data.cgry_code,
        data.permalink,
        data.meta_title,
        data.meta_desc,
        data.meta_keys || '',
        data.active,
        data.lang_code || 1,
        data.cgry_list || '',
        data.group_list || '',
        data.vlink || '',
        data.reporter || '',
        data.reflink || '',
        data.photo_caption || '',
        data.sgmt_code || 17, // Default to General
        data.team_code || 2,  // Default to General
        data.mode_code || 27  // Default to News
      ]
    )

    return NextResponse.json({ success: true, code: result[0].article_code })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json({ error: 'Failed to save article' }, { status: 500 })
  }
}
