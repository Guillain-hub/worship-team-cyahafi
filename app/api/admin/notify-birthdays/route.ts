import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getAuthPayload } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const payload = getAuthPayload(req)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = typeof payload.role === 'object' ? payload.role?.name : payload.role
    if (role !== 'Admin' && role !== 'Leader') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // accept optional lead days parameter (e.g., ?days=2) to pre-notify
    const url = new URL(req.url)
    const daysParam = Number(url.searchParams.get('days') || 0)
    const leadDays = Number.isFinite(daysParam) ? Math.max(0, Math.floor(daysParam)) : 0

    // find members with birthDate matching target month/day
    const all = await prisma.member.findMany({ where: { birthDate: { not: null }, isActive: true } })
    const today = new Date()
    const target = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
    target.setUTCDate(target.getUTCDate() + leadDays)
    const tMonth = target.getUTCMonth() + 1
    const tDay = target.getUTCDate()

    const matches = all.filter(m => {
      if (!m.birthDate) return false
      const d = new Date(m.birthDate)
      return (d.getUTCMonth() + 1) === tMonth && d.getUTCDate() === tDay
    })

    if (matches.length === 0) return NextResponse.json({ ok: true, created: 0 })

    // Ensure data dir
    const dataDir = path.join(process.cwd(), 'data')
    try { await fs.mkdir(dataDir, { recursive: true }) } catch (e) {}
    const file = path.join(dataDir, 'admin_notifications.json')

    // read existing
    let arr: any[] = []
    try {
      const raw = await fs.readFile(file, 'utf8')
      arr = JSON.parse(raw || '[]')
    } catch (e) { arr = [] }

    const now = new Date().toISOString()
    for (const m of matches) {
      const entry = {
        type: 'birthday',
        memberId: m.id,
        fullName: m.fullName,
        birthDate: m.birthDate ? new Date(m.birthDate).toISOString() : null,
        leadDays,
        timestamp: now,
      }
      arr.push(entry)
    }

    // write
    await fs.writeFile(file, JSON.stringify(arr, null, 2))
    return NextResponse.json({ ok: true, created: matches.length })
  } catch (err) {
    console.error('BIRTHDAY_NOTIFY_ERROR', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
