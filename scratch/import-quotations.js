const { PrismaClient } = require("@prisma/client");
const xlsx = require("xlsx");
const path = require("path");

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

async function runImport() {
  const prisma = new PrismaClient();

  const filePath = path.resolve(__dirname, "..", "Quate.xlsx");
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  console.log(`Starting import of ${rows.length} rows from Quate.xlsx...`);

  // Ensure Ayush Kumar customer exists
  let ayush = await retry(() => prisma.customer.findFirst({
    where: { name: "Ayush Kumar" }
  }));

  if (!ayush) {
    const nextCode = "CUS-3609";
    ayush = await retry(() => prisma.customer.create({
      data: {
        customerCode: nextCode,
        name: "Ayush Kumar",
        companyName: "Ayush Kumar",
        contactPerson: "Ayush Kumar",
        mobile: "",
        alternateMobile: "",
        email: "",
        gstType: "Unregistered",
        address: "Ravet Pune",
        city: "Pune",
        state: "Maharashtra",
        pincode: "41104",
        country: "India",
        category: "Distributor",
        paymentTerms: "",
        status: "ACTIVE",
      }
    }));
    console.log(`Created customer for Ayush Kumar: ${ayush.customerCode} (${ayush.id})`);
  }

  // Load all customers for lookup
  const customers = await retry(() => prisma.customer.findMany({
    select: {
      id: true,
      customerCode: true,
      name: true,
      companyName: true,
      mobile: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      country: true,
    }
  }));

  const norm = s => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const customerMap = new Map();
  for (const c of customers) {
    if (c.name) customerMap.set(norm(c.name), c);
    if (c.companyName) customerMap.set(norm(c.companyName), c);
    if (c.customerCode) customerMap.set(norm(c.customerCode), c);
  }

  // Check existing quotation numbers to avoid collision or duplication
  const existingQuotes = await retry(() => prisma.quotation.findMany({
    select: { quotationNumber: true }
  }));
  const existingQNumSet = new Set(existingQuotes.map(q => q.quotationNumber));
  console.log(`Found ${existingQNumSet.size} existing quotations in DB.`);

  let createdCount = 0;
  let skippedCount = 0;
  const batchSize = 100;

  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    
    await retry(async () => {
      await prisma.$transaction(async (tx) => {
        for (const r of chunk) {
          const rawQuoteNum = String(r["Quote Number"]).trim();
          const quoteNo = r["Quote_NO"] ? String(r["Quote_NO"]).trim() : null;
          const finalQuotationNumber = quoteNo ? quoteNo : `QT-${rawQuoteNum}`;

          if (existingQNumSet.has(finalQuotationNumber)) {
            skippedCount++;
            continue;
          }

          const acc = norm(r["Account Name"]);
          let cust = customerMap.get(acc);
          if (!cust && acc === "na") {
            cust = ayush;
          }

          if (!cust) {
            throw new Error(`Customer still not found: "${r['Account Name']}"`);
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

          await tx.quotation.create({
            data: {
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
              items: {
                create: [
                  {
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
                  }
                ]
              }
            }
          });

          existingQNumSet.add(finalQuotationNumber);
          createdCount++;
        }
      }, {
        timeout: 30000
      });
    });

    console.log(`Processed ${Math.min(i + batchSize, rows.length)} / ${rows.length} rows... (Created: ${createdCount}, Skipped: ${skippedCount})`);
  }

  console.log(`\nImport Completed Successfully!`);
  console.log(`Total Created: ${createdCount}`);
  console.log(`Total Skipped: ${skippedCount}`);

  await prisma.$disconnect();
}

runImport().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
