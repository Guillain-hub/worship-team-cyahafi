import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'landing-content.json')

async function ensureDir() {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  } catch (e) {
    console.error('Failed to create directory:', e)
  }
}

async function readContent() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    return {
      hero: parsed.hero || { title: '', description: '' },
      about: parsed.about || { title: '', content: '' },
      events: parsed.events || [],
      upcomingEvents: parsed.upcomingEvents || [],
    }
  } catch (e) {
    return {
      hero: { title: '', description: '' },
      about: { title: '', content: '' },
      events: [],
      upcomingEvents: [],
    }
  }
}

async function writeContent(data: any) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to write content data:', e)
  }
}

export async function GET() {
  try {
    await ensureDir()
    const content = await readContent()
    return NextResponse.json(content)
  } catch (err: any) {
    console.error('GET /api/landing-content error', err)
    return NextResponse.json({
      hero: { title: '', description: '' },
      about: { title: '', content: '' },
      events: [],
    })
  }
}

export async function POST(req: Request) {
  try {
    await ensureDir()
    const body = await req.json()
    await writeContent(body)
    return NextResponse.json(body)
  } catch (err: any) {
    console.error('POST /api/landing-content error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
