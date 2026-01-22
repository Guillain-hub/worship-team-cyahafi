import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const file = path.join(process.cwd(), 'data', 'admin_notifications.json')
    let arr: any[] = []
    try {
      const raw = await fs.readFile(file, 'utf8')
      arr = JSON.parse(raw || '[]')
    } catch (e) {
      arr = []
    }
    return NextResponse.json({ notifications: arr })
  } catch (err: any) {
    console.error('READ_ADMIN_NOTIFS_ERROR', err)
    return NextResponse.json({ notifications: [] })
  }
}
