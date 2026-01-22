import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function resolveParams(context: any) {
  const params = context?.params
  return typeof params?.then === 'function' ? await params : params
}

export async function PATCH(_req: Request, context: any) {
  try {
    const resolved = await resolveParams(context)
    const id = resolved?.id
    if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    const ev = await prisma.contributionEvent.findUnique({ where: { id } })
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (ev.locked) return NextResponse.json({ event: ev })
    const updated = await prisma.contributionEvent.update({ where: { id }, data: { locked: true } })
    return NextResponse.json({ event: updated })
  } catch (err: any) {
    console.error('PATCH /api/contributions/[id]/lock error:', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
