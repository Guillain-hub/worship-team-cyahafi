import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthPayload } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    console.log('GET /api/activities - fetching activities from DB')
    const activities = await prisma.activity.findMany({ 
      orderBy: { date: 'desc' } 
    })
    console.log('GET /api/activities - found', activities.length, 'activities')
    return NextResponse.json({ activities })
  } catch (error) {
    console.error('GET /api/activities error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to fetch activities', details: errorMsg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = getAuthPayload(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['Admin', 'Leader'].includes(auth.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, date, time, location } = body
  if (!name || !date) return NextResponse.json({ error: 'name and date required' }, { status: 400 })

  // Helper: parse incoming date strings as LOCAL calendar dates when they
  // are in YYYY-MM-DD form. This avoids the toISOString/UTC shift bug.
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return new Date(dateStr)
    // YYYY-MM-DD
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) {
      const y = Number(m[1])
      const mo = Number(m[2]) - 1
      const d = Number(m[3])
      return new Date(y, mo, d)
    }
    return new Date(dateStr)
  }

  // Prevent creating duplicate activity of same name within the same week
  try {
    const provided = parseLocalDate(date)
    const weekStart = new Date(provided)
    weekStart.setDate(provided.getDate() - provided.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const existing = await prisma.activity.findFirst({
      where: {
        name,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Activity of this type already scheduled this week' }, { status: 409 })
    }
  } catch (e) {
    // if date parsing fails, fall back to create attempt
  }

  const created = await prisma.activity.create({ data: { name, date: parseLocalDate(date), time, location } })
  return NextResponse.json({ activity: created }, { status: 201 })
}
