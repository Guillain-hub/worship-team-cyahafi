import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: Fetch all active members
 * Filters by isActive: true to support soft-deletion
 */
export async function GET(req: Request) {
  try {
    const members = await prisma.member.findMany({
      where: {
        isActive: true, // 🔹 Only fetch active members (Soft Delete Logic)
      },
      include: { 
        role: true 
      },
      orderBy: {
        fullName: 'asc'
      }
    })

    const safeMembers = members.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      email: m.email,
      phone: m.phone,
      idNumber: m.idNumber,
      birthDate: m.birthDate,
      memberType: m.memberType, // Student, Employed, etc.
      // Returns full object to prevent frontend crashes
      role: m.role ? { id: m.role.id, name: m.role.name } : { id: '', name: 'Member' },
      isActive: m.isActive,
      createdAt: m.createdAt,
    }))

    return NextResponse.json({ members: safeMembers })
  } catch (error) {
    console.error("GET_MEMBERS_ERROR", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST: Create a new member
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      fullName, 
      email, 
      phone, 
      idNumber, 
      birthDate, 
      memberType, 
      roleName 
    } = body

    if (!fullName) {
      return NextResponse.json({ error: 'Full Name is required' }, { status: 400 })
    }

    // Map the string roleName (e.g., "Leader") to a database Role ID
    const targetRole = await prisma.role.findUnique({
      where: { name: roleName || 'Member' }
    })

    const created = await prisma.member.create({
      data: {
        fullName,
        email: email || null,
        phone: phone || null,
        idNumber: idNumber || null,
        memberType: memberType || 'STUDENT',
        isActive: true, // 🔹 Default to active
        birthDate: birthDate ? new Date(birthDate) : null,
        roleId: targetRole?.id,
      },
      include: { 
        role: true 
      }
    })

    // Prepare response matching the GET structure
    const safeCreated = {
      ...created,
      role: created.role ? { id: created.role.id, name: created.role.name } : { id: '', name: 'Member' }
    }

    return NextResponse.json({ member: safeCreated }, { status: 201 })
  } catch (error: any) {
    console.error("POST_MEMBER_ERROR", error)
    
    // Prisma unique constraint error (usually idNumber or email)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'ID Number or Email already exists in the system' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}