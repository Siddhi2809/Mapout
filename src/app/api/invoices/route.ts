import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

let isInvoiceColumnsReady = false;
async function ensureInvoiceColumns() {
  if (isInvoiceColumnsReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesInvoice" ADD COLUMN IF NOT EXISTS "quotationId" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesInvoice" ADD COLUMN IF NOT EXISTS "quotationNumber" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesInvoice" ADD COLUMN IF NOT EXISTS "customerNumber" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesInvoice" ADD COLUMN IF NOT EXISTS "invoiceStatus" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesInvoice" ADD COLUMN IF NOT EXISTS "productionStatus" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesInvoice" ADD COLUMN IF NOT EXISTS "packedImages" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesInvoice" ADD COLUMN IF NOT EXISTS "paymentProofFiles" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesInvoice" ADD COLUMN IF NOT EXISTS "paymentProofUploadedBy" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesInvoice" ADD COLUMN IF NOT EXISTS "paymentProofUploadedDate" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesInvoice" ADD COLUMN IF NOT EXISTS "paymentVerificationNotes" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesInvoice" ADD COLUMN IF NOT EXISTS "paymentRejectionReason" TEXT;
    `);
    isInvoiceColumnsReady = true;
  } catch (err) {
    // Non-fatal if table/columns exist
  }
}

export async function GET() {
  try {
    await ensureInvoiceColumns();
    let invoices: any[] = [];
    try {
      invoices = (await prisma.$queryRawUnsafe(`SELECT * FROM "SalesInvoice" ORDER BY "createdAt" DESC`)) as any[];
    } catch {
      invoices = await prisma.salesInvoice.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    const formatted = invoices.map((inv) => {
      let parsedProofFiles: string[] = [];
      if (inv.paymentProofFiles) {
        try {
          parsedProofFiles = typeof inv.paymentProofFiles === 'string' ? JSON.parse(inv.paymentProofFiles) : inv.paymentProofFiles;
        } catch {
          parsedProofFiles = [inv.paymentProofFiles];
        }
      }
      return {
        ...inv,
        subtotal: inv.subtotal !== undefined && inv.subtotal !== null ? parseFloat(inv.subtotal) : 0,
        discountAmount: inv.discountAmount !== undefined && inv.discountAmount !== null ? parseFloat(inv.discountAmount) : 0,
        gstAmount: inv.gstAmount !== undefined && inv.gstAmount !== null ? parseFloat(inv.gstAmount) : 0,
        grandTotal: inv.grandTotal !== undefined && inv.grandTotal !== null ? parseFloat(inv.grandTotal) : 0,
        paidAmount: inv.paidAmount !== undefined && inv.paidAmount !== null ? parseFloat(inv.paidAmount) : 0,
        outstandingAmount: inv.outstandingAmount !== undefined && inv.outstandingAmount !== null ? parseFloat(inv.outstandingAmount) : 0,
        paymentProofFiles: parsedProofFiles,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureInvoiceColumns();
    const body = await request.json();
    const newInvoice = await prisma.salesInvoice.create({
      data: {
        invoiceNumber: body.invoiceNumber,
        invoiceDate: body.invoiceDate || new Date().toISOString().split('T')[0],
        salesOrderId: body.salesOrderId || 'N/A',
        salesOrderNumber: body.salesOrderNumber || 'N/A',
        customerId: body.customerId,
        customerName: body.customerName,
        gstNumber: body.gstNumber,
        subtotal: parseFloat(body.subtotal || 0),
        discountAmount: parseFloat(body.discountAmount || 0),
        gstAmount: parseFloat(body.gstAmount || 0),
        grandTotal: parseFloat(body.grandTotal || 0),
        paidAmount: parseFloat(body.paidAmount || 0),
        outstandingAmount: parseFloat(body.outstandingAmount || 0),
        paymentStatus: body.paymentStatus || 'Unpaid',
        status: body.status || 'Active',
        termsAndConditions: body.termsAndConditions,
        createdBy: body.createdBy,
      },
    });
    return NextResponse.json({ success: true, data: newInvoice }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create invoice' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await ensureInvoiceColumns();
    const body = await request.json();
    const { id, invoiceNumber, ...data } = body;
    if (!id && !invoiceNumber) {
      return NextResponse.json({ success: false, message: 'ID or Invoice Number is required for update' }, { status: 400 });
    }

    const existing = await prisma.salesInvoice.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(invoiceNumber ? [{ invoiceNumber }] : []),
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Invoice not found in database' }, { status: 404 });
    }

    const updated = await prisma.salesInvoice.update({
      where: { id: existing.id },
      data: {
        ...(data.salesOrderId && { salesOrderId: data.salesOrderId }),
        ...(data.salesOrderNumber && { salesOrderNumber: data.salesOrderNumber }),
        ...(data.paidAmount !== undefined && { paidAmount: parseFloat(data.paidAmount) }),
        ...(data.outstandingAmount !== undefined && { outstandingAmount: parseFloat(data.outstandingAmount) }),
        ...(data.paymentStatus && { paymentStatus: data.paymentStatus }),
        ...(data.status && { status: data.status }),
      },
    });

    // Also persist extended payment proof columns safely
    try {
      if (data.invoiceStatus) {
        await prisma.$executeRawUnsafe(`UPDATE "SalesInvoice" SET "invoiceStatus" = $1 WHERE id = $2`, data.invoiceStatus, existing.id);
      }
      if (data.productionStatus) {
        await prisma.$executeRawUnsafe(`UPDATE "SalesInvoice" SET "productionStatus" = $1 WHERE id = $2`, data.productionStatus, existing.id);
      }
      if (data.salesOrderId) {
        await prisma.$executeRawUnsafe(`UPDATE "SalesInvoice" SET "salesOrderId" = $1 WHERE id = $2`, data.salesOrderId, existing.id);
      }
      if (data.salesOrderNumber) {
        await prisma.$executeRawUnsafe(`UPDATE "SalesInvoice" SET "salesOrderNumber" = $1 WHERE id = $2`, data.salesOrderNumber, existing.id);
      }
      if (data.customerNumber) {
        await prisma.$executeRawUnsafe(`UPDATE "SalesInvoice" SET "customerNumber" = $1 WHERE id = $2`, data.customerNumber, existing.id);
      }
      if (data.paymentProofFiles !== undefined) {
        const proofStr = Array.isArray(data.paymentProofFiles) ? JSON.stringify(data.paymentProofFiles) : data.paymentProofFiles;
        await prisma.$executeRawUnsafe(`UPDATE "SalesInvoice" SET "paymentProofFiles" = $1 WHERE id = $2`, proofStr, existing.id);
      }
      if (data.paymentProofUploadedBy) {
        await prisma.$executeRawUnsafe(`UPDATE "SalesInvoice" SET "paymentProofUploadedBy" = $1 WHERE id = $2`, data.paymentProofUploadedBy, existing.id);
      }
      if (data.paymentProofUploadedDate) {
        await prisma.$executeRawUnsafe(`UPDATE "SalesInvoice" SET "paymentProofUploadedDate" = $1 WHERE id = $2`, data.paymentProofUploadedDate, existing.id);
      }
      if (data.paymentVerificationNotes !== undefined) {
        await prisma.$executeRawUnsafe(`UPDATE "SalesInvoice" SET "paymentVerificationNotes" = $1 WHERE id = $2`, data.paymentVerificationNotes, existing.id);
      }
      if (data.paymentRejectionReason !== undefined) {
        await prisma.$executeRawUnsafe(`UPDATE "SalesInvoice" SET "paymentRejectionReason" = $1 WHERE id = $2`, data.paymentRejectionReason, existing.id);
      }
    } catch {}

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
