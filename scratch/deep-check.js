const { PrismaClient } = require("@prisma/client");
const xlsx = require("xlsx");
const path = require("path");

const prisma = new PrismaClient();

async function deepCheck() {
  const filePath = path.resolve(__dirname, "..", "Quate.xlsx");
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  console.log(`Checking ${rows.length} rows from Quate.xlsx...`);

  // Check unique Quote Number
  const quoteNums = new Set();
  const duplicateQuoteNums = [];
  for (const r of rows) {
    const qn = String(r["Quote Number"]).trim();
    if (quoteNums.has(qn)) {
      duplicateQuoteNums.push(qn);
    }
    quoteNums.add(qn);
  }
  console.log(`Quote Number check: total=${rows.length}, unique=${quoteNums.size}, duplicates=${duplicateQuoteNums.length}`);

  // Fetch all customers from DB
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      customerCode: true,
      name: true,
      companyName: true,
      contactPerson: true,
      mobile: true,
      email: true,
    }
  });

  // Build lookups
  const lookup = new Map();
  function addKey(key, cust) {
    if (!key) return;
    const clean = String(key).trim().toLowerCase();
    if (clean && !lookup.has(clean)) {
      lookup.set(clean, cust);
    }
  }

  for (const c of customers) {
    addKey(c.name, c);
    addKey(c.companyName, c);
    addKey(c.customerCode, c);
  }

  let matched = 0;
  const unmatchedRows = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const acc = String(r["Account Name"] || "").trim().toLowerCase();
    const cust = lookup.get(acc);
    if (cust) {
      matched++;
    } else {
      unmatchedRows.push({ index: i, row: r });
    }
  }

  console.log(`Matching result: ${matched} matched, ${unmatchedRows.length} unmatched out of ${rows.length}`);

  for (const um of unmatchedRows) {
    console.log(`\nUnmatched row ${um.index}:`);
    console.log(`  Account Name: "${um.row['Account Name']}"`);
    console.log(`  Contact Name: "${um.row['Contact Name']}"`);
    console.log(`  Billing Code: "${um.row['Billing Code']}"`);
    console.log(`  Billing Street: "${um.row['Billing Street']}"`);
    console.log(`  Subject: "${um.row['Subject']}"`);
    console.log(`  Grand Total: ${um.row['Grand Total']}`);
  }

  await prisma.$disconnect();
}

deepCheck().catch(err => {
  console.error(err);
  process.exit(1);
});
