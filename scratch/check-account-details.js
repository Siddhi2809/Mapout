const { PrismaClient } = require("@prisma/client");
const xlsx = require("xlsx");
const path = require("path");

const prisma = new PrismaClient();

async function checkAccountDetails() {
  const wb = xlsx.readFile(path.resolve(__dirname, "..", "Account Details.xlsx"));
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  console.log(`Account Details.xlsx total rows: ${rows.length}`);
  const uniqueNames = new Set();
  const duplicateNames = [];
  const nameCounts = {};

  for (const r of rows) {
    const n = (r["Account Name"] || "").trim().toLowerCase();
    nameCounts[n] = (nameCounts[n] || 0) + 1;
    if (uniqueNames.has(n)) {
      duplicateNames.push(r["Account Name"]);
    }
    uniqueNames.add(n);
  }

  console.log(`Unique account names in Excel: ${uniqueNames.size}`);
  console.log(`Duplicate account names in Excel: ${duplicateNames.length}`);

  // Check Ayush Kumar customer
  const ayush = await prisma.customer.findFirst({
    where: { name: "Ayush Kumar" }
  });
  console.log("Ayush Kumar in DB:", ayush);

  if (ayush && (!ayush.mobile || ayush.mobile === "")) {
    await prisma.customer.update({
      where: { id: ayush.id },
      data: {
        mobile: "9916999041",
      }
    });
    console.log("Updated Ayush Kumar phone to 9916999041!");
  }

  await prisma.$disconnect();
}

checkAccountDetails().catch(console.error);
