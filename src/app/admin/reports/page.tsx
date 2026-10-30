'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  FileText,
  Users,
  Boxes,
  CreditCard,
  FileCheck,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export default function AdminReportsPage({
  initialCategory = 'sales',
}: {
  initialCategory?: 'sales' | 'customers' | 'products' | 'inventory' | 'payments' | 'warranty' | 'state-wise';
}) {
  const {
    salesOrders,
    customers,
    products,
    rawMaterials,
    customerPayments,
    supplierPayments,
    productReturns,
  } = useERP();

  const [activeCategory, setActiveCategory] = useState<
    'sales' | 'customers' | 'products' | 'inventory' | 'payments' | 'warranty' | 'state-wise'
  >(initialCategory);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Sales Summary
  const salesMetrics = useMemo(() => {
    const totalSales = salesOrders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);
    const todaySales = salesOrders
      .filter((o) => o.orderDate === todayStr)
      .reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);
    const monthSales = salesOrders
      .filter((o) => o.orderDate && o.orderDate.startsWith(currentMonthStr))
      .reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);

    return { totalSales, todaySales, monthSales, totalOrders: salesOrders.length };
  }, [salesOrders, todayStr, currentMonthStr]);

  // Export functions
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = (filename: string, rows: any[]) => {
    if (!rows || !rows.length) {
      alert('No data to export.');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((row) =>
          headers
            .map((h) => {
              const val = row[h] !== undefined ? String(row[h]).replace(/"/g, '""') : '';
              return `"${val}"`;
            })
            .join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Intelligence & Reports</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Live Database Exports
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export real-time statements for sales, customers, production, warehouse inventory, and GST compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeCategory === 'sales') {
                handleExportCSV(
                  'sales_report',
                  salesOrders.map((o) => ({
                    OrderNumber: o.orderNumber,
                    Date: o.orderDate,
                    Customer: o.customerName,
                    GrandTotal: o.grandTotal || o.totalAmount,
                    PaymentStatus: o.paymentStatus,
                    DispatchStatus: o.dispatchStatus,
                  }))
                );
              } else if (activeCategory === 'customers') {
                handleExportCSV(
                  'customer_report',
                  customers.map((c) => ({
                    CustomerCode: c.customerCode,
                    Name: c.name,
                    Company: c.companyName,
                    City: c.city,
                    State: c.state,
                    Outstanding: c.totalOutstanding,
                  }))
                );
              } else {
                handleExportCSV(
                  'inventory_report',
                  products.map((p) => ({
                    Code: p.productCode,
                    SKU: p.sku,
                    Name: p.name,
                    Stock: p.currentStock,
                    Price: p.sellingPrice,
                  }))
                );
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" /> Export CSV / Excel
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveCategory('sales')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'sales'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Sales Reports
        </button>

        <button
          onClick={() => setActiveCategory('customers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'customers'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Customer Reports
        </button>

        <button
          onClick={() => setActiveCategory('products')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'products'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Product Reports
        </button>

        <button
          onClick={() => setActiveCategory('inventory')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'inventory'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Inventory Reports
        </button>

        <button
          onClick={() => setActiveCategory('payments')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'payments'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Payment Reports
        </button>

        <button
          onClick={() => setActiveCategory('warranty')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'warranty'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Warranty Reports
        </button>

        <button
          onClick={() => setActiveCategory('state-wise')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'state-wise'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          State-wise Reports
        </button>
      </div>

      {/* 1. SALES REPORTS VIEW */}
      {activeCategory === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Lifetime Realized Sales</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ₹{salesMetrics.totalSales.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{salesMetrics.totalOrders} total orders processed</div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 shadow-2xs">
              <div className="text-[11px] font-bold text-blue-600 uppercase">Current Month Sales</div>
              <div className="text-2xl font-black text-blue-800 mt-1">
                ₹{salesMetrics.monthSales.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-blue-600 mt-0.5">Month of {currentMonthStr}</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 shadow-2xs">
              <div className="text-[11px] font-bold text-emerald-600 uppercase">Today&apos;s Booked Sales</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                ₹{salesMetrics.todaySales.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Booking date {todayStr}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Detailed Sales Transactions Statement</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Order #</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Customer Name</th>
                    <th className="px-4 py-3.5">Sales Channel</th>
                    <th className="px-4 py-3.5 text-right font-black">Grand Total</th>
                    <th className="px-4 py-3.5 text-center">Payment Status</th>
                    <th className="px-5 py-3.5 text-center">Dispatch Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesOrders.slice(0, 20).map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="px-4 py-4 text-slate-600">{o.orderDate}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{o.customerName}</td>
                      <td className="px-4 py-4 text-slate-600">{o.salesChannel || 'Website'}</td>
                      <td className="px-4 py-4 text-right font-black text-slate-900">
                        ₹{(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                          {o.dispatchStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. CUSTOMER REPORTS VIEW */}
      {activeCategory === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Customer Ledger & Credit Exposure Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Customer & Code</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">State & City</th>
                  <th className="px-4 py-3.5 text-right">Credit Limit</th>
                  <th className="px-4 py-3.5 text-right font-black">Outstanding Balance</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {c.name}
                      <div className="text-[11px] text-slate-400 font-mono font-normal">{c.customerCode || c.id}</div>
                    </td>
                    <td className="px-4 py-4">{c.category}</td>
                    <td className="px-4 py-4 text-slate-600">{c.city}, {c.state}</td>
                    <td className="px-4 py-4 text-right">₹{(c.creditLimit || 100000).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4 text-right font-black text-rose-600">
                      ₹{(c.totalOutstanding || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PRODUCT REPORTS VIEW */}
      {activeCategory === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Product Master Valuation & Pricing Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Product Code & SKU</th>
                  <th className="px-4 py-3.5">Product Name</th>
                  <th className="px-4 py-3.5 text-right">Selling Price</th>
                  <th className="px-4 py-3.5 text-right">Mfg Cost</th>
                  <th className="px-4 py-3.5 text-center">Stock On-Hand</th>
                  <th className="px-5 py-3.5 text-right font-black">Stock Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{p.productCode}</td>
                    <td className="px-4 py-4 font-bold text-slate-800">{p.name}</td>
                    <td className="px-4 py-4 text-right font-semibold">₹{p.sellingPrice.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4 text-right text-slate-500">₹{(p.purchaseCost || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4 text-center font-bold text-slate-900">{p.currentStock} units</td>
                    <td className="px-5 py-4 text-right font-black text-blue-700">
                      ₹{(p.currentStock * p.sellingPrice).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. INVENTORY REPORTS VIEW */}
      {activeCategory === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Raw Material Stock Valuation Statement</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">SKU & Item</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-center">Current Stock</th>
                  <th className="px-4 py-3.5 text-right">Unit Cost</th>
                  <th className="px-5 py-3.5 text-right font-black">Total Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rawMaterials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {m.name}
                      <div className="text-[11px] text-slate-400 font-mono font-normal">{m.sku}</div>
                    </td>
                    <td className="px-4 py-4">{m.category}</td>
                    <td className="px-4 py-4 text-center font-bold">{m.currentStock} {m.unit}</td>
                    <td className="px-4 py-4 text-right">₹{m.unitCost}</td>
                    <td className="px-5 py-4 text-right font-black text-emerald-700">
                      ₹{(m.currentStock * m.unitCost).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. PAYMENT REPORTS VIEW */}
      {activeCategory === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Collections Ledger Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Receipt #</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Party</th>
                  <th className="px-4 py-3.5">Mode</th>
                  <th className="px-4 py-3.5">UTR Reference</th>
                  <th className="px-5 py-3.5 text-right font-black">Amount Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                    <td className="px-4 py-4 text-slate-600">{p.paymentDate}</td>
                    <td className="px-4 py-4 font-bold text-slate-900">{p.customerName}</td>
                    <td className="px-4 py-4">{p.paymentMode}</td>
                    <td className="px-4 py-4 font-mono text-slate-600">{p.referenceNumber}</td>
                    <td className="px-5 py-4 text-right font-black text-emerald-700">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. WARRANTY REPORTS VIEW */}
      {activeCategory === 'warranty' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Warranty & Returns Claims Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Claim #</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Product Claimed</th>
                  <th className="px-4 py-3.5 text-center">Claim Units</th>
                  <th className="px-4 py-3.5">Reason</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{r.returnNumber}</td>
                    <td className="px-4 py-4 font-bold text-slate-900">{r.customerName}</td>
                    <td className="px-4 py-4 font-semibold text-slate-800">{r.productName}</td>
                    <td className="px-4 py-4 text-center font-black text-slate-900">{r.quantity}</td>
                    <td className="px-4 py-4 text-slate-600">{r.returnReason}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. STATE-WISE REPORTS VIEW */}
      {activeCategory === 'state-wise' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Geographical State-wise Distribution Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Indian State</th>
                  <th className="px-4 py-3.5 text-center">Customer Base</th>
                  <th className="px-4 py-3.5 text-center">Orders Realized</th>
                  <th className="px-5 py-3.5 text-right font-black">Gross Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from(
                  customers.reduce((acc, c) => {
                    const st = c.state || 'Maharashtra';
                    const existing = acc.get(st) || { state: st, custCount: 0, orderCount: 0, revenue: 0 };
                    existing.custCount += 1;
                    const custOrders = salesOrders.filter((o) => o.customerId === c.id || o.customerName === c.name);
                    existing.orderCount += custOrders.length;
                    existing.revenue += custOrders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);
                    acc.set(st, existing);
                    return acc;
                  }, new Map<string, any>()).values()
                ).map((item: any) => (
                  <tr key={item.state} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{item.state}</span>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-slate-800">{item.custCount} clients</td>
                    <td className="px-4 py-4 text-center font-bold text-blue-700">{item.orderCount} orders</td>
                    <td className="px-5 py-4 text-right font-black text-slate-900 text-sm">
                      ₹{item.revenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
