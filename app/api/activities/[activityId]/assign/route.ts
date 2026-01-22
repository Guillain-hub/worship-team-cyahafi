import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthPayload } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: Promise<{ activityId?: string }> }) {
  const { activityId } = await params
  if (!activityId) return NextResponse.json({ error: 'activityId required' }, { status: 400 })

  const auth = getAuthPayload(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'Admin') return NextResponse.json({ error: 'Forbidden: only Admin can assign leaders' }, { status: 403 })

  try {
    const body = await req.json()
    const { attendanceBy } = body

    if (attendanceBy === undefined) {
      return NextResponse.json({ error: 'attendanceBy field required' }, { status: 400 })
    }

    // Update only the attendanceBy field
    const updated = await prisma.activity.update({
      where: { id: activityId },
      data: {
        attendanceBy: attendanceBy || null
      }
    })

    const safe = { ...updated, date: updated.date ? updated.date.toISOString() : null }
    return NextResponse.json({ success: true, activity: safe })
  } catch (e: any) {
    console.error('PUT /api/activities/[activityId]/assign error', e)
    return NextResponse.json({ error: 'Server error', details: e?.message || String(e) }, { status: 500 })
  }
}
