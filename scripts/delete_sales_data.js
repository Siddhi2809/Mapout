const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING SALES DATA DELETION ---');
  const results = {};

  // 1. Delete Customer Payments
  try {
    const cp = await prisma.customerPayment.deleteMany({});
    results.customerPayments = cp.count;
    console.log(`Deleted ${cp.count} CustomerPayments`);
  } catch (e) {
    console.error('Error deleting CustomerPayments:', e.message);
  }

  // 2. Delete Sales Invoices
  try {
    const si = await prisma.salesInvoice.deleteMany({});
    results.salesInvoices = si.count;
    console.log(`Deleted ${si.count} SalesInvoices`);
  } catch (e) {
    console.error('Error deleting SalesInvoices:', e.message);
  }

  // 3. Delete Sales Dispatches and items
  try {
    const di = await prisma.dispatchItem.deleteMany({});
    const sd = await prisma.salesDispatch.deleteMany({});
    results.dispatchItems = di.count;
    results.salesDispatches = sd.count;
    console.log(`Deleted ${di.count} DispatchItems and ${sd.count} SalesDispatches`);
  } catch (e) {
    console.error('Error deleting SalesDispatches:', e.message);
  }

  // 4. Delete Sales Returns and Product Returns
  try {
    const pr = await prisma.productReturn.deleteMany({});
    const sr = await prisma.salesReturn.deleteMany({});
    results.productReturns = pr.count;
    results.salesReturns = sr.count;
    console.log(`Deleted ${pr.count} ProductReturns and ${sr.count} SalesReturns`);
  } catch (e) {
    console.error('Error deleting Returns:', e.message);
  }

  // 5. Delete Sales Order Items and Sales Orders
  try {
    const soi = await prisma.salesOrderItem.deleteMany({});
    const so = await prisma.salesOrder.deleteMany({});
    results.salesOrderItems = soi.count;
    results.salesOrders = so.count;
    console.log(`Deleted ${soi.count} SalesOrderItems and ${so.count} SalesOrders`);
  } catch (e) {
    console.error('Error deleting SalesOrders:', e.message);
  }

  // 6. Delete Quotation Items and Quotations
  try {
    const qi = await prisma.quotationItem.deleteMany({});
    const q = await prisma.quotation.deleteMany({});
    results.quotationItems = qi.count;
    results.quotations = q.count;
    console.log(`Deleted ${qi.count} QuotationItems and ${q.count} Quotations`);
  } catch (e) {
    console.error('Error deleting Quotations:', e.message);
  }

  // 7. Delete Leads and Lead Import Histories
  try {
    const lih = await prisma.leadImportHistory.deleteMany({});
    const l = await prisma.lead.deleteMany({});
    results.leadImportHistory = lih.count;
    results.leads = l.count;
    console.log(`Deleted ${lih.count} LeadImportHistories and ${l.count} Leads`);
  } catch (e) {
    console.error('Error deleting Leads:', e.message);
  }

  // 8. Delete Customers
  try {
    const c = await prisma.customer.deleteMany({});
    results.customers = c.count;
    console.log(`Deleted ${c.count} Customers`);
  } catch (e) {
    console.error('Error deleting Customers:', e.message);
  }

  console.log('--- SALES DATA DELETION COMPLETE ---');
  console.log('TOTAL_DELETED:', JSON.stringify(results, null, 2));

  // Verify database state
  console.log('--- VERIFYING REMAINING RECORDS ---');
  const remaining = {
    customers: await prisma.customer.count(),
    leads: await prisma.lead.count(),
    leadImportHistory: await prisma.leadImportHistory.count(),
    quotations: await prisma.quotation.count(),
    quotationItems: await prisma.quotationItem.count(),
    salesOrders: await prisma.salesOrder.count(),
    salesOrderItems: await prisma.salesOrderItem.count(),
    salesInvoices: await prisma.salesInvoice.count(),
    customerPayments: await prisma.customerPayment.count(),
    salesDispatches: await prisma.salesDispatch.count(),
    dispatchItems: await prisma.dispatchItem.count(),
    salesReturns: await prisma.salesReturn.count(),
    productReturns: await prisma.productReturn.count(),
    rawMaterials: await prisma.rawMaterial.count(),
    suppliers: await prisma.supplier.count(),
    productMasters: await prisma.productMaster.count(),
    boms: await prisma.bOM.count(),
  };
  console.log('REMAINING_DATABASE_COUNTS:', JSON.stringify(remaining, null, 2));

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('FATAL_ERROR:', err);
  process.exit(1);
});

