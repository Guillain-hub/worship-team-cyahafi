import { NextResponse } from 'next/server'

export async function POST() {
  // Clear cookie
  const cookie = `session_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  return NextResponse.json({ ok: true }, { status: 200, headers: { 'Set-Cookie': cookie } })
}
