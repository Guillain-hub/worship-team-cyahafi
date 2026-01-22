import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ expenses })
  } catch (error) {
    console.error('GET /api/expenses error', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { eventId, amount, reason } = body || {}
    if (!eventId || !amount) return NextResponse.json({ error: 'eventId and amount required' }, { status: 400 })

    // ensure event exists
    const ev = await prisma.contributionEvent.findUnique({ where: { id: eventId } })
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const created = await prisma.expense.create({ data: { eventId, amount: Number(amount), reason: reason || null } })

    // update event.amountSpent
    await prisma.contributionEvent.update({ where: { id: eventId }, data: { amountSpent: { increment: Number(amount) } as any } })

    return NextResponse.json({ expense: created })
  } catch (error) {
    console.error('POST /api/expenses error', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
