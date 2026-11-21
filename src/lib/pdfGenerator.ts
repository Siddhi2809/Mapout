import { jsPDF } from 'jspdf';
import { Quotation, SalesInvoice } from '@/types/erp';
import fs from 'fs';
import path from 'path';

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

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;

  // PAGE 1:
  // 1. Logo (Devyani Heights, B-5, Kaspate Wasti Rd, Pune...)
  const logoPath = path.join(process.cwd(), 'public', 'sunyash-logo.png');
  if (fs.existsSync(logoPath)) {
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      doc.addImage(logoBuffer, 'PNG', margin, 12, 20, 20);
    } catch {}
  }

  // Company Details (left column next to logo)
  const headerLeftX = margin + 23;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Sunyash Multi Trading Pvt Ltd', headerLeftX, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('Devyani Heights, B-5, Kaspate Wasti Rd', headerLeftX, 19.5);
  doc.text('Pune', headerLeftX, 23.5);
  doc.text('Maharashtra', headerLeftX, 27.5);
  doc.text('India 411057', headerLeftX, 31.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('GSTIN: 27AAXCS4923Q1Z8', headerLeftX, 35.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text('Phone: 9503009988 Email: sales@mapout24.com', headerLeftX, 39.5);

  // Quote Header (Right)
  doc.setFont('times', 'normal');
  doc.setFontSize(26);
  doc.setTextColor(0, 0, 0);
  doc.text('Quote', pageWidth - margin, 24, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(`Valid Until: ${cleanText(quotation.validUntil || '21/10/2026')}`, pageWidth - margin, 29.5, { align: 'right' });
  doc.text(`Quote Number : ${cleanText(quotation.quotationNumber)}`, pageWidth - margin, 34, { align: 'right' });

  // BILL TO & SHIP TO (Two Columns)
  let y = 47;
  const colW = (pageWidth - margin * 2 - 8) / 2;
  const rightColX = margin + colW + 8;

  const clientName = cleanText(quotation.customerName || customer?.companyName || customer?.name || 'BTM SHOPPEE');
  const contactName = cleanText(quotation.contactPerson || customer?.contactPerson || 'Naveen Kumar Kanakaraj');
  const billAddr = cleanText(quotation.billingAddress || customer?.address || 'No 94,100 Feet Ring Road, BTM 1 st Stage Next to Citi Bank ATM');
  const shipAddr = cleanText(quotation.shippingAddress || customer?.shippingAddress || billAddr);
  const city = cleanText(customer?.city || 'Banglore');
  const state = cleanText(customer?.state || 'Karnataka');
  const pincode = cleanText(customer?.pincode || '560029');
  const gstNo = cleanText(quotation.customerGst || customer?.gstin || customer?.gstNumber || '29ACYPA5997Q1Z6');
  const phoneNo = cleanText(quotation.customerPhone || customer?.mobile || customer?.phone || '8152876531');

  // Left: BILL TO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('BILL TO:', margin, y);
  y += 4.5;
  doc.setFontSize(8.5);
  doc.text(clientName, margin, y);
  y += 4.2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const billAddrLines = doc.splitTextToSize(billAddr, colW - 2);
  doc.text(billAddrLines, margin, y);
  let billY = y + billAddrLines.length * 3.8;
  doc.text(city, margin, billY); billY += 3.8;
  doc.text(`${state} - ${pincode}`, margin, billY); billY += 3.8;
  doc.text('India', margin, billY); billY += 3.8;
  doc.setFont('helvetica', 'bold');
  doc.text(`GST No - ${gstNo}`, margin, billY);

  // Right: SHIP TO
  let shipY = 47;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SHIP TO:', rightColX, shipY);
  shipY += 4.5;
  doc.setFontSize(8.5);
  doc.text(clientName, rightColX, shipY);
  shipY += 4.2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const shipAddrLines = doc.splitTextToSize(shipAddr, colW - 2);
  doc.text(shipAddrLines, rightColX, shipY);
  shipY += shipAddrLines.length * 3.8;
  doc.text(city, rightColX, shipY); shipY += 3.8;
  doc.text(`${state} - ${pincode}`, rightColX, shipY); shipY += 3.8;
  doc.text('India', rightColX, shipY); shipY += 3.8;
  doc.setFont('helvetica', 'bold');
  doc.text(`Mo No - ${phoneNo}`, rightColX, shipY);

  y = Math.max(billY, shipY) + 7;

  // Account Name & Quote Stage Box (Grey bar)
  doc.setFillColor(242, 243, 245);
  doc.rect(margin, y, pageWidth - margin * 2, 7.5, 'F');
  doc.setDrawColor(215, 218, 222);
  doc.line(margin, y, pageWidth - margin, y);
  doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text('Account Name:', margin + 3, y + 3.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(clientName, margin + 23, y + 3.2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Contact Name:', margin + 3, y + 6.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(contactName, margin + 23, y + 6.2);

  // Quote Stage (Right)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Quote Stage:', pageWidth - margin - 35, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(cleanText(quotation.status || 'Draft'), pageWidth - margin - 18, y + 4.5);

  y += 10.5;

  // Products Table
  const tableW = pageWidth - margin * 2;
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageWidth - margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);

  const colSNo = margin + 2;
  const colDetails = margin + 11;
  const colQty = margin + 128;
  const colPrice = margin + 148;
  const colTot = pageWidth - margin - 2;

  doc.text('S.No.', colSNo, y + 4);
  doc.text('Product Details', colDetails, y + 4);
  doc.text('Quantity', colQty, y + 4);
  doc.text('List Price', colPrice, y + 4, { align: 'right' });
  doc.text('Total', colTot, y + 4, { align: 'right' });

  y += 5.5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);

  const items = quotation.items || [];
  let sNo = 1;
  let itemsTotal = 0;

  items.forEach((it) => {
    const rate = Number(it.rate || (it as any).unitPrice || 0);
    const qty = Number(it.quantity || 0);
    const lineTotal = rate * qty;
    itemsTotal += lineTotal;

    const prodName = cleanText(it.productName || it.sku || `Product ${sNo}`);
    const detailsLines = doc.splitTextToSize(prodName, 114);

    doc.text(String(sNo), colSNo, y);
    doc.text(detailsLines, colDetails, y);
    doc.text(String(qty), colQty, y);
    doc.text(formatCurrency(rate), colPrice, y, { align: 'right' });
    doc.text(formatCurrency(lineTotal), colTot, y, { align: 'right' });

    y += Math.max(detailsLines.length * 3.8, 5.5);
    sNo++;
  });

  // Shipping Charges line if applicable
  const freight = Number(quotation.freightCharges || 0);
  if (freight > 0) {
    doc.text(String(sNo), colSNo, y);
    doc.text('Shipping Charges', colDetails, y);
    doc.text('1', colQty, y);
    doc.text(formatCurrency(freight), colPrice, y, { align: 'right' });
    doc.text(formatCurrency(freight), colTot, y, { align: 'right' });
    y += 5.5;
    sNo++;
  }

  // Dotted separator line below items
  doc.setLineDashPattern([0.8, 1.2], 0);
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0); // reset dash
  y += 3.5;

  // Sub Total, Discount, Tax, Adjustment, Grand Total (Right aligned)
  const subTotal = itemsTotal + freight;
  const discountVal = Number(quotation.discount || quotation.discountAmount || 0);
  const taxVal = Number(quotation.taxAmount || ((subTotal - discountVal) * 0.18));
  const adjVal = Number(quotation.adjustment || 0);
  const grandTotalVal = Number(quotation.totalAmount || (subTotal - discountVal + taxVal + adjVal));

  const sumBlockX = pageWidth - margin - 65;
  const sumValX = pageWidth - margin - 2;

  const renderSumRow = (label: string, value: string, isBold: boolean = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(label, sumBlockX, y, { align: 'right' });
    doc.text(value, sumValX, y, { align: 'right' });
    y += 3.8;
  };

  renderSumRow('Sub Total', formatCurrency(subTotal), true);
  renderSumRow('Discount', formatCurrency(discountVal));
  renderSumRow('Tax', formatCurrency(taxVal));
  renderSumRow('Adjustment', formatCurrency(adjVal));

  doc.setDrawColor(180, 180, 180);
  doc.line(sumBlockX - 18, y, pageWidth - margin, y);
  y += 3.5;
  renderSumRow('Grand Total', formatCurrency(grandTotalVal), true);

  // Line separator before Terms and Conditions
  y = Math.max(y + 2, 160);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5.5;

  // Terms and Conditions Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Terms and Conditions', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);

  const deliveryTerms = cleanText(quotation.deliveryTerms || '10-15 Working Days After Receiving Purchase Order & Full Payment.');
  doc.setFont('helvetica', 'bold');
  doc.text('Delivery:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(` ${deliveryTerms}`, margin + 12, y);
  y += 4;

  const warrantyTerms = cleanText(quotation.warrantyTerms || '6 Month Free Replacement Warranty only applicable for Data Cables and 1 Year Warranty Applicable for GPS Telematics Devices.');
  doc.setFont('helvetica', 'bold');
  doc.text('Product Warranty :', margin, y);
  doc.setFont('helvetica', 'normal');
  const wLines = doc.splitTextToSize(` ${warrantyTerms}`, pageWidth - margin * 2 - 27);
  doc.text(wLines, margin + 26, y);
  y += wLines.length * 3.8 + 2;

  // Scan To Pay UPI (QR code image)
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Scan To Pay UPI', margin, y);
  y += 3.5;

  const upiQrPath = path.join(process.cwd(), 'public', 'sunyash-upi-qr.png');
  if (fs.existsSync(upiQrPath)) {
    try {
      const upiBuffer = fs.readFileSync(upiQrPath);
      doc.addImage(upiBuffer, 'PNG', margin, y, 28, 28);
    } catch {}
  }
  y += 30;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('UPI ID: mnshinde2011-6@okhdfcbank', margin, y);
  y += 5;

  // Bank Details (Bottom of Page 1)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Bank Details :', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Bank Name: HDFC Bank Ltd', margin, y); y += 3.8;
  doc.text('Account Name : Sunyash Multi Trading Pvt Ltd', margin, y); y += 3.8;
  doc.text('Account Number : 50200023896104', margin, y); y += 3.8;
  doc.text('IFSC Code : HDFC0004887', margin, y);

  // ==========================================
  // PAGE 2:
  // ==========================================
  doc.addPage();
  let p2Y = 16;

  // Bank Address
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Bank Address:- WAKAD PUNE MAHARASHTRA', margin, p2Y);
  p2Y += 5;

  // 7-Row Boxed Terms Table (Exact matching screenshot page 2)
  const boxW = pageWidth - margin * 2;
  const rowH = 6;
  const rows = [
    'Price Valid with MOQ and all parts as 1 PO',
    'Payment             : 100 % Advance',
    'Tax, Shipping   : Extra if applicable',
    'Quote Validity   : 7 Days or till quoted stock available',
    'Ex Works          : Sunyash Multi Trading',
    'Terms                 : Sunyash Multi Trading Pvt Ltd - India',
    'Stock Subjected to Prior Sale, we may not be able to support if quoted stock lost',
  ];

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(margin, p2Y, boxW, rows.length * rowH, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);

  rows.forEach((r, idx) => {
    const curY = p2Y + idx * rowH;
    if (idx > 0) {
      doc.line(margin, curY, margin + boxW, curY);
    }
    doc.text(r, margin + 2.5, curY + 4.2);
  });

  p2Y += rows.length * rowH + 12;

  // Authorized Signatory
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('Authorized Signatory:', margin, p2Y);
  p2Y += 7;

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(cleanText(quotation.signatory || 'Ms. Mayuri Shinde'), margin, p2Y);

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
    const amt = Number((it as any).totalAmount || (it as any).amount || (it as any).total || 0);

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
