const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.$queryRawUnsafe(`
    SELECT id, sku, name, "openingStock", "currentStock", "salesCount", "returnCount", "sellingPrice"
    FROM "ProductMaster"
    WHERE name ILIKE '%USB Cable%'
  `);
  console.log('Found products:', products);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
