import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncStock() {
  const count = await prisma.$executeRawUnsafe(`
    UPDATE "ProductMaster"
    SET "currentStock" = GREATEST(0, COALESCE("openingStock", 0) + COALESCE("returnCount", 0) - COALESCE("salesCount", 0))
  `);
  console.log(`Updated ${count} products with formula: Available Stock = Opening Stock + Returns - Sales`);
}

syncStock()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
