import { NextResponse } from 'next/server'

// Legacy single-attendance handler removed. Use the activity-scoped
// PUT /api/activities/{activityId}/attendance for updates instead.
export async function PATCH(req: Request) {
  return NextResponse.json(
    { error: 'Deprecated. Use /api/activities/{activityId}/attendance (PUT).' },
    { status: 410 }
  )
}
