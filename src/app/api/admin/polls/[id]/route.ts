import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const poll = await queryOne('SELECT * FROM ox_pollx WHERE pllx_code = $1', [id])
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }
    return NextResponse.json(poll)
  } catch (error) {
    console.error('Failed to fetch poll:', error)
    return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = await request.json()

    await query(
      `UPDATE ox_pollx SET 
        pllx_head = $1, 
        poll1 = $2, poll2 = $3, poll3 = $4, poll4 = $5, poll5 = $6, poll6 = $7,
        permalink = $8, 
        active = $9,
        lang_code = $10
      WHERE pllx_code = $11`,
      [
        data.pllx_head,
        data.poll1 || '',
        data.poll2 || '',
        data.poll3 || '',
        data.poll4 || '',
        data.poll5 || '',
        data.poll6 || '',
        data.permalink || '',
        data.active || 2,
        data.lang_code || 1,
        id
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update poll:', error)
    return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    await query('DELETE FROM ox_pollx WHERE pllx_code = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete poll:', error)
    return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 })
  }
}
