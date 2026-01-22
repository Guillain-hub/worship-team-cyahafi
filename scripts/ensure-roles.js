const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = ['Admin', 'Leader', 'Member'];
  for (const name of roles) {
    const r = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log('Upserted role:', r.name);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
