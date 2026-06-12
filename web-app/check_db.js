const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();
async function main() {
  const records = await p.attendance.findMany({
    where: { date: '2026-06-12' },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(records, null, 2));
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
