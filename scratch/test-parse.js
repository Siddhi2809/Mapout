const XLSX = require('xlsx');

// Read the text data user provided
const csvData = `Company Name *,Contact Person Name *,Mobile Number *,Alternate Mobile,Email Address,GST Number,PAN Number,Category / Type,Office / Billing Address,Shipping Address,City *,State *,Pincode,Country,Payment Terms,Credit Limit (INR),Assigned Salesperson,Customer Source,Notes / Remarks
13 MOTO RIDE AND CARE.,sachin kamble.,,,,,,,shop no 03 mohan mansion gulmohar lane Sion chunabhatti,shop no 03 mohan mansion gulmohar lane Sion chunabhatti,mumbai,Maharashtra,400022,India,,,,,
180 degree automotive,Ajau Dutta,,,,,,,"180 degree automotive beside dolphin bar, tatibandh Raipur","180 degree automotive beside dolphin bar, tatibandh Raipur",Raipur,Chattisgarh,492001,India,,,,,
2020 Motors Pvt Ltd,Lalit Batra,,,,,,,"G.T. Road, NH 44, Paragpur, Jalandhar - 144005","G.T. Road, NH 44, Paragpur, Jalandhar - 144005",Jalandhar,Punjab,144005,India,,,,,`;

const wb = XLSX.read(csvData, { type: 'string' });
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws);
console.log('Sample parsed row:', rows[0]);
