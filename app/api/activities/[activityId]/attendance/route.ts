import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/* -------------------------------------------
   GET: Load attendance for an activity
--------------------------------------------*/
export async function GET(
  req: Request,
  context: { params: Promise<{ activityId: string }> }
) {
  try {
    const { activityId } = await context.params

    console.debug('GET attendance for activityId=', activityId)

    const attendance = await prisma.attendance.findMany({
      where: { activityId },
      orderBy: { takenAt: "asc" },
    })

    console.debug('GET attendance result count=', attendance.length)
    if (attendance.length > 0) console.debug('sample attendance[0]=', attendance[0])

    return NextResponse.json({
      attendance,
      saved: attendance.length > 0,
    })
  } catch (error) {
    console.error("GET attendance error:", error)
    return NextResponse.json(
      { error: "Failed to load attendance" },
      { status: 500 }
    )
  }
}

/* -------------------------------------------
   POST: Save attendance (FIRST TIME ONLY)
--------------------------------------------*/
export async function POST(
  req: Request,
  context: { params: Promise<{ activityId: string }> }
) {
  try {
    const { activityId } = await context.params
    const body = await req.json()
    const { attendees } = body

    if (!Array.isArray(attendees) || attendees.length === 0) {
      return NextResponse.json(
        { error: "No attendance to save" },
        { status: 400 }
      )
    }

    // Prevent duplicate save
    const existing = await prisma.attendance.findFirst({
      where: { activityId },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Attendance already saved" },
        { status: 409 }
      )
    }

    // Server-side lock: do not allow saving if activity day has passed (locked at midnight after date)
    const activity = await prisma.activity.findUnique({ where: { id: activityId } })
    if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    const now = new Date()
    let eventDate: Date | null = activity.date ? new Date(activity.date) : null
    // compute lock boundary = midnight at the start of the day AFTER activity.date
    if (eventDate) {
      const lockAt = new Date(eventDate)
      lockAt.setHours(0, 0, 0, 0)
      lockAt.setDate(lockAt.getDate() + 1)

      // If current time is on/after the lock time, block
      if (now >= lockAt) {
        return NextResponse.json({ error: "Attendance locked (activity date passed)" }, { status: 403 })
      }

      // If activity has a specific time and we're still before that time, block (pre-event)
      if (activity.time) {
        const eventAt = new Date(eventDate)
        const parts = String(activity.time).split(':')
        if (parts.length >= 2) {
          const hh = Number(parts[0]) || 0
          const mm = Number(parts[1]) || 0
          eventAt.setHours(hh, mm, 0, 0)
          if (now < eventAt) {
            return NextResponse.json({ error: `Attendance locked until ${eventAt.toISOString()}` }, { status: 403 })
          }
        }
      }
    }

    const created = await prisma.attendance.createMany({
      data: attendees.map((a: any) => ({
        activityId,
        memberId: a.memberId,
        status: a.status, // "PRESENT" | "ABSENT"
      })),
    })

    return NextResponse.json({
      message: "Attendance saved successfully",
      count: created.count,
      saved: true,
    })
  } catch (error) {
    console.error("POST attendance error:", error)
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    )
  }
}

/* -------------------------------------------
   PUT: Update attendance (EDIT MODE)
--------------------------------------------*/
export async function PUT(
  req: Request,
  context: { params: Promise<{ activityId: string }> }
) {
  try {
    const { activityId } = await context.params
    const body = await req.json()
    const { attendees } = body

    if (!Array.isArray(attendees)) {
      return NextResponse.json(
        { error: "Invalid attendance data" },
        { status: 400 }
      )
    }

    // Server-side lock: do not allow updates if activity day has passed (locked at midnight after date)
    const activity = await prisma.activity.findUnique({ where: { id: activityId } })
    if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    const now = new Date()
    let eventDate: Date | null = activity.date ? new Date(activity.date) : null
    if (eventDate) {
      const lockAt = new Date(eventDate)
      lockAt.setHours(0, 0, 0, 0)
      lockAt.setDate(lockAt.getDate() + 1)
      if (now >= lockAt) {
        return NextResponse.json({ error: "Attendance locked (activity date passed)" }, { status: 403 })
      }

      if (activity.time) {
        const eventAt = new Date(eventDate)
        const parts = String(activity.time).split(':')
        if (parts.length >= 2) {
          const hh = Number(parts[0]) || 0
          const mm = Number(parts[1]) || 0
          eventAt.setHours(hh, mm, 0, 0)
          if (now < eventAt) {
            return NextResponse.json({ error: `Attendance locked until ${eventAt.toISOString()}` }, { status: 403 })
          }
        }
      }
    }

    // Update each member attendance
    await Promise.all(
      attendees.map((a: any) =>
        prisma.attendance.updateMany({
          where: {
            activityId,
            memberId: a.memberId,
          },
          data: {
            status: a.status,
          },
        })
      )
    )

    return NextResponse.json({
      message: "Attendance updated successfully",
      updated: true,
    })
  } catch (error) {
    console.error("PUT attendance error:", error)
    return NextResponse.json(
      { error: "Failed to update attendance" },
      { status: 500 }
    )
  }
}
