import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const FILE_PATH = path.join(DATA_DIR, 'settings-landing.json')

async function readSettings() {
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return { settings: null }
  }
}

async function writeSettings(payload: any) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed writing settings-landing', e)
  }
}

export async function GET() {
  try {
    const data = await readSettings()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('GET /api/settings/landing error', err)
    return NextResponse.json({ settings: null })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    await writeSettings({ settings: body })
    return NextResponse.json({ settings: body })
  } catch (err: any) {
    console.error('POST /api/settings/landing error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
