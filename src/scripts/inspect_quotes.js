const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const models = [
    { name: 'Quotation', col: 'quotationNumber' },
    { name: 'SalesOrder', col: 'orderNumber' },
    { name: 'Customer', col: 'customerCode' },
    { name: 'Product', col: 'sku' },
    { name: 'RawMaterial', col: 'sku' },
    { name: 'Supplier', col: 'supplierCode' },
    { name: 'PurchaseOrder', col: 'poNumber' },
    { name: 'Invoice', col: 'invoiceNumber' },
  ];

  for (const m of models) {
    try {
      const records = await prisma[m.name.charAt(0).toLowerCase() + m.name.slice(1)].findMany({
        select: { [m.col]: true },
        take: 10,
      });
      console.log(`${m.name} codes:`, records.map(r => r[m.col]));
    } catch (e) {
      console.log(`Error checking ${m.name}:`, e.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
