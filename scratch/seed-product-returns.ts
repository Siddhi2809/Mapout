import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The user's excel sheet rows with returns (> 0)
const returnsData = [
  { smplId: 'SMPL001', name: 'Ashok Leyland (Scan tool) OBD-II Male to DB15 Female Cable', returns: 2 },
  { smplId: 'SMPL077', name: 'Ashok Leyland Scantool cable BS-4 Moulded Cable', returns: 2 },
  { smplId: 'SMPL003', name: 'Ashok Leyland (BS-6) OBD-II Male to ECO 10Pin Female Connector.', returns: 1 },
  { smplId: 'SMPL042', name: 'BMW Cable Enet LAN Yellow', returns: 1 },
  { smplId: 'SMPL102', name: 'CAN Adapter OBD to DB9 Female diagnostic cable', returns: 1 },
  { smplId: 'SMPL008', name: 'Mahindra (Company) OBD-II Male to DB9 Female', returns: 1 },
  { smplId: 'Red -Yellow OBD Cable', name: 'Red -Yellow OBD Cable', returns: 1 },
  { smplId: 'SMPL123', name: 'Mapout24 V519 Diagnostic Scanner Full OBDII Function Car Scanner V519 Auto Diagnostic Tool ELM327 OBD 2 OBD11 OBD2 Car Diagnostic Tools', returns: 1 },
  { smplId: 'M601 OBD Scanner', name: 'M601 OBD Scanner', returns: 1 },
  { smplId: 'M500 OBD Scanner', name: 'M500 OBD Scanner', returns: 1 },
  { smplId: 'SMPL037', name: 'All in one BS6 Bike Universal cable (11 in 1) cable', returns: 3 },
  { smplId: 'SMPL036', name: 'Two Wheeler Cable for HONDA,SUZUKI,YAMAHA', returns: 4 },
  { smplId: 'SMPL035', name: 'Two Wheeler Cable for Royal Enfield', returns: 1 },
  { smplId: 'SMPL066', name: 'Slim OBD-II Male Connector', returns: 1 },
  { smplId: 'SMPL062', name: 'OBD-II Ultra Male Connector with 16 Core Wire Open End Moulded (2 Meter Black)', returns: 1 },
  { smplId: 'SMPL053', name: 'OBDII Female-Male-Female T Splitter cable', returns: 1 }
];

async function seedReturns() {
  console.log('Seeding Product Returns from Excel sheet...');
  let count = 0;
  const today = '2026-11-17';

  for (let i = 0; i < returnsData.length; i++) {
    const item = returnsData[i];
    const returnNumber = `RET-2026-${String(101 + i).padStart(3, '0')}`;
    const invoiceNumber = `INV-2026-${String(101 + i).padStart(3, '0')}`;

    // Find product in DB
    const product = await prisma.productMaster.findFirst({
      where: {
        OR: [
          { sku: item.smplId },
          { productCode: item.smplId },
          { name: { contains: item.name.substring(0, 30) } }
        ]
      }
    });

    const productId = product ? product.id : `prd_${item.smplId}`;
    const productName = product ? product.name : item.name;

    // Determine status & defect
    const isScanner = productName.toLowerCase().includes('scanner') || productName.toLowerCase().includes('v519');
    const claimType = isScanner ? 'Firmware Issue' : 'Connector Pin Loose / Warranty Claim';
    const returnReason = 'Warranty / Defective';
    const status = 'Received';

    await prisma.productReturn.upsert({
      where: { returnNumber },
      create: {
        returnNumber,
        customerName: i % 2 === 0 ? 'Shinde Automotive Services' : 'Autocare Electronics Ltd',
        salesInvoice: invoiceNumber,
        productId,
        productName,
        quantity: item.returns,
        returnedQuantity: item.returns,
        replacementQuantity: item.returns,
        returnReason,
        claimType,
        defect: isScanner ? 'Screen / Communication Glitch' : 'OBD Pin Continuity Issue',
        inspectionNotes: `Customer returned ${item.returns} unit(s) under November monthly returns audit.`,
        actionTaken: 'Sent for Bench Testing & Replacement Dispatch',
        repairStatus: 'Repaired & Tested',
        finalAction: 'Replacement Approved',
        closingDate: '2026-11-20',
        status,
        date: today,
        createdBy: 'Quality Desk',
      },
      update: {
        quantity: item.returns,
        returnedQuantity: item.returns,
        replacementQuantity: item.returns,
        productName,
      }
    });

    // Also mirror in SalesReturn for Sales synchronization
    await prisma.salesReturn.upsert({
      where: { returnNumber },
      create: {
        returnNumber,
        customerId: 'cust-ret-101',
        customerName: i % 2 === 0 ? 'Shinde Automotive Services' : 'Autocare Electronics Ltd',
        invoiceNumber,
        productId,
        productName,
        quantity: item.returns,
        returnedQuantity: item.returns,
        replacementQuantity: item.returns,
        returnReason,
        claimType,
        description: `November return audit: ${item.returns} unit(s)`,
        repairStatus: 'Completed',
        finalAction: 'Replacement Provided',
        returnDate: today,
        status: 'Completed',
        createdBy: 'Quality Desk',
      },
      update: {
        quantity: item.returns,
        returnedQuantity: item.returns,
        replacementQuantity: item.returns,
        productName,
      }
    });

    count++;
  }

  console.log(`Successfully created/updated ${count} product return records!`);
}

seedReturns()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
