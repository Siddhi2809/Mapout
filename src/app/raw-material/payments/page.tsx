'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RAW_MATERIAL_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { SupplierPayment } from '@/types/erp';
import {
  CreditCard,
  Plus,
  Search,
  AlertTriangle,
  X,
  CheckCircle2,
  Building2,
  ShieldAlert,
  Wallet,
  Receipt,
  FileText,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function PaymentsContent() {
  const {
    supplierPayments,
    suppliers,
    purchaseOrders,
    createSupplierPayment,
  } = useERP();

  const searchParams = useSearchParams();
  const paramSupplierId = searchParams.get('supplierId');

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [billPoNumber, setBillPoNumber] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentMode, setPaymentMode] = useState<SupplierPayment['paymentMode']>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [allowOverPayment, setAllowOverPayment] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (paramSupplierId) {
      setSelectedSupplierId(paramSupplierId);
      setIsAddModalOpen(true);
    }
  }, [paramSupplierId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  // When supplier changes, update default amount to their current outstanding balance!
  useEffect(() => {
    if (selectedSupplier) {
      setAmount(selectedSupplier.totalOutstanding);
      const supplierPOs = purchaseOrders.filter((p) => p.supplierId === selectedSupplier.id);
      if (supplierPOs.length > 0) {
        setBillPoNumber(supplierPOs[0].poNumber);
      } else {
        setBillPoNumber('General Bill');
      }
    }
  }, [selectedSupplierId, selectedSupplier, purchaseOrders]);

  const filteredPayments = useMemo(() => {
    return supplierPayments.filter((p) => {
      return (
        p.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.billPoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [supplierPayments, searchTerm]);

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedSupplierId) {
      setFormError('Please select a supplier.');
      return;
    }
    if (amount <= 0) {
      setFormError('Payment amount must be greater than ₹0.');
      return;
    }
    if (!referenceNumber.trim()) {
      setFormError('Transaction Reference Number is required.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) return;

    const result = createSupplierPayment(
      {
        supplierId: supplier.id,
        supplierName: supplier.name,
        billPoNumber: billPoNumber || 'General Bill',
        amount,
        paymentDate,
        paymentMode,
        referenceNumber,
        notes,
        status: 'Completed',
        createdBy: 'Raw Material Manager',
      },
      allowOverPayment
    );

    if (result.success) {
      showToast(
        `Payment of ₹${amount.toLocaleString(
          'en-IN'
        )} recorded for ${supplier.name}. Supplier outstanding updated!`
      );
      setIsAddModalOpen(false);
      setReferenceNumber('');
      setNotes('');
    } else {
      setFormError(result.message || 'Failed to record supplier payment.');
    }
  };

  return (
    <DashboardLayout
      roleTitle="Raw Material Management"
      roleBadge="Raw Material Manager"
      navItems={RAW_MATERIAL_NAV}
    >
      <div className="space-y-6">
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-500/90 text-white shadow-2xl border border-emerald-400 backdrop-blur-md flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-rose-600" /> Supplier Payments & Payables
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Record supplier bill settlements, bank transfers, UPI transactions, and track outstanding vendor payables.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedSupplierId(suppliers[0]?.id || '');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-900/10 transition"
          >
            <Plus className="w-4 h-4 text-white" /> Record Supplier Payment
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Payment ID, Supplier, Bill/PO, Reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-sm transition"
            />
          </div>
        </div>

        {/* Payments Data Table */}
        <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Bill / PO Ref</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Reference No</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No supplier payment transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-rose-700">{pay.paymentId}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-[170px] truncate">{pay.supplierName}</td>
                      <td className="py-3 px-4 font-mono text-blue-700 font-semibold">{pay.billPoNumber}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        ₹{pay.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{pay.paymentDate}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {pay.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 text-[11px] font-medium">{pay.referenceNumber}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: RECORD SUPPLIER PAYMENT */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Record Supplier Payment</h3>
                    <p className="text-xs text-slate-600">Settle vendor invoices & update outstanding balance</p>
                  </div>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Select Supplier <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.companyName})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSupplier && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-medium">
                    <div>
                      <span className="text-slate-600 block text-[10px]">Current Total Outstanding:</span>
                      <span className="text-rose-700 font-extrabold text-sm">
                        ₹{selectedSupplier.totalOutstanding.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 block text-[10px]">Payment Terms:</span>
                      <span className="text-slate-900 font-bold">{selectedSupplier.paymentTerms}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Purchase Bill / PO Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PO-2026-034"
                      value={billPoNumber}
                      onChange={(e) => setBillPoNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Payment Amount (₹) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-rose-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) =>
                        setPaymentMode(e.target.value as SupplierPayment['paymentMode'])
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="UPI">UPI Payment</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Transaction Reference No / UTR <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NEFT-UTIB0009823 or UPI/6290184421/HDFC"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                  />
                </div>

                {selectedSupplier && amount > selectedSupplier.totalOutstanding && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Payment amount exceeds current supplier outstanding.</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Admin Over-payment Override</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowOverPayment}
                      onChange={(e) => setAllowOverPayment(e.target.checked)}
                      className="rounded bg-white border-slate-300 text-rose-600 focus:ring-0"
                    />
                    <span className="text-slate-600 font-medium">Allow payment greater than outstanding</span>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Enter payment confirmation notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/10"
                  >
                    Process Supplier Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading supplier payments...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}
