const xlsx = require("xlsx");
const path = require("path");

const files = ["Ashok Leyland Data Sorting.xlsx", "Book1.xlsx"];

for (const f of files) {
  const filePath = path.resolve(__dirname, "..", f);
  const wb = xlsx.readFile(filePath);
  console.log(`\n========================================`);
  console.log(`File: ${f}`);
  console.log(`Sheet names:`, wb.SheetNames);
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
    console.log(`\n  Sheet: ${sheetName}`);
    console.log(`  Total rows:`, data.length);
    if (data.length > 0) {
      console.log(`  Headers (row 0):`, JSON.stringify(data[0]));
    }
    if (data.length > 1) {
      console.log(`  Sample row 1:`, JSON.stringify(data[1]));
    }
    if (data.length > 2) {
      console.log(`  Sample row 2:`, JSON.stringify(data[2]));
    }
  }
}
