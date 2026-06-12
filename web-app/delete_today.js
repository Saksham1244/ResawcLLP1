const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();
async function main() {
  const deleted = await p.attendance.deleteMany({
    where: { date: '2026-06-12' }
  });
  console.log(`Deleted ${deleted.count} attendance records for today (2026-06-12).`);
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
