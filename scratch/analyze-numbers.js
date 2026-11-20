const xlsx = require("xlsx");
const path = require("path");

const filePath = path.resolve(__dirname, "..", "Quate.xlsx");
const wb = xlsx.readFile(filePath);
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

let smplCount = 0;
let emptyQuoteNo = 0;
let otherQuoteNo = 0;

for (const r of rows) {
  const qno = r["Quote_NO"];
  if (!qno) {
    emptyQuoteNo++;
  } else if (String(qno).startsWith("SMPL")) {
    smplCount++;
  } else {
    otherQuoteNo++;
    console.log("Other Quote_NO:", qno);
  }
}

console.log({
  totalRows: rows.length,
  emptyQuoteNo,
  smplCount,
  otherQuoteNo
});
