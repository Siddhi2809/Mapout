import { jsPDF } from 'jspdf';
import { Quotation, SalesInvoice } from '@/types/erp';

// Clean text helper to avoid encoding issues with special characters in PDF standard fonts
function cleanText(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[₹]/g, 'Rs. ')
    .replace(/[^\x00-\x7F]/g, ' ')
    .trim();
}

function formatCurrency(num: number | undefined | null): string {
  const val = Number(num || 0);
  return 'Rs. ' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function generateQuotationPdf(quotation: Quotation, customer?: any): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner / Brand
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SUNYASH MULTI TRADING PVT LTD', margin, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Manufacturer & Trader | Telematics, Electronics & Wire Harness Solutions', margin, 18);
  doc.text('GSTIN: 27AATCS9988C1Z4 | CIN: U51909MH2021PTC355555 | Phone: +91 9503009988', margin, 23);

  // Document Title Pill
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, 32, pageWidth - margin * 2, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, 32, pageWidth - margin * 2, 12, 'D');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('OFFICIAL QUOTATION / PRICE ESTIMATE', margin + 4, 40);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`Ref: ${cleanText(quotation.quotationNumber)}`, pageWidth - margin - 4, 39.5, { align: 'right' });

  // Two Column Metadata Box (Client Info vs Quotation Details)
  let y = 48;
  const colW = (pageWidth - margin * 2 - 6) / 2;

  // Left Box: Billed / Quoted To
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, colW, 36, 2, 2, 'D');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, colW, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('CLIENT / RECIPIENT INFORMATION', margin + 3, y + 4.8);

  const clientName = cleanText(customer?.companyName || quotation.customerName || 'Valued Client');
  const contactPerson = cleanText(customer?.contactPerson || quotation.contactPerson || '');
  const clientPhone = cleanText(customer?.mobile || customer?.phone || quotation.customerPhone || '');
  const clientEmail = cleanText(customer?.email || '');
  const clientGst = cleanText(customer?.gstin || quotation.customerGst || '');
  const clientAddr = cleanText(customer?.address || quotation.billingAddress || customer?.city || '');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(clientName.substring(0, 42), margin + 3, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  let lineY = y + 17;
  if (contactPerson) {
    doc.text(`Contact: ${contactPerson}`, margin + 3, lineY);
    lineY += 4;
  }
  if (clientPhone || clientEmail) {
    doc.text(`Ph: ${clientPhone || 'N/A'} | Email: ${clientEmail || 'N/A'}`, margin + 3, lineY);
    lineY += 4;
  }
  if (clientGst) {
    doc.text(`GSTIN: ${clientGst}`, margin + 3, lineY);
    lineY += 4;
  }
  if (clientAddr) {
    doc.text(`Address: ${clientAddr.substring(0, 46)}`, margin + 3, lineY);
  }

  // Right Box: Quotation Meta
  const rightX = margin + colW + 6;
  doc.roundedRect(rightX, y, colW, 36, 2, 2, 'D');
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightX, y, colW, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('QUOTATION PARTICULARS', rightX + 3, y + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const metaItems = [
    ['Quotation Date:', cleanText(quotation.quotationDate)],
    ['Valid Until:', cleanText(quotation.validUntil || '7 Days')],
    ['Payment Mode:', cleanText(quotation.paymentMode || '100% Advance')],
    ['Warranty Period:', cleanText(quotation.warrantyPeriod || '1 Year')],
    ['Sales Representative:', cleanText(quotation.salesperson || 'Sales Team')],
    ['Current Status:', cleanText(quotation.status || 'Active')],
  ];

  let metaY = y + 12;
  metaItems.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, rightX + 3, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(val, rightX + colW - 3, metaY, { align: 'right' });
    metaY += 4.5;
  });

  // Table of Items
  y = 88;
  const tableW = pageWidth - margin * 2;
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, tableW, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  const cIdx = margin + 3;
  const cDesc = margin + 12;
  const cQty = margin + 85;
  const cRate = margin + 105;
  const cDisc = margin + 130;
  const cGst = margin + 145;
  const cAmt = pageWidth - margin - 3;

  doc.text('#', cIdx, y + 4.8);
  doc.text('Item Description / SKU', cDesc, y + 4.8);
  doc.text('Qty', cQty, y + 4.8, { align: 'right' });
  doc.text('Rate', cRate, y + 4.8, { align: 'right' });
  doc.text('Disc %', cDisc, y + 4.8, { align: 'right' });
  doc.text('GST %', cGst, y + 4.8, { align: 'right' });
  doc.text('Total (Rs.)', cAmt, y + 4.8, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  const items = quotation.items || [];
  items.forEach((it, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, tableW, 6.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 6.5, pageWidth - margin, y + 6.5);

    const name = cleanText(it.productName || it.sku || `Item ${idx + 1}`);
    const sku = cleanText(it.sku ? `[${it.sku}]` : '');
    const fullDesc = sku ? `${name} ${sku}` : name;

    const rate = Number(it.rate || (it as any).unitPrice || 0);
    const qty = Number(it.quantity || 0);
    const disc = Number(it.discount || 0);
    const gst = Number(it.gstPercent || 18);
    const amt = Number(it.totalAmount || 0);

    doc.text(String(idx + 1), cIdx, y + 4.5);
    doc.text(fullDesc.substring(0, 48), cDesc, y + 4.5);
    doc.text(`${qty} ${cleanText(it.unit || 'PCS')}`, cQty, y + 4.5, { align: 'right' });
    doc.text(rate.toFixed(2), cRate, y + 4.5, { align: 'right' });
    doc.text(disc > 0 ? `${disc}%` : '-', cDisc, y + 4.5, { align: 'right' });
    doc.text(`${gst}%`, cGst, y + 4.5, { align: 'right' });
    doc.text(amt.toFixed(2), cAmt, y + 4.5, { align: 'right' });

    y += 6.5;
  });

  // Summary and Totals Box
  y += 4;
  const sumColW = 85;
  const sumColX = pageWidth - margin - sumColW;

  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(sumColX, y, sumColW, 44, 1.5, 1.5, 'D');

  const subtotal = Number(quotation.subtotal || 0);
  const freight = Number(quotation.freightCharges || 0);
  const discount = Number(quotation.discountAmount || 0);
  const tax = Number(quotation.taxAmount || 0);
  const total = Number(quotation.totalAmount || 0);

  const sumRows = [
    ['Sub Total (Items Base):', formatCurrency(subtotal)],
    ['Freight / Shipping Charges:', formatCurrency(freight)],
    ['Discount Applied:', discount > 0 ? `- ${formatCurrency(discount)}` : 'Rs. 0.00'],
    ['GST Tax (18%):', formatCurrency(tax)],
  ];

  let sumY = y + 5;
  doc.setFontSize(8);
  sumRows.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(lbl, sumColX + 3, sumY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(val, sumColX + sumColW - 3, sumY, { align: 'right' });
    sumY += 5.5;
  });

  // Grand Total highlight bar
  doc.setFillColor(15, 23, 42);
  doc.rect(sumColX, sumY, sumColW, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('GRAND TOTAL:', sumColX + 3, sumY + 6.5);
  doc.text(formatCurrency(total), sumColX + sumColW - 3, sumY + 6.5, { align: 'right' });

  // Left Bank & Payment Details
  doc.setDrawColor(203, 213, 225);
  const bankW = sumColX - margin - 5;
  doc.roundedRect(margin, y, bankW, 44, 1.5, 1.5, 'D');

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, bankW, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('OFFICIAL BANK ACCOUNT DETAILS', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Beneficiary Name: SUNYASH MULTI TRADING PVT LTD', margin + 3, y + 11);
  doc.text('Bank Name: ICICI Bank Limited', margin + 3, y + 16);
  doc.text('Current Account No: 003905001234', margin + 3, y + 21);
  doc.text('IFSC Code: ICIC0000039 (Branch: Pune Main)', margin + 3, y + 26);
  doc.text('UPI ID: sunyash@icici', margin + 3, y + 31);
  doc.text('Payment Terms: 100% Advance prior to dispatch', margin + 3, y + 36);

  // Terms and Conditions Box
  y += 48;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('TERMS & CONDITIONS:', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const termsText = cleanText(
    quotation.termsAndConditions ||
      '1. Price Valid with MOQ and all parts as 1 Purchase Order.\n2. Payment: 100% Advance via Bank NEFT/RTGS/UPI.\n3. Taxes & Shipping: Included or Extra as per itemized line items.\n4. Quotation Validity: 7 Days or until stock lasts.\n5. Stock Subject to Prior Sale.'
  );
  doc.text(termsText, margin + 3, y + 9.5);

  // Signatory & Stamp Section
  y += 32;
  const signColW = 60;
  const signX = pageWidth - margin - signColW;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('For SUNYASH MULTI TRADING PVT LTD', signX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Authorized Signatory', signX, y + 16);
  doc.text(cleanText(quotation.signatory || 'Ms. Mayuri Shinde'), signX, y + 20);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer generated quotation issued by Sunyash Multi Trading Pvt Ltd ERP.', margin, pageHeight - 8);

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

export function generateInvoicePdf(invoice: SalesInvoice, customer?: any): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner / Brand
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SUNYASH MULTI TRADING PVT LTD', margin, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('TAX INVOICE | GPS Devices, Automotive Wiring Harness & Electronic Assemblies', margin, 18);
  doc.text('GSTIN: 27AATCS9988C1Z4 | CIN: U51909MH2021PTC355555 | Phone: +91 9503009988', margin, 23);

  // Document Title Pill
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, 32, pageWidth - margin * 2, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, 32, pageWidth - margin * 2, 12, 'D');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TAX INVOICE (ORIGINAL FOR RECIPIENT)', margin + 4, 40);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice No: ${cleanText(invoice.invoiceNumber)}`, pageWidth - margin - 4, 39.5, { align: 'right' });

  // Two Column Metadata Box
  let y = 48;
  const colW = (pageWidth - margin * 2 - 6) / 2;

  // Left Box: Billed To
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, colW, 36, 2, 2, 'D');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, colW, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('BILLED TO (BUYER DETAILS)', margin + 3, y + 4.8);

  const clientName = cleanText(customer?.companyName || invoice.customerName || 'Valued Customer');
  const contactPerson = cleanText(customer?.contactPerson || (invoice as any).contactPerson || '');
  const clientPhone = cleanText(customer?.mobile || customer?.phone || (invoice as any).customerPhone || '');
  const clientEmail = cleanText(customer?.email || (invoice as any).customerEmail || '');
  const clientGst = cleanText(customer?.gstin || (invoice as any).customerGst || '');
  const clientAddr = cleanText(customer?.address || (invoice as any).billingAddress || customer?.city || '');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(clientName.substring(0, 42), margin + 3, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  let lineY = y + 17;
  if (contactPerson) {
    doc.text(`Contact: ${contactPerson}`, margin + 3, lineY);
    lineY += 4;
  }
  if (clientPhone || clientEmail) {
    doc.text(`Ph: ${clientPhone || 'N/A'} | Email: ${clientEmail || 'N/A'}`, margin + 3, lineY);
    lineY += 4;
  }
  if (clientGst) {
    doc.text(`GSTIN: ${clientGst}`, margin + 3, lineY);
    lineY += 4;
  }
  if (clientAddr) {
    doc.text(`Address: ${clientAddr.substring(0, 46)}`, margin + 3, lineY);
  }

  // Right Box: Invoice Particulars
  const rightX = margin + colW + 6;
  doc.roundedRect(rightX, y, colW, 36, 2, 2, 'D');
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightX, y, colW, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('INVOICE PARTICULARS', rightX + 3, y + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const invMeta = [
    ['Invoice Date:', cleanText(invoice.invoiceDate)],
    ['Due Date:', cleanText(invoice.dueDate || invoice.invoiceDate)],
    ['Sales Order Ref:', cleanText(invoice.salesOrderNumber || 'Direct')],
    ['Quotation Ref:', cleanText(invoice.quotationNumber || 'Direct')],
    ['Payment Status:', cleanText(invoice.paymentStatus || 'Pending')],
    ['State of Supply:', 'Maharashtra (Code 27)'],
  ];

  let metaY = y + 12;
  invMeta.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(lbl, rightX + 3, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(val, rightX + colW - 3, metaY, { align: 'right' });
    metaY += 4.5;
  });

  // Table of Items
  y = 88;
  const tableW = pageWidth - margin * 2;
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, tableW, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  const cIdx = margin + 3;
  const cDesc = margin + 12;
  const cQty = margin + 85;
  const cRate = margin + 105;
  const cDisc = margin + 130;
  const cGst = margin + 145;
  const cAmt = pageWidth - margin - 3;

  doc.text('#', cIdx, y + 4.8);
  doc.text('Item Description / SKU', cDesc, y + 4.8);
  doc.text('Qty', cQty, y + 4.8, { align: 'right' });
  doc.text('Rate', cRate, y + 4.8, { align: 'right' });
  doc.text('Disc %', cDisc, y + 4.8, { align: 'right' });
  doc.text('GST %', cGst, y + 4.8, { align: 'right' });
  doc.text('Amount (Rs.)', cAmt, y + 4.8, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  const items = invoice.items || [];
  items.forEach((it, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, tableW, 6.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 6.5, pageWidth - margin, y + 6.5);

    const name = cleanText(it.productName || (it as any).name || `Product ${idx + 1}`);
    const sku = cleanText((it as any).sku ? `[${(it as any).sku}]` : '');
    const fullDesc = sku ? `${name} ${sku}` : name;

    const rate = Number(it.rate || (it as any).unitPrice || 0);
    const qty = Number(it.quantity || 0);
    const disc = Number((it as any).discount || 0);
    const gst = Number((it as any).gstPercent || 18);
    const amt = Number(it.totalAmount || (it as any).amount || 0);

    doc.text(String(idx + 1), cIdx, y + 4.5);
    doc.text(fullDesc.substring(0, 48), cDesc, y + 4.5);
    doc.text(`${qty} ${cleanText((it as any).unit || 'PCS')}`, cQty, y + 4.5, { align: 'right' });
    doc.text(rate.toFixed(2), cRate, y + 4.5, { align: 'right' });
    doc.text(disc > 0 ? `${disc}%` : '-', cDisc, y + 4.5, { align: 'right' });
    doc.text(`${gst}%`, cGst, y + 4.5, { align: 'right' });
    doc.text(amt.toFixed(2), cAmt, y + 4.5, { align: 'right' });

    y += 6.5;
  });

  // Summary and Totals Box
  y += 4;
  const sumColW = 85;
  const sumColX = pageWidth - margin - sumColW;

  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(sumColX, y, sumColW, 44, 1.5, 1.5, 'D');

  const subtotal = Number(invoice.subtotal || 0);
  const tax = Number(invoice.gstAmount || (invoice as any).taxAmount || 0);
  const grandTotal = Number(invoice.grandTotal || (invoice as any).totalAmount || 0);
  const paid = Number(invoice.paidAmount || 0);
  const balance = Math.max(0, grandTotal - paid);

  const sumRows = [
    ['Taxable Sub Total:', formatCurrency(subtotal)],
    ['CGST (9%) + SGST (9%):', formatCurrency(tax)],
    ['Total Invoice Value:', formatCurrency(grandTotal)],
    ['Amount Received / Paid:', formatCurrency(paid)],
  ];

  let sumY = y + 5;
  doc.setFontSize(8);
  sumRows.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(lbl, sumColX + 3, sumY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(val, sumColX + sumColW - 3, sumY, { align: 'right' });
    sumY += 5.5;
  });

  // Balance Due Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(sumColX, sumY, sumColW, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('BALANCE DUE:', sumColX + 3, sumY + 6.5);
  doc.text(formatCurrency(balance), sumColX + sumColW - 3, sumY + 6.5, { align: 'right' });

  // Bank Info
  doc.setDrawColor(203, 213, 225);
  const bankW = sumColX - margin - 5;
  doc.roundedRect(margin, y, bankW, 44, 1.5, 1.5, 'D');

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, bankW, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('OFFICIAL BANK ACCOUNT DETAILS FOR REMITTANCE', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Beneficiary Name: SUNYASH MULTI TRADING PVT LTD', margin + 3, y + 11);
  doc.text('Bank Name: ICICI Bank Limited', margin + 3, y + 16);
  doc.text('Current Account No: 003905001234', margin + 3, y + 21);
  doc.text('IFSC Code: ICIC0000039 (Branch: Pune Main)', margin + 3, y + 26);
  doc.text('UPI ID: sunyash@icici', margin + 3, y + 31);
  doc.text('Please quote invoice number during RTGS/NEFT payment remittance.', margin + 3, y + 36);

  // Terms and Declaration
  y += 48;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('DECLARATION & TERMS OF SALE:', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    '1. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.\n2. Goods once sold will not be taken back without prior written authorization.\n3. Warranty covers manufacturing defects as per standard warranty terms (1 Year for Telematics devices).\n4. Subject to Pune jurisdiction only.',
    margin + 3,
    y + 9.5
  );

  // Signatory & Stamp Section
  y += 32;
  const signColW = 60;
  const signX = pageWidth - margin - signColW;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('For SUNYASH MULTI TRADING PVT LTD', signX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Authorized Signatory', signX, y + 16);
  doc.text('Ms. Mayuri Shinde', signX, y + 20);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer generated invoice issued under Section 31 of CGST Act, 2017.', margin, pageHeight - 8);

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
