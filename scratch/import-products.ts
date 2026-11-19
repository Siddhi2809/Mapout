import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawCsv = `Old SMPL ID,Product Name,,,,,,,nov,return ,omline ,ofline,sales,nov,,
SMPL001,Ashok Leyland (Scan tool) OBD-II Male to DB15 Female Cable,,,,,,,32,2,4,,4,29,,
SMPL077,Ashok Leyland Scantool cable BS-4 Moulded Cable,,,,,,,50,2,1,2,3,49,,
SMPL002,Ashok Leyland (Flash tool) OBD-II Male to DB25 Female Cable,,,,,,,23,,,1,1,22,,
SMPL047,Ashok Leyland(Flashtool)- OBD-II (Moulded) Male to DB25 Female Cable,,,,,,,17,,,2,2,15,,
SMPL003,Ashok Leyland (BS-6) OBD-II Male to ECO 10Pin Female Connector.,,,,,,,25,1,,1,1,25,,
SMPL022,BOSCH OBD-II Male to DB 26 Female Cable(Universal Cable),,,,,,,27,,1,4,5,21,35,
SMPL024,Bosch KTC OBD-II Male to DB 26 Female Cable.,,,,,,,25,,,,,,,
SMPL042,BMW Cable Enet LAN Yellow,,,,,,,24,1,5,,5,20,,
SMPL102,CAN Adapter OBD to DB9 Female diagnostic cable,,,,,,,11,1,,,,12,,
SMPL027,DG-Scan OBD-II Male to DB9 Female cable,,,,,,,11,,,,,11,3,
SMPL076,DG-Scantool cable BS-4 Moulded Cable,,,,,,,32,,,5,5,29,27,
,V-Scan & E-scan tool OBD-II to DB9 Both Side Moulded Cable,,,,,,,17,,,1,1,16,,
SMPL025,Force Motors OBD-II Male to DB-15 Male cable,,,,,,,11,,,,,11,,
SMPL028,Gscan – II OBD-II Male to DB 25 Female cable,,,,,,,42,,,,,42,,
SMPL081,Gscan-II OBD-II Male to DB 25 Female cable moulded,,,,,,,15,,,,,15,,
SMPL029,Gscan – III OBD-II Male to DB 15 Female cable,,,,,,,27,,,,,27,,
SMPL020,Kia Motors (Kia-1) OBD-II Male to DB15 Female Cable,,,,,,,5,,,,,5,,
SMPL008,Mahindra (Company) OBD-II Male to DB9 Female,,,,,,,7,1,,,1,8,,
SMPL005,Mahindra /Garuda /Garuda-II OBD-II Male to DB-15 Male cable,,,,,,,20,,,,,20,,
SMPL004,Mahindra /Garuda /Garuda-II OBD-II Male to DB-15 Male cable (Garuda Moulded),,,,,,,19,,2,,2,17,,
SMPL007,Mahindra (Smart N0650-1312) OBD-II Male to DB9 Female Cable,,,,,,,,,,,,,,
SMPL006,"Mahindra Garuda 1, ISmart OBD-II Male to DB-15 Male cable",,,,,,,19,,,,,19,,
SMPL090,"Mahindra Garuda 1, ISmart OBD-II Male to DB-15 Male cable Moulded",,,,,,,14,,,1,1,13,,
SMPL011,Mahindra (WABCO) OBD-II Male to DB9 Female Cable,,,,,,,65,,,,,65,,
SMPL010,Mahindra (Python N0934-3253) OBD-II Male to DB9 Female Cable,,,,,,,16,,,,,16,,
SMPL087,Peak - OBD-II Male to DB9 Female Cable,,,,,,,10,,,,,10,,
smpl005,Tata Motors VCP OBD-II Male to DB-15 Male cable,,,,,,,23,,,,,23,,
smpl004,Tata Motors VCP OBD-II Male to DB-15 Male cable (Moulded),,,,,,,19,,,1,1,17,,
SMPL015,Tata Motors (Cummins Inline-6) OBD-II Male to DB25 Female Cable,,,,,,,47,,,,,47,,
SMPL018,Tata Motors(Cummins Inline-6)- OBD-II Male to DB25 Female Cable (moulded),,,,,,,19,,,,,19,,
SMPL016,"Tata Motors (3 Splitter) OBD-II Male to DB9 Female, DB9 Female & DB15 Female Cable",,,,,,,5,,,,,5,,
SMPL014,Tata Motors (Samtec Tool) OBD-II Male to DB15 Male Cable,,,,,,,18,,,,,18,,
SMPL092,TATA Motors Samtech OBD-II Male to DB15 Male Cable Moulded,,,,,,,21,,,,,21,,
SMPL023,Toyota Motors Denso IT OBD-II Male to DB 25 Female Cable.,,,,,,,,,,,,,,
,Force Motors OBD-II Male to DB-15 Male Moulded cable,,,,,,,19,,,1,1,18,,
SMPL221,"Mapout24 MC Bnz 38-Pin to 16-Pin OBD2 Diagnostic Adapter Cable, Universal Fit",,,,,,,,,,,,,,
SMPL222,"Mapout24 MC Benz Sprintr, 14-Pin to 16-Pin OBDII Cable",,,,,,,,,,,,,,
SMPL223,"Mapout24 OBD2 Diagnostic Cable, 10-Pin to 16-Pin Adapter, Compatible with BMW ICOM D Module Motorcycles, Scanner Tool",,,,,,,,,,,,,,
SMPL224,"Mapout24 Corded Electric OBD2 Scanner Cable, 20-Pin to 16-Pin Adapter for BMW, Black, Universal Fit",,,,,,,,,,,,,,
SMPL225,"Mapout24 OBD2 Extension Y Splitter Cable, Universal Fit, Compatible with Volkswagen Audi VW, Diagnostic Scanner Cable, Corded Electric, 22cm Length",,,,,,,,,,,,,,
,Red -Yellow OBD Cable,,,,,,,60,1,5,1,6,55,,
,OBD-ll 16 Pin Male to DB-44 Super MB Pro M6 Diagnostic Scanner Cable for Mercedes Benz Truck and Bus Diagnostic Tool Super MB Pro M6 Diagnostic Scanne Cable,,,,,,,,,,,,,,
,Mahindra Mida Link OBD-II 16 Pin Male to DB-25 Male Diagnostic Both Side Moulded Cable for Passenger and Commercial Vehicles,,,,,,,,,,,,,,
,Xtool OBD-ll 16 Pin Male to DB-15 Male Both Side Moulded Diagnostic Cable for Multibrand Cars,,,,,,,13,,1,,2,12,,
SMPL078,ELM 327 Bike & Car Scanner BS6 (Black ),,,,,,,,,,,,,,
SMPL079,ELM327 Bike and Car Scanner BS6 (Blue),,,,,,,20,,6,3,9,18,,
SMPL104,Ktag Tool,,,,,,,0,,,,,0,,
SMPL052,Launch 3001 Creader Car scanner (Black),,,,,,,,,,,,,,
SMPL121,Mapout 24 V311 Diagnostic Scanner Full OBDII Function Car Scanner V311 Auto Diagnostic Tool ELM327 OBD 2 OBD11 OBD2 Car Diagnostic Tools SMPL121,,,,,,,,,,,,,,
SMPL122,Mapout24 V317 Diagnostic Scanner Full OBDII Function Car Scanner V317 Auto Diagnostic Tool ELM327 OBD 2 OBD11 OBD2 Car Diagnostic Tools,,,,,,,,,,,,,,
SMPL123,Mapout24 V519 Diagnostic Scanner Full OBDII Function Car Scanner V519 Auto Diagnostic Tool ELM327 OBD 2 OBD11 OBD2 Car Diagnostic Tools,,,,,,,33,1,1,3,1,29,,
SMPL226,V900 Car Engine Transmission Diagnostic Scanner Tool Car Fault Detector Black,,,,,,,,,,,,,,
SMPL227,BT310 Charging Test Battery Tester 12V 24V Obd2 Diagnostic Tool Automotive Scanner,,,,,,,,,,,,,,
,M601 OBD Scanner,,,,,,,,1,,,,1,,
,M500 OBD Scanner,,,,,,,,1,,,,1,,
Old SMPL ID,Product Name,,,,,,,,,,,,,,
SMPL037,All in one BS6 Bike Universal cable (11 in 1) cable,,,,,,,18,3,6,2,8,12,,
SMPL186,7 In 1 RE AND JAWA BS6 BS7 Bike OBD-II Scanning Cable SMPL186,,,,,,,26,,2,,2,24,,
SMPL179,BS6-BS7 Bike Scanning Cable 18 Coplar Universal Cable,,,,,,,,,,,,,,
SMPL036,"Two Wheeler Cable for HONDA,SUZUKI,YAMAHA",,,,,,,29,4,15,2,17,26,34,31
SMPL098,Two Wheeler Cable for Hero & Hero Xpulse,,,,,,,22,,,,,,,
SMPL097,Two Wheeler Cable For Jupitor,,,,,,,,,,,,,,
SMPL032,"NEW Two Wheeler Cable for KTM, Bajaj, TVS",,,,,,,31,,,,,,,
SMPL031,"OLD Two Wheeler Cable for KTM, Bajaj, TVS, Hero, Royal Enfield",,,,,,,11,,,,,,,
SMPL117,Two wheeler cable For KAWASAKI,,,,,,,1,,1,,1,0,,
SMPL035,Two Wheeler Cable for Royal Enfield,,,,,,,7,1,6,1,7,3,,
SMPL034,Two Wheeler Cable for TVS 2 in 1 ( Mahale ),,,,,,,5,,,,,,,
SMPL073,"Yamaha Obd2 Diagnostic Cable, 3 Pin to Motorcycle Scanner Diagnostic Cable",,,,,,,,,,,,,,
SMPL075,"Yamaha Obd2 Diagnostic Cable, 4 Pin and 3 Pin to Motorcycle Scanner Diagnostic Cable",,,,,,,11,,,,,,,
SMPL074,"Yamaha Obd2 Diagnostic Cable, 4 Pin to Motorcycle Scanner Diagnostic Cable",,,,,,,,,,,,,,
,Royal Enfield OBD Male to DB26 Pin Male Moulded cable,,,,,,,,,,,,,,
,Bajaj auto OBD-ll 16 Pin Female to Male 6Pin/4 Pin Auto Riksha Cable,,,,,,,4,,,,,,,
,Honda authorise OBD DB15 pin Female Moulded Cable,,,,,,,6,,3,,3,3,,
,jawa OBD Authorised Cable ( 3 in 1 Cable ),,,,,,,1,,,,,,,
SMPL105,"Black ELM327 with All in one Universal cable, DMM, FPG",,,,,,,,,,,,,,
SMPL106,"Blue ELM327 with All in one Universal Cable, DMM, FPG",,,,,,,,,,,,,,
SMPL127,"V311 With 11 Coupler Universal cable, DMM, FPG",,,,,,,,,,,,,,
SMPL128,"V317 With 11 Coupler Universal cable, DMM, FPG",,,,,,,,,,,,,,
SMPL129,"V519 With 11 Coupler Universal cable, DMM, FPG",,,,,,,,,,,,,,
SMPL107,Launch Scanner creader with all in one Universal cable,,,,,,,,,,,,,,
SMPL189,"V311 With 18 Coupler Universal cable, DMM, FPG",,,,,,,,,,,,,,
SMPL190,"V317 With 18 Coupler Universal cable, DMM, FPG",,,,,,,,,,,,,,
SMPL191,"V519 With 18 Coupler Universal cable, DMM, FPG",,,,,,,,,,,,,,
,"Blue ELM327 with 18 Coupler Universal Cable DMM,FPG",,,,,,,,,,,,,,
,"V317 With 18 Coupler Universal cable, DMM",,,,,,,,,,,,,,
,"V519 With 18 Coupler Universal cable, DMM",,,,,,,,,,,,,,
,V519 With 11 Coupler Universal Cable,,,,,,,,,,,,,,
,V519 With 7 in 1 Royal Enfield Universal Cable,,,,,,,,,,,,,,
SMPL066,Slim OBD-II Male Connector,,,,,,,66,1,,,,67,,
SMPL067,Ultra OBD-II Male Connector,,,,,,,46,,2,,12,46,,
SMPL069,OBD-II 90 degree Male Connector,,,,,,,9,,,,,9,,
SMPL116,OBD Enclosure/OBD CoverMale Connector for GPS,,,,,,,0,,,,,,,
SMPL062,OBD-II Ultra Male Connector with 16 Core Wire Open End Moulded (2 Meter Black),,,,,,,8,1,,,,11,,
SMPL101,Ultra male connector with 8 Core open end wire,,,,,,,,,,,,,,
SMPL068,Ultra OBD-II FeMale Connector,,,,,,,28,,,,,,,
SMPL070,Female connector (Without Enclosure),,,,,,,22,,,,,,,
SMPL071,Press Fit OBD-II Female Connector,,,,,,,25,,,,,,,
SMPL059,OBD-II Female Connector with 16 Core Wire Open End,,,,,,,18,,,,,,,
SMPL060,OBD-II Female Connector with 8 Core Wire Open End Moulded (30 cm),,,,,,,,,,,,,,
SMPL048,OBD II Y Splitter Round Cable Male - Female - Female,,,,,,,20,,2,,2,18,,
SMPL049,OBD II Y Splitter Flat Cable Male - Female - Female,,,,,,,10,,,,,,,
SMPL053,OBDII Female-Male-Female T Splitter cable,,,,,,,68,1,,,,69,,
SMPL064,OBD-II Male to OBD Female cable Round Extension cable Moulded 1 Meter,,,,,,,40,,,,,,,
SMPL065,OBD-II Male to OBD Female 16 core Flat Extension cable (60 cm),,,,,,,,,,,,,,
SMPL083,OBD-II 16 Male Connctor ( Withount Enclosure ),,,,,,,,,,,,,,
,USB Cable A To B 1.5 Meter Black,,,,,,,77,,,1,1,76,,
,Digital Multimiter,,,,,,,6,,,,,,,
,Fuel Pressure Guage,,,,,,,17,,6,,6,13,,
,Universal OBD-ll 16 pin male to DB9 female dignostic cable,,,,,,,,,,,,,,
,"Electronic Spices RJ45 Cat 6 Cable Ethernet Patch LAN Network Laptop Cable (2 M),2M, Yellow",,,,,,,,,,,,,,`;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function determineCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('scanner') || n.includes('elm 327') || n.includes('elm327') || n.includes('ktag') || n.includes('launch') || n.includes('fault detector') || n.includes('tester') || n.includes('v311') || n.includes('v317') || n.includes('v519')) {
    return 'Diagnostic Tool / Scanner';
  }
  if (n.includes('two wheeler') || n.includes('bike') || n.includes('yamaha') || n.includes('kawasaki') || n.includes('jawa') || n.includes('jupitor') || n.includes('hero') || n.includes('ktm') || n.includes('royal enfield')) {
    return 'Bike & 2-Wheeler OBD Cable';
  }
  if (n.includes('connector') || n.includes('enclosure') || n.includes('press fit')) {
    return 'OBD Connector & Enclosure';
  }
  if (n.includes('splitter') || n.includes('extension') || n.includes('y splitter') || n.includes('t splitter') || n.includes('patch lan') || n.includes('usb cable')) {
    return 'OBD Splitter & Extension Cable';
  }
  if (n.includes('multimiter') || n.includes('pressure guage')) {
    return 'Workshop & Testing Equipment';
  }
  return 'OBD Diagnostic Cable';
}

function determineBrand(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('ashok leyland')) return 'Ashok Leyland';
  if (n.includes('tata')) return 'Tata Motors';
  if (n.includes('mahindra')) return 'Mahindra';
  if (n.includes('bosch')) return 'Bosch';
  if (n.includes('bmw')) return 'BMW';
  if (n.includes('mercedes') || n.includes('mc bnz') || n.includes('benz')) return 'Mercedes-Benz';
  if (n.includes('force')) return 'Force Motors';
  if (n.includes('toyota')) return 'Toyota';
  if (n.includes('kia')) return 'Kia Motors';
  if (n.includes('yamaha')) return 'Yamaha';
  if (n.includes('honda')) return 'Honda';
  if (n.includes('suzuki')) return 'Suzuki';
  if (n.includes('bajaj')) return 'Bajaj';
  if (n.includes('tvs')) return 'TVS';
  if (n.includes('hero')) return 'Hero';
  if (n.includes('royal enfield')) return 'Royal Enfield';
  if (n.includes('kawasaki')) return 'Kawasaki';
  if (n.includes('jawa')) return 'Jawa';
  if (n.includes('launch')) return 'Launch';
  if (n.includes('mapout24') || n.includes('mapout 24')) return 'MapOut24';
  if (n.includes('elm327') || n.includes('elm 327')) return 'ELM327';
  if (n.includes('gscan')) return 'G-Scan';
  return 'Sunyash / MapOut24';
}

async function run() {
  console.log('--- Parsing and inserting product data ---');
  const lines = rawCsv.split('\n').map(l => l.trim()).filter(Boolean);
  
  let inserted = 0;
  let updated = 0;
  let autoSkuIndex = 101;
  const seenSkus = new Set<string>();

  for (const line of lines) {
    if (line.startsWith('Old SMPL ID') || line.startsWith(',,,,,') || line.includes('samer,1')) {
      continue;
    }

    const cols = parseCSVLine(line);
    const rawSmplId = cols[0] ? cols[0].toUpperCase() : '';
    const rawName = cols[1];

    if (!rawName || rawName.length < 3) continue;

    // Stock columns:
    // col 8: opening stock (nov)
    // col 9: return
    // col 10: online
    // col 11: offline
    // col 12: sales
    // col 13: closing stock (nov)
    const openingStock = parseFloat(cols[8]) || 0;
    const closingStock = parseFloat(cols[13]) || (openingStock > 0 ? openingStock : 0);

    let sku = rawSmplId;
    if (!sku) {
      sku = `SMPL-AUTO-${autoSkuIndex++}`;
    }

    // Ensure SKU uniqueness in this batch
    let finalSku = sku;
    let dupCount = 1;
    while (seenSkus.has(finalSku)) {
      finalSku = `${sku}-${dupCount++}`;
    }
    seenSkus.add(finalSku);

    const category = determineCategory(rawName);
    const brand = determineBrand(rawName);

    // Default prices based on category
    let sellingPrice = 1200;
    let purchaseCost = 650;
    if (category.includes('Scanner') || category.includes('Diagnostic Tool')) {
      sellingPrice = 3500;
      purchaseCost = 2100;
    } else if (category.includes('Connector')) {
      sellingPrice = 350;
      purchaseCost = 180;
    } else if (category.includes('Splitter')) {
      sellingPrice = 850;
      purchaseCost = 450;
    } else if (category.includes('Bike')) {
      sellingPrice = 1450;
      purchaseCost = 750;
    }

    const productData = {
      productCode: finalSku,
      sku: finalSku,
      name: rawName,
      category,
      brand,
      connectorType: rawName.includes('OBD-II') || rawName.includes('OBD2') ? 'OBD-II 16-Pin' : 'Proprietary Diagnostic Connector',
      cableLengthWireSpec: rawName.includes('Moulded') ? 'Moulded Diagnostic Cable' : 'Automotive Grade Cable',
      vehicleScannerCompatibility: brand,
      subcategory: category,
      description: `${rawName}. High-durability automotive diagnostic connection solution engineered for workshops and telematics diagnostics.`,
      purchaseCost,
      sellingPrice,
      discount: 0,
      gstPercent: 18,
      hsnSac: '85444220',
      openingStock: openingStock,
      currentStock: closingStock > 0 ? closingStock : openingStock,
      minStock: 5,
      maxStock: 500,
      status: 'ACTIVE',
    };

    // Upsert into ProductMaster
    const existing = await prisma.productMaster.findFirst({
      where: {
        OR: [
          { sku: finalSku },
          { name: rawName },
          { productCode: finalSku }
        ]
      }
    });

    if (existing) {
      await prisma.productMaster.update({
        where: { id: existing.id },
        data: {
          currentStock: productData.currentStock,
          openingStock: productData.openingStock,
          category: productData.category,
          brand: productData.brand,
          sellingPrice: existing.sellingPrice > 0 ? existing.sellingPrice : productData.sellingPrice,
          purchaseCost: existing.purchaseCost > 0 ? existing.purchaseCost : productData.purchaseCost,
          updatedAt: new Date(),
        }
      });
      updated++;
    } else {
      await prisma.productMaster.create({
        data: productData
      });
      inserted++;
    }
  }

  const finalTotal = await prisma.productMaster.count();
  console.log(`Finished processing! Inserted: ${inserted}, Updated: ${updated}, Total in DB: ${finalTotal}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error importing products:', err);
  process.exit(1);
});
