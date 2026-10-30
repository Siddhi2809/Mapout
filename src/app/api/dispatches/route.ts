import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dispatches = await prisma.salesDispatch.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: dispatches });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch dispatches' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newDispatch = await prisma.salesDispatch.create({
      data: {
        dispatchNumber: body.dispatchNumber,
        salesOrderId: body.salesOrderId,
        salesOrderNumber: body.salesOrderNumber,
        invoiceId: body.invoiceId,
        invoiceNumber: body.invoiceNumber,
        customerId: body.customerId,
        customerName: body.customerName,
        dispatchDate: body.dispatchDate || new Date().toISOString().split('T')[0],
        totalQuantity: parseInt(body.totalQuantity || 0, 10),
        transporter: body.transporter,
        vehicleNumber: body.vehicleNumber,
        trackingNumber: body.trackingNumber,
        deliveryStatus: body.deliveryStatus || 'Dispatched',
        remarks: body.remarks,
        createdBy: body.createdBy,
        items: {
          create: (body.items || []).map((i: any) => ({
            productId: i.productId,
            productName: i.productName,
            sku: i.sku,
            orderedQuantity: parseInt(i.orderedQuantity || 0, 10),
            previouslyDispatched: parseInt(i.previouslyDispatched || 0, 10),
            remainingQuantity: parseInt(i.remainingQuantity || 0, 10),
            dispatchQuantity: parseInt(i.dispatchQuantity || 0, 10),
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, data: newDispatch }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create dispatch' },
      { status: 400 }
    );
  }
}
