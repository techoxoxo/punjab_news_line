'use server'

import { votePollX } from '@/lib/queries'
import { revalidatePath } from 'next/cache'

export async function votePollXAction(pllxCode: number, optionIndex: number) {
  try {
    await votePollX(pllxCode, optionIndex)
    revalidatePath('/')
    revalidatePath('/poll')
    return { success: true }
  } catch (error) {
    console.error('Voting error:', error)
    return { success: false, error: 'Failed to record vote' }
  }
}
