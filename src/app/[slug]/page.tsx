import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { getArticleByPermalink, getCategoryByUrl } from '@/lib/queries'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  
  // 1. Check for Article
  const article = await getArticleByPermalink(slug)
  if (article) {
    return {
      title: article.meta_title ?? article.article_head ?? '',
      alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/news/${article.permalink}` },
      robots: { index: false, follow: true },
    }
  }

  // 2. Check for Category
  const category = await getCategoryByUrl(slug)
  if (category) {
    return {
      title: `${category.cgry_name} | Punjab Newsline`,
      description: `Latest ${category.cgry_name} news and updates from Punjab Newsline.`,
    }
  }

  return { title: 'Not Found' }
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params
  
  // 1. Check for Article
  const article = await getArticleByPermalink(slug)
  if (article) {
    // 301 to canonical /news/{slug} URL
    redirect(`/news/${article.permalink}`)
  }

  // 2. Check for Category
  const category = await getCategoryByUrl(slug)
  if (category) {
    // Redirect to the category page or handle directly
    // Let's assume we want categories to live at /category/[url]
    redirect(`/category/${category.cgry_url}`)
  }

  notFound()
}
