import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
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

    const safeMember = {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      role: updated.role?.name ?? null,
      createdAt: updated.createdAt,
    }

    // Return success without setting session cookie - user must log in after registration
    return NextResponse.json({ member: safeMember }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
