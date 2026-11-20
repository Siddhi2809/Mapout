const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function checkSampleLeads() {
  const sample = await p.lead.findMany({ take: 5 });
  console.log("Sample 5 leads in DB:", JSON.stringify(sample, null, 2));

  const history = await p.leadImportHistory.findMany();
  console.log("\nLeadImportHistory in DB:", JSON.stringify(history, null, 2));

  await p.$disconnect();
}

checkSampleLeads().catch(console.error);
