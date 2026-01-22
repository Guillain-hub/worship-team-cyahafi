import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

function getTokenPayload(req: Request) {
  const auth = req.headers.get('authorization')
  if (!auth) return null
  const parts = auth.split(' ')
  if (parts.length !== 2) return null
  const token = parts[1]
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not configured')
  try {
    return jwt.verify(token, secret) as any
  } catch (e) {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const payload = getTokenPayload(req)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (payload.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { memberId, password, roleId } = body
    if (!memberId || !password) return NextResponse.json({ error: 'memberId and password required' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 10)

    const data: any = { passwordHash: hashed }
    if (roleId) data.roleId = roleId

    const updated = await prisma.member.update({
      where: { id: memberId },
      data,
      include: { role: true },
    })

    const safeMember = {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      role: updated.role?.name ?? null,
      createdAt: updated.createdAt,
    }

    return NextResponse.json({ member: safeMember })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
