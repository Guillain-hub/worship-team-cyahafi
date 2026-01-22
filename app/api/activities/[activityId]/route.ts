import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getAuthPayload } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: Promise<{ activityId?: string }> }) {
  const { activityId } = await params
  try {
    let resolvedId = activityId
    if (!resolvedId) {
      try {
        const url = new URL(req.url)
        const parts = url.pathname.split('/').filter(Boolean)
        // last segment should be the id for /api/activities/:id
        resolvedId = parts[parts.length - 1]
      } catch (e) {
        /* ignore */
      }
    }
    console.debug('GET /api/activities/[activityId] fetching id=', resolvedId)
    const activity = await prisma.activity.findUnique({ where: { id: resolvedId } })
    if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // normalize Date to ISO string for safe JSON serialization
    const safe = { ...activity, date: activity.date ? activity.date.toISOString() : null }
    return NextResponse.json({ activity: safe })
  } catch (err: unknown) {
    console.error('GET /api/activities/[activityId] error', err)
    const e = err as any
    // Prisma specific info
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: 'Prisma error', code: e.code, meta: e.meta, message: e.message }, { status: 500 })
    }
    const msg = e?.message || String(e)
    const stack = e?.stack
    return NextResponse.json({ error: 'Server error', details: msg, stack }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ activityId?: string }> }) {
  const { activityId: paramId } = await params
  let activityId = paramId
  if (!activityId) {
    try {
      const url = new URL(req.url)
      const parts = url.pathname.split('/').filter(Boolean)
      activityId = parts[parts.length - 1]
    } catch (e) {
      /* ignore */
    }
  }
  if (!activityId) return NextResponse.json({ error: 'activityId required' }, { status: 400 })

  try {
    const body = await req.json()
    const { name, date, time, location } = body
    if (!name || !date) return NextResponse.json({ error: 'name and date required' }, { status: 400 })

    // parse local YYYY-MM-DD into a local Date to avoid UTC shifts
    const parseLocalDate = (dateStr: string) => {
      if (!dateStr || typeof dateStr !== 'string') return new Date(dateStr)
      const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      return new Date(dateStr)
    }

    // create activity (this POST is unlikely used but kept for parity)
    const created = await prisma.activity.create({ data: { name, date: parseLocalDate(date), time, location } })
    return NextResponse.json({ activity: created }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/activities/[activityId] error', e)
    return NextResponse.json({ error: 'Server error', details: e?.message || String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ activityId?: string }> }) {
  const { activityId } = await params
  if (!activityId) return NextResponse.json({ error: 'activityId required' }, { status: 400 })
  const auth = getAuthPayload(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['Admin', 'Leader'].includes(auth.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const { name, date, time, location } = body
    if (!name && !date && !time && !location) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    const parseLocalDate = (dateStr: string) => {
      if (!dateStr || typeof dateStr !== 'string') return new Date(dateStr)
      const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      return new Date(dateStr)
    }

    const data: any = {}
    if (name) data.name = name
    if (date) data.date = parseLocalDate(date)
    if (time !== undefined) data.time = time
    if (location !== undefined) data.location = location

    const updated = await prisma.activity.update({ where: { id: activityId }, data })
    const safe = { ...updated, date: updated.date ? updated.date.toISOString() : null }
    return NextResponse.json({ activity: safe })
  } catch (e: any) {
    console.error('PUT /api/activities/[activityId] error', e)
    return NextResponse.json({ error: 'Server error', details: e?.message || String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ activityId?: string }> }) {
  const { activityId: paramId } = await params
  let activityId = paramId
  if (!activityId) {
    try {
      const url = new URL(req.url)
      const parts = url.pathname.split('/').filter(Boolean)
      activityId = parts[parts.length - 1]
    } catch (e) {
      /* ignore */
    }
  }
  if (!activityId) return NextResponse.json({ error: 'activityId required' }, { status: 400 })
  const auth = getAuthPayload(req)
  console.log('DELETE auth payload:', auth)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'Admin') return NextResponse.json({ error: `Forbidden: user role is ${auth.role}, only Admin can delete`, details: auth }, { status: 403 })

  try {
    // remove attendance records first to avoid FK issues
    await prisma.attendance.deleteMany({ where: { activityId } })
    await prisma.activity.delete({ where: { id: activityId } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('DELETE /api/activities/[activityId] error', e)
    return NextResponse.json({ error: 'Server error', details: e?.message || String(e) }, { status: 500 })
  }
}
