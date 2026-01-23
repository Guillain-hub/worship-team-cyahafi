import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const payload = getAuthPayload(req)
  if (!payload) return NextResponse.json({ user: null })

  const member = await prisma.member.findUnique({ where: { id: payload.sub }, include: { role: true } })
  if (!member) return NextResponse.json({ user: null })

  // Always include role - essential for auth flow
  const safeMember = {
    id: member.id,
    fullName: member.fullName,
    email: member.email,
    phone: member.phone,
    role: member.role?.name ?? 'Member', // Fallback to Member if no role assigned
    idNumber: member.idNumber || null,
    birthDate: member.birthDate ? member.birthDate.toISOString() : null,
    createdAt: member.createdAt,
  }

  return NextResponse.json({ user: safeMember })
}
