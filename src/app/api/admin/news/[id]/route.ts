import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getArticleByCode } from '@/lib/queries'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const article = await getArticleByCode(parseInt(id))
    if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(article)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const data = await request.json()
    
    await query(
      `UPDATE ox_article SET 
        article_head = $1, 
        article_desc = $2, 
        article_body = $3, 
        cgry_code = $4, 
        permalink = $5, 
        meta_title = $6, 
        meta_desc = $7, 
        active = $8,
        cgry_list = $9,
        group_list = $10,
        vlink = $11,
        reporter = $12,
        reflink = $13,
        meta_keys = $14,
        photo_caption = $15,
        lang_code = $16,
        team_code = $17,
        sgmt_code = $18,
        mode_code = $19,
        sgmt_list = $20
      WHERE article_code = $21`,
      [
        data.article_head,
        data.article_desc,
        data.article_body,
        data.cgry_code,
        data.permalink,
        data.meta_title,
        data.meta_desc,
        data.active,
        data.cgry_list || '',
        data.group_list || '',
        data.vlink || '',
        data.reporter || '',
        data.reflink || '',
        data.meta_keys || '',
        data.photo_caption || '',
        data.lang_code || 1,
        data.team_code || 2,
        data.sgmt_code || 17,
        data.mode_code || 27,
        data.sgmt_list || '',
        parseInt(id)
      ]
    )

    revalidatePath(`/news/${data.permalink}`)
    revalidatePath('/admin/news')
    revalidatePath('/')
    console.log(`[PATCH] Article ${id} updated and cache invalidated`)


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH] Update error:', error)
    return NextResponse.json({ error: 'Failed to update article', details: error }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('--- [API DELETE] START ---')
  const session = await getServerSession(authOptions)
  if (!session) {
    console.warn('[API DELETE] No session found')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  console.log('[API DELETE] User:', session.user?.email)

  try {
    const { id } = await params
    const articleCode = parseInt(id)
    console.log(`[API DELETE] Article Code: ${articleCode}`)

    // 1. Delete associated data first
    try {
      console.log(`[DELETE] Cleaning up sub-tables for ${articleCode}...`)
      await query(`DELETE FROM ox_comment WHERE article_code = $1`, [articleCode])
      await query(`DELETE FROM ox_articlev WHERE article_code = $1`, [articleCode])
      await query(`DELETE FROM ox_commentv WHERE article_code = $1`, [articleCode])
      await query(`DELETE FROM article_translations WHERE article_code = $1 OR related_code = $1`, [articleCode])
      await query(`DELETE FROM ox_counter WHERE code = $1`, [articleCode])
    } catch (e: any) {
      console.warn('[DELETE] Non-critical cleanup failed:', e.message)
    }

    // 2. Finally delete the article
    console.log(`[DELETE] Deleting from ox_article...`)
    const articleResult = await query(`DELETE FROM ox_article WHERE article_code = $1`, [articleCode])
    console.log(`[DELETE] Result:`, articleResult)

    // 3. Revalidate cache
    revalidatePath('/admin/news')
    revalidatePath('/')

    return NextResponse.json({ success: true, articleCode })
  } catch (error: any) {
    console.error('[DELETE] CRITICAL ERROR:', error)
    return NextResponse.json({ 
      error: 'Failed to delete article.',
      details: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN',
      stack: error.stack
    }, { status: 500 })
  }
}
