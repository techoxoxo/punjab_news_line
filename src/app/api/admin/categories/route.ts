import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // In legacy PNL, News Categories come from ox_acategory (acgr_code, acgr_name).
    // The previous implementation mistakenly used ox_code which contains generic codes.
    
    const [categories, teams] = await Promise.all([
      query('SELECT acgr_code as code, acgr_name as name FROM ox_acategory WHERE active = 2 ORDER BY acgr_code'),
      query('SELECT team_code as code, team_name as name FROM ox_team WHERE active IN (2, 4) ORDER BY team_name')
    ])
    
    return NextResponse.json({
      // Actual News Categories (Punjab, Haryana, etc.)
      categories: categories || [],
      // Modes from legacy marticle.xml
      modes: [
        { code: 27, name: 'News' },
        { code: 28, name: 'Photo' },
        { code: 29, name: 'Video' }
      ],
      // Segments from legacy sarticle.xml
      segments: [
        { code: 17, name: 'General' },
        { code: 15, name: 'Top Most' },
        { code: 16, name: 'Top' }
      ],
      // Languages
      languages: [
        { code: 1, name: 'English' },
        { code: 2, name: 'Punjabi' },
        { code: 3, name: 'Hindi' }
      ],
      // Writers (Teams)
      teams: teams || [],
      // Special Groups from legacy garticle.xml
      groups: [
        { code: 62, name: "Editor's Choice" },
        { code: 59, name: 'Popular' },
        { code: 58, name: 'Breaking' }
      ]
    })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({ error: 'Failed to fetch editor data' }, { status: 500 })
  }
}
