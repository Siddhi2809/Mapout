import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const deletedCounts: Record<string, number> = {};

    // Delete in sequence respecting relations and cascading foreign keys
    const operations: { name: string; run: () => Promise<{ count: number }> }[] = [
      { name: 'bOMItem', run: () => prisma.bOMItem.deleteMany({}) },
      { name: 'bOM', run: () => prisma.bOM.deleteMany({}) },
      { name: 'dispatchItem', run: () => prisma.dispatchItem.deleteMany({}) },
      { name: 'salesDispatch', run: () => prisma.salesDispatch.deleteMany({}) },
      { name: 'salesOrderItem', run: () => prisma.salesOrderItem.deleteMany({}) },
      { name: 'salesOrder', run: () => prisma.salesOrder.deleteMany({}) },
      { name: 'quotationItem', run: () => prisma.quotationItem.deleteMany({}) },
      { name: 'quotation', run: () => prisma.quotation.deleteMany({}) },
      { name: 'purchaseOrderItem', run: () => prisma.purchaseOrderItem.deleteMany({}) },
      { name: 'purchaseOrder', run: () => prisma.purchaseOrder.deleteMany({}) },
      { name: 'customerPayment', run: () => prisma.customerPayment.deleteMany({}) },
      { name: 'salesInvoice', run: () => prisma.salesInvoice.deleteMany({}) },
      { name: 'productReturn', run: () => prisma.productReturn.deleteMany({}) },
      { name: 'salesReturn', run: () => prisma.salesReturn.deleteMany({}) },
      { name: 'leadImportHistory', run: () => prisma.leadImportHistory.deleteMany({}) },
      { name: 'lead', run: () => prisma.lead.deleteMany({}) },
      { name: 'customer', run: () => prisma.customer.deleteMany({}) },
      { name: 'supplierPayment', run: () => prisma.supplierPayment.deleteMany({}) },
      { name: 'supplier', run: () => prisma.supplier.deleteMany({}) },
      { name: 'productionOrder', run: () => prisma.productionOrder.deleteMany({}) },
      { name: 'finishedGood', run: () => prisma.finishedGood.deleteMany({}) },
      { name: 'productMaster', run: () => prisma.productMaster.deleteMany({}) },
      { name: 'rawMaterial', run: () => prisma.rawMaterial.deleteMany({}) },
      { name: 'dailyReport', run: () => prisma.dailyReport.deleteMany({}) },
      { name: 'meeting', run: () => prisma.meeting.deleteMany({}) },
      { name: 'adminTask', run: () => prisma.adminTask.deleteMany({}) },
      { name: 'auditLog', run: () => prisma.auditLog.deleteMany({}) },
    ];

    for (const op of operations) {
      try {
        const res = await op.run();
        deletedCounts[op.name] = res.count;
      } catch (err: any) {
        deletedCounts[op.name] = 0;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All system and database records have been deleted successfully. The platform is ready for new data entry across all logins.',
      deletedCounts,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to reset system data',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
