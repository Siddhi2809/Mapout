import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const returns = await prisma.productReturn.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: returns });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch return requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const today = new Date().toISOString().split('T')[0];

    const newProductReturn = await prisma.productReturn.create({
      data: {
        returnNumber: body.returnNumber,
        customerName: body.customerName,
        salesInvoice: body.salesInvoice || body.invoiceNumber || 'INV-REF',
        productId: body.productId,
        productName: body.productName,
        quantity: parseInt(body.quantity || 1, 10),
        returnedQuantity: parseInt(body.returnedQuantity || body.quantity || 1, 10),
        replacementQuantity: parseInt(body.replacementQuantity || 0, 10),
        returnReason: body.returnReason,
        claimType: body.claimType || 'Defective',
        defect: body.defect,
        inspectionNotes: body.inspectionNotes || body.description,
        actionTaken: body.actionTaken,
        repairStatus: body.repairStatus || 'Not Started',
        finalAction: body.finalAction,
        closingDate: body.closingDate,
        status: body.status || 'Requested',
        date: body.date || today,
        createdBy: body.createdBy || 'Product Desk',
      },
    });

    // Also mirror in SalesReturn table
    await prisma.salesReturn.create({
      data: {
        returnNumber: body.salesReturnNumber || `RET-${body.returnNumber}`,
        customerId: body.customerId || 'cust-1',
        customerName: body.customerName,
        invoiceNumber: body.salesInvoice || body.invoiceNumber,
        productId: body.productId,
        productName: body.productName,
        quantity: parseInt(body.quantity || 1, 10),
        returnedQuantity: parseInt(body.returnedQuantity || body.quantity || 1, 10),
        replacementQuantity: parseInt(body.replacementQuantity || 0, 10),
        returnReason: body.returnReason,
        claimType: body.claimType || 'Defective',
        description: body.inspectionNotes || body.defect || body.returnReason,
        repairStatus: body.repairStatus || 'Not Started',
        finalAction: body.finalAction,
        closingDate: body.closingDate,
        returnDate: body.date || today,
        status: body.status || 'Requested',
        productReturnId: newProductReturn.id,
        createdBy: body.createdBy || 'Sales Desk',
      },
    });

    return NextResponse.json({ success: true, data: newProductReturn }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create RMA return' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, inspectionNotes, actionTaken, defect, claimType, returnedQuantity, replacementQuantity, repairStatus, finalAction, closingDate } = body;

    const updated = await prisma.productReturn.update({
      where: { id },
      data: {
        status,
        inspectionNotes,
        actionTaken,
        defect,
        claimType,
        returnedQuantity: returnedQuantity ? parseInt(returnedQuantity, 10) : undefined,
        replacementQuantity: replacementQuantity ? parseInt(replacementQuantity, 10) : undefined,
        repairStatus,
        finalAction,
        closingDate,
      },
    });

    // Update mirror salesReturn if exists
    await prisma.salesReturn.updateMany({
      where: { productReturnId: id },
      data: {
        status,
        description: inspectionNotes,
        claimType,
        returnedQuantity: returnedQuantity ? parseInt(returnedQuantity, 10) : undefined,
        replacementQuantity: replacementQuantity ? parseInt(replacementQuantity, 10) : undefined,
        repairStatus,
        finalAction,
        closingDate,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update RMA return status' },
      { status: 400 }
    );
  }
}
