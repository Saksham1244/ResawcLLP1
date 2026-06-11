const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const users = [
    { name: 'Mukul',  email: 'mukul@resawc.com',  passwordHash: 'Mukul@123',  role: 'ADMIN' },
    { name: 'Mukesh', email: 'mukesh@resawc.com', passwordHash: 'Mukesh@123', role: 'ADMIN' },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: u });
    console.log('Seeded:', u.email);
  }
  await prisma.$disconnect();
  console.log('Done!');
}
seed().catch(e => { console.error(e); process.exit(1); });
