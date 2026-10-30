import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

let isTableReady = false;
async function ensureQuotationTables() {
  if (isTableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Quotation" (
        "id" TEXT PRIMARY KEY,
        "quotationNumber" TEXT UNIQUE NOT NULL,
        "customerId" TEXT NOT NULL,
        "customerName" TEXT NOT NULL,
        "quotationDate" TEXT NOT NULL,
        "validUntil" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Draft',
        "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "termsAndConditions" TEXT,
        "notes" TEXT,
        "salesperson" TEXT,
        "salesOrderId" TEXT,
        "orderNumber" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "QuotationItem" (
        "id" TEXT PRIMARY KEY,
        "quotationId" TEXT NOT NULL,
        "itemType" TEXT NOT NULL DEFAULT 'PRODUCT',
        "productId" TEXT NOT NULL,
        "productName" TEXT NOT NULL,
        "sku" TEXT NOT NULL,
        "unit" TEXT DEFAULT 'PCS',
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "gstPercent" DOUBLE PRECISION NOT NULL DEFAULT 18,
        "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0
      );
    `);

    // Ensure quotationId and quotationNumber columns exist on SalesOrder
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "quotationId" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "quotationNumber" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "warrantyPeriod" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "QuotationItem" ADD COLUMN IF NOT EXISTS "warrantyPeriod" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "paymentMode" TEXT DEFAULT 'Prepaid';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "paymentMode" TEXT DEFAULT 'Prepaid';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "freightCharges" DOUBLE PRECISION DEFAULT 0;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "adjustment" DOUBLE PRECISION DEFAULT 0;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "contactPerson" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "shippingAddress" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "billingAddress" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "customerGst" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "deliveryTerms" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "warrantyTerms" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "signatory" TEXT DEFAULT 'Ms. Mayuri Shinde';
    `);

    isTableReady = true;
  } catch (err) {
    console.error('Error ensuring Quotation tables:', err);
  }
}

export async function GET() {
  try {
    await ensureQuotationTables();

    const rawQuotations: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Quotation" ORDER BY "createdAt" DESC`
    );

    const allItems: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "QuotationItem"`
    );

    const itemsByQuotationId = new Map<string, any[]>();
    allItems.forEach((item) => {
      const arr = itemsByQuotationId.get(item.quotationId) || [];
      arr.push(item);
      itemsByQuotationId.set(item.quotationId, arr);
    });

    const quotations = rawQuotations.map((q) => ({
      ...q,
      items: itemsByQuotationId.get(q.id) || [],
    }));

    return NextResponse.json({ success: true, data: quotations });
  } catch (error: any) {
    console.error('Failed to fetch quotations:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch quotations', data: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureQuotationTables();
    const body = await request.json();

    const id = body.id || `qt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const quotationNumber = body.quotationNumber || `QT-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    const subtotal = parseFloat(body.subtotal || 0);
    const discountAmount = parseFloat(body.discountAmount || 0);
    const taxAmount = parseFloat(body.taxAmount || 0);
    const totalAmount = parseFloat(body.totalAmount || body.grandTotal || subtotal + taxAmount - discountAmount || 0);

    await prisma.$executeRawUnsafe(
      `INSERT INTO "Quotation" (
        "id", "quotationNumber", "customerId", "customerName", "quotationDate",
        "validUntil", "status", "subtotal", "discountAmount", "taxAmount",
        "totalAmount", "warrantyPeriod", "paymentMode", "termsAndConditions", "notes", "salesperson", "salesOrderId",
        "orderNumber", "freightCharges", "adjustment", "contactPerson", "shippingAddress", "billingAddress", "customerGst", "customerPhone", "deliveryTerms", "warrantyTerms", "signatory", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22,
        $23, $24, $25, $26, $27, $28,
        $29::timestamp, $30::timestamp
      )`,
      id,
      quotationNumber,
      body.customerId || '',
      body.customerName || '',
      body.quotationDate || now.split('T')[0],
      body.validUntil || now.split('T')[0],
      body.status || 'Draft',
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      body.warrantyPeriod || '1 Year',
      body.paymentMode || 'Prepaid',
      body.termsAndConditions || null,
      body.notes || null,
      body.salesperson || null,
      body.salesOrderId || null,
      body.orderNumber || null,
      parseFloat(body.freightCharges || 0),
      parseFloat(body.adjustment || 0),
      body.contactPerson || null,
      body.shippingAddress || null,
      body.billingAddress || null,
      body.customerGst || null,
      body.customerPhone || null,
      body.deliveryTerms || null,
      body.warrantyTerms || null,
      body.signatory || 'Ms. Mayuri Shinde',
      now,
      now
    );

    // Insert line items
    const items = body.items || [];
    for (const item of items) {
      const itemId = item.id || `qti_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "QuotationItem" (
          "id", "quotationId", "itemType", "productId", "productName",
          "sku", "unit", "quantity", "rate", "discount",
          "gstPercent", "totalAmount", "warrantyPeriod"
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13
        )`,
        itemId,
        id,
        item.itemType || 'PRODUCT',
        item.productId || '',
        item.productName || '',
        item.sku || '',
        item.unit || 'PCS',
        parseInt(item.quantity || 1, 10),
        parseFloat(item.rate || item.unitPrice || item.sellingPrice || 0),
        parseFloat(item.discount || 0),
        parseFloat(item.gstPercent || 18),
        parseFloat(item.totalAmount || item.totalPrice || 0),
        item.warrantyPeriod || body.warrantyPeriod || '1 Year'
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Quotation created successfully',
        data: {
          id,
          quotationNumber,
          ...body,
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          warrantyPeriod: body.warrantyPeriod || '1 Year',
          createdAt: now,
          updatedAt: now,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create quotation:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create quotation' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await ensureQuotationTables();
    const body = await request.json();
    const { id, status, salesOrderId, orderNumber, notes, termsAndConditions, warrantyPeriod, paymentMode } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing quotation ID' }, { status: 400 });
    }

    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `UPDATE "Quotation"
       SET "status" = COALESCE($2, "status"),
           "salesOrderId" = COALESCE($3, "salesOrderId"),
           "orderNumber" = COALESCE($4, "orderNumber"),
           "notes" = COALESCE($5, "notes"),
           "termsAndConditions" = COALESCE($6, "termsAndConditions"),
           "warrantyPeriod" = COALESCE($7, "warrantyPeriod"),
           "paymentMode" = COALESCE($8, "paymentMode"),
           "updatedAt" = $9::timestamp
       WHERE "id" = $1`,
      id,
      status || null,
      salesOrderId || null,
      orderNumber || null,
      notes || null,
      termsAndConditions || null,
      warrantyPeriod || null,
      paymentMode || null,
      now
    );

    return NextResponse.json({ success: true, message: 'Quotation updated successfully' });
  } catch (error: any) {
    console.error('Failed to update quotation:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update quotation' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureQuotationTables();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing quotation ID' }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(`DELETE FROM "QuotationItem" WHERE "quotationId" = $1`, id);
    await prisma.$executeRawUnsafe(`DELETE FROM "Quotation" WHERE "id" = $1`, id);

    return NextResponse.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete quotation:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete quotation' },
      { status: 400 }
    );
  }
}
