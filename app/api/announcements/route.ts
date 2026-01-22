import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const FILE_PATH = path.join(DATA_DIR, 'announcements.json')

async function readAnnouncements() {
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

async function writeAnnouncements(items: any[]) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(FILE_PATH, JSON.stringify(items, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed writing announcements', e)
  }
}

export async function GET() {
  try {
    const items = await readAnnouncements()
    return NextResponse.json({ announcements: items })
  } catch (err: any) {
    console.error('GET /api/announcements error', err)
    return NextResponse.json({ announcements: [] })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { author, content, imageUrl, imageData } = body || {}
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

    let savedImageUrl = imageUrl || null
    // If imageData (data URL) is provided, save it to public/uploads
    if (!savedImageUrl && imageData && typeof imageData === 'string') {
      try {
        const matches = imageData.match(/^data:(image\/(png|jpeg|jpg|gif));base64,(.+)$/)
        let ext = 'png'
        let base64 = imageData
        if (matches) {
          ext = matches[2] === 'jpeg' ? 'jpg' : matches[2]
          base64 = matches[3]
        } else if (imageData.startsWith('data:')) {
          // fallback: attempt to split
          const parts = imageData.split(',')
          base64 = parts[1]
        }
        const buffer = Buffer.from(base64, 'base64')
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        await fs.mkdir(uploadsDir, { recursive: true })
        const filename = `${Date.now()}_announcement.${ext}`
        const outPath = path.join(uploadsDir, filename)
        await fs.writeFile(outPath, buffer)
        savedImageUrl = `/uploads/${filename}`
      } catch (e) {
        console.error('Failed saving announcement image', e)
      }
    }

    const items = await readAnnouncements()
    const item = { id: Date.now(), author: author || 'System', content, image: savedImageUrl, time: new Date().toISOString() }
    const next = [item, ...items].slice(0, 200)
    await writeAnnouncements(next)
    return NextResponse.json({ announcement: item })
  } catch (err: any) {
    console.error('POST /api/announcements error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
