import { cache } from 'react'
import { query, queryOne } from './db'
import type {
  Article,
  Video,
  Gallery,
  Poll,
  PollX,
  PollOption,
  Category,
  Advertisement,
  Company,
} from './types'
import { LANG_CODE_MAP } from './types'

function normalizePermalink(slug: string): string {
  return slug
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/[.\u200B\u200C\u200D\uFEFF\s]+$/g, '')
}

// ── Articles ───────────────────────────────────────────────────────────────

export const getArticleByPermalink = cache(async (slug: string): Promise<Article | null> => {
  const exact = await queryOne<Article>(
    `SELECT a.*, 
      CASE a.cgry_code
        WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
        WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
        WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
        WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
        WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
        ELSE c.acgr_name
      END as category_name,
      CASE a.cgry_code
        WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
        WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
        WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
        WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
        WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
        ELSE oc.cgry_url
      END as category_url 
     FROM ox_article a 
     LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
     LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
     WHERE a.permalink = $1 AND a.active = 2 LIMIT 1`,
    [slug]
  )

  if (exact) {
    return exact
  }

  const normalized = normalizePermalink(slug)
  if (normalized && normalized !== slug) {
    const normalizedMatch = await queryOne<Article>(
      `SELECT a.*, 
        CASE a.cgry_code
          WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
          WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
          WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
          WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
          WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
          ELSE c.acgr_name
        END as category_name,
        CASE a.cgry_code
          WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
          WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
          WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
          WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
          WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
          ELSE oc.cgry_url
        END as category_url 
       FROM ox_article a 
       LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
       LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
       WHERE a.permalink = $1 AND a.active = 2 LIMIT 1`,
      [normalized]
    )
    if (normalizedMatch) {
      return normalizedMatch
    }
  }

  // Legacy URLs often end with the numeric article id (e.g. ...-91555).
  const codeMatch = (normalized || slug).match(/-(\d+)$/)
  if (codeMatch) {
    const byCode = await queryOne<Article>(
      `SELECT a.*, 
        CASE a.cgry_code
          WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
          WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
          WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
          WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
          WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
          ELSE c.acgr_name
        END as category_name,
        CASE a.cgry_code
          WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
          WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
          WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
          WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
          WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
          ELSE oc.cgry_url
        END as category_url 
       FROM ox_article a 
       LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
       LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
       WHERE a.article_code = $1 AND a.active = 2 LIMIT 1`,
      [Number(codeMatch[1])]
    )
    if (byCode) {
      return byCode
    }
  }

  return queryOne<Article>(
    `SELECT a.*, 
      CASE a.cgry_code
        WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
        WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
        WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
        WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
        WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
        ELSE c.acgr_name
      END as category_name,
      CASE a.cgry_code
        WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
        WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
        WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
        WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
        WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
        ELSE oc.cgry_url
      END as category_url 
     FROM ox_article a 
     LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
     LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
     WHERE LOWER(a.permalink) = LOWER($1) AND a.active = 2 LIMIT 1`,
     [slug]
  )
})

export async function incrementArticleHits(articleCode: number) {
  return query(
    `UPDATE ox_article SET hits = COALESCE(hits, 0) + 1 WHERE article_code = $1`,
    [articleCode]
  )
}

export const getArticleByCode = cache(async (code: number): Promise<Article | null> => {
  return queryOne<Article>(
    `SELECT a.*, 
      CASE a.cgry_code
        WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
        WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
        WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
        WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
        WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
        ELSE c.acgr_name
      END as category_name,
      CASE a.cgry_code
        WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
        WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
        WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
        WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
        WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
        ELSE oc.cgry_url
      END as category_url 
     FROM ox_article a 
     LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
     LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
     WHERE a.article_code = $1 LIMIT 1`,
    [code]
  )
})

export const getArticlesByCategory = cache(async (
  cgryCcode: number,
  page = 1,
  limit = 20
): Promise<Article[]> => {
  const offset = (page - 1) * limit
  return query<Article>(
    `SELECT a.*, 
      CASE a.cgry_code
        WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
        WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
        WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
        WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
        WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
        ELSE c.acgr_name
      END as category_name,
      CASE a.cgry_code
        WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
        WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
        WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
        WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
        WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
        ELSE oc.cgry_url
      END as category_url 
     FROM ox_article a
     LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
     LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
      WHERE (a.cgry_code = $1 OR string_to_array(a.cgry_list, ',') @> ARRAY[$1::text]) AND a.active = 2 
      ORDER BY a.article_code DESC LIMIT $2 OFFSET $3`,
    [cgryCcode, limit, offset]
  )
})

export const getArticleCountByCategory = cache(async (cgryCode: number): Promise<number> => {
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM ox_article WHERE (cgry_code = $1 OR string_to_array(cgry_list, ',') @> ARRAY[$1::text]) AND active = 2`,
    [cgryCode]
  )
  return parseInt(rows[0]?.count ?? '0')
})

export const getArticleCountBySegment = cache(async (sgmtCode: number): Promise<number> => {
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM ox_article WHERE (sgmt_code = $1 OR string_to_array(sgmt_list, ',') @> ARRAY[$1::text]) AND active = 2`,
    [sgmtCode]
  )
  return parseInt(rows[0]?.count ?? '0')
})


export const getArticlesBySegment = cache(async (
  sgmtCode: number,
  page = 1,
  limit = 20
): Promise<Article[]> => {
  const offset = (page - 1) * limit
  return query<Article>(
    `SELECT a.*, 
      CASE a.cgry_code
        WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
        WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
        WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
        WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
        WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
        ELSE c.acgr_name
      END as category_name,
      CASE a.cgry_code
        WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
        WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
        WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
        WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
        WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
        ELSE oc.cgry_url
      END as category_url 
     FROM ox_article a
     LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
     LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
      WHERE (a.sgmt_code = $1 OR string_to_array(a.sgmt_list, ',') @> ARRAY[$1::text]) AND a.active = 2 
      ORDER BY a.date DESC LIMIT $2 OFFSET $3`,
    [sgmtCode, limit, offset]
  )
})

export const getSpotlightArticles = cache(async (minLimit = 10): Promise<Article[]> => {
  // This query fetches all articles from the current day (UTC),
  // and if there are fewer than minLimit, it fills with previous articles.
  // We use a reasonably high upper limit (30) to define "all top most of current day".
  return query<Article>(
    `SELECT a.*, 
      CASE a.cgry_code
        WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
        WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
        WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
        WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
        WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
        ELSE c.acgr_name
      END as category_name,
      CASE a.cgry_code
        WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
        WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
        WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
        WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
        WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'Uttarakhand'
        ELSE oc.cgry_url
      END as category_url 
     FROM ox_article a
     LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
     LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
      WHERE (a.sgmt_code = 15 OR string_to_array(a.sgmt_list, ',') @> ARRAY['15']) AND a.active = 2 
      ORDER BY a.date DESC 
      LIMIT 30`,
    []
  ).then(articles => {
    // We want ALL of today, but if today has < 10, we keep at least 10.
    const today = new Date().toISOString().split('T')[0]
    const todayArticles = articles.filter(a => {
      const d = a.date instanceof Date ? a.date : new Date(a.date!)
      return d.toISOString().split('T')[0] === today
    })
    
    if (todayArticles.length >= minLimit) {
      // If we have more than 10 today, show ALL of today's articles
      return todayArticles
    }
    
    // Otherwise, return at least 10 (mix of today and previous)
    return articles.slice(0, minLimit)
  })
})

export const getBreakingArticles = cache(async (limit = 2): Promise<Article[]> => {
  return query<Article>(
    `SELECT a.*, 
      CASE a.cgry_code
        WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
        WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
        WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
        WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
        WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
        ELSE c.acgr_name
      END as category_name,
      CASE a.cgry_code
        WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
        WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
        WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
        WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
        WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
        ELSE oc.cgry_url
      END as category_url 
     FROM ox_article a
     LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
     LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
     WHERE a.active = 2 
       AND string_to_array(a.group_list, ',') @> ARRAY['58']
       AND a.date >= NOW() - INTERVAL '5 days'
     ORDER BY a.date DESC 
     LIMIT $1`,
    [limit]
  )
})

export const getPopularArticles = cache(async (limit = 4, days = 90): Promise<Article[]> => {
  return query<Article>(
    `SELECT a.*, 
      CASE a.cgry_code
        WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
        WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
        WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
        WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
        WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
        ELSE c.acgr_name
      END as category_name,
      CASE a.cgry_code
        WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
        WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
        WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
        WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
        WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
        ELSE oc.cgry_url
      END as category_url 
     FROM ox_article a
     LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
     LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
     WHERE a.active = 2 
       AND a.date >= NOW() - ($2 * INTERVAL '1 day')
     ORDER BY COALESCE(a.hits, 0) DESC, a.date DESC
     LIMIT $1`,
    [limit, days]
  )
})



export const getLatestArticles = cache(async (
  page = 1,
  limit = 20,
  sgmtCode?: number
): Promise<Article[]> => {
  const offset = (page - 1) * limit
  let whereClause = 'WHERE a.active = 2'
  let params: any[] = [limit, offset]
  
  if (sgmtCode !== undefined) {
    whereClause += ' AND (a.sgmt_code = $3 OR string_to_array(a.sgmt_list, \',\') @> ARRAY[$3::text])'
    params.push(sgmtCode)
  }

  return query<Article>(
    `SELECT a.*, 
      CASE a.cgry_code
        WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
        WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
        WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
        WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
        WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
        ELSE c.acgr_name
      END as category_name,
      CASE a.cgry_code
        WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
        WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
        WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
        WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
        WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
        ELSE oc.cgry_url
      END as category_url 
     FROM ox_article a 
     LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
     LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
     ${whereClause} 
     ORDER BY a.date DESC LIMIT $1 OFFSET $2`,
    params
  )
})

export const getRelatedArticles = cache(async (
  cgryCode: number,
  excludeCode: number,
  limit = 6
): Promise<Article[]> => {
  return query<Article>(
    `SELECT a.*, 
      CASE a.cgry_code
        WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
        WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
        WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
        WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
        WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
        ELSE c.acgr_name
      END as category_name,
      CASE a.cgry_code
        WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
        WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
        WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
        WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
        WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
        ELSE oc.cgry_url
      END as category_url 
     FROM ox_article a
     LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
     LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
     WHERE a.cgry_code = $1 AND a.active = 2 AND a.article_code != $2
     ORDER BY a.date DESC LIMIT $3`,
    [cgryCode, excludeCode, limit]
  )
})

export const searchArticles = cache(async (
  searchQuery: string,
  page = 1,
  limit = 20
): Promise<Article[]> => {
  const offset = (page - 1) * limit
  return query<Article>(
    `SELECT a.*, 
      CASE a.cgry_code
        WHEN 6 THEN 'Business' WHEN 7 THEN 'Haryana' WHEN 8 THEN 'Political' WHEN 9 THEN 'Human Interest'
        WHEN 10 THEN 'Chandigarh' WHEN 11 THEN 'Global News' WHEN 12 THEN 'Health' WHEN 13 THEN 'Technology'
        WHEN 14 THEN 'Sports' WHEN 15 THEN 'Education' WHEN 16 THEN 'Opinion' WHEN 17 THEN 'Himachal'
        WHEN 18 THEN 'Diaspora' WHEN 19 THEN 'Environment' WHEN 20 THEN 'National' WHEN 21 THEN 'Punjab'
        WHEN 22 THEN 'Crime & Law' WHEN 24 THEN 'Travel' WHEN 25 THEN 'Films & TV' WHEN 26 THEN 'Life Style'
        WHEN 30 THEN 'Delhi NCR' WHEN 31 THEN 'Uttar Pradesh' WHEN 32 THEN 'Jammu & Kashmir' WHEN 33 THEN 'Uttarakhand'
        ELSE c.acgr_name
      END as category_name,
      CASE a.cgry_code
        WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
        WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
        WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
        WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
        WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
        ELSE oc.cgry_url
      END as category_url,
      ts_rank(to_tsvector('simple', coalesce(a.article_head,'') || ' ' || coalesce(a.article_body,'')),
      plainto_tsquery('simple', $1)) AS rank
     FROM ox_article a
     LEFT JOIN ox_acategory c ON a.cgry_code = c.acgr_code
     LEFT JOIN ox_code oc ON a.cgry_code = oc.cgry_code
     WHERE a.active = 2
       AND to_tsvector('simple', coalesce(a.article_head,'') || ' ' || coalesce(a.article_body,''))
           @@ plainto_tsquery('simple', $1)
     ORDER BY rank DESC, a.date DESC
     LIMIT $2 OFFSET $3`,
    [searchQuery, limit, offset]
  )
})

export const getSearchCount = cache(async (searchQuery: string): Promise<number> => {
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*) as count 
     FROM ox_article 
     WHERE active = 2
       AND to_tsvector('simple', coalesce(article_head,'') || ' ' || coalesce(article_body,''))
           @@ plainto_tsquery('simple', $1)`,
    [searchQuery]
  )
  return parseInt(rows[0]?.count ?? '0')
})

export const getArticleCount = cache(async (): Promise<number> => {
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM ox_article WHERE active = 2 AND permalink != ''`
  )
  return parseInt(rows[0]?.count ?? '0')
})

// For sitemap — only fetch permalink + date, no heavy fields
export const getAllArticlePermalinks = cache(async (): Promise<{ permalink: string; date: Date | null }[]> => {
  return query<{ permalink: string; date: Date | null }>(
    `SELECT permalink, date FROM ox_article WHERE active = 2 AND permalink != '' ORDER BY date DESC`
  )
})

export const getArticleLanguageAlternates = cache(async (
  articleCode: number,
  fallbackPermalink: string
): Promise<Record<string, string>> => {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://punjabnewsline.com'
  const rows = await query<{ lang_code: number | null; permalink: string }>(
    `SELECT a.lang_code, a.permalink
     FROM article_translations t
     JOIN ox_article a ON a.article_code = t.related_code
     WHERE t.article_code = $1
       AND a.active = 2
       AND a.permalink IS NOT NULL
       AND a.permalink != ''
     UNION
     SELECT lang_code, permalink
     FROM ox_article
     WHERE article_code = $1
       AND active = 2
       AND permalink IS NOT NULL
       AND permalink != ''`,
    [articleCode]
  )

  if (rows.length === 0) {
    return {}
  }

  const languages: Record<string, string> = {}
  for (const row of rows) {
    const locale = row.lang_code ? LANG_CODE_MAP[row.lang_code] : undefined
    if (!locale) continue
    languages[locale] = `${site}/news/${row.permalink || fallbackPermalink}`
  }

  return languages
})

// ── Video ──────────────────────────────────────────────────────────────────

export const getVideoByPermalink = cache(async (slug: string): Promise<Video | null> => {
  return queryOne<Video>(
    `SELECT * FROM ox_video WHERE permalink = $1 AND active = 2 LIMIT 1`,
    [slug]
  )
})

export const getLatestVideos = cache(async (limit = 12): Promise<Video[]> => {
  return query<Video>(
    `SELECT * FROM ox_video WHERE active = 2 ORDER BY date DESC LIMIT $1`,
    [limit]
  )
})

// ── Gallery ────────────────────────────────────────────────────────────────

export const getGalleryByPermalink = cache(async (slug: string): Promise<Gallery | null> => {
  return queryOne<Gallery>(
    `SELECT * FROM ox_gallery WHERE permalink = $1 AND active = 2 LIMIT 1`,
    [slug]
  )
})

export const getLatestGalleries = cache(async (limit = 12): Promise<Gallery[]> => {
  return query<Gallery>(
    `SELECT * FROM ox_gallery WHERE active = 2 ORDER BY date DESC LIMIT $1`,
    [limit]
  )
})

// ── Poll ───────────────────────────────────────────────────────────────────

export const getPollByPermalink = cache(async (slug: string): Promise<Poll | null> => {
  return queryOne<Poll>(
    `SELECT * FROM ox_poll WHERE permalink = $1 AND active = 2 LIMIT 1`,
    [slug]
  )
})

export const getPollXByPermalink = cache(async (slug: string): Promise<PollX | null> => {
  return queryOne<PollX>(
    `SELECT * FROM ox_pollx WHERE permalink = $1 AND active = 2 LIMIT 1`,
    [slug]
  )
})

export const getActivePoll = cache(async (): Promise<PollX | null> => {
  return queryOne<PollX>(
    `SELECT * FROM ox_pollx WHERE active = 2 ORDER BY pllx_code DESC LIMIT 1`
  )
})

export async function votePollX(pllxCode: number, optionIndex: number) {
  const column = `count${optionIndex}`
  // Basic protection against invalid column names (optionIndex should be 1-6)
  if (optionIndex < 1 || optionIndex > 6) throw new Error('Invalid option index')
  
  return query(
    `UPDATE ox_pollx SET ${column} = ${column} + 1 WHERE pllx_code = $1`,
    [pllxCode]
  )
}

export const getPollOptions = cache(async (pollCode: number): Promise<PollOption[]> => {
  return query<PollOption>(
    `SELECT * FROM ox_poll_option WHERE poll_code = $1 ORDER BY option_code`,
    [pollCode]
  )
})

// ── Advertisement / Classified ───────────────────────────────────────────────

export const getAdvtByPermalink = cache(async (slug: string): Promise<Advertisement | null> => {
  return queryOne<Advertisement>(
    `SELECT * FROM ox_advt WHERE permalink = $1 AND active = 2 LIMIT 1`,
    [slug]
  )
})

export const getActiveAdvertisements = cache(async (): Promise<Advertisement[]> => {
  return query<Advertisement>(
    `SELECT * FROM ox_advt WHERE active = 2 ORDER BY advt_code DESC`
  )
})

export const getCompanyByPermalink = cache(async (slug: string): Promise<Company | null> => {
  return queryOne<Company>(
    `SELECT * FROM ox_classified WHERE permalink = $1 AND active = 2 LIMIT 1`,
    [slug]
  )
})

// ── Categories ─────────────────────────────────────────────────────────────

export const getAllCategories = unstable_cache(
  async (): Promise<Category[]> => {
    return query<Category>(
      `SELECT c.acgr_code as cgry_code, c.acgr_name as cgry_name,
        CASE c.acgr_code
          WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
          WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
          WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
          WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
          WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
          WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
          ELSE oc.cgry_url
        END as cgry_url 
       FROM ox_acategory c
       LEFT JOIN ox_code oc ON c.acgr_code = oc.cgry_code
       WHERE c.active = 2 ORDER BY c.acgr_code`
    )
  },
  ['all-categories'],
  { revalidate: 3600, tags: ['categories'] }
)

export const getCategoryByUrl = cache(async (url: string): Promise<Category | null> => {
  return queryOne<Category>(
    `SELECT c.acgr_code as cgry_code, c.acgr_name as cgry_name,
      CASE c.acgr_code
        WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
        WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
        WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
        WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
        WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
        WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
        ELSE oc.cgry_url
      END as cgry_url 
     FROM ox_acategory c
     JOIN ox_code oc ON c.acgr_code = oc.cgry_code
     WHERE c.active = 2 AND (
       oc.cgry_url = $1 OR
       (CASE c.acgr_code
         WHEN 6 THEN 'business' WHEN 7 THEN 'haryana' WHEN 8 THEN 'political' WHEN 9 THEN 'human-interest'
         WHEN 10 THEN 'chandigarh' WHEN 11 THEN 'global-news' WHEN 12 THEN 'health' WHEN 13 THEN 'technology'
         WHEN 14 THEN 'sports' WHEN 15 THEN 'education' WHEN 16 THEN 'opinion' WHEN 17 THEN 'himachal'
         WHEN 18 THEN 'diaspora' WHEN 19 THEN 'environment' WHEN 20 THEN 'national' WHEN 21 THEN 'punjab'
         WHEN 22 THEN 'crime-law' WHEN 24 THEN 'travel' WHEN 25 THEN 'films-tv' WHEN 26 THEN 'life-style'
         WHEN 30 THEN 'delhi-ncr' WHEN 31 THEN 'uttar-pradesh' WHEN 32 THEN 'jammu-kashmir' WHEN 33 THEN 'uttarakhand'
         ELSE ''
       END) = $1
     ) LIMIT 1`,
    [url]
  )
})

import { unstable_cache } from 'next/cache'

export const getActiveCategoryCodes = unstable_cache(
  async (): Promise<number[]> => {
    const rows = await query<{ cgry_code: number }>(
      `SELECT DISTINCT cgry_code FROM ox_article WHERE active = 2`
    )
    return rows.map(r => r.cgry_code)
  },
  ['active-category-codes'],
  { revalidate: 3600, tags: ['categories'] }
)

// ── Site settings ──────────────────────────────────────────────────────────

export const getSiteSetting = cache(async (key: string): Promise<string | null> => {
  const row = await queryOne<{ value: string }>(
    `SELECT value FROM site_settings WHERE key = $1`,
    [key]
  )
  return row?.value ?? null
})
