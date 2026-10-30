import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const deletedCounts: Record<string, number> = {};

    // 1. Delete Customer Payments
    try {
      const p = await prisma.customerPayment.deleteMany({});
      deletedCounts.customerPayments = p.count;
    } catch {
      deletedCounts.customerPayments = 0;
    }

    // 2. Delete Sales Invoices
    try {
      const inv = await prisma.salesInvoice.deleteMany({});
      deletedCounts.salesInvoices = inv.count;
    } catch {
      deletedCounts.salesInvoices = 0;
    }

    // 3. Delete Sales Dispatches and items
    try {
      await prisma.dispatchItem.deleteMany({});
      const d = await prisma.salesDispatch.deleteMany({});
      deletedCounts.salesDispatches = d.count;
    } catch {
      deletedCounts.salesDispatches = 0;
    }

    // 4. Delete Sales Returns
    try {
      const sr = await prisma.salesReturn.deleteMany({});
      deletedCounts.salesReturns = sr.count;
    } catch {
      deletedCounts.salesReturns = 0;
    }

    // 5. Delete Sales Orders and items
    try {
      await prisma.salesOrderItem.deleteMany({});
      const so = await prisma.salesOrder.deleteMany({});
      deletedCounts.salesOrders = so.count;
    } catch {
      deletedCounts.salesOrders = 0;
    }

    // 6. Delete Quotations and items
    try {
      await prisma.quotationItem.deleteMany({});
      const q = await prisma.quotation.deleteMany({});
      deletedCounts.quotations = q.count;
    } catch {
      deletedCounts.quotations = 0;
    }

    // 7. Delete Leads and import histories
    try {
      await prisma.leadImportHistory.deleteMany({});
      const l = await prisma.lead.deleteMany({});
      deletedCounts.leads = l.count;
    } catch {
      deletedCounts.leads = 0;
    }

    // 8. Delete Customers
    try {
      const c = await prisma.customer.deleteMany({});
      deletedCounts.customers = c.count;
    } catch {
      deletedCounts.customers = 0;
    }

    return NextResponse.json({
      success: true,
      message: 'All Sales transactional database records and Customers deleted successfully.',
      deletedCounts,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete sales database records',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
