import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, context: any) {
  try {
    const params = await context.params
    const id = params?.id

    if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })

    // Fetch event and include contributions to calculate actual total
    const ev = await prisma.contributionEvent.findUnique({ 
      where: { id }, 
      include: { 
        contributions: { 
          include: { member: true } 
        } 
      } 
    })

    if (!ev) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Calculate actual total by summing all contribution amounts
    const actualTotal = ev.contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
    const totalContributors = ev.contributions.length

    return NextResponse.json({ 
      event: {
        ...ev,
        actualTotal,
        totalContributors
      } 
    })
  } catch (err: any) {
    console.error('GET /api/contributions/[id] error:', err)
    return NextResponse.json({ error: 'Failed to fetch event details' }, { status: 500 })
  }
}

export async function POST(req: Request, context: any) {
  try {
    const params = await context.params
    const id = params?.id

    if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const { contributions } = body

    if (!Array.isArray(contributions) || contributions.length === 0) {
      return NextResponse.json({ error: 'No contributions provided' }, { status: 400 })
    }

    const ev = await prisma.contributionEvent.findUnique({ where: { id } })
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (ev.locked) return NextResponse.json({ error: 'Event is locked' }, { status: 409 })

    // Use a transaction to create contributions and lock the event simultaneously
    const result = await prisma.$transaction(async (tx) => {
      const createdContribs = await Promise.all(
        contributions.map((c: any) => 
          tx.contribution.create({ 
            data: { 
              memberId: c.memberId, 
              amount: Number(c.amount), 
              note: c.note || null, 
              eventId: id 
            } 
          })
        )
      )

      // Calculate the new actual total
      const newActualTotal = createdContribs.reduce((sum, c) => sum + Number(c.amount), 0)

      // Update the main event with the new total and lock it
      await tx.contributionEvent.update({ 
        where: { id }, 
        data: { 
          locked: true,
          actualTotal: newActualTotal 
        } 
      })

      return createdContribs
    })

    return NextResponse.json({ contributions: result })
  } catch (err: any) {
    console.error('POST /api/contributions/[id] error:', err)
    return NextResponse.json({ error: 'Failed to save contributions' }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: any) {
  try {
    const params = await context.params
    const id = params?.id

    if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const { name, date, type, expectedTotal } = body

    const ev = await prisma.contributionEvent.findUnique({ where: { id } })
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    
    // Allow editing even if locked, but only for certain fields like 'expectedTotal' or 'name'
    // If you want a strict lock, keep the line below:
    // if (ev.locked) return NextResponse.json({ error: 'Cannot edit locked event' }, { status: 409 })

    const data: any = {}
    if (name) data.name = name
    if (date) data.date = new Date(date)
    if (type) data.type = type
    if (expectedTotal !== undefined) data.expectedTotal = Number(expectedTotal)

    const updated = await prisma.contributionEvent.update({ 
      where: { id }, 
      data 
    })

    return NextResponse.json({ event: updated })
  } catch (err: any) {
    console.error('PATCH /api/contributions/[id] error:', err)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const params = await context.params
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })

    // delete related contributions and expenses then the event
    await prisma.$transaction([
      prisma.contribution.deleteMany({ where: { eventId: id } }),
      prisma.expense.deleteMany({ where: { eventId: id } }),
      prisma.contributionEvent.delete({ where: { id } })
    ])

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE /api/contributions/[id] error:', err)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}