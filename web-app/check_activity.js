const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const acts = await prisma.pCActivity.findMany({ include: { user: true } });
  console.log(acts.map(a => ({
    name: a.user.name,
    lastSync: a.lastSync,
    diffSecs: (new Date().getTime() - new Date(a.lastSync).getTime()) / 1000
  })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
