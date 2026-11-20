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

const norm = s => (s || "").trim().toLowerCase().replace(/\s+/g, " ");

async function fullAudit() {
  console.log("==================================================");
  console.log("  COMPREHENSIVE DATA AUDIT: EXCEL FILES VS DATABASE");
  console.log("==================================================\n");

  // ----------------------------------------------------------------
  // 1. CUSTOMERS AUDIT (Account Details.xlsx)
  // ----------------------------------------------------------------
  console.log(">>> 1. AUDITING CUSTOMERS (Account Details.xlsx)");
  const wbAcc = xlsx.readFile(path.resolve(__dirname, "..", "Account Details.xlsx"));
  console.log("  Sheet names in Account Details.xlsx:", wbAcc.SheetNames);
  const wsAcc = wbAcc.Sheets[wbAcc.SheetNames[0]];
  const accRows = xlsx.utils.sheet_to_json(wsAcc);
  console.log(`  Account Details.xlsx total data rows: ${accRows.length}`);
  console.log("  Headers in Account Details.xlsx:", Object.keys(accRows[0] || {}));

  const dbCustomers = await prisma.customer.findMany();
  console.log(`  Database Customer count: ${dbCustomers.length}`);

  // Customer lookups
  const custByName = new Map();
  const custByPhone = new Map();
  for (const c of dbCustomers) {
    if (c.name) custByName.set(norm(c.name), c);
    if (c.companyName) custByName.set(norm(c.companyName), c);
    const p = cleanPhone(c.mobile);
    if (p) custByPhone.set(p, c);
  }

  let accMatched = 0;
  let accMissing = 0;
  const missingAccSamples = [];

  for (let i = 0; i < accRows.length; i++) {
    const r = accRows[i];
    // Determine account/company name key in Account Details.xlsx
    const nameVal = r["Account Name"] || r["Company Name"] || r["Customer Name"] || r["Name"] || r["Account"];
    const phoneVal = cleanPhone(r["Phone"] || r["Mobile"] || r["Mobile Number"] || r["Contact Number"] || r["Mo .No."]);

    const match = (nameVal && custByName.get(norm(nameVal))) || (phoneVal && custByPhone.get(phoneVal));
    if (match) {
      accMatched++;
    } else {
      accMissing++;
      if (missingAccSamples.length < 5) {
        missingAccSamples.push({ rowIdx: i + 2, name: nameVal, phone: phoneVal, raw: r });
      }
    }
  }

  console.log(`  Customers Matched: ${accMatched} / ${accRows.length}`);
  console.log(`  Customers Missing: ${accMissing}`);
  if (missingAccSamples.length > 0) {
    console.log("  Sample missing customers:", JSON.stringify(missingAccSamples, null, 2));
  }

  // ----------------------------------------------------------------
  // 2. LEADS AUDIT (Book1.xlsx + Ashok Leyland Data Sorting.xlsx)
  // ----------------------------------------------------------------
  console.log("\n>>> 2. AUDITING LEADS");
  const dbLeads = await prisma.lead.findMany();
  console.log(`  Database Leads count: ${dbLeads.length}`);

  const leadByPhone = new Map();
  for (const l of dbLeads) {
    const p1 = cleanPhone(l.mobile);
    if (p1) leadByPhone.set(p1, l);
    const p2 = cleanPhone(l.alternateMobile);
    if (p2 && !leadByPhone.has(p2)) leadByPhone.set(p2, l);
  }

  // 2a. Book1.xlsx
  const wbB1 = xlsx.readFile(path.resolve(__dirname, "..", "Book1.xlsx"));
  const b1Raw = xlsx.utils.sheet_to_json(wbB1.Sheets[wbB1.SheetNames[0]], { header: 1 });
  const b1Rows = b1Raw.slice(2).filter(r => r && r.length > 0 && (r[0] || r[3]));
  let b1Matched = 0;
  let b1Missing = 0;
  for (const r of b1Rows) {
    const p = cleanPhone(r[3]);
    if (p && leadByPhone.get(p)) b1Matched++;
    else if (p) b1Missing++;
  }
  console.log(`  Book1.xlsx Leads: Total = ${b1Rows.length}, Matched in DB = ${b1Matched}, Missing = ${b1Missing}`);

  // 2b. Ashok Leyland Data Sorting.xlsx
  const wbAL = xlsx.readFile(path.resolve(__dirname, "..", "Ashok Leyland Data Sorting.xlsx"));
  const alRows = xlsx.utils.sheet_to_json(wbAL.Sheets[wbAL.SheetNames[0]]);
  let alMatched = 0;
  let alMissing = 0;
  for (const r of alRows) {
    const p1 = cleanPhone(r["Mo .No."]);
    const p2 = cleanPhone(r["Alternate Mo No"]);
    const p = p1 || p2;
    if (p && (leadByPhone.get(p1) || (p2 && leadByPhone.get(p2)))) alMatched++;
    else if (p) alMissing++;
  }
  console.log(`  Ashok Leyland Leads: Total = ${alRows.length}, Matched in DB = ${alMatched}, Missing = ${alMissing}`);

  // ----------------------------------------------------------------
  // 3. QUOTATIONS AUDIT (Quate.xlsx)
  // ----------------------------------------------------------------
  console.log("\n>>> 3. AUDITING QUOTATIONS (Quate.xlsx)");
  const wbQ = xlsx.readFile(path.resolve(__dirname, "..", "Quate.xlsx"));
  const qRows = xlsx.utils.sheet_to_json(wbQ.Sheets[wbQ.SheetNames[0]]);
  const dbQuotations = await prisma.quotation.findMany({
    select: { id: true, quotationNumber: true, customerId: true, totalAmount: true }
  });
  console.log(`  Quate.xlsx rows: ${qRows.length}`);
  console.log(`  Database Quotation count: ${dbQuotations.length}`);

  const dbQNumSet = new Set(dbQuotations.map(q => q.quotationNumber));
  let qMatched = 0;
  let qMissing = 0;
  const missingQSamples = [];

  for (let i = 0; i < qRows.length; i++) {
    const r = qRows[i];
    const rawQuoteNum = String(r["Quote Number"]).trim();
    const quoteNo = r["Quote_NO"] ? String(r["Quote_NO"]).trim() : null;
    const finalNum = quoteNo ? quoteNo : `QT-${rawQuoteNum}`;

    if (dbQNumSet.has(finalNum) || dbQNumSet.has(`QT-${rawQuoteNum}`) || dbQNumSet.has(rawQuoteNum)) {
      qMatched++;
    } else {
      qMissing++;
      if (missingQSamples.length < 5) {
        missingQSamples.push({ rowIdx: i + 2, rawQuoteNum, quoteNo, finalNum, account: r["Account Name"] });
      }
    }
  }

  console.log(`  Quotations Matched in DB: ${qMatched} / ${qRows.length}`);
  console.log(`  Quotations Missing: ${qMissing}`);
  if (missingQSamples.length > 0) {
    console.log("  Sample missing quotations:", missingQSamples);
  }

  console.log("\n==================================================");
  console.log("  AUDIT COMPLETE");
  console.log("==================================================");

  await prisma.$disconnect();
}

fullAudit().catch(console.error);
