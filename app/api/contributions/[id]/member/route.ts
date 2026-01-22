import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function resolveParams(context: any) {
  const params = context?.params
  return typeof params?.then === 'function' ? await params : params
}

export async function PUT(req: Request, context: any) {
  try {
    const resolved = await resolveParams(context)
    const id = resolved?.id
    if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    const body = await req.json().catch(() => ({}))
    const { memberId, amount, note } = body || {}
    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })
    const ev = await prisma.contributionEvent.findUnique({ where: { id } })
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (ev.locked) return NextResponse.json({ error: 'Event already locked' }, { status: 409 })

    // upsert by memberId+eventId (no unique constraint) -> find then create/update
    const existing = await prisma.contribution.findFirst({ where: { eventId: id, memberId } })
    let result
    if (existing) {
      result = await prisma.contribution.update({ where: { id: existing.id }, data: { amount: Number(amount) || existing.amount, note: note ?? existing.note } })
    } else {
      result = await prisma.contribution.create({ data: { memberId, eventId: id, amount: Number(amount) || 0, note: note ?? null } })
    }

    return NextResponse.json({ contribution: result })
  } catch (err: any) {
    console.error('PUT /api/contributions/[id]/member error:', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const resolved = await resolveParams(context)
    const id = resolved?.id
    if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    const body = await req.json().catch(() => ({}))
    const { memberId } = body || {}
    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })
    const ev = await prisma.contributionEvent.findUnique({ where: { id } })
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (ev.locked) return NextResponse.json({ error: 'Event already locked' }, { status: 409 })

    const existing = await prisma.contribution.findFirst({ where: { eventId: id, memberId } })
    if (!existing) return NextResponse.json({ ok: true })
    await prisma.contribution.delete({ where: { id: existing.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE /api/contributions/[id]/member error:', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
