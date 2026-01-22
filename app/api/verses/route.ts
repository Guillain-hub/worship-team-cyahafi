import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const FILE_PATH = path.join(DATA_DIR, 'verses.json')

async function readVerses() {
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

async function writeVerses(items: any[]) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(FILE_PATH, JSON.stringify(items, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed writing verses', e)
  }
}

export async function GET() {
  try {
    const items = await readVerses()
    return NextResponse.json({ verses: items })
  } catch (err: any) {
    console.error('GET /api/verses error', err)
    return NextResponse.json({ verses: [] })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { text, reference, imageUrl } = body || {}
    if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 })

    const items = await readVerses()
    const item = { id: Date.now().toString(), text, reference: reference || '', imageUrl: imageUrl || '' }
    const next = [item, ...items].slice(0, 200)
    await writeVerses(next)
    return NextResponse.json({ verse: item })
  } catch (err: any) {
    console.error('POST /api/verses error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
