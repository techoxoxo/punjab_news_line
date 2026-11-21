import { revalidatePath } from 'next/cache'

/**
 * Refresh every page that renders ad campaigns (or lists them in admin).
 * Dynamic pages (home, category, top-news, search) are re-rendered per request anyway,
 * but ISR pages (news/[slug], video-gallery, photo-gallery) and the admin list need this.
 */
export function revalidateAdPages(permalink?: string | null) {
  revalidatePath('/')
  revalidatePath('/news/[slug]', 'page')
  revalidatePath('/category/[slug]', 'page')
  revalidatePath('/top-news')
  revalidatePath('/search')
  revalidatePath('/video-gallery')
  revalidatePath('/photo-gallery')
  revalidatePath('/advertisement')
  revalidatePath('/admin/advertise')
  if (permalink) revalidatePath(`/advertisement/${permalink}`)
}
