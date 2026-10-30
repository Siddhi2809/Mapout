'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PRODUCT_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { ProductReturn } from '@/types/erp';
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Wrench,
  RefreshCw,
  Flame,
  Check,
  Ban,
  Plus,
  Calendar,
  FileText,
  Package,
} from 'lucide-react';

export default function ReturnsPage() {
  const {
    productReturns,
    products,
    customers,
    createProductReturn,
    updateProductReturnStatus,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);

  // Form State - Log New RMA
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formInvoice, setFormInvoice] = useState('INV-2026-101');
  const [formProductId, setFormProductId] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formReturnedQuantity, setFormReturnedQuantity] = useState('1');
  const [formReplacementQuantity, setFormReplacementQuantity] = useState('0');
  const [formReason, setFormReason] = useState('Signal connection error');
  const [formClaimType, setFormClaimType] = useState<'Defective' | 'Wrong Product' | 'Warranty' | 'Transit Damage' | 'Other'>('Defective');

  // Inspection & Lifecycle Form State
  const [inspectStatus, setInspectStatus] = useState<ProductReturn['status']>('Under Inspection');
  const [inspectClaimType, setInspectClaimType] = useState<string>('Defective');
  const [inspectReturnedQty, setInspectReturnedQty] = useState<string>('1');
  const [inspectReplacementQty, setInspectReplacementQty] = useState<string>('0');
  const [inspectRepairStatus, setInspectRepairStatus] = useState<string>('Under Bench Inspection');
  const [inspectDefect, setInspectDefect] = useState('');
  const [inspectNotes, setInspectNotes] = useState('');
  const [inspectAction, setInspectAction] = useState('');
  const [inspectFinalAction, setInspectFinalAction] = useState('');
  const [inspectClosingDate, setInspectClosingDate] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredReturns = productReturns.filter((r) => {
    const matchSearch =
      r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.salesInvoice.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenCreateModal = () => {
    if (products.length > 0) setFormProductId(products[0].id);
    if (customers.length > 0) setFormCustomerName(customers[0].companyName);
    setFormQuantity('1');
    setFormReturnedQuantity('1');
    setFormReplacementQuantity('0');
    setFormReason('Signal connection error');
    setFormClaimType('Defective');
    setIsCreateModalOpen(true);
  };

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === formProductId);
    const qty = parseInt(formQuantity, 10) || 1;
    const retQty = parseInt(formReturnedQuantity, 10) || qty;
    const repQty = parseInt(formReplacementQuantity, 10) || 0;

    createProductReturn({
      customerName: formCustomerName,
      salesInvoice: formInvoice,
      productId: formProductId,
      productName: prod ? prod.name : 'Unknown Product',
      quantity: qty,
      returnedQuantity: retQty,
      replacementQuantity: repQty,
      claimType: formClaimType,
      returnReason: formReason,
      repairStatus: 'Not Started',
      status: 'Requested',
    });

    showToast('Customer return request (RMA) created successfully.');
    setIsCreateModalOpen(false);
  };

  const handleOpenInspectModal = (r: ProductReturn) => {
    setSelectedReturn(r);
    setInspectStatus(r.status);
    setInspectClaimType(r.claimType || 'Defective');
    setInspectReturnedQty((r.returnedQuantity ?? r.quantity).toString());
    setInspectReplacementQty((r.replacementQuantity ?? 0).toString());
    setInspectRepairStatus(r.repairStatus || 'Under Bench Inspection');
    setInspectDefect(r.defect || '');
    setInspectNotes(r.inspectionNotes || '');
    setInspectAction(r.actionTaken || '');
    setInspectFinalAction(r.finalAction || (r.status === 'Replaced' ? 'Replacement Dispatched' : r.status === 'Repaired' ? 'Repaired & Restocked' : 'Under Assessment'));
    setInspectClosingDate(r.closingDate || new Date().toISOString().split('T')[0]);
    setIsInspectModalOpen(true);
  };

  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    const retQty = parseInt(inspectReturnedQty, 10) || selectedReturn.quantity;
    const repQty = parseInt(inspectReplacementQty, 10) || 0;

    const res = updateProductReturnStatus(
      selectedReturn.id,
      inspectStatus,
      inspectNotes,
      inspectAction,
      inspectDefect,
      {
        claimType: inspectClaimType,
        returnedQuantity: retQty,
        replacementQuantity: repQty,
        repairStatus: inspectRepairStatus,
        finalAction: inspectFinalAction,
        closingDate: inspectClosingDate,
      }
    );

    if (!res.success) {
      alert(res.message);
    } else {
      showToast(`RMA ${selectedReturn.returnNumber} updated to status "${inspectStatus}".`);
      setIsInspectModalOpen(false);
    }
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
      roleTitle="Product Management"
      roleBadge="Product Manager"
      navItems={PRODUCT_NAV}
    >
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" /> {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Returns & Replacement (RMA)</h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Technical inspection desk for customer product returns, defect diagnosis, warranty claims, repair bench processing, and replacements.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Log Return Request (RMA)
          </button>
        </div>

        {/* Filter Bar */}
        <div className="erp-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search RMA #, Customer, Invoice, or Product..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Status Filter:
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Requested">Requested</option>
              <option value="Received">Received</option>
              <option value="Under Inspection">Under Inspection</option>
              <option value="Repair Required">Repair Required</option>
              <option value="Replacement Required">Replacement Required</option>
              <option value="Repaired">Repaired</option>
              <option value="Replaced">Replaced</option>
              <option value="Damaged">Damaged</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Product Returns Table */}
        <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
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
              <tbody className="divide-y divide-slate-200">
                {filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="font-mono text-rose-600 font-bold">{r.returnNumber}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{r.date}</div>
                    </td>
                    <td className="p-3.5 max-w-[170px]">
                      <div className="font-bold text-slate-900 truncate">{r.customerName}</div>
                      <div className="text-[11px] text-blue-600 font-mono font-semibold">{r.salesInvoice}</div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800 max-w-[180px] truncate">{r.productName}</td>
                    <td className="p-3.5 text-center font-mono">
                      <span className="font-bold text-rose-700">{r.returnedQuantity ?? r.quantity} Ret</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="font-bold text-emerald-700">{r.replacementQuantity ?? 0} Rep</span>
                    </td>
                    <td className="p-3.5 max-w-[180px]">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mb-1 ${getClaimBadge(r.claimType)}`}>
                        {r.claimType || 'Defective'}
                      </span>
                      <div className="text-slate-600 truncate text-[11px]">{r.returnReason}</div>
                    </td>
                    <td className="p-3.5 text-slate-700 max-w-[150px]">
                      <div className="font-semibold text-[11px] text-slate-900">{r.repairStatus || 'Not Started'}</div>
                      {r.defect && <div className="text-[10px] text-rose-600 truncate">{r.defect}</div>}
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
                        onClick={() => handleOpenInspectModal(r)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] flex items-center gap-1 mx-auto transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect / Update
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredReturns.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500 text-xs">
                      No RMA return records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOG NEW RETURN MODAL */}
        {isCreateModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsCreateModalOpen(false);
            }}
          >
            <div className="erp-card w-full max-w-xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl rounded-2xl my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-600" /> Log Product Return Request (RMA)
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition flex items-center justify-center"
                  title="Close Form"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateReturn} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Customer Company Name *</label>
                    <input
                      type="text"
                      required
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      placeholder="e.g. Vikram Logistics Pvt Ltd"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Sales Invoice Reference *</label>
                    <input
                      type="text"
                      required
                      value={formInvoice}
                      onChange={(e) => setFormInvoice(e.target.value)}
                      placeholder="e.g. INV-2026-089"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Product Returned *</label>
                  <select
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
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
                    <label className="block text-slate-700 mb-1 font-semibold">Order Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Returned Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formReturnedQuantity}
                      onChange={(e) => setFormReturnedQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Replacement Qty</label>
                    <input
                      type="number"
                      min="0"
                      value={formReplacementQuantity}
                      onChange={(e) => setFormReplacementQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Claim Type / Issue Category *</label>
                  <select
                    value={formClaimType}
                    onChange={(e) => setFormClaimType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Defective">Defective / Hardware Failure</option>
                    <option value="Wrong Product">Wrong Product Shipped</option>
                    <option value="Warranty">Warranty Repair / Replacement Claim</option>
                    <option value="Transit Damage">Transit / Packaging Damage</option>
                    <option value="Other">Other Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Customer Stated Return Reason *</label>
                  <textarea
                    rows={2}
                    required
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    placeholder="Details stated by client..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 shadow-md shadow-blue-500/20"
                  >
                    Create RMA Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* INSPECT & UPDATE RMA STATUS MODAL */}
        {isInspectModalOpen && selectedReturn && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsInspectModalOpen(false);
            }}
          >
            <div className="erp-card w-full max-w-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-2xl rounded-2xl my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-blue-600" /> Inspect & Process RMA {selectedReturn.returnNumber}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Product: <span className="text-blue-600 font-semibold">{selectedReturn.productName}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInspectModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition flex items-center justify-center"
                  title="Close Form"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveInspection} className="space-y-4 text-xs">
                {/* Summary Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-medium">Customer:</span>
                    <div className="font-bold text-slate-900">{selectedReturn.customerName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Invoice Ref:</span>
                    <div className="font-mono text-blue-600 font-bold">{selectedReturn.salesInvoice}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 font-medium">Customer Reason:</span>
                    <div className="text-slate-800 font-medium">{selectedReturn.returnReason}</div>
                  </div>
                </div>

                {/* Form Fields for 8 Requirements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Defective / Claim Type Category *</label>
                    <select
                      value={inspectClaimType}
                      onChange={(e) => setInspectClaimType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="Defective">Defective Product</option>
                      <option value="Wrong Product">Wrong Product Shipped</option>
                      <option value="Warranty">Warranty Claim</option>
                      <option value="Transit Damage">Transit / Packaging Damage</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Overall RMA Status *</label>
                    <select
                      value={inspectStatus}
                      onChange={(e) => setInspectStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="Requested">Requested</option>
                      <option value="Received">Received</option>
                      <option value="Under Inspection">Under Inspection</option>
                      <option value="Repair Required">Repair Required</option>
                      <option value="Replacement Required">Replacement Required</option>
                      <option value="Repaired">Repaired (Restock FG)</option>
                      <option value="Replaced">Replaced (Issue Stock)</option>
                      <option value="Damaged">Damaged (Mark Scrapped)</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Returned Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={inspectReturnedQty}
                      onChange={(e) => setInspectReturnedQty(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Replacement Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={inspectReplacementQty}
                      onChange={(e) => setInspectReplacementQty(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Repair Bench Status *</label>
                    <select
                      value={inspectRepairStatus}
                      onChange={(e) => setInspectRepairStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Under Bench Inspection">Under Bench Inspection</option>
                      <option value="In Repair">In Repair</option>
                      <option value="Repaired & Tested">Repaired & Tested</option>
                      <option value="Beyond Repair (Scrapped)">Beyond Repair (Scrapped)</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Technical Defect Diagnosis</label>
                  <input
                    type="text"
                    placeholder="e.g. Broken pin connector ground wire"
                    value={inspectDefect}
                    onChange={(e) => setInspectDefect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">QA Inspection Bench Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Detailed findings during bench testing..."
                    value={inspectNotes}
                    onChange={(e) => setInspectNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Final Action Taken *</label>
                    <input
                      type="text"
                      placeholder="e.g. Replaced & Dispatched / Repaired & Restocked / Refund Issued"
                      value={inspectFinalAction}
                      onChange={(e) => setInspectFinalAction(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">RMA Closing Date</label>
                    <input
                      type="date"
                      value={inspectClosingDate}
                      onChange={(e) => setInspectClosingDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsInspectModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 shadow-md shadow-blue-500/20"
                  >
                    Save Inspection Record
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
