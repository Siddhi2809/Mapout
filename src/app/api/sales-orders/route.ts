import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    try {
      await prisma.$executeRawUnsafe(`DISCARD PLANS`);
    } catch {
      // Ignore if not supported
    }

    // Query full orders with raw SQL to ensure all columns (packedImage, productTeamRemarks, batchNumber, etc.) are included
    let rawOrders: any[] = [];
    try {
      rawOrders = await prisma.$queryRawUnsafe(
        `SELECT * FROM "SalesOrder" ORDER BY "createdAt" DESC`
      );
    } catch (e: any) {
      if (e.message?.includes('cached plan')) {
        await prisma.$executeRawUnsafe(`DEALLOCATE ALL`);
        rawOrders = await prisma.$queryRawUnsafe(
          `SELECT * FROM "SalesOrder" ORDER BY "createdAt" DESC`
        );
      } else {
        throw e;
      }
    }

    // Also get items for each order
    const allItems: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "SalesOrderItem"`
    );

    const itemsByOrderId = new Map<string, any[]>();
    allItems.forEach((item) => {
      const arr = itemsByOrderId.get(item.salesOrderId) || [];
      arr.push(item);
      itemsByOrderId.set(item.salesOrderId, arr);
    });

    // Auto-sync: Ensure any quotation sent to production has a SalesOrder record
    try {
      const prodQuotes: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "Quotation"
        WHERE "status" IN ('Sent to Production', 'In Production', 'Production Completed', 'Packing', 'Packed', 'Ready for Dispatch')
      `);

      for (const q of prodQuotes) {
        const hasSo = rawOrders.some(
          (o) =>
            (q.orderNumber && o.orderNumber === q.orderNumber) ||
            (q.salesOrderId && o.id === q.salesOrderId) ||
            (o.quotationNumber && o.quotationNumber === q.quotationNumber)
        );

        if (!hasSo) {
          const soNum = q.orderNumber || `SO-${q.quotationNumber?.replace('QT-', '') || Math.floor(1000 + Math.random() * 9000)}`;

          let qItems: any[] = [];
          try {
            qItems = await prisma.$queryRawUnsafe(
              `SELECT * FROM "QuotationItem" WHERE "quotationId" = $1`,
              q.id
            );
          } catch {}

          const newSo = await prisma.salesOrder.create({
            data: {
              orderNumber: soNum,
              salesChannel: 'Distributor',
              salesperson: q.salesperson || 'Sales Person',
              customerId: q.customerId,
              customerName: q.customerName,
              orderDate: q.quotationDate || new Date().toISOString().split('T')[0],
              dueDate: q.validUntil || new Date().toISOString().split('T')[0],
              subtotal: parseFloat(q.subtotal || 0),
              discountAmount: parseFloat(q.discountAmount || 0),
              taxAmount: parseFloat(q.taxAmount || 0),
              grandTotal: parseFloat(q.totalAmount || 0),
              totalAmount: parseFloat(q.totalAmount || 0),
              amountPaid: 0,
              pendingAmount: parseFloat(q.totalAmount || 0),
              paymentStatus: 'UNPAID',
              dispatchStatus: 'PENDING',
              orderStatus: 'Sent to Production',
              createdBy: q.salesperson || 'Sales Desk',
              items: {
                create: qItems.map((qi: any) => ({
                  productId: qi.productId,
                  productName: qi.productName,
                  sku: qi.sku,
                  quantity: parseInt(qi.quantity || 1, 10),
                  sellingPrice: parseFloat(qi.rate || 0),
                  unitPrice: parseFloat(qi.rate || 0),
                  discount: parseFloat(qi.discount || 0),
                  gstPercent: parseFloat(qi.gstPercent || 18),
                  totalPrice: parseFloat(qi.totalAmount || 0),
                })),
              },
            },
            include: { items: true },
          });

          try {
            await prisma.$executeRawUnsafe(
              `UPDATE "SalesOrder" SET "quotationId" = $1, "quotationNumber" = $2, "productionStatus" = 'Sent to Production' WHERE "id" = $3`,
              q.id,
              q.quotationNumber,
              newSo.id
            );
            await prisma.$executeRawUnsafe(
              `UPDATE "Quotation" SET "salesOrderId" = $1, "orderNumber" = $2 WHERE "id" = $3`,
              newSo.id,
              soNum,
              q.id
            );
          } catch {}

          itemsByOrderId.set(newSo.id, newSo.items);
          rawOrders.unshift({
            ...newSo,
            quotationId: q.id,
            quotationNumber: q.quotationNumber,
            productionStatus: 'Sent to Production',
          });
        }
      }
    } catch (syncErr) {
      console.warn('Auto-sync quotations error:', syncErr);
    }

    const orders = rawOrders.map((o) => {
      let parsedImages: string[] = [];
      if (o.productionImages) {
        try {
          parsedImages = typeof o.productionImages === 'string' ? JSON.parse(o.productionImages) : o.productionImages;
        } catch {
          parsedImages = [o.productionImages];
        }
      } else if (o.packedImage) {
        parsedImages = [o.packedImage];
      }

      return {
        ...o,
        productionImages: parsedImages,
        items: itemsByOrderId.get(o.id) || [],
      };
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch sales orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newOrder = await prisma.salesOrder.create({
      data: {
        orderNumber: body.orderNumber,
        salesChannel: body.salesChannel || 'Website',
        salesperson: body.salesperson,
        shippingDetails: body.shippingDetails,
        invoiceNumber: body.invoiceNumber,
        customerId: body.customerId,
        customerName: body.customerName,
        orderDate: body.orderDate || new Date().toISOString().split('T')[0],
        dueDate: body.dueDate || new Date().toISOString().split('T')[0],
        subtotal: parseFloat(body.subtotal || 0),
        discountAmount: parseFloat(body.discountAmount || 0),
        taxAmount: parseFloat(body.taxAmount || 0),
        grandTotal: parseFloat(body.grandTotal || 0),
        amountPaid: parseFloat(body.amountPaid || 0),
        amountOutstanding: parseFloat(body.amountOutstanding || 0),
        pendingAmount: parseFloat(body.pendingAmount || 0),
        totalAmount: parseFloat(body.totalAmount || body.grandTotal || 0),
        paymentStatus: body.paymentStatus || 'UNPAID',
        dispatchStatus: body.dispatchStatus || 'PENDING',
        orderStatus: body.orderStatus || 'CONFIRMED',
        createdBy: body.createdBy || 'Sales Desk',
        packedImage: body.packedImage || null,
        productTeamRemarks: body.productTeamRemarks || null,
        batchNumber: body.batchNumber || null,
        serialNumber: body.serialNumber || null,
        items: {
          create: (body.items || []).map((i: any) => ({
            productId: i.productId,
            productName: i.productName,
            sku: i.sku,
            quantity: parseInt(i.quantity || 1, 10),
            sellingPrice: parseFloat(i.sellingPrice || 0),
            unitPrice: parseFloat(i.unitPrice || i.sellingPrice || 0),
            discount: parseFloat(i.discount || 0),
            gstPercent: parseFloat(i.gstPercent || 18),
            totalPrice: parseFloat(i.totalPrice || 0),
          })),
        },
      },
      include: { items: true },
    });

    // Link Quotation and ensure Production columns exist
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "quotationId" TEXT;`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "quotationNumber" TEXT;`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "productionStatus" TEXT;`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "packingStatus" TEXT;`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "productionNotes" TEXT;`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "packingNotes" TEXT;`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "productionDate" TEXT;`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "packingDate" TEXT;`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "productionImages" TEXT;`
      );

      const initialProdStatus =
        body.productionStatus ||
        (body.orderStatus === 'Sent to Production' || body.orderStatus === 'Sent to Product'
          ? 'Sent to Production'
          : null);

      if (body.quotationId || body.quotationNumber || initialProdStatus) {
        await prisma.$executeRawUnsafe(
          `UPDATE "SalesOrder" 
           SET "quotationId" = COALESCE($1, "quotationId"), 
               "quotationNumber" = COALESCE($2, "quotationNumber"), 
               "productionStatus" = COALESCE($3, "productionStatus") 
           WHERE id = $4`,
          body.quotationId || null,
          body.quotationNumber || null,
          initialProdStatus || null,
          newOrder.id
        );
      }
    } catch (qErr) {
      console.warn('Quotation/Production linking warning:', qErr);
    }

    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create sales order' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      orderNumber,
      orderStatus,
      dispatchStatus,
      paymentStatus,
      packedImage,
      productTeamRemarks,
      batchNumber,
      serialNumber,
      sentToProductDate,
      productionStatus,
      packingStatus,
      productionNotes,
      packingNotes,
      productionDate,
      packingDate,
      productionImages,
      quotationId,
      quotationNumber,
      paymentMode,
    } = body;

    if (!id && !orderNumber) {
      return NextResponse.json({ success: false, message: 'ID or Order Number is required' }, { status: 400 });
    }

    // 1. Ensure table columns exist
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "productionStatus" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "packingStatus" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "productionNotes" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "packingNotes" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "productionDate" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "packingDate" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "productionImages" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "quotationId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "quotationNumber" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "paymentMode" TEXT DEFAULT 'Prepaid';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "rawMaterialsDeducted" BOOLEAN DEFAULT false;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "rawMaterialsUsed" TEXT;`);
    } catch (e: any) {
      console.warn('ALTER TABLE check warning:', e.message);
    }

    // 2. Direct SQL update for all production, packing, remarks, images, and status fields
    const targetIdentifier = id || orderNumber;
    const isById = Boolean(id);
    const serializedImages = productionImages ? JSON.stringify(productionImages) : null;

    try {
      if (
        body.paymentStatus !== undefined ||
        body.amountPaid !== undefined ||
        body.amountOutstanding !== undefined ||
        body.pendingAmount !== undefined ||
        body.rawMaterialsDeducted !== undefined ||
        body.rawMaterialsUsed !== undefined
      ) {
        await prisma.salesOrder.update({
          where: isById ? { id: targetIdentifier } : { orderNumber: targetIdentifier },
          data: {
            ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
            ...(body.amountPaid !== undefined && { amountPaid: parseFloat(body.amountPaid) }),
            ...(body.amountOutstanding !== undefined && { amountOutstanding: parseFloat(body.amountOutstanding) }),
            ...(body.pendingAmount !== undefined && { pendingAmount: parseFloat(body.pendingAmount) }),
            ...(body.rawMaterialsDeducted !== undefined && { rawMaterialsDeducted: Boolean(body.rawMaterialsDeducted) }),
            ...(body.rawMaterialsUsed !== undefined && {
              rawMaterialsUsed: typeof body.rawMaterialsUsed === 'string' ? body.rawMaterialsUsed : JSON.stringify(body.rawMaterialsUsed),
            }),
          },
        });
      }
    } catch (payUpErr: any) {
      console.warn('SalesOrder payment/materials update warning:', payUpErr.message);
    }

    try {
      if (isById) {
        await prisma.$executeRawUnsafe(
          `UPDATE "SalesOrder" 
           SET "packedImage" = COALESCE($1, "packedImage"),
               "productTeamRemarks" = COALESCE($2, "productTeamRemarks"),
               "batchNumber" = COALESCE($3, "batchNumber"),
               "serialNumber" = COALESCE($4, "serialNumber"),
               "sentToProductDate" = COALESCE($5, "sentToProductDate"),
               "orderStatus" = COALESCE($6, "orderStatus"),
               "dispatchStatus" = COALESCE($7, "dispatchStatus"),
               "productionStatus" = COALESCE($8, "productionStatus"),
               "packingStatus" = COALESCE($9, "packingStatus"),
               "productionNotes" = COALESCE($10, "productionNotes"),
               "packingNotes" = COALESCE($11, "packingNotes"),
               "productionDate" = COALESCE($12, "productionDate"),
               "packingDate" = COALESCE($13, "packingDate"),
               "productionImages" = COALESCE($14, "productionImages"),
               "quotationId" = COALESCE($15, "quotationId"),
               "quotationNumber" = COALESCE($16, "quotationNumber"),
               "paymentMode" = COALESCE($17, "paymentMode"),
               "rawMaterialsDeducted" = COALESCE($18, "rawMaterialsDeducted"),
               "rawMaterialsUsed" = COALESCE($19, "rawMaterialsUsed")
           WHERE "id" = $20`,
          packedImage !== undefined ? packedImage : null,
          productTeamRemarks !== undefined ? productTeamRemarks : null,
          batchNumber !== undefined ? batchNumber : null,
          serialNumber !== undefined ? serialNumber : null,
          sentToProductDate !== undefined ? sentToProductDate : null,
          orderStatus !== undefined ? orderStatus : null,
          dispatchStatus !== undefined ? dispatchStatus : null,
          productionStatus !== undefined ? productionStatus : null,
          packingStatus !== undefined ? packingStatus : null,
          productionNotes !== undefined ? productionNotes : null,
          packingNotes !== undefined ? packingNotes : null,
          productionDate !== undefined ? productionDate : null,
          packingDate !== undefined ? packingDate : null,
          serializedImages !== null ? serializedImages : null,
          quotationId !== undefined ? quotationId : null,
          quotationNumber !== undefined ? quotationNumber : null,
          paymentMode !== undefined ? paymentMode : null,
          body.rawMaterialsDeducted !== undefined ? Boolean(body.rawMaterialsDeducted) : null,
          body.rawMaterialsUsed !== undefined ? (typeof body.rawMaterialsUsed === 'string' ? body.rawMaterialsUsed : JSON.stringify(body.rawMaterialsUsed)) : null,
          targetIdentifier
        );
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE "SalesOrder" 
           SET "packedImage" = COALESCE($1, "packedImage"),
               "productTeamRemarks" = COALESCE($2, "productTeamRemarks"),
               "batchNumber" = COALESCE($3, "batchNumber"),
               "serialNumber" = COALESCE($4, "serialNumber"),
               "sentToProductDate" = COALESCE($5, "sentToProductDate"),
               "orderStatus" = COALESCE($6, "orderStatus"),
               "dispatchStatus" = COALESCE($7, "dispatchStatus"),
               "productionStatus" = COALESCE($8, "productionStatus"),
               "packingStatus" = COALESCE($9, "packingStatus"),
               "productionNotes" = COALESCE($10, "productionNotes"),
               "packingNotes" = COALESCE($11, "packingNotes"),
               "productionDate" = COALESCE($12, "productionDate"),
               "packingDate" = COALESCE($13, "packingDate"),
               "productionImages" = COALESCE($14, "productionImages"),
               "quotationId" = COALESCE($15, "quotationId"),
               "quotationNumber" = COALESCE($16, "quotationNumber"),
               "paymentMode" = COALESCE($17, "paymentMode"),
               "rawMaterialsDeducted" = COALESCE($18, "rawMaterialsDeducted"),
               "rawMaterialsUsed" = COALESCE($19, "rawMaterialsUsed")
           WHERE "orderNumber" = $20`,
          packedImage !== undefined ? packedImage : null,
          productTeamRemarks !== undefined ? productTeamRemarks : null,
          batchNumber !== undefined ? batchNumber : null,
          serialNumber !== undefined ? serialNumber : null,
          sentToProductDate !== undefined ? sentToProductDate : null,
          orderStatus !== undefined ? orderStatus : null,
          dispatchStatus !== undefined ? dispatchStatus : null,
          productionStatus !== undefined ? productionStatus : null,
          packingStatus !== undefined ? packingStatus : null,
          productionNotes !== undefined ? productionNotes : null,
          packingNotes !== undefined ? packingNotes : null,
          productionDate !== undefined ? productionDate : null,
          packingDate !== undefined ? packingDate : null,
          serializedImages !== null ? serializedImages : null,
          quotationId !== undefined ? quotationId : null,
          quotationNumber !== undefined ? quotationNumber : null,
          paymentMode !== undefined ? paymentMode : null,
          body.rawMaterialsDeducted !== undefined ? Boolean(body.rawMaterialsDeducted) : null,
          body.rawMaterialsUsed !== undefined ? (typeof body.rawMaterialsUsed === 'string' ? body.rawMaterialsUsed : JSON.stringify(body.rawMaterialsUsed)) : null,
          targetIdentifier
        );
      }
    } catch (sqlErr: any) {
      console.warn('Raw SQL update warning:', sqlErr.message);
    }

    // Sync status to linked Quotation if orderStatus or dispatchStatus changed
    const effectiveStatus =
      dispatchStatus === 'DISPATCHED' || dispatchStatus === 'Dispatched'
        ? 'Dispatched'
        : orderStatus || (dispatchStatus === 'Ready to Dispatch' ? 'Ready for Dispatch' : undefined);

    if (effectiveStatus) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "Quotation"
           SET "status" = $1, "updatedAt" = NOW()
           WHERE "id" IN (SELECT "quotationId" FROM "SalesOrder" WHERE ${isById ? 'id = $2' : '"orderNumber" = $2'} AND "quotationId" IS NOT NULL)
              OR "salesOrderId" = $2
              OR "orderNumber" = (SELECT "orderNumber" FROM "SalesOrder" WHERE ${isById ? 'id = $2' : '"orderNumber" = $2'} LIMIT 1)`,
          effectiveStatus,
          targetIdentifier
        );
      } catch (qErr) {
        // ignore if quotation table not present
      }
    }

    // 3. Re-fetch full updated record from DB with all columns
    const fullRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "SalesOrder" WHERE ${isById ? 'id = $1' : '"orderNumber" = $1'} LIMIT 1`,
      targetIdentifier
    );

    const record = fullRows?.[0] || { id, orderNumber, ...body };

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update sales order in DB' },
      { status: 400 }
    );
  }
}

