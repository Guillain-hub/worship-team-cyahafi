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

export async function DELETE(_req: Request, context: any) {
  try {
    // In Next.js app router dynamic handlers, `context.params` may be a Promise
    const params = await context.params
    const id = params?.id
    const items = await readAnnouncements()
    console.log('DELETE /api/announcements/:id called with id=', id, 'existing ids=', items.map((i: any) => i.id))

    const next = items.filter((i: any) => {
      // robust matching: match by string or numeric equality
      if (String(i.id) === String(id)) return false
      const nA = Number(i.id)
      const nB = Number(id)
      if (Number.isFinite(nA) && Number.isFinite(nB) && nA === nB) return false
      return true
    })

    if (next.length === items.length) {
      console.warn('DELETE: announcement not found for id=', id)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await writeAnnouncements(next)
    return NextResponse.json({ ok: true, deletedId: id })
  } catch (err: any) {
    console.error('DELETE /api/announcements/:id error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

export async function PATCH(_req: Request, context: any) {
  try {
    const params = await context.params
    const id = params?.id
    const body = await _req.json()
    const { content, author } = body || {}
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

    const items = await readAnnouncements()
    let found = false
    const next = items.map((i: any) => {
      const match = String(i.id) === String(id) || (Number.isFinite(Number(i.id)) && Number.isFinite(Number(id)) && Number(i.id) === Number(id))
      if (match) {
        found = true
        return { ...i, content, author: author || i.author, time: new Date().toISOString() }
      }
      return i
    })

    if (!found) {
      console.warn('PATCH: announcement not found for id=', id)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await writeAnnouncements(next)
    const updated = next.find((i: any) => String(i.id) === String(id) || (Number.isFinite(Number(i.id)) && Number.isFinite(Number(id)) && Number(i.id) === Number(id)))
    return NextResponse.json({ announcement: updated })
  } catch (err: any) {
    console.error('PATCH /api/announcements/:id error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
