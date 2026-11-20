const { PrismaClient } = require("@prisma/client");
const xlsx = require("xlsx");
const path = require("path");

const prisma = new PrismaClient();

async function checkSpecialCases() {
  const filePath = path.resolve(__dirname, "..", "Quate.xlsx");
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  // 1. Check rows for NEERAJA  AUTOMOBILE
  const neerajaQuotes = rows.filter(r => r["Account Name"] === "NEERAJA  AUTOMOBILE");
  console.log("NEERAJA  AUTOMOBILE quote rows count:", neerajaQuotes.length);

  // Find NEERAJA customer in DB
  const neerajaCustomers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: "NEERAJA", mode: "insensitive" } },
        { companyName: { contains: "NEERAJA", mode: "insensitive" } }
      ]
    }
  });
  console.log("NEERAJA customers in DB:", neerajaCustomers.map(c => ({ id: c.id, code: c.customerCode, name: c.name, comp: c.companyName })));

  // 2. Check the NA row
  const naQuote = rows.find(r => r["Account Name"] === "NA");
  console.log("\nNA Quote:", naQuote);

  // Check if Ayush Kumar exists anywhere in Lead, Customer, etc.
  const ayushCust = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: "Ayush", mode: "insensitive" } },
        { contactPerson: { contains: "Ayush", mode: "insensitive" } }
      ]
    }
  });
  console.log("Ayush in Customer DB:", ayushCust);

  const ayushLead = await prisma.lead.findMany({
    where: {
      OR: [
        { leadName: { contains: "Ayush", mode: "insensitive" } },
        { contactPerson: { contains: "Ayush", mode: "insensitive" } }
      ]
    }
  });
  console.log("Ayush in Lead DB:", ayushLead);

  await prisma.$disconnect();
}

checkSpecialCases().catch(console.error);
