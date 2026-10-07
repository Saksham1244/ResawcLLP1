const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, passwordHash: true }
  });
  console.log('Total users:', users.length);
  users.forEach(u => console.log(u.email, '|', u.name, '|', u.role, '|', u.passwordHash.substring(0, 15)));
  await prisma.$disconnect();
}

main().catch(console.error);
