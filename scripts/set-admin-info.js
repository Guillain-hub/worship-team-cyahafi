const { PrismaClient } = require('@prisma/client')
;(async () => {
  const prisma = new PrismaClient()
  try {
    const email = 'guillain360@gmail.com'
    const phone = '0787275157'
    const idNumber = '1200480096187174'
    const birthInput = '11/0/2004' // provided by user; script will validate

    // find member by email or phone
    let member = null
    if (email) member = await prisma.member.findUnique({ where: { email } }).catch(() => null)
    if (!member && phone) member = await prisma.member.findFirst({ where: { phone } }).catch(() => null)

    if (!member) {
      console.error('Member not found by email or phone. Did you run create-admin first?')
      process.exit(1)
    }

    const data = { idNumber }

    // Validate birthInput (expected format like DD/MM/YYYY or MM/DD/YYYY)
    if (birthInput) {
      const parts = birthInput.split('/').map(p => Number(p))
      if (parts.length === 3 && parts.every(n => Number.isFinite(n) && n > 0)) {
        // assume format D/M/YYYY when first <=31 and second <=12
        const [a, b, c] = parts
        let day, month, year
        if (a <= 31 && b <= 12) { day = a; month = b; year = c }
        else if (b <= 31 && a <= 12) { day = b; month = a; year = c }
        if (day && month && year) {
          const dt = new Date(year, month - 1, day)
          if (!isNaN(dt.getTime())) data.birthDate = dt
        }
      }
    }

    const updated = await prisma.member.update({ where: { id: member.id }, data })
    console.log('Member updated:', updated.id, { idNumber: updated.idNumber, birthDate: updated.birthDate })
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
})()
