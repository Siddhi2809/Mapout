const { PrismaClient } = require("@prisma/client");
const xlsx = require("xlsx");
const path = require("path");

const prisma = new PrismaClient();

async function inspectDetail() {
  const filePath = path.resolve(__dirname, "..", "Quate.xlsx");
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  // Check what Quote_NO vs Quote Number vs Record Id represent
  // Let's see examples where Quote_NO is repeated
  const quoteNoCounts = {};
  for (const r of rows) {
    const qn = r["Quote_NO"] || "EMPTY";
    quoteNoCounts[qn] = (quoteNoCounts[qn] || 0) + 1;
  }

  const multiRows = Object.entries(quoteNoCounts).filter(([k, v]) => v > 1);
  console.log(`Number of Quote_NO appearing > 1 time: ${multiRows.length}`);

  if (multiRows.length > 0) {
    const sampleQn = multiRows[0][0];
    console.log(`Sample repeated Quote_NO "${sampleQn}" (${multiRows[0][1]} rows):`);
    const matches = rows.filter(r => r["Quote_NO"] === sampleQn);
    console.log(matches.slice(0, 3));
  }

  // Check the two unmatched accounts: "NA" and "NEERAJA  AUTOMOBILE"
  const naRows = rows.filter(r => r["Account Name"] === "NA");
  const neerajaRows = rows.filter(r => r["Account Name"] === "NEERAJA  AUTOMOBILE");
  console.log(`\n"NA" rows count: ${naRows.length}`);
  console.log("Sample 'NA' row:", naRows[0]);
  console.log(`\n"NEERAJA  AUTOMOBILE" rows count: ${neerajaRows.length}`);
  console.log("Sample 'NEERAJA  AUTOMOBILE' row:", neerajaRows[0]);

  // Search DB for neeraja
  const dbNeeraja = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: "NEERAJA", mode: "insensitive" } },
        { companyName: { contains: "NEERAJA", mode: "insensitive" } }
      ]
    }
  });
  console.log("DB search for Neeraja:", dbNeeraja);

  // Check how products / line items are represented in the file
  console.log("\nKeys in row 0:", Object.keys(rows[0]));

  await prisma.$disconnect();
}

inspectDetail().catch(err => {
  console.error(err);
  process.exit(1);
});
