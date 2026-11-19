import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const res: any = await prisma.$queryRawUnsafe(`
    SELECT 
      "sku", 
      "name", 
      "openingStock" AS "openingNov",
      "returnCount" AS "returns",
      "onlineSalesCount" AS "onlineSales",
      "offlineSalesCount" AS "offlineSales",
      "salesCount" AS "totalSales",
      "replacementCount" AS "replacements",
      "currentStock" AS "availableNov"
    FROM "ProductMaster"
    WHERE "sku" IN ('SMPL001', 'SMPL077', 'SMPL022', 'SMPL079', 'SMPL036', 'SMPL076', 'SMPL042')
    ORDER BY "sku" ASC
  `);
  console.log('LIVE VERIFIED METRICS IN DATABASE:');
  console.table(res);
}

check()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
