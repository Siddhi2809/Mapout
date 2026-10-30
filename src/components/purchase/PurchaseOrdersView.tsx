'use client';

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { PurchaseOrder, PurchaseOrderItem } from '../../types/erp';
import { Truck, Plus, CheckCircle, Clock, X, PackageCheck } from 'lucide-react';

export const PurchaseOrdersView: React.FC = () => {
  const {
    purchaseOrders,
    createPurchaseOrder,
    receivePurchaseOrder,
    suppliers,
    rawMaterials,
  } = useERP();

  const [showModal, setShowModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');

  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([
    {
      rawMaterialId: rawMaterials[0]?.id || '',
      rawMaterialName: rawMaterials[0]?.name || '',
      sku: rawMaterials[0]?.sku || '',
      quantity: 500,
      unitCost: rawMaterials[0]?.unitCost || 45,
      totalCost: (rawMaterials[0]?.unitCost || 45) * 500,
    },
  ]);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  const handleAddItemRow = () => {
    const rm = rawMaterials[0];
    if (!rm) return;
    setPoItems([
      ...poItems,
      {
        rawMaterialId: rm.id,
        rawMaterialName: rm.name,
        sku: rm.sku,
        quantity: 100,
        unitCost: rm.unitCost,
        totalCost: rm.unitCost * 100,
      },
    ]);
  };

  const handleUpdateItem = (index: number, rawMaterialId: string, quantity: number) => {
    const rm = rawMaterials.find((r) => r.id === rawMaterialId);
    if (!rm) return;
    const updated = [...poItems];
    updated[index] = {
      rawMaterialId: rm.id,
      rawMaterialName: rm.name,
      sku: rm.sku,
      quantity,
      unitCost: rm.unitCost,
      totalCost: rm.unitCost * quantity,
    };
    setPoItems(updated);
  };

  const totalAmount = poItems.reduce((acc, i) => acc + i.totalCost, 0);

  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    createPurchaseOrder({
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: poItems,
      totalAmount,
      amountPaid: 0,
      paymentStatus: 'UNPAID',
      status: 'SENT',
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 erp-card p-5 bg-white border border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" /> Purchase Orders & Raw Stock Procurement
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Order raw connectors, wire spools, ABS casings from vendors, and restock inventory upon delivery.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-900/10 transition"
        >
          <Plus className="w-4 h-4 text-white" /> Issue Purchase Order
        </button>
      </div>

      {/* PO List */}
      <div className="space-y-4">
        {purchaseOrders.map((po) => {
          const isReceived = po.status === 'RECEIVED';

          return (
            <div key={po.id} className="erp-card p-5 space-y-4 bg-white border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                      {po.poNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isReceived ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      Status: {po.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">Vendor: {po.supplierName}</h3>
                  <div className="text-xs text-slate-600">Order Date: {po.orderDate} | Expected: {po.expectedDate}</div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-600 block">Total PO Value</span>
                  <span className="text-xl font-extrabold text-amber-800">₹{po.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1">
                {po.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-800 py-1 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-900">
                      {item.rawMaterialName} <span className="text-[10px] text-slate-500 font-mono">({item.sku})</span>
                    </span>
                    <span className="font-semibold text-slate-700">
                      {item.quantity} units @ ₹{item.unitCost} = <span className="font-bold text-amber-800">₹{item.totalCost.toLocaleString('en-IN')}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Receive Action */}
              <div className="pt-3 border-t border-slate-200 flex justify-end">
                {!isReceived ? (
                  <button
                    onClick={() => {
                      receivePurchaseOrder(po.id);
                      alert(`Purchase Order ${po.poNumber} received! Raw material stock restocked.`);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/10 transition"
                  >
                    <PackageCheck className="w-4 h-4 text-white" /> Receive Delivery & Restock Raw Inventory
                  </button>
                ) : (
                  <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Delivery Received & Inventory Credited
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl p-6 relative text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Issue Purchase Order to Supplier</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPO} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Select Supplier Vendor</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Raw Material Items</span>
                  <button type="button" onClick={handleAddItemRow} className="text-xs text-amber-700 font-semibold hover:underline">
                    + Add Item
                  </button>
                </div>

                {poItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                    <select
                      value={item.rawMaterialId}
                      onChange={(e) => handleUpdateItem(idx, e.target.value, item.quantity)}
                      className="flex-1 bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900 focus:outline-none"
                    >
                      {rawMaterials.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} - ₹{r.unitCost}/{r.unit}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(idx, item.rawMaterialId, Number(e.target.value))}
                      className="w-20 bg-white border border-slate-300 rounded p-1.5 text-xs text-center text-slate-900 font-bold focus:outline-none"
                    />

                    <span className="w-24 text-right font-mono text-amber-800 font-bold">
                      ₹{item.totalCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between font-bold text-slate-900 text-xs">
                <span>Total PO Amount:</span>
                <span className="text-amber-800 font-extrabold text-sm">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow-lg"
                >
                  Send Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
