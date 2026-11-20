const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function checkAyush() {
  const r = await p.customer.findMany({
    where: {
      OR: [
        { name: { contains: "Ayush", mode: "insensitive" } },
        { contactPerson: { contains: "Ayush", mode: "insensitive" } },
        { companyName: { contains: "Ayush", mode: "insensitive" } },
        { address: { contains: "Ravet", mode: "insensitive" } },
        { city: { contains: "Pune", mode: "insensitive" } }
      ]
    },
    take: 10
  });
  console.log("Found matches:", r);
  await p.$disconnect();
}

checkAyush().catch(console.error);
