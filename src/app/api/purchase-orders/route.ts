import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: purchaseOrders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPO = await prisma.purchaseOrder.create({
      data: {
        poNumber: body.poNumber,
        invoiceNumber: body.invoiceNumber,
        supplierId: body.supplierId,
        supplierName: body.supplierName,
        orderDate: body.orderDate || new Date().toISOString().split('T')[0],
        expectedDate: body.expectedDate || new Date().toISOString().split('T')[0],
        paymentDueDate: body.paymentDueDate,
        subtotal: parseFloat(body.subtotal || 0),
        discountAmount: parseFloat(body.discountAmount || 0),
        gstAmount: parseFloat(body.gstAmount || 0),
        freight: parseFloat(body.freight || 0),
        totalAmount: parseFloat(body.totalAmount || 0),
        amountPaid: parseFloat(body.amountPaid || 0),
        paymentTerms: body.paymentTerms || 'Net 30 Days',
        paymentStatus: body.paymentStatus || 'UNPAID',
        status: body.status || 'Pending',
        createdBy: body.createdBy,
        items: {
          create: (body.items || []).map((i: any) => ({
            rawMaterialId: i.rawMaterialId,
            rawMaterialName: i.rawMaterialName,
            sku: i.sku,
            quantity: parseInt(i.quantity || 1, 10),
            receivedQuantity: parseInt(i.receivedQuantity || 0, 10),
            unit: i.unit,
            unitCost: parseFloat(i.unitCost || 0),
            discountPercent: parseFloat(i.discountPercent || 0),
            gstPercent: parseFloat(i.gstPercent || 18),
            totalCost: parseFloat(i.totalCost || 0),
          })),
        },
      },
      include: { items: true },
    });
    return NextResponse.json({ success: true, data: newPO }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create purchase order' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, poNumber, status, receivedQuantity } = body;

    if (!id && !poNumber) {
      return NextResponse.json({ success: false, message: 'ID or PO Number is required' }, { status: 400 });
    }

    const existingPO = await prisma.purchaseOrder.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(poNumber ? [{ poNumber }] : []),
        ],
      },
      include: { items: true },
    });

    if (!existingPO) {
      return NextResponse.json({ success: false, message: 'Purchase Order not found' }, { status: 404 });
    }

    const wasAlreadyReceived = existingPO.status === 'Received';
    const isNowReceived = status === 'Received';

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: existingPO.id },
      data: {
        ...(status ? { status } : {}),
        ...(receivedQuantity !== undefined ? { receivedQuantity: parseInt(receivedQuantity, 10) } : {}),
        ...(body.amountPaid !== undefined ? { amountPaid: parseFloat(body.amountPaid) } : {}),
        ...(body.paymentStatus ? { paymentStatus: body.paymentStatus } : {}),
      },
      include: { items: true },
    });

    // If order transitioned to Received and wasn't received before, add stock to raw materials
    const stockUpdates: any[] = [];
    if (isNowReceived && !wasAlreadyReceived) {
      for (const item of existingPO.items) {
        const itemQty = item.quantity;
        const rm = await prisma.rawMaterial.findFirst({
          where: {
            OR: [
              { id: item.rawMaterialId },
              { sku: item.sku },
            ],
          },
        });

        if (rm) {
          const prevStock = rm.currentStock;
          const newStock = prevStock + itemQty;
          const updatedRm = await prisma.rawMaterial.update({
            where: { id: rm.id },
            data: { currentStock: newStock },
          });
          stockUpdates.push({
            id: updatedRm.id,
            name: updatedRm.name,
            sku: updatedRm.sku,
            unit: updatedRm.unit,
            added: itemQty,
            previousStock: prevStock,
            updatedStock: newStock,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPO,
      stockUpdates,
      message: isNowReceived
        ? `Purchase order marked as Received. Stock increased for ${stockUpdates.length} raw materials.`
        : 'Purchase order updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update purchase order' },
      { status: 400 }
    );
  }
}
