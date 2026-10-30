'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  X,
} from 'lucide-react';

export default function AdminCentralizedPaymentsPage({
  initialTab = 'customers',
}: {
  initialTab?: 'customers' | 'suppliers' | 'pending' | 'overdue';
}) {
  const { customerPayments, supplierPayments, salesOrders, purchaseOrders } = useERP();

  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers' | 'pending' | 'overdue'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Totals
  const metrics = useMemo(() => {
    const custReceived = customerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const supPaid = supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingCustomerOrders = salesOrders.filter((o) => o.paymentStatus !== 'PAID');
    const totalPendingCustomer = pendingCustomerOrders.reduce(
      (sum, o) => sum + (o.amountOutstanding || o.pendingAmount || 0),
      0
    );

    const overdueOrders = pendingCustomerOrders.filter((o) => o.dueDate && o.dueDate < todayStr);
    const totalOverdue = overdueOrders.reduce(
      (sum, o) => sum + (o.amountOutstanding || o.pendingAmount || 0),
      0
    );

    return {
      custReceived,
      supPaid,
      totalPendingCustomer,
      pendingCount: pendingCustomerOrders.length,
      totalOverdue,
      overdueCount: overdueOrders.length,
      overdueOrders,
      pendingOrders: pendingCustomerOrders,
    };
  }, [customerPayments, supplierPayments, salesOrders, todayStr]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centralized Financials & Payments</h1>
            {metrics.totalOverdue > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                ₹{metrics.totalOverdue.toLocaleString('en-IN')} Overdue
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete treasury reconciliation: customer inwards, supplier disbursements, receivables aging, and overdue notices.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Customer Inflows
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1">₹{metrics.custReceived.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">{customerPayments.length} receipts cleared</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 shadow-2xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Supplier Outflows
          </div>
          <div className="text-2xl font-black text-blue-800 mt-1">₹{metrics.supPaid.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">{supplierPayments.length} vendor disbursements</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Receivables</div>
          <div className="text-2xl font-black text-amber-800 mt-1">₹{metrics.totalPendingCustomer.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">{metrics.pendingCount} unpaid orders</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 shadow-2xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Overdue & Default Risk</div>
          <div className="text-2xl font-black text-rose-800 mt-1">₹{metrics.totalOverdue.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">{metrics.overdueCount} invoices past due date</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'customers'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>Customer Payments ({customerPayments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'suppliers'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>Supplier Payments ({supplierPayments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Payments ({metrics.pendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Overdue Payments ({metrics.overdueCount})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search payments by party name, payment #, order #, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 1. CUSTOMER PAYMENTS TABLE */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Payment #</th>
                  <th className="px-4 py-3.5">Payment Date</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Invoice #</th>
                  <th className="px-4 py-3.5">Mode</th>
                  <th className="px-4 py-3.5">Transaction Ref</th>
                  <th className="px-4 py-3.5 text-right font-black">Amount</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerPayments
                  .filter((p) => p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                      <td className="px-4 py-4 text-slate-600 font-medium">{p.paymentDate}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{p.customerName}</td>
                      <td className="px-4 py-4 font-mono text-blue-600 font-bold">{p.invoiceNumber || 'INV-DIR'}</td>
                      <td className="px-4 py-4">{p.paymentMode}</td>
                      <td className="px-4 py-4 font-mono text-slate-600">{p.referenceNumber}</td>
                      <td className="px-4 py-4 text-right font-black text-emerald-700 text-sm">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          {p.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SUPPLIER PAYMENTS TABLE */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Disbursement ID</th>
                  <th className="px-4 py-3.5">Disbursement Date</th>
                  <th className="px-4 py-3.5">Vendor / Supplier</th>
                  <th className="px-4 py-3.5">PO Number</th>
                  <th className="px-4 py-3.5">Mode</th>
                  <th className="px-4 py-3.5">Bank Ref</th>
                  <th className="px-4 py-3.5 text-right font-black">Amount</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierPayments
                  .filter((p) => p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) || p.paymentId.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{p.paymentId}</td>
                      <td className="px-4 py-4 text-slate-600 font-medium">{p.paymentDate}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{p.supplierName}</td>
                      <td className="px-4 py-4 font-mono text-blue-600 font-bold">{p.billPoNumber}</td>
                      <td className="px-4 py-4">{p.paymentMode}</td>
                      <td className="px-4 py-4 font-mono text-slate-600">{p.referenceNo}</td>
                      <td className="px-4 py-4 text-right font-black text-blue-700 text-sm">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                          {p.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PENDING PAYMENTS TABLE */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-4 py-3.5">Customer Name</th>
                  <th className="px-4 py-3.5">Order Date</th>
                  <th className="px-4 py-3.5">Payment Due Date</th>
                  <th className="px-4 py-3.5 text-right">Order Grand Total</th>
                  <th className="px-4 py-3.5 text-right font-bold text-amber-700">Pending Amount</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.pendingOrders
                  .filter((o) => o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{o.customerName}</td>
                      <td className="px-4 py-4 text-slate-600">{o.orderDate}</td>
                      <td className="px-4 py-4 font-bold text-slate-800">{o.dueDate || 'Immediate'}</td>
                      <td className="px-4 py-4 text-right font-medium">₹{(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-4 text-right font-black text-amber-700 text-sm">
                        ₹{(o.amountOutstanding || o.pendingAmount || o.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                          {o.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                {metrics.pendingOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      All customer sales orders are fully paid!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. OVERDUE PAYMENTS TABLE */}
      {activeTab === 'overdue' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-4 py-3.5">Customer Name</th>
                  <th className="px-4 py-3.5">Order Date</th>
                  <th className="px-4 py-3.5 font-bold text-rose-700">Elapsed Due Date</th>
                  <th className="px-4 py-3.5 text-right font-black text-rose-700">Overdue Balance</th>
                  <th className="px-5 py-3.5 text-center">Action Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.overdueOrders
                  .filter((o) => o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((o) => (
                    <tr key={o.id} className="hover:bg-rose-50/40 transition bg-rose-50/10">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{o.customerName}</td>
                      <td className="px-4 py-4 text-slate-600">{o.orderDate}</td>
                      <td className="px-4 py-4 font-black text-rose-700">{o.dueDate}</td>
                      <td className="px-4 py-4 text-right font-black text-rose-700 text-sm">
                        ₹{(o.amountOutstanding || o.pendingAmount || o.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          Payment Reminder Due
                        </span>
                      </td>
                    </tr>
                  ))}
                {metrics.overdueOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      No customer payments are currently overdue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
