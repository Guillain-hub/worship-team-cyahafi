import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const events = await prisma.contributionEvent.findMany({
      orderBy: { date: 'desc' },
      include: { 
        contributions: true 
      },
    })

    const rows = events.map((e) => {
      // Calculate how many UNIQUE members have paid
      const uniquePayers = new Set(e.contributions.map((c) => c.memberId)).size;
      
      // Calculate the sum of money collected
      const totalCollected = e.contributions.reduce((s, c) => s + (Number(c.amount) || 0), 0);

      return {
        id: e.id,
        name: e.name,
        date: e.date,
        type: e.type,
        locked: e.locked,
        expectedTotal: 0, 
        actualTotal: totalCollected,
        totalContributors: uniquePayers,
      }
    })

    return NextResponse.json({ events: rows })
  } catch (err: any) {
    console.error('GET /api/contributions error:', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, date, type } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const parsedDate = date ? new Date(date) : new Date()

    // 🔹 FIXED: Removed expectedTotal and actualTotal
    const ev = await prisma.contributionEvent.create({
      data: {
        name,
        date: parsedDate,
        type: type || 'MONTHLY',
        locked: false,
        // contributions is a relation, so we don't include it here
      }
    })

    return NextResponse.json({ event: ev })
  } catch (error: any) {
    console.error('POST /api/contributions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}