import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { identifier, password } = body

    if (!identifier || !password) {
      return NextResponse.json({ error: 'identifier and password required' }, { status: 400 })
    }

    const member = await prisma.member.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
      include: { role: true },
    })

    if (!member) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!member.passwordHash) {
      return NextResponse.json({ error: 'Member has no login access' }, { status: 403 })
    }

    const valid = await bcrypt.compare(password, member.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET not configured')

    const roleName = member.role?.name ?? 'Member'
    const payload = { sub: member.id, role: roleName }
    const token = jwt.sign(payload, secret, { expiresIn: '7d' })

    // Set HttpOnly cookie as the source of truth for auth
    const cookie = `session_token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`

    const safeMember = {
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      role: roleName,
      createdAt: member.createdAt,
    }

    return NextResponse.json({ member: safeMember }, { status: 200, headers: { 'Set-Cookie': cookie } })
  } catch (err: any) {
    const message = err?.message ?? 'Server error'
    if (typeof message === 'string' && message.includes('Environment variable not found: DATABASE_URL')) {
      return NextResponse.json({ error: 'Server misconfiguration: DATABASE_URL is not set' }, { status: 500 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
