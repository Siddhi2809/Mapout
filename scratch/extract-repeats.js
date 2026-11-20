const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

function extractRepeats() {
  const filePath = path.resolve(__dirname, "..", "Account Details.xlsx");
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  console.log(`Loaded ${rows.length} rows.`);

  // Group rows by normalized Account Name
  const groups = new Map();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rawName = r["Account Name"] || "";
    const normName = String(rawName).trim().toLowerCase().replace(/\s+/g, " ");

    if (!groups.has(normName)) {
      groups.set(normName, []);
    }
    groups.get(normName).push({
      excelRowNumber: i + 2, // Excel 1-based index (header is row 1)
      accountName: rawName,
      phone: r["Phone"] || "",
      billingCity: r["Billing City"] || "",
      billingState: r["Billing State"] || "",
      billingStreet: r["Billing Street"] || "",
      billingCode: r["Billing Code"] || "",
      createdTime: r["Created Time"] || "",
      description: r["Description"] || "",
    });
  }

  // Filter only groups with > 1 row
  const repeatedGroups = [];
  const repeatedRowsOnly = []; // the 2nd, 3rd, etc. occurrences (the 324 extra rows)
  const allInstancesOfRepeated = []; // all rows that belong to any repeated group

  let extraRowsCount = 0;

  for (const [normName, items] of groups.entries()) {
    if (items.length > 1) {
      repeatedGroups.push({
        accountName: items[0].accountName,
        totalOccurrences: items.length,
        instances: items,
      });

      // The 1st is the original; index 1..end are the repeat/duplicate entries
      for (let j = 1; j < items.length; j++) {
        repeatedRowsOnly.push({
          repeatIndex: j + 1,
          ofTotal: items.length,
          ...items[j],
        });
        extraRowsCount++;
      }

      for (const it of items) {
        allInstancesOfRepeated.push(it);
      }
    }
  }

  // Sort groups by occurrence count descending
  repeatedGroups.sort((a, b) => b.totalOccurrences - a.totalOccurrences);

  console.log(`Unique account names that repeat: ${repeatedGroups.length}`);
  console.log(`Total repeat/extra rows (total occurrences - unique): ${extraRowsCount}`);

  // Create an Excel file containing the repeated records for easy review
  const outWb = xlsx.utils.book_new();

  // Sheet 1: Just the 324 duplicate / repeat rows
  const ws1 = xlsx.utils.json_to_sheet(repeatedRowsOnly);
  xlsx.utils.book_append_sheet(outWb, ws1, "324 Duplicate Rows");

  // Sheet 2: All occurrences grouped together for comparison
  const fullList = [];
  for (const g of repeatedGroups) {
    for (let k = 0; k < g.instances.length; k++) {
      const inst = g.instances[k];
      fullList.push({
        "Group Account Name": g.accountName,
        "Occurrence #": `${k + 1} of ${g.totalOccurrences}`,
        "Excel Row": inst.excelRowNumber,
        "Account Name in Excel": inst.accountName,
        "Phone": inst.phone,
        "City": inst.billingCity,
        "State": inst.billingState,
        "Street / Address": inst.billingStreet,
        "Postal / Billing Code": inst.billingCode,
        "Description": inst.description,
      });
    }
  }
  const ws2 = xlsx.utils.json_to_sheet(fullList);
  xlsx.utils.book_append_sheet(outWb, ws2, "All Occurrences Grouped");

  const outFilePath = path.resolve(__dirname, "..", "Repeated_Accounts_List.xlsx");
  xlsx.writeFile(outWb, outFilePath);
  console.log(`Saved Excel report to: ${outFilePath}`);

  // Output summary json for immediate view
  const summaryJsonPath = path.resolve(__dirname, "repeated_accounts_summary.json");
  fs.writeFileSync(summaryJsonPath, JSON.stringify({
    totalRepeatedAccounts: repeatedGroups.length,
    totalExtraRows: extraRowsCount,
    topRepeated: repeatedGroups.slice(0, 30).map(g => ({
      name: g.accountName,
      count: g.totalOccurrences,
      rows: g.instances.map(i => i.excelRowNumber),
      cities: [...new Set(g.instances.map(i => i.billingCity).filter(Boolean))],
      phones: [...new Set(g.instances.map(i => i.phone).filter(Boolean))],
    }))
  }, null, 2));

  console.log(`Saved summary to: ${summaryJsonPath}`);
}

extractRepeats();
