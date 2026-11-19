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

async function run() {
  console.log('--- Updating Product Metrics (Opening Nov, Returns, Online Sales, Offline Sales, Sales Count, Available Nov) ---');
  const lines = rawCsv.split('\n').map(l => l.trim()).filter(Boolean);

  let updatedCount = 0;

  for (const line of lines) {
    if (line.startsWith('Old SMPL ID') || line.startsWith(',,,,,') || line.includes('samer,1')) {
      continue;
    }

    const cols = parseCSVLine(line);
    const rawSmplId = cols[0] ? cols[0].toUpperCase() : '';
    const rawName = cols[1];

    if (!rawName || rawName.length < 3) continue;

    // CSV Columns:
    // col 8: opening stock (nov)
    // col 9: return
    // col 10: online
    // col 11: offline
    // col 12: sales
    // col 13: available / closing stock (nov)
    const openingStockNov = parseFloat(cols[8]) || 0;
    const returnCount = parseFloat(cols[9]) || 0;
    const onlineSales = parseFloat(cols[10]) || 0;
    const offlineSales = parseFloat(cols[11]) || 0;
    const salesCount = parseFloat(cols[12]) || (onlineSales + offlineSales);
    const availableStockNov = parseFloat(cols[13]) || (openingStockNov > 0 ? openingStockNov : 0);

    // Look up product in DB
    const existing = await prisma.productMaster.findFirst({
      where: {
        OR: [
          ...(rawSmplId ? [{ sku: rawSmplId }, { productCode: rawSmplId }] : []),
          { name: rawName }
        ]
      }
    });

    if (existing) {
      await prisma.$executeRawUnsafe(`
        UPDATE "ProductMaster"
        SET 
          "openingStock" = $1,
          "currentStock" = $2,
          "returnCount" = $3,
          "onlineSalesCount" = $4,
          "offlineSalesCount" = $5,
          "salesCount" = $6,
          "replacementCount" = $7
        WHERE "id" = $8
      `, 
        openingStockNov,
        availableStockNov,
        returnCount,
        onlineSales,
        offlineSales,
        salesCount,
        returnCount, // Replacement count mirrored from returns where applicable
        existing.id
      );

      // Also ensure FinishedGood mirror table has the exact stock if present
      await prisma.$executeRawUnsafe(`
        UPDATE "FinishedGood"
        SET 
          "currentStock" = $1
        WHERE "sku" = $2 OR "name" = $3
      `, availableStockNov, existing.sku, existing.name).catch(() => {});

      updatedCount++;
    }
  }

  console.log(`Successfully updated metrics for ${updatedCount} products!`);
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error updating product metrics:', err);
    process.exit(1);
  });
