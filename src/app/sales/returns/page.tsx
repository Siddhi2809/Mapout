'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { SalesReturn } from '@/types/erp';
import {
  RotateCcw,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  ShieldCheck,
  Package,
  Calendar,
  Wrench,
  FileText,
} from 'lucide-react';

export default function SalesReturnsPage() {
  const {
    salesReturns,
    customers,
    invoices,
    products,
    createSalesReturnFull,
    generateEntityCode,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Form State - Create Sales Return
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formInvoiceId, setFormInvoiceId] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formReturnedQuantity, setFormReturnedQuantity] = useState('1');
  const [formReplacementQuantity, setFormReplacementQuantity] = useState('0');
  const [formClaimType, setFormClaimType] = useState<string>('Defective');
  const [formReason, setFormReason] = useState<any>('Defective');
  const [formDescription, setFormDescription] = useState('Connector pin loose inside male OBD head socket.');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredReturns = salesReturns.filter((r) => {
    const matchSearch =
      r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenCreateModal = () => {
    if (customers.length > 0) setFormCustomerId(customers[0].id);
    if (invoices.length > 0) setFormInvoiceId(invoices[0].id);
    if (products.length > 0) setFormProductId(products[0].id);
    setFormQuantity('1');
    setFormReturnedQuantity('1');
    setFormReplacementQuantity('0');
    setFormClaimType('Defective');
    setFormReason('Defective');
    setFormDescription('Connector pin loose inside male OBD head socket.');
    setIsCreateModalOpen(true);
  };

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const custObj = customers.find((c) => c.id === formCustomerId);
    const invObj = invoices.find((i) => i.id === formInvoiceId);
    const prodObj = products.find((p) => p.id === formProductId);
    const qty = parseInt(formQuantity, 10) || 1;
    const retQty = parseInt(formReturnedQuantity, 10) || qty;
    const repQty = parseInt(formReplacementQuantity, 10) || 0;

    createSalesReturnFull({
      customerId: formCustomerId,
      customerName: custObj ? custObj.companyName : 'Unknown Customer',
      invoiceId: formInvoiceId,
      invoiceNumber: invObj ? invObj.invoiceNumber : 'INV-2026',
      productId: formProductId,
      productName: prodObj ? prodObj.name : 'Unknown Product',
      quantity: qty,
      returnedQuantity: retQty,
      replacementQuantity: repQty,
      claimType: formClaimType,
      returnReason: formReason,
      description: formDescription,
      repairStatus: 'Not Started',
      status: 'Requested',
    });

    showToast('Return Request (RMA) created & sent to Product Management QA desk for inspection.');
    setIsCreateModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Repaired':
      case 'Replaced':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Under Inspection':
      case 'Received':
      case 'Requested':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Repair Required':
      case 'Replacement Required':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Damaged':
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getClaimBadge = (claimType?: string) => {
    switch (claimType) {
      case 'Defective':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Wrong Product':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Warranty':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Transit Damage':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <DashboardLayout
      roleTitle="Sales Management"
      roleBadge="Sales Manager"
      navItems={SALES_NAV}
    >
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" /> {toastMessage}
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Returns (RMA)</h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Customer-facing portal to log return requests, track technical inspection workflow, and communicate RMA status.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Return Request
          </button>
        </div>

        {/* WORKFLOW PIPELINE NOTICE */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-blue-950">Sales & Product Management Return Pipeline</div>
              <div className="text-blue-800 text-[11px] mt-0.5 font-medium">
                Sales submits return requests → Product Management performs technical bench inspection → Replacement / Repair / Refund → Status syncs automatically.
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search RMA #, Customer, Product, Invoice..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Return Status:
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Requested">Requested</option>
              <option value="Under Inspection">Under Inspection</option>
              <option value="Repair Required">Repair Required</option>
              <option value="Replacement Required">Replacement Required</option>
              <option value="Repaired">Repaired</option>
              <option value="Replaced">Replaced</option>
              <option value="Damaged">Damaged</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Returns Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                  <th className="p-3.5">RMA & Date</th>
                  <th className="p-3.5">Invoice & Customer</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5 text-center">Quantities (Ret / Rep)</th>
                  <th className="p-3.5">Claim & Reason</th>
                  <th className="p-3.5">Repair Status</th>
                  <th className="p-3.5">Final Action & Closing</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono text-rose-700 font-bold">
                      <div>{r.returnNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{r.returnDate}</div>
                    </td>
                    <td className="p-3.5 max-w-[170px]">
                      <div className="font-bold text-slate-900 truncate">{r.customerName}</div>
                      <div className="text-[11px] text-blue-600 font-mono font-semibold">{r.invoiceNumber || 'INV-2026-REF'}</div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800 max-w-[180px] truncate">{r.productName}</td>
                    <td className="p-3.5 text-center font-mono">
                      <span className="font-bold text-rose-700">{r.returnedQuantity ?? r.quantity} Ret</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="font-bold text-emerald-700">{r.replacementQuantity ?? 0} Rep</span>
                    </td>
                    <td className="p-3.5 max-w-[170px]">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mb-1 ${getClaimBadge(r.claimType)}`}>
                        {r.claimType || 'Defective'}
                      </span>
                      <div className="text-slate-700 max-w-[160px] truncate font-medium">{r.returnReason}</div>
                    </td>
                    <td className="p-3.5 text-slate-700 max-w-[150px]">
                      <div className="font-semibold text-[11px] text-slate-900">{r.repairStatus || 'Not Started'}</div>
                    </td>
                    <td className="p-3.5 max-w-[160px]">
                      <div className="font-medium text-slate-800 truncate">{r.finalAction || 'Pending Final Action'}</div>
                      {r.closingDate && <div className="text-[10px] text-slate-400 font-mono">Closed: {r.closingDate}</div>}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          setSelectedReturn(r);
                          setIsViewModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] flex items-center gap-1 mx-auto transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" /> View Status
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredReturns.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500 text-xs font-medium">
                      No customer return requests logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATE RETURN REQUEST MODAL */}
        {isCreateModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsCreateModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-700" /> Log Customer Return Request (RMA)
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                  title="Close Form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateReturn} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Return RMA Number <span className="text-slate-400 font-normal">(Auto-generated)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={generateEntityCode('RETURN')}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-rose-700 font-mono focus:outline-none cursor-not-allowed opacity-90 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Select Customer Account *</label>
                    <select
                      required
                      value={formCustomerId}
                      onChange={(e) => setFormCustomerId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Select Sales Invoice Ref *</label>
                    <select
                      value={formInvoiceId}
                      onChange={(e) => setFormInvoiceId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    >
                      {invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} - {inv.customerName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Product Returned *</label>
                  <select
                    required
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Total Sale Qty</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Returned Qty *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formReturnedQuantity}
                      onChange={(e) => setFormReturnedQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-rose-700 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Replacement Qty</label>
                    <input
                      type="number"
                      min="0"
                      value={formReplacementQuantity}
                      onChange={(e) => setFormReplacementQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-emerald-700 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Defective / Warranty Claim Type *</label>
                    <select
                      value={formClaimType}
                      onChange={(e) => setFormClaimType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    >
                      <option value="Defective">Defective Product</option>
                      <option value="Wrong Product">Wrong Product Shipped</option>
                      <option value="Warranty">Warranty Claim</option>
                      <option value="Transit Damage">Transit Damage</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Return Reason Category *</label>
                    <select
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    >
                      <option value="Defective">Defective / Signal Error</option>
                      <option value="Wrong Product">Wrong Product Shipped</option>
                      <option value="Damaged">Transit Damage</option>
                      <option value="Quantity Issue">Quantity Mismatch</option>
                      <option value="Customer Requirement">Customer Requirement</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Defect Description / Customer Notes *</label>
                  <textarea
                    rows={2}
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Details reported by client..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
                  >
                    Submit RMA Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW RETURN STATUS DETAILS MODAL */}
        {isViewModalOpen && selectedReturn && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsViewModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div>
                  <div className="text-xs font-mono text-rose-700 font-bold">{selectedReturn.returnNumber}</div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedReturn.customerName}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Overall RMA Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(selectedReturn.status)}`}>
                    {selectedReturn.status}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 font-medium">
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Invoice Reference:</span>
                    <span className="font-mono text-blue-700 font-bold">{selectedReturn.invoiceNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Product:</span>
                    <span className="font-bold text-slate-900 text-right">{selectedReturn.productName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Claim Type / Defect Category:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getClaimBadge(selectedReturn.claimType)}`}>
                      {selectedReturn.claimType || 'Defective'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Returned Qty / Replacement Qty:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedReturn.returnedQuantity ?? selectedReturn.quantity} Ret / {selectedReturn.replacementQuantity ?? 0} Rep
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Bench Repair Status:</span>
                    <span className="font-bold text-slate-900">{selectedReturn.repairStatus || 'Not Started'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Return Reason:</span>
                    <span className="text-slate-800 font-semibold">{selectedReturn.returnReason}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Customer Stated Description:</span>
                    <span className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200 block text-[11px]">{selectedReturn.description}</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
                  <div className="font-bold text-emerald-950 flex items-center justify-between">
                    <span>Final Action:</span>
                    <span className="text-emerald-700 font-semibold">{selectedReturn.finalAction || 'Pending Bench Processing'}</span>
                  </div>
                  {selectedReturn.closingDate && (
                    <div className="text-[11px] text-emerald-800 flex items-center justify-between border-t border-emerald-200/60 pt-2 font-mono">
                      <span>RMA Closing Date:</span>
                      <span className="font-bold">{selectedReturn.closingDate}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
