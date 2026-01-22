import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const name = String(url.searchParams.get('name') || '')
    const type = String(url.searchParams.get('type') || '')
    // minimal summary: sum amounts and count
    const contribs = await prisma.contribution.findMany({ where: { event: { name: name || undefined, type: type || undefined } as any }, include: { event: true } })
    const current = contribs.reduce((s, c) => s + (c.amount || 0), 0)
    const expected = 0
    const remaining = expected - current
    return NextResponse.json({ expected, current, remaining })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
