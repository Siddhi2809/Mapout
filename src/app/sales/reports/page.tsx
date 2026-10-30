'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Truck,
  CreditCard,
  RotateCcw,
  Users,
  Boxes,
  FileText,
  TrendingUp,
} from 'lucide-react';

export default function SalesReportsPage() {
  const {
    salesOrders,
    invoices,
    customers,
    products,
    dispatches,
    customerPayments,
    salesReturns,
  } = useERP();

  const [activeReportTab, setActiveReportTab] = useState<
    | 'daily'
    | 'monthly'
    | 'product'
    | 'customer'
    | 'so'
    | 'invoice'
    | 'dispatch'
    | 'collection'
    | 'outstanding'
    | 'overdue'
    | 'returns'
    | 'summary'
  >('summary');

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');

  const reportsList = [
    { id: 'summary', name: 'Sales Executive Summary', icon: TrendingUp },
    { id: 'daily', name: 'Daily Sales Report', icon: Calendar },
    { id: 'monthly', name: 'Monthly Sales Report', icon: DollarSign },
    { id: 'product', name: 'Product-wise Sales', icon: Boxes },
    { id: 'customer', name: 'Customer-wise Sales', icon: Users },
    { id: 'so', name: 'Sales Order Report', icon: ShoppingCart },
    { id: 'invoice', name: 'Invoice Register', icon: FileText },
    { id: 'dispatch', name: 'Dispatch & Logistics Report', icon: Truck },
    { id: 'collection', name: 'Payment Collections', icon: CreditCard },
    { id: 'outstanding', name: 'Customer Outstanding Ledger', icon: DollarSign },
    { id: 'overdue', name: 'Overdue Payments Alert', icon: Calendar },
    { id: 'returns', name: 'Sales Returns & RMA', icon: RotateCcw },
  ];

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeReportTab === 'customer' || activeReportTab === 'outstanding') {
      headers = ['Customer ID', 'Company Name', 'Contact', 'Mobile', 'Total Orders', 'Total Sales (₹)', 'Total Paid (₹)', 'Outstanding (₹)'];
      rows = customers.map((c) => [
        c.customerCode || c.id,
        c.companyName,
        c.contactPerson,
        c.mobile,
        c.totalOrders || 0,
        c.totalSales || 0,
        c.totalPaid || 0,
        c.totalOutstanding || 0,
      ]);
    } else if (activeReportTab === 'product') {
      headers = ['SKU', 'Product Name', 'Category', 'Selling Price (₹)', 'Current FG Stock', 'Min Stock'];
      rows = products.map((p) => [p.sku, p.name, p.category, p.sellingPrice, p.currentStock, p.minStock]);
    } else if (activeReportTab === 'invoice') {
      headers = ['Invoice #', 'Date', 'Customer', 'SO #', 'Subtotal (₹)', 'GST (₹)', 'Grand Total (₹)', 'Paid (₹)', 'Outstanding (₹)', 'Status'];
      rows = invoices.map((i) => [
        i.invoiceNumber,
        i.invoiceDate,
        i.customerName,
        i.salesOrderNumber,
        i.subtotal,
        i.gstAmount,
        i.grandTotal,
        i.paidAmount,
        i.outstandingAmount,
        i.paymentStatus,
      ]);
    } else {
      headers = ['Order #', 'Customer', 'Date', 'Delivery Date', 'Amount (₹)', 'Payment Status', 'Dispatch Status', 'Order Status'];
      rows = salesOrders.map((s) => [
        s.orderNumber,
        s.customerName,
        s.orderDate,
        s.expectedDelivery || s.dueDate,
        s.grandTotal,
        s.paymentStatus,
        s.dispatchStatus,
        s.orderStatus,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_${activeReportTab.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout
      roleTitle="Sales Management"
      roleBadge="Sales Manager"
      navItems={SALES_NAV}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Analytics & Reports</h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Audit reports for B2B sales volume, product revenue, customer receivables ledger, dispatch history, and payment collection analysis.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
          >
            <Download className="w-4 h-4" /> Export Report (CSV)
          </button>
        </div>

        {/* 12 REPORTS NAVIGATION GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {reportsList.map((rep) => {
            const Icon = rep.icon;
            const isActive = activeReportTab === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => setActiveReportTab(rep.id as any)}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                  isActive
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold">{rep.name}</span>
              </button>
            );
          })}
        </div>

        {/* FILTER CONTROLS BAR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Report Records..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> From:
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600"
            />
            <div className="flex items-center gap-1.5 text-slate-600">To:</div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600"
            />

            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600"
            >
              <option value="ALL">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ACTIVE REPORT CONTENT DISPLAY */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {reportsList.find((r) => r.id === activeReportTab)?.name}
            </h3>
            <span className="text-xs text-slate-500 font-mono font-semibold">Live ERP Audit View</span>
          </div>

          {(activeReportTab === 'summary' || activeReportTab === 'daily' || activeReportTab === 'monthly' || activeReportTab === 'so') && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                    <th className="p-3">Sales Order #</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Order Date</th>
                    <th className="p-3">Expected Delivery</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right">GST Tax</th>
                    <th className="p-3 text-right font-bold">Grand Total</th>
                    <th className="p-3 text-center">Payment</th>
                    <th className="p-3 text-center">Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesOrders.map((so) => (
                    <tr key={so.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono text-blue-600 font-bold">{so.orderNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{so.customerName}</td>
                      <td className="p-3 text-slate-600 font-mono">{so.orderDate}</td>
                      <td className="p-3 text-slate-600 font-mono">{so.expectedDelivery || so.dueDate}</td>
                      <td className="p-3 text-right text-slate-700 font-mono">₹{so.subtotal.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-slate-600 font-mono">₹{(so.taxAmount || so.gstAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-700 font-mono text-sm">
                        ₹{so.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">{so.paymentStatus}</td>
                      <td className="p-3 text-center font-bold text-slate-700">{so.dispatchStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(activeReportTab === 'customer' || activeReportTab === 'outstanding' || activeReportTab === 'overdue') && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                    <th className="p-3">Customer ID</th>
                    <th className="p-3">Company Name</th>
                    <th className="p-3">Contact Person</th>
                    <th className="p-3">Mobile & Email</th>
                    <th className="p-3 text-right">Total Orders</th>
                    <th className="p-3 text-right">Total Sales</th>
                    <th className="p-3 text-right text-emerald-700">Total Paid</th>
                    <th className="p-3 text-right text-rose-700 font-bold">Outstanding Receivable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono text-blue-600 font-bold">{c.customerCode || c.id}</td>
                      <td className="p-3 font-bold text-slate-900">{c.companyName}</td>
                      <td className="p-3 text-slate-700 font-medium">{c.contactPerson}</td>
                      <td className="p-3 text-slate-600">{c.mobile} | {c.email}</td>
                      <td className="p-3 text-right font-semibold text-slate-900">{c.totalOrders || 0}</td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">₹{(c.totalSales || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-emerald-700 font-mono">₹{(c.totalPaid || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-extrabold text-rose-700 font-mono text-sm">
                        ₹{(c.totalOutstanding || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeReportTab === 'product' && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                    <th className="p-3">Product Code</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Selling Price</th>
                    <th className="p-3 text-right">Finished Goods Stock</th>
                    <th className="p-3 text-right">Safety Min Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono text-blue-600 font-bold">{p.productCode}</td>
                      <td className="p-3 font-mono text-slate-600">{p.sku}</td>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 text-slate-600 font-medium">{p.category}</td>
                      <td className="p-3 text-right font-bold text-emerald-700 font-mono">₹{p.sellingPrice.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">{p.currentStock} Units</td>
                      <td className="p-3 text-right text-slate-600 font-mono">{p.minStock} Units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeReportTab === 'invoice' && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">SO Ref</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right">GST (18%)</th>
                    <th className="p-3 text-right font-bold">Grand Total</th>
                    <th className="p-3 text-right font-bold text-rose-700">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono text-blue-600 font-bold">{inv.invoiceNumber}</td>
                      <td className="p-3 text-slate-600 font-mono">{inv.invoiceDate}</td>
                      <td className="p-3 font-bold text-slate-900">{inv.customerName}</td>
                      <td className="p-3 font-mono text-blue-600 font-bold">{inv.salesOrderNumber}</td>
                      <td className="p-3 text-right text-slate-700 font-mono">₹{inv.subtotal.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-slate-600 font-mono">₹{inv.gstAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-extrabold text-slate-900 font-mono text-sm">
                        ₹{inv.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-700 font-mono">₹{inv.outstandingAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeReportTab === 'dispatch' && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                    <th className="p-3">Dispatch #</th>
                    <th className="p-3">SO Ref</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right font-bold">Total Dispatched Qty</th>
                    <th className="p-3">Transporter</th>
                    <th className="p-3">Tracking / LR #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dispatches.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono text-blue-700 font-bold">{d.dispatchNumber}</td>
                      <td className="p-3 font-mono text-blue-600 font-bold">{d.salesOrderNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{d.customerName}</td>
                      <td className="p-3 text-slate-600 font-mono">{d.dispatchDate}</td>
                      <td className="p-3 text-right font-bold text-emerald-700 font-mono">{d.totalQuantity} Units</td>
                      <td className="p-3 text-slate-700 font-medium">{d.transporter}</td>
                      <td className="p-3 font-mono text-slate-600">{d.trackingNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeReportTab === 'collection' && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                    <th className="p-3">Payment #</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Invoice Ref</th>
                    <th className="p-3">Payment Date</th>
                    <th className="p-3 text-right font-bold">Amount (₹)</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Reference Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono text-emerald-700 font-bold">{p.paymentNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{p.customerName}</td>
                      <td className="p-3 font-mono text-blue-600 font-bold">{p.invoiceNumber}</td>
                      <td className="p-3 text-slate-600 font-mono">{p.paymentDate}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-700 font-mono text-sm">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{p.paymentMode}</td>
                      <td className="p-3 font-mono text-slate-600">{p.referenceNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeReportTab === 'returns' && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                    <th className="p-3">RMA #</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Invoice Ref</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-right font-bold">Returned Qty</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3 text-center">RMA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesReturns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono text-rose-700 font-bold">{r.returnNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{r.customerName}</td>
                      <td className="p-3 font-mono text-blue-600 font-bold">{r.invoiceNumber || 'N/A'}</td>
                      <td className="p-3 font-medium text-slate-800">{r.productName}</td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">{r.quantity}</td>
                      <td className="p-3 text-slate-700 font-medium">{r.returnReason}</td>
                      <td className="p-3 text-center font-bold text-amber-700">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
