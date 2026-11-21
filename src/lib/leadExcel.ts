import * as XLSX from 'xlsx';
import { Lead, LeadStatus } from '../types/erp';

export interface ParsedLeadRow {
  rowNumber: number;
  leadName: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  industry: string;
  source: string;
  salesperson: string;
  website: string;
  requirement: string;
  expectedValue: number;
  notes: string;
  status?: LeadStatus;
  contactDate?: string;
  contactTime?: string;
  // Analysis
  isValid: boolean;
  validationError?: string;
  isDuplicate: boolean;
  duplicateReason?: string;
  matchedExistingLead?: Lead;
  duplicateAction: 'update' | 'skip' | 'asNew';
  chosenAction?: 'update' | 'skip' | 'asNew' | 'as_new';
  availableFields: string[];
  missingFields: string[];
}

export interface ImportPreviewAnalysis {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  newCount: number;
  rows: ParsedLeadRow[];
  fieldStats: {
    field: string;
    label: string;
    filledCount: number;
    emptyCount: number;
    filledPercent: number;
  }[];
  columnsFound: string[];
  columnsMissing: string[];
}

// Clean fake or placeholder values into empty strings
export function sanitizeCellValue(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  const lower = str.toLowerCase();
  const dummyValues = [
    'n/a',
    'na',
    'none',
    'null',
    'undefined',
    'unknown',
    'not available',
    'not applicable',
    '-',
    '--',
    '.',
    'nil',
  ];
  if (dummyValues.includes(lower)) return '';
  return str;
}

// Normalize phone numbers to 10 digits for accurate duplicate matching
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

// Normalize email for duplicate matching
export function normalizeEmail(email?: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * 1. Generate & download the official Lead Import Excel template
 */
export function downloadLeadExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // Column Headers (clearly indicating required vs optional)
  const headers = [
    'Lead Name',
    'Company Name',
    'Contact Person',
    'Mobile Number',
    'Alternate Mobile',
    'Email',
    'Address',
    'City',
    'State',
    'Pincode',
    'GSTIN',
    'Industry',
    'Lead Source',
    'Salesperson',
    'Website',
    'Requirement',
    'Expected Value',
    'Notes',
    'Status',
    'Contact Date',
    'Contact Time',
  ];

  // Sample data explicitly demonstrating incomplete data is allowed
  const sampleData = [
    [
      'ABC Industries',
      'ABC Pvt Ltd',
      'Ramesh Sharma',
      '9876543210',
      '',
      'ramesh@abcind.com',
      'Plot 42, MIDC Industrial Area',
      'Pune',
      'Maharashtra',
      '411019',
      '27AAAAA0000A1Z5',
      'Automotive',
      'Website',
      'Rajesh Kumar',
      'https://abcind.com',
      'OBD-II GPS Tracking Devices (50 units)',
      500000,
      'High priority inquiry received from website contact form',
      'Contacted',
      '2026-11-02',
      '11:30 AM',
    ],
    [
      'XYZ Traders',
      'XYZ Logistics Ltd',
      'Anil Verma',
      '9988776655',
      '',
      'anil@xyzlogistics.com',
      '',
      'Mumbai',
      'Maharashtra',
      '',
      '',
      'Transport & Logistics',
      'Referral',
      'Priya Sharma',
      '',
      'Fleet wire harnesses & cables',
      250000,
      'Referred by existing client Bansal Cargo',
      'Follow-up',
      '2026-11-01',
      '03:45 PM',
    ],
    [
      'Omkar Enterprises',
      '',
      '',
      '9822334455',
      '',
      '',
      '',
      'Surat',
      'Gujarat',
      '',
      '',
      'Manufacturing',
      'Phone',
      'Vikram Singh',
      '',
      'Heavy duty battery cables',
      150000,
      'Inquiry received over phone; contact details to be completed later',
      'Not Contacted',
      '',
      '',
    ],
  ];

  const wsData = [headers, ...sampleData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Styling column widths
  ws['!cols'] = [
    { wch: 22 }, // Lead Name
    { wch: 22 }, // Company Name
    { wch: 18 }, // Contact Person
    { wch: 16 }, // Mobile Number
    { wch: 16 }, // Alternate Mobile
    { wch: 24 }, // Email
    { wch: 28 }, // Address
    { wch: 15 }, // City
    { wch: 16 }, // State
    { wch: 12 }, // Pincode
    { wch: 18 }, // GSTIN
    { wch: 18 }, // Industry
    { wch: 15 }, // Lead Source
    { wch: 16 }, // Salesperson
    { wch: 22 }, // Website
    { wch: 32 }, // Requirement
    { wch: 16 }, // Expected Value
    { wch: 35 }, // Notes
    { wch: 18 }, // Status
    { wch: 15 }, // Contact Date
    { wch: 15 }, // Contact Time
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Leads Template');

  // Instructions Sheet
  const instructions = [
    ['CRM LEAD IMPORT TEMPLATE - USER GUIDE & INSTRUCTIONS'],
    [''],
    ['1. REQUIRED FIELDS:'],
    ['   - "Lead Name" is the only strictly required field.'],
    ['   - It is highly recommended to provide at least one contact identifier: Mobile Number OR Email.'],
    [''],
    ['2. INCOMPLETE LEADS ARE WELCOME:'],
    ['   - You do NOT need to fill every column. Fill whatever information you currently have.'],
    ['   - Any optional fields left blank will be stored as empty in CRM.'],
    ['   - The sales team can easily complete the profile later directly inside CRM.'],
    [''],
    ['3. DUPLICATE DETECTION:'],
    ['   - The CRM automatically checks for duplicate leads using Mobile Number, Email, and Company Name.'],
    ['   - If a duplicate is detected, you will have options to Update, Skip, or Import as New.'],
    [''],
    ['4. SUPPORTED FORMATS:'],
    ['   - Microsoft Excel (.xlsx, .xls) and CSV (.csv) files are supported.'],
  ];
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Trigger download
  XLSX.writeFile(wb, 'CRM_Lead_Import_Template.xlsx');
}

/**
 * 2. Parse Excel or CSV File
 * Automatically detects the real header row even if preceded by blank lines,
 * title banners, or leading empty commas.
 */
export async function parseLeadFile(file: File): Promise<any[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) return [];

  // Parse as 2D array of arrays first to dynamically find the real header row
  const aoa: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!aoa || aoa.length === 0) return [];

  const knownHeaderKeywords = [
    'company',
    'lead',
    'name',
    'mobile',
    'phone',
    'contact',
    'email',
    'city',
    'district',
    'state',
    'remark',
    'remarks',
    'pipeline',
    'status',
    'address',
    'mo .no',
    'mono',
    'gst',
    'pincode',
  ];

  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(aoa.length, 25); r++) {
    const row = aoa[r];
    if (!Array.isArray(row)) continue;
    const matchCount = row.filter((cell) => {
      const str = String(cell || '').trim().toLowerCase();
      return knownHeaderKeywords.some((kw) => str.includes(kw));
    }).length;

    if (matchCount >= 2) {
      headerRowIndex = r;
      break;
    }
  }

  // Fallback: first non-empty row
  if (headerRowIndex === -1) {
    headerRowIndex = aoa.findIndex((row) => Array.isArray(row) && row.some((c) => String(c).trim() !== ''));
    if (headerRowIndex === -1) headerRowIndex = 0;
  }

  const rawHeaders = aoa[headerRowIndex] || [];
  const cleanHeaders = rawHeaders.map((h, colIdx) => {
    const str = String(h || '').trim();
    return str || `__COLUMN_${colIdx}`;
  });

  const resultRows: any[] = [];
  for (let r = headerRowIndex + 1; r < aoa.length; r++) {
    const row = aoa[r];
    if (!Array.isArray(row)) continue;
    const hasData = row.some((cell) => String(cell || '').trim() !== '');
    if (!hasData) continue;

    const rowObj: Record<string, any> = {};
    cleanHeaders.forEach((header, colIdx) => {
      rowObj[header] = row[colIdx] !== undefined ? row[colIdx] : '';
    });
    resultRows.push(rowObj);
  }

  return resultRows;
}

/**
 * Helper to match headers flexibly
 */
function findValue(row: any, keys: string[]): string {
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const direct = row[k];
    if (direct !== undefined && direct !== '') return sanitizeCellValue(direct);

    // Case-insensitive & normalized search
    const normSearch = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = rowKeys.find(
      (rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === normSearch
    );
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
      return sanitizeCellValue(row[foundKey]);
    }
  }
  return '';
}

/**
 * 3. Validate, Normalize & Analyze Rows against Existing Leads
 */
export function analyzeLeadsForImport(
  rawRows: any[],
  existingLeads: Lead[]
): ImportPreviewAnalysis {
  const parsedRows: ParsedLeadRow[] = [];

  const fieldKeys: { [key: string]: string } = {
    leadName: 'Lead Name',
    companyName: 'Company Name',
    contactPerson: 'Contact Person',
    mobile: 'Mobile Number',
    alternateMobile: 'Alternate Mobile',
    email: 'Email',
    address: 'Address',
    city: 'City',
    state: 'State',
    pincode: 'Pincode',
    gstin: 'GSTIN',
    industry: 'Industry',
    source: 'Lead Source',
    salesperson: 'Salesperson',
    website: 'Website',
    requirement: 'Requirement',
    expectedValue: 'Expected Value',
    notes: 'Notes',
    contactDate: 'Contact Date',
    contactTime: 'Contact Time',
  };

  const fieldFillCounts: { [key: string]: number } = {};
  Object.keys(fieldKeys).forEach((k) => (fieldFillCounts[k] = 0));

  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;
  let newCount = 0;

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // Accounting for 1-based index + header row

    const leadName = findValue(row, ['Lead Name', 'Lead', 'Name', 'Contact Name', 'Prospect Name', 'Title']);
    const companyName = findValue(row, ['Company Name', 'Company', 'Organization', 'Firm', 'Account', 'Client Name']);
    const contactPerson = findValue(row, ['Contact Person', 'Person', 'Representative', 'POC', 'Contact']);
    const mobile = findValue(row, [
      'Mobile Number',
      'Mobile No',
      'Mobile',
      'Phone',
      'Phone Number',
      'Cell',
      'Telephone',
      'Mo .No.',
      'Mo. No.',
      'Mo No',
      'Contact No',
      'Contact Number',
    ]);
    const alternateMobile = findValue(row, [
      'Alternate Mobile',
      'Alt Mobile',
      'Secondary Phone',
      'Phone 2',
      'Alternate Phone',
      'Alt Phone',
    ]);
    const email = findValue(row, ['Email', 'Email Address', 'Mail', 'E-mail', 'Email Id']);
    const address = findValue(row, ['Address', 'Street', 'Street Address', 'Location', 'Office Address']);
    const city = findValue(row, ['City', 'District', 'Town', 'Place']);
    const state = findValue(row, ['State', 'Province', 'Region']);
    const pincode = findValue(row, ['Pincode', 'Pin Code', 'Zip', 'Postal Code', 'Zip Code']);
    const gstin = findValue(row, ['GSTIN', 'GST', 'GST Number', 'Tax ID', 'GST No']);
    const industry = findValue(row, ['Industry', 'Sector', 'Business Type', 'Domain']);
    const source = findValue(row, ['Lead Source', 'Source', 'Channel']) || 'Import';
    const salesperson = findValue(row, ['Salesperson', 'Sales Person', 'Assigned User', 'Assigned To', 'Sales Rep', 'Owner']);
    const website = findValue(row, ['Website', 'URL', 'Web', 'Domain Name']);
    const requirement = findValue(row, ['Requirement', 'Interested Product', 'Product', 'Inquiry', 'Needs', 'Product Requirement', 'Description']);
    const rawVal = findValue(row, ['Expected Value', 'Deal Value', 'Value', 'Budget', 'Estimated Value', 'Amount']);
    const expectedValue = parseFloat(rawVal) || 0;
    const notes = findValue(row, ['Notes', 'Remarks', 'Remark', 'Comments', 'Details', 'Background', 'Lead Pipeline Status', 'Pipeline Status']);
    const contactDate = findValue(row, ['Contact Date', 'Contacted Date', 'Call Date', 'Date Contacted']);
    const contactTime = findValue(row, ['Contact Time', 'Contacted Time', 'Call Time', 'Time Contacted']);
    const rawStatus = findValue(row, ['Status', 'Lead Status', 'Stage', 'Current Status', 'Lead Pipeline Status', 'Pipeline Status', 'Remark', 'Remarks']);
    let rowStatus: LeadStatus = 'Not Contacted';
    if (rawStatus) {
      const sLow = rawStatus.toLowerCase();
      if (sLow.includes('not contact') || sLow.includes('call not received') || sLow.includes('not picking') || sLow.includes('busy')) {
        rowStatus = 'Not Contacted';
      } else if (sLow.includes('follow') || sLow.includes('call back') || sLow.includes('call cut')) {
        rowStatus = 'Follow-up';
      } else if (sLow.includes('catalouge') || sLow.includes('catalogue') || sLow.includes('ctalouge') || sLow.includes('send') || sLow.includes('contacted') || sLow.includes('purchased')) {
        rowStatus = 'Contacted';
      } else if (sLow.includes('interest') || sLow.includes('deal') || sLow.includes('quotation') || sLow.includes('convert') || sLow.includes('close')) {
        rowStatus = 'Interested';
      } else if (sLow.includes('new')) {
        rowStatus = 'Not Contacted';
      }
    }

    // Check availability
    const availableFields: string[] = [];
    const missingFields: string[] = [];

    // Fallback effective lead name (e.g. Lead 919571274999 if only phone provided, or Company Name)
    const effectiveLeadName = leadName || companyName || contactPerson || (mobile ? `Lead ${mobile}` : '');

    const leadData: { [k: string]: any } = {
      leadName: effectiveLeadName,
      companyName,
      contactPerson,
      mobile,
      alternateMobile,
      email,
      address,
      city,
      state,
      pincode,
      gstin,
      industry,
      source,
      salesperson,
      website,
      requirement,
      expectedValue: expectedValue > 0 ? expectedValue : '',
      notes,
      contactDate,
      contactTime,
    };

    Object.entries(fieldKeys).forEach(([key, label]) => {
      const val = leadData[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        availableFields.push(label);
        fieldFillCounts[key] = (fieldFillCounts[key] || 0) + 1;
      } else {
        missingFields.push(label);
      }
    });

    let isValid = true;
    let validationError: string | undefined = undefined;

    if (!effectiveLeadName) {
      isValid = false;
      validationError = 'Missing Lead Name, Company Name, Contact Person, or Mobile Number.';
    }

    // Duplicate detection rules:
    // 1. Mobile Number
    // 2. Email
    // 3. Company Name + Contact Person
    // 4. Company Name + Lead Name
    let isDuplicate = false;
    let duplicateReason: string | undefined = undefined;
    let matchedExistingLead: Lead | undefined = undefined;

    const normMob = normalizePhone(mobile);
    const normAltMob = normalizePhone(alternateMobile);
    const normEm = normalizeEmail(email);
    const normComp = companyName.trim().toLowerCase();
    const normPerson = (contactPerson || leadName).trim().toLowerCase();

    for (const ex of existingLeads) {
      const exMob = normalizePhone(ex.mobile);
      const exAltMob = normalizePhone(ex.alternateMobile);
      const exEm = normalizeEmail(ex.email);
      const exComp = (ex.companyName || '').trim().toLowerCase();
      const exPerson = (ex.contactPerson || ex.leadName || '').trim().toLowerCase();

      // Rule 1: Mobile match
      if (normMob && (normMob === exMob || (exAltMob && normMob === exAltMob))) {
        isDuplicate = true;
        duplicateReason = `Mobile number matched existing lead (${ex.leadNumber} - ${ex.leadName || ex.companyName})`;
        matchedExistingLead = ex;
        break;
      }
      if (normAltMob && (normAltMob === exMob || (exAltMob && normAltMob === exAltMob))) {
        isDuplicate = true;
        duplicateReason = `Alternate Mobile matched existing lead (${ex.leadNumber} - ${ex.leadName || ex.companyName})`;
        matchedExistingLead = ex;
        break;
      }

      // Rule 2: Email match
      if (normEm && normEm === exEm) {
        isDuplicate = true;
        duplicateReason = `Email matched existing lead (${ex.leadNumber} - ${ex.leadName || ex.companyName})`;
        matchedExistingLead = ex;
        break;
      }

      // Rule 3: Company Name + Contact Person match
      if (normComp && normComp.length > 2 && normPerson && normPerson.length > 2) {
        if (normComp === exComp && normPerson === exPerson) {
          isDuplicate = true;
          duplicateReason = `Company Name & Contact Person matched existing lead (${ex.leadNumber})`;
          matchedExistingLead = ex;
          break;
        }
      }
    }

    if (!isValid) {
      invalidCount++;
    } else if (isDuplicate) {
      duplicateCount++;
    } else {
      newCount++;
    }

    if (isValid) {
      validCount++;
    }

    parsedRows.push({
      rowNumber,
      leadName: effectiveLeadName,
      companyName,
      contactPerson,
      mobile,
      alternateMobile,
      email,
      address,
      city,
      state,
      pincode,
      gstin,
      industry,
      source,
      salesperson,
      website,
      requirement,
      expectedValue,
      notes,
      status: rowStatus,
      contactDate,
      contactTime,
      isValid,
      validationError,
      isDuplicate,
      duplicateReason,
      matchedExistingLead,
      duplicateAction: isDuplicate ? 'update' : 'asNew',
      availableFields,
      missingFields,
    });
  });

  const totalRows = rawRows.length;
  const fieldStats = Object.entries(fieldKeys).map(([key, label]) => {
    const filled = fieldFillCounts[key] || 0;
    const empty = Math.max(0, totalRows - filled);
    const pct = totalRows > 0 ? Math.round((filled / totalRows) * 100) : 0;
    return {
      field: key,
      label,
      filledCount: filled,
      emptyCount: empty,
      filledPercent: pct,
    };
  });

  const columnsFound = fieldStats.filter((f) => f.filledCount > 0).map((f) => f.label);
  const columnsMissing = fieldStats.filter((f) => f.filledCount === 0).map((f) => f.label);

  return {
    totalRows,
    validCount,
    invalidCount,
    duplicateCount,
    newCount,
    rows: parsedRows,
    fieldStats,
    columnsFound,
    columnsMissing,
  };
}

/**
 * 4. Generate & Download Error Report Excel File
 */
export function downloadErrorReport(
  failedRows: { rowNumber: number; leadName: string; reason: string; details?: string }[],
  fileName = 'Lead_Import_Error_Report.xlsx'
) {
  const wb = XLSX.utils.book_new();
  const data = [
    ['Row #', 'Lead Name', 'Error Reason', 'Suggested Action'],
    ...failedRows.map((f) => [
      f.rowNumber,
      f.leadName || 'Unnamed',
      f.reason,
      f.details || 'Provide a valid Lead Name and correct the formatting in the Excel file.',
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 45 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Failed Rows');
  XLSX.writeFile(wb, fileName);
}

/**
 * 5. Export Leads to Excel
 */
export function exportLeadsToExcel(leads: Lead[], filename = 'Leads_Export.xlsx') {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Lead ID',
    'Date',
    'Company Name',
    'Contact Person',
    'Mobile Number',
    'Alternate Mobile',
    'Email Address',
    'City',
    'State',
    'Pincode',
    'Office Address',
    'GSTIN',
    'Industry',
    'Source',
    'Salesperson',
    'Brand / Requirement',
    'Interested Product',
    'Expected Value',
    'Status',
    'Contact Date',
    'Contact Time',
    'Next Follow-up Date',
    'Notes / Remarks',
  ];

  const rows = leads.map((l) => [
    l.leadNumber || '',
    l.createdAt ? l.createdAt.split('T')[0] : '',
    l.companyName || l.leadName || '',
    l.contactPerson || '',
    l.mobile || '',
    l.alternateMobile || '',
    l.email || '',
    l.city || '',
    l.state || '',
    l.pincode || '',
    l.address || '',
    l.gstin || '',
    l.industry || '',
    l.source || '',
    l.salesperson || l.assignedUser || '',
    l.requirement || '',
    l.interestedProductName || '',
    l.expectedValue || 0,
    l.status || '',
    l.contactDate || '',
    l.contactTime || '',
    l.nextFollowUpDate || '',
    l.notes || '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Configure column widths
  ws['!cols'] = [
    { wch: 15 }, // Lead ID
    { wch: 12 }, // Date
    { wch: 28 }, // Company Name
    { wch: 20 }, // Contact Person
    { wch: 16 }, // Mobile Number
    { wch: 16 }, // Alternate Mobile
    { wch: 25 }, // Email Address
    { wch: 15 }, // City
    { wch: 15 }, // State
    { wch: 10 }, // Pincode
    { wch: 30 }, // Office Address
    { wch: 16 }, // GSTIN
    { wch: 18 }, // Industry
    { wch: 14 }, // Source
    { wch: 18 }, // Salesperson
    { wch: 25 }, // Brand / Requirement
    { wch: 22 }, // Interested Product
    { wch: 14 }, // Expected Value
    { wch: 15 }, // Status
    { wch: 14 }, // Contact Date
    { wch: 14 }, // Contact Time
    { wch: 16 }, // Next Follow-up Date
    { wch: 30 }, // Notes / Remarks
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  XLSX.writeFile(wb, filename);
}

