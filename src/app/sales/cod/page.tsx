'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { SalesOrder, Quotation } from '@/types/erp';
import {
  HandCoins,
  ShoppingCart,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  Calendar,
  MapPin,
  Clock,
  Truck,
  Phone,
  MessageSquare,
  FileCheck,
  FileText,
  DollarSign,
  Plus,
  PackageCheck,
  Building2,
  CreditCard,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export type CodRecord = SalesOrder & {
  isQuotationOnly?: boolean;
  quotationStatus?: string;
  quotationId?: string;
};

export default function CODOrdersPage() {
  const {
    salesOrders,
    customers,
    invoices,
    quotations,
    createCustomerPaymentFull,
    createInvoiceFromQuotation,
    activeRole,
  } = useERP();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [collectionFilter, setCollectionFilter] = useState<'ALL' | 'PENDING' | 'COLLECTED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ORDERS' | 'QUOTATIONS'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<CodRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectTargetOrder, setCollectTargetOrder] = useState<CodRecord | null>(null);

  // Collection Form State
  const [collectAmount, setCollectAmount] = useState(0);
  const [collectDate, setCollectDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [collectReference, setCollectReference] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Read URL query parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('search');
      if (s) setSearchQuery(s);
      const t = params.get('type');
      if (t === 'QUOTATIONS' || t === 'ORDERS') setTypeFilter(t);
    }
  }, []);

  // Helper: Identify if order is COD
  const isCODOrder = (so: SalesOrder) => {
    if (so.paymentMode === 'COD') return true;
    const ship = (so.shippingDetails || '').toLowerCase();
    const notes = (so.notes || '').toLowerCase();
    const channel = (so.salesChannel || '').toLowerCase();
    return (
      ship.includes('cod') ||
      ship.includes('cash on delivery') ||
      notes.includes('cod') ||
      notes.includes('cash on delivery') ||
      channel.includes('cod')
    );
  };

  // ALL COD Orders & Quotations combined
  const allCodOrders = useMemo<CodRecord[]>(() => {
    // 1. Direct SalesOrders with COD
    const listFromSO: CodRecord[] = salesOrders
      .filter(isCODOrder)
      .map((so) => ({ ...so, isQuotationOnly: false }));

    // 2. Quotations with COD (that are not already represented by a sales order)
    const listFromQuotations: CodRecord[] = [];

    quotations.forEach((q) => {
      if (q.paymentMode === 'COD') {
        const alreadyInSO = listFromSO.some(
          (so) =>
            so.quotationId === q.id ||
            (so.quotationNumber && so.quotationNumber === q.quotationNumber) ||
            (q.salesOrderId && so.id === q.salesOrderId) ||
            (q.orderNumber && so.orderNumber === q.orderNumber)
        );

        if (!alreadyInSO) {
          const mappedItems = (q.items || []).map((item, idx) => ({
            id: item.id || `q_item_${idx}`,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.rate,
            sellingPrice: item.rate,
            discount: item.discount || 0,
            gstPercent: item.gstPercent || 18,
            totalPrice: item.totalAmount,
            warrantyPeriod: item.warrantyPeriod || q.warrantyPeriod || '1 Year',
          }));

          const quoteOrderObj: CodRecord = {
            id: `cod_qt_${q.id}`,
            orderNumber: q.quotationNumber,
            quotationNumber: q.quotationNumber,
            quotationId: q.id,
            customerId: q.customerId,
            customerName: q.customerName,
            customerNumber: q.customerNumber,
            orderDate: q.quotationDate,
            expectedDelivery: q.validUntil,
            dueDate: q.validUntil,
            items: mappedItems,
            subtotal: q.subtotal,
            discountAmount: q.discountAmount || 0,
            taxAmount: q.taxAmount || 0,
            gstAmount: q.taxAmount || 0,
            totalAmount: q.totalAmount,
            grandTotal: q.totalAmount,
            amountPaid: 0,
            paymentStatus: 'UNPAID',
            dispatchStatus: 'Pending',
            orderStatus: (q.status as any) || 'Draft',
            paymentMode: 'COD',
            notes: q.notes || 'Quotation created with COD terms',
            salesperson: q.salesperson || 'Sales Person',
            isQuotationOnly: true,
            quotationStatus: q.status,
          };

          listFromQuotations.push(quoteOrderObj);
        }
      }
    });

    return [...listFromSO, ...listFromQuotations];
  }, [salesOrders, quotations]);

  // Available Cities for Filter
  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    allCodOrders.forEach((so) => {
      const cust = customers.find((c) => c.id === so.customerId);
      if (cust?.city && cust.city.trim()) citySet.add(cust.city.trim());
    });
    customers.forEach((c) => {
      if (c.city && c.city.trim()) citySet.add(c.city.trim());
    });
    return Array.from(citySet).sort();
  }, [allCodOrders, customers]);

  // Filtered COD Orders
  const filteredCodOrders = useMemo(() => {
    return allCodOrders.filter((so) => {
      const cust = customers.find((c) => c.id === so.customerId);
      const cCity = (cust?.city || '').toLowerCase();
      const sDetails = (so.shippingDetails || '').toLowerCase();

      // Type Filter (All / Orders / Quotations)
      if (typeFilter === 'ORDERS' && so.isQuotationOnly) return false;
      if (typeFilter === 'QUOTATIONS' && !so.isQuotationOnly) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchOrder = so.orderNumber.toLowerCase().includes(q);
        const matchInvoice = (so.invoiceNumber || '').toLowerCase().includes(q);
        const matchQuote = (so.quotationNumber || '').toLowerCase().includes(q);
        const matchCust = so.customerName.toLowerCase().includes(q);
        const matchMob = (cust?.mobile || '').toLowerCase().includes(q);
        const matchItems = so.items.some(
          (i) => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
        );
        if (!matchOrder && !matchInvoice && !matchQuote && !matchCust && !matchMob && !matchItems) {
          return false;
        }
      }

      // Dispatch/Order Status Filter
      if (statusFilter !== 'ALL') {
        const matchesOrder = so.orderStatus === statusFilter || so.quotationStatus === statusFilter;
        const matchesDispatch = so.dispatchStatus === statusFilter;
        if (!matchesOrder && !matchesDispatch) return false;
      }

      // COD Collection Status Filter
      const isPaid = so.paymentStatus === 'PAID' || (so.amountPaid >= so.grandTotal && so.grandTotal > 0);
      if (collectionFilter === 'PENDING' && isPaid) return false;
      if (collectionFilter === 'COLLECTED' && !isPaid) return false;

      // Date Range Filter
      const oDate = (so.orderDate || '').split('T')[0];
      if (startDate && oDate < startDate) return false;
      if (endDate && oDate > endDate) return false;

      // City Filter
      if (cityFilter !== 'ALL') {
        const matchCity = cCity === cityFilter.toLowerCase() || sDetails.includes(cityFilter.toLowerCase());
        if (!matchCity) return false;
      }

      return true;
    });
  }, [allCodOrders, typeFilter, searchQuery, statusFilter, collectionFilter, startDate, endDate, cityFilter, customers]);

  // Statistics KPI
  const stats = useMemo(() => {
    const totalOrders = allCodOrders.length;
    const totalQuotationsCount = allCodOrders.filter((so) => so.isQuotationOnly).length;
    const totalSalesOrdersCount = allCodOrders.filter((so) => !so.isQuotationOnly).length;
    const totalValue = allCodOrders.reduce((sum, so) => sum + (so.grandTotal || 0), 0);
    const pendingOrders = allCodOrders.filter(
      (so) => so.paymentStatus !== 'PAID' && (so.amountPaid || 0) < (so.grandTotal || 0)
    );
    const pendingAmount = pendingOrders.reduce(
      (sum, so) => sum + Math.max(0, (so.grandTotal || 0) - (so.amountPaid || 0)),
      0
    );
    const collectedOrders = allCodOrders.filter(
      (so) => so.paymentStatus === 'PAID' || (so.amountPaid >= so.grandTotal && so.grandTotal > 0)
    );
    const collectedAmount = collectedOrders.reduce((sum, so) => sum + (so.amountPaid || so.grandTotal || 0), 0);
    const activeDispatches = allCodOrders.filter(
      (so) =>
        so.dispatchStatus === 'DISPATCHED' ||
        so.dispatchStatus === 'Dispatched' ||
        so.dispatchStatus === 'Ready to Dispatch' ||
        so.orderStatus === 'Dispatched' ||
        so.orderStatus === 'Ready for Dispatch'
    ).length;

    return {
      totalOrders,
      totalQuotationsCount,
      totalSalesOrdersCount,
      totalValue,
      pendingOrdersCount: pendingOrders.length,
      pendingAmount,
      collectedOrdersCount: collectedOrders.length,
      collectedAmount,
      activeDispatches,
    };
  }, [allCodOrders]);

  // Open Cash Collection Modal
  const handleOpenCollectModal = (so: SalesOrder) => {
    setCollectTargetOrder(so);
    const pending = Math.max(0, (so.grandTotal || 0) - (so.amountPaid || 0));
    setCollectAmount(pending > 0 ? pending : so.grandTotal);
    setCollectDate(new Date().toISOString().split('T')[0]);
    setCollectReference(`COD-CASH-${Date.now().toString().slice(-4)}`);
    setCollectNotes(`Cash collected upon delivery for Order ${so.orderNumber}`);
    setIsCollectModalOpen(true);
  };

  // Submit Cash Collection
  const handleSubmitCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectTargetOrder) return;

    const invoice = invoices.find(
      (i) =>
        i.salesOrderId === collectTargetOrder.id ||
        (collectTargetOrder.invoiceNumber && i.invoiceNumber === collectTargetOrder.invoiceNumber) ||
        (collectTargetOrder.invoiceId && i.id === collectTargetOrder.invoiceId)
    );

    if (invoice) {
      createCustomerPaymentFull({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: collectTargetOrder.customerId,
        customerName: collectTargetOrder.customerName,
        paymentDate: collectDate,
        paymentMode: 'Cash',
        referenceNumber: collectReference || `COD-RECEIPT-${Date.now().toString().slice(-4)}`,
        amount: collectAmount,
        notes: collectNotes || `COD Cash Collection confirmed.`,
        status: 'Completed'
      });
    } else {
      // Direct payment recording if no separate invoice record exists
      createCustomerPaymentFull({
        invoiceId: collectTargetOrder.id,
        invoiceNumber: collectTargetOrder.invoiceNumber || collectTargetOrder.orderNumber,
        customerId: collectTargetOrder.customerId,
        customerName: collectTargetOrder.customerName,
        paymentDate: collectDate,
        paymentMode: 'Cash',
        referenceNumber: collectReference || `COD-RECEIPT-${Date.now().toString().slice(-4)}`,
        amount: collectAmount,
        notes: collectNotes || `COD Cash Collection confirmed for Order ${collectTargetOrder.orderNumber}`,
        status: 'Completed'
      });
    }

    showToast(`✓ Cash collection of ₹${collectAmount.toLocaleString('en-IN')} recorded for ${collectTargetOrder.orderNumber}! Payment status updated to PAID.`);
    setIsCollectModalOpen(false);
    setCollectTargetOrder(null);
  };

  return (
    <DashboardLayout roleTitle="Sales Management" roleBadge="Sales Manager" navItems={SALES_NAV}>
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <HandCoins className="w-5 h-5 text-amber-700" />
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Cash On Delivery (COD) Orders
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dedicated module showing only COD orders. Track dispatch, delivery, and cash collection reconciliation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/sales/quotations"
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Create COD Quotation</span>
            </Link>
            <Link
              href="/sales/orders"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Create COD Sales Order</span>
            </Link>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total COD Orders */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total COD Orders</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <HandCoins className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {stats.totalOrders}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>₹{stats.totalValue.toLocaleString('en-IN')}</span>
              <span>•</span>
              <span className="text-blue-700 font-bold">{stats.totalSalesOrdersCount} Orders</span>
              <span>•</span>
              <span className="text-purple-700 font-bold">{stats.totalQuotationsCount} Quotes</span>
            </div>
          </div>

          {/* Pending Cash Collection */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-amber-800 text-xs font-bold uppercase tracking-wider">Pending Cash Collection</span>
              <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-amber-700 mt-2">
              ₹{stats.pendingAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-xs font-semibold text-amber-800/80 mt-0.5">
              Across <strong>{stats.pendingOrdersCount}</strong> awaiting collection orders
            </div>
          </div>

          {/* Cash Collected / Reconciled */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-emerald-800 text-xs font-bold uppercase tracking-wider">COD Collected (Paid)</span>
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2">
              ₹{stats.collectedAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-xs font-semibold text-emerald-800/80 mt-0.5">
              {stats.collectedOrdersCount} orders fully collected
            </div>
          </div>

          {/* In Transit / Out for Delivery */}
          <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 text-xs font-bold uppercase tracking-wider">In Transit / Dispatched</span>
              <span className="p-2 rounded-xl bg-blue-100 text-blue-800">
                <Truck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-700 mt-2">
              {stats.activeDispatches}
            </div>
            <div className="text-xs font-semibold text-blue-800/80 mt-0.5">
              Out with courier / awaiting delivery
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          {/* Top row: Search, Dates, City */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search COD Order #, Customer, Mobile, City, Quotation..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* Date Range Inputs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500 font-medium">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-slate-800 font-medium focus:outline-none"
                  title="From Order Date"
                />
                <span className="text-slate-400 font-medium mx-1">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-slate-800 font-medium focus:outline-none"
                  title="To Order Date"
                />
              </div>

              {/* City Filter */}
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold ml-1 text-xs">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="ALL">All Cities ({availableCities.length})</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* COD Orders Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-hidden">
            <table className="w-full text-left text-xs table-fixed">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-2.5 px-2.5 w-[14%]">COD Order & Invoice</th>
                  <th className="py-2.5 px-2.5 w-[15%]">Customer & City</th>
                  <th className="py-2.5 px-2 w-[9%]">Order Date & Due</th>
                  <th className="py-2.5 px-2.5 w-[17%]">Items Summary</th>
                  <th className="py-2.5 px-2.5 text-right font-bold w-[10%]">COD Amount</th>
                  <th className="py-2.5 px-1.5 text-center w-[11%]">Delivery Status</th>
                  <th className="py-2.5 px-1.5 text-center w-[12%]">COD Collection</th>
                  <th className="py-2.5 px-1.5 text-center w-[12%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCodOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
                          <HandCoins className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">No COD Orders Found</h4>
                        <p className="text-xs text-slate-500">
                          {allCodOrders.length === 0
                            ? 'No orders are currently set to COD. Select "COD" when creating a quotation or sales order, and it will automatically appear in this view.'
                            : 'No orders match your selected search/date/status filters.'}
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <Link
                            href="/sales/quotations"
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
                          >
                            Create COD Quotation
                          </Link>
                          <Link
                            href="/sales/orders"
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                          >
                            Create Sales Order
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCodOrders.map((so) => {
                    const cust = customers.find((c) => c.id === so.customerId);
                    const isPaid = so.paymentStatus === 'PAID' || (so.amountPaid >= so.grandTotal && so.grandTotal > 0);
                    const pendingCash = Math.max(0, (so.grandTotal || 0) - (so.amountPaid || 0));

                    return (
                      <tr key={so.id} className="hover:bg-slate-50/70 transition">
                        {/* Order & Invoice */}
                        <td className="py-2.5 px-2.5 align-middle overflow-hidden">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-blue-700 font-bold text-xs truncate" title={so.orderNumber}>
                              {so.orderNumber}
                            </span>
                            {so.isQuotationOnly && (
                              <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                Quote
                              </span>
                            )}
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                              <HandCoins className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                              <span>COD</span>
                            </span>
                          </div>
                          {so.invoiceNumber && (
                            <div className="text-[10px] font-mono text-slate-500 leading-none mt-0.5 truncate">
                              Inv: {so.invoiceNumber}
                            </div>
                          )}
                          {!so.isQuotationOnly && so.quotationNumber && (
                            <div className="text-[10px] font-mono text-purple-700 leading-none mt-0.5 flex items-center gap-1 overflow-hidden">
                              <span className="shrink-0 text-slate-400">QT:</span>
                              <Link
                                href={`/sales/quotations?search=${encodeURIComponent(so.quotationNumber)}`}
                                className="hover:underline truncate text-purple-700 font-medium"
                                title={so.quotationNumber}
                              >
                                {so.quotationNumber}
                              </Link>
                            </div>
                          )}
                        </td>

                        {/* Customer & City */}
                        <td className="py-2.5 px-2.5 align-middle overflow-hidden">
                          <div className="font-bold text-slate-900 truncate text-xs" title={so.customerName}>
                            {so.customerName}
                          </div>
                          <div
                            className="text-[10.5px] text-slate-500 truncate mt-0.5 leading-none"
                            title={`${cust?.contactPerson || 'Contact'} • ${cust?.mobile || 'No Mobile'}`}
                          >
                            {cust?.contactPerson || 'Contact'} • {cust?.mobile || 'No Mobile'}
                          </div>
                          {cust?.city && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-0.5 leading-none truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{cust.city}</span>
                            </div>
                          )}
                        </td>

                        {/* Order Date & Due */}
                        <td className="py-2.5 px-2 align-middle overflow-hidden whitespace-nowrap text-slate-600">
                          <div className="font-mono text-xs font-bold text-slate-900 leading-tight">{so.orderDate}</div>
                          <div className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">
                            Due: {so.dueDate || so.expectedDelivery || '-'}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5 leading-none" title={so.salesperson || 'Rajesh Kumar'}>
                            {so.salesperson || 'Rajesh Kumar'}
                          </div>
                        </td>

                        {/* Items Summary */}
                        <td className="py-2.5 px-2.5 align-middle overflow-hidden">
                          {(() => {
                            const summaryText = so.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ');
                            return (
                              <div className="w-full overflow-hidden">
                                <div className="font-medium text-slate-800 truncate text-xs leading-tight" title={summaryText}>
                                  {summaryText}
                                </div>
                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-none">
                                  {so.items.length} {so.items.length === 1 ? 'item' : 'items'}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* COD Amount */}
                        <td className="py-2.5 px-2.5 text-right align-middle overflow-hidden whitespace-nowrap">
                          <div className="font-black font-mono text-slate-900 text-xs">
                            ₹{so.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                          </div>
                          {isPaid ? (
                            <div className="text-[9.5px] font-bold text-emerald-700 mt-0.5 leading-none">
                              ✓ Paid in Full
                            </div>
                          ) : (
                            <div
                              className="text-[9.5px] font-bold text-amber-700 font-mono mt-0.5 leading-none"
                              title={`Pending: ₹${pendingCash.toLocaleString('en-IN')}`}
                            >
                              Due: ₹{pendingCash.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>

                        {/* Delivery Status */}
                        <td className="py-2.5 px-1.5 text-center align-middle overflow-hidden">
                          {so.isQuotationOnly ? (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-purple-50 text-purple-800 border-purple-200 whitespace-nowrap inline-block max-w-full truncate"
                              title={so.quotationStatus || so.orderStatus}
                            >
                              {so.quotationStatus || so.orderStatus}
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap inline-block max-w-full truncate ${
                                so.dispatchStatus === 'DELIVERED' || so.orderStatus === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : so.dispatchStatus === 'DISPATCHED' || so.orderStatus === 'Dispatched'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : so.orderStatus === 'Ready for Dispatch'
                                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                  : so.orderStatus === 'Packed'
                                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                                  : so.orderStatus === 'Sent to Production' || so.orderStatus === 'Sent to Product'
                                  ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                              title={
                                so.dispatchStatus === 'DELIVERED' || so.orderStatus === 'Delivered'
                                  ? 'Delivered'
                                  : so.dispatchStatus === 'DISPATCHED' || so.orderStatus === 'Dispatched'
                                  ? 'Dispatched'
                                  : so.orderStatus === 'Ready for Dispatch'
                                  ? 'Ready for Dispatch'
                                  : so.orderStatus || 'Confirmed'
                              }
                            >
                              {so.dispatchStatus === 'DELIVERED' || so.orderStatus === 'Delivered'
                                ? 'Delivered'
                                : so.dispatchStatus === 'DISPATCHED' || so.orderStatus === 'Dispatched'
                                ? 'Dispatched'
                                : so.orderStatus === 'Ready for Dispatch'
                                ? 'Ready for Dispatch'
                                : so.orderStatus || 'Confirmed'}
                            </span>
                          )}
                        </td>

                        {/* COD Collection Status */}
                        <td className="py-2.5 px-1.5 text-center align-middle overflow-hidden">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Collected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Awaiting Cash</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-1.5 text-center align-middle overflow-hidden">
                          <div className="flex items-center justify-center gap-1">
                            {so.isQuotationOnly && (so.quotationStatus === 'Customer Approved' || so.quotationStatus === 'Approved') && (
                              <button
                                onClick={() => {
                                  const res = createInvoiceFromQuotation(so.quotationId!);
                                  if (res.success) {
                                    showToast(`Invoice generated for approved COD Quotation ${so.quotationNumber}!`);
                                  } else {
                                    showToast(res.message || 'Failed to generate invoice.');
                                  }
                                }}
                                className="px-1.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] transition shadow-2xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                title="Generate Invoice from Approved COD Quotation"
                              >
                                <FileText className="w-3 h-3 shrink-0" />
                                <span>Invoice</span>
                              </button>
                            )}

                            {!isPaid && (
                              <button
                                onClick={() => handleOpenCollectModal(so)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition shadow-2xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                title="Record Cash received from customer/courier"
                              >
                                <HandCoins className="w-3 h-3 shrink-0" />
                                <span>Collect</span>
                              </button>
                            )}

                            {cust?.mobile && (
                              <a
                                href={`https://wa.me/91${cust.mobile.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(so.customerName)},%20confirming%20your%20COD%20${so.isQuotationOnly ? 'quotation' : 'order'}%20${so.orderNumber}%20of%20Rs.${so.grandTotal}.%20Kindly%20keep%20exact%20cash%20ready%20upon%20delivery.`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                                title="WhatsApp Customer (Confirm COD readiness)"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {so.isQuotationOnly ? (
                              <Link
                                href={`/sales/quotations?search=${encodeURIComponent(so.quotationNumber || '')}`}
                                className="p-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition"
                                title="View Quotation in Quotations module"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedOrder(so);
                                  setIsViewModalOpen(true);
                                }}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition cursor-pointer"
                                title="View Order Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RECORD CASH COLLECTION MODAL */}
        {/* ======================================================== */}
        {isCollectModalOpen && collectTargetOrder && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <HandCoins className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">
                      Record Cash Collection (COD)
                    </h3>
                    <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                      Order: <strong className="text-blue-700">{collectTargetOrder.orderNumber}</strong> • {collectTargetOrder.customerName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitCollection} className="p-4 space-y-3 text-xs">
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>Total COD Order Amount:</span>
                    <strong className="text-sm font-black text-slate-900 font-mono">
                      ₹{collectTargetOrder.grandTotal.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-xs text-amber-800 mt-1">
                    <span>Pending to Collect:</span>
                    <strong className="font-bold text-amber-900 font-mono">
                      ₹{Math.max(0, collectTargetOrder.grandTotal - (collectTargetOrder.amountPaid || 0)).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Cash Amount Received (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={collectTargetOrder.grandTotal}
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Collection Date *
                    </label>
                    <input
                      type="date"
                      value={collectDate}
                      onChange={(e) => setCollectDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Receipt / AWB Ref #
                    </label>
                    <input
                      type="text"
                      value={collectReference}
                      onChange={(e) => setCollectReference(e.target.value)}
                      placeholder="e.g. AWB-984210"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Collection Remarks / Courier Notes
                  </label>
                  <textarea
                    rows={2}
                    value={collectNotes}
                    onChange={(e) => setCollectNotes(e.target.value)}
                    placeholder="Cash handed over by courier agent / customer..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCollectModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Cash Collected</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW ORDER DETAILS MODAL */}
        {/* ======================================================== */}
        {isViewModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {selectedOrder.isQuotationOnly ? 'COD Quotation:' : 'COD Order:'}{' '}
                      <span className="font-mono text-blue-700">{selectedOrder.orderNumber}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Customer: {selectedOrder.customerName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Status Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Mode</span>
                    <div className="font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                      <HandCoins className="w-3.5 h-3.5 shrink-0" /> Cash On Delivery
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Status</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedOrder.paymentStatus}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Delivery Status</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedOrder.orderStatus}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Invoice Ref</span>
                    <div className="font-mono font-bold text-blue-700 mt-0.5">{selectedOrder.invoiceNumber || 'N/A'}</div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Order Line Items</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            SKU: {item.sku} • Qty: {item.quantity} {item.unit || 'PCS'} @ ₹{item.unitPrice || item.sellingPrice}
                          </div>
                        </div>
                        <div className="font-bold text-slate-900 text-right font-mono">
                          ₹{(item.totalPrice ?? (item.quantity * (item.unitPrice || item.sellingPrice || 0))).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financials */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST Tax:</span>
                    <span className="font-mono">₹{selectedOrder.taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                    <span>Grand Total (COD):</span>
                    <span className="text-blue-700 font-mono">₹{selectedOrder.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Amount Paid:</span>
                    <span className="font-mono">₹{(selectedOrder.amountPaid || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Pending COD Balance:</span>
                    <span className="font-mono">₹{Math.max(0, selectedOrder.grandTotal - (selectedOrder.amountPaid || 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Shipping Details */}
                {selectedOrder.shippingDetails && (
                  <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-200">
                    <span className="font-bold text-blue-900 block mb-0.5">Shipping & Transporter Instructions</span>
                    <p className="text-slate-700">{selectedOrder.shippingDetails}</p>
                  </div>
                )}
              </div>

              <div className="p-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
