const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function check() {
  const c = await p.lead.count();
  console.log("Current total leads in database:", c);
  await p.$disconnect();
}

check().catch(console.error);
