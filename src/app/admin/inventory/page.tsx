'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import {
  PackageCheck,
  Boxes,
  Layers,
  Search,
  Filter,
  AlertTriangle,
  ArrowRightLeft,
  SlidersHorizontal,
  TrendingDown,
  CheckCircle2,
  Clock,
  Plus,
  X,
} from 'lucide-react';

export default function AdminInventoryPage({
  initialTab = 'raw-materials',
}: {
  initialTab?: 'raw-materials' | 'finished-goods' | 'movements' | 'low-stock' | 'adjustments';
}) {
  const {
    rawMaterials,
    products,
    productionOrders,
    salesOrders,
    productReturns,
    stockTransactions,
    stockAdjustments,
  } = useERP();

  const [activeTab, setActiveTab] = useState<
    'raw-materials' | 'finished-goods' | 'movements' | 'low-stock' | 'adjustments'
  >(initialTab);

  const [searchQuery, setSearchQuery] = useState('');

  // Low stock items calculation (materials + products where stock <= minStock)
  const lowStockItems = useMemo(() => {
    const list: {
      id: string;
      name: string;
      sku: string;
      type: 'Raw Material' | 'Finished Product';
      currentStock: number;
      minStock: number;
      unit: string;
      deficit: number;
    }[] = [];

    rawMaterials.forEach((m) => {
      if (m.currentStock <= m.minStock) {
        list.push({
          id: m.id,
          name: m.name,
          sku: m.sku,
          type: 'Raw Material',
          currentStock: m.currentStock,
          minStock: m.minStock,
          unit: m.unit,
          deficit: m.minStock - m.currentStock,
        });
      }
    });

    products.forEach((p) => {
      if (p.currentStock <= p.minStock) {
        list.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          type: 'Finished Product',
          currentStock: p.currentStock,
          minStock: p.minStock,
          unit: 'units',
          deficit: p.minStock - p.currentStock,
        });
      }
    });

    return list;
  }, [rawMaterials, products]);

  // Finished Goods ledger
  const fgLedger = useMemo(() => {
    return products.map((prod) => {
      const opening = prod.openingStock || 0;
      const produced = productionOrders
        .filter((po) => (po.productId === prod.id || po.productName === prod.name) && po.status === 'Completed')
        .reduce((sum, po) => sum + (po.producedQuantity || 0), 0);

      const dispatched = salesOrders
        .filter((o) => o.dispatchStatus === 'DISPATCHED' || o.dispatchStatus === 'DELIVERED')
        .reduce((sum, o) => {
          const item = o.items?.find((i) => i.productId === prod.id || i.productName === prod.name || i.sku === prod.sku);
          return sum + (item ? item.quantity : 0);
        }, 0);

      const returned = productReturns
        .filter((r) => r.productName === prod.name && (r.status === 'Approved' || r.status === 'Replaced'))
        .reduce((sum, r) => sum + (r.quantity || 0), 0);

      const current = prod.currentStock;
      const isLow = current <= prod.minStock;

      return {
        ...prod,
        opening,
        produced,
        dispatched,
        returned,
        current,
        isLow,
      };
    });
  }, [products, productionOrders, salesOrders, productReturns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centralized Inventory Control</h1>
            {lowStockItems.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {lowStockItems.length} Low Stock Alerts
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unified stock command: real-time raw materials, finished units, stock movements, and audit adjustments.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('raw-materials')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'raw-materials'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Raw Material Stock ({rawMaterials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('finished-goods')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'finished-goods'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Finished Goods Stock ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'movements'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Stock Movements</span>
        </button>

        <button
          onClick={() => setActiveTab('low-stock')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'low-stock'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock ({lowStockItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('adjustments')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'adjustments'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Stock Adjustments</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search inventory items by name, SKU, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* TAB 1: RAW MATERIAL STOCK */}
      {activeTab === 'raw-materials' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Material & SKU</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-center">Current Stock</th>
                  <th className="px-4 py-3.5 text-center">Minimum Threshold</th>
                  <th className="px-4 py-3.5 text-center">Maximum Capacity</th>
                  <th className="px-4 py-3.5 text-center">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rawMaterials
                  .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((m) => {
                    const isLow = m.currentStock <= m.minStock;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {m.name}
                          <div className="text-[11px] text-slate-400 font-mono font-normal">{m.sku}</div>
                        </td>
                        <td className="px-4 py-4">{m.category}</td>
                        <td className="px-4 py-4 text-center font-black text-slate-900 text-sm">
                          {m.currentStock} {m.unit}
                        </td>
                        <td className="px-4 py-4 text-center text-rose-600 font-bold">
                          {m.minStock} {m.unit}
                        </td>
                        <td className="px-4 py-4 text-center text-slate-500">
                          {m.maxStock || '2000'} {m.unit}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              isLow
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isLow ? 'LOW STOCK' : 'OPTIMAL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FINISHED GOODS STOCK */}
      {activeTab === 'finished-goods' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Product Item</th>
                  <th className="px-4 py-3.5 text-center">Opening Stock</th>
                  <th className="px-4 py-3.5 text-center text-blue-700">Production Received</th>
                  <th className="px-4 py-3.5 text-center text-rose-700">Dispatched</th>
                  <th className="px-4 py-3.5 text-center text-amber-700">Returns</th>
                  <th className="px-4 py-3.5 text-center font-black">Current Stock</th>
                  <th className="px-4 py-3.5 text-center">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fgLedger
                  .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {p.name}
                        <div className="text-[11px] text-slate-400 font-mono font-normal">{p.sku}</div>
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-slate-600">{p.opening}</td>
                      <td className="px-4 py-4 text-center font-bold text-blue-700">+{p.produced}</td>
                      <td className="px-4 py-4 text-center font-bold text-rose-700">-{p.dispatched}</td>
                      <td className="px-4 py-4 text-center font-bold text-amber-700">+{p.returned}</td>
                      <td className="px-4 py-4 text-center font-black text-slate-900 text-sm">{p.current} units</td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            p.isLow
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.isLow ? 'LOW STOCK' : 'OPTIMAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK MOVEMENTS */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Transaction ID</th>
                  <th className="px-4 py-3.5">Item & SKU</th>
                  <th className="px-4 py-3.5">Transaction Type</th>
                  <th className="px-4 py-3.5 text-center">Quantity Delta</th>
                  <th className="px-4 py-3.5 text-center">Prev → New Balance</th>
                  <th className="px-4 py-3.5">Reference ID</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockTransactions
                  .filter((t) => t.materialName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-bold text-slate-900 font-mono">{t.id}</td>
                      <td className="px-4 py-4 font-semibold text-slate-800">{t.materialName}</td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-[11px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                          {t.transactionType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-black text-slate-900">
                        {t.transactionType === 'CONSUMPTION' || t.transactionType === 'DISPATCH' ? '-' : '+'}
                        {t.quantity}
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-slate-600">
                        {t.previousStock} → <strong>{t.newStock}</strong>
                      </td>
                      <td className="px-4 py-4 font-mono text-blue-600 font-semibold">{t.referenceId || 'N/A'}</td>
                      <td className="px-5 py-4 text-slate-500">{t.timestamp}</td>
                    </tr>
                  ))}
                {stockTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      No stock movement audit records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LOW STOCK ITEMS */}
      {activeTab === 'low-stock' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-rose-900 text-sm">Action Required: Inventory Deficits</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Items currently at or below minimum buffer threshold. Procurement or production replenishment is recommended.
                </p>
              </div>
            </div>
            <span className="text-lg font-black text-rose-700">{lowStockItems.length} Critical Items</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Item Name & SKU</th>
                    <th className="px-4 py-3.5">Classification</th>
                    <th className="px-4 py-3.5 text-center font-bold text-rose-700">Current Stock</th>
                    <th className="px-4 py-3.5 text-center">Minimum Threshold</th>
                    <th className="px-4 py-3.5 text-center">Required Top-up</th>
                    <th className="px-5 py-3.5 text-right">Procurement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {item.name}
                        <div className="text-[11px] text-slate-400 font-mono font-normal">{item.sku}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-700">{item.type}</span>
                      </td>
                      <td className="px-4 py-4 text-center font-black text-rose-700 text-sm">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-700">
                        {item.minStock} {item.unit}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-amber-700">
                        +{Math.max(1, item.deficit)} {item.unit}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                          PO Recommended
                        </span>
                      </td>
                    </tr>
                  ))}
                  {lowStockItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                        All materials and products are currently above minimum safety stock.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STOCK ADJUSTMENTS */}
      {activeTab === 'adjustments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Admin Inventory Adjustments & Audit Corrections</h3>
              <p className="text-xs text-slate-500">Physical stock count reconciliation logs</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Adjustment ID</th>
                  <th className="px-4 py-3.5">Item Adjusted</th>
                  <th className="px-4 py-3.5 text-center">Previous Qty</th>
                  <th className="px-4 py-3.5 text-center">New Counted Qty</th>
                  <th className="px-4 py-3.5">Reason / Justification</th>
                  <th className="px-5 py-3.5 text-right">Audited By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockAdjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{adj.id}</td>
                    <td className="px-4 py-4 font-bold text-slate-800">{adj.materialName}</td>
                    <td className="px-4 py-4 text-center font-mono text-slate-600">{adj.previousStock}</td>
                    <td className="px-4 py-4 text-center font-mono font-black text-slate-900">{adj.newStock}</td>
                    <td className="px-4 py-4 text-slate-600">{adj.reason}</td>
                    <td className="px-5 py-4 text-right text-slate-500">{adj.adjustedBy || 'Admin'}</td>
                  </tr>
                ))}
                {stockAdjustments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      No stock adjustment logs recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
