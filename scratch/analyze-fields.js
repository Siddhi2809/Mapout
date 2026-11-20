const xlsx = require("xlsx");
const path = require("path");

const filePath = path.resolve(__dirname, "..", "Quate.xlsx");
const wb = xlsx.readFile(filePath);
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

console.log("Total rows:", rows.length);

const populatedFields = {};
for (const key of Object.keys(rows[0])) {
  populatedFields[key] = 0;
}

let emptyQuoteNo = 0;
let emptyQuoteNumber = 0;
let emptySubject = 0;
let emptyDeal = 0;
let emptySubtotal = 0;
let emptyGrandTotal = 0;

for (const r of rows) {
  for (const k of Object.keys(rows[0])) {
    if (r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== "") {
      populatedFields[k]++;
    }
  }
}

console.log("\nPopulated count per field (out of " + rows.length + "):");
console.log(JSON.stringify(populatedFields, null, 2));

console.log("\nFirst 3 rows complete JSON:");
console.log(JSON.stringify(rows.slice(0, 3), null, 2));

// Check date conversion (Excel serial dates)
function excelDateToJS(serial) {
  if (!serial || isNaN(serial)) return serial;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split("T")[0];
}

console.log("\nDate test for row 1:");
console.log("Created Time:", rows[0]["Created Time"], "->", excelDateToJS(rows[0]["Created Time"]));
console.log("Valid Until:", rows[0]["Valid Until"], "->", excelDateToJS(rows[0]["Valid Until"]));
