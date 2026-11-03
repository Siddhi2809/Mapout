'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { SalesOrder, Customer, Quotation, Lead, ProductMaster, SalesInvoice, SalesDispatch, CustomerPayment } from '@/types/erp';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Truck,
  CreditCard,
  Wallet,
  Users,
  UserCheck,
  RotateCcw,
  ArrowRight,
  PlusCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Boxes,
  FileText,
  FileCheck,
} from 'lucide-react';

export default function SalesDashboard() {
  const {
    customers: contextCustomers,
    salesOrders: contextSalesOrders,
    leads: contextLeads,
    invoices: contextInvoices,
    dispatches: contextDispatches,
    customerPayments: contextCustomerPayments,
    products: contextProducts,
    quotations: contextQuotations,
  } = useERP();

  // Local state initialized from context and loaded once from database
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => contextSalesOrders || []);
  const [quotations, setQuotations] = useState<Quotation[]>(() => contextQuotations || []);
  const [invoices, setInvoices] = useState<SalesInvoice[]>(() => contextInvoices || []);
  const [customers, setCustomers] = useState<Customer[]>(() => contextCustomers || []);
  const [leads, setLeads] = useState<Lead[]>(() => contextLeads || []);
  const [dispatches, setDispatches] = useState<SalesDispatch[]>(() => contextDispatches || []);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>(() => contextCustomerPayments || []);
  const [products, setProducts] = useState<ProductMaster[]>(() => contextProducts || []);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Fetch real database records directly from Next.js App Router API endpoints
  const fetchRealSalesData = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    }
    try {
      const [
        resSales,
        resQuot,
        resInv,
        resCust,
        resLeads,
        resDisp,
        resPay,
        resProd,
      ] = await Promise.all([
        fetch('/api/sales-orders').then((r) => r.json()).catch(() => null),
        fetch('/api/quotations').then((r) => r.json()).catch(() => null),
        fetch('/api/invoices').then((r) => r.json()).catch(() => null),
        fetch('/api/customers').then((r) => r.json()).catch(() => null),
        fetch('/api/leads').then((r) => r.json()).catch(() => null),
        fetch('/api/dispatches').then((r) => r.json()).catch(() => null),
        fetch('/api/payments?type=customer').then((r) => r.json()).catch(() => null),
        fetch('/api/products').then((r) => r.json()).catch(() => null),
      ]);

      if (resSales?.success && Array.isArray(resSales.data)) setSalesOrders(resSales.data);
      if (resQuot?.success && Array.isArray(resQuot.data)) setQuotations(resQuot.data);
      if (resInv?.success && Array.isArray(resInv.data)) setInvoices(resInv.data);
      if (resCust?.success && Array.isArray(resCust.data)) setCustomers(resCust.data);
      if (resLeads?.success && Array.isArray(resLeads.data)) setLeads(resLeads.data);
      if (resDisp?.success && Array.isArray(resDisp.data)) setDispatches(resDisp.data);
      if (resPay?.success && resPay.data?.customerPayments) {
        setCustomerPayments(resPay.data.customerPayments);
      }
      if (resProd?.success && Array.isArray(resProd.data)) setProducts(resProd.data);

      setLastSynced(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('Failed to fetch real sales data from DB:', err);
    } finally {
      setIsLoading(false);
      if (isManual) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Fetch strictly once on initial mount (no continuous refresh or re-fetch loops)
  const hasLoadedRef = React.useRef(false);
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchRealSalesData(false);
    }
  }, [fetchRealSalesData]);

  // Robust date normalizer to handle YYYY-MM-DD, DD/MM/YYYY, or ISO timestamps
  const normalizeDate = (dStr?: string) => {
    if (!dStr) return '';
    const clean = dStr.trim().split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split('/');
      return `${y}-${m}-${d}`;
    }
    return clean;
  };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonthStr = todayStr.substring(0, 7);
  const currentMonthLabel = now.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

  // 1. Invoices issued today
  const todayInvoices = invoices.filter(
    (inv) => normalizeDate(inv.invoiceDate) === todayStr && inv.status !== 'Cancelled'
  );
  const todayInvoicedTotal = todayInvoices.reduce((acc, inv) => acc + (Number(inv.grandTotal) || 0), 0);

  // 2. Sales Orders placed today not already invoiced today (prevents double-counting)
  const todayUnbilledOrders = salesOrders.filter((s) => {
    if (normalizeDate(s.orderDate) !== todayStr) return false;
    if (s.orderStatus === 'Cancelled') return false;
    const hasInvoice = todayInvoices.some(
      (inv) =>
        (inv.salesOrderId && inv.salesOrderId === s.id) ||
        (inv.salesOrderNumber && s.orderNumber && inv.salesOrderNumber === s.orderNumber && inv.salesOrderNumber !== 'N/A')
    );
    return !hasInvoice;
  });
  const todayUnbilledTotal = todayUnbilledOrders.reduce(
    (acc, s) => acc + (Number(s.grandTotal) || Number(s.totalAmount) || 0),
    0
  );
  const todaySales = todayInvoicedTotal + todayUnbilledTotal;
  const todaySalesCount = todayInvoices.length + todayUnbilledOrders.length;

  // 3. Invoices issued this month
  const monthlyInvoices = invoices.filter(
    (inv) => normalizeDate(inv.invoiceDate).startsWith(currentMonthStr) && inv.status !== 'Cancelled'
  );
  const monthlyInvoicedTotal = monthlyInvoices.reduce((acc, inv) => acc + (Number(inv.grandTotal) || 0), 0);

  // 4. Sales Orders placed this month not already invoiced this month
  const monthlyUnbilledOrders = salesOrders.filter((s) => {
    if (!normalizeDate(s.orderDate).startsWith(currentMonthStr)) return false;
    if (s.orderStatus === 'Cancelled') return false;
    const hasInvoice = monthlyInvoices.some(
      (inv) =>
        (inv.salesOrderId && inv.salesOrderId === s.id) ||
        (inv.salesOrderNumber && s.orderNumber && inv.salesOrderNumber === s.orderNumber && inv.salesOrderNumber !== 'N/A')
    );
    return !hasInvoice;
  });
  const monthlyUnbilledTotal = monthlyUnbilledOrders.reduce(
    (acc, s) => acc + (Number(s.grandTotal) || Number(s.totalAmount) || 0),
    0
  );
  const monthlySales = monthlyInvoicedTotal + monthlyUnbilledTotal;
  const monthlySalesCount = monthlyInvoices.length + monthlyUnbilledOrders.length;

  const totalOrdersCount = salesOrders.length;

  const pendingOrders = useMemo(() => {
    return salesOrders.filter(
      (s) => s.orderStatus !== 'Delivered' && s.orderStatus !== 'Cancelled' && s.orderStatus !== 'Completed'
    );
  }, [salesOrders]);
  const pendingOrdersCount = pendingOrders.length;

  const confirmedQuotesCount = quotations.filter(
    (q) => q.status === 'Confirmed' || q.status === 'Customer Approved' || q.status === 'Approved'
  ).length;

  const pendingDispatchCount =
    dispatches.filter((d) => d.deliveryStatus === 'Pending' || d.deliveryStatus === 'Ready' || d.deliveryStatus === 'Dispatched').length ||
    salesOrders.filter((s) => s.orderStatus === 'Packed' || s.orderStatus === 'Ready for Dispatch' || s.dispatchStatus === 'Ready to Dispatch' || s.dispatchStatus === 'PACKED').length;

  const totalCustomersCount = customers.length;

  const newLeadsCount = leads.filter(
    (l) => l.status === 'New' || l.status === 'Interested' || l.status === 'Contacted' || l.status === 'Follow-up'
  ).length;

  // Real Customer Outstanding calculated accurately from real invoice balances
  const totalCustomerOutstanding = invoices
    .filter((i) => i.paymentStatus !== 'Paid')
    .reduce((acc, i) => acc + (i.outstandingAmount !== undefined ? i.outstandingAmount : (i.grandTotal - (i.paidAmount || 0))), 0);

  const todayCollection = customerPayments
    .filter((p) => normalizeDate(p.paymentDate) === todayStr && p.status !== 'Payment Rejected' && p.status !== 'Cancelled')
    .reduce((acc, p) => acc + (p.amount || p.paidAmount || 0), 0);

  // Overdue & Pending Customer Invoices
  const overdueInvoices = invoices.filter(
    (i) => i.paymentStatus !== 'Paid' && ((i.outstandingAmount && i.outstandingAmount > 0) || i.paymentStatus === 'Overdue' || i.paymentStatus === 'Payment Pending')
  );

  const summaryCards = [
    {
      label: "Today's Sales",
      value: `₹${todaySales.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
      sub: todaySalesCount > 0 ? `${todaySalesCount} transaction${todaySalesCount === 1 ? '' : 's'} today` : '0 transactions today',
      icon: TrendingUp,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      href: '/sales/invoices',
    },
    {
      label: 'Monthly Sales',
      value: `₹${monthlySales.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
      sub: `${monthlySalesCount} transaction${monthlySalesCount === 1 ? '' : 's'} in ${currentMonthLabel}`,
      icon: DollarSign,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      href: '/sales/invoices',
    },
    {
      label: 'Confirmed Quotes',
      value: `${confirmedQuotesCount} Ready`,
      sub: 'Approved quotations',
      icon: FileCheck,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      href: '/sales/quotations',
    },
    {
      label: 'Total Orders',
      value: `${totalOrdersCount} Orders`,
      sub: 'All-time sales orders',
      icon: ShoppingCart,
      color: 'text-slate-800 bg-slate-100 border-slate-300',
      href: '/sales/orders',
    },
    {
      label: 'Pending Orders',
      value: `${pendingOrdersCount} Orders`,
      sub: 'Awaiting fulfillment',
      icon: Clock,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      href: '/sales/orders',
    },
    {
      label: 'Pending Dispatch',
      value: `${pendingDispatchCount} Shipments`,
      sub: 'Ready in production queue',
      icon: Truck,
      color: 'text-amber-800 bg-amber-50 border-amber-200',
      href: '/sales/dispatch',
    },
    {
      label: 'Total Customers',
      value: `${totalCustomersCount} Clients`,
      sub: 'Active CRM directory',
      icon: Users,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      href: '/sales/customers',
    },
    {
      label: 'New Leads',
      value: `${newLeadsCount} Leads`,
      sub: 'Inquiries to follow up',
      icon: UserCheck,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      href: '/sales/leads',
    },
    {
      label: 'Customer Outstanding',
      value: `₹${totalCustomerOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
      sub: `${overdueInvoices.length} invoices pending`,
      icon: CreditCard,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      href: '/sales/invoices',
    },
    {
      label: "Today's Collection",
      value: `₹${todayCollection.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
      sub: 'Receipts deposited today',
      icon: Wallet,
      color: 'text-emerald-800 bg-emerald-100 border-emerald-300',
      href: '/sales/payments',
    },
  ];

  // Top Sold Products calculated dynamically from line items of real sales orders and standalone invoices
  const productSalesMap: Record<string, { product: any; qty: number; amount: number }> = {};
  salesOrders.forEach((so) => {
    (so.items || []).forEach((item) => {
      const pKey = item.productId || item.sku || item.productName;
      if (!pKey) return;
      if (!productSalesMap[pKey]) {
        const pObj = products.find((p) => p.id === item.productId || p.sku === item.sku);
        productSalesMap[pKey] = {
          product: pObj || { name: item.productName, sku: item.sku || 'SKU' },
          qty: 0,
          amount: 0,
        };
      }
      productSalesMap[pKey].qty += Number(item.quantity || 1);
      productSalesMap[pKey].amount += Number(item.totalPrice || item.sellingPrice || 0);
    });
  });

  invoices.forEach((inv) => {
    if (inv.salesOrderId && inv.salesOrderId !== 'N/A') return; // already accounted for if linked to sales order
    (inv.items || []).forEach((item) => {
      const pKey = item.productId || item.sku || item.productName;
      if (!pKey) return;
      if (!productSalesMap[pKey]) {
        const pObj = products.find((p) => p.id === item.productId || p.sku === item.sku);
        productSalesMap[pKey] = {
          product: pObj || { name: item.productName, sku: item.sku || 'SKU' },
          qty: 0,
          amount: 0,
        };
      }
      productSalesMap[pKey].qty += Number(item.quantity || 1);
      productSalesMap[pKey].amount += Number(item.total || (item.rate ? item.rate * (item.quantity || 1) : 0));
    });
  });

  const topProductsList = Object.values(productSalesMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Top Customer Accounts dynamically computed from real orders & real invoices
  const customerMetrics = useMemo(() => {
    return customers
      .map((c) => {
        const cName = (c.companyName || c.name || '').toLowerCase().trim();
        const cOrders = salesOrders.filter(
          (so) => so.customerId === c.id || (so.customerName || '').toLowerCase().trim() === cName
        );
        const cInvoices = invoices.filter(
          (inv) => inv.customerId === c.id || (inv.customerName || '').toLowerCase().trim() === cName
        );
        const totalOrders = cOrders.length;
        const invoicedTotal = cInvoices
          .filter((inv) => inv.status !== 'Cancelled')
          .reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
        const unbilledOrderTotal = cOrders
          .filter((so) => so.orderStatus !== 'Cancelled' && !cInvoices.some((inv) => inv.salesOrderId === so.id || (inv.salesOrderNumber && inv.salesOrderNumber === so.orderNumber && inv.salesOrderNumber !== 'N/A')))
          .reduce((sum, so) => sum + Number(so.grandTotal || so.totalAmount || 0), 0);
        const totalRevenue = invoicedTotal + unbilledOrderTotal;
        const totalOutstanding = cInvoices.reduce(
          (sum, inv) =>
            sum +
            Number(
              inv.outstandingAmount !== undefined
                ? inv.outstandingAmount
                : inv.paymentStatus === 'Paid'
                ? 0
                : inv.grandTotal || 0
            ),
          0
        );

        return {
          ...c,
          totalOrders,
          totalRevenue,
          totalOutstanding,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [customers, salesOrders, invoices]);

  const getStatusBadge = (status?: string) => {
    if (!status) return 'bg-slate-100 text-slate-800 border-slate-300';
    switch (status.toUpperCase()) {
      case 'DELIVERED':
      case 'COMPLETED':
      case 'PAID':
      case 'ACTIVE':
      case 'CONVERTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'DISPATCHED':
      case 'READY TO DISPATCH':
      case 'CONFIRMED':
      case 'INTERESTED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PENDING':
      case 'UNPAID':
      case 'PARTIALLY PAID':
      case 'PARTIAL':
      case 'DRAFT':
      case 'NEW':
      case 'CONTACTED':
      case 'FOLLOW-UP':
      case 'SENT TO PRODUCTION':
      case 'PACKED':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'OVERDUE':
      case 'CANCELLED':
      case 'LOST':
      case 'INACTIVE':
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <DashboardLayout roleTitle="Sales Management" roleBadge="Sales Manager" navItems={SALES_NAV}>
      <div className="space-y-5">
        {/* Dashboard Status & Quick Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Sales Overview & Operational Pipeline</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
                Live DB
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live sales figures from Invoices and Sales Orders • Synced at {lastSynced || 'just now'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fetchRealSalesData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition shadow-xs disabled:opacity-60 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <Link
              href="/sales/quotations"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Quote</span>
            </Link>
          </div>
        </div>

        {/* 10 Operational Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link key={idx} href={card.href} className="group">
                <div className="p-4 h-full flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-300 transition duration-150">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider truncate">
                        {card.label}
                      </span>
                      <div className={`p-2 rounded-xl border shrink-0 ${card.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-lg font-black text-slate-900 tracking-tight font-mono">{card.value}</div>
                  </div>
                  {card.sub && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium truncate">
                      {card.sub}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Dynamic Operational Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* PENDING SALES ORDERS */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span>Pending Sales Orders ({pendingOrders.length})</span>
              </h3>
              <Link href="/sales/orders" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View All Orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <thead>
                  <tr className="text-slate-700 font-bold border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-[22%]">Order #</th>
                    <th className="py-2.5 px-3 w-[30%]">Customer</th>
                    <th className="py-2.5 px-2 w-[20%]">Date</th>
                    <th className="py-2.5 px-3 text-right w-[28%]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingOrders.slice(0, 5).map((so) => (
                    <tr key={so.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono text-blue-600 font-bold truncate">
                        <Link href="/sales/orders" className="hover:underline">
                          {so.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 truncate" title={so.customerName}>
                        {so.customerName}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {normalizeDate(so.orderDate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{(so.grandTotal || so.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                      </td>
                    </tr>
                  ))}
                  {pendingOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                        All sales orders are currently delivered and fulfilled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PENDING DISPATCH & SHIPMENTS */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>Pending Dispatches & Production Queue</span>
              </h3>
              <Link href="/sales/dispatch" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View Dispatches <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <thead>
                  <tr className="text-slate-700 font-bold border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-[25%]">Order / Ref</th>
                    <th className="py-2.5 px-3 w-[35%]">Customer</th>
                    <th className="py-2.5 px-2 text-center w-[20%]">Status</th>
                    <th className="py-2.5 px-3 text-right w-[20%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dispatches.length > 0 ? (
                    dispatches.slice(0, 5).map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono text-blue-600 font-bold truncate">
                          {d.dispatchNumber || d.salesOrderNumber}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 truncate" title={d.customerName}>
                          {d.customerName}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusBadge(d.deliveryStatus)}`}>
                            {d.deliveryStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link href="/sales/dispatch" className="text-blue-600 font-bold hover:underline text-[11px]">
                            Track
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : salesOrders.filter((so) => so.orderStatus === 'Packed' || so.orderStatus === 'Ready for Dispatch' || so.orderStatus === 'Sent to Production').length > 0 ? (
                    salesOrders
                      .filter((so) => so.orderStatus === 'Packed' || so.orderStatus === 'Ready for Dispatch' || so.orderStatus === 'Sent to Production')
                      .slice(0, 5)
                      .map((so) => (
                        <tr key={so.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-mono text-blue-600 font-bold truncate">
                            {so.orderNumber}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 truncate" title={so.customerName}>
                            {so.customerName}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusBadge(so.orderStatus)}`}>
                              {so.orderStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link href="/sales/dispatch" className="text-blue-600 font-bold hover:underline text-[11px]">
                              Dispatch
                            </Link>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                        No pending dispatches scheduled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* OVERDUE / PENDING PAYMENT ALERTS */}
          <div className="p-5 space-y-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Customer Payment Pending & Overdue ({overdueInvoices.length})</span>
              </h3>
              <Link href="/sales/invoices" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View Invoices <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {overdueInvoices.length > 0 ? (
              <div className="space-y-2.5">
                {overdueInvoices.slice(0, 4).map((inv) => {
                  const pendingBal = inv.outstandingAmount !== undefined ? inv.outstandingAmount : (inv.grandTotal - (inv.paidAmount || 0));
                  return (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{inv.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Inv: <strong className="text-blue-700">{inv.invoiceNumber}</strong> • Date: {normalizeDate(inv.invoiceDate)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-rose-700 font-mono">
                          ₹{pendingBal.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                        </div>
                        <Link
                          href="/sales/invoices"
                          className="text-[10px] text-blue-600 hover:underline font-bold mt-0.5 inline-block"
                        >
                          Upload Proof →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                All customer accounts are currently paid in full. No pending or overdue invoices.
              </div>
            )}
          </div>

          {/* TOP SELLING PRODUCTS */}
          <div className="p-5 space-y-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-600" />
                <span>Top Selling Product Models</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono font-medium">By Revenue</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <thead>
                  <tr className="text-slate-700 font-bold border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-[25%]">SKU</th>
                    <th className="py-2.5 px-3 w-[35%]">Product Name</th>
                    <th className="py-2.5 px-2 text-right w-[15%]">Qty</th>
                    <th className="py-2.5 px-3 text-right w-[25%]">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProductsList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-600 truncate">{item.product.sku}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 truncate" title={item.product.name}>
                        {item.product.name}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800">{item.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700">
                        ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                      </td>
                    </tr>
                  ))}
                  {topProductsList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                        No product sales recorded in current orders.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOP CUSTOMER ACCOUNTS (CALCULATED FROM REAL ORDERS & INVOICES) */}
          <div className="p-5 space-y-4 lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Top Customer Accounts & Revenue Pipeline</h3>
                <span className="text-[10px] text-slate-400 font-normal">({customers.length} Accounts in Database)</span>
              </div>
              <Link href="/sales/customers" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View All CRM Accounts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <thead>
                  <tr className="text-slate-700 font-bold border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-[15%]">Customer Code</th>
                    <th className="py-2.5 px-3 w-[25%]">Company / Client</th>
                    <th className="py-2.5 px-3 w-[15%]">City</th>
                    <th className="py-2.5 px-2 text-right w-[10%]">Orders</th>
                    <th className="py-2.5 px-3 text-right w-[18%]">Total Revenue</th>
                    <th className="py-2.5 px-3 text-right w-[17%]">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerMetrics.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono text-blue-600 font-bold truncate">
                        {c.customerCode || c.id}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 truncate" title={c.companyName || c.name}>
                        {c.companyName || c.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate">{c.city || '—'}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800">{c.totalOrders}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        ₹{c.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                        ₹{c.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                      </td>
                    </tr>
                  ))}
                  {customerMetrics.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No customer accounts found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
