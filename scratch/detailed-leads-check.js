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

function excelDateToISO(serial) {
  if (!serial) return null;
  if (typeof serial === "string") {
    if (serial.includes("-") || serial.includes("/")) return serial;
  }
  const num = Number(serial);
  if (isNaN(num)) return String(serial);
  const utc_days = Math.floor(num - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split("T")[0];
}

async function detailedCheck() {
  const dbLeads = await prisma.lead.findMany();
  console.log(`Total Leads in DB: ${dbLeads.length}`);

  // 1. Check Book1.xlsx
  const wbBook1 = xlsx.readFile(path.resolve(__dirname, "..", "Book1.xlsx"));
  const wsBook1 = wbBook1.Sheets[wbBook1.SheetNames[0]];
  const book1Raw = xlsx.utils.sheet_to_json(wsBook1, { header: 1 });
  // row 1 is headers
  const b1Headers = book1Raw[1];
  const b1Rows = book1Raw.slice(2).filter(r => r && r.length > 0 && (r[0] || r[3]));
  console.log(`\nBook1 data rows count: ${b1Rows.length}`);

  // DB index by phone
  const dbByPhone = new Map();
  for (const l of dbLeads) {
    const p = cleanPhone(l.mobile);
    if (p) dbByPhone.set(p, l);
    const altP = cleanPhone(l.alternateMobile);
    if (altP && !dbByPhone.has(altP)) dbByPhone.set(altP, l);
  }

  let b1Found = 0;
  let b1Missing = 0;
  const b1MissingSamples = [];

  for (const r of b1Rows) {
    const comp = r[0];
    const city = r[1];
    const state = r[2];
    const phone = cleanPhone(r[3]);
    const remark = r[4];

    if (!phone) continue;

    const match = dbByPhone.get(phone);
    if (match) {
      b1Found++;
    } else {
      b1Missing++;
      b1MissingSamples.push({ comp, phone, city, state, remark });
    }
  }

  console.log(`Book1 matched in DB: ${b1Found} / ${b1Rows.length}, missing: ${b1Missing}`);
  if (b1Missing > 0) {
    console.log("Book1 missing samples:", b1MissingSamples.slice(0, 5));
  }

  // 2. Check Ashok Leyland Data Sorting.xlsx
  const wbAL = xlsx.readFile(path.resolve(__dirname, "..", "Ashok Leyland Data Sorting.xlsx"));
  const wsAL = wbAL.Sheets[wbAL.SheetNames[0]];
  const alRows = xlsx.utils.sheet_to_json(wsAL);
  console.log(`\nAshok Leyland data rows count: ${alRows.length}`);

  let alWithPhone = 0;
  let alMatched = 0;
  let alMissing = 0;
  const alMissingList = [];

  for (let i = 0; i < alRows.length; i++) {
    const r = alRows[i];
    const p1 = cleanPhone(r["Mo .No."]);
    const p2 = cleanPhone(r["Alternate Mo No"]);
    const targetPhone = p1 || p2;

    if (!targetPhone) continue;
    alWithPhone++;

    const match = dbByPhone.get(targetPhone) || (p2 && dbByPhone.get(p2));
    if (match) {
      alMatched++;
    } else {
      alMissing++;
      alMissingList.push({ rowIdx: i + 2, row: r, phone: targetPhone });
    }
  }

  console.log(`Ashok Leyland total with phone: ${alWithPhone}`);
  console.log(`Ashok Leyland matched in DB: ${alMatched}`);
  console.log(`Ashok Leyland missing in DB: ${alMissing}`);
  console.log(`First 5 missing rows in Ashok Leyland:`, JSON.stringify(alMissingList.slice(0, 5), null, 2));

  // Check how many have date in Ashok Leyland
  const dates = new Set();
  for (const r of alRows) {
    const d = excelDateToISO(r["Calling Date"]);
    if (d) dates.add(d);
  }
  console.log(`Unique dates found in Ashok Leyland Excel:`, Array.from(dates));

  // Check contactDate distribution currently in DB
  const dbDates = {};
  for (const l of dbLeads) {
    const d = l.contactDate || "EMPTY_NULL";
    dbDates[d] = (dbDates[d] || 0) + 1;
  }
  console.log(`Current contactDate distribution in DB:`, dbDates);

  await prisma.$disconnect();
}

detailedCheck().catch(console.error);
