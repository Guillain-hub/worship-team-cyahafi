import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
    const maskedDb = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:(.*)@/, ':*****@') : null

    return NextResponse.json({
      ok: true,
      env: {
        DATABASE_URL: hasDatabaseUrl,
        DATABASE_URL_masked: maskedDb,
        NODE_ENV: process.env.NODE_ENV ?? null,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}
