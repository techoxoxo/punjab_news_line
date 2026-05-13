import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'E-Paper',
  description: 'Read the digital edition of Punjab Newsline.',
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/epaper` },
}

export default function EpaperPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">E-Paper</h1>
      <p className="text-gray-600">Digital edition coming soon.</p>
    </main>
  )
}
