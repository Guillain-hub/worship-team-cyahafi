import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

async function readFileSafe(name: string) {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, name), 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

export async function GET() {
  try {
    const [announcements, verses, settings] = await Promise.all([
      readFileSafe('announcements.json'),
      readFileSafe('verses.json'),
      readFileSafe('settings-landing.json')
    ])

    return NextResponse.json({
      announcements: announcements || [],
      verses: verses || [],
      settings: settings?.settings || { showVerses: true }
    })
  } catch (err: any) {
    console.error('GET /api/landing error', err)
    return NextResponse.json({ announcements: [], verses: [], settings: { showVerses: true } })
  }
}
