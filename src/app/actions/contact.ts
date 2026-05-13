'use server'

import { query } from '@/lib/db'

export async function submitContactForm(formData: { name: string; email: string; message: string; phone?: string }) {
  try {
    if (!formData.name || !formData.email || !formData.message) {
      return { success: false, error: 'Name, email, and message are required.' }
    }

    await query(
      `INSERT INTO ox_feedback (feed_name, feed_email, feed_desc, feed_phone, date, active) 
       VALUES ($1, $2, $3, $4, NOW(), 2)`,
      [formData.name, formData.email, formData.message, formData.phone || '']
    )

    return { success: true }
  } catch (error) {
    console.error('Contact form submission error:', error)
    return { success: false, error: 'Failed to submit the form. Please try again later.' }
  }
}
