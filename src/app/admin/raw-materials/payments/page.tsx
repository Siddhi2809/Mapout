'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { SupplierPayment } from '@/types/erp';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  DollarSign,
  Calendar,
  Building2,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function AdminSupplierPaymentsPage() {
  const { supplierPayments, suppliers, purchaseOrders, createSupplierPayment } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    supplierId: '',
    supplierName: '',
    billPoNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMode: 'NEFT / RTGS',
    referenceNo: '',
    notes: '',
  });

  const totals = useMemo(() => {
    const totalPaid = supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPurchased = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const pending = Math.max(0, totalPurchased - totalPaid);

    return { totalPaid, pending };
  }, [supplierPayments, purchaseOrders]);

  const filteredPayments = useMemo(() => {
    return supplierPayments.filter((p) => {
      return (
        p.paymentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.billPoNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [supplierPayments, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.supplierId || !paymentForm.amount) return;

    const amountNum = parseFloat(paymentForm.amount);
    const paymentId = `SPAY-${Date.now().toString().slice(-6)}`;

    createSupplierPayment({
      supplierId: paymentForm.supplierId,
      supplierName: paymentForm.supplierName,
      billPoNumber: paymentForm.billPoNumber || 'PO-DIRECT',
      paymentDate: paymentForm.paymentDate,
      amount: amountNum,
      paymentMode: paymentForm.paymentMode,
      referenceNo: paymentForm.referenceNo || `UTR-${Date.now().toString().slice(-5)}`,
      notes: paymentForm.notes,
      status: 'Completed',
    });

    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'supplier',
          paymentId,
          supplierId: paymentForm.supplierId,
          supplierName: paymentForm.supplierName,
          billPoNumber: paymentForm.billPoNumber || 'PO-DIRECT',
          paymentDate: paymentForm.paymentDate,
          amount: amountNum,
          paymentMode: paymentForm.paymentMode,
          referenceNo: paymentForm.referenceNo || `UTR-${Date.now().toString().slice(-5)}`,
          notes: paymentForm.notes,
        }),
      });
    } catch (err) {
      console.error(err);
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Supplier Disbursements & Accounts Payable</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {supplierPayments.length} Disbursements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Vendor payments ledger: outbound payments, purchase order settlement, and pending raw material balances.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Disburse Vendor Payment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Disbursed</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">₹{totals.totalPaid.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">{supplierPayments.length} transactions cleared</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Accounts Payable</div>
          <div className="text-2xl font-black text-amber-800 mt-1">₹{totals.pending.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Payable balance across raw material vendors</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search payment ID, vendor, PO #, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Disbursement ID</th>
                <th className="px-4 py-3.5">Payment Date</th>
                <th className="px-4 py-3.5">Vendor / Supplier</th>
                <th className="px-4 py-3.5">PO / Bill Ref</th>
                <th className="px-4 py-3.5">Mode</th>
                <th className="px-4 py-3.5">Transaction Ref</th>
                <th className="px-4 py-3.5 text-right">Amount Paid</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900 font-mono">
                    {p.paymentId}
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {p.paymentDate}
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-900">
                    {p.supplierName}
                  </td>

                  <td className="px-4 py-4 text-blue-600 font-mono font-bold">
                    {p.billPoNumber}
                  </td>

                  <td className="px-4 py-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                      {p.paymentMode}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-mono text-slate-600">
                    {p.referenceNo}
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
                    No supplier payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Supplier Payment */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Record Vendor Disbursement</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Supplier *</label>
                <select
                  required
                  value={paymentForm.supplierId}
                  onChange={(e) => {
                    const s = suppliers.find((sup) => sup.id === e.target.value);
                    setPaymentForm({
                      ...paymentForm,
                      supplierId: e.target.value,
                      supplierName: s ? s.name : '',
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Choose Vendor --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount Disbursed (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="45000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Disbursement Date</label>
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">PO Reference</label>
                  <input
                    type="text"
                    placeholder="PO-2026-001"
                    value={paymentForm.billPoNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, billPoNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank UTR / Ref No *</label>
                  <input
                    type="text"
                    required
                    placeholder="UTR-2026-987"
                    value={paymentForm.referenceNo}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
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
                  Record Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
