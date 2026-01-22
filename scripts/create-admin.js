#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
// Load .env manually so this script doesn't require extra deps or npm install
try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let [, key, val] = m
      // strip surrounding quotes
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
      if (!(key in process.env)) process.env[key] = val
    }
  }
} catch (e) {
  // ignore
}

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 4) {
    console.error('Usage: node scripts/create-admin.js "Full Name" email phone password')
    process.exit(1)
  }

  const [fullName, email, phone, password] = args
  const prisma = new PrismaClient()

  try {
    // ensure Admin role exists
    let role = await prisma.role.findUnique({ where: { name: 'Admin' } })
    if (!role) {
      role = await prisma.role.create({ data: { name: 'Admin' } })
      console.log('Created role Admin')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // If a member with same email or phone exists, update password and role. Otherwise create.
    let member = null
    if (email) member = await prisma.member.findUnique({ where: { email } }).catch(() => null)
    if (!member && phone) {
      member = await prisma.member.findFirst({ where: { phone } }).catch(() => null)
    }

    if (member) {
      const updated = await prisma.member.update({
        where: { id: member.id },
        data: { passwordHash, roleId: role.id },
      })
      console.log('Updated existing member with admin credentials:', updated.id)
    } else {
      member = await prisma.member.create({
        data: {
          fullName,
          email,
          phone,
          passwordHash,
          roleId: role.id,
        },
      })
      console.log('Created admin member:', member.id)
    }
    console.log('You can now log in with the email/phone and the password you provided.')
  } catch (err) {
    console.error('Error creating admin:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
