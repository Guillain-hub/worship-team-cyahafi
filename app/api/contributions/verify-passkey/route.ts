import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const pass = String(body?.passkey || '')
    const secret = process.env.CONTRIBUTION_PASSKEY || process.env.NEXT_PUBLIC_CONTRIBUTION_PASSKEY || 'letmein'
    if (!pass || pass !== secret) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('POST /api/contributions/verify-passkey error', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}
