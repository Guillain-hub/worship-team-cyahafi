// Run: node scripts/clear-activities.js
// Deletes all activities and associated attendance from the SQLite DB using Prisma

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Deleting all attendance records...')
  const a = await prisma.attendance.deleteMany({})
  console.log('Deleted attendance:', a.count)

  console.log('Deleting all activities...')
  const r = await prisma.activity.deleteMany({})
  console.log('Deleted activities:', r.count)

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
