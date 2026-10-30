'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PRODUCT_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import {
  PackageCheck,
  Search,
  Filter,
  History,
  Layers,
  TrendingUp,
  TrendingDown,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  AlertTriangle,
  RotateCcw,
  ShoppingCart,
  Factory,
} from 'lucide-react';

export default function FinishedGoodsPage() {
  const {
    products,
    fgTransactions,
    productionOrders,
    salesOrders,
    productReturns,
    salesReturns,
    stockAdjustments,
    refreshProductsFromDB,
  } = useERP();

  useEffect(() => {
    refreshProductsFromDB();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

  // Compute product stock stats for every product
  const productStockMetrics = products.map((p) => {
    const openingStock = p.openingStock ?? p.currentStock ?? 0;

    // 1. Produced Stock from Completed Production Orders
    const producedCount = (productionOrders || [])
      .filter(
        (po: any) =>
          (po.productId === p.id || po.finishedGoodId === p.id || po.sku === p.sku || po.productName === p.name || po.finishedGoodName === p.name) &&
          ((po.status || '').toUpperCase() === 'COMPLETED')
      )
      .reduce((acc: number, po: any) => acc + (po.producedQuantity || po.quantityToProduce || po.plannedQuantity || 0), 0);

    // 2. Sold Stock from Confirmed Sales Orders
    const soldCount = (salesOrders || [])
      .filter((so: any) => (so.orderStatus || '').toUpperCase() !== 'CANCELLED' && (so.orderStatus || '').toUpperCase() !== 'DRAFT')
      .flatMap((so: any) => so.items || [])
      .filter((i: any) => i.productId === p.id || i.sku === p.sku || i.productName === p.name || i.finishedGoodName === p.name)
      .reduce((acc: number, i: any) => acc + (i.quantity || 0), 0);

    // 3. Returned Stock from Product & Sales Returns (Accepted / Replaced / Repaired)
    const returnedCount =
      (productReturns || [])
        .filter(
          (r: any) =>
            (r.productId === p.id || r.sku === p.sku || r.productName === p.name) &&
            ['REPLACED', 'REPAIRED', 'ACCEPTED', 'APPROVED'].includes((r.status || '').toUpperCase())
        )
        .reduce((acc: number, r: any) => acc + (r.quantity || 0), 0) +
      (salesReturns || [])
        .filter(
          (sr: any) =>
            (sr.productId === p.id || sr.sku === p.sku || sr.productName === p.name) &&
            ['APPROVED', 'ACCEPTED', 'COMPLETED'].includes((sr.status || '').toUpperCase())
        )
        .reduce((acc: number, sr: any) => acc + (sr.returnQuantity || sr.quantity || 0), 0);

    // 4. Damaged Stock from Returns
    const damagedCount = (productReturns || [])
      .filter(
        (r: any) =>
          (r.productId === p.id || r.sku === p.sku || r.productName === p.name) &&
          ['DAMAGED', 'SCRAPPED'].includes((r.status || '').toUpperCase())
      )
      .reduce((acc: number, r: any) => acc + (r.quantity || 0), 0);

    // 5. Stock Adjustments
    const adjustedVal = (stockAdjustments || [])
      .filter(
        (a: any) =>
          (a.productId === p.id || a.sku === p.sku) &&
          ['APPROVED', 'COMPLETED'].includes((a.status || '').toUpperCase())
      )
      .reduce((acc: number, a: any) => acc + (a.difference || 0), 0);

    // 6. Net Calculated Current Stock
    const currentStock = Math.max(
      0,
      openingStock + producedCount + returnedCount - soldCount - damagedCount + adjustedVal
    );

    const isLow = currentStock <= p.minStock;

    return {
      ...p,
      openingStock,
      producedCount,
      soldCount,
      returnedCount,
      damagedCount,
      adjustedVal,
      currentStock,
      isLow,
    };
  });

  // KPI Summary Calculations across all products
  const totalOpeningStock = productStockMetrics.reduce((acc, p) => acc + p.openingStock, 0);
  const totalProduced = productStockMetrics.reduce((acc, p) => acc + p.producedCount, 0);
  const totalSold = productStockMetrics.reduce((acc, p) => acc + p.soldCount, 0);
  const totalReturned = productStockMetrics.reduce((acc, p) => acc + p.returnedCount, 0);
  const totalDamaged = productStockMetrics.reduce((acc, p) => acc + p.damagedCount, 0);
  const totalCurrentStock = productStockMetrics.reduce((acc, p) => acc + p.currentStock, 0);
  const totalLowStockAlerts = productStockMetrics.filter((p) => p.isLow).length;

  const filteredProducts = productStockMetrics.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.productCode || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchProd = selectedProductFilter === 'ALL' || p.id === selectedProductFilter;
    return matchSearch && matchProd;
  });

  const filteredTransactions = fgTransactions.filter((t) => {
    const matchSearch =
      t.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchProd = selectedProductFilter === 'ALL' || t.productId === selectedProductFilter;
    return matchSearch && matchProd;
  });

  return (
    <DashboardLayout
      roleTitle="Product Management"
      roleBadge="Product Manager"
      navItems={PRODUCT_NAV}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <PackageCheck className="w-7 h-7 text-blue-600" /> Finished Goods Inventory
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live database inventory metrics computed across opening stock, production, sales, returns, and adjustments.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 p-1.5 rounded-xl">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" /> Stock Summary
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'history' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Movement Ledger
            </button>
          </div>
        </div>

        {/* Executive KPI Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="erp-card p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Opening Stock</span>
            <div className="text-lg font-extrabold text-slate-900 mt-1">{totalOpeningStock.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-slate-400 font-mono">Catalog Baseline</span>
          </div>

          <div className="erp-card p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
              <Factory className="w-3 h-3 text-emerald-600" /> + Produced
            </span>
            <div className="text-lg font-extrabold text-emerald-700 mt-1">+{totalProduced.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-emerald-600 font-mono">Production Orders</span>
          </div>

          <div className="erp-card p-3.5 bg-blue-50/50 border border-blue-200/60 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block flex items-center gap-1">
              <ShoppingCart className="w-3 h-3 text-blue-600" /> - Sold
            </span>
            <div className="text-lg font-extrabold text-blue-700 mt-1">-{totalSold.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-blue-600 font-mono">Sales Orders</span>
          </div>

          <div className="erp-card p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-emerald-600" /> + Returned
            </span>
            <div className="text-lg font-extrabold text-emerald-700 mt-1">+{totalReturned.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-emerald-600 font-mono">Customer Returns</span>
          </div>

          <div className="erp-card p-3.5 bg-rose-50/50 border border-rose-200/60 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-600" /> - Damaged
            </span>
            <div className="text-lg font-extrabold text-rose-700 mt-1">-{totalDamaged.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-rose-600 font-mono">Scrapped / Faulty</span>
          </div>

          <div className="erp-card p-3.5 bg-blue-50 border border-blue-200 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Available Stock</span>
            <div className="text-lg font-black text-blue-700 mt-1">{totalCurrentStock.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-blue-600 font-mono">Net FG Stock</span>
          </div>

          <div className="erp-card p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Low Stock Alerts</span>
            <div className="text-lg font-extrabold text-amber-700 mt-1">{totalLowStockAlerts}</div>
            <span className="text-[10px] text-amber-600 font-mono">Needs Restock</span>
          </div>
        </div>

        {/* Stock Formula Banner */}
        <div className="erp-card p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl shadow-md border border-slate-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                <Calculator className="w-5 h-5 text-blue-400 shrink-0" />
              </div>
              <div>
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">Dynamic Database Stock Formula</span>
                <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                  Available Stock = Opening Stock + Production + Accepted Returns - Sales - Damaged ± Stock Adjustments
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 font-mono bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/40">
              ✓ Database Synchronized Live
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="erp-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-200 shadow-sm rounded-xl">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, SKU, or product code..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Product Filter:
            </div>
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">All Products Master ({products.length})</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TAB 1: FINISHED GOODS STOCK SUMMARY */}
        {activeTab === 'inventory' && (
          <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                    <th className="p-3.5">Product Name</th>
                    <th className="p-3.5">SKU / Code</th>
                    <th className="p-3.5 text-right">Opening</th>
                    <th className="p-3.5 text-right text-emerald-700">+ Produced</th>
                    <th className="p-3.5 text-right text-blue-700">- Sold</th>
                    <th className="p-3.5 text-right text-emerald-700">+ Returned</th>
                    <th className="p-3.5 text-right text-rose-700">- Damaged</th>
                    <th className="p-3.5 text-right text-slate-700">± Adjusted</th>
                    <th className="p-3.5 text-right">Available Stock</th>
                    <th className="p-3.5 text-right">Min Stock</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-semibold text-slate-900 max-w-[220px]">
                          <div>{p.name}</div>
                          {p.category && (
                            <span className="text-[10px] font-normal text-slate-400">{p.category}</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-blue-600 font-bold">{p.sku}</td>
                        <td className="p-3.5 text-right text-slate-700 font-mono font-medium">
                          {p.openingStock.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-bold font-mono text-emerald-700">
                          +{p.producedCount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-bold font-mono text-blue-700">
                          -{p.soldCount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-bold font-mono text-emerald-700">
                          +{p.returnedCount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-bold font-mono text-rose-700">
                          -{p.damagedCount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-bold font-mono text-slate-700">
                          {p.adjustedVal >= 0 ? `+${p.adjustedVal}` : p.adjustedVal}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-sm font-mono">
                          <span
                            className={
                              p.currentStock <= 0
                                ? 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200'
                                : p.isLow
                                ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200'
                                : 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200'
                            }
                          >
                            {p.currentStock.toLocaleString('en-IN')} Units
                          </span>
                        </td>
                        <td className="p-3.5 text-right text-slate-500 font-mono font-medium">
                          {p.minStock.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                              p.currentStock <= 0
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : p.isLow
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {p.currentStock <= 0 ? 'OUT OF STOCK' : p.isLow ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-12 text-center text-slate-500 text-xs">
                        No finished goods found matching query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: STOCK TRANSACTION HISTORY LEDGER */}
        {activeTab === 'history' && (
          <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Product Name</th>
                    <th className="p-3.5">Transaction Type</th>
                    <th className="p-3.5">Reference #</th>
                    <th className="p-3.5 text-right">Qty In</th>
                    <th className="p-3.5 text-right">Qty Out</th>
                    <th className="p-3.5 text-right">Previous Bal</th>
                    <th className="p-3.5 text-right">New Balance</th>
                    <th className="p-3.5">User / System</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 text-slate-600 font-mono">{tx.date}</td>
                      <td className="p-3.5 font-semibold text-slate-900 max-w-[200px]">{tx.productName}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[11px]">
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-blue-600 font-bold">{tx.reference}</td>
                      <td className="p-3.5 text-right font-bold font-mono text-emerald-700">
                        {tx.quantityIn > 0 ? `+${tx.quantityIn}` : '-'}
                      </td>
                      <td className="p-3.5 text-right font-bold font-mono text-rose-700">
                        {tx.quantityOut > 0 ? `-${tx.quantityOut}` : '-'}
                      </td>
                      <td className="p-3.5 text-right text-slate-600 font-mono font-medium">{tx.previousBalance}</td>
                      <td className="p-3.5 text-right font-bold font-mono text-slate-900">{tx.newBalance}</td>
                      <td className="p-3.5 text-slate-600 font-medium">{tx.user}</td>
                    </tr>
                  ))}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-500 text-xs">
                        No movement history logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
