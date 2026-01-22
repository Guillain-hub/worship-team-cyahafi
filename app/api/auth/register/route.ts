import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { fullName, email, phone, password } = body

    // Require phone and password; only allow registration for pre-created members
    if (!phone || !password) {
      return NextResponse.json({ error: 'phone and password required' }, { status: 400 })
    }

    // Find existing member by phone (must be pre-created by admin)
    const existing = await prisma.member.findFirst({ where: { phone } })
    if (!existing) {
      return NextResponse.json({ error: 'No pre-existing member with this phone number' }, { status: 404 })
    }

    // If member already has a passwordHash, they already registered
    if (existing.passwordHash) {
      return NextResponse.json({ error: 'Member already has login access' }, { status: 409 })
    }

    // Optionally update email or fullName if provided (but do not change phone)
    const passwordHash = await bcrypt.hash(password, 10)
    const updated = await prisma.member.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        email: email ?? existing.email,
        fullName: fullName ?? existing.fullName,
      },
      include: { role: true },
    })

    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET not configured')

    const payload = { sub: updated.id, role: updated.role?.name ?? 'Member' }
    const token = jwt.sign(payload, secret, { expiresIn: '7d' })

    const cookie = `session_token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`

    const safeMember = {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      role: updated.role?.name ?? null,
      createdAt: updated.createdAt,
    }

    return NextResponse.json({ member: safeMember }, { status: 200, headers: { 'Set-Cookie': cookie } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
