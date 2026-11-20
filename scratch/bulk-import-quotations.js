const { PrismaClient } = require("@prisma/client");
const xlsx = require("xlsx");
const path = require("path");
const crypto = require("crypto");

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

function cuidLike() {
  return "c" + crypto.randomBytes(12).toString("hex");
}

async function retry(fn, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`[Retry ${i + 1}/${retries}] Retrying after error: ${err.message || err}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function runBulkImport() {
  const prisma = new PrismaClient();

  const filePath = path.resolve(__dirname, "..", "Quate.xlsx");
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  console.log(`Loaded ${rows.length} rows from Quate.xlsx.`);

  // Load all customers
  const customers = await retry(() => prisma.customer.findMany({
    select: {
      id: true,
      customerCode: true,
      name: true,
      companyName: true,
      mobile: true,
      address: true,
    }
  }));

  const norm = s => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const customerMap = new Map();
  for (const c of customers) {
    if (c.name) customerMap.set(norm(c.name), c);
    if (c.companyName) customerMap.set(norm(c.companyName), c);
    if (c.customerCode) customerMap.set(norm(c.customerCode), c);
  }

  const ayush = customerMap.get("ayush kumar");
  if (!ayush) {
    throw new Error("Ayush Kumar customer not found in DB!");
  }

  // Load all existing quotation numbers to prevent any duplicate insertion
  const existingQuotes = await retry(() => prisma.quotation.findMany({
    select: { quotationNumber: true }
  }));
  const existingSet = new Set(existingQuotes.map(q => q.quotationNumber));
  console.log(`Found ${existingSet.size} quotations currently in DB.`);

  // Prepare objects for createMany
  const quotationBatch = [];
  const quotationItemsBatch = [];

  for (const r of rows) {
    const rawQuoteNum = String(r["Quote Number"]).trim();
    const quoteNo = r["Quote_NO"] ? String(r["Quote_NO"]).trim() : null;
    const finalQuotationNumber = quoteNo ? quoteNo : `QT-${rawQuoteNum}`;

    if (existingSet.has(finalQuotationNumber)) {
      continue;
    }

    const acc = norm(r["Account Name"]);
    let cust = customerMap.get(acc);
    if (!cust && acc === "na") {
      cust = ayush;
    }

    if (!cust) {
      console.warn(`Skipping missing customer for: "${r['Account Name']}"`);
      continue;
    }

    const qDate = excelDateToISO(r["Created Time"]) || new Date().toISOString().split("T")[0];
    const validUntil = excelDateToISO(r["Valid Until"]) || qDate;
    const subtotal = Number(r["Sub Total"]) || 0;
    const discountAmount = Number(r["Discount"]) || 0;
    const taxAmount = Number(r["Tax"]) || 0;
    const totalAmount = Number(r["Grand Total"]) || Number(r["Order Total"]) || subtotal;

    const billingParts = [
      r["Billing Street"],
      r["Billing City"],
      r["Billing State"],
      r["Billing Code"],
      r["Billing Country"]
    ].filter(Boolean).join(", ");

    const shippingParts = [
      r["Shipping Street"],
      r["Shipping City"],
      r["Shipping State"],
      r["Shipping Code"],
      r["Shipping Country"]
    ].filter(Boolean).join(", ");

    const contactPerson = r["Contact Name"] ? String(r["Contact Name"]).trim() : cust.name;
    const salesperson = r["Description"] ? String(r["Description"]).trim() : null;
    const notes = [r["Deal Name"], r["Subject"]].filter(Boolean).join(" | ");

    const qId = cuidLike();

    quotationBatch.push({
      id: qId,
      quotationNumber: finalQuotationNumber,
      customerId: cust.id,
      customerName: cust.companyName || cust.name,
      quotationDate: qDate,
      validUntil: validUntil,
      status: "Sent",
      subtotal: subtotal,
      discountAmount: discountAmount,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      notes: notes || null,
      termsAndConditions: "Standard Quotation Terms & Conditions",
      salesperson: salesperson,
      billingAddress: billingParts || cust.address || "",
      shippingAddress: shippingParts || billingParts || cust.address || "",
      contactPerson: contactPerson,
      customerPhone: cust.mobile || (r["Billing Code"] && String(r["Billing Code"]).length === 10 ? String(r["Billing Code"]) : null),
    });

    quotationItemsBatch.push({
      id: cuidLike(),
      quotationId: qId,
      itemType: "PRODUCT",
      productId: "LEGACY_CRM",
      productName: r["Subject"] ? String(r["Subject"]).trim() : (r["Deal Name"] ? String(r["Deal Name"]).trim() : "Quotation Item"),
      sku: quoteNo || "LEGACY",
      unit: "PCS",
      quantity: 1,
      rate: subtotal,
      discount: discountAmount,
      gstPercent: subtotal > 0 ? Math.round((taxAmount / subtotal) * 100) : 18,
      totalAmount: totalAmount,
    });

    existingSet.add(finalQuotationNumber);
  }

  console.log(`Prepared ${quotationBatch.length} new quotations and items to insert.`);

  // Insert in chunks of 500 using createMany (single fast SQL INSERT statements)
  const chunkSize = 500;
  for (let i = 0; i < quotationBatch.length; i += chunkSize) {
    const qChunk = quotationBatch.slice(i, i + chunkSize);
    const itemChunk = quotationItemsBatch.slice(i, i + chunkSize);

    await retry(async () => {
      await prisma.quotation.createMany({
        data: qChunk,
        skipDuplicates: true,
      });
      await prisma.quotationItem.createMany({
        data: itemChunk,
        skipDuplicates: true,
      });
    });

    console.log(`Inserted ${Math.min(i + chunkSize, quotationBatch.length)} / ${quotationBatch.length} quotations.`);
  }

  const finalCount = await prisma.quotation.count();
  const finalItemsCount = await prisma.quotationItem.count();
  console.log(`\nImport Done! Current Quotations in DB: ${finalCount}, Items: ${finalItemsCount}`);

  await prisma.$disconnect();
}

runBulkImport().catch(err => {
  console.error("Bulk import failed:", err);
  process.exit(1);
});
