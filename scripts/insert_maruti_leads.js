const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rawCsv = `,,,,,
,,,,,
,Company Name,City/District,State,Mo .No.,Remark
,Bhatia Maruti Suzuki Service Center,Kota,Rajasthan,919571274999,Send Catalouge
,Bhatia Maruti Suzuki Service Center,Ujjan,Madhya Pradesh,919829736081,Send Catalouge
,Mayank Maruti Suzuki Service Center,Chitargad,Rajasthan,919414179001,9571275999 Contact this number
,Ktl Maruti Suzuki Service Center,,,917379557377,Call Not Received
,Navneet Maruti Suzuki Service,Thikariya,Rajasthan,917665000644,Send Catalouge
,Navneet Maruti Suzuki Service Center,Udaipur,Rajasthan,919950156579,Send Catalouge
,Tanu Maruti Suzuki Service Center,Dholka,Gujarat,919909006085,Deal close
,Maruthi Bosch,,,919423193884,Call Not Received
,Maruti Suzuki Service,,,919009780478,Invalid Number
,Bunty Maruti Motors,,,919718611310,Call Cut
,Maruti Suzuki,,,918929268068,Not Contacted
,Maruti Suzuki,,,917408404421,Call not Received
,Dada Maruti Suzuki Service Center,,,919109900360,
,Maruti Suzuki Service,Ambikapur,Chhatigarh,919425256087,Send Catalouge
,Swamy Maruti Suzuki,Chennai,Tamil Nadu,919840891916,Send Catalouge
,Kars Maruti Suzuki,,Tamil Nadu,919841097259,Call cut
,Kar Care Maruti Suzuki,,,917299912055,Call Not Received
,Abirami Maruti Suzuki,,,919840017558,Not Picking
,Perfect Maruti,,Tamil Nadu,919789974300,Call cut
,Easvari Maruti Suzuki,,,919840855655,
,Kar Kraft Maruti,Pallakad,Kerla,919349607619,Send Ctalouge
,J D Maruti Service,,,919443172635,Call Not Received
,Cresco Maruti Suzuki Service,Chennai,Tamil Nadu,917305087055,Send Ctalouge
,Rajlaksmi Maruti Suzuki,,,918939995476,Call Not Received
,South India Maruti Service,,,919843027601,Call Not Received
,Ja Krishna Maruti Suzuki Service,Kombitore,Tamil Nadu,919788850733,Send Ctalouge
,Sree Sadamble Maruti Suzuki Service,Chennai,Tamil Nadu,919655240477,Send Ctalouge
,Sree Maruti Suzuki Service,,,919943066026,Call Not Received
,A B T Maruti,,,919500945094,Call Not Received
,Ambal Maruti,,,919585877775,Call Not Received
,Ambal Maruti Suzuki,,,919943177775,Repet Number
,Meenakshi Maruti Suzuki,,Tamil Nadu,919940094881,Not Required
,Asir Maruti Suzuki,,,919944059911,Call Not Received
,Ganesh Maruti Suzuki,Kanjivaram,Tamil Nadu,919842306061,He is Purchased Authoize Cables
,Vishnu Maruti Suzuki,,,919677122225,Call Not Received
,Sathuragiri Maruti Suzuki,,,919047033678,Call Not Received
,Aadhi Maruti Suzuki,,,918870713444,Send Ctalouge
,Sri Amman Maruti Suzuki,,,919715044600,Call Not Received
,Hi Tech Maruti Suzuki,,Tamil Nadu,919842447725,Call Cut
,Sri Shakti Maruti,,,919842701566,Call Not Received
,Sri Krishna Maruti Suzuki,,,919842721805,Invalid Number
,Sm Maruti Suzuki,,,917094440057,Call Not Received
,Abirami Maruti Suzuki Service,,,919003498608,Call Not Received
,Ambal Maruti Suzuki Service,,,918220862666,Call Not Received
,Sree Ambal Maruti,,,918870561666,Call Not Received
,Shenkaba Maruti Suzuki Service,Poundachery,Tamil Nadu,918220046178,Send Ctalouge
,Ome Maruti Suzuki,,,917299976465,Call Not Received
,Svc Maruti Suzuki,Kanchipuram,Tamil Nadu,919043032290,send Quotation
,Hi Tech Maruti,,,919585538671,Call Not Received
,Sri Balaji Maruti Suzuki,Madurai,Tamil Nadu,919994169309,Send Ctalouge
,United Maruti Suzuki,,,919961432941,Call Not Received
,Magnum Maruti Suzuki,,,919842231340,Call Not Received
,Tech Zone Maruti Suzuki,,,919842651158,Call Not Received
,Shri Maruti Automobile,Surat,Gujarat,919157433391,Send Ctalouge
,Kvr Maruti Suzuki,,,919747020777,Call Not Received
,Vishnua Maruti Suzuki,Gujarat,Gujarat,918754417168,Send Ctalouge
,Maruti Needs,Salem,Tamil Nadu,919940099500,Send Ctalouge
,Asir Maruti Suzuki,Tiruchirappalli,Tamil Nadu,918344992220,Send Ctalouge
,Tee Pee Maruti,,Tamil Nadu,918547201421,Send Ctalouge
,Suraksha Maruti Suzuki,,,918046837061,Invalid Number
,Maruti Showroom,,,918884419114,Call Not Received
,Bimal Auto Maruti Suzuki,,,918046837075,Call Not Received
,Shashti Maruti Suzuki Service,,,914466813793,Invalid Number
,Auto Tech Maruti Suzuki,,,919941019455,Call Not Received
,Vbk Maruti Suzuki Service,,Tamil Nadu,919841425030,Send Ctalouge
,Amma Maruti Suzuki,,Tamil Nadu,918012518012,Send Ctalouge
,Nsk Maruti Suzuki,,Tamil Nadu,919841047232,Send Ctalouge
,Sri Vinayaka Maruti,,Tamil Nadu,919443245096,Call Not Received
,Auto Scan Maruti,Osur,Tamil Nadu,918122904091,Send Ctalouge
,Aadarsh Maruti,,Tamil Nadu,919880195465,Send Ctalouge
,Unique Maruti,,Tamil Nadu,919841059295,Call Cut
,Lakshmi Maruti Suzuki,,Tamil Nadu,919842275959,Call Not Received
,Chendu Maruti Suzuki,Pallakadd,Tamil Nadu,919842225058,9095099999 Head Office Number
,Maruti Service,,Tamil Nadu,918068527174,Call Not Received
,Athens Maruti Service,,Tamil Nadu,917094434179,Send Ctalouge
,Shanthi Maruti Service,,,919443089750,Call Not Received
,Cars Maruti Service,Chennai,Tamil Nadu,919952000079,Send Ctalouge
,R M S Maruti Auto,Mailarudi,Tamil Nadu,919842922685,Send Ctalouge
,Vyths Maruti Service,Trichy,Tamil Nadu,919597382187,Deal Done
,S R K Maruti Service,,Tamil Nadu,919843011520,Send Ctalouge
,Ambal Maruti,Gulbarga,Karnatka,919597550777,Send Ctalouge
,Ambal Maruti Auto,,Tamil Nadu,919047070035,Send Ctalouge
,Maruti Suzuki Service,Neouatinkala,Kerala,919747544500,Alrady Purchased
,Aadarsh Maruti Auto,,Tamil Nadu,919133307724,Call Not Received
,Meena kshi Maruti,,Tamil Nadu,919940224881,Call Not Received
,Aie Maruti Suzuki,,Tamil Nadu,917401212797,Call Not Received
,Asir Maruti Suzuki,,Tamil Nadu,919750372220,
,Triveni Maruti Suzuki Service,Trinchurulu,Tamil Nadu,919003311488,Currently No Requirement
,Varun Maruti Service,,Tamil Nadu,919885206555,Call cut
,Aadarsh Maruti,,Telangana,918886092222,
,Jayabheri Maruti,,Tamil Nadu,919100909400,"Busy Call , Call Back"
,Sai Maruti Service Ravi,,,919985392000,
,Gem Motor Maruti,Manikonda,Telangana,919912899128,
,Pavan Maruti,,,919121293690,Call not Received
,Raja Maruti Suzuki,,,919976606021,Call not Received
,Adarsha Maruti,,,918886492222,Call not Received
,Maruti Suzuki,,,917094471317,Call not Received
,Autofin Maruti,,,918885040130,Call not Received
,Auto Club Maruti,,,919447440184,Call not Received
,Yakshay Maruti Suzuki,,,919744076850,Call not Received
,Sarathy Maruti,Kochin,Kerala,919947270665,Send Catalouge
,Abhiran Maruti,,Kerala,918046837003,Not Contacted
,Indus Maruti Service,,Kerala,919745998022,Not Contacted
,Abhiran Maruti Service,,Kerala,919880232999,Send Ctalouge
,Mannil Maruti Service,,Kerala,919447258496,Not Intersted
,Agt Maruti Service,,,919744409444,Not Contacted
,Maruti Suzuki,,,918297784119,9133347704 Call On This Number
,Nexa Maruti Suzuki Service,,,919959513945,Call Cut
,MSA Motors Maruti,,,919154150655,Invalid Number
,Maruti Suzuki Service Center,Vijaywada,Andra Pradesh,917799787989,Send Ctalouge
,Maruti Authorized Service Center,Kurnul,Andra Pradesh,919866362847,Send Ctalouge
,Maruti Suzuki Service,,,916901261696,
,Maruti Suzuki Delars,,,918133971100,Worng Number
,Maruti Suzuki Service,,,919101443277,
,LMJ Maruti Service,,,919680436393,
,Maruti Suzuki,Hyderabad,Telangana,917705800655,Send Ctalouge
,KTL Maruti Suzuki,,Telangana,917800007327,
,Maruti Suzuki Service,,Telangana,911204071965,
,Maruti Suzuki Service,,Telangana,918929131215,Call Not Received
,Maruti Suzuki,,Telangana,916572340404,
,Maruti Suzuki,,,918929268035,
,Maruti Suzuki,Dighushay,Bihar,919297876221,9204756221 Contact this number
,Maruti Suzuki Service,,Bihar,917488066036,
,Maruti Suzuki Service,,Bihar,917277772777,
,Maruti Suzuki Service Center,,Bihar,918929409903,Call not Received
,Maruti Suzuki Service ( Karlo Automobiles),,Bihar,917004573547,Send Catlouge
,Maruti Suzuki Service (Gs Motors),,Bihar,918929285594,Send Catlouge
,Hi- Tek Motorz Maruti,,Bihar,919872567868,Send Catlouge
,Maruti Suzuki Arena,,Bihar,918929400441,Call not Received
,Maruti Suzuki Panchkula,,,918929400442,Busy Call
,Maruti Suzuki Panchkula,,,918929459811,Invalid Number
,Maruti Suzuki Pioneer,,,918001374567,Call not Received
,Maruti Suzuki Service Center,,,918929480472,Call not Received
,Maruti Suzuki Service (Autopace Network),,,918558835511,Send Catalouge
,Maruti Suzuki Arena,Patila,Punjab,918929400414,Send Catalouge
,Maruti Suzuki Arena,,,918929400413,Call not Received
,Maruti Suzuki Service,Raipur,Chattisgarh,919111011381,Send Catalouge
,Maruti Suzuki Service,,,917909800093,Not Intersted
,Maruti Suzuki Servi (HDN Motors),,,917909800024,Send Catalouge
,Maruti Suzuki Arena,,,914066588311,
,Maruti Suzuki Arena,,,917089888882,Call not Received
,Maruti Suzuki Service ( Skay Automobiles),,,919981515414,Send Catalouge
,Maruti Suzuki Service Center,,,914066588322,
,Maruti Suzuki Service (Sprash Automobiles),,,919977953000,Send Catalouge
,Maruti Suzuki Arena Skay Automobiles,,,919522200991,Call Not Received
,Maruti Suzuki Skay Automobiles,,,919893307429,Call Cut
,VK Maruti Technical Services,Gargoti,Maharashtra,919404068015,
,Maruti Cycle Company,Gargoti,Maharashtra,917798345280,
,Maruti Choching Centre,Gargoti,Maharashtra,919359032148,Call Not Received
,Maruti Suzuki Service,Gondia,Maharashtra,917030922983,Send Catalogue
,Shree Maruti Courier Service Pvt Ltd,Gondia,Maharashtra,917378326899,Send Catalogue
,Mayur Motors Maruti,Guhagar,Maharashtra,919422431112,Send Catalogue
,Maruti Suzuki,Hinganghat,Maharashtra,919552559962,Call Not Received
,Maruti Suzuki,Chandrapur,Maharashtra,918669167436,No Recqirement
,Maruti Technical Service,Hupari,Maharashtra,919049636668,No Requirement
,Maruti Suzuki,Igatpuri,Maharashtra,919730300165,No Requirement
,Omkar Auto Maruti Workshop,Sangli,Maharashtra,919422410051,Send Catalogue
,Sri Krishna Maruti Service Center,Jalna,Maharashtra,919422218792,call cut
,Maruti Suzuki,Jalna,Maharashtra,919158000024,Call Not Received
,Maruti Services,Jalna,Maharashtra,912402338353,Send Catalouge
,Maruti Suzuki,Jalgaon,Maharashtra,919421799272,Send Catalogue
,Maruti Suzuki,Jath,Maharashtra,919130049606,Call Not Received
,Maruti Suzuki,Solapur,Maharashtra,917774092790,Currntly no requirement
,Seva Maruti Automobiles,Dhule,Maharashtra,919960090611,Not picking
,Maruti Suzuki,,Maharashtra,918999070523,worng Number
,Maruti Suzuki,Kayan,Maharashtra,918898769377,Send Catalogue
,Maruti Automobiles,Kalyan,Maharashtra,917620051559,worng Number
,Maruti Suzuki,,Maharashtra,918879638807,Call Not Received
,Maruti Washing Centre,Kalyan,Maharashtra,919372046113,Call Not Received
,Maruti Suzuki,Kalyan,Maharashtra,917304532563,
,Maruti Suzuki,Kamshet,Maharashtra,919766084999,Currently No Requirement
,Maruti Suzuki,Mumbai,Maharashtra,919860287059,Call Cut
,Wonders Cars Bhosari,Pune,Maharashtra,918799908563,Send Catalogue
,Maruti Y,,Maharashtra,918956481581,Call Not Received
,Maruti Suzuki,Kankavali,Maharashtra,919326713480,Send Catalogue
,Maruti Suzuki,Kankavali,Maharashtra,918326744460,Send Catalogue
,Maruti Car Service Workshop,Kankavali,Maharashtra,919860642339,Currntly No Requirement
,Maruti Auto Service,Kannad,Maharashtra,919822218551,Not Received
,Maruti Suzuki,Shirdi,Maharashtra,919021261799,Send Catalogue
,Maruti Suzuki,Ahmedabad,Maharashtra,917875225077,Worng Number
,Shree Maruti Suzuki Care Point,Karad,Maharashtra,919960123892,Not Received
,Maruti Suzuki,,Maharashtra,918408887823,Currently No Requirement
,Maruti Suzuki,,Maharashtra,918551991666,Not Received
,Chembur Motors Maruti Authorised Service Centre,Karad,Maharashtra,918080801503,Send Catalouge
,Maruti Suzuki,Karjat,Maharashtra,918291935075,Send Catalouge
,Navnit Maruti Worksheet,Karjat,Maharashtra,918047485215,Send Catalogue
,Maruti Suzuki,,,917796865285,Not Received
,Maruti Car Sanjivani( Maruti Authorised Service Centre,Karjat,Maharashtra,917903865161,Call cut
,Maruti Suzuki,,,919403961526,Not Received
,Amit Service Station Maruti,Karjat,Maharashtra,912412778336,
,Maruti Suzuki,,,918669978964,Send Catalogue
,Maruti Suzuki,Khamgaon,Maharashtra,919422127735,Send Catalogue
,Maruti Suzuki,Khamgaon,Maharashtra,919326320948,Send Catalogue
,Maruti Suzuki,Akola,Maharashtra,918550994024,8956709206 Contact This Number
,Maruti Auto Works,Kharghar,Maharashtra,919930547311,Not Intersted
,Maruti Auto Works,Kharghar,Maharashtra,919819017822,Send Catalogue
,Maruti Motor Driving School,Kharghar,Maharashtra,919930766631,Not Received
,Maruti Nexa Workshop - Pune Baner,Kharghar,Maharashtra,917208909811,Not Received
,Maruti Suzuki,,,918850501211,Not Received
,My Car Pune Pvt Ltd Maruti,Khed,Maharashtra,919326530089,Not Received
,Om Maruti Motors,Khed,Maharashtra,919850852214,Send Catalouge
,Maruti Suzuki,Khed,Maharashtra,918655929273,Invalid Number
,Maruti Suzuki,,,919930335999,
,Maruti Service Centre,Khed,Maharashtra,919764909060,Currntly No Requirement
,Ace Kundale Car Pvt. Ltd Maruti,Khed,Maharashtra,919689914037,Send Catalouge
,Himalaya Cars Maruti,Kinwat,Maharashtra,917232249991,Invalid Number
,Maruti Automobiles,Kinwat,Maharashtra,917385473656,Not Received
,Maruti Suzuki,Kinwat,Maharashtra,918888827101,Amar Sir Mo.9011014729
,Maruti Auto Service Center,Kolhapur,Maharashtra,919922101333,Send Catalouge
,Maruti Auto Service Center,Kolhapur,Maharashtra,919922101383,Currntly No Requirement
,Maruti Auto,Koly,Maharashtra,919673245590,Send Catalouge
,Maruti Auto Garage And Auto Auto Mobile,Kurduwadi,Maharashtra,917741079655,Send Catalouge
,Maruti Auto Garage,Kurduwadi,Maharashtra,919765467538,Call Not Received
,Om Service Centre Maruti,Kurduwadi,Maharashtra,919850437003,Send Catalouge
,Maruti Campus,Latur,Maharashtra,919850164696,Send Catalouge
,Maruti Car Garage,Latur,Maharashtra,919850650276,Call cut
,Maruti Suzuki Sai Service Andheri Workshop,Mumbai,Maharashtra,912243030606,
,Sai Service Lower Parel Maruti Suzuki Authorised Service Workshop,Mumbai,Maharashtra,912243030557,
,Sai Service Lower Parel Maruti Suzuki Authorised Service Workshop,Mumbai,Maharashtra,912243430606,
,KTS Automotors- Authorised Maruti Suzuki Service Center,Mumbai,Maharashtra,912225940725,
,Maruti Suzuki Authorised Service ( St. Francis Automobile),Mumbai,Maharashtra,919892876396,Call Not Received
,Maruti Suzuki Authorised Service ( Hind Automobile),Mumbai,Maharashtra,919892201052,Call Not Received
,Maruti Suzuki Service Center,Mumbai,Maharashtra,919869009100,Call Cut
,"Maruti Suzuki Authorised Service Centre, Mulund West ( Velox Motors)",Mumbai,Maharashtra,918071968387,Send Catalouge
,Maruti Suzuki Velox Motors,Mumbai,Maharashtra,918928451476,Send Catalouge
,Maruti Suzuki Authorised Service ( Ravi Automobiles,Mumbai,Maharashtra,918657442190,Not Connected
,Chembur Motors Maruti Authorised Service Station,Mumbai,Maharashtra,918080801530,Call Not Received
,Steringmotor- Maruti Suzuki Authorised Service Center,Mumbai,Maharashtra,917045831195,Call Not Received
,Maruti Suzuki,Mumbai,Maharashtra,917447408836,Call Not Received
,Maruti Suzuki,Mumbai,Maharashtra,919423339749,Send Catalouge
,Maruti Suzuki Authorised Service ( Chetan Motors),Mumbai,Maharashtra,912227840564,
,Maruti Suzuki Service ( Supreme Automobiles),Mumbai,Maharashtra,912250647461,
,Shah Car Care Maruti Authorised Service Station,Mumbai,Maharashtra,918451911281,Send Catalouge
,Maruti Suzuki Authorised Service (Carkraft Automobile And Infrastructure),Mumbai,Maharashtra,912225628005,
,Maruti Suzuki,Mumbai,Maharashtra,912241556623,
,Maruti Suzuki Genuine Parts,Mumbai,Maharashtra,917506728441,call not received
,Maruti Suzuki Service ( Sai Service),Mumbai,Maharashtra,918068970328,Invalid Number
,"Maruti Suzuki Arena (Fort point Automotive Cars, Thane , Godbunder Road)",Mumbai,Maharashtra,912262328035,
,Maruti Suzuki Arena ( Sai Service),Mumbai,Maharashtra,912249177839,
,Maruti Suzuki,Mumbai,Maharashtra,917304532530,Send Catalouge
,Maruti Suzuki,Mumbai,Maharashtra,919167980015,call not received
,Automotive Maruti Suzuki Dealer,Mumbai,Maharashtra,912512447445,
,Maruti Suzuki Driving School - Shivam Auto zone,Mumbai,Maharashtra,919664838888,Call not received
,Maruti Suzuki Service ( Sai Service),Mumbai,Maharashtra,918068970349,Call not Received
,Excell Autovista Pvt Ltd Maruti - Service,Mumbai,Maharashtra,918068970386,Call not Received
,"Maruti Suzuki Arena ( Automotive Manufacturers, Dombivali, Azdegaon)",Mumbai,Maharashtra,912262328052,
,"Maruti Suzuki Arena( Prakash Auto, Ulhasnagar, Vithalwadi Station Road)",Mumbai,Maharashtra,912262328142,Call not Received
,Prince Service Center - Maruti Authorised,Mumbai,Maharashtra,919869034445,Send Catalouge
,Maruti Suzuki,Mumbai,Maharashtra,918956148813,Send Catalouge
,Maruti Suzuki,Mumbai,Maharashtra,917030336277,Send Catalouge
,Maruti Suzuki,Mumbai,Maharashtra,918291983084,Send Catalouge
,Maruti Suzuki,Mumbai,Maharashtra,918433958585,Call Not Received
,Maruti Suzuki,Mumbai,Maharashtra,918291957748,Send Catalouge
,Maruti Suzuki,Mumbai,Maharashtra,918956927515,Send Catalouge
,Smriti Ranjan Maruti Suzuki,,Odisha,919937198684,
,Autovista Maruti Suzuki Workshop,Mumbai,Maharashtra,918068970447,Call Not Received
,Maruti Suzuki Service Center,Karnal,Haryana,919896009100,Send Catalouge
,Maruti Auto Centre,Mumbai,Maharashtra,919619698125,Call Not Received
,Maruti Suzuki India Limited,Mumbai,Maharashtra,912245042300,
,Maruti Auto,Mumbai,Maharashtra,918433849286,Send Catalouge
,Excell Autovista Pvt Ltd Maruti,Mumbai,Maharashtra,912265999111,`;

function parseCsv(text) {
  const lines = text.split(/\r?\n/);
  const rows = [];
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    const cells = [];
    let inQuotes = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    rows.push(cells);
  }
  return rows;
}

// Map Remark to Lead Status
function mapStatus(remark) {
  if (!remark) return 'New';
  const r = remark.toLowerCase();
  if (r.includes('deal close') || r.includes('deal done')) return 'Interested';
  if (r.includes('send cat') || r.includes('send ctalouge') || r.includes('send quotation') || r.includes('quotation')) return 'Contacted';
  if (r.includes('call not received') || r.includes('not contacted') || r.includes('not picking') || r.includes('not received') || r.includes('call cut') || r.includes('invalid') || r.includes('worng') || r.includes('not intersted') || r.includes('not required') || r.includes('not connected')) return 'Not Contacted';
  if (r.includes('busy') || r.includes('call back') || r.includes('contact this number') || r.includes('call on this')) return 'Follow-up';
  if (r.includes('purchased') || r.includes('alrady')) return 'Contacted';
  return 'New';
}

const SALESPERSONS = [
  'Rajesh Kumar',
  'Priya Sharma',
  'Amit Verma',
  'Sneha Patel',
];

async function main() {
  console.log('--- STARTING LEAD IMPORT ---');
  const allRows = parseCsv(rawCsv);
  const headerIdx = allRows.findIndex(r => r.some(c => c.toLowerCase().includes('company name')));
  if (headerIdx === -1) {
    throw new Error('Header row not found in CSV');
  }

  const dataRows = allRows.slice(headerIdx + 1).filter(r => r.some(c => c.length > 0));
  console.log(`Found ${dataRows.length} valid data rows to insert.`);

  const importId = 'import_maruti_suzuki_' + Date.now();
  const leadsToInsert = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const companyName = row[1] ? row[1].trim() : '';
    const city = row[2] ? row[2].trim() : null;
    const state = row[3] ? row[3].trim() : null;
    const mobile = row[4] ? row[4].trim() : null;
    const remark = row[5] ? row[5].trim() : null;

    if (!companyName && !mobile) continue;

    const leadNum = `LD-2026-${String(i + 1).padStart(3, '0')}`;
    const assigned = SALESPERSONS[i % SALESPERSONS.length];
    const status = mapStatus(remark);

    // Extract any contact person name if in remarks (e.g. "Amar Sir Mo.9011014729" -> Amar Sir)
    let contactPerson = companyName;
    if (remark && remark.toLowerCase().includes('sir')) {
      const match = remark.match(/([a-zA-Z\s]+sir)/i);
      if (match) contactPerson = match[1].trim();
    }

    leadsToInsert.push({
      id: `lead-maruti-${i + 1}`,
      leadNumber: leadNum,
      leadName: companyName,
      companyName: companyName,
      contactPerson: contactPerson,
      mobile: mobile,
      city: city || null,
      state: state || null,
      notes: remark || null,
      status: status,
      source: 'Phone',
      salesperson: assigned,
      assignedUser: assigned,
      industry: 'Automotive / Service Center',
      requirement: 'OBD Diagnostic Cables & Scanner Connectors',
      expectedValue: status === 'Interested' ? 25000 : (status === 'Contacted' ? 12000 : 5000),
      contactDate: '2026-11-14',
      importId: importId,
    });
  }

  console.log(`Prepared ${leadsToInsert.length} lead records.`);

  // Insert in batches of 50
  const batchSize = 50;
  let insertedCount = 0;
  for (let b = 0; b < leadsToInsert.length; b += batchSize) {
    const batch = leadsToInsert.slice(b, b + batchSize);
    const res = await prisma.lead.createMany({
      data: batch,
      skipDuplicates: true,
    });
    insertedCount += res.count;
    console.log(`Inserted batch ${Math.floor(b / batchSize) + 1}: ${res.count} records`);
  }

  // Create LeadImportHistory record
  await prisma.leadImportHistory.create({
    data: {
      id: importId,
      fileName: 'Maruti_Suzuki_Service_Centers.csv',
      importedBy: 'Admin',
      importDate: '2026-11-14',
      totalRows: leadsToInsert.length,
      newLeads: insertedCount,
      updatedLeads: 0,
      duplicateLeads: 0,
      failedRows: 0,
      status: 'Completed',
    },
  });

  console.log(`--- SUCCESS: Imported ${insertedCount} leads into PostgreSQL database ---`);

  // Verify counts by salesperson and status
  const totalLeads = await prisma.lead.count();
  console.log(`Total Leads in Database now: ${totalLeads}`);

  const distribution = {};
  for (const sp of SALESPERSONS) {
    distribution[sp] = await prisma.lead.count({ where: { salesperson: sp } });
  }
  console.log('Distribution across Salespersons:', distribution);

  const statusSummary = {};
  const statuses = ['New', 'Contacted', 'Interested', 'Follow-up', 'Not Contacted'];
  for (const st of statuses) {
    statusSummary[st] = await prisma.lead.count({ where: { status: st } });
  }
  console.log('Distribution across Statuses:', statusSummary);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('FAILED TO IMPORT LEADS:', err);
  process.exit(1);
});
