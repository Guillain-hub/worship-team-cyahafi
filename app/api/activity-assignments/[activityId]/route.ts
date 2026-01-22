import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'activity_assignments.json')

async function readData() {
  try {
    await fs.promises.mkdir(path.dirname(DATA_FILE), { recursive: true })
    const exists = fs.existsSync(DATA_FILE)
    if (!exists) {
      await fs.promises.writeFile(DATA_FILE, JSON.stringify({}), 'utf8')
      return {}
    }
    const raw = await fs.promises.readFile(DATA_FILE, 'utf8')
    return JSON.parse(raw || '{}')
  } catch (e) {
    console.error('readData error', e)
    throw e
  }
}

async function writeData(obj: any) {
  try {
    await fs.promises.mkdir(path.dirname(DATA_FILE), { recursive: true })
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8')
    return true
  } catch (e) {
    console.error('writeData error', e)
    throw e
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ activityId?: string }> }) {
  const { activityId } = await params
  if (!activityId) return NextResponse.json({ error: 'activityId required' }, { status: 400 })
  try {
    const map = await readData()
    const assigned = map[activityId] || null
    return NextResponse.json({ assignedLeaderId: assigned })
  } catch (e: any) {
    console.error('GET /api/activity-assignments error', e)
    return NextResponse.json({ error: 'Server error', details: e?.message || String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ activityId?: string }> }) {
  const { activityId } = await params
  if (!activityId) return NextResponse.json({ error: 'activityId required' }, { status: 400 })
  try {
    const body = await req.json()
    const { assignedLeaderId } = body
    if (assignedLeaderId !== null && typeof assignedLeaderId !== 'string') {
      return NextResponse.json({ error: 'assignedLeaderId must be string or null' }, { status: 400 })
    }
    const map = await readData()
    if (assignedLeaderId) map[activityId] = assignedLeaderId
    else delete map[activityId]
    await writeData(map)
    return NextResponse.json({ assignedLeaderId: assignedLeaderId || null })
  } catch (e: any) {
    console.error('PUT /api/activity-assignments error', e)
    return NextResponse.json({ error: 'Server error', details: e?.message || String(e) }, { status: 500 })
  }
}
