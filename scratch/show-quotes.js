const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function showExistingQuotes() {
  const quotes = await p.quotation.findMany({ include: { items: true }, take: 2 });
  console.log("Existing Quotes in DB:", JSON.stringify(quotes, null, 2));
  await p.$disconnect();
}

showExistingQuotes().catch(err => {
  console.error(err);
  process.exit(1);
});
