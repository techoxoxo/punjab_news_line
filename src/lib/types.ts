export interface Article {
  article_code: number
  date: Date | null
  cgry_code: number | null
  sgmt_code: number | null
  article_head: string | null
  article_desc: string | null
  article_body: string | null
  article_sub: string | null
  meta_title: string | null
  meta_desc: string | null
  meta_keys: string | null
  permalink: string
  tag1: string | null
  tag2: string | null
  tag3: string | null
  reporter: string | null
  reflink: string | null
  lang_code: number | null
  team_code: number | null
  subc_code: number | null
  user_code: number | null
  photo_caption: string | null
  subhead: string | null
  cgry_list: string | null
  group_list: string | null
  progress: boolean | null
  hits: number
  active: number
  days: number | null
  ex_date: Date | null
  cap_all: string | null
  article_sub2: string | null
  article_sub3: string | null
  vlink: string | null
  mode_code: number | null
  // SEO extension fields (migration 002)
  og_title: string | null
  og_image: string | null
  no_index: boolean
  focus_keyword: string | null
  schema_type: string
  canonical_url: string | null
  author_id: number | null
  updated_at: Date | null
  // UI helper fields (joined from ox_code)

  category_name?: string
  category_url?: string
}

export interface Video {
  video_code: number
  date: Date | null
  cgry_code: number | null
  video_head: string | null
  video_desc: string | null
  permalink: string
  vlink: string | null
  active: number
  hits: number
  meta_title: string | null
  meta_desc: string | null
  meta_keys: string | null
  lang_code: number | null
  no_index: boolean
}

export interface Gallery {
  gallery_code: number
  date: Date | null
  cgry_code: number | null
  gallery_head: string | null
  gallery_desc: string | null
  permalink: string
  active: number
  hits: number
  meta_title: string | null
  meta_desc: string | null
  meta_keys: string | null
  lang_code: number | null
  no_index: boolean
}

export interface Poll {
  poll_code: number
  date: Date | null
  poll_question: string | null
  permalink: string
  active: number
  lang_code: number | null
}

export interface PollX {
  pllx_code: number
  date: Date | null
  pllx_head: string | null
  poll1: string | null
  poll2: string | null
  poll3: string | null
  poll4: string | null
  poll5: string | null
  poll6: string | null
  count1: number
  count2: number
  count3: number
  count4: number
  count5: number
  count6: number
  active: number
  lang_code: number | null
  permalink: string
}

export interface PollOption {
  option_code: number
  poll_code: number
  option_text: string | null
  votes: number
}

export interface Advertisement {
  advt_code: number
  advt_head: string | null
  permalink: string
  advt_body: string | null
  advt_image?: string | null
  active: number
}

export interface Company {
  classified_code: number
  company_name: string | null
  permalink: string
  classified_desc: string | null
  active: number
}

export interface Category {
  cgry_code: number
  cgry_name: string | null
  cgry_url: string | null
  cgry_order: number | null
  parent_code: number
  active: boolean
  seo_title: string | null
  seo_desc: string | null
  seo_image: string | null
  seo_h1: string | null
  seo_intro: string | null
}

export interface Author {
  id: number
  name: string
  slug: string
  bio: string | null
  photo: string | null
  email: string | null
  twitter: string | null
  facebook: string | null
  linkedin: string | null
  beats: string | null
  active: boolean
}

export interface SeoRedirect {
  id: number
  source: string
  destination: string
  type: 301 | 302
  active: boolean
  hits: number
  created_at: Date
  notes: string | null
}

export interface Error404 {
  id: number
  path: string
  referrer: string | null
  user_agent: string | null
  hits: number
  first_seen: Date
  last_seen: Date
  resolved: boolean
  redirect_to: string | null
}

// Language code → BCP 47 locale
export const LANG_CODE_MAP: Record<number, string> = {
  1: 'en-IN',
  2: 'hi-IN',
  6: 'pa-IN',
}

export const LANG_CODE_LOCALE: Record<number, string> = {
  1: 'en_IN',
  2: 'hi_IN',
  6: 'pa_IN',
}

export interface User {
  user_code: number
  username: string
  name: string | null
  email: string | null
  role: 'admin' | 'editor' | 'reporter'
  active: boolean
}
