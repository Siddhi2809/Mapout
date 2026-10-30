'use client';

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { FinishedGood } from '../../types/erp';
import {
  PackageCheck,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Layers,
  IndianRupee,
  Cpu,
} from 'lucide-react';

export const FinishedGoodsView: React.FC = () => {
  const { finishedGoods, addFinishedGood, updateFinishedGood, deleteFinishedGood, rawMaterials } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FinishedGood | null>(null);
  const [formData, setFormData] = useState<Omit<FinishedGood, 'id'>>({
    sku: '',
    name: '',
    modelNumber: '',
    category: 'OBD Cable',
    currentStock: 50,
    minStock: 20,
    sellingPrice: 799,
    manufacturingCost: 250,
    bom: [],
    description: '',
  });

  const categories = ['OBD Cable', 'OBD Splitter', 'GPS Tracker Harness', 'Diagnostic Adapter', 'Custom Harness'];

  const filteredGoods = finishedGoods.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.modelNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (item?: FinishedGood) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        sku: item.sku,
        name: item.name,
        modelNumber: item.modelNumber,
        category: item.category,
        currentStock: item.currentStock,
        minStock: item.minStock,
        sellingPrice: item.sellingPrice,
        manufacturingCost: item.manufacturingCost,
        bom: item.bom,
        description: item.description,
      });
    } else {
      setEditingItem(null);
      setFormData({
        sku: `FG-OBD-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        modelNumber: `MO-MOD-${Math.floor(10 + Math.random() * 90)}`,
        category: 'OBD Cable',
        currentStock: 100,
        minStock: 30,
        sellingPrice: 899,
        manufacturingCost: 280,
        bom: [],
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateFinishedGood(editingItem.id, formData);
    } else {
      addFinishedGood(formData);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 erp-card p-5 bg-white border border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-blue-600" /> Finished Goods & Product Catalog
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Assembled OBD products ready for wholesale distribution & B2B sales dispatch.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/10 transition"
        >
          <Plus className="w-4 h-4 text-white" /> Add Finished Product
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search finished products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Finished Goods Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGoods.map((item) => {
          const isLowStock = item.currentStock <= item.minStock;
          const grossMargin = item.sellingPrice - item.manufacturingCost;
          const marginPercent = ((grossMargin / item.sellingPrice) * 100).toFixed(1);

          return (
            <div key={item.id} className="erp-card p-4 flex flex-col justify-between erp-card-interactive bg-white border border-slate-200 shadow-sm">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                      {item.sku}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">{item.name}</h3>
                  </div>
                  <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono border border-slate-200 font-semibold">
                    {item.modelNumber}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-2 line-clamp-2">{item.description}</p>

                {/* Stock Level Indicator */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Inventory Stock:</span>
                    <span className={`font-bold ${item.currentStock === 0 ? 'text-rose-700 font-black flex items-center gap-1' : isLowStock ? 'text-amber-700 flex items-center gap-1' : 'text-emerald-700'}`}>
                      {item.currentStock === 0 ? 'OUT OF STOCK (0 Units)' : `${item.currentStock} Units`}
                      {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.currentStock === 0 ? 'bg-rose-600' : isLowStock ? 'bg-amber-500' : 'bg-emerald-600'}`}
                      style={{ width: `${Math.min((item.currentStock / (item.minStock * 3)) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Pricing & Margin Breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-medium">Selling Price</span>
                    <span className="font-extrabold text-slate-900">₹{item.sellingPrice}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-medium">Mfg Cost</span>
                    <span className="font-bold text-slate-700">₹{item.manufacturingCost}</span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center justify-between">
                  <span>Gross Profit Margin:</span>
                  <span>₹{grossMargin} ({marginPercent}%)</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" /> {item.bom.length} BOM Components
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete finished product ${item.name}?`)) {
                        deleteFinishedGood(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl p-6 relative text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit Finished Product' : 'Add New Finished Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Model Number</label>
                  <input
                    type="text"
                    required
                    value={formData.modelNumber}
                    onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MapOut24 OBD-II Y-Splitter Cable"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as FinishedGood['category'] })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Current Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={formData.sellingPrice || ''}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Manufacturing Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={formData.manufacturingCost || ''}
                    onChange={(e) => setFormData({ ...formData, manufacturingCost: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Product Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
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
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
