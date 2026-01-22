import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: Fetch a member's contribution history for ALL contribution events
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify member exists
    const member = await prisma.member.findUnique({
      where: { id }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Fetch ALL contribution events
    const allEvents = await prisma.contributionEvent.findMany({
      orderBy: { date: 'desc' }
    })

    // Fetch this member's contributions
    const memberContributions = await prisma.contribution.findMany({
      where: { memberId: id },
      include: {
        event: true
      }
    })

    // Map ALL events with member's contribution amount, excluding _internal_usage
    const mappedContributions = allEvents
      .filter((event) => event.name !== '_internal_usage')
      .map((event) => {
        const memberContribution = memberContributions.find((c) => c.eventId === event.id)
        return {
          id: event.id,
          name: event.name,
          type: event.type,
          date: event.date,
          amount: memberContribution ? Number(memberContribution.amount) || 0 : 0
        }
      })

    return NextResponse.json({ contributions: mappedContributions })
  } catch (error) {
    console.error('GET_MEMBER_CONTRIBUTIONS_ERROR', error)
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 })
  }
}
