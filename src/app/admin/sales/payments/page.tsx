'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { CustomerPayment } from '@/types/erp';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  DollarSign,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  FileText,
} from 'lucide-react';

export default function AdminSalesPaymentsPage() {
  const { customerPayments, salesOrders, customers, createCustomerPaymentFull } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    customerId: '',
    customerName: '',
    invoiceId: 'INV-GEN',
    invoiceNumber: 'INV-2026-001',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMode: 'NEFT / Bank Transfer' as any,
    referenceNumber: '',
    notes: '',
  });

  const totals = useMemo(() => {
    const totalReceived = customerPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalSales = salesOrders.reduce((acc, o) => acc + (o.grandTotal || o.totalAmount || 0), 0);
    const totalPending = Math.max(0, totalSales - totalReceived);

    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = salesOrders
      .filter((o) => o.paymentStatus !== 'PAID' && o.dueDate && o.dueDate < todayStr)
      .reduce((acc, o) => acc + (o.amountOutstanding || o.pendingAmount || 0), 0);

    return {
      totalReceived,
      totalPending,
      overdue,
    };
  }, [customerPayments, salesOrders]);

  const filteredPayments = useMemo(() => {
    return customerPayments.filter((p) => {
      return (
        p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.paymentMode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [customerPayments, searchQuery]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.customerId || !paymentForm.amount) return;

    const amountNum = parseFloat(paymentForm.amount);
    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;

    createCustomerPaymentFull({
      customerId: paymentForm.customerId,
      customerName: paymentForm.customerName,
      invoiceId: paymentForm.invoiceId,
      invoiceNumber: paymentForm.invoiceNumber,
      paymentDate: paymentForm.paymentDate,
      amount: amountNum,
      paymentMode: paymentForm.paymentMode,
      referenceNumber: paymentForm.referenceNumber || `TXN-${Date.now().toString().slice(-5)}`,
      notes: paymentForm.notes,
      status: 'Completed',
    });

    // Also persist directly via API
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'customer',
          paymentNumber,
          customerId: paymentForm.customerId,
          customerName: paymentForm.customerName,
          invoiceId: paymentForm.invoiceId,
          invoiceNumber: paymentForm.invoiceNumber,
          paymentDate: paymentForm.paymentDate,
          amount: amountNum,
          paymentMode: paymentForm.paymentMode,
          referenceNumber: paymentForm.referenceNumber || `TXN-${Date.now().toString().slice(-5)}`,
          notes: paymentForm.notes,
        }),
      });
    } catch (err) {
      console.error(err);
    }

    setShowAddModal(false);
    setPaymentForm({
      customerId: '',
      customerName: '',
      invoiceId: 'INV-GEN',
      invoiceNumber: 'INV-2026-001',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: '',
      paymentMode: 'NEFT / Bank Transfer',
      referenceNumber: '',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Payments & Collections</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {customerPayments.length} Receipts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time ledger of inbound client collections, pending balances, and overdue account clearances.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Record Inward Payment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Received</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">₹{totals.totalReceived.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">{customerPayments.length} transactions settled</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Balances</div>
          <div className="text-2xl font-black text-amber-800 mt-1">₹{totals.totalPending.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Across unbilled & partially paid orders</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 shadow-2xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Overdue Past Credit Period</div>
          <div className="text-2xl font-black text-rose-800 mt-1">₹{totals.overdue.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">High priority recovery follow-up</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search payment #, customer, transaction ref, mode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Payment #</th>
                <th className="px-4 py-3.5">Payment Date</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Invoice Reference</th>
                <th className="px-4 py-3.5">Payment Mode</th>
                <th className="px-4 py-3.5">Transaction Ref</th>
                <th className="px-4 py-3.5 text-right">Amount Received</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900 font-mono">
                    {p.paymentNumber}
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {p.paymentDate}
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-900">
                    {p.customerName}
                  </td>

                  <td className="px-4 py-4 text-blue-600 font-mono font-semibold">
                    {p.invoiceNumber || 'INV-DIRECT'}
                  </td>

                  <td className="px-4 py-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                      {p.paymentMode}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-mono text-slate-600">
                    {p.referenceNumber}
                  </td>

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
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Payment */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Record Inward Customer Payment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Customer *</label>
                <select
                  required
                  value={paymentForm.customerId}
                  onChange={(e) => {
                    const c = customers.find((cust) => cust.id === e.target.value);
                    setPaymentForm({
                      ...paymentForm,
                      customerId: e.target.value,
                      customerName: c ? c.name : '',
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.companyName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount Received (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 75000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="NEFT / Bank Transfer">NEFT / RTGS / IMPS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Transaction Ref / UTR *</label>
                  <input
                    type="text"
                    required
                    placeholder="UTR-2026-987654"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared 50% advance for Sales Order #SO-2026-001"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
