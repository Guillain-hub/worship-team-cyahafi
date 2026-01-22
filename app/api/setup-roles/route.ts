import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rolesToCreate = ['Admin', 'Leader', 'Member'];
    
    for (const roleName of rolesToCreate) {
      await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName },
      });
    }

    const currentRoles = await prisma.role.findMany();
    return NextResponse.json({ 
      message: "Roles synchronized successfully!", 
      rolesInDatabase: currentRoles 
    });
  } catch (error) {
    console.error('SETUP_ROLES_ERROR', error)
    return NextResponse.json({ error: "Failed to create roles" }, { status: 500 });
  }
}
