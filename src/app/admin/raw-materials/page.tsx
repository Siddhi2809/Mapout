'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { RawMaterial } from '@/types/erp';
import {
  Layers,
  Search,
  Filter,
  Plus,
  Eye,
  AlertTriangle,
  Building2,
  MapPin,
  X,
  Edit2,
} from 'lucide-react';

export default function AdminRawMaterialsPage() {
  const { rawMaterials, addRawMaterial, suppliers, refreshRawMaterialsFromDB } = useERP();

  React.useEffect(() => {
    refreshRawMaterialsFromDB();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRM, setSelectedRM] = useState<RawMaterial | null>(null);

  const [rmForm, setRmForm] = useState({
    name: '',
    sku: '',
    category: 'Copper & Wires',
    unit: 'Meters',
    currentStock: '500',
    minStock: '100',
    maxStock: '2000',
    unitCost: '45',
    supplierName: '',
    location: 'Rack A-12',
    description: '',
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    rawMaterials.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort();
  }, [rawMaterials]);

  const filteredMaterials = useMemo(() => {
    return rawMaterials.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.materialCode && m.materialCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.supplierName && m.supplierName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = categoryFilter ? m.category === categoryFilter : true;
      return matchSearch && matchCat;
    });
  }, [rawMaterials, searchQuery, categoryFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmForm.name || !rmForm.sku) return;

    const newMaterial = {
      materialCode: `RM-${Date.now().toString().slice(-4)}`,
      name: rmForm.name,
      sku: rmForm.sku,
      category: rmForm.category,
      unit: rmForm.unit,
      currentStock: parseFloat(rmForm.currentStock || '0'),
      minStock: parseFloat(rmForm.minStock || '100'),
      maxStock: parseFloat(rmForm.maxStock || '2000'),
      unitCost: parseFloat(rmForm.unitCost || '0'),
      supplierName: rmForm.supplierName || 'Primary Supplier',
      location: rmForm.location,
      status: 'ACTIVE' as const,
      description: rmForm.description,
    };

    addRawMaterial(newMaterial as any);

    try {
      await fetch('/api/raw-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterial),
      });
    } catch (err) {
      console.error(err);
    }

    setShowAddModal(false);
    setRmForm({
      name: '',
      sku: '',
      category: 'Copper & Wires',
      unit: 'Meters',
      currentStock: '500',
      minStock: '100',
      maxStock: '2000',
      unitCost: '45',
      supplierName: '',
      location: 'Rack A-12',
      description: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Raw Materials Management</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {rawMaterials.length} Materials
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized inventory monitoring for raw copper, harness wiring, connectors, PCBs, and warehouse locations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Add Raw Material
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by material code, SKU, name, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Raw Materials Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Material & SKU</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-center">Unit</th>
                <th className="px-4 py-3.5 text-center">Current Stock</th>
                <th className="px-4 py-3.5 text-center">Min / Max Stock</th>
                <th className="px-4 py-3.5">Primary Supplier</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((m) => {
                const isLow = m.currentStock <= m.minStock;

                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {m.materialCode || m.id} · {m.sku}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {m.category}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center font-semibold text-slate-700">
                      {m.unit}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                          isLow
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {m.currentStock} {m.unit}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center text-slate-500">
                      <span className="text-rose-600 font-bold">{m.minStock}</span> / {m.maxStock || '2000'}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.supplierName || 'Bharat Industrial'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-slate-600 flex items-center gap-1 font-mono text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{m.location || 'Bin A-1'}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedRM(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No raw materials match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Detail Modal */}
      {selectedRM && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedRM.name}</h3>
                <div className="text-xs text-slate-500 font-mono">
                  {selectedRM.materialCode || selectedRM.id} · {selectedRM.sku}
                </div>
              </div>
              <button onClick={() => setSelectedRM(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Current On-Hand:</span>
                  <div className="font-black text-slate-900 text-sm mt-0.5">
                    {selectedRM.currentStock} {selectedRM.unit}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Unit Purchase Cost:</span>
                  <div className="font-black text-slate-700 text-sm mt-0.5">
                    ₹{(selectedRM.unitCost || 0).toLocaleString('en-IN')} / {selectedRM.unit}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Min Reorder Threshold:</span>
                  <div className="font-bold text-rose-600 mt-0.5">{selectedRM.minStock} {selectedRM.unit}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Warehouse Bin:</span>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedRM.location || 'Rack 1'}</div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-800 mb-1">Assigned Vendor / Supplier:</div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold">
                  {selectedRM.supplierName || 'Direct Import'}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedRM(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Material */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add New Raw Material Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Copper Wire Harness Spec 2.5mm"
                  value={rmForm.name}
                  onChange={(e) => setRmForm({ ...rmForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="RM-COP-005"
                    value={rmForm.sku}
                    onChange={(e) => setRmForm({ ...rmForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={rmForm.category}
                    onChange={(e) => setRmForm({ ...rmForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={rmForm.unit}
                    onChange={(e) => setRmForm({ ...rmForm, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="Meters">Meters</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Kilograms">Kilograms</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    value={rmForm.unitCost}
                    onChange={(e) => setRmForm({ ...rmForm, unitCost: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Opening Current Stock</label>
                  <input
                    type="number"
                    value={rmForm.currentStock}
                    onChange={(e) => setRmForm({ ...rmForm, currentStock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Min Reorder Alert Level</label>
                  <input
                    type="number"
                    value={rmForm.minStock}
                    onChange={(e) => setRmForm({ ...rmForm, minStock: e.target.value })}
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
                  Save Raw Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
