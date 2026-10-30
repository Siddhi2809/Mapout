'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RAW_MATERIAL_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { MaterialReceipt, MaterialReceiptItem } from '@/types/erp';
import {
  FileCheck,
  Plus,
  Search,
  Eye,
  AlertTriangle,
  X,
  CheckCircle2,
  Package,
  Check,
  XCircle,
  ShieldAlert,
} from 'lucide-react';

export default function MaterialReceiptsPage() {
  const {
    materialReceipts,
    purchaseOrders,
    rawMaterials,
    createMaterialReceipt,
    refreshRawMaterialsFromDB,
  } = useERP();

  useEffect(() => {
    refreshRawMaterialsFromDB();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<MaterialReceipt | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [selectedPOId, setSelectedPOId] = useState('');
  const [receiptDate, setReceiptDate] = useState(today);
  const [remarks, setRemarks] = useState('');
  const [allowOverReceive, setAllowOverReceive] = useState(false);

  // Receipt Line Items loaded from selected PO
  const [receiptItems, setReceiptItems] = useState<MaterialReceiptItem[]>([]);
  const [formError, setFormError] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // When user selects a Purchase Order, auto-populate item rows with ordered, previously received, and remaining quantities!
  const handleSelectPO = (poId: string) => {
    setSelectedPOId(poId);
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) {
      setReceiptItems([]);
      return;
    }

    const itemsForReceipt: MaterialReceiptItem[] = po.items.map((poItem) => {
      // Find previously received qty from materialReceipts for this PO
      let prevRec = 0;
      materialReceipts
        .filter((r) => r.poId === poId)
        .forEach((r) => {
          const matchingItem = r.items.find((i) => i.rawMaterialId === poItem.rawMaterialId);
          if (matchingItem) {
            prevRec += matchingItem.acceptedQuantity;
          }
        });

      const remaining = Math.max(0, poItem.quantity - prevRec);

      return {
        rawMaterialId: poItem.rawMaterialId,
        rawMaterialName: poItem.rawMaterialName,
        sku: poItem.sku,
        orderedQuantity: poItem.quantity,
        previouslyReceived: prevRec,
        remainingQuantity: remaining,
        receivedQuantity: remaining,
        acceptedQuantity: remaining,
        rejectedQuantity: 0,
        reasonForRejection: '',
      };
    });

    setReceiptItems(itemsForReceipt);
  };

  const filteredReceipts = useMemo(() => {
    return materialReceipts.filter((rec) => {
      return (
        rec.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [materialReceipts, searchTerm]);

  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedPOId) {
      setFormError('Please select a Purchase Order.');
      return;
    }
    if (receiptItems.length === 0) {
      setFormError('No items loaded for this Purchase Order.');
      return;
    }

    const po = purchaseOrders.find((p) => p.id === selectedPOId);
    if (!po) return;

    const result = createMaterialReceipt(
      {
        poId: selectedPOId,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        receiptDate,
        items: receiptItems,
        totalItems: receiptItems.length,
        receivedQuantity: receiptItems.reduce((acc, i) => acc + i.receivedQuantity, 0),
        acceptedQuantity: receiptItems.reduce((acc, i) => acc + i.acceptedQuantity, 0),
        rejectedQuantity: receiptItems.reduce((acc, i) => acc + i.rejectedQuantity, 0),
        status: 'Completed',
        remarks,
        createdBy: 'Store Incharge',
      },
      allowOverReceive
    );

    if (result.success) {
      showToast(
        `Material Receipt recorded! Inventory stock increased by ${receiptItems.reduce(
          (acc, i) => acc + i.acceptedQuantity,
          0
        )} accepted units.`
      );
      setIsAddModalOpen(false);
      setSelectedPOId('');
      setReceiptItems([]);
    } else {
      setFormError(result.message || 'Failed to create receipt.');
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

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-blue-600" /> Material Inward Receipts (GRN)
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Verify incoming raw component shipments against PO line items. Stock automatically updates by accepted quantity only.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedPOId('');
              setReceiptItems([]);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-900/10 transition"
          >
            <Plus className="w-4 h-4 text-white" /> Record Material Receipt
          </button>
        </div>

        {/* Toolbar */}
        <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Receipt Number, PO Number, Supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm transition"
            />
          </div>
        </div>

        {/* Material Receipts Table */}
        <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt Number</th>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Receipt Date</th>
                  <th className="py-3 px-4">Total Items</th>
                  <th className="py-3 px-4 text-blue-700 font-bold">Received Qty</th>
                  <th className="py-3 px-4 text-emerald-700 font-bold">Accepted Qty</th>
                  <th className="py-3 px-4 text-rose-700 font-bold">Rejected Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No material receipts recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{rec.receiptNumber}</td>
                      <td className="py-3 px-4 font-mono text-blue-700 font-semibold">{rec.poNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-[140px] truncate">{rec.supplierName}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{rec.receiptDate}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{rec.totalItems}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{rec.receivedQuantity}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">+{rec.acceptedQuantity}</td>
                      <td className="py-3 px-4 font-bold text-rose-700">
                        {rec.rejectedQuantity > 0 ? `-${rec.rejectedQuantity}` : '0'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewingReceipt(rec)}
                          title="View Inward Verification Details"
                          className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: RECORD MATERIAL RECEIPT */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Record Material Inward Receipt</h3>
                    <p className="text-xs text-slate-600">Physical verification & QA acceptance form</p>
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

              <form onSubmit={handleSubmitReceipt} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Select Purchase Order <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={selectedPOId}
                      onChange={(e) => handleSelectPO(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    >
                      <option value="">-- Choose PO --</option>
                      {purchaseOrders
                        .filter((p) => p.status !== 'Cancelled' && p.status !== 'Received')
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.poNumber} | {p.supplierName} ({p.status})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Receipt Date</label>
                    <input
                      type="date"
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Items Verification Entry */}
                {selectedPOId && receiptItems.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" /> Ordered Items Inspection
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-800">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Material</th>
                            <th className="py-2.5 px-3">Ordered Qty</th>
                            <th className="py-2.5 px-3">Prev. Received</th>
                            <th className="py-2.5 px-3 text-amber-800 font-bold">Remaining Qty</th>
                            <th className="py-2.5 px-3">Received Qty</th>
                            <th className="py-2.5 px-3 text-emerald-800 font-bold">Accepted Qty</th>
                            <th className="py-2.5 px-3 text-rose-800 font-bold">Rejected Qty</th>
                            <th className="py-2.5 px-3">Rejection Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {receiptItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{item.rawMaterialName}</div>
                                <div className="text-[10px] text-blue-700 font-mono font-semibold">{item.sku}</div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">
                                {item.orderedQuantity}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">
                                {item.previouslyReceived}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-800">
                                {item.remainingQuantity}
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.receivedQuantity}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const updated = [...receiptItems];
                                    updated[idx].receivedQuantity = val;
                                    updated[idx].acceptedQuantity = val - updated[idx].rejectedQuantity;
                                    setReceiptItems(updated);
                                  }}
                                  className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="number"
                                  min={0}
                                  max={item.receivedQuantity}
                                  value={item.acceptedQuantity}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const updated = [...receiptItems];
                                    updated[idx].acceptedQuantity = val;
                                    updated[idx].rejectedQuantity = Math.max(
                                      0,
                                      updated[idx].receivedQuantity - val
                                    );
                                    setReceiptItems(updated);
                                  }}
                                  className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-emerald-700 font-bold focus:outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-3 font-bold text-rose-700">
                                {item.rejectedQuantity}
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  placeholder="e.g. Pin damage / Bent pins"
                                  disabled={item.rejectedQuantity === 0}
                                  value={item.reasonForRejection || ''}
                                  onChange={(e) => {
                                    const updated = [...receiptItems];
                                    updated[idx].reasonForRejection = e.target.value;
                                    setReceiptItems(updated);
                                  }}
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 placeholder-slate-400 disabled:opacity-40 focus:outline-none"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Over-receive Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Admin Over-Receiving Override</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowOverReceive}
                      onChange={(e) => setAllowOverReceive(e.target.checked)}
                      className="rounded bg-white border-slate-300 text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-600 font-medium">Allow receiving more than remaining PO quantity</span>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Remarks / Quality Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Enter physical condition, vehicle number, or QA notes..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
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
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/10"
                  >
                    Accept Receipt & Increment Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: VIEW RECEIPT DETAILS - PROFESSIONAL PDF / BILL STYLE RECEIPT */}
        {viewingReceipt && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-300 rounded-2xl max-w-3xl w-full p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[95vh] text-slate-900">
              
              {/* Header Actions */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <FileCheck className="w-4 h-4 text-blue-600" /> Official Goods Receipt Note (GRN) Voucher
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    Print / Download PDF
                  </button>
                  <button
                    onClick={() => setViewingReceipt(null)}
                    className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* PDF RECEIPT STYLED BODY */}
              <div className="border border-slate-300 rounded-xl p-6 bg-white space-y-6 shadow-sm font-sans">
                
                {/* Company & Receipt Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <img src="/logo.png" alt="Mapout ERP" className="h-10 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      <span className="text-xl font-black text-slate-900 tracking-tight">MAPOUT ERP</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Industrial Electronics & Assembly Division</p>
                    <p className="text-[11px] text-slate-500">Warehouse & Receiving Dock #1</p>
                  </div>

                  <div className="text-left sm:text-right border-l sm:border-l-0 pl-4 sm:pl-0 border-slate-200">
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold uppercase tracking-wider inline-block">
                      GOODS RECEIPT NOTE
                    </span>
                    <h2 className="text-lg font-mono font-bold text-slate-900 mt-1">{viewingReceipt.receiptNumber}</h2>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">Date: <span className="font-semibold text-slate-900">{viewingReceipt.receiptDate}</span></p>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">PO Reference:</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">{viewingReceipt.poNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Supplier Name:</span>
                    <span className="font-bold text-slate-900 text-sm truncate block">{viewingReceipt.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Received By:</span>
                    <span className="font-semibold text-slate-800">{viewingReceipt.createdBy || 'Store Manager'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Receipt Status:</span>
                    <span className="font-bold text-emerald-700">{viewingReceipt.status}</span>
                  </div>
                </div>

                {/* Material Receipt Items Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Received Items Inspection Breakdown</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Material Code</th>
                          <th className="py-2.5 px-3">Material Description</th>
                          <th className="py-2.5 px-3 text-right">Received Qty</th>
                          <th className="py-2.5 px-3 text-right text-emerald-800">Accepted Qty</th>
                          <th className="py-2.5 px-3 text-right text-rose-800">Rejected Qty</th>
                          <th className="py-2.5 px-3">Remarks / QA Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        {viewingReceipt.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{item.sku}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">{item.rawMaterialName}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">{item.receivedQuantity}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">+{item.acceptedQuantity}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                              {item.rejectedQuantity > 0 ? `-${item.rejectedQuantity}` : '0'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 italic">
                              {item.reasonForRejection || 'Passed Quality Verification'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                        <tr>
                          <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[11px] text-slate-600">Total Quantities Summary:</td>
                          <td className="py-2.5 px-3 text-right font-black">{viewingReceipt.receivedQuantity}</td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-700">+{viewingReceipt.acceptedQuantity}</td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-700">
                            {viewingReceipt.rejectedQuantity > 0 ? `-${viewingReceipt.rejectedQuantity}` : '0'}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Quality Notes & Signatures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 block mb-1">Store / Quality Inspector Remarks:</span>
                    <p className="text-slate-600 italic leading-relaxed">{viewingReceipt.remarks || 'Shipment inspected and verified against Purchase Order. All accepted quantities credited to active raw material stock balance.'}</p>
                  </div>

                  <div className="flex justify-around items-end pt-6 text-center text-xs">
                    <div className="border-t border-slate-400 pt-1.5 px-4">
                      <span className="font-semibold text-slate-700 block">Received By (Store)</span>
                      <span className="text-[10px] text-slate-400">Signature & Date</span>
                    </div>
                    <div className="border-t border-slate-400 pt-1.5 px-4">
                      <span className="font-semibold text-slate-700 block">Quality Verified By</span>
                      <span className="text-[10px] text-slate-400">Signature & Date</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end border-t border-slate-200 pt-4 print:hidden">
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  Close Receipt
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

