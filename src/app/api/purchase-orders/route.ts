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
