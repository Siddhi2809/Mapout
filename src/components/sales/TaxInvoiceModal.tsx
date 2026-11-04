'use client';

import React, { useState, useEffect } from 'react';
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
  Layers,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Columns,
  Maximize2,
  Minimize2,
  Monitor,
  Building2,
  Truck,
  QrCode,
  IndianRupee,
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
  const [activeTab, setActiveTab] = useState<'screen' | 'invoice' | 'split' | 'production' | 'photos'>('screen');
  const [previewLightboxPhoto, setPreviewLightboxPhoto] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const orderImages: string[] = [
    ...(linkedOrder?.productionImages || []),
    ...(linkedOrder?.packedImage && !linkedOrder?.productionImages?.includes(linkedOrder.packedImage)
      ? [linkedOrder.packedImage]
      : []),
    ...(Array.isArray(invoice.paymentProofFiles) ? invoice.paymentProofFiles : []),
  ];

  const handlePrint = () => {
    window.print();
  };

  const renderInvoiceDocument = () => (
    <div className="bg-white text-black font-sans border-2 border-black max-w-[920px] w-full text-[12px] leading-snug shadow-xl print:shadow-none print:border-black print:max-w-none print:m-0 print:text-[10px]">
      {/* TITLE: Tax Invoice */}
      <div className="text-center font-bold text-base py-2 border-b border-black tracking-wide">
        Tax Invoice
      </div>

      {/* TOP SECTION: 50% / 50% split */}
      <div className="grid grid-cols-2 border-b border-black divide-x divide-black">
        {/* LEFT COLUMN: Seller, Consignee, Buyer */}
        <div className="flex flex-col divide-y divide-black">
          {/* Seller Company */}
          <div className="p-2.5 space-y-0.5">
            <div className="font-bold text-sm">{companyTitle}</div>
            <div>B-5, 3rd Floor ,Devyani Height,Near Fortune</div>
            <div>Building Kaspate Wasti Wakad Pune-411057</div>
            <div>Contact:-9503009988</div>
            <div>GSTIN/UIN: 27AAXCS4923Q1Z8</div>
            <div>State Name : Maharashtra, Code : 27</div>
          </div>

          {/* Consignee (Ship to) */}
          <div className="p-2.5 space-y-0.5">
            <div className="text-[11px] text-slate-700 font-medium">Consignee (Ship to)</div>
            <div className="font-bold text-xs">{consigneeName}</div>
            <div>{consigneeAddress}</div>
            <div>{consigneeCity} - {consigneePincode}</div>
            <div>{consigneeState}</div>
            <div className="flex">
              <span className="w-28 font-medium">GSTIN/UIN</span>
              <span>: {consigneeGstin}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-medium">State Name</span>
              <span>: {consigneeState}, Code : {consigneeStateCode}</span>
            </div>
          </div>

          {/* Buyer (Bill to) */}
          <div className="p-2.5 space-y-0.5">
            <div className="text-[11px] text-slate-700 font-medium">Buyer (Bill to)</div>
            <div className="font-bold text-xs">{buyerName}</div>
            <div>{buyerAddress}</div>
            <div>{buyerCity} - {buyerPincode}</div>
            <div>{buyerState}</div>
            <div className="flex">
              <span className="w-28 font-medium">GSTIN/UIN</span>
              <span>: {buyerGstin}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-medium">State Name</span>
              <span>: {buyerState}, Code : {buyerStateCode}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-medium">Place of Supply</span>
              <span>: {placeOfSupply}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 7-Row Grid */}
        <div className="flex flex-col divide-y divide-black text-[12px]">
          {/* Row 1 */}
          <div className="grid grid-cols-2 divide-x divide-black min-h-[42px]">
            <div className="p-2">
              <div className="text-[11px] text-slate-700">Invoice No.</div>
              <div className="font-bold">{invoiceNumber}</div>
            </div>
            <div className="p-2">
              <div className="text-[11px] text-slate-700">Dated</div>
              <div className="font-bold">{invoiceDateFormatted}</div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 divide-x divide-black min-h-[38px]">
            <div className="p-2">
              <div className="text-[11px] text-slate-700">Delivery Note</div>
              <div>{(invoice as any).deliveryNote || ''}</div>
            </div>
            <div className="p-2">
              <div className="text-[11px] text-slate-700">Mode/Terms of Payment</div>
              <div className="font-bold">{paymentTerms}</div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 divide-x divide-black min-h-[38px]">
            <div className="p-2">
              <div className="text-[11px] text-slate-700">Reference No. & Date.</div>
              <div>{(invoice as any).referenceNo || ''}</div>
            </div>
            <div className="p-2">
              <div className="text-[11px] text-slate-700">Other References</div>
              <div>{quotationNumber || (invoice as any).otherReferences || ''}</div>
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-2 divide-x divide-black min-h-[38px]">
            <div className="p-2">
              <div className="text-[11px] text-slate-700">Buyer’s Order No.</div>
              <div className="font-bold">{buyersOrderNo}</div>
            </div>
            <div className="p-2">
              <div className="text-[11px] text-slate-700">Dated</div>
              <div>{invoiceDateFormatted}</div>
            </div>
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-2 divide-x divide-black min-h-[38px]">
            <div className="p-2">
              <div className="text-[11px] text-slate-700">Dispatch Doc No.</div>
              <div>{(invoice as any).dispatchDocNo || ''}</div>
            </div>
            <div className="p-2">
              <div className="text-[11px] text-slate-700">Delivery Note Date</div>
              <div>{(invoice as any).deliveryNoteDate || ''}</div>
            </div>
          </div>

          {/* Row 6 */}
          <div className="grid grid-cols-2 divide-x divide-black min-h-[38px]">
            <div className="p-2">
              <div className="text-[11px] text-slate-700">Dispatched through</div>
              <div>{(invoice as any).dispatchedThrough || ''}</div>
            </div>
            <div className="p-2">
              <div className="text-[11px] text-slate-700">Destination</div>
              <div>{destination}</div>
            </div>
          </div>

          {/* Row 7: Terms of Delivery */}
          <div className="p-2 min-h-[46px]">
            <div className="text-[11px] text-slate-700">Terms of Delivery</div>
            <div>{(invoice as any).termsOfDelivery || 'Door Delivery - Prepaid'}</div>
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-black text-center font-bold text-[11px] sm:text-xs">
              <th className="p-2 w-10 border-r border-black">Sl<br/>No.</th>
              <th className="p-2 w-28 border-r border-black text-left">Marks & Nos./<br/>Container No.</th>
              <th className="p-2 border-r border-black text-center">Description of<br/>Goods and Services</th>
              <th className="p-2 w-24 border-r border-black">HSN/SAC</th>
              <th className="p-2 w-20 border-r border-black text-right">Quantity</th>
              <th className="p-2 w-24 border-r border-black text-right">Rate</th>
              <th className="p-2 w-14 border-r border-black text-center">per</th>
              <th className="p-2 w-28 text-right pr-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceItems.map((item, idx) => (
              <tr key={idx} className="align-top">
                <td className="p-2 text-center border-r border-black">{idx + 1}</td>
                <td className="p-2 border-r border-black"></td>
                <td className="p-2 border-r border-black font-bold">
                  {item.productName}
                </td>
                <td className="p-2 text-center border-r border-black font-mono">
                  {item.hsn || '85369090'}
                </td>
                <td className="p-2 text-right border-r border-black font-bold">
                  {item.quantity} PCS
                </td>
                <td className="p-2 text-right border-r border-black">
                  {item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-2 text-center border-r border-black">
                  PCS
                </td>
                <td className="p-2 text-right font-bold pr-2">
                  {item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}

            {freightAmount > 0 && (
              <tr className="align-top">
                <td className="p-2 text-center border-r border-black"></td>
                <td className="p-2 border-r border-black"></td>
                <td className="p-2 border-r border-black text-right font-bold italic pr-6">
                  Freight Charges
                </td>
                <td className="p-2 text-center border-r border-black font-mono">996812</td>
                <td className="p-2 border-r border-black"></td>
                <td className="p-2 border-r border-black"></td>
                <td className="p-2 border-r border-black"></td>
                <td className="p-2 text-right font-bold pr-2">
                  {freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            )}

            {isInterstate ? (
              <tr className="align-top">
                <td className="p-2 text-center border-r border-black"></td>
                <td className="p-2 border-r border-black"></td>
                <td className="p-2 border-r border-black text-right font-bold italic pr-6">
                  OUTPUT IGST@18%
                </td>
                <td className="p-2 border-r border-black"></td>
                <td className="p-2 border-r border-black"></td>
                <td className="p-2 border-r border-black"></td>
                <td className="p-2 border-r border-black"></td>
                <td className="p-2 text-right font-bold pr-2">
                  {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ) : (
              <>
                <tr className="align-top">
                  <td className="p-2 text-center border-r border-black"></td>
                  <td className="p-2 border-r border-black"></td>
                  <td className="p-2 border-r border-black text-right font-bold italic pr-6">
                    OUTPUT CGST@9%
                  </td>
                  <td className="p-2 border-r border-black"></td>
                  <td className="p-2 border-r border-black"></td>
                  <td className="p-2 border-r border-black"></td>
                  <td className="p-2 border-r border-black"></td>
                  <td className="p-2 text-right font-bold pr-2">
                    {totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="align-top">
                  <td className="p-2 text-center border-r border-black"></td>
                  <td className="p-2 border-r border-black"></td>
                  <td className="p-2 border-r border-black text-right font-bold italic pr-6">
                    OUTPUT SGST@9%
                  </td>
                  <td className="p-2 border-r border-black"></td>
                  <td className="p-2 border-r border-black"></td>
                  <td className="p-2 border-r border-black"></td>
                  <td className="p-2 border-r border-black"></td>
                  <td className="p-2 text-right font-bold pr-2">
                    {totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </>
            )}

            <tr className="align-top">
              <td className="p-2 text-center border-r border-black"></td>
              <td className="p-2 border-r border-black"></td>
              <td className="p-2 border-r border-black text-right font-bold italic pr-6">
                Rounding Off
              </td>
              <td className="p-2 border-r border-black"></td>
              <td className="p-2 border-r border-black"></td>
              <td className="p-2 border-r border-black"></td>
              <td className="p-2 border-r border-black"></td>
              <td className="p-2 text-right font-bold pr-2">
                {roundingOff.toFixed(2)}
              </td>
            </tr>

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

            <tr className="border-t border-black font-bold">
              <td className="p-2 text-center border-r border-black"></td>
              <td className="p-2 border-r border-black"></td>
              <td className="p-2 border-r border-black text-right pr-6">Total</td>
              <td className="p-2 border-r border-black"></td>
              <td className="p-2 text-right border-r border-black">{totalQty} PCS</td>
              <td className="p-2 border-r border-black"></td>
              <td className="p-2 border-r border-black"></td>
              <td className="p-2 text-right font-bold text-sm pr-2">
                ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount Chargeable (in words) */}
      <div className="p-2.5 border-b border-black flex justify-between items-center text-[12px]">
        <div>
          <div className="text-[11px] text-slate-700 font-medium">Amount Chargeable (in words)</div>
          <div className="font-bold text-xs sm:text-sm">{numberToIndianWords(grandTotal)}</div>
        </div>
        <div className="font-bold text-xs">E. & O.E</div>
      </div>

      {/* TAX BREAKDOWN & SCAN TO PAY */}
      <div className="grid grid-cols-12 border-b border-black">
        <div className="col-span-3 p-2.5 border-r border-black flex flex-col items-center justify-center text-center">
          <div className="text-[11px] text-slate-700 font-medium mb-1">Scan to pay</div>
          <img
            src="/sunyash-upi-qr.png"
            alt="Scan to pay UPI"
            className="w-28 h-28 object-contain border border-slate-300 p-0.5 bg-white shadow-2xs"
          />
        </div>

        <div className="col-span-9">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-black text-center font-bold">
                <th className="p-1.5 border-r border-black" rowSpan={2}>HSN/SAC</th>
                <th className="p-1.5 border-r border-black" rowSpan={2}>Taxable<br/>Value</th>
                {isInterstate ? (
                  <th className="p-1.5 border-r border-black" colSpan={2}>IGST</th>
                ) : (
                  <>
                    <th className="p-1.5 border-r border-black" colSpan={2}>Central Tax</th>
                    <th className="p-1.5 border-r border-black" colSpan={2}>State Tax</th>
                  </>
                )}
                <th className="p-1.5" rowSpan={2}>Total<br/>Tax Amount</th>
              </tr>
              <tr className="border-b border-black text-center font-bold">
                {isInterstate ? (
                  <>
                    <th className="p-1 border-r border-black w-14">Rate</th>
                    <th className="p-1 border-r border-black text-right pr-2">Amount</th>
                  </>
                ) : (
                  <>
                    <th className="p-1 border-r border-black w-12">Rate</th>
                    <th className="p-1 border-r border-black text-right pr-2">Amount</th>
                    <th className="p-1 border-r border-black w-12">Rate</th>
                    <th className="p-1 border-r border-black text-right pr-2">Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/30">
              <tr>
                <td className="p-1.5 text-center border-r border-black font-mono">85369090</td>
                <td className="p-1.5 text-right border-r border-black font-mono">
                  {goodsTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                {isInterstate ? (
                  <>
                    <td className="p-1.5 text-center border-r border-black">18%</td>
                    <td className="p-1.5 text-right border-r border-black font-mono pr-2">
                      {goodsIgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-1.5 text-center border-r border-black">9%</td>
                    <td className="p-1.5 text-right border-r border-black font-mono pr-2">
                      {goodsCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-1.5 text-center border-r border-black">9%</td>
                    <td className="p-1.5 text-right border-r border-black font-mono pr-2">
                      {goodsSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </>
                )}
                <td className="p-1.5 text-right font-mono pr-2">
                  {goodsTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {freightAmount > 0 && (
                <tr>
                  <td className="p-1.5 text-center border-r border-black font-mono">996812</td>
                  <td className="p-1.5 text-right border-r border-black font-mono">
                    {freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {isInterstate ? (
                    <>
                      <td className="p-1.5 text-center border-r border-black">18%</td>
                      <td className="p-1.5 text-right border-r border-black font-mono pr-2">
                        {freightIgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-1.5 text-center border-r border-black">9%</td>
                      <td className="p-1.5 text-right border-r border-black font-mono pr-2">
                        {freightCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-1.5 text-center border-r border-black">9%</td>
                      <td className="p-1.5 text-right border-r border-black font-mono pr-2">
                        {freightSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </>
                  )}
                  <td className="p-1.5 text-right font-mono pr-2">
                    {freightTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )}

              <tr className="border-t border-black font-bold">
                <td className="p-1.5 text-center border-r border-black">Total</td>
                <td className="p-1.5 text-right border-r border-black font-mono">
                  {totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                {isInterstate ? (
                  <>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 text-right border-r border-black font-mono pr-2">
                      {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 text-right border-r border-black font-mono pr-2">
                      {totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 text-right border-r border-black font-mono pr-2">
                      {totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </>
                )}
                <td className="p-1.5 text-right font-mono pr-2">
                  {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Amount (in words) */}
      <div className="p-2.5 border-b border-black text-[12px]">
        <span>Tax Amount (in words) : </span>
        <span className="font-bold">{numberToIndianWords(totalTax)}</span>
      </div>

      {/* Remarks and Signatory */}
      <div className="grid grid-cols-2 divide-x divide-black min-h-[100px]">
        <div className="p-2.5 space-y-1">
          <div className="text-[11px] text-slate-700 font-medium">Remarks:</div>
          <div className="font-mono text-xs font-medium">
            {remarksStr}
          </div>
        </div>

        <div className="p-2.5 flex flex-col justify-between text-right">
          <div className="font-bold text-xs">for SUNYASH MULTI TRADING PVT LTD 26-27</div>
          <div className="font-bold text-xs pt-10">Authorised Signatory</div>
        </div>
      </div>
    </div>
  );

  const renderProductionDetails = () => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
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
            <span>Authorized for Production</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium block">Batch Number:</span>
          <span className="font-mono font-bold text-slate-900">{bNum || 'To be assigned in production'}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium block">Serial Number:</span>
          <span className="font-mono font-bold text-slate-900">{sNum || 'To be assigned in packing'}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium block">Warranty Period:</span>
          <span className="font-bold text-emerald-700">{wPeriod}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium block">Packing Status:</span>
          <span className="font-bold text-blue-700">{linkedOrder?.packingStatus || 'Pending'}</span>
        </div>
      </div>

      {(prodNotes || packNotes) && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
          {prodNotes && (
            <div>
              <span className="font-bold text-slate-800">Production Notes: </span>
              <span className="text-slate-700">{prodNotes}</span>
            </div>
          )}
          {packNotes && (
            <div>
              <span className="font-bold text-slate-800">Packing Notes: </span>
              <span className="text-slate-700">{packNotes}</span>
            </div>
          )}
        </div>
      )}

      {/* Items Verification List */}
      <div className="space-y-2 pt-1">
        <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <PackageCheck className="w-3.5 h-3.5 text-blue-600" /> Line Items for Production
        </h5>
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
              <tr>
                <th className="py-2 px-3">Product Name</th>
                <th className="py-2 px-3">SKU</th>
                <th className="py-2 px-3 text-right">Quantity</th>
                <th className="py-2 px-3 text-right">Rate</th>
                <th className="py-2 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoiceItems.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium text-slate-900">{it.productName}</td>
                  <td className="py-2 px-3 font-mono text-blue-700 font-bold">{it.sku}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">{it.quantity}</td>
                  <td className="py-2 px-3 text-right font-mono">₹{it.rate.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">₹{it.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPhotosGallery = () => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-600" />
          <h4 className="font-bold text-xs text-slate-900">
            Production & Packaging Verification Photos
          </h4>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {orderImages.length} {orderImages.length === 1 ? 'Photo' : 'Photos'} Attached
        </span>
      </div>

      {orderImages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {orderImages.map((imgSrc, idx) => (
            <div
              key={idx}
              className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center cursor-pointer shadow-2xs hover:shadow-md transition"
              onClick={() => setPreviewLightboxPhoto(imgSrc)}
            >
              <img
                src={imgSrc}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <span className="px-2.5 py-1 rounded-lg bg-white/90 text-slate-900 text-xs font-bold flex items-center gap-1 shadow">
                  <Eye className="w-3 h-3 text-blue-600" /> Zoom
                </span>
              </div>
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white font-mono text-[9px]">
                Photo #{idx + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs space-y-1">
          <Camera className="w-6 h-6 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600">No photos uploaded for this order yet.</p>
          <p className="text-[11px] text-slate-400">Photos taken during production and packing will display here for verification.</p>
        </div>
      )}
    </div>
  );

  const renderScreenView = () => (
    <div className="space-y-6 max-w-6xl mx-auto w-full pb-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                GST Tax Invoice
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {hasProofOrPaid ? 'Payment Verified (Paid)' : (invoice.paymentStatus || 'Payment Pending')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                {prodStatus}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight mt-2 text-white">
              {companyTitle}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              B-5, 3rd Floor, Devyani Height, Near Fortune Building, Kaspate Wasti Wakad, Pune - 411057, Maharashtra • Contact: 9503009988
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-right shrink-0 min-w-[220px]">
            <div className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">Invoice Number</div>
            <div className="text-xl font-mono font-black text-amber-300">{invoiceNumber}</div>
            <div className="text-xs text-slate-300 mt-1">Date: <strong className="text-white">{invoiceDateFormatted}</strong></div>
            <div className="text-xs text-slate-300">GSTIN: <strong className="font-mono text-emerald-300">27AAXCS4923Q1Z8</strong></div>
          </div>
        </div>

        {/* Quick Meta Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 text-xs">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block">Buyer Order No</span>
            <span className="font-bold text-white mt-0.5 block truncate">{buyersOrderNo || 'N/A'}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block">Quotation Ref</span>
            <span className="font-bold text-purple-300 mt-0.5 block truncate">{quotationNumber || 'Direct Order'}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block">Payment Terms</span>
            <span className="font-bold text-emerald-300 mt-0.5 block truncate">{paymentTerms}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block">Place of Supply</span>
            <span className="font-bold text-white mt-0.5 block truncate">{placeOfSupply} (State {buyerStateCode})</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block">Destination</span>
            <span className="font-bold text-white mt-0.5 block truncate">{destination}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block">Delivery Terms</span>
            <span className="font-bold text-white mt-0.5 block truncate">Door Delivery - Prepaid</span>
          </div>
        </div>
      </div>

      {/* 2. Buyer and Consignee Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Buyer Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Billed To (Buyer)</h4>
                  <div className="text-sm font-bold text-slate-900">{buyerName}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Code: {buyerStateCode}
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <p className="leading-relaxed">{buyerAddress}</p>
              <p><strong className="text-slate-700">Location:</strong> {buyerCity} - {buyerPincode}, {buyerState}</p>
              <div className="pt-1 flex items-center gap-2">
                <span className="text-slate-500 font-semibold">GSTIN/UIN:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {buyerGstin}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>State: <strong className="text-slate-800">{buyerState}</strong></span>
            <span>Tax Type: <strong className={isInterstate ? "text-amber-700 font-bold" : "text-blue-700 font-bold"}>{isInterstate ? "Interstate (IGST 18%)" : "Intrastate (CGST 9% + SGST 9%)"}</strong></span>
          </div>
        </div>

        {/* Consignee Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Shipped To (Consignee)</h4>
                  <div className="text-sm font-bold text-slate-900">{consigneeName}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Code: {consigneeStateCode}
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <p className="leading-relaxed">{consigneeAddress}</p>
              <p><strong className="text-slate-700">Location:</strong> {consigneeCity} - {consigneePincode}, {consigneeState}</p>
              <div className="pt-1 flex items-center gap-2">
                <span className="text-slate-500 font-semibold">GSTIN/UIN:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {consigneeGstin}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Destination: <strong className="text-slate-800">{destination}</strong></span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Shipping Address Verified
            </span>
          </div>
        </div>
      </div>

      {/* 3. Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Invoice Line Items & Services</h4>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            {invoiceItems.length} {invoiceItems.length === 1 ? 'Item' : 'Items'} • Total Qty: {totalQty} PCS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/75 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-3 px-3.5 w-12 text-center">#</th>
                <th className="py-3 px-3">Product Description</th>
                <th className="py-3 px-3 w-28 text-center">HSN/SAC</th>
                <th className="py-3 px-3 w-28 text-right">Quantity</th>
                <th className="py-3 px-3 w-32 text-right">Unit Rate</th>
                <th className="py-3 px-3 w-16 text-center">Unit</th>
                <th className="py-3 px-4 w-36 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoiceItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">{item.productName}</div>
                    {item.sku && (
                      <span className="inline-block mt-1 font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        SKU: {item.sku}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-600">
                    {item.hsn || '85369090'}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                    {item.quantity} PCS
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                    ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-3 text-center font-medium text-slate-500 uppercase">
                    PCS
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                    ₹{item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {/* Extra charge rows */}
              {freightAmount > 0 && (
                <tr className="bg-slate-50/50">
                  <td className="py-2.5 px-3.5"></td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-500" /> Freight & Logistics Charges
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500">996812</td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                    ₹{freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )}

              {isInterstate ? (
                <tr className="bg-amber-50/30">
                  <td className="py-2.5 px-3.5"></td>
                  <td className="py-2.5 px-3 font-semibold text-amber-900">
                    Integrated GST (OUTPUT IGST @ 18%)
                  </td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 text-center font-bold text-amber-700">18%</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-900">
                    ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ) : (
                <>
                  <tr className="bg-blue-50/30">
                    <td className="py-2.5 px-3.5"></td>
                    <td className="py-2.5 px-3 font-semibold text-blue-900">
                      Central GST (OUTPUT CGST @ 9%)
                    </td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3 text-center font-bold text-blue-700">9%</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-900">
                      ₹{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-blue-50/30">
                    <td className="py-2.5 px-3.5"></td>
                    <td className="py-2.5 px-3 font-semibold text-blue-900">
                      State GST (OUTPUT SGST @ 9%)
                    </td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3 text-center font-bold text-blue-700">9%</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-900">
                      ₹{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </>
              )}

              {roundingOff !== 0 && (
                <tr className="bg-slate-50/50">
                  <td className="py-2 px-3.5"></td>
                  <td className="py-2 px-3 text-slate-500 italic">Rounding Off adjustment</td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-4 text-right font-mono text-slate-600 font-semibold">
                    {roundingOff > 0 ? `+₹${roundingOff.toFixed(2)}` : `-₹${Math.abs(roundingOff).toFixed(2)}`}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold text-xs sm:text-sm">
                <td colSpan={3} className="py-3.5 px-4 uppercase tracking-wider text-slate-300">
                  Total Payable Amount
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-300">
                  {totalQty} PCS
                </td>
                <td colSpan={2} className="py-3.5 px-3 text-right text-xs font-normal text-slate-300">
                  Grand Total (Inclusive of Taxes)
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-lg font-black text-emerald-400">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. Financial Summary, Words, Tax Breakdown & UPI QR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Amount in Words & Tax Matrix (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Amount in words card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Amount Chargeable (in words)</span>
              <span className="font-mono text-slate-400">E. & O.E</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-snug">
              {numberToIndianWords(grandTotal)}
            </div>
            <div className="text-xs text-slate-600 pt-1 border-t border-slate-100 flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Total Tax:</span>
              <span className="font-bold text-slate-800">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span className="text-slate-400">({numberToIndianWords(totalTax)})</span>
            </div>
          </div>

          {/* Tax Analysis Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-600" /> GST Tax Breakdown Matrix
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">HSN/SAC</th>
                    <th className="py-2 px-3 text-right">Taxable Value</th>
                    {isInterstate ? (
                      <>
                        <th className="py-2 px-3 text-center">IGST %</th>
                        <th className="py-2 px-3 text-right">IGST Amount</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2 px-3 text-center">CGST %</th>
                        <th className="py-2 px-3 text-right">CGST Amt</th>
                        <th className="py-2 px-3 text-center">SGST %</th>
                        <th className="py-2 px-3 text-right">SGST Amt</th>
                      </>
                    )}
                    <th className="py-2 px-3 text-right font-bold">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-900">85369090</td>
                    <td className="py-2 px-3 text-right">₹{goodsTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    {isInterstate ? (
                      <>
                        <td className="py-2 px-3 text-center">18%</td>
                        <td className="py-2 px-3 text-right">₹{goodsIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-3 text-center">9%</td>
                        <td className="py-2 px-3 text-right">₹{goodsCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-3 text-center">9%</td>
                        <td className="py-2 px-3 text-right">₹{goodsSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </>
                    )}
                    <td className="py-2 px-3 text-right font-bold text-slate-900">₹{goodsTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  {freightAmount > 0 && (
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">996812</td>
                      <td className="py-2 px-3 text-right">₹{freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      {isInterstate ? (
                        <>
                          <td className="py-2 px-3 text-center">18%</td>
                          <td className="py-2 px-3 text-right">₹{freightIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-3 text-center">9%</td>
                          <td className="py-2 px-3 text-right">₹{freightCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-3 text-center">9%</td>
                          <td className="py-2 px-3 text-right">₹{freightSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </>
                      )}
                      <td className="py-2 px-3 text-right font-bold text-slate-900">₹{freightTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Scan to Pay & Signatory (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-center space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Scan & Pay via UPI / Netbanking
            </div>
            <div className="flex justify-center">
              <img
                src="/sunyash-upi-qr.png"
                alt="Scan to pay UPI"
                className="w-36 h-36 object-contain border border-slate-300 p-1 rounded-xl bg-white shadow-xs"
              />
            </div>
            <div className="text-xs text-slate-600 font-mono space-y-0.5">
              <div className="font-bold text-slate-900">SUNYASH MULTI TRADING PVT LTD</div>
              <div>Bank: ICICI Bank • Pune Branch</div>
              <div>Account: 003905001234 • IFSC: ICIC0000039</div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs space-y-2">
            <div className="text-slate-500 font-medium">Remarks / Serial References:</div>
            <div className="font-mono text-slate-900 bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
              {remarksStr}
            </div>
            <div className="pt-2 text-right">
              <div className="text-[11px] font-bold text-slate-800">for SUNYASH MULTI TRADING PVT LTD</div>
              <div className="text-xs font-bold text-slate-500 pt-6">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Production & Packing Shopfloor Verification */}
      {renderProductionDetails()}
    </div>
  );

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 w-screen h-screen overflow-hidden flex flex-col p-0 m-0'
          : 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 md:p-5 overflow-hidden'
      }
      onClick={(e) => {
        if (!isFullscreen && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={
          isFullscreen
            ? 'bg-slate-100 w-full h-full flex flex-col text-slate-900 overflow-hidden'
            : 'bg-slate-100 border border-slate-300 rounded-2xl shadow-2xl w-[98vw] max-w-7xl h-[95vh] max-h-[96vh] flex flex-col text-slate-900 overflow-hidden animate-in fade-in zoom-in-95 duration-150'
        }
      >
        {/* Actions & Header Bar (Sticky) */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-extrabold text-blue-700">
                  {invoiceNumber}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {roleBadge}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {hasProofOrPaid ? 'Payment Verified (Paid)' : (invoice.paymentStatus || 'Payment Pending')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Status: {prodStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Customer: <strong className="text-slate-800">{buyerName}</strong> • Date: {invoiceDateFormatted} • Order Ref: {buyersOrderNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls for Invoice/Split modes */}
            {(activeTab === 'invoice' || activeTab === 'split') && (
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-[11px] font-mono font-bold text-slate-700 min-w-[42px] text-center select-none">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(160, z + 10))}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {zoomLevel !== 100 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition cursor-pointer ml-0.5 text-[10px] font-bold"
                    title="Reset Zoom (100%)"
                  >
                    100%
                  </button>
                )}
              </div>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Print / PDF Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ml-1"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Sticky) */}
        <div className="px-5 py-2 border-b border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('screen')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'screen'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Screen View (Full Display)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('invoice')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'invoice'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Official GST Copy (A4 Print)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'split'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side View</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('production')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'production'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Production & Packing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'photos'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photos ({orderImages.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-600 font-mono hidden md:flex items-center gap-2">
            <span>Grand Total:</span>
            <strong className="text-slate-900 font-extrabold text-sm bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 space-y-6 print:p-0 print:bg-white print:overflow-visible">
          {activeTab === 'screen' && (
            <div>{renderScreenView()}</div>
          )}

          {activeTab === 'invoice' && (
            <div className="flex flex-col items-center space-y-4">
              <div
                className="w-full transition-transform duration-150 origin-top flex justify-center"
                style={{ transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined }}
              >
                {renderInvoiceDocument()}
              </div>
              <div className="text-center text-[10px] italic text-slate-500 font-medium print:text-black">
                This is a Computer Generated Invoice
              </div>
            </div>
          )}

          {activeTab === 'split' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start max-w-full">
              {/* Left Column: Tax Invoice Paper */}
              <div className="xl:col-span-8 flex flex-col items-center space-y-4">
                <div
                  className="w-full transition-transform duration-150 origin-top flex justify-center"
                  style={{ transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined }}
                >
                  {renderInvoiceDocument()}
                </div>
                <div className="text-center text-[10px] italic text-slate-500 font-medium print:text-black">
                  This is a Computer Generated Invoice
                </div>
              </div>

              {/* Right Column: Production Details & Photos */}
              <div className="xl:col-span-4 space-y-5 sticky top-0 print:hidden">
                {renderProductionDetails()}
                {renderPhotosGallery()}
              </div>
            </div>
          )}

          {activeTab === 'production' && (
            <div className="max-w-4xl mx-auto">
              {renderProductionDetails()}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="max-w-4xl mx-auto">
              {renderPhotosGallery()}
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        {previewLightboxPhoto && (
          <div
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewLightboxPhoto(null)}
          >
            <div
              className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" /> Verification Photo
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewLightboxPhoto(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 flex items-center justify-center bg-slate-950 rounded-xl">
                <img
                  src={previewLightboxPhoto}
                  alt="Enlarged preview"
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
