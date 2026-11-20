const { PrismaClient } = require("@prisma/client");
const xlsx = require("xlsx");
const path = require("path");

const prisma = new PrismaClient();

async function analyze() {
  const filePath = path.resolve(__dirname, "..", "Quate.xlsx");
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Loaded ${rows.length} rows from Quate.xlsx.`);

  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      customerCode: true,
      name: true,
      companyName: true,
      mobile: true,
      email: true,
    }
  });

  console.log(`Found ${customers.length} customers in database.`);

  const existingQuotes = await prisma.quotation.count();
  console.log(`Existing quotations in DB: ${existingQuotes}`);

  // Unique quote numbers in excel
  const quoteNoSet = new Set();
  const quoteNumberSet = new Set();
  const accountNames = new Set();

  for (const r of rows) {
    if (r["Quote_NO"]) quoteNoSet.add(String(r["Quote_NO"]).trim());
    if (r["Quote Number"]) quoteNumberSet.add(String(r["Quote Number"]).trim());
    if (r["Account Name"]) accountNames.add(String(r["Account Name"]).trim());
  }

  console.log(`Unique Quote_NO count: ${quoteNoSet.size}`);
  console.log(`Unique Quote Number count: ${quoteNumberSet.size}`);
  console.log(`Unique Account Names in Excel: ${accountNames.size}`);

  // Customer matching maps
  const customerByName = new Map();
  const customerByCompany = new Map();
  const customerByCode = new Map();

  for (const c of customers) {
    if (c.name) customerByName.set(c.name.trim().toLowerCase(), c);
    if (c.companyName) customerByCompany.set(c.companyName.trim().toLowerCase(), c);
    if (c.customerCode) customerByCode.set(c.customerCode.trim().toLowerCase(), c);
  }

  let exactMatches = 0;
  const unmatchedAccounts = new Set();

  for (const acc of accountNames) {
    const lower = acc.toLowerCase();
    if (customerByName.has(lower) || customerByCompany.has(lower) || customerByCode.has(lower)) {
      exactMatches++;
    } else {
      unmatchedAccounts.add(acc);
    }
  }

  console.log(`Matched Account Names: ${exactMatches} / ${accountNames.size}`);
  console.log(`Unmatched Account Names: ${unmatchedAccounts.size}`);

  // Show some samples of unmatched
  const unmatchedArray = Array.from(unmatchedAccounts);
  console.log("Sample unmatched accounts (first 20):", unmatchedArray.slice(0, 20));

  // Also check products in DB
  const productsCount = await prisma.productMaster.count();
  console.log(`Products in DB: ${productsCount}`);

  await prisma.$disconnect();
}

analyze().catch(err => {
  console.error(err);
  process.exit(1);
});
