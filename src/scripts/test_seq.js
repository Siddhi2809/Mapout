function extractCodeNumber(code, prefix) {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();
  const cleanPrefix = prefix.trim().toUpperCase();
  const regex = new RegExp(`^${cleanPrefix}[\\-_]?(\\d+)`, 'i');
  const match = cleanCode.match(regex);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    // Ignore non-sequential huge numbers (barcodes, timestamps > 999999)
    if (!isNaN(num) && num > 0 && num <= 999999) {
      return num;
    }
  }
  const trailingDigits = cleanCode.match(/(\d+)$/);
  if (trailingDigits && trailingDigits[1]) {
    const num = parseInt(trailingDigits[1], 10);
    if (!isNaN(num) && num > 0 && num <= 999999) {
      return num;
    }
  }
  return null;
}

function generateNextEntityCode(prefix, existingCodes) {
  let maxNum = 100;
  for (const code of existingCodes) {
    if (!code) continue;
    const num = extractCodeNumber(code, prefix);
    if (num !== null && num > maxNum) {
      maxNum = num;
    }
  }
  let nextNum = maxNum + 1;
  const existingSet = new Set(existingCodes.filter(Boolean).map(c => c.trim().toUpperCase()));
  while (existingSet.has(`${prefix}-${nextNum}`.toUpperCase())) {
    nextNum++;
  }
  return `${prefix}-${nextNum}`;
}

const existing = ['QT-101', '21886000025470043', 'QT-21886000025470044', 'QT-TEST-99'];
console.log('Next Quotation code:', generateNextEntityCode('QT', existing));
