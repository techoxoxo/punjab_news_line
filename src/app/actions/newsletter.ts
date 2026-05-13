'use server'

import { query } from '@/lib/db'

export async function subscribeNewsletter(email: string) {
  try {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'A valid email address is required.' }
    }

    // Check if already subscribed
    const existing = await query(
      'SELECT id FROM newsletter_subscriptions WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existing.length > 0) {
      return { success: true, message: 'You are already subscribed!' }
    }

    await query(
      'INSERT INTO newsletter_subscriptions (email) VALUES ($1)',
      [email.toLowerCase()]
    )

    return { success: true, message: 'Successfully subscribed to our newsletter!' }
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return { success: false, error: 'Failed to subscribe. Please try again later.' }
  }
}
