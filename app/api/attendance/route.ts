import { NextResponse } from 'next/server'

// Legacy global attendance route: replaced by activity-scoped route.
export async function POST(req: Request) {
  return NextResponse.json(
    { error: 'Deprecated. Use /api/activities/{activityId}/attendance (POST/PUT/GET).' },
    { status: 410 }
  )
}
