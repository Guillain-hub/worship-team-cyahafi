const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function parseDate(input) {
  // Accept formats like '9/11/2004' (dd/mm/yyyy) or ISO. Try dd/mm/yyyy first.
  if (!input) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return new Date(input)
  const parts = input.split('/').map(p => p.trim())
  if (parts.length === 3) {
    // interpret as dd/mm/yyyy
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month - 1, day)
    }
  }
  // fallback
  const d = new Date(input)
  return isNaN(d.getTime()) ? null : d
}

async function main() {
  const phone = process.argv[2]
  const idNumber = process.argv[3]
  const birth = process.argv[4]
  const name = process.argv[5]

  if (!phone && !idNumber && !name) {
    console.error('Provide phone or idNumber or name as arguments')
    process.exit(1)
  }

  const where = phone ? { phone } : (idNumber ? { idNumber } : { fullName: name })

  const member = await prisma.member.findFirst({ where })
  if (!member) {
    console.error('Member not found with', where)
    process.exit(1)
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } })
  if (!adminRole) {
    console.error('Admin role not found. Run ensure-roles.js first.')
    process.exit(1)
  }

  const birthDate = parseDate(birth)

  const updated = await prisma.member.update({
    where: { id: member.id },
    data: {
      role: { connect: { id: adminRole.id } },
      idNumber: idNumber || member.idNumber,
      birthDate: birthDate || member.birthDate,
    }
  })

  console.log('Updated member to Admin:', updated.fullName, updated.id)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
