'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { PurchaseOrder } from '@/types/erp';
import {
  ShoppingCart,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  X,
  FileText,
} from 'lucide-react';

export default function AdminPurchaseOrdersPage() {
  const {
    purchaseOrders,
    suppliers,
    rawMaterials,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    receivePurchaseOrder,
    refreshRawMaterialsFromDB,
  } = useERP();

  React.useEffect(() => {
    refreshRawMaterialsFromDB();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [poForm, setPoForm] = useState({
    supplierId: '',
    supplierName: '',
    rawMaterialId: '',
    rawMaterialName: '',
    sku: '',
    quantity: '100',
    unitCost: '50',
    deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchSearch =
        po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter ? po.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [purchaseOrders, searchQuery, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.supplierId || !poForm.rawMaterialName) return;

    const qty = parseInt(poForm.quantity || '100');
    const rate = parseFloat(poForm.unitCost || '50');
    const subtotal = qty * rate;
    const gst = subtotal * 0.18;
    const total = subtotal + gst;

    const newPO: any = {
      poNumber: `PO-${Date.now().toString().slice(-4)}`,
      supplierId: poForm.supplierId,
      supplierName: poForm.supplierName,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: poForm.deliveryDate,
      subtotal,
      gstAmount: gst,
      totalAmount: total,
      status: 'Pending',
      items: [
        {
          id: `item_${Date.now()}`,
          rawMaterialId: poForm.rawMaterialId || 'rm_gen',
          rawMaterialName: poForm.rawMaterialName,
          sku: poForm.sku || 'RM-SKU',
          quantity: qty,
          receivedQuantity: 0,
          unitCost: rate,
          gstPercent: 18,
          totalCost: total,
        },
      ],
    };

    createPurchaseOrder(newPO);

    try {
      await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPO),
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchase Orders (PO)</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {purchaseOrders.length} Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized procurement control: review raw material purchase orders, vendor rates, and delivery commitments.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Issue Purchase Order
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search PO #, supplier name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Received">Received / Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* POs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">PO Number</th>
                <th className="px-4 py-3.5">Supplier / Vendor</th>
                <th className="px-4 py-3.5">Materials Ordered</th>
                <th className="px-4 py-3.5 text-right">Total Amount</th>
                <th className="px-4 py-3.5">Order Date</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPOs.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900 font-mono">
                    {po.poNumber}
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-900">
                    {po.supplierName}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-800">
                      {po.items && po.items[0] ? po.items[0].rawMaterialName : 'Material Item'}
                    </div>
                    {po.items && po.items.length > 1 && (
                      <div className="text-[10px] text-slate-400">+{po.items.length - 1} other items</div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right font-black text-slate-900 text-sm">
                    ₹{(po.totalAmount || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {po.orderDate}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        po.status === 'Received' || po.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {po.status !== 'Received' && (
                        <button
                          onClick={async () => {
                            await receivePurchaseOrder(po.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Receive
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedPO(po)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPOs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View PO Details */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">PO #{selectedPO.poNumber}</h3>
                <div className="text-xs text-slate-500">Vendor: {selectedPO.supplierName}</div>
              </div>
              <button onClick={() => setSelectedPO(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-2">
                <div className="font-bold text-slate-800">Materials In This PO & Inventory Impact:</div>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {selectedPO.items?.map((item, idx) => {
                    const liveRm = rawMaterials.find(
                      (r) =>
                        r.id === item.rawMaterialId ||
                        r.sku === item.sku ||
                        r.name.toLowerCase() === item.rawMaterialName.toLowerCase()
                    );
                    const curStock = liveRm ? liveRm.currentStock : 0;
                    const isRec = selectedPO.status === 'Received';
                    const resulting = isRec ? curStock : curStock + item.quantity;

                    return (
                      <div key={item.rawMaterialId || idx} className="p-3 bg-slate-50/40 space-y-1">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800">{item.rawMaterialName}</span>
                            <span className="ml-2 font-mono text-[10px] text-blue-600 font-bold">{item.sku}</span>
                          </div>
                          <div className="font-bold text-slate-900">₹{(item.totalCost || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-slate-500">
                            Current Stock: <strong className="text-slate-800">{curStock} {item.unit || 'PCS'}</strong>
                          </span>
                          <span className="text-blue-700 font-bold">PO Qty: +{item.quantity}</span>
                          <span className="text-emerald-700 font-bold">
                            → Resulting: {resulting} {item.unit || 'PCS'} {isRec ? '(In Stock)' : '(Projected)'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">Total Purchase Value:</span>
                <span className="text-base font-black text-blue-700">
                  ₹{(selectedPO.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                {selectedPO.status !== 'Received' ? (
                  <button
                    onClick={async () => {
                      await receivePurchaseOrder(selectedPO.id);
                      setSelectedPO({ ...selectedPO, status: 'Received' });
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" /> Mark Received & Add to Stock
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Stock Added & Received in Database
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add PO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Issue New Purchase Order</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Vendor *</label>
                <select
                  required
                  value={poForm.supplierId}
                  onChange={(e) => {
                    const sup = suppliers.find((s) => s.id === e.target.value);
                    setPoForm({
                      ...poForm,
                      supplierId: e.target.value,
                      supplierName: sup ? sup.name : '',
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

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Raw Material *</label>
                <select
                  required
                  value={poForm.rawMaterialId}
                  onChange={(e) => {
                    const rm = rawMaterials.find((m) => m.id === e.target.value);
                    setPoForm({
                      ...poForm,
                      rawMaterialId: e.target.value,
                      rawMaterialName: rm ? rm.name : '',
                      sku: rm ? rm.sku : '',
                      unitCost: rm ? String(rm.unitCost) : '50',
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Choose Material Item --</option>
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.sku})
                    </option>
                  ))}
                </select>
                {poForm.rawMaterialId && (() => {
                  const rm = rawMaterials.find((m) => m.id === poForm.rawMaterialId);
                  const cur = rm ? rm.currentStock : 0;
                  const add = parseInt(poForm.quantity || '0', 10);
                  return (
                    <div className="mt-1 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between font-medium">
                      <span>Current Stock: <strong>{cur} {rm?.unit || 'PCS'}</strong></span>
                      <span>Purchase: <strong>+{add}</strong></span>
                      <span className="font-bold text-emerald-900">Projected: {cur + add} {rm?.unit || 'PCS'}</span>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Order Quantity</label>
                  <input
                    type="number"
                    required
                    value={poForm.quantity}
                    onChange={(e) => setPoForm({ ...poForm, quantity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={poForm.unitCost}
                    onChange={(e) => setPoForm({ ...poForm, unitCost: e.target.value })}
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
                  Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
