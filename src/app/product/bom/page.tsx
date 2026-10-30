'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PRODUCT_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { BOM, BOMItem } from '@/types/erp';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Search,
  Calculator,
  GitBranch,
  Boxes,
  AlertCircle,
  Eye,
} from 'lucide-react';

export default function BOMPage() {
  const {
    boms,
    products,
    rawMaterials,
    addBOM,
    updateBOM,
    createNewBOMVersion,
    refreshProductsFromDB,
    refreshRawMaterialsFromDB,
  } = useERP();

  // Fetch latest products and raw materials from database on load
  React.useEffect(() => {
    refreshProductsFromDB();
    refreshRawMaterialsFromDB();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);

  // Form State
  const [formProductId, setFormProductId] = useState('');
  const [formVersion, setFormVersion] = useState(1);
  const [formStatus, setFormStatus] = useState<'Draft' | 'Active' | 'Inactive'>('Active');
  const [bomItems, setBomItems] = useState<
    { rawMaterialId: string; rawMaterialName: string; sku: string; unit: string; quantity: number; wastagePercent: number; notes: string }[]
  >([]);

  // Requirement Calculator State inside Modal
  const [testProductionQty, setTestProductionQty] = useState(100);

  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredBOMs = boms.filter((b) => {
    const matchSearch =
      b.bomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchProd = selectedProductFilter === 'ALL' || b.productId === selectedProductFilter;
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchProd && matchStatus;
  });

  const handleOpenCreateModal = () => {
    refreshProductsFromDB();
    refreshRawMaterialsFromDB();
    const defaultProd = products[0];
    setFormProductId(defaultProd ? defaultProd.id : '');
    setFormVersion(1);
    setFormStatus('Active');
    setBomItems([
      {
        rawMaterialId: rawMaterials[0]?.id || '',
        rawMaterialName: rawMaterials[0]?.name || '',
        sku: rawMaterials[0]?.sku || '',
        unit: rawMaterials[0]?.unit || 'PCS',
        quantity: 1,
        wastagePercent: 2,
        notes: '',
      },
    ]);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (b: BOM) => {
    refreshProductsFromDB();
    refreshRawMaterialsFromDB();
    setSelectedBOM(b);
    setFormProductId(b.productId);
    setFormVersion(b.version);
    setFormStatus(b.status);
    setBomItems(
      b.items.map((i) => ({
        rawMaterialId: i.rawMaterialId,
        rawMaterialName: i.rawMaterialName,
        sku: i.sku,
        unit: i.unit,
        quantity: i.quantity,
        wastagePercent: i.wastagePercent,
        notes: i.notes || '',
      }))
    );
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenViewModal = (b: BOM) => {
    setSelectedBOM(b);
    setIsViewModalOpen(true);
  };

  const handleCreateNewVersion = (b: BOM) => {
    const res = createNewBOMVersion(b.productId, b.items);
    if (!res.success) {
      alert(res.message);
    } else {
      showToast(`Created new active BOM version for ${b.productName}.`);
    }
  };

  const handleAddMaterialRow = () => {
    const firstRM = rawMaterials[0];
    setBomItems([
      ...bomItems,
      {
        rawMaterialId: firstRM?.id || '',
        rawMaterialName: firstRM?.name || '',
        sku: firstRM?.sku || '',
        unit: firstRM?.unit || 'PCS',
        quantity: 1,
        wastagePercent: 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveMaterialRow = (index: number) => {
    if (bomItems.length === 1) {
      alert('BOM must contain at least one raw material.');
      return;
    }
    setBomItems(bomItems.filter((_, idx) => idx !== index));
  };

  const handleMaterialSelectChange = (index: number, rmId: string) => {
    const rm = rawMaterials.find((r) => r.id === rmId);
    if (!rm) return;
    const updated = [...bomItems];
    updated[index] = {
      ...updated[index],
      rawMaterialId: rm.id,
      rawMaterialName: rm.name,
      sku: rm.sku,
      unit: rm.unit,
    };
    setBomItems(updated);
  };

  const handleSaveBOM = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formProductId) return setFormError('Please select a product.');
    if (bomItems.length === 0) return setFormError('BOM must contain at least one raw material.');

    for (let i = 0; i < bomItems.length; i++) {
      if (bomItems[i].quantity <= 0) {
        return setFormError(`Quantity for ${bomItems[i].rawMaterialName} must be greater than zero.`);
      }
    }

    const prod = products.find((p) => p.id === formProductId);
    const payload = {
      productId: formProductId,
      productName: prod ? prod.name : 'Unknown Product',
      version: formVersion,
      status: formStatus,
      items: bomItems,
    };

    if (isEditModalOpen && selectedBOM) {
      const res = updateBOM(selectedBOM.id, payload);
      if (!res.success) {
        setFormError(res.message || 'Failed to update BOM');
        return;
      }
      showToast(`BOM "${selectedBOM.bomNumber}" updated.`);
      setIsEditModalOpen(false);
    } else {
      const res = addBOM(payload);
      if (!res.success) {
        setFormError(res.message || 'Failed to add BOM');
        return;
      }
      showToast(`New BOM created successfully.`);
      setIsCreateModalOpen(false);
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

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bill of Materials (BOM)</h1>
            <p className="text-xs text-slate-600 mt-1">
              Define raw material component recipes, wastage percentages, and version history for manufactured products.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-blue-900/10"
          >
            <Plus className="w-4 h-4 text-white" /> Create BOM
          </button>
        </div>

        {/* Filters */}
        <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search BOM # or Product Name..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white transition"
            >
              <option value="ALL">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white transition"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* BOM List Table */}
        <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                  <th className="p-3.5">BOM Number</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5 text-center">Version</th>
                  <th className="p-3.5 text-center">Materials</th>
                  <th className="p-3.5">Created Date</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBOMs.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-blue-700 font-bold">{b.bomNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900 max-w-[250px]">{b.productName}</td>
                    <td className="p-3.5 text-center font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                        v{b.version}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-emerald-700">
                      {b.items.length} Items
                    </td>
                    <td className="p-3.5 text-slate-600 font-mono">{b.createdDate}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          b.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : b.status === 'Draft'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenViewModal(b)}
                          title="View BOM Details & Requirement Calculator"
                          className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-blue-700 hover:bg-slate-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          title="Edit BOM"
                          className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-slate-200 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCreateNewVersion(b)}
                          title="Create New BOM Version (v+1)"
                          className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-blue-700 hover:bg-slate-200 transition"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredBOMs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500 text-xs">
                      No BOM records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATE / EDIT BOM MODAL */}
        {(isCreateModalOpen || isEditModalOpen) && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
              }
            }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl p-6 space-y-6 shadow-2xl my-8 text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  {isEditModalOpen ? 'Edit Bill of Materials' : 'Create New Bill of Materials (BOM)'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  title="Close / Minimize Form"
                  aria-label="Close / Minimize Form"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 transition flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> {formError}
                </div>
              )}

              <form onSubmit={handleSaveBOM} className="space-y-6">
                {/* Header Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Select Product *</label>
                    <select
                      required
                      disabled={isEditModalOpen}
                      value={formProductId}
                      onChange={(e) => setFormProductId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 text-[11px] mb-1 font-semibold">BOM Version</label>
                    <input
                      type="number"
                      required
                      value={formVersion}
                      onChange={(e) => setFormVersion(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-[11px] mb-1 font-semibold">BOM Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="Active">Active (Default for Production)</option>
                      <option value="Draft">Draft</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Raw Material Items List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                      Raw Material Components Required (Per 1 Product Unit)
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddMaterialRow}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Material Row
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {bomItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                      >
                        <div className="sm:col-span-5">
                          <label className="block text-slate-600 text-[10px] mb-1 font-semibold">Raw Material</label>
                          <select
                            value={item.rawMaterialId}
                            onChange={(e) => handleMaterialSelectChange(idx, e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                          >
                            {rawMaterials.filter((rm) => (rm.status || 'ACTIVE') === 'ACTIVE' || rm.id === item.rawMaterialId).length === 0 ? (
                              <option value="">No Active Raw Materials Found</option>
                            ) : (
                              rawMaterials
                                .filter((rm) => (rm.status || 'ACTIVE') === 'ACTIVE' || rm.id === item.rawMaterialId)
                                .map((rm) => (
                                  <option key={rm.id} value={rm.id}>
                                    {rm.name} ({rm.sku}) — [{rm.category || 'Component'}] | Stock: {rm.currentStock} {rm.unit} | Cost: ₹{rm.unitCost}
                                  </option>
                                ))
                            )}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-slate-600 text-[10px] mb-1 font-semibold">Qty / Unit</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              placeholder="0"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onKeyDown={(e) => {
                                if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                const updated = [...bomItems];
                                updated[idx].quantity = raw === '' ? 0 : parseInt(raw, 10);
                                setBomItems(updated);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 focus:outline-none no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[10px] text-slate-600 font-mono font-bold shrink-0">{item.unit}</span>
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-slate-600 text-[10px] mb-1 font-semibold">Wastage %</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="0"
                            value={item.wastagePercent === 0 ? '' : item.wastagePercent}
                            onKeyDown={(e) => {
                              if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              const updated = [...bomItems];
                              updated[idx].wastagePercent = raw === '' ? 0 : parseInt(raw, 10);
                              setBomItems(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-slate-600 text-[10px] mb-1 font-semibold">Notes</label>
                          <input
                            type="text"
                            placeholder="e.g. Pin 4 wire"
                            value={item.notes}
                            onChange={(e) => {
                              const updated = [...bomItems];
                              updated[idx].notes = e.target.value;
                              setBomItems(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-1 text-right pt-4 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterialRow(idx)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Automatic Material Requirement Calculator Preview */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-blue-800 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-600" /> Automatic Material Requirement Calculator
                    </h5>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 font-semibold">Test Build Quantity:</span>
                      <input
                        type="number"
                        value={testProductionQty}
                        onChange={(e) => setTestProductionQty(parseInt(e.target.value, 10) || 1)}
                        className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:outline-none"
                      />
                      <span className="text-slate-600">units</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-800">
                      <thead>
                        <tr className="text-slate-700 font-bold border-b border-slate-200">
                          <th className="py-1.5">Raw Material</th>
                          <th className="py-1.5 text-right">Qty/Unit</th>
                          <th className="py-1.5 text-right">Wastage %</th>
                          <th className="py-1.5 text-right text-emerald-800 font-bold">Total Req. ({testProductionQty} Units)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {bomItems.map((item, idx) => {
                          const req = Math.ceil(
                            item.quantity * testProductionQty * (1 + (item.wastagePercent || 0) / 100)
                          );
                          return (
                            <tr key={idx}>
                              <td className="py-1.5 font-bold text-slate-900">{item.rawMaterialName}</td>
                              <td className="py-1.5 text-right text-slate-600 font-mono">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="py-1.5 text-right text-slate-600">{item.wastagePercent}%</td>
                              <td className="py-1.5 text-right font-bold text-emerald-700">
                                {req} {item.unit}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 shadow-lg shadow-blue-900/10"
                  >
                    {isEditModalOpen ? 'Save BOM Changes' : 'Save & Activate BOM'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW BOM DETAILS & CALCULATOR MODAL */}
        {isViewModalOpen && selectedBOM && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsViewModalOpen(false);
              }
            }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-2xl text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedBOM.bomNumber}</h3>
                  <div className="text-xs text-slate-600">
                    Product: <span className="text-blue-700 font-bold">{selectedBOM.productName}</span> | Version: v{selectedBOM.version}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  title="Close / Minimize Modal"
                  aria-label="Close / Minimize Modal"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 transition flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Components List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">BOM Component Breakdown</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2 px-3">Raw Material</th>
                        <th className="py-2 px-3 text-right">Quantity Required</th>
                        <th className="py-2 px-3 text-right">Wastage %</th>
                        <th className="py-2 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedBOM.items.map((i, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-bold text-slate-900">{i.rawMaterialName}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {i.quantity} {i.unit}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">{i.wastagePercent}%</td>
                          <td className="py-2 px-3 text-slate-500">{i.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive Calculator */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-700 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600" /> Production Material Calculator
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-600 font-semibold">Planned Build Units:</span>
                    <input
                      type="number"
                      value={testProductionQty}
                      onChange={(e) => setTestProductionQty(parseInt(e.target.value, 10) || 1)}
                      className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  {selectedBOM.items.map((item, idx) => {
                    const req = Math.ceil(
                      item.quantity * testProductionQty * (1 + (item.wastagePercent || 0) / 100)
                    );
                    const rm = rawMaterials.find((r) => r.id === item.rawMaterialId);
                    const avail = rm ? rm.currentStock : 0;
                    const shortage = Math.max(0, req - avail);
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-800 font-bold">{item.rawMaterialName}</span>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-slate-500 font-medium">Required:</span>{' '}
                            <span className="font-bold text-slate-900">
                              {req} {item.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium">Available:</span>{' '}
                            <span className={shortage > 0 ? 'font-bold text-rose-700' : 'font-bold text-emerald-700'}>
                              {avail} {item.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
