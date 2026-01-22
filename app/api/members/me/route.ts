import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(req: Request) {
  try {
    const payload = getAuthPayload(req)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })


    const body = await req.json()
    const { fullName, email, phone, idNumber, birthDate, currentPassword, newPassword } = body

    const data: any = {}
    if (typeof fullName === 'string') data.fullName = fullName
    if (typeof email === 'string') data.email = email || null
    if (typeof phone === 'string') data.phone = phone || null
    if (typeof idNumber === 'string') data.idNumber = idNumber || null
    if (typeof birthDate === 'string' && birthDate) data.birthDate = new Date(birthDate)

    // Handle password change: require currentPassword and newPassword
    if (typeof newPassword === 'string' && newPassword.length > 0) {
      if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
        return NextResponse.json({ error: 'Current password required to change password' }, { status: 400 })
      }

      // verify current password
      const existing = await prisma.member.findUnique({ where: { id: payload.sub } })
      const storedHash = existing?.passwordHash || null
      if (!storedHash) return NextResponse.json({ error: 'No existing password set' }, { status: 400 })

      const match = await bcrypt.compare(currentPassword, storedHash)
      if (!match) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 })

      const hashed = await bcrypt.hash(newPassword, 10)
      data.passwordHash = hashed
    }

    const updated = await prisma.member.update({
      where: { id: payload.sub },
      data,
      include: { role: true }
    })

    const safe = {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      role: updated.role ? updated.role.name : null,
      createdAt: updated.createdAt,
    }

    return NextResponse.json({ member: safe })
  } catch (error: any) {
    console.error('UPDATE_MEMBER_ME_ERROR', error)
    return NextResponse.json({ error: error?.message || 'Failed to update' }, { status: 500 })
  }
}
