'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { SalesInvoice } from '@/types/erp';
import { numberToIndianWords } from '@/lib/numberToWords';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  X,
  CreditCard,
} from 'lucide-react';

// Indian GST State Codes Reference
const INDIAN_STATE_CODES: Record<string, string> = {
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

function formatInvoiceDate(d?: string | Date): string {
  if (!d) return '12-May-26';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

export default function AdminInvoicesPage() {
  const { invoices, salesOrders, quotations, customers } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPay = paymentFilter ? inv.paymentStatus.toLowerCase() === paymentFilter.toLowerCase() : true;

      return matchSearch && matchPay;
    });
  }, [invoices, searchQuery, paymentFilter]);

  // Order items associated with the selected invoice
  const relatedOrder = useMemo(() => {
    if (!selectedInvoice) return null;
    return salesOrders.find((o) => o.id === selectedInvoice.salesOrderId || o.orderNumber === selectedInvoice.salesOrderNumber);
  }, [selectedInvoice, salesOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tax Invoices & Billing</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {invoices.length} Invoices
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized registry of all GST sales invoices, taxes collected, and client payment clearances.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice #, customer name, sales order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-4 py-3.5">Invoice Date</th>
                <th className="px-4 py-3.5">Customer & Order</th>
                <th className="px-4 py-3.5 text-right">Subtotal</th>
                <th className="px-4 py-3.5 text-right">GST (18%)</th>
                <th className="px-4 py-3.5 text-right">Grand Total</th>
                <th className="px-4 py-3.5 text-center">Payment Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900 font-mono">
                    {inv.invoiceNumber}
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {inv.invoiceDate}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900">{inv.customerName}</div>
                    <div className="text-[11px] text-blue-600 font-mono mt-0.5">Order: {inv.salesOrderNumber}</div>
                  </td>

                  <td className="px-4 py-4 text-right text-slate-600">
                    ₹{(inv.subtotal || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="px-4 py-4 text-right text-slate-600">
                    ₹{(inv.gstAmount || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="px-4 py-4 text-right font-black text-slate-900">
                    ₹{(inv.grandTotal || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        inv.paymentStatus.toLowerCase() === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.paymentStatus.toLowerCase().includes('part')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Tax Invoice
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No invoices found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal with Exact Tax Invoice Layout */}
      {selectedInvoice && (() => {
        const cust = customers.find(
          (c) =>
            c.id === selectedInvoice.customerId ||
            c.name === selectedInvoice.customerName ||
            c.companyName === selectedInvoice.customerName
        );
        const linkedQuote = quotations.find(
          (q) =>
            q.id === selectedInvoice.quotationId ||
            q.quotationNumber === selectedInvoice.quotationNumber
        );

        // Consignee and Buyer Details
        const companyTitle = 'SUNYASH MULTI TRADING PVT LTD 26-27';
        const consigneeName =
          cust?.companyName ||
          cust?.name ||
          selectedInvoice.customerName ||
          'Pathankot Vehicleades pvt. Ltd- Gurdaspur';
        const consigneeAddress =
          cust?.shippingAddress ||
          cust?.address ||
          selectedInvoice.billingAddress ||
          'Batala Road , Jeevanwal babri gurdaspur,';
        const consigneeCity = cust?.city || 'Gurdaspur';
        const consigneePincode = cust?.pincode || '143521';
        const consigneeState = cust?.state || 'Punjab';
        const consigneeGstin =
          selectedInvoice.gstNumber ||
          cust?.gstin ||
          cust?.gstNumber ||
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

        const isInterstate = consigneeStateCode !== '27';

        // Items breakdown
        const rawItems =
          selectedInvoice.items && Array.isArray(selectedInvoice.items) && selectedInvoice.items.length > 0
            ? selectedInvoice.items
            : relatedOrder?.items && relatedOrder.items.length > 0
            ? relatedOrder.items.map((i) => ({
                productName: i.productName,
                sku: i.sku || 'SKU-01',
                quantity: i.quantity,
                rate: i.sellingPrice || 0,
                subtotal: i.totalPrice,
                hsn: '85369090',
              }))
            : [
                {
                  productName: 'BOSCH OBD-II Male to DB 26 Female Cable(Universal Cable)',
                  sku: 'BOSCH-CBL-01',
                  quantity: 6,
                  rate: 2459.18,
                  subtotal: 14755.08,
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

        const freightAmount = Number(
          (selectedInvoice as any).freightCharges ??
          linkedQuote?.freightCharges ??
          (selectedInvoice.subtotal > goodsTaxable ? selectedInvoice.subtotal - goodsTaxable : 0)
        );

        const totalTaxable = goodsTaxable + freightAmount;

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
        const grandTotal = Number(selectedInvoice.grandTotal) || Math.round(rawGrandTotal);
        const roundingOff = Math.round((grandTotal - rawGrandTotal) * 100) / 100;

        const invoiceNumber = selectedInvoice.invoiceNumber || 'SUN/26-27/83';
        const invoiceDateFormatted = formatInvoiceDate(selectedInvoice.invoiceDate);
        const paymentTerms =
          (selectedInvoice as any).paymentTerms || cust?.paymentTerms || '100 % Advance';
        const quotationNumber = selectedInvoice.quotationNumber || '';
        const buyersOrderNo = selectedInvoice.salesOrderNumber || '';
        const destination = `${consigneeCity} ${consigneeState}`;

        const remarksStr =
          selectedInvoice.serialNumber || (selectedInvoice as any).batchNumber
            ? `Sr.No. ${selectedInvoice.serialNumber || ''}${(selectedInvoice as any).batchNumber ? ` / Batch: ${(selectedInvoice as any).batchNumber}` : ''}`
            : selectedInvoice.notes || 'Sr.No.375/360/373/381/367/385';

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 my-6">
              {/* Modal Actions Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 print:hidden">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-slate-900 font-mono">Invoice: {selectedInvoice.invoiceNumber}</h3>
                  <span className="text-xs text-slate-500 font-mono">Date: {selectedInvoice.invoiceDate}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedInvoice.paymentStatus.toLowerCase() === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedInvoice.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / PDF
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Exact Paper Tax Invoice Document */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-100 print:bg-white print:p-0">
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
                          <div>{(selectedInvoice as any).deliveryNote || ''}</div>
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
                          <div>{(selectedInvoice as any).referenceNo || ''}</div>
                        </div>
                        <div className="p-1.5">
                          <div className="text-[10px] text-slate-700">Other References</div>
                          <div>{quotationNumber || (selectedInvoice as any).otherReferences || ''}</div>
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
                          <div>{(selectedInvoice as any).dispatchDocNo || relatedOrder?.trackingNumber || ''}</div>
                        </div>
                        <div className="p-1.5">
                          <div className="text-[10px] text-slate-700">Delivery Note Date</div>
                          <div>{(selectedInvoice as any).deliveryNoteDate || ''}</div>
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
                        <div>{(selectedInvoice as any).termsOfDelivery || 'Ex Works : Sunyash Multi Trading'}</div>
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
                <div className="text-center text-[10px] italic text-slate-600 font-medium mt-2 print:text-black">
                  This is a Computer Generated Invoice
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Tax Invoice
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
