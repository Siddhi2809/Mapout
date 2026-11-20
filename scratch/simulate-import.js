const { PrismaClient } = require("@prisma/client");
const xlsx = require("xlsx");
const path = require("path");

const prisma = new PrismaClient();

function excelDateToISO(serial) {
  if (!serial) return "";
  if (typeof serial === "string" && serial.includes("-")) return serial;
  const num = Number(serial);
  if (isNaN(num)) return String(serial);
  const utc_days = Math.floor(num - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split("T")[0];
}

async function simulate() {
  const filePath = path.resolve(__dirname, "..", "Quate.xlsx");
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  const customers = await prisma.customer.findMany();
  console.log(`Customers in DB: ${customers.length}`);

  // Map customers
  const customerMap = new Map();
  // normalize helper: lower + collapse spaces
  const norm = s => (s || "").trim().toLowerCase().replace(/\s+/g, " ");

  for (const c of customers) {
    if (c.name) customerMap.set(norm(c.name), c);
    if (c.companyName) customerMap.set(norm(c.companyName), c);
  }

  // Count matches
  let directMatches = 0;
  let missing = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const acc = norm(r["Account Name"]);
    let c = customerMap.get(acc);
    if (!c && acc === "na" && r["Contact Name"]) {
      // check if we can create a customer or what
      missing.push({ rowIdx: i, reason: "Account Name is NA", row: r });
    } else if (!c) {
      missing.push({ rowIdx: i, reason: "Customer not found", acc: r["Account Name"], row: r });
    } else {
      directMatches++;
    }
  }

  console.log(`Simulation: ${directMatches} / ${rows.length} matched cleanly.`);
  console.log(`Missing count: ${missing.length}`);
  for (const m of missing) {
    console.log(`  Row ${m.rowIdx}: Reason: ${m.reason}, Account Name: "${m.acc || m.row['Account Name']}"`);
  }

  await prisma.$disconnect();
}

simulate().catch(console.error);
