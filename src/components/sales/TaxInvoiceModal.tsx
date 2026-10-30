'use client';

import React from 'react';
import { SalesInvoice, SalesOrder } from '@/types/erp';
import { useERP } from '@/context/ERPContext';
import { numberToIndianWords } from '@/lib/numberToWords';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  PackageCheck,
  Boxes,
  Camera,
  ShieldCheck,
  Receipt,
  Factory,
  Eye,
} from 'lucide-react';

export const INDIAN_STATE_CODES: Record<string, string> = {
  'JAMMU AND KASHMIR': '01',
  'HIMACHAL PRADESH': '02',
  'PUNJAB': '03',
  'CHANDIGARH': '04',
  'UTTARAKHAND': '05',
  'HARYANA': '06',
  'DELHI': '07',
  'RAJASTHAN': '08',
  'UTTAR PRADESH': '09',
  'BIHAR': '10',
  'SIKKIM': '11',
  'ARUNACHAL PRADESH': '12',
  'NAGALAND': '13',
  'MANIPUR': '14',
  'MIZORAM': '15',
  'TRIPURA': '16',
  'MEGHALAYA': '17',
  'ASSAM': '18',
  'WEST BENGAL': '19',
  'JHARKHAND': '20',
  'ODISHA': '21',
  'CHHATTISGARH': '22',
  'MADHYA PRADESH': '23',
  'GUJARAT': '24',
  'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': '26',
  'MAHARASHTRA': '27',
  'ANDHRA PRADESH': '37',
  'KARNATAKA': '29',
  'GOA': '30',
  'LAKSHADWEEP': '31',
  'KERALA': '32',
  'TAMIL NADU': '33',
  'PUDUCHERRY': '34',
  'ANDAMAN AND NICOBAR ISLANDS': '35',
  'TELANGANA': '36',
  'LADAKH': '38',
};

export function formatInvoiceDate(d?: string | Date): string {
  if (!d) return '12-May-26';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

interface TaxInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SalesInvoice | null;
  linkedOrder?: SalesOrder | null;
  roleBadge?: string;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  linkedOrder: propsLinkedOrder,
  roleBadge = 'Production Copy',
}) => {
  const { customers, quotations, salesOrders } = useERP();

  if (!isOpen || !invoice) return null;

  // Resolve linked order
  const linkedOrder =
    propsLinkedOrder ||
    salesOrders.find(
      (so) =>
        so.invoiceId === invoice.id ||
        (invoice.salesOrderId && so.id === invoice.salesOrderId) ||
        (invoice.salesOrderNumber && so.orderNumber === invoice.salesOrderNumber) ||
        (invoice.quotationId && so.quotationId === invoice.quotationId)
    );

  const linkedCust = customers.find(
    (c) =>
      c.id === invoice.customerId ||
      c.name === invoice.customerName ||
      c.companyName === invoice.customerName
  );

  const linkedQuote = quotations.find(
    (q) =>
      q.id === invoice.quotationId ||
      q.quotationNumber === invoice.quotationNumber
  );

  const isPaymentCompleted =
    invoice.paymentStatus === 'Payment Completed' ||
    invoice.paymentStatus === 'Paid' ||
    invoice.paymentStatus === 'PAID' ||
    invoice.invoiceStatus === 'Payment Completed';

  const hasProofOrPaid =
    isPaymentCompleted ||
    invoice.paymentStatus === 'Payment Proof Uploaded' ||
    invoice.paymentStatus === 'Payment Verified' ||
    (Array.isArray(invoice.paymentProofFiles) && invoice.paymentProofFiles.length > 0);

  const prodStatus =
    invoice.productionStatus ||
    linkedOrder?.productionStatus ||
    (linkedOrder?.orderStatus === 'Sent to Production' ? 'Sent to Production' : 'Sent to Production');

  // Consignee and Buyer Details
  const companyTitle = 'SUNYASH MULTI TRADING PVT LTD 26-27';
  const consigneeName =
    linkedCust?.companyName ||
    linkedCust?.name ||
    invoice.customerName ||
    'Pathankot Vehicleades pvt. Ltd- Gurdaspur';
  const consigneeAddress =
    linkedCust?.shippingAddress ||
    linkedCust?.address ||
    invoice.billingAddress ||
    'Batala Road , Jeevanwal babri gurdaspur,';
  const consigneeCity = linkedCust?.city || 'Gurdaspur';
  const consigneePincode = linkedCust?.pincode || '143521';
  const consigneeState = linkedCust?.state || 'Punjab';
  const consigneeGstin =
    invoice.gstNumber ||
    linkedCust?.gstin ||
    linkedCust?.gstNumber ||
    '03AAACP9610Q1Z6';

  let consigneeStateCode = '03';
  if (consigneeGstin && consigneeGstin.length >= 2 && !isNaN(Number(consigneeGstin.slice(0, 2)))) {
    consigneeStateCode = consigneeGstin.slice(0, 2);
  } else if (consigneeState) {
    consigneeStateCode = INDIAN_STATE_CODES[consigneeState.toUpperCase().trim()] || '03';
  }

  const buyerName = consigneeName;
  const buyerAddress = consigneeAddress;
  const buyerCity = consigneeCity;
  const buyerPincode = consigneePincode;
  const buyerState = consigneeState;
  const buyerGstin = consigneeGstin;
  const buyerStateCode = consigneeStateCode;
  const placeOfSupply = buyerState;

  // SUNYASH is in Maharashtra (Code 27). If buyer is outside Maharashtra => IGST 18%
  const isInterstate = consigneeStateCode !== '27';

  // Items breakdown
  const rawItems =
    invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0
      ? invoice.items
      : linkedOrder?.items && linkedOrder.items.length > 0
      ? linkedOrder.items.map((i) => ({
          productName: i.productName,
          sku: i.sku || 'SKU-01',
          quantity: i.quantity,
          rate: i.sellingPrice || i.unitPrice || 0,
          subtotal: i.totalPrice,
          hsn: '85369090',
        }))
      : [
          {
            productName: 'BOSCH OBD-II Male to DB 26 Female Cable(Universal Cable)',
            sku: 'BOSCH-CBL-01',
            quantity: 1,
            rate: invoice.grandTotal || 2459.18,
            subtotal: invoice.subtotal || invoice.grandTotal || 2459.18,
            hsn: '85369090',
          },
        ];

  const invoiceItems = rawItems.map((item) => {
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.rate) || 0;
    const sub = Number(item.subtotal || (item as any).total || qty * rate);
    return {
      ...item,
      quantity: qty,
      rate,
      subtotal: sub,
      hsn: (item as any).hsn || '85369090',
    };
  });

  const totalQty = invoiceItems.reduce((acc, it) => acc + it.quantity, 0);
  const goodsTaxable = invoiceItems.reduce((acc, it) => acc + it.subtotal, 0);

  // Freight charges
  const freightAmount = Number(
    (invoice as any).freightCharges ??
    linkedQuote?.freightCharges ??
    (invoice.subtotal > goodsTaxable ? invoice.subtotal - goodsTaxable : 0)
  );

  const totalTaxable = goodsTaxable + freightAmount;

  // Tax amounts
  const goodsIgst = isInterstate ? Math.round(goodsTaxable * 0.18 * 100) / 100 : 0;
  const goodsCgst = !isInterstate ? Math.round(goodsTaxable * 0.09 * 100) / 100 : 0;
  const goodsSgst = !isInterstate ? Math.round(goodsTaxable * 0.09 * 100) / 100 : 0;
  const goodsTotalTax = isInterstate ? goodsIgst : goodsCgst + goodsSgst;

  const freightIgst = freightAmount > 0 && isInterstate ? Math.round(freightAmount * 0.18 * 100) / 100 : 0;
  const freightCgst = freightAmount > 0 && !isInterstate ? Math.round(freightAmount * 0.09 * 100) / 100 : 0;
  const freightSgst = freightAmount > 0 && !isInterstate ? Math.round(freightAmount * 0.09 * 100) / 100 : 0;
  const freightTotalTax = isInterstate ? freightIgst : freightCgst + freightSgst;

  const totalIgst = goodsIgst + freightIgst;
  const totalCgst = goodsCgst + freightCgst;
  const totalSgst = goodsSgst + freightSgst;
  const totalTax = isInterstate ? totalIgst : totalCgst + totalSgst;

  const rawGrandTotal = totalTaxable + totalTax;
  const grandTotal = Number(invoice.grandTotal) || Math.round(rawGrandTotal);
  const roundingOff = Math.round((grandTotal - rawGrandTotal) * 100) / 100;

  const invoiceNumber = invoice.invoiceNumber || 'SUN/26-27/83';
  const invoiceDateFormatted = formatInvoiceDate(invoice.invoiceDate);
  const paymentTerms =
    (invoice as any).paymentTerms || linkedCust?.paymentTerms || '100 % Advance';
  const quotationNumber = invoice.quotationNumber || '';
  const buyersOrderNo = invoice.salesOrderNumber || linkedOrder?.orderNumber || '';
  const destination = `${consigneeCity} ${consigneeState}`;

  const sNum = invoice.serialNumber || linkedOrder?.serialNumber;
  const bNum = invoice.batchNumber || linkedOrder?.batchNumber;
  const wPeriod = invoice.warrantyPeriod || linkedOrder?.warrantyPeriod || '1 Year';
  const prodNotes = invoice.productionNotes || linkedOrder?.productionNotes || (linkedOrder as any)?.productTeamRemarks;
  const packNotes = invoice.packingNotes || linkedOrder?.packingNotes;

  const remarksStr =
    sNum || bNum
      ? `Sr.No. ${sNum || ''}${bNum ? ` / Batch: ${bNum}` : ''}`
      : invoice.notes || 'Sr.No.375/360/373/381/367/385';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl p-6 sm:p-8 space-y-6 my-8 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Actions Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-4 gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono font-bold tracking-wider uppercase">
              TAX INVOICE PREVIEW
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              {roleBadge}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {hasProofOrPaid ? 'Payment Verified (Paid)' : (invoice.paymentStatus || 'Payment Pending')}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Status: {prodStatus}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close Invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* EXACT TAX INVOICE PAPER DOCUMENT CONTAINER */}
        <div className="space-y-6">
          <div className="bg-white text-black font-sans border-2 border-black max-w-[850px] mx-auto text-[11px] leading-tight shadow-md print:shadow-none print:border-black print:max-w-none">
            {/* TITLE: Tax Invoice */}
            <div className="text-center font-bold text-sm py-1.5 border-b border-black tracking-wide">
              Tax Invoice
            </div>

            {/* TOP SECTION: 50% / 50% split */}
            <div className="grid grid-cols-2 border-b border-black divide-x divide-black">
              {/* LEFT COLUMN: Seller, Consignee, Buyer */}
              <div className="flex flex-col divide-y divide-black">
                {/* Seller Company */}
                <div className="p-2 space-y-0.5">
                  <div className="font-bold text-[12px]">{companyTitle}</div>
                  <div>B-5, 3rd Floor ,Devyani Height,Near Fortune</div>
                  <div>Building Kaspate Wasti Wakad Pune-411057</div>
                  <div>Contact:-9503009988</div>
                  <div>GSTIN/UIN: 27AAXCS4923Q1Z8</div>
                  <div>State Name : Maharashtra, Code : 27</div>
                </div>

                {/* Consignee (Ship to) */}
                <div className="p-2 space-y-0.5">
                  <div className="text-[10px] text-slate-700 font-medium">Consignee (Ship to)</div>
                  <div className="font-bold text-[11px]">{consigneeName}</div>
                  <div>{consigneeAddress}</div>
                  <div>{consigneeCity} - {consigneePincode}</div>
                  <div>{consigneeState}</div>
                  <div className="flex">
                    <span className="w-24">GSTIN/UIN</span>
                    <span>: {consigneeGstin}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24">State Name</span>
                    <span>: {consigneeState}, Code : {consigneeStateCode}</span>
                  </div>
                </div>

                {/* Buyer (Bill to) */}
                <div className="p-2 space-y-0.5">
                  <div className="text-[10px] text-slate-700 font-medium">Buyer (Bill to)</div>
                  <div className="font-bold text-[11px]">{buyerName}</div>
                  <div>{buyerAddress}</div>
                  <div>{buyerCity} - {buyerPincode}</div>
                  <div>{buyerState}</div>
                  <div className="flex">
                    <span className="w-24">GSTIN/UIN</span>
                    <span>: {buyerGstin}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24">State Name</span>
                    <span>: {buyerState}, Code : {buyerStateCode}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24">Place of Supply</span>
                    <span>: {placeOfSupply}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: 7-Row Grid */}
              <div className="flex flex-col divide-y divide-black text-[11px]">
                {/* Row 1 */}
                <div className="grid grid-cols-2 divide-x divide-black min-h-[38px]">
                  <div className="p-1.5">
                    <div className="text-[10px] text-slate-700">Invoice No.</div>
                    <div className="font-bold">{invoiceNumber}</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-[10px] text-slate-700">Dated</div>
                    <div className="font-bold">{invoiceDateFormatted}</div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 divide-x divide-black min-h-[34px]">
                  <div className="p-1.5">
                    <div className="text-[10px] text-slate-700">Delivery Note</div>
                    <div>{(invoice as any).deliveryNote || ''}</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-[10px] text-slate-700">Mode/Terms of Payment</div>
                    <div className="font-bold">{paymentTerms}</div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 divide-x divide-black min-h-[34px]">
                  <div className="p-1.5">
                    <div className="text-[10px] text-slate-700">Reference No. & Date.</div>
                    <div>{(invoice as any).referenceNo || ''}</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-[10px] text-slate-700">Other References</div>
                    <div>{quotationNumber || (invoice as any).otherReferences || ''}</div>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-2 divide-x divide-black min-h-[34px]">
                  <div className="p-1.5">
                    <div className="text-[10px] text-slate-700">Buyer’s Order No.</div>
                    <div className="font-bold">{buyersOrderNo}</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-[10px] text-slate-700">Dated</div>
                    <div>{invoiceDateFormatted}</div>
                  </div>
                </div>

                {/* Row 5 */}
                <div className="grid grid-cols-2 divide-x divide-black min-h-[34px]">
                  <div className="p-1.5">
                    <div className="text-[10px] text-slate-700">Dispatch Doc No.</div>
                    <div>{(invoice as any).dispatchDocNo || linkedOrder?.trackingNumber || ''}</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-[10px] text-slate-700">Delivery Note Date</div>
                    <div>{(invoice as any).deliveryNoteDate || ''}</div>
                  </div>
                </div>

                {/* Row 6 */}
                <div className="grid grid-cols-2 divide-x divide-black min-h-[34px]">
                  <div className="p-1.5">
                    <div className="text-[10px] text-slate-700">Dispatched through</div>
                    <div className="font-bold">Courier</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-[10px] text-slate-700">Destination</div>
                    <div className="font-bold">{destination}</div>
                  </div>
                </div>

                {/* Row 7 */}
                <div className="p-1.5 min-h-[44px]">
                  <div className="text-[10px] text-slate-700">Terms of Delivery</div>
                  <div>{(invoice as any).termsOfDelivery || 'Ex Works : Sunyash Multi Trading'}</div>
                </div>
              </div>
            </div>

            {/* ITEMS TABLE */}
            <div className="border-b border-black">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-black text-center font-bold">
                    <th className="p-1.5 w-10 border-r border-black">Sl<br/>No.</th>
                    <th className="p-1.5 w-24 border-r border-black text-left">Marks & Nos./<br/>Container No.</th>
                    <th className="p-1.5 border-r border-black text-center">Description of<br/>Goods and Services</th>
                    <th className="p-1.5 w-20 border-r border-black">HSN/SAC</th>
                    <th className="p-1.5 w-16 border-r border-black text-right">Quantity</th>
                    <th className="p-1.5 w-20 border-r border-black text-right">Rate</th>
                    <th className="p-1.5 w-12 border-r border-black text-center">per</th>
                    <th className="p-1.5 w-24 text-right pr-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Products */}
                  {invoiceItems.map((item, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="p-1.5 text-center border-r border-black">{idx + 1}</td>
                      <td className="p-1.5 border-r border-black"></td>
                      <td className="p-1.5 border-r border-black font-bold">
                        {item.productName}
                      </td>
                      <td className="p-1.5 text-center border-r border-black font-mono">
                        {item.hsn || '85369090'}
                      </td>
                      <td className="p-1.5 text-right border-r border-black font-bold">
                        {item.quantity} PCS
                      </td>
                      <td className="p-1.5 text-right border-r border-black">
                        {item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-1.5 text-center border-r border-black">
                        PCS
                      </td>
                      <td className="p-1.5 text-right font-bold pr-2">
                        {item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}

                  {/* Freight Charges Row */}
                  {freightAmount > 0 && (
                    <tr className="align-top">
                      <td className="p-1.5 text-center border-r border-black"></td>
                      <td className="p-1.5 border-r border-black"></td>
                      <td className="p-1.5 border-r border-black text-right font-bold italic pr-6">
                        Freight Charges
                      </td>
                      <td className="p-1.5 text-center border-r border-black font-mono">996812</td>
                      <td className="p-1.5 border-r border-black"></td>
                      <td className="p-1.5 border-r border-black"></td>
                      <td className="p-1.5 border-r border-black"></td>
                      <td className="p-1.5 text-right font-bold pr-2">
                        {freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}

                  {/* Taxes Rows */}
                  {isInterstate ? (
                    <tr className="align-top">
                      <td className="p-1.5 text-center border-r border-black"></td>
                      <td className="p-1.5 border-r border-black"></td>
                      <td className="p-1.5 border-r border-black text-right font-bold italic pr-6">
                        OUTPUT IGST@18%
                      </td>
                      <td className="p-1.5 border-r border-black"></td>
                      <td className="p-1.5 border-r border-black"></td>
                      <td className="p-1.5 border-r border-black"></td>
                      <td className="p-1.5 border-r border-black"></td>
                      <td className="p-1.5 text-right font-bold pr-2">
                        {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr className="align-top">
                        <td className="p-1.5 text-center border-r border-black"></td>
                        <td className="p-1.5 border-r border-black"></td>
                        <td className="p-1.5 border-r border-black text-right font-bold italic pr-6">
                          OUTPUT CGST@9%
                        </td>
                        <td className="p-1.5 border-r border-black"></td>
                        <td className="p-1.5 border-r border-black"></td>
                        <td className="p-1.5 border-r border-black"></td>
                        <td className="p-1.5 border-r border-black"></td>
                        <td className="p-1.5 text-right font-bold pr-2">
                          {totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr className="align-top">
                        <td className="p-1.5 text-center border-r border-black"></td>
                        <td className="p-1.5 border-r border-black"></td>
                        <td className="p-1.5 border-r border-black text-right font-bold italic pr-6">
                          OUTPUT SGST@9%
                        </td>
                        <td className="p-1.5 border-r border-black"></td>
                        <td className="p-1.5 border-r border-black"></td>
                        <td className="p-1.5 border-r border-black"></td>
                        <td className="p-1.5 border-r border-black"></td>
                        <td className="p-1.5 text-right font-bold pr-2">
                          {totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* Rounding Off */}
                  <tr className="align-top">
                    <td className="p-1.5 text-center border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black text-right font-bold italic pr-6">
                      Rounding Off
                    </td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 text-right font-bold pr-2">
                      {roundingOff.toFixed(2)}
                    </td>
                  </tr>

                  {/* Table spacer row for authentic presentation */}
                  <tr className="h-10">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>

                  {/* Total Row */}
                  <tr className="border-t border-black font-bold">
                    <td className="p-1.5 text-center border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black text-right pr-6">Total</td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 text-right border-r border-black">{totalQty} PCS</td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 text-right font-bold text-sm pr-2">
                      ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount Chargeable (in words) */}
            <div className="p-2 border-b border-black flex justify-between items-center text-[11px]">
              <div>
                <div className="text-[10px] text-slate-700 font-medium">Amount Chargeable (in words)</div>
                <div className="font-bold text-[12px]">{numberToIndianWords(grandTotal)}</div>
              </div>
              <div className="font-bold text-[11px]">E. & O.E</div>
            </div>

            {/* TAX BREAKDOWN & SCAN TO PAY */}
            <div className="grid grid-cols-12 border-b border-black">
              {/* Scan to pay (3 cols) */}
              <div className="col-span-3 p-2 border-r border-black flex flex-col items-center justify-center text-center">
                <div className="text-[10px] text-slate-700 font-medium mb-1">Scan to pay</div>
                <img
                  src="/sunyash-upi-qr.png"
                  alt="Scan to pay UPI"
                  className="w-24 h-24 object-contain border border-slate-300 p-0.5 bg-white shadow-2xs"
                />
              </div>

              {/* HSN/SAC Tax Table (9 cols) */}
              <div className="col-span-9">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-black text-center font-bold">
                      <th className="p-1 border-r border-black" rowSpan={2}>HSN/SAC</th>
                      <th className="p-1 border-r border-black" rowSpan={2}>Taxable<br/>Value</th>
                      {isInterstate ? (
                        <th className="p-1 border-r border-black" colSpan={2}>IGST</th>
                      ) : (
                        <>
                          <th className="p-1 border-r border-black" colSpan={2}>Central Tax</th>
                          <th className="p-1 border-r border-black" colSpan={2}>State Tax</th>
                        </>
                      )}
                      <th className="p-1" rowSpan={2}>Total<br/>Tax Amount</th>
                    </tr>
                    <tr className="border-b border-black text-center font-bold">
                      {isInterstate ? (
                        <>
                          <th className="p-0.5 border-r border-black w-12">Rate</th>
                          <th className="p-0.5 border-r border-black text-right pr-1">Amount</th>
                        </>
                      ) : (
                        <>
                          <th className="p-0.5 border-r border-black w-10">Rate</th>
                          <th className="p-0.5 border-r border-black text-right pr-1">Amount</th>
                          <th className="p-0.5 border-r border-black w-10">Rate</th>
                          <th className="p-0.5 border-r border-black text-right pr-1">Amount</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/30">
                    {/* Goods Row */}
                    <tr>
                      <td className="p-1 text-center border-r border-black font-mono">85369090</td>
                      <td className="p-1 text-right border-r border-black font-mono">
                        {goodsTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {isInterstate ? (
                        <>
                          <td className="p-1 text-center border-r border-black">18%</td>
                          <td className="p-1 text-right border-r border-black font-mono">
                            {goodsIgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-1 text-center border-r border-black">9%</td>
                          <td className="p-1 text-right border-r border-black font-mono">
                            {goodsCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-1 text-center border-r border-black">9%</td>
                          <td className="p-1 text-right border-r border-black font-mono">
                            {goodsSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </>
                      )}
                      <td className="p-1 text-right font-mono pr-1">
                        {goodsTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* Freight Row */}
                    {freightAmount > 0 && (
                      <tr>
                        <td className="p-1 text-center border-r border-black font-mono">996812</td>
                        <td className="p-1 text-right border-r border-black font-mono">
                          {freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        {isInterstate ? (
                          <>
                            <td className="p-1 text-center border-r border-black">18%</td>
                            <td className="p-1 text-right border-r border-black font-mono">
                              {freightIgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-1 text-center border-r border-black">9%</td>
                            <td className="p-1 text-right border-r border-black font-mono">
                              {freightCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-1 text-center border-r border-black">9%</td>
                            <td className="p-1 text-right border-r border-black font-mono">
                              {freightSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </>
                        )}
                        <td className="p-1 text-right font-mono pr-1">
                          {freightTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}

                    {/* Total Row */}
                    <tr className="border-t border-black font-bold">
                      <td className="p-1 text-center border-r border-black">Total</td>
                      <td className="p-1 text-right border-r border-black font-mono">
                        {totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {isInterstate ? (
                        <>
                          <td className="p-1 border-r border-black"></td>
                          <td className="p-1 text-right border-r border-black font-mono">
                            {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-1 border-r border-black"></td>
                          <td className="p-1 text-right border-r border-black font-mono">
                            {totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-1 border-r border-black"></td>
                          <td className="p-1 text-right border-r border-black font-mono">
                            {totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </>
                      )}
                      <td className="p-1 text-right font-mono pr-1">
                        {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tax Amount (in words) */}
            <div className="p-2 border-b border-black text-[11px]">
              <span>Tax Amount (in words) : </span>
              <span className="font-bold">{numberToIndianWords(totalTax)}</span>
            </div>

            {/* Remarks and Signatory */}
            <div className="grid grid-cols-2 divide-x divide-black min-h-[95px]">
              {/* Left: Remarks */}
              <div className="p-2 space-y-1">
                <div className="text-[10px] text-slate-700 font-medium">Remarks:</div>
                <div className="font-mono text-[11px] font-medium">
                  {remarksStr}
                </div>
              </div>

              {/* Right: for SUNYASH MULTI TRADING PVT LTD */}
              <div className="p-2 flex flex-col justify-between text-right">
                <div className="font-bold text-[11px]">for SUNYASH MULTI TRADING PVT LTD 26-27</div>
                <div className="font-bold text-[11px] pt-8">Authorised Signatory</div>
              </div>
            </div>
          </div>

          {/* Computer Generated Footer */}
          <div className="text-center text-[10px] italic text-slate-600 font-medium print:text-black">
            This is a Computer Generated Invoice
          </div>

          {/* PRODUCTION & PACKING WORKFLOW DETAILS (Screen Only) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-xs text-slate-900">
                  Production Shopfloor & Packing Verification
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Invoice Authorized for Production</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">Batch Number:</span>
                <span className="font-mono font-bold text-slate-900">{bNum || 'To be assigned in production'}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">Serial Number:</span>
                <span className="font-mono font-bold text-slate-900">{sNum || 'To be assigned in packing'}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">Warranty Period:</span>
                <span className="font-bold text-emerald-700">{wPeriod}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">Packing Status:</span>
                <span className="font-bold text-blue-700">{linkedOrder?.packingStatus || 'Pending'}</span>
              </div>
            </div>

            {(prodNotes || packNotes) && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                {prodNotes && (
                  <div>
                    <span className="font-semibold text-slate-700">Production Notes: </span>
                    <span className="text-slate-600">{prodNotes}</span>
                  </div>
                )}
                {packNotes && (
                  <div>
                    <span className="font-semibold text-slate-700">Packing Notes: </span>
                    <span className="text-slate-600">{packNotes}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
