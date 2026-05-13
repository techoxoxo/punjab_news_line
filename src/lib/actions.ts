'use server'

import { incrementArticleHits } from './queries'

export async function trackArticleView(articleCode: number) {
  try {
    await incrementArticleHits(articleCode)
  } catch (error) {
    console.error('Failed to track article view:', error)
  }
}
