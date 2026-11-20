const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function checkStatusCounts() {
  const allLeads = await p.lead.findMany({ select: { status: true } });
  const counts = {};
  for (const l of allLeads) {
    const s = l.status || "EMPTY";
    counts[s] = (counts[s] || 0) + 1;
  }
  console.log("Lead Status Counts in DB:", counts);

  const newLeadsMetric = allLeads.filter(
    (l) => l.status === "New" || l.status === "Interested" || l.status === "Contacted" || l.status === "Follow-up"
  ).length;
  console.log("Count matching (New | Interested | Contacted | Follow-up):", newLeadsMetric);

  await p.$disconnect();
}

checkStatusCounts().catch(console.error);
