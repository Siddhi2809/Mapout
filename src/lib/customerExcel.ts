import * as XLSX from 'xlsx';
import { Customer } from '../types/erp';

export interface ParsedCustomerRow {
  rowNumber: number;
  customerCode?: string;
  companyName: string;
  name: string;
  customerType?: string;
  contactPerson?: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  gstType?: string;
  address?: string;
  shippingAddress?: string;
  city: string;
  state: string;
  pincode?: string;
  country?: string;
  category?: string;
  paymentTerms?: string;
  creditLimit?: number;
  assignedSalesUser?: string;
  customerSource?: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  isValid: boolean;
  validationError?: string;
  isDuplicate: boolean;
  duplicateReason?: string;
}

export function downloadCustomerExcelTemplate() {
  const headers = [
    'Company Name *',
    'Contact Person Name *',
    'Mobile Number *',
    'Alternate Mobile',
    'Email Address',
    'GST Number',
    'PAN Number',
    'Category / Type',
    'Office / Billing Address',
    'Shipping Address',
    'City *',
    'State *',
    'Pincode',
    'Country',
    'Payment Terms',
    'Credit Limit (INR)',
    'Assigned Salesperson',
    'Customer Source',
    'Notes / Remarks',
  ];

  const sampleRows = [
    [
      'Apex Motors Pvt Ltd',
      'Suresh Patil',
      '9876543210',
      '9123456780',
      'contact@apexmotors.in',
      '27AAACA1234A1Z5',
      'AAACA1234A',
      'Distributor',
      'Shop 14, Auto Market, MIDC Bhosari',
      'Plot 45, Industrial Zone, Chakan, Pune',
      'Pune',
      'Maharashtra',
      '411026',
      'India',
      'Net 30 Days',
      '200000',
      'Rajesh Kumar',
      'Website',
      'Bulk buyer for OBD GPS scanner cables',
    ],
    [
      'Star Diagnostic Tools',
      'Amit Shah',
      '9822001122',
      '',
      'amit@stardiag.com',
      '24BBBCB5678B1Z2',
      'BBBCB5678B',
      'Retailer',
      '201 Galaxy Commercial Complex, Ring Road',
      '',
      'Surat',
      'Gujarat',
      '395002',
      'India',
      'Prepaid',
      '50000',
      'Priya Sharma',
      'IndiaMART',
      'Monthly orders for diagnostic adapters',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 26 }, // Company Name
    { wch: 22 }, // Contact Person
    { wch: 16 }, // Mobile
    { wch: 16 }, // Alt Mobile
    { wch: 24 }, // Email
    { wch: 18 }, // GST
    { wch: 14 }, // PAN
    { wch: 16 }, // Category
    { wch: 32 }, // Billing Address
    { wch: 32 }, // Shipping Address
    { wch: 14 }, // City
    { wch: 16 }, // State
    { wch: 10 }, // Pincode
    { wch: 10 }, // Country
    { wch: 14 }, // Payment Terms
    { wch: 18 }, // Credit Limit
    { wch: 20 }, // Salesperson
    { wch: 16 }, // Customer Source
    { wch: 30 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');
  XLSX.writeFile(wb, 'Customer_Import_Template.xlsx');
}

export async function parseCustomerFile(file: File): Promise<any[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return rawRows;
}

export function analyzeCustomersForImport(
  rawRows: any[],
  existingCustomers: Customer[]
): {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  newCount: number;
  rows: ParsedCustomerRow[];
} {
  const existingMobiles = new Set(
    existingCustomers
      .map((c) => (c.mobile || '').replace(/\D/g, '').slice(-10))
      .filter(Boolean)
  );
  const existingGsts = new Set(
    existingCustomers
      .map((c) => (c.gstNumber || '').trim().toUpperCase())
      .filter(Boolean)
  );
  const existingNames = new Set(
    existingCustomers
      .map((c) => (c.companyName || c.name || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const parsedRows: ParsedCustomerRow[] = [];

  rawRows.forEach((r, idx) => {
    // Flexible header mapping
    const getVal = (...keys: string[]) => {
      for (const k of keys) {
        for (const rk of Object.keys(r)) {
          if (rk.trim().toLowerCase() === k.trim().toLowerCase()) {
            return String(r[rk] || '').trim();
          }
        }
      }
      return '';
    };

    const companyName = getVal('Company Name *', 'Company Name', 'Company', 'Customer Name', 'Client');
    const contactPerson = getVal('Contact Person Name *', 'Contact Person Name', 'Contact Person', 'Contact', 'Name');
    const mobileRaw = getVal('Mobile Number *', 'Mobile Number', 'Mobile', 'Phone', 'Contact Number');
    const mobile = mobileRaw ? mobileRaw.replace(/\D/g, '').slice(-10) : '';
    const alternateMobile = getVal('Alternate Mobile', 'Alt Mobile', 'Phone 2');
    const email = getVal('Email Address', 'Email', 'Email ID');
    const gstNumber = getVal('GST Number', 'GSTIN', 'GST').toUpperCase();
    const panNumber = getVal('PAN Number', 'PAN').toUpperCase();
    const category = getVal('Category / Type', 'Category', 'Customer Type', 'Type') || '';
    const address = getVal('Office / Billing Address', 'Address', 'Billing Address');
    const shippingAddress = getVal('Shipping Address', 'Delivery Address');
    const city = getVal('City *', 'City') || '';
    const state = getVal('State *', 'State') || '';
    const pincode = getVal('Pincode', 'Pin Code', 'Postal Code');
    const country = getVal('Country', 'Nation') || '';
    const paymentTerms = getVal('Payment Terms', 'Terms') || '';
    const creditLimitRaw = getVal('Credit Limit (INR)', 'Credit Limit', 'Credit');
    const creditLimit = creditLimitRaw ? parseFloat(creditLimitRaw.replace(/[^0-9.]/g, '')) || 0 : 0;
    const assignedSalesUser = getVal('Assigned Salesperson', 'Salesperson', 'Sales Rep') || '';
    const customerSource = getVal('Customer Source', 'Source') || '';
    const notes = getVal('Notes / Remarks', 'Notes', 'Remarks');

    const displayName = companyName || contactPerson;
    const errors: string[] = [];
    if (!displayName) {
      errors.push('Company Name or Contact Person is required');
    }

    let isDuplicate = false;
    let duplicateReason = '';
    if (mobile && existingMobiles.has(mobile)) {
      isDuplicate = true;
      duplicateReason = `Mobile (${mobile}) already exists`;
    } else if (gstNumber && existingGsts.has(gstNumber)) {
      isDuplicate = true;
      duplicateReason = `GSTIN (${gstNumber}) already exists`;
    } else if (companyName && existingNames.has(companyName.toLowerCase())) {
      isDuplicate = true;
      duplicateReason = `Company Name "${companyName}" already exists`;
    }

    parsedRows.push({
      rowNumber: idx + 1,
      companyName: companyName || contactPerson,
      name: contactPerson || companyName,
      customerType: category || 'Distributor',
      contactPerson: contactPerson || '',
      mobile: mobile || mobileRaw || '',
      alternateMobile: alternateMobile || '',
      email: email || '',
      gstNumber: gstNumber || '',
      panNumber: panNumber || '',
      gstType: gstNumber ? 'Regular' : 'Unregistered',
      address: address || '',
      shippingAddress: shippingAddress || address || '',
      city: city || '',
      state: state || '',
      pincode: pincode || '',
      country: country || (city || state ? 'India' : ''),
      category: category || 'Distributor',
      paymentTerms: paymentTerms || '',
      creditLimit: creditLimit || 0,
      assignedSalesUser: assignedSalesUser || '',
      customerSource: customerSource || '',
      notes: notes || '',
      status: 'ACTIVE',
      isValid: errors.length === 0,
      validationError: errors.join(', '),
      isDuplicate,
      duplicateReason,
    });
  });

  const validCount = parsedRows.filter((r) => r.isValid && !r.isDuplicate).length;
  const duplicateCount = parsedRows.filter((r) => r.isValid && r.isDuplicate).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return {
    totalRows: parsedRows.length,
    validCount,
    duplicateCount,
    invalidCount,
    newCount: validCount,
    rows: parsedRows,
  };
}
