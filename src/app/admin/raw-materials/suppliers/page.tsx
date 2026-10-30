'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { Supplier } from '@/types/erp';
import {
  Truck,
  Search,
  Filter,
  Plus,
  Eye,
  Phone,
  Mail,
  MapPin,
  Building2,
  DollarSign,
  ShoppingCart,
  CreditCard,
  X,
} from 'lucide-react';

export default function AdminSuppliersPage() {
  const { suppliers, purchaseOrders, supplierPayments, addSupplier } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: 'Pune',
    state: 'Maharashtra',
    category: 'Copper / Wiring',
    paymentTerms: 'Net 30 Days',
    address: '',
    gstNumber: '',
  });

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      return (
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.companyName && s.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [suppliers, searchQuery]);

  const supplierDetailData = useMemo(() => {
    if (!selectedSupplier) return null;

    const pos = purchaseOrders.filter(
      (po) => po.supplierId === selectedSupplier.id || po.supplierName === selectedSupplier.name
    );

    const payments = supplierPayments.filter(
      (p) => p.supplierId === selectedSupplier.id || p.supplierName === selectedSupplier.name
    );

    const totalPurchased = pos.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const outstanding = Math.max(0, totalPurchased - totalPaid);

    return {
      pos,
      payments,
      totalPurchased,
      totalPaid,
      outstanding,
    };
  }, [selectedSupplier, purchaseOrders, supplierPayments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.email) return;

    const newSup = {
      supplierCode: `SUP-${Date.now().toString().slice(-4)}`,
      name: supplierForm.name,
      companyName: supplierForm.companyName || supplierForm.name,
      contactPerson: supplierForm.contactPerson || supplierForm.name,
      email: supplierForm.email,
      phone: supplierForm.phone,
      city: supplierForm.city,
      state: supplierForm.state,
      address: supplierForm.address || 'Industrial Estate',
      category: supplierForm.category,
      paymentTerms: supplierForm.paymentTerms,
      totalPurchase: 0,
      totalOutstanding: 0,
      status: 'ACTIVE' as const,
    };

    addSupplier(newSup as any);

    try {
      await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSup),
      });
    } catch (err) {
      console.error(err);
    }

    setShowAddModal(false);
    setSupplierForm({
      name: '',
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      city: 'Pune',
      state: 'Maharashtra',
      category: 'Copper / Wiring',
      paymentTerms: 'Net 30 Days',
      address: '',
      gstNumber: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suppliers & Vendors</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {suppliers.length} Vendors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized registry of raw material vendors, purchase order histories, payment settlements, and accounts payable.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by company name, contact, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Vendor & Code</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-right">Lifetime Purchases</th>
                <th className="px-4 py-3.5 text-right">Payable Balance</th>
                <th className="px-4 py-3.5">Terms</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((s) => {
                const pos = purchaseOrders.filter((po) => po.supplierId === s.id || po.supplierName === s.name);
                const totalPO = pos.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
                const payments = supplierPayments.filter((p) => p.supplierId === s.id || p.supplierName === s.name);
                const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                const outstanding = Math.max(0, totalPO - totalPaid);

                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.companyName}</div>
                      <div className="text-[10px] text-blue-600 font-mono mt-0.5">{s.supplierCode || s.id}</div>
                    </td>

                    <td className="px-4 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.email}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {s.category}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-slate-900">
                      ₹{totalPO.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <span className={`font-black ${outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{outstanding.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600 font-medium">
                      {s.paymentTerms || 'Net 30 Days'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedSupplier(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Full History
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No suppliers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Full Supplier History */}
      {selectedSupplier && supplierDetailData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedSupplier.name}</h3>
                <div className="text-xs text-slate-500 font-mono">
                  {selectedSupplier.supplierCode || selectedSupplier.id} · {selectedSupplier.category}
                </div>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Total Billed:</span>
                  <div className="font-black text-slate-900 text-sm mt-0.5">
                    ₹{supplierDetailData.totalPurchased.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Total Paid:</span>
                  <div className="font-black text-emerald-700 text-sm mt-0.5">
                    ₹{supplierDetailData.totalPaid.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Outstanding:</span>
                  <div className="font-black text-rose-600 text-sm mt-0.5">
                    ₹{supplierDetailData.outstanding.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Purchase Orders */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900">Purchase Orders History ({supplierDetailData.pos.length}):</div>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {supplierDetailData.pos.map((po) => (
                    <div key={po.id} className="p-2.5 flex justify-between bg-slate-50/40">
                      <div>
                        <div className="font-bold text-slate-800">{po.poNumber}</div>
                        <div className="text-[10px] text-slate-400">Date: {po.orderDate} · Status: {po.status}</div>
                      </div>
                      <div className="font-bold text-slate-900">₹{(po.totalAmount || 0).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                  {supplierDetailData.pos.length === 0 && (
                    <div className="p-3 text-center text-slate-400">No purchase orders on file.</div>
                  )}
                </div>
              </div>

              {/* Payments */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900">Payments Disbursed ({supplierDetailData.payments.length}):</div>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {supplierDetailData.payments.map((pm) => (
                    <div key={pm.id} className="p-2.5 flex justify-between bg-slate-50/40">
                      <div>
                        <div className="font-bold text-slate-800">{pm.paymentId}</div>
                        <div className="text-[10px] text-slate-400">Mode: {pm.paymentMode} · Date: {pm.paymentDate}</div>
                      </div>
                      <div className="font-bold text-emerald-700">₹{pm.amount.toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                  {supplierDetailData.payments.length === 0 && (
                    <div className="p-3 text-center text-slate-400">No disbursements recorded.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Supplier */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add Supplier / Vendor Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bharat Copper & Alloy Ltd"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Sanjay Rao"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98220 12345"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="sales@bharatcopper.in"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Supply Category</label>
                  <input
                    type="text"
                    placeholder="Copper & Wires"
                    value={supplierForm.category}
                    onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
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
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
