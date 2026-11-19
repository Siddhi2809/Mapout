const { prisma } = require('./src/lib/prisma');

async function test() {
  console.log('Querying ProductMaster with raw query...');
  const t0 = Date.now();
  try {
    const products = await prisma.$queryRawUnsafe(`SELECT id, name FROM "ProductMaster" LIMIT 5;`);
    console.log('ProductMaster success:', products.length, 'in', Date.now() - t0, 'ms');
  } catch (e) {
    console.error('ProductMaster error:', e.message);
  }

  console.log('Querying BOM.findMany...');
  const t1 = Date.now();
  try {
    const boms = await prisma.bOM.findMany({ include: { items: true } });
    console.log('BOM success:', boms.length, 'in', Date.now() - t1, 'ms');
  } catch (e) {
    console.error('BOM error:', e.message);
  }

  await prisma.$disconnect();
}

test();
