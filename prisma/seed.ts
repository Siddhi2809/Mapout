import { PrismaClient } from '@prisma/client';
import {
  INITIAL_RAW_MATERIALS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_LEADS,
  INITIAL_PRODUCT_RETURNS,
} from '../src/lib/mockData';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PostgreSQL Database for MapOut ERP...');

  // 1. Raw Materials
  for (const rm of INITIAL_RAW_MATERIALS) {
    await prisma.rawMaterial.upsert({
      where: { sku: rm.sku },
      update: {},
      create: {
        id: rm.id,
        materialCode: (rm as any).materialCode || rm.id,
        name: rm.name,
        sku: rm.sku,
        category: rm.category,
        unit: rm.unit,
        currentStock: rm.currentStock,
        minStock: rm.minStock,
        maxStock: rm.maxStock,
        unitCost: rm.unitCost,
        supplierId: rm.supplierId,
        supplierName: rm.supplierName,
        location: rm.location,
        description: rm.description,
        status: rm.status || 'ACTIVE',
      },
    });
  }

  // 2. Products
  for (const p of INITIAL_PRODUCTS) {
    await prisma.productMaster.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        id: p.id,
        productCode: p.productCode,
        sku: p.sku,
        name: p.name,
        category: p.category,
        brand: p.brand,
        connectorType: p.connectorType,
        cableLengthWireSpec: p.cableLengthWireSpec,
        vehicleScannerCompatibility: p.vehicleScannerCompatibility,
        subcategory: p.subcategory,
        description: p.description,
        purchaseCost: p.purchaseCost,
        sellingPrice: p.sellingPrice,
        discount: p.discount || 0,
        gstPercent: p.gstPercent || 18,
        hsnSac: p.hsnSac,
        openingStock: p.openingStock,
        currentStock: p.currentStock,
        minStock: p.minStock,
        maxStock: p.maxStock,
        status: p.status || 'ACTIVE',
        imageUrl: p.imageUrl,
      },
    });
  }

  // 3. Customers
  for (const c of INITIAL_CUSTOMERS) {
    await prisma.customer.upsert({
      where: { customerCode: c.customerCode || c.id },
      update: {},
      create: {
        id: c.id,
        customerCode: c.customerCode || `CUS-${c.id}`,
        name: c.name,
        companyName: c.companyName,
        customerType: c.customerType || 'Distributor',
        contactPerson: c.contactPerson,
        mobile: c.mobile,
        alternateMobile: c.alternateMobile,
        email: c.email,
        gstNumber: c.gstNumber,
        panNumber: c.panNumber,
        gstType: c.gstType || 'Regular',
        address: c.address,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        country: c.country || 'India',
        category: c.category || 'Distributor',
        paymentTerms: c.paymentTerms || 'Net 30 Days',
        creditLimit: c.creditLimit || 0,
        assignedSalesUser: c.assignedSalesUser,
        totalOrders: c.totalOrders || 0,
        totalSales: c.totalSales || 0,
        totalPaid: c.totalPaid || 0,
        totalOutstanding: c.totalOutstanding || 0,
        status: c.status || 'ACTIVE',
        lastFollowUp: c.lastFollowUp,
        nextFollowUpDate: c.nextFollowUpDate,
        lastOrderDate: c.lastOrderDate,
      },
    });
  }

  // 4. Suppliers
  for (const s of INITIAL_SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { supplierCode: s.supplierCode || s.id },
      update: {},
      create: {
        id: s.id,
        supplierCode: s.supplierCode || `SUP-${s.id}`,
        name: s.name,
        companyName: s.companyName,
        contactPerson: s.contactPerson,
        email: s.email,
        phone: s.phone,
        gstNumber: s.gstNumber,
        address: s.address,
        city: s.city,
        state: s.state,
        pincode: s.pincode,
        category: s.category || 'Raw Components',
        totalPurchase: s.totalPurchase || 0,
        totalOutstanding: s.totalOutstanding || 0,
        paymentTerms: s.paymentTerms || 'Net 30 Days',
        status: s.status || 'ACTIVE',
      },
    });
  }

  // 5. Leads
  for (const l of INITIAL_LEADS) {
    await prisma.lead.upsert({
      where: { leadNumber: l.leadNumber },
      update: {},
      create: {
        id: l.id,
        leadNumber: l.leadNumber,
        leadName: l.leadName,
        companyName: l.companyName,
        contactPerson: l.contactPerson || 'Contact Person',
        mobile: l.mobile,
        email: l.email,
        source: l.source || 'Website',
        interestedProductId: l.interestedProductId,
        interestedProductName: l.interestedProductName,
        expectedValue: l.expectedValue || 0,
        assignedUser: l.assignedUser,
        status: l.status || 'NEW',
        nextFollowUpDate: l.nextFollowUpDate,
        notes: l.notes,
        convertedCustomerId: l.convertedCustomerId,
      },
    });
  }

  // 6. Product Returns (RMA)
  for (const r of INITIAL_PRODUCT_RETURNS) {
    await prisma.productReturn.upsert({
      where: { returnNumber: r.returnNumber },
      update: {},
      create: {
        id: r.id,
        returnNumber: r.returnNumber,
        customerName: r.customerName,
        salesInvoice: r.salesInvoice,
        productId: r.productId,
        productName: r.productName,
        quantity: r.quantity,
        returnedQuantity: r.returnedQuantity || r.quantity,
        replacementQuantity: r.replacementQuantity || 0,
        returnReason: r.returnReason,
        claimType: r.claimType || 'Defective',
        defect: r.defect,
        inspectionNotes: r.inspectionNotes,
        actionTaken: r.actionTaken,
        repairStatus: r.repairStatus || 'Not Started',
        finalAction: r.finalAction,
        closingDate: r.closingDate,
        status: r.status,
        date: r.date,
        createdBy: r.createdBy,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
