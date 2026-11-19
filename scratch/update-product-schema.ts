import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ProductMaster" 
    ADD COLUMN IF NOT EXISTS "returnCount" DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "onlineSalesCount" DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "offlineSalesCount" DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "salesCount" DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "replacementCount" DOUBLE PRECISION DEFAULT 0;
  `);
  console.log('ProductMaster table schema updated with sales, return, and replacement metrics columns.');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
