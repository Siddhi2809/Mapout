const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function checkUnlinked() {
  const allCustIds = new Set((await p.customer.findMany({ select: { id: true } })).map(c => c.id));
  const quotes = await p.quotation.findMany({
    select: { id: true, quotationNumber: true, customerId: true, customerName: true }
  });

  for (const q of quotes) {
    if (!allCustIds.has(q.customerId)) {
      console.log("Unlinked quotation found:", q);
      // Let's find customer by name or connect to correct customer
      const match = await p.customer.findFirst({
        where: {
          OR: [
            { name: { equals: q.customerName, mode: "insensitive" } },
            { companyName: { equals: q.customerName, mode: "insensitive" } }
          ]
        }
      });
      console.log("Matched customer in DB:", match);
      if (match) {
        await p.quotation.update({
          where: { id: q.id },
          data: { customerId: match.id }
        });
        console.log(`Updated quotation ${q.quotationNumber} to customer ${match.customerCode} (${match.id})`);
      }
    }
  }

  await p.$disconnect();
}

checkUnlinked().catch(console.error);
