'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import {
  PackageCheck,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Package,
} from 'lucide-react';

export default function AdminFinishedGoodsPage() {
  const { products, salesOrders, productionOrders, productReturns, refreshProductsFromDB } = useERP();

  React.useEffect(() => {
    refreshProductsFromDB();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');

  // Finished Goods stock breakdown per product
  const fgBreakdown = useMemo(() => {
    return products.map((prod) => {
      const opening = prod.openingStock || 0;

      // Produced across completed production batches
      const produced = productionOrders
        .filter((po) => (po.productId === prod.id || po.productName === prod.name) && po.status === 'Completed')
        .reduce((sum, po) => sum + (po.producedQuantity || 0), 0);

      // Dispatched across sales orders
      const dispatched = salesOrders
        .filter((o) => o.dispatchStatus === 'DISPATCHED' || o.dispatchStatus === 'DELIVERED')
        .reduce((sum, o) => {
          const item = o.items?.find((i) => i.productId === prod.id || i.productName === prod.name || i.sku === prod.sku);
          return sum + (item ? item.quantity : 0);
        }, 0);

      // Returns from clients
      const returned = productReturns
        .filter((r) => r.productName === prod.name && (r.status === 'Approved' || r.status === 'Replaced'))
        .reduce((sum, r) => sum + (r.quantity || 0), 0);

      const damage = 0; // standard scrap ledger
      const current = prod.currentStock;
      const isLow = current <= prod.minStock;

      return {
        ...prod,
        opening,
        produced,
        dispatched,
        returned,
        damage,
        current,
        isLow,
      };
    });
  }, [products, productionOrders, salesOrders, productReturns]);

  const filteredFG = useMemo(() => {
    return fgBreakdown.filter((p) => {
      return (
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [fgBreakdown, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finished Goods Inventory Ledger</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {products.length} Products Tracked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconciled stock movement: opening balance, production receipts, customer dispatches, and warehouse on-hand units.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search finished goods by name, SKU, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Finished Goods Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Product Item & SKU</th>
                <th className="px-4 py-3.5 text-center">Opening Stock</th>
                <th className="px-4 py-3.5 text-center text-blue-700">Production Received</th>
                <th className="px-4 py-3.5 text-center text-rose-700">Sales / Dispatched</th>
                <th className="px-4 py-3.5 text-center text-amber-700">Returns</th>
                <th className="px-4 py-3.5 text-center font-black">Current Stock</th>
                <th className="px-4 py-3.5 text-center">Stock Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFG.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {p.productCode} · {p.sku}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center font-medium text-slate-600">
                    {p.opening}
                  </td>

                  <td className="px-4 py-4 text-center font-bold text-blue-700">
                    +{p.produced}
                  </td>

                  <td className="px-4 py-4 text-center font-bold text-rose-700">
                    -{p.dispatched}
                  </td>

                  <td className="px-4 py-4 text-center font-bold text-amber-700">
                    +{p.returned}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className="font-black text-slate-900 text-sm">
                      {p.current} units
                    </span>
                  </td>

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
              {filteredFG.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No finished goods stock records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
