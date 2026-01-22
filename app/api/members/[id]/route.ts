import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthPayload } from '@/lib/auth'

/**
 * GET: Fetch a single member's full profile with attendance history for ALL activities
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const member = await prisma.member.findUnique({
      where: { id },
      include: { 
        role: true,
        attendance: {
          include: {
            activity: true
          }
        }
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Fetch ALL activities
    const allActivities = await prisma.activity.findMany({
      orderBy: { date: 'desc' }
    })

    const safeMember = {
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      idNumber: member.idNumber,
      birthDate: member.birthDate,
      memberType: member.memberType,
      isActive: member.isActive,
      role: member.role 
        ? { id: member.role.id, name: member.role.name } 
        : { id: '', name: 'Member' },
      createdAt: member.createdAt
    }

    // Map ALL activities with member's attendance status
    const attendance = allActivities.map((activity) => {
      const memberAttendance = member.attendance.find((att) => att.activityId === activity.id)
      return {
        id: activity.id,
        name: activity.name,
        date: activity.date,
        status: memberAttendance?.status === 'Present' ? 'Present' : 'Absent'
      }
    })

    return NextResponse.json({ member: safeMember, attendance })
  } catch (error) {
    console.error('GET_MEMBER_ERROR', error)
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 })
  }
}

/**
 * PUT: Update member profile or change roles
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Properly unwrap params for Next.js 15
    const resolvedParams = await params
    const id = resolvedParams.id
    
    // 2. Parse request body
    const body = await req.json()
    console.log('UPDATE_REQUEST_RECEIVED', { id, body })

    // 3. Get current user's auth info
    const auth = getAuthPayload(req)
    const data: any = {}

    // 4. Map profile fields to update object
    if (body.fullName !== undefined) data.fullName = body.fullName
    if (body.email !== undefined) data.email = body.email || null
    if (body.phone !== undefined) data.phone = body.phone || null
    if (body.idNumber !== undefined) data.idNumber = body.idNumber || null
    if (body.memberType) data.memberType = body.memberType
    if (body.isActive !== undefined) data.isActive = body.isActive
    
    if (body.birthDate) {
      data.birthDate = new Date(body.birthDate)
    }

    // 5. Role Update Logic (Only Admin can change roles)
    if (body.roleName) {
      const userRole = typeof auth?.role === 'object' ? auth.role.name : auth?.role

      // Authorization Check - Only Admins can change roles
      if (!auth || userRole !== 'Admin') {
        return NextResponse.json({ error: 'Only Admins can change member roles' }, { status: 403 })
      }

      // Find the correct UUID for the roleName provided
      // We use findFirst to handle potential casing differences manually
      const allRoles = await prisma.role.findMany()
      const targetRole = allRoles.find(
        (r) => r.name.toLowerCase() === body.roleName.toLowerCase()
      )

      if (targetRole) {
        data.roleId = targetRole.id
        console.log(`✅ Mapping "${body.roleName}" to UUID: ${targetRole.id}`)
      } else {
        console.error('❌ ROLE_NOT_FOUND_IN_DB', { 
          searched: body.roleName, 
          available: allRoles.map(r => r.name) 
        })
        return NextResponse.json({ 
          error: `Role "${body.roleName}" does not exist in your database. Available: ${allRoles.map(r => r.name).join(', ')}` 
        }, { status: 400 })
      }
    }

    // 6. Check if there is actually anything to update
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
    }

    // 7. Perform the update
    const updatedMember = await prisma.member.update({
      where: { id },
      data,
      include: { role: true }
    })

    return NextResponse.json({
      message: 'Update successful',
      member: {
        ...updatedMember,
        role: updatedMember.role 
          ? { id: updatedMember.role.id, name: updatedMember.role.name } 
          : { id: '', name: 'Member' }
      }
    })

  } catch (error: any) {
    console.error('UPDATE_MEMBER_ERROR', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'ID Number or Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Support PATCH requests as well
export { PUT as PATCH }

/**
 * DELETE: Deactivate member (Soft Delete)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Ensure member exists
    const member = await prisma.member.findUnique({ where: { id } })
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    await prisma.member.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Member deactivated successfully' })
  } catch (error) {
    console.error('DELETE_MEMBER_ERROR', error)
    return NextResponse.json({ error: 'Failed to deactivate member' }, { status: 500 })
  }
}