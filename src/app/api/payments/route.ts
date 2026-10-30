import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

let isPaymentColumnsReady = false;
async function ensurePaymentColumns() {
  if (isPaymentColumnsReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CustomerPayment" ADD COLUMN IF NOT EXISTS "proofFiles" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CustomerPayment" ADD COLUMN IF NOT EXISTS "uploadedBy" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CustomerPayment" ADD COLUMN IF NOT EXISTS "uploadedDate" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CustomerPayment" ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CustomerPayment" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CustomerPayment" ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CustomerPayment" ADD COLUMN IF NOT EXISTS "verifiedDate" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CustomerPayment" ADD COLUMN IF NOT EXISTS "customerNumber" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CustomerPayment" ADD COLUMN IF NOT EXISTS "invoiceAmount" DOUBLE PRECISION;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CustomerPayment" ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CustomerPayment" ADD COLUMN IF NOT EXISTS "pendingAmount" DOUBLE PRECISION;
    `);
    isPaymentColumnsReady = true;
  } catch (err) {
    // Non-fatal if table/columns exist
  }
}

export async function GET(request: Request) {
  try {
    await ensurePaymentColumns();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'customer' | 'supplier' | 'all'

    let customerPayments: any[] = [];
    let supplierPayments: any[] = [];

    if (type !== 'supplier') {
      try {
        customerPayments = (await prisma.$queryRawUnsafe(`SELECT * FROM "CustomerPayment" ORDER BY "createdAt" DESC`)) as any[];
      } catch {
        customerPayments = await prisma.customerPayment.findMany({
          orderBy: { createdAt: 'desc' },
        });
      }
    }

    if (type !== 'customer') {
      supplierPayments = await prisma.supplierPayment.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        customerPayments: customerPayments.map((cp) => {
          let parsedProofs = [];
          if (cp.proofFiles) {
            try {
              parsedProofs = typeof cp.proofFiles === 'string' ? JSON.parse(cp.proofFiles) : cp.proofFiles;
            } catch {
              parsedProofs = [cp.proofFiles];
            }
          }
          return {
            ...cp,
            proofFiles: parsedProofs,
            uploadedBy: cp.uploadedBy || cp.createdBy,
            uploadedDate: cp.uploadedDate || (cp.createdAt ? new Date(cp.createdAt).toISOString() : undefined),
            verificationNotes: cp.verificationNotes || '',
            rejectionReason: cp.rejectionReason || '',
            verifiedBy: cp.verifiedBy || '',
            verifiedDate: cp.verifiedDate || '',
            customerNumber: cp.customerNumber || '',
            invoiceAmount: cp.invoiceAmount !== undefined && cp.invoiceAmount !== null ? parseFloat(cp.invoiceAmount) : undefined,
            paidAmount: cp.paidAmount !== undefined && cp.paidAmount !== null ? parseFloat(cp.paidAmount) : cp.amount,
            pendingAmount: cp.pendingAmount !== undefined && cp.pendingAmount !== null ? parseFloat(cp.pendingAmount) : 0,
          };
        }),
        supplierPayments,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensurePaymentColumns();
    const body = await request.json();
    const { paymentType } = body; // 'customer' or 'supplier'

    if (paymentType === 'supplier') {
      const newPayment = await prisma.supplierPayment.create({
        data: {
          paymentId: body.paymentId || `SPAY-${Date.now().toString().slice(-6)}`,
          supplierId: body.supplierId,
          supplierName: body.supplierName,
          billPoNumber: body.billPoNumber || body.poNumber || 'N/A',
          paymentDate: body.paymentDate || new Date().toISOString().split('T')[0],
          amount: parseFloat(body.amount || 0),
          paymentMode: body.paymentMode || 'NEFT',
          referenceNo: body.referenceNo || `REF-${Date.now().toString().slice(-5)}`,
          notes: body.notes || '',
          status: body.status || 'Completed',
        },
      });
      return NextResponse.json({ success: true, data: newPayment }, { status: 201 });
    } else {
      const paymentNumber = body.paymentNumber || `PAY-${Date.now().toString().slice(-6)}`;
      const newPayment = await prisma.customerPayment.create({
        data: {
          paymentNumber,
          customerId: body.customerId,
          customerName: body.customerName,
          invoiceId: body.invoiceId || 'N/A',
          invoiceNumber: body.invoiceNumber || 'N/A',
          paymentDate: body.paymentDate || new Date().toISOString().split('T')[0],
          amount: parseFloat(body.amount || 0),
          paymentMode: body.paymentMode || 'Bank Transfer',
          referenceNumber: body.referenceNumber || `TXN-${Date.now().toString().slice(-5)}`,
          notes: body.notes || '',
          status: body.status || 'Payment Proof Uploaded',
        },
      });

      // Update custom proof columns safely
      try {
        const proofStr = body.proofFiles
          ? Array.isArray(body.proofFiles)
            ? JSON.stringify(body.proofFiles)
            : body.proofFiles
          : null;
        if (proofStr) {
          await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "proofFiles" = $1 WHERE id = $2`, proofStr, newPayment.id);
        }
        if (body.uploadedBy) {
          await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "uploadedBy" = $1 WHERE id = $2`, body.uploadedBy, newPayment.id);
        }
        if (body.uploadedDate) {
          await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "uploadedDate" = $1 WHERE id = $2`, body.uploadedDate, newPayment.id);
        }
        if (body.customerNumber) {
          await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "customerNumber" = $1 WHERE id = $2`, body.customerNumber, newPayment.id);
        }
        if (body.invoiceAmount !== undefined) {
          await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "invoiceAmount" = $1 WHERE id = $2`, parseFloat(body.invoiceAmount), newPayment.id);
        }
        if (body.paidAmount !== undefined) {
          await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "paidAmount" = $1 WHERE id = $2`, parseFloat(body.paidAmount), newPayment.id);
        }
        if (body.pendingAmount !== undefined) {
          await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "pendingAmount" = $1 WHERE id = $2`, parseFloat(body.pendingAmount), newPayment.id);
        }
      } catch {}

      return NextResponse.json({ success: true, data: newPayment }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to record payment' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await ensurePaymentColumns();
    const body = await request.json();
    const { id, paymentNumber, ...data } = body;

    if (!id && !paymentNumber) {
      return NextResponse.json({ success: false, message: 'ID or paymentNumber is required for update' }, { status: 400 });
    }

    const existing = await prisma.customerPayment.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(paymentNumber ? [{ paymentNumber }] : []),
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Payment record not found' }, { status: 404 });
    }

    const updated = await prisma.customerPayment.update({
      where: { id: existing.id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.amount !== undefined && { amount: parseFloat(data.amount) }),
        ...(data.paymentDate && { paymentDate: data.paymentDate }),
        ...(data.paymentMode && { paymentMode: data.paymentMode }),
        ...(data.referenceNumber && { referenceNumber: data.referenceNumber }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    // Update extended proof columns safely
    try {
      if (data.proofFiles !== undefined) {
        const proofStr = Array.isArray(data.proofFiles) ? JSON.stringify(data.proofFiles) : data.proofFiles;
        await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "proofFiles" = $1 WHERE id = $2`, proofStr, existing.id);
      }
      if (data.verificationNotes !== undefined) {
        await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "verificationNotes" = $1 WHERE id = $2`, data.verificationNotes, existing.id);
      }
      if (data.rejectionReason !== undefined) {
        await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "rejectionReason" = $1 WHERE id = $2`, data.rejectionReason, existing.id);
      }
      if (data.verifiedBy) {
        await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "verifiedBy" = $1 WHERE id = $2`, data.verifiedBy, existing.id);
      }
      if (data.verifiedDate) {
        await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "verifiedDate" = $1 WHERE id = $2`, data.verifiedDate, existing.id);
      }
      if (data.uploadedBy) {
        await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "uploadedBy" = $1 WHERE id = $2`, data.uploadedBy, existing.id);
      }
      if (data.uploadedDate) {
        await prisma.$executeRawUnsafe(`UPDATE "CustomerPayment" SET "uploadedDate" = $1 WHERE id = $2`, data.uploadedDate, existing.id);
      }
    } catch {}

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update payment' },
      { status: 500 }
    );
  }
}
