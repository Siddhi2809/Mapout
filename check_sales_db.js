const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const orders = await prisma.$queryRawUnsafe('SELECT id, "orderNumber", "packedImage", "productionImages", "productionStatus", "orderStatus" FROM "SalesOrder"');
    console.log('Orders in DB count:', orders.length);
    orders.forEach(o => {
      console.log('ID:', o.id, 'OrderNum:', o.orderNumber);
      console.log('  packedImage length:', o.packedImage ? o.packedImage.length : 'null');
      console.log('  productionImages:', o.productionImages ? o.productionImages.slice(0, 100) : 'null');
      console.log('  productionStatus:', o.productionStatus);
      console.log('  orderStatus:', o.orderStatus);
    });
  } catch (err) {
    console.error('Error querying SalesOrder:', err.message);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
