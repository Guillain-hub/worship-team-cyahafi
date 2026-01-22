import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'gallery')
const DATA_FILE = path.join(process.cwd(), 'data', 'gallery.json')

async function ensureDirs() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  } catch (e) {
    console.error('Failed to create directories:', e)
  }
}

async function readGallery() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (e) {
    return { items: [] }
  }
}

async function writeGallery(data: any) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to write gallery data:', e)
  }
}

export async function GET() {
  try {
    await ensureDirs()
    const gallery = await readGallery()
    return NextResponse.json(gallery)
  } catch (err: any) {
    console.error('GET /api/gallery error', err)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: Request) {
  try {
    await ensureDirs()
    
    // Check if request is JSON or FormData
    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      // Handle video URL submission
      const body = await req.json()
      const { type, url, caption, id } = body

      if (type !== 'video' || !url) {
        return NextResponse.json({ error: 'Invalid video data' }, { status: 400 })
      }

      const gallery = await readGallery()
      const newItem = {
        id: id || Date.now(),
        type: 'video',
        url,
        caption: caption || 'Video',
        duration: '',
      }

      gallery.items.push(newItem)
      await writeGallery(gallery)

      return NextResponse.json(newItem, { status: 201 })
    } else {
      // Handle file upload (image)
      const formData = await req.formData()
      const file = formData.get('file') as File
      const caption = formData.get('caption') as string
      const type = formData.get('type') as string

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`
      const filepath = path.join(UPLOAD_DIR, filename)

      // Save file
      const bytes = await file.arrayBuffer()
      await fs.writeFile(filepath, Buffer.from(bytes))

      // Update gallery data
      const gallery = await readGallery()
      const newItem = {
        id: timestamp,
        type: type || 'image',
        url: `/uploads/gallery/${filename}`,
        caption: caption || 'Untitled',
      }

      gallery.items.push(newItem)
      await writeGallery(gallery)

      return NextResponse.json(newItem, { status: 201 })
    }
  } catch (err: any) {
    console.error('POST /api/gallery error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureDirs()
    const { itemId } = await req.json()

    if (!itemId) {
      return NextResponse.json({ error: 'No itemId provided' }, { status: 400 })
    }

    // Read gallery
    const gallery = await readGallery()
    const item = gallery.items.find((i: any) => i.id === itemId)

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Delete file
    const filename = item.url.split('/').pop()
    const filepath = path.join(UPLOAD_DIR, filename)
    try {
      await fs.unlink(filepath)
    } catch (e) {
      console.error('Failed to delete file:', e)
    }

    // Update gallery data
    gallery.items = gallery.items.filter((i: any) => i.id !== itemId)
    await writeGallery(gallery)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/gallery error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
