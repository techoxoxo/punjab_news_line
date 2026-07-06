import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET — return all regions
export async function GET() {
  try {
    const rows = await query(
      `SELECT id, name, slug, country, lat_min, lat_max, lon_min, lon_max,
              is_active, sort_order, parent_id, region_type
       FROM geofence_regions
       ORDER BY COALESCE(parent_id, id), sort_order, name`
    )
    return NextResponse.json(rows)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH — toggle one or many regions { updates: [{id, is_active}] }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const updates: { id: number; is_active: boolean }[] = body.updates ?? []

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    for (const u of updates) {
      await query(
        `UPDATE geofence_regions SET is_active = $1 WHERE id = $2`,
        [u.is_active, u.id]
      )
    }

    return NextResponse.json({ success: true, updated: updates.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
