'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
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
    customers,
    salesOrders,
    leads,
    followUps,
    invoices,
    dispatches,
    customerPayments,
    salesReturns,
    products,
    quotations,
  } = useERP();

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculated Operational Metrics
  const todaySales = salesOrders
    .filter((s) => s.orderDate === todayStr && s.orderStatus !== 'Cancelled')
    .reduce((acc, s) => acc + s.grandTotal, 0);

  const currentMonthStr = todayStr.substring(0, 7);
  const monthlySales = salesOrders
    .filter((s) => s.orderDate.startsWith(currentMonthStr) && s.orderStatus !== 'Cancelled')
    .reduce((acc, s) => acc + s.grandTotal, 0);

  const totalOrdersCount = salesOrders.length;

  const pendingOrdersCount = salesOrders.filter(
    (s) => s.dispatchStatus === 'PENDING' || s.dispatchStatus === 'Pending' || s.orderStatus === 'Confirmed' || s.orderStatus === 'Processing'
  ).length;

  const pendingDispatchCount = dispatches.filter(
    (d) => d.deliveryStatus === 'Pending' || d.deliveryStatus === 'Ready' || d.deliveryStatus === 'Dispatched'
  ).length;

  const totalCustomersCount = customers.length;
  const newLeadsCount = leads.filter((l) => l.status === 'New' || l.status === 'Interested' || l.status === 'Contacted').length;

  const totalCustomerOutstanding = customers.reduce((acc, c) => acc + (c.totalOutstanding || 0), 0);

  const todayCollection = customerPayments
    .filter((p) => p.paymentDate === todayStr && (p.status === 'Completed' || p.status === 'Paid' || p.status === 'Payment Completed'))
    .reduce((acc, p) => acc + p.amount, 0);

  const confirmedQuotesCount = quotations.filter((q) => q.status === 'Confirmed').length;

  const summaryCards = [
    { label: "Today's Sales", value: `₹${todaySales.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', href: '/sales/orders' },
    { label: 'Monthly Sales', value: `₹${monthlySales.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-blue-700 bg-blue-50 border-blue-200', href: '/sales/orders' },
    { label: 'Confirmed Quotes', value: `${confirmedQuotesCount} Ready to Produce`, icon: FileCheck, color: 'text-blue-700 bg-blue-50 border-blue-200', href: '/sales/quotations' },
    { label: 'Total Orders', value: `${totalOrdersCount} Orders`, icon: ShoppingCart, color: 'text-slate-800 bg-slate-100 border-slate-300', href: '/sales/orders' },
    { label: 'Pending Orders', value: `${pendingOrdersCount} Orders`, icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200', href: '/sales/orders' },
    { label: 'Pending Dispatch', value: `${pendingDispatchCount} Shipments`, icon: Truck, color: 'text-amber-800 bg-amber-50 border-amber-200', href: '/sales/dispatch' },
    { label: 'Total Customers', value: `${totalCustomersCount} Clients`, icon: Users, color: 'text-blue-700 bg-blue-50 border-blue-200', href: '/sales/customers' },
    { label: 'New Leads', value: `${newLeadsCount} Leads`, icon: UserCheck, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', href: '/sales/leads' },
    { label: 'Customer Outstanding', value: `₹${totalCustomerOutstanding.toLocaleString('en-IN')}`, icon: CreditCard, color: 'text-rose-700 bg-rose-50 border-rose-200', href: '/sales/payments' },
    { label: "Today's Collection", value: `₹${todayCollection.toLocaleString('en-IN')}`, icon: Wallet, color: 'text-emerald-800 bg-emerald-100 border-emerald-300', href: '/sales/payments' },
  ];

  // Overdue Customer Payments
  const overdueInvoices = invoices.filter((i) => i.paymentStatus === 'Overdue' || (i.outstandingAmount > 0 && i.paymentStatus !== 'Paid'));

  // Top Sold Products
  const productSalesMap: Record<string, { product: any; qty: number; amount: number }> = {};
  salesOrders.forEach((so) => {
    (so.items || []).forEach((item) => {
      const pKey = item.productId || item.sku;
      if (!productSalesMap[pKey]) {
        const pObj = products.find((p) => p.id === item.productId || p.sku === item.sku);
        productSalesMap[pKey] = {
          product: pObj || { name: item.productName, sku: item.sku },
          qty: 0,
          amount: 0,
        };
      }
      productSalesMap[pKey].qty += item.quantity;
      productSalesMap[pKey].amount += item.totalPrice;
    });
  });
  const topProductsList = Object.values(productSalesMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
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
    <DashboardLayout
      roleTitle="Sales Management"
      roleBadge="Sales Manager"
      navItems={SALES_NAV}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Operational Dashboard</h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time pipeline monitoring, customer accounts, B2B sales orders, invoices, dispatches, and collections.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sales/quotations"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-slate-900/20"
            >
              <FileCheck className="w-4 h-4" /> Quotations
            </Link>
            <Link
              href="/sales/orders"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-blue-500/20"
            >
              <PlusCircle className="w-4 h-4" /> Create Sales Order
            </Link>
            <Link
              href="/sales/leads"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition shadow-sm"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" /> New CRM Lead
            </Link>
          </div>
        </div>

        {/* 9 Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link key={idx} href={card.href} className="group">
                <div className="erp-card p-5 h-full flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition duration-150">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs text-slate-600 font-semibold tracking-wide truncate">{card.label}</span>
                    <div className={`p-2.5 rounded-xl border shrink-0 ${card.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-slate-900 tracking-tight">{card.value}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Dynamic Operational Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* PENDING SALES ORDERS */}
          <div className="erp-card p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-600" /> Pending Sales Orders
              </h3>
              <Link href="/sales/orders" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View All Orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-700 font-bold border-b border-slate-200 bg-slate-50">
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesOrders.slice(0, 4).map((so) => (
                    <tr key={so.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono text-blue-600 font-bold">{so.orderNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[150px]">{so.customerName}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{so.orderDate}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{so.grandTotal.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(so.orderStatus)}`}>
                          {so.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {salesOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                        No sales orders created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PENDING DISPATCHES */}
          <div className="erp-card p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" /> Pending Dispatch & Deliveries
              </h3>
              <Link href="/sales/dispatch" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View Dispatches <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-700 font-bold border-b border-slate-200 bg-slate-50">
                    <th className="p-2">Dispatch #</th>
                    <th className="p-2">Order Ref</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dispatches.slice(0, 4).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono text-blue-600 font-bold">{d.dispatchNumber}</td>
                      <td className="p-2 font-mono text-slate-600">{d.salesOrderNumber}</td>
                      <td className="p-2 font-semibold text-slate-900 truncate max-w-[140px]">{d.customerName}</td>
                      <td className="p-2 text-right font-bold text-slate-900">{d.totalQuantity}</td>
                      <td className="p-2 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(d.deliveryStatus)}`}>
                          {d.deliveryStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {dispatches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                        No shipments scheduled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* OVERDUE PAYMENT ALERTS */}
          <div className="erp-card p-6 space-y-4 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Customer Payment Overdue Alerts
              </h3>
              <span className="text-[10px] text-rose-700 font-mono bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 font-bold">
                {overdueInvoices.length} Overdue
              </span>
            </div>

            {overdueInvoices.length > 0 ? (
              <div className="space-y-2.5">
                {overdueInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl bg-slate-50 border border-rose-200 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{inv.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Invoice: {inv.invoiceNumber} | Date: {inv.invoiceDate}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-rose-700">₹{inv.outstandingAmount.toLocaleString('en-IN')} Outstanding</div>
                      <Link
                        href={`/sales/payments?invoiceId=${inv.id}`}
                        className="text-[10px] text-emerald-700 hover:underline font-bold"
                      >
                        + Log Payment
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                All customer accounts are currently up to date. No overdue payments detected.
              </div>
            )}
          </div>

          {/* TOP SELLING PRODUCTS */}
          <div className="erp-card p-6 space-y-4 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-600" /> Top Selling Product Models
              </h3>
              <span className="text-[10px] text-slate-500 font-mono font-medium">By Sales Volume</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-700 font-bold border-b border-slate-200 bg-slate-50">
                    <th className="p-2">SKU</th>
                    <th className="p-2">Product Name</th>
                    <th className="p-2 text-right">Sold Qty</th>
                    <th className="p-2 text-right">Sales Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProductsList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-mono text-slate-600">{item.product.sku}</td>
                      <td className="p-2 font-semibold text-slate-900 truncate max-w-[160px]">{item.product.name}</td>
                      <td className="p-2 text-right font-bold text-slate-900">{item.qty} Units</td>
                      <td className="p-2 text-right font-bold text-emerald-700">₹{item.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {topProductsList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500 text-xs">
                        No product sales recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOP CUSTOMERS */}
          <div className="erp-card p-6 space-y-4 lg:col-span-2 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Top Customer Accounts
              </h3>
              <Link href="/sales/customers" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View All CRM Accounts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-700 font-bold border-b border-slate-200 bg-slate-50">
                    <th className="p-2">Customer ID</th>
                    <th className="p-2">Company Name</th>
                    <th className="p-2">Category</th>
                    <th className="p-2 text-right">Orders</th>
                    <th className="p-2 text-right">Total Revenue</th>
                    <th className="p-2 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono text-blue-600 font-bold">{c.customerCode || c.id}</td>
                      <td className="p-2 font-bold text-slate-900 truncate max-w-[180px]">{c.companyName}</td>
                      <td className="p-2 text-slate-600">{c.category || c.customerType}</td>
                      <td className="p-2 text-right font-semibold text-slate-800">{c.totalOrders || 0}</td>
                      <td className="p-2 text-right font-bold text-emerald-700">₹{(c.totalSales || 0).toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-bold text-rose-700">₹{(c.totalOutstanding || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
