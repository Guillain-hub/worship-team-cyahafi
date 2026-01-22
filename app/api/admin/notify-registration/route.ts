import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { phone, fullName, note } = body || {}
    if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 })

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data')
    try { await fs.mkdir(dataDir, { recursive: true }) } catch (e) { /* ignore */ }

    const file = path.join(dataDir, 'admin_notifications.json')
    const now = new Date().toISOString()
    const entry = { type: 'registration_request', phone, fullName: fullName || null, note: note || null, createdAt: now }

    // Read existing file then append
    let arr: any[] = []
    try {
      const raw = await fs.readFile(file, 'utf8')
      arr = JSON.parse(raw || '[]')
    } catch (e) {
      arr = []
    }

    arr.push(entry)
    await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf8')

    // Also log to server console so admins can see in logs
    console.info('Admin notification saved:', entry)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Failed to save admin notification', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
