import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const type = String(url.searchParams.get('type') || '')
    if (!type) return NextResponse.json({}, { status: 200 })

    const contributions = await prisma.contribution.findMany({
      where: { event: { type } as any },
      orderBy: { createdAt: 'desc' },
    })

    const map: Record<string, number> = {}
    for (const c of contributions) {
      const key = String(c.memberId)
      if (!map[key]) map[key] = c.amount
    }
    return NextResponse.json(map)
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
