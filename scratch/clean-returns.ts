import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The exact items and return counts from the user's Excel sheet
const returnsData = [
  { name: 'Ashok Leyland (Scan tool) OBD-II Male to DB15 Female Cable', returns: 2 },
  { name: 'Ashok Leyland Scantool cable BS-4 Moulded Cable', returns: 2 },
  { name: 'Ashok Leyland (BS-6) OBD-II Male to ECO 10Pin Female Connector.', returns: 1 },
  { name: 'BMW Cable Enet LAN Yellow', returns: 1 },
  { name: 'CAN Adapter OBD to DB9 Female diagnostic cable', returns: 1 },
  { name: 'Mahindra (Company) OBD-II Male to DB9 Female', returns: 1 },
  { name: 'Red -Yellow OBD Cable', returns: 1 },
  { name: 'Mapout24 V519 Diagnostic Scanner Full OBDII Function Car Scanner V519 Auto Diagnostic Tool ELM327 OBD 2 OBD11 OBD2 Car Diagnostic Tools', returns: 1 },
  { name: 'M601 OBD Scanner', returns: 1 },
  { name: 'M500 OBD Scanner', returns: 1 },
  { name: 'All in one BS6 Bike Universal cable (11 in 1) cable', returns: 3 },
  { name: 'Two Wheeler Cable for HONDA,SUZUKI,YAMAHA', returns: 4 },
  { name: 'Two Wheeler Cable for Royal Enfield', returns: 1 },
  { name: 'Slim OBD-II Male Connector', returns: 1 },
  { name: 'OBD-II Ultra Male Connector with 16 Core Wire Open End Moulded (2 Meter Black)', returns: 1 },
  { name: 'OBDII Female-Male-Female T Splitter cable', returns: 1 }
];

async function cleanReturns() {
  console.log('Replacing return records with clean accurate data (product name and return count only)...');
  
  // Clear previous records
  await prisma.productReturn.deleteMany({});
  await prisma.salesReturn.deleteMany({});

  for (let i = 0; i < returnsData.length; i++) {
    const item = returnsData[i];
    const returnNumber = `RET-${String(i + 1).padStart(3, '0')}`;

    // Find product in DB
    const product = await prisma.productMaster.findFirst({
      where: {
        name: { contains: item.name.substring(0, 30) }
      }
    });

    const productId = product ? product.id : `prd_${i + 1}`;
    const productName = product ? product.name : item.name;

    await prisma.productReturn.create({
      data: {
        returnNumber,
        customerName: '-',
        salesInvoice: '-',
        productId,
        productName,
        quantity: item.returns,
        returnedQuantity: item.returns,
        replacementQuantity: 0,
        returnReason: 'Return',
        claimType: 'Return',
        defect: '',
        inspectionNotes: '',
        actionTaken: '',
        repairStatus: '',
        finalAction: '',
        closingDate: '',
        status: 'Recorded',
        date: '2026-11-17',
        createdBy: 'System',
      }
    });

    await prisma.salesReturn.create({
      data: {
        returnNumber,
        customerId: '',
        customerName: '-',
        invoiceNumber: '-',
        productId,
        productName,
        quantity: item.returns,
        returnedQuantity: item.returns,
        replacementQuantity: 0,
        returnReason: 'Return',
        claimType: 'Return',
        description: '',
        repairStatus: '',
        finalAction: '',
        returnDate: '2026-11-17',
        status: 'Recorded',
        createdBy: 'System',
      }
    });
  }

  console.log(`Cleanly seeded ${returnsData.length} return items!`);
}

cleanReturns()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
