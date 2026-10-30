'use client';

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { RawMaterial } from '../../types/erp';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Package,
  CheckCircle,
  MapPin,
  Building,
} from 'lucide-react';

export const RawMaterialsView: React.FC = () => {
  const { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial, suppliers, generateEntityCode } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RawMaterial | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<RawMaterial, 'id'>>({
    sku: '',
    name: '',
    category: 'Connectors',
    unit: 'PCS',
    currentStock: 0,
    minStock: 100,
    unitCost: 0,
    supplierId: suppliers[0]?.id || '',
    supplierName: suppliers[0]?.name || '',
    location: 'Rack A-01',
    lastRestocked: new Date().toISOString().split('T')[0],
  });

  const categories = ['Connectors', 'Wires & Cables', 'Enclosures', 'Chips & PCB', 'Passive Components', 'Packaging'];

  const filteredMaterials = rawMaterials.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (item?: RawMaterial) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        sku: item.sku,
        name: item.name,
        category: item.category,
        unit: item.unit,
        currentStock: item.currentStock,
        minStock: item.minStock,
        unitCost: item.unitCost,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        location: item.location,
        lastRestocked: item.lastRestocked,
      });
    } else {
      setEditingItem(null);
      const defaultSup = suppliers[0];
      const autoSKU = generateEntityCode('RAW_MATERIAL');
      setFormData({
        sku: autoSKU,
        name: '',
        category: 'Connectors',
        unit: 'PCS',
        currentStock: 100,
        minStock: 50,
        unitCost: 25,
        supplierId: defaultSup?.id || '',
        supplierName: defaultSup?.name || '',
        location: 'Rack A-01',
        lastRestocked: new Date().toISOString().split('T')[0],
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateRawMaterial(editingItem.id, formData);
    } else {
      addRawMaterial(formData);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 erp-card p-5 bg-white border border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" /> Raw Materials Stock Management (CRUD)
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage OBD connectors, wire coils, plastic housings, and microcontroller chips used in production.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/10 transition"
        >
          <Plus className="w-4 h-4 text-white" /> Add Raw Material SKU
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU or material name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-600 font-medium">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 text-xs text-slate-800 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500 shadow-sm"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Raw Materials Inventory Data Table */}
      <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3.5">SKU & Item Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Current Stock</th>
                <th className="p-3.5">Min Reorder Level</th>
                <th className="p-3.5">Unit Cost (₹)</th>
                <th className="p-3.5">Total Valuation</th>
                <th className="p-3.5">Storage Location</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredMaterials.map((item) => {
                const isLowStock = item.currentStock <= item.minStock;
                const totalValue = item.currentStock * item.unitCost;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                      <div className="text-[10px] font-mono text-blue-700 font-semibold">{item.sku}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className={isLowStock ? 'text-rose-700 font-extrabold' : 'text-slate-900'}>
                          {item.currentStock.toLocaleString('en-IN')} {item.unit}
                        </span>
                        {isLowStock && (
                          <span className="p-1 rounded bg-rose-100 text-rose-800 border border-rose-200" title="Low Stock Warning">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="p-3.5 font-mono text-slate-800">
                      ₹{item.unitCost} / {item.unit}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-700">
                      ₹{totalValue.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {item.location}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {isLowStock && (
                        <a
                          href="/raw-material/materials"
                          className="inline-flex items-center gap-1 p-1.5 px-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 text-[11px] font-semibold transition"
                          title="Request Stock replenishment"
                        >
                          <Boxes className="w-3.5 h-3.5 text-amber-700" /> Request Stock
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-200 transition"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                            deleteRawMaterial(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-rose-700 border border-slate-200 transition"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl p-6 relative text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit Raw Material SKU' : 'Add New Raw Material SKU'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Material Code (Auto-Generated)</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.sku}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg py-2 px-3 text-xs font-mono font-bold text-blue-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as RawMaterial['category'] })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OBD-II 16-Pin Male Plug Connector"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as RawMaterial['unit'] })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="PCS">PCS</option>
                    <option value="METERS">METERS</option>
                    <option value="BOXES">BOXES</option>
                    <option value="SETS">SETS</option>
                    <option value="KG">KG</option>
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
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Min Safety Level</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Preferred Supplier</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => {
                      const sup = suppliers.find((s) => s.id === e.target.value);
                      setFormData({
                        ...formData,
                        supplierId: e.target.value,
                        supplierName: sup ? (sup.companyName || sup.name) : 'Unknown Supplier',
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
                  >
                    {suppliers
                      .filter((s) => (s.status ?? 'ACTIVE') === 'ACTIVE' || (editingItem && s.id === formData.supplierId))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.supplierCode ? `[${s.supplierCode}] ` : ''}{s.companyName || s.name} {s.status === 'INACTIVE' ? '(INACTIVE)' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Storage Rack Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
