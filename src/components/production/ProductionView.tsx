'use client';

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ProductionOrder } from '../../types/erp';
import {
  Hammer,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  X,
  AlertTriangle,
  User,
  Boxes,
  ArrowRight,
} from 'lucide-react';

export const ProductionView: React.FC = () => {
  const {
    productionOrders,
    createProductionOrder,
    completeProductionOrder,
    finishedGoods,
    rawMaterials,
  } = useERP();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Omit<ProductionOrder, 'id' | 'orderNumber'>>({
    finishedGoodId: finishedGoods[0]?.id || '',
    finishedGoodName: finishedGoods[0]?.name || '',
    quantityToProduce: 100,
    status: 'PENDING',
    startDate: new Date().toISOString().split('T')[0],
    assignedEngineer: 'Ramesh Verma (Production Lead)',
    notes: 'Assembly line #1 batch.',
  });

  const selectedGood = finishedGoods.find((g) => g.id === formData.finishedGoodId);

  const handleSelectFinishedGood = (id: string) => {
    const fg = finishedGoods.find((g) => g.id === id);
    if (fg) {
      setFormData({
        ...formData,
        finishedGoodId: fg.id,
        finishedGoodName: fg.name,
      });
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    createProductionOrder(formData);
    setShowModal(false);
  };

  const handleCompleteAssembly = (id: string) => {
    const success = completeProductionOrder(id);
    if (success) {
      alert('Production Batch Completed! Raw materials deducted & Finished product stock updated successfully.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 erp-card p-5 bg-white border border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-amber-600" /> Production & Work Order Assembly Line
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Execute assembly work orders, deduct raw component stock automatically, and build finished OBD cables.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-900/10 transition"
        >
          <Plus className="w-4 h-4 text-white" /> Schedule New Assembly Build
        </button>
      </div>

      {/* Production Pipeline Orders List */}
      <div className="space-y-3">
        {productionOrders.map((order) => {
          const isCompleted = order.status === 'COMPLETED';
          const isInProgress = order.status === 'IN_PROGRESS';
          const targetGood = finishedGoods.find((g) => g.id === order.finishedGoodId);

          return (
            <div
              key={order.id}
              className={`erp-card p-5 border transition bg-white shadow-sm ${
                isCompleted
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : isInProgress
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Order Information */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isInProgress
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{order.finishedGoodName}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" /> {order.assignedEngineer}
                    </span>
                    <span>Start Date: {order.startDate}</span>
                    {order.completionDate && <span>Completed: {order.completionDate}</span>}
                  </div>
                </div>

                {/* Build Quantity & Trigger Action */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-600 block font-medium">Batch Volume</span>
                    <span className="text-xl font-extrabold text-slate-900">{order.quantityToProduce} Units</span>
                  </div>

                  {!isCompleted ? (
                    <button
                      onClick={() => handleCompleteAssembly(order.id)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/10 transition"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" /> Complete & Deduct Materials
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-emerald-800 font-bold px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Stock Updated
                    </div>
                  )}
                </div>
              </div>

              {/* BOM Materials Preview for Order */}
              {targetGood && targetGood.bom.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-700 mb-2 block">
                    Required Material Stock Deduction for {order.quantityToProduce} Units:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    {targetGood.bom.map((b, i) => {
                      const rm = rawMaterials.find((r) => r.id === b.rawMaterialId);
                      const required = b.quantityRequired * order.quantityToProduce;
                      const hasSufficient = rm ? rm.currentStock >= required : false;

                      return (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border ${
                            hasSufficient ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-300 text-rose-900'
                          }`}
                        >
                          <span className="text-slate-900 font-semibold block truncate">{rm?.name}</span>
                          <span className="text-slate-600 text-[10px] font-medium">
                            Req: <strong className="text-slate-900">{required}</strong> {rm?.unit} (Avail: {rm?.currentStock})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Schedule Assembly Build Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl p-6 relative text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Schedule New Work Order Batch</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Target Finished OBD Product
                </label>
                <select
                  value={formData.finishedGoodId}
                  onChange={(e) => handleSelectFinishedGood(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                >
                  {finishedGoods.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Units Volume to Produce
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantityToProduce}
                    onChange={(e) => setFormData({ ...formData, quantityToProduce: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Assigned Engineer</label>
                  <input
                    type="text"
                    required
                    value={formData.assignedEngineer}
                    onChange={(e) => setFormData({ ...formData, assignedEngineer: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Assembly Line Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
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
                  Schedule Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
