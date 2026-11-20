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
  // If Excel number
  if (typeof val === "number" || (!isNaN(Number(val)) && !String(val).includes("/") && !String(val).includes("-"))) {
    const num = Number(val);
    const utc_days = Math.floor(num - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split("T")[0];
  }
  const str = String(val).trim();
  // If "M/D/YYYY" e.g. "3/13/2026"
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

function mapStatus(remark) {
  if (!remark) return "Not Contacted";
  const r = String(remark).toLowerCase();
  if (r.includes("deal close") || r.includes("deal done") || r.includes("quotation") || r.includes("interested")) return "Contacted";
  if (r.includes("catalouge") || r.includes("catalogue") || r.includes("ctalouge") || r.includes("send")) return "Contacted";
  if (r.includes("busy") || r.includes("call back") || r.includes("call cut") || r.includes("contact this number") || r.includes("call on this") || r.includes("follow")) return "Follow-up";
  if (r.includes("purchased") || r.includes("alrady") || r.includes("contacted")) return "Contacted";
  return "Not Contacted";
}

async function syncAndFixLeads() {
  console.log("=== STEP 1: LOAD DB LEADS ===");
  const dbLeads = await prisma.lead.findMany();
  console.log(`Current DB Leads count: ${dbLeads.length}`);

  const leadByPhone = new Map();
  for (const l of dbLeads) {
    const p1 = cleanPhone(l.mobile);
    if (p1) leadByPhone.set(p1, l);
    const p2 = cleanPhone(l.alternateMobile);
    if (p2 && !leadByPhone.has(p2)) leadByPhone.set(p2, l);
  }

  // Load Book1.xlsx
  console.log("\n=== STEP 2: VERIFY BOOK1.XLSX ===");
  const wbBook1 = xlsx.readFile(path.resolve(__dirname, "..", "Book1.xlsx"));
  const wsBook1 = wbBook1.Sheets[wbBook1.SheetNames[0]];
  const book1Raw = xlsx.utils.sheet_to_json(wsBook1, { header: 1 });
  const book1Rows = book1Raw.slice(2).filter(r => r && r.length > 0 && (r[0] || r[3]));
  console.log(`Book1 valid data rows: ${book1Rows.length}`);

  let book1Updated = 0;
  for (const r of book1Rows) {
    const phone = cleanPhone(r[3]);
    if (!phone) continue;
    const l = leadByPhone.get(phone);
    if (l) {
      // If contactDate is not set, set to 2026-11-14 (when Book1 was imported)
      if (!l.contactDate) {
        await prisma.lead.update({
          where: { id: l.id },
          data: { contactDate: "2026-11-14" }
        });
        l.contactDate = "2026-11-14";
        book1Updated++;
      }
    }
  }
  console.log(`Book1 leads updated with date: ${book1Updated}`);

  // Load Ashok Leyland Data Sorting.xlsx
  console.log("\n=== STEP 3: SYNC ASHOK LEYLAND DATA SORTING.XLSX ===");
  const wbAL = xlsx.readFile(path.resolve(__dirname, "..", "Ashok Leyland Data Sorting.xlsx"));
  const wsAL = wbAL.Sheets[wbAL.SheetNames[0]];
  const alRows = xlsx.utils.sheet_to_json(wsAL);
  console.log(`Ashok Leyland total rows: ${alRows.length}`);

  // Find max lead number to generate unique lead numbers
  let maxLeadNum = 0;
  for (const l of dbLeads) {
    const m = l.leadNumber.match(/LD-(\d+)-(\d+)/) || l.leadNumber.match(/LD-(\d+)/);
    if (m) {
      const num = parseInt(m[m.length - 1], 10);
      if (num > maxLeadNum) maxLeadNum = num;
    }
  }
  console.log(`Starting lead number suffix from: ${maxLeadNum + 1}`);

  let alExistingUpdated = 0;
  let alNewCreated = 0;

  for (let i = 0; i < alRows.length; i++) {
    const r = alRows[i];
    const rawMobile = r["Mo .No."];
    const rawAltMobile = r["Alternate Mo No"];
    const p1 = cleanPhone(rawMobile);
    const p2 = cleanPhone(rawAltMobile);
    const phone = p1 || p2;

    if (!phone) continue;

    const callingDate = parseCallingDate(r["Calling Date"]);
    const salesperson = r["Sales Person"] ? String(r["Sales Person"]).trim() : "Sagar";
    const workshopName = r["Name / Workshop"] ? String(r["Name / Workshop"]).trim() : null;
    const city = r["City"] ? String(r["City"]).trim() : null;
    const state = r["State"] ? String(r["State"]).trim() : null;
    const remark = r["Remark"] ? String(r["Remark"]).trim() : null;
    const brand = r["Brand"] ? String(r["Brand"]).trim() : "Ashok Leyland";
    const status = mapStatus(remark);

    const existing = leadByPhone.get(phone) || (p2 && leadByPhone.get(p2));

    if (existing) {
      // Update missing date, workshop name, city, state, or salesperson
      const updates = {};
      if (callingDate && existing.contactDate !== callingDate) {
        updates.contactDate = callingDate;
      }
      if (workshopName && (!existing.companyName || existing.companyName.includes("Maruti") === false)) {
        updates.companyName = workshopName;
        updates.leadName = workshopName;
      }
      if (city && !existing.city) updates.city = city;
      if (state && !existing.state) updates.state = state;
      if (remark && (!existing.notes || existing.notes.length < remark.length)) {
        updates.notes = remark;
      }
      if (salesperson && (!existing.salesperson || existing.salesperson === "Sales Person")) {
        updates.salesperson = salesperson;
        updates.assignedUser = salesperson;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: updates
        });
        alExistingUpdated++;
      }
    } else {
      // Create new lead!
      maxLeadNum++;
      const newLeadNum = `LD-2026-${String(maxLeadNum).padStart(4, "0")}`;
      const displayName = workshopName || `Lead ${phone}`;

      const created = await prisma.lead.create({
        data: {
          leadNumber: newLeadNum,
          leadName: displayName,
          companyName: workshopName || displayName,
          contactPerson: workshopName || null,
          mobile: rawMobile ? String(rawMobile).trim() : (rawAltMobile ? String(rawAltMobile).trim() : phone),
          alternateMobile: rawAltMobile ? String(rawAltMobile).trim() : null,
          city: city,
          state: state,
          notes: remark,
          status: status,
          source: "Phone",
          salesperson: salesperson,
          assignedUser: salesperson,
          industry: "Automotive / Workshop",
          requirement: brand || "Ashok Leyland",
          contactDate: callingDate,
          importId: "import_ashok_leyland_sorting",
        }
      });

      leadByPhone.set(phone, created);
      if (p2) leadByPhone.set(p2, created);
      alNewCreated++;
    }
  }

  console.log(`Ashok Leyland sync results:`);
  console.log(`  Existing Leads Updated: ${alExistingUpdated}`);
  console.log(`  New Leads Created: ${alNewCreated}`);

  // Final count
  const finalLeads = await prisma.lead.count();
  const leadsWithDate = await prisma.lead.count({
    where: { contactDate: { not: null } }
  });
  console.log(`\n=== FINAL SUMMARY ===`);
  console.log(`Total Leads in DB: ${finalLeads}`);
  console.log(`Leads with real calling/contact dates: ${leadsWithDate}`);

  await prisma.$disconnect();
}

syncAndFixLeads().catch(console.error);
