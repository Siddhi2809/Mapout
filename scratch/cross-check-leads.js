const { PrismaClient } = require("@prisma/client");
const xlsx = require("xlsx");
const path = require("path");

const prisma = new PrismaClient();

function excelDateToISO(serial) {
  if (!serial) return null;
  if (typeof serial === "string") {
    // If string like "2024-05-12" or "12/05/2024"
    if (serial.includes("-") || serial.includes("/")) return serial;
  }
  const num = Number(serial);
  if (isNaN(num)) return String(serial);
  const utc_days = Math.floor(num - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split("T")[0];
}

function cleanPhone(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  return digits.slice(-10);
}

async function analyzeLeads() {
  const dbLeadsCount = await prisma.lead.count();
  console.log(`Current Leads in DB: ${dbLeadsCount}`);

  // Fetch all leads from DB
  const dbLeads = await prisma.lead.findMany({
    select: {
      id: true,
      leadNumber: true,
      leadName: true,
      companyName: true,
      contactPerson: true,
      mobile: true,
      alternateMobile: true,
      contactDate: true,
      notes: true,
      status: true,
      source: true,
      city: true,
      state: true,
      createdAt: true,
    }
  });

  console.log(`Fetched ${dbLeads.length} leads from DB.`);

  // Inspect Book1.xlsx rows
  const wbBook1 = xlsx.readFile(path.resolve(__dirname, "..", "Book1.xlsx"));
  const wsBook1 = wbBook1.Sheets[wbBook1.SheetNames[0]];
  const book1Raw = xlsx.utils.sheet_to_json(wsBook1, { header: 1 });
  console.log("\nBook1 first 5 raw rows:");
  console.log(book1Raw.slice(0, 5));

  // Inspect Ashok Leyland rows
  const wbAL = xlsx.readFile(path.resolve(__dirname, "..", "Ashok Leyland Data Sorting.xlsx"));
  const wsAL = wbAL.Sheets[wbAL.SheetNames[0]];
  const alRows = xlsx.utils.sheet_to_json(wsAL);
  console.log(`\nAshok Leyland total data rows: ${alRows.length}`);
  console.log("Ashok Leyland sample first 3 rows:", alRows.slice(0, 3));

  // Build index of DB leads by 10-digit mobile and company/name
  const dbByPhone = new Map();
  for (const l of dbLeads) {
    const p = cleanPhone(l.mobile);
    if (p) dbByPhone.set(p, l);
    const altP = cleanPhone(l.alternateMobile);
    if (altP && !dbByPhone.has(altP)) dbByPhone.set(altP, l);
  }

  // Cross check Ashok Leyland
  let alFound = 0;
  let alMissing = 0;
  let alDateMatch = 0;
  let alDateMismatch = 0;
  const alMissingSamples = [];
  const alDateMismatches = [];

  for (let i = 0; i < alRows.length; i++) {
    const r = alRows[i];
    const phone = cleanPhone(r["Mo .No."] || r["Alternate Mo No"]);
    const expectedDate = excelDateToISO(r["Calling Date"]);
    
    if (!phone) {
      // row without phone
      continue;
    }

    const matchedLead = dbByPhone.get(phone);
    if (matchedLead) {
      alFound++;
      if (expectedDate) {
        if (matchedLead.contactDate === expectedDate) {
          alDateMatch++;
        } else {
          alDateMismatch++;
          if (alDateMismatches.length < 5) {
            alDateMismatches.push({
              phone,
              expectedDate,
              dbDate: matchedLead.contactDate,
              dbCreatedAt: matchedLead.createdAt,
              excelRow: r
            });
          }
        }
      }
    } else {
      alMissing++;
      if (alMissingSamples.length < 5) {
        alMissingSamples.push({ index: i, phone, row: r });
      }
    }
  }

  console.log("\n--- Ashok Leyland Cross Check ---");
  console.log(`Total valid rows: ${alFound + alMissing}`);
  console.log(`Found in DB: ${alFound}`);
  console.log(`Missing in DB: ${alMissing}`);
  console.log(`Date Matches: ${alDateMatch}`);
  console.log(`Date Mismatches: ${alDateMismatch}`);
  if (alDateMismatches.length > 0) {
    console.log("Sample date mismatches:", alDateMismatches);
  }
  if (alMissingSamples.length > 0) {
    console.log("Sample missing leads:", alMissingSamples);
  }

  await prisma.$disconnect();
}

analyzeLeads().catch(console.error);
