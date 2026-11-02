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

      if (o.packedImage && !parsedImages.includes(o.packedImage)) {
        parsedImages.unshift(o.packedImage);
      }

      return {
        ...o,
        productionImages: parsedImages,
        packedImage: o.packedImage || (parsedImages.length > 0 ? parsedImages[0] : null),
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
        productionImages: body.productionImages
          ? Array.isArray(body.productionImages)
            ? JSON.stringify(body.productionImages)
            : body.productionImages
          : null,
        productionStatus: body.productionStatus || null,
        packingStatus: body.packingStatus || null,
        quotationId: body.quotationId || null,
        quotationNumber: body.quotationNumber || null,
        paymentMode: body.paymentMode || 'Prepaid',
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

    // 2. Locate or auto-create target SalesOrder in database
    const targetIdentifier = id || orderNumber;

    let targetOrder = await prisma.salesOrder.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(orderNumber ? [{ orderNumber }] : []),
          ...(id ? [{ orderNumber: id }] : []),
        ],
      },
    });

    if (!targetOrder && (id || orderNumber)) {
      try {
        targetOrder = await prisma.salesOrder.create({
          data: {
            id: id && !id.startsWith('so_synth') && !id.startsWith('temp_') ? id : undefined,
            orderNumber: orderNumber || id || `SO-${Date.now().toString().slice(-4)}`,
            salesChannel: body.salesChannel || 'Distributor',
            salesperson: body.salesperson || 'Sales Desk',
            customerId: body.customerId || 'CUS-DEFAULT',
            customerName: body.customerName || 'Customer',
            orderDate: body.orderDate || new Date().toISOString().split('T')[0],
            dueDate: body.dueDate || new Date().toISOString().split('T')[0],
            subtotal: parseFloat(body.subtotal || 0),
            discountAmount: parseFloat(body.discountAmount || 0),
            taxAmount: parseFloat(body.taxAmount || 0),
            grandTotal: parseFloat(body.grandTotal || body.totalAmount || 0),
            totalAmount: parseFloat(body.totalAmount || body.grandTotal || 0),
            amountPaid: parseFloat(body.amountPaid || 0),
            pendingAmount: parseFloat(body.pendingAmount || 0),
            paymentStatus: body.paymentStatus || 'UNPAID',
            dispatchStatus: body.dispatchStatus || 'PENDING',
            orderStatus: body.orderStatus || 'CONFIRMED',
            createdBy: body.createdBy || 'Sales Desk',
            quotationId: quotationId || null,
            quotationNumber: quotationNumber || null,
          },
        });
      } catch (createErr: any) {
        console.warn('SalesOrder fallback create warning:', createErr.message);
      }
    }

    // 3. Serialize production images safely
    let finalSerializedImages: string | null = null;
    if (productionImages !== undefined) {
      if (Array.isArray(productionImages)) {
        finalSerializedImages = JSON.stringify(productionImages);
      } else if (typeof productionImages === 'string') {
        finalSerializedImages = productionImages;
      }
    }

    const primaryImage =
      packedImage !== undefined
        ? packedImage
        : Array.isArray(productionImages) && productionImages.length > 0
        ? productionImages[0]
        : undefined;

    // 4. Update sales order record with all production, packing, remarks, and photos
    const updateData: any = {};
    if (orderStatus !== undefined) updateData.orderStatus = orderStatus;
    if (dispatchStatus !== undefined) updateData.dispatchStatus = dispatchStatus;
    if (productionStatus !== undefined) updateData.productionStatus = productionStatus;
    if (packingStatus !== undefined) updateData.packingStatus = packingStatus;
    if (productionNotes !== undefined) updateData.productionNotes = productionNotes;
    if (packingNotes !== undefined) updateData.packingNotes = packingNotes;
    if (productionDate !== undefined) updateData.productionDate = productionDate;
    if (packingDate !== undefined) updateData.packingDate = packingDate;
    if (productTeamRemarks !== undefined) updateData.productTeamRemarks = productTeamRemarks;
    if (batchNumber !== undefined) updateData.batchNumber = batchNumber;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
    if (sentToProductDate !== undefined) updateData.sentToProductDate = sentToProductDate;
    if (finalSerializedImages !== null) updateData.productionImages = finalSerializedImages;
    if (primaryImage !== undefined) updateData.packedImage = primaryImage;
    if (quotationId !== undefined) updateData.quotationId = quotationId;
    if (quotationNumber !== undefined) updateData.quotationNumber = quotationNumber;
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus;
    if (body.amountPaid !== undefined) updateData.amountPaid = parseFloat(body.amountPaid);
    if (body.amountOutstanding !== undefined) updateData.amountOutstanding = parseFloat(body.amountOutstanding);
    if (body.pendingAmount !== undefined) updateData.pendingAmount = parseFloat(body.pendingAmount);
    if (body.rawMaterialsDeducted !== undefined) updateData.rawMaterialsDeducted = Boolean(body.rawMaterialsDeducted);
    if (body.rawMaterialsUsed !== undefined) {
      updateData.rawMaterialsUsed =
        typeof body.rawMaterialsUsed === 'string'
          ? body.rawMaterialsUsed
          : JSON.stringify(body.rawMaterialsUsed);
    }

    let updatedRecord: any = null;
    if (targetOrder) {
      try {
        updatedRecord = await prisma.salesOrder.update({
          where: { id: targetOrder.id },
          data: updateData,
        });
      } catch (upErr: any) {
        console.warn('prisma.salesOrder.update warning:', upErr.message);
        // Fallback update using orderNumber if id lookup failed
        if (targetOrder.orderNumber) {
          try {
            updatedRecord = await prisma.salesOrder.update({
              where: { orderNumber: targetOrder.orderNumber },
              data: updateData,
            });
          } catch (numUpErr: any) {
            console.warn('prisma.salesOrder.update by orderNumber warning:', numUpErr.message);
          }
        }
      }
    }

    // 5. Sync status to linked Quotation if orderStatus or dispatchStatus changed
    const effectiveStatus =
      dispatchStatus === 'DISPATCHED' || dispatchStatus === 'Dispatched'
        ? 'Dispatched'
        : orderStatus || (dispatchStatus === 'Ready to Dispatch' ? 'Ready for Dispatch' : undefined);

    if (effectiveStatus && targetOrder) {
      try {
        await prisma.quotation.updateMany({
          where: {
            OR: [
              ...(targetOrder.quotationId ? [{ id: targetOrder.quotationId }] : []),
              ...(targetOrder.quotationNumber ? [{ quotationNumber: targetOrder.quotationNumber }] : []),
              { salesOrderId: targetOrder.id },
              { orderNumber: targetOrder.orderNumber },
            ],
          },
          data: {
            status: effectiveStatus,
          },
        });
      } catch (qErr) {
        // ignore if quotation table not present
      }
    }

    // 6. Return updated record with parsed production images array
    const finalOrder = updatedRecord || targetOrder || { id, orderNumber, ...body };

    let parsedImages: string[] = [];
    if (finalOrder.productionImages) {
      try {
        parsedImages =
          typeof finalOrder.productionImages === 'string'
            ? JSON.parse(finalOrder.productionImages)
            : finalOrder.productionImages;
      } catch {
        parsedImages = [finalOrder.productionImages];
      }
    } else if (finalOrder.packedImage) {
      parsedImages = [finalOrder.packedImage];
    }
    if (finalOrder.packedImage && !parsedImages.includes(finalOrder.packedImage)) {
      parsedImages.unshift(finalOrder.packedImage);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...finalOrder,
        productionImages: parsedImages,
        packedImage: finalOrder.packedImage || (parsedImages.length > 0 ? parsedImages[0] : null),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update sales order in DB' },
      { status: 400 }
    );
  }
}

