'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RAW_MATERIAL_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { MaterialConsumption } from '@/types/erp';
import {
  Factory,
  Plus,
  Search,
  AlertTriangle,
  X,
  CheckCircle2,
  Boxes,
  User,
  ShieldAlert,
  ArrowDownRight,
} from 'lucide-react';

export default function MaterialConsumptionPage() {
  const {
    materialConsumptions,
    rawMaterials,
    productionOrders,
    createMaterialConsumption,
    refreshRawMaterialsFromDB,
  } = useERP();

  React.useEffect(() => {
    refreshRawMaterialsFromDB();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const [selectedMaterialId, setSelectedMaterialId] = useState(rawMaterials[0]?.id || '');
  const [selectedProdOrderId, setSelectedProdOrderId] = useState('');
  const [customOrderRef, setCustomOrderRef] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [date, setDate] = useState(today);
  const [userName, setUserName] = useState('Production Engineer');
  const [notes, setNotes] = useState('');
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [formError, setFormError] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const selectedMaterial = useMemo(
    () => rawMaterials.find((r) => r.id === selectedMaterialId),
    [rawMaterials, selectedMaterialId]
  );

  const filteredConsumptions = useMemo(() => {
    return materialConsumptions.filter((c) => {
      return (
        c.consumptionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.rawMaterialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.productionOrderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.user.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [materialConsumptions, searchTerm]);

  const handleSubmitConsumption = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedMaterialId) {
      setFormError('Please select a Raw Material.');
      return;
    }
    if (quantity <= 0) {
      setFormError('Consumption quantity must be greater than 0.');
      return;
    }

    const rm = rawMaterials.find((r) => r.id === selectedMaterialId);
    if (!rm) return;

    const prodOrderRef = selectedProdOrderId || customOrderRef || 'General Requisition';

    const result = createMaterialConsumption(
      {
        rawMaterialId: rm.id,
        rawMaterialName: rm.name,
        sku: rm.sku,
        quantity,
        unit: rm.unit,
        productionOrderId: prodOrderRef,
        date,
        user: userName,
        notes,
      },
      allowNegativeStock
    );

    if (result.success) {
      showToast(
        `Issued ${quantity} ${rm.unit} of ${rm.name}. Stock decreased from ${rm.currentStock} to ${
          rm.currentStock - quantity
        } ${rm.unit}.`
      );
      setIsAddModalOpen(false);
      setQuantity(10);
      setNotes('');
    } else {
      setFormError(result.message || 'Failed to record consumption.');
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
              <Factory className="w-6 h-6 text-blue-600" /> Material Consumption Tracking
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Record shopfloor raw material issuance for manufacturing builds. Stock decreases automatically upon consumption.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedMaterialId(rawMaterials[0]?.id || '');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-900/10 transition"
          >
            <Plus className="w-4 h-4 text-white" /> Issue Material Consumption
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Consumption ID, Material, SKU, Order Ref, User..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm transition"
            />
          </div>
        </div>

        {/* Consumptions Data Table */}
        <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Consumption ID</th>
                  <th className="py-3 px-4">Material Code</th>
                  <th className="py-3 px-4">Material Name</th>
                  <th className="py-3 px-4">Consumed Qty</th>
                  <th className="py-3 px-4">Production Order Ref</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Issued To / User</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredConsumptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No material consumption logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredConsumptions.map((mc) => (
                    <tr key={mc.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{mc.consumptionId}</td>
                      <td className="py-3 px-4 font-mono text-blue-700 font-semibold">{mc.sku}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-[180px] truncate">
                        {mc.rawMaterialName}
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-700">
                        -{mc.quantity} {mc.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-mono font-medium">
                        {mc.productionOrderId || 'General'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{mc.date}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{mc.user}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[160px]">
                        {mc.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: RECORD CONSUMPTION */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                    <Factory className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Record Shopfloor Material Consumption</h3>
                    <p className="text-xs text-slate-600">Deduct raw component stock for production</p>
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

              <form onSubmit={handleSubmitConsumption} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Select Raw Material <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    {rawMaterials.map((rm) => (
                      <option key={rm.id} value={rm.id}>
                        {rm.name} ({rm.sku}) - Current Stock: {rm.currentStock} {rm.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMaterial && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-medium">
                    <div>
                      <span className="text-slate-600">Available Stock:</span>{' '}
                      <span className="text-emerald-700 font-bold">
                        {selectedMaterial.currentStock} {selectedMaterial.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Min Safety Stock:</span>{' '}
                      <span className="text-amber-700 font-bold">{selectedMaterial.minStock}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Consumption Quantity <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition"
                      />
                      <span className="text-xs font-mono text-slate-600 font-bold">
                        {selectedMaterial?.unit || 'PCS'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Consumption Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Production Build Order Ref
                    </label>
                    <select
                      value={selectedProdOrderId}
                      onChange={(e) => {
                        setSelectedProdOrderId(e.target.value);
                        if (e.target.value) setCustomOrderRef('');
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    >
                      <option value="">-- Custom Order / General Requisition --</option>
                      {productionOrders.map((p) => (
                        <option key={p.id} value={p.orderNumber}>
                          {p.orderNumber} ({p.finishedGoodName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!selectedProdOrderId && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Custom Order Ref / Batch #
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BATCH-2026-99"
                        value={customOrderRef}
                        onChange={(e) => setCustomOrderRef(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Engineer / Requisition User
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Verma"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Insufficient Stock Check Warning */}
                {selectedMaterial && quantity > selectedMaterial.currentStock && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between font-medium">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Stock deficit warning: Requested quantity exceeds current available stock.</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Admin Override</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowNegativeStock}
                      onChange={(e) => setAllowNegativeStock(e.target.checked)}
                      className="rounded bg-white border-slate-300 text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-600 font-medium">Allow negative stock consumption</span>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Requisition Purpose</label>
                  <textarea
                    rows={2}
                    placeholder="Enter reason for consumption or assembly line details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
                    Issue Material & Deduct Stock
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
