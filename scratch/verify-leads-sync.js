const { PrismaClient } = require("@prisma/client");
const xlsx = require("xlsx");
const path = require("path");

const prisma = new PrismaClient();

function cleanPhone(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  return digits.slice(-10);
}

function parseCallingDate(val) {
  if (!val) return null;
  if (typeof val === "number" || (!isNaN(Number(val)) && !String(val).includes("/") && !String(val).includes("-"))) {
    const num = Number(val);
    const utc_days = Math.floor(num - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split("T")[0];
  }
  const str = String(val).trim();
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3) {
      const month = parts[0].padStart(2, "0");
      const day = parts[1].padStart(2, "0");
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  if (str.includes("-")) {
    return str;
  }
  return str;
}

async function verifyAll() {
  const dbLeads = await prisma.lead.findMany();
  console.log(`Total Leads in DB: ${dbLeads.length}`);

  const dbPhoneMap = new Map();
  for (const l of dbLeads) {
    const p1 = cleanPhone(l.mobile);
    if (p1) dbPhoneMap.set(p1, l);
    const p2 = cleanPhone(l.alternateMobile);
    if (p2 && !dbPhoneMap.has(p2)) dbPhoneMap.set(p2, l);
  }

  // 1. Cross check Book1.xlsx
  const wbB1 = xlsx.readFile(path.resolve(__dirname, "..", "Book1.xlsx"));
  const wsB1 = wbB1.Sheets[wbB1.SheetNames[0]];
  const b1Raw = xlsx.utils.sheet_to_json(wsB1, { header: 1 });
  const b1Rows = b1Raw.slice(2).filter(r => r && r.length > 0 && (r[0] || r[3]));

  let b1Found = 0;
  let b1WithDate = 0;
  for (const r of b1Rows) {
    const phone = cleanPhone(r[3]);
    if (!phone) continue;
    const l = dbPhoneMap.get(phone);
    if (l) {
      b1Found++;
      if (l.contactDate) b1WithDate++;
    }
  }
  console.log(`Book1.xlsx: ${b1Found} / ${b1Rows.length} present in DB (${b1WithDate} have contactDate)`);

  // 2. Cross check Ashok Leyland Data Sorting.xlsx
  const wbAL = xlsx.readFile(path.resolve(__dirname, "..", "Ashok Leyland Data Sorting.xlsx"));
  const wsAL = wbAL.Sheets[wbAL.SheetNames[0]];
  const alRows = xlsx.utils.sheet_to_json(wsAL);

  let alTotal = 0;
  let alFound = 0;
  let alDateMatch = 0;
  let alDateMismatch = 0;
  let alMissing = 0;

  for (const r of alRows) {
    const p1 = cleanPhone(r["Mo .No."]);
    const p2 = cleanPhone(r["Alternate Mo No"]);
    const phone = p1 || p2;
    if (!phone) continue;

    alTotal++;
    const expectedDate = parseCallingDate(r["Calling Date"]);
    const l = dbPhoneMap.get(phone) || (p2 && dbPhoneMap.get(p2));

    if (l) {
      alFound++;
      if (expectedDate && l.contactDate === expectedDate) {
        alDateMatch++;
      } else {
        alDateMismatch++;
      }
    } else {
      alMissing++;
    }
  }

  console.log(`\nAshok Leyland Data Sorting.xlsx:`);
  console.log(`  Total valid phone rows: ${alTotal}`);
  console.log(`  Present in DB: ${alFound} / ${alTotal}`);
  console.log(`  Missing in DB: ${alMissing}`);
  console.log(`  Date Exact Match: ${alDateMatch} / ${alFound}`);
  console.log(`  Date Mismatch / Empty: ${alDateMismatch}`);

  // Sample check
  const sample = await prisma.lead.findMany({
    where: { importId: "import_ashok_leyland_sorting" },
    take: 3
  });
  console.log("\nSample newly imported Ashok Leyland leads:", JSON.stringify(sample, null, 2));

  await prisma.$disconnect();
}

verifyAll().catch(console.error);
