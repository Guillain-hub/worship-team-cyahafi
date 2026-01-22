const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcryptjs')

async function run(){
  const identifier = process.argv[2]
  const password = process.argv[3]
  if(!identifier || !password){
    console.error('Usage: node scripts/check-member.js <email|phone> <password>')
    process.exit(2)
  }

  const member = await prisma.member.findFirst({ where: { OR: [{ email: identifier }, { phone: identifier }] } })
  if(!member){
    console.log('Member not found')
    process.exit(0)
  }
  console.log('Member found:', { id: member.id, email: member.email, phone: member.phone, passwordHash: !!member.passwordHash })
  if(!member.passwordHash){
    console.log('No passwordHash set for this member')
    process.exit(0)
  }
  const valid = await bcrypt.compare(password, member.passwordHash)
  console.log('Password valid?', valid)
  process.exit(0)
}

run().catch(err=>{ console.error(err); process.exit(1) })
