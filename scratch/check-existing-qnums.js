const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function checkQuotes() {
  const q = await p.quotation.findMany({ select: { quotationNumber: true } });
  console.log("Existing quotation numbers in DB:", q);
  await p.$disconnect();
}

checkQuotes().catch(console.error);
