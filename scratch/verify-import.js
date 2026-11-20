const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function verify() {
  const count = await p.quotation.count();
  const itemCount = await p.quotationItem.count();
  console.log(`Total Quotations in DB: ${count}`);
  console.log(`Total Quotation Items in DB: ${itemCount}`);

  // Sample check linked customers
  const sample = await p.quotation.findMany({
    take: 5,
    include: {
      items: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log("\nSample 5 imported quotations:");
  for (const q of sample) {
    const cust = await p.customer.findUnique({
      where: { id: q.customerId },
      select: { customerCode: true, name: true, companyName: true }
    });
    console.log({
      quotationNumber: q.quotationNumber,
      customerName: q.customerName,
      customerCode: cust ? cust.customerCode : "NOT FOUND",
      totalAmount: q.totalAmount,
      date: q.quotationDate,
      items: q.items.length
    });
  }

  // Check if any quotation has invalid customerId
  const allQuotations = await p.quotation.findMany({
    select: { id: true, quotationNumber: true, customerId: true }
  });

  const allCustIds = new Set((await p.customer.findMany({ select: { id: true } })).map(c => c.id));
  let unlinked = 0;
  for (const q of allQuotations) {
    if (!allCustIds.has(q.customerId)) {
      unlinked++;
    }
  }

  console.log(`\nIntegrity check: ${allQuotations.length} quotations checked. Unlinked: ${unlinked}`);

  await p.$disconnect();
}

verify().catch(console.error);
