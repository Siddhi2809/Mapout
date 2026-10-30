'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { ProductMaster } from '@/types/erp';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Package,
  Layers,
  Edit2,
  X,
  Camera,
} from 'lucide-react';

export default function AdminProductsPage() {
  const {
    products,
    rawMaterials,
    addProduct,
    updateProduct,
    refreshProductsFromDB,
    refreshRawMaterialsFromDB,
  } = useERP();

  React.useEffect(() => {
    refreshProductsFromDB();
    refreshRawMaterialsFromDB();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductMaster | null>(null);

  const [productForm, setProductForm] = useState({
    productCode: '',
    sku: '',
    name: '',
    category: 'Diagnostic Scanners',
    sellingPrice: '',
    purchaseCost: '',
    gstPercent: '18',
    hsnSac: '8528',
    currentStock: '50',
    minStock: '10',
    status: 'ACTIVE' as any,
    description: '',
    imageUrl: '',
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = categoryFilter ? p.category === categoryFilter : true;
      const matchStatus = statusFilter ? p.status === statusFilter : true;

      return matchSearch && matchCat && matchStatus;
    });
  }, [products, searchQuery, categoryFilter, statusFilter]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku) return;

    const code = productForm.productCode || `PRD-${Date.now().toString().slice(-4)}`;
    const newProd = {
      productCode: code,
      sku: productForm.sku,
      name: productForm.name,
      category: productForm.category,
      sellingPrice: parseFloat(productForm.sellingPrice || '0'),
      purchaseCost: parseFloat(productForm.purchaseCost || '0'),
      gstPercent: parseFloat(productForm.gstPercent || '18'),
      hsnSac: productForm.hsnSac,
      openingStock: parseFloat(productForm.currentStock || '0'),
      currentStock: parseFloat(productForm.currentStock || '0'),
      minStock: parseFloat(productForm.minStock || '10'),
      maxStock: 1000,
      status: productForm.status,
      description: productForm.description,
      imageUrl: productForm.imageUrl,
    };

    addProduct(newProd as any);

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd),
      });
    } catch (err) {
      console.error(err);
    }

    setShowAddModal(false);
    setProductForm({
      productCode: '',
      sku: '',
      name: '',
      category: 'Diagnostic Scanners',
      sellingPrice: '',
      purchaseCost: '',
      gstPercent: '18',
      hsnSac: '8528',
      currentStock: '50',
      minStock: '10',
      status: 'ACTIVE',
      description: '',
      imageUrl: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog & Master</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized Admin catalog access to finished products, selling prices, GST slabs, and factory inventories.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name, SKU, code..."
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

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Product Code & SKU</th>
                <th className="px-4 py-3.5">Product Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-right">Selling Price</th>
                <th className="px-4 py-3.5 text-right">GST % & HSN</th>
                <th className="px-4 py-3.5 text-center">Available Stock</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLow = p.currentStock <= p.minStock;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 font-mono">{p.productCode}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{p.sku}</div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      {p.imageUrl && (
                        <span className="text-[10px] text-blue-600 flex items-center gap-1 mt-0.5">
                          <Camera className="w-3 h-3" /> Image Cataloged
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.category}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right font-black text-slate-900 text-sm">
                      ₹{p.sellingPrice.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="font-semibold text-slate-800">{p.gstPercent || 18}% GST</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">HSN: {p.hsnSac || '8528'}</div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          isLow
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.currentStock} units {isLow && '· Low Stock'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          p.status === 'ACTIVE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No products match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedProduct.name}</h3>
                <div className="text-xs text-slate-500 font-mono">
                  {selectedProduct.productCode} · {selectedProduct.sku}
                </div>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {selectedProduct.imageUrl && (
                <div className="flex justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="max-h-48 object-contain rounded-xl"
                  />
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Selling Price:</span>
                  <div className="font-black text-slate-900 text-sm mt-0.5">
                    ₹{selectedProduct.sellingPrice.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Purchase / Mfg Cost:</span>
                  <div className="font-black text-slate-700 text-sm mt-0.5">
                    ₹{(selectedProduct.purchaseCost || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Current Stock:</span>
                  <div className="font-black text-slate-900 mt-0.5">{selectedProduct.currentStock} units</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Reorder Min Stock:</span>
                  <div className="font-black text-rose-600 mt-0.5">{selectedProduct.minStock} units</div>
                </div>
              </div>

              {selectedProduct.description && (
                <div>
                  <div className="font-bold text-slate-800 mb-1">Specifications & Description:</div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                    {selectedProduct.description}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add New Finished Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MapOut Ultra V4 OBD Scanner"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="MAP-SCAN-004"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Diagnostic Scanners"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    placeholder="18500 (Optional)"
                    value={productForm.sellingPrice}
                    onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Purchase / Mfg Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="11200"
                    value={productForm.purchaseCost}
                    onChange={(e) => setProductForm({ ...productForm, purchaseCost: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Opening Stock (units)</label>
                  <input
                    type="number"
                    value={productForm.currentStock}
                    onChange={(e) => setProductForm({ ...productForm, currentStock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Minimum Alert Stock</label>
                  <input
                    type="number"
                    value={productForm.minStock}
                    onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })}
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
