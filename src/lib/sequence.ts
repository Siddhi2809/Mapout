// Centralized Entity Prefix Configuration & Sequence Generator
// Each business entity has its own prefix and independent sequence starting from 101.

export const ENTITY_PREFIXES = {
  RAW_MATERIAL: 'RM',
  PRODUCT: 'PRD',
  SUPPLIER: 'SUP',
  CUSTOMER: 'CUS',
  PRODUCTION: 'PROD',
  PURCHASE_ORDER: 'PO',
  SALES_ORDER: 'SO',
  INVOICE: 'INV',
  DISPATCH: 'DSP',
  PAYMENT: 'PAY',
  RETURN: 'RET',
  PURCHASE_REQUEST: 'PR',
  QUOTATION: 'QT',
} as const;

export type EntityType = keyof typeof ENTITY_PREFIXES;

/**
 * Extracts sequence number from a code string given its prefix.
 * e.g., "RM-101" or "RM101" -> 101
 * "CUST-001" -> 1
 */
export function extractCodeNumber(code: string, prefix: string): number | null {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();
  const cleanPrefix = prefix.trim().toUpperCase();

  // Match prefix followed optionally by hyphen or dash and digits
  const regex = new RegExp(`^${cleanPrefix}[\\-_]?(\\d+)`, 'i');
  const match = cleanCode.match(regex);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }

  // Fallback: extract any trailing digits
  const trailingDigits = cleanCode.match(/(\d+)$/);
  if (trailingDigits && trailingDigits[1]) {
    const num = parseInt(trailingDigits[1], 10);
    return isNaN(num) ? null : num;
  }

  return null;
}

/**
 * Computes the next code for an entity type given a list of existing code strings.
 * Rules:
 * 1. Independent sequence per entity prefix.
 * 2. Starts from 101 if no existing records.
 * 3. Inspects existing records, finds highest existing number, and returns highest + 1.
 * 4. Never reuses deleted numbers (since max existing number is preserved in counter or derived from highest).
 * 5. Returns formatted code e.g. "RM-101", "PRD-102".
 */
export function generateNextEntityCode(
  entityType: EntityType,
  existingCodes: (string | undefined | null)[],
  maxCounterStore?: Record<string, number>
): string {
  const prefix = ENTITY_PREFIXES[entityType];
  let maxNum = 100; // Baseline so first generated number is 101 (100 + 1)

  // Check stored persistent max counter if available
  if (maxCounterStore && maxCounterStore[entityType] !== undefined) {
    maxNum = Math.max(maxNum, maxCounterStore[entityType]);
  }

  // Scan existing codes to find the true highest number
  for (const code of existingCodes) {
    if (!code) continue;
    const num = extractCodeNumber(code, prefix);
    if (num !== null && num > maxNum) {
      maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}-${nextNum}`;
}
