const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function checkProducts() {
  const prds = await p.productMaster.findMany({
    select: { id: true, productCode: true, sku: true, name: true, sellingPrice: true },
    take: 5
  });
  console.log("Sample products:", prds);
  await p.$disconnect();
}

checkProducts().catch(console.error);
