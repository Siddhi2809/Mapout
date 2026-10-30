'use client';

import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Boxes,
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const { financials, alerts, rawMaterials, finishedGoods, salesOrders, productionOrders } = useERP();

  const salesTrendData = [
    { day: 'Mon', revenue: 42000, cost: 18000 },
    { day: 'Tue', revenue: 68000, cost: 24000 },
    { day: 'Wed', revenue: 54000, cost: 21000 },
    { day: 'Thu', revenue: 89000, cost: 34000 },
    { day: 'Fri', revenue: 112000, cost: 42000 },
    { day: 'Sat', revenue: 76000, cost: 29000 },
    { day: 'Sun', revenue: financials.todaySales || 58000, cost: 22000 },
  ];

  const inventoryDistribution = [
    { name: 'Raw Stock', value: financials.rawMaterialStockValue },
    { name: 'Finished FG', value: financials.finishedGoodsStockValue },
    { name: 'Receivables', value: financials.customerOutstanding },
    { name: 'Payables', value: financials.supplierOutstanding },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 rounded-2xl border border-blue-900/40 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Sunyash & MapOut24 ERP Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time OBD cable manufacturing metrics, stock evaluation, sales & alert engine.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('production')}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-900/40 transition"
          >
            + New Production Build
          </button>
          <button
            onClick={() => setActiveTab('salesOrders')}
            className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-900/40 transition"
          >
            + Create Sales Order
          </button>
        </div>
      </div>

      {/* Required 10 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Today's Sales */}
        <div className="erp-card p-4 erp-card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Today's Sales</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            ₹{financials.todaySales.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +14.2% vs yesterday
          </div>
        </div>

        {/* 2. Monthly Sales */}
        <div className="erp-card p-4 erp-card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Monthly Sales</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            ₹{financials.monthlySales.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-blue-400 font-medium">
            <ShoppingBag className="w-3.5 h-3.5 mr-1" /> {financials.totalOrdersCount} Total Orders
          </div>
        </div>

        {/* 3. Customer Outstanding */}
        <div className="erp-card p-4 erp-card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Customer Outstanding</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-300">
            ₹{financials.customerOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-rose-400 font-medium">
            Accounts Receivable
          </div>
        </div>

        {/* 4. Supplier Outstanding */}
        <div className="erp-card p-4 erp-card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Supplier Outstanding</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-300">
            ₹{financials.supplierOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-amber-400 font-medium">
            Accounts Payable
          </div>
        </div>

        {/* 5. Raw Material Stock Value */}
        <div className="erp-card p-4 erp-card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Raw Material Stock</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            ₹{financials.rawMaterialStockValue.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-400 font-medium">
            {rawMaterials.length} Raw Component SKUs
          </div>
        </div>

        {/* 6. Finished Goods Stock Value */}
        <div className="erp-card p-4 erp-card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Finished Goods Stock</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            ₹{financials.finishedGoodsStockValue.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-400 font-medium">
            {finishedGoods.reduce((a, b) => a + b.currentStock, 0)} Units Ready to Ship
          </div>
        </div>

        {/* 7. Low Stock Alert Count */}
        <div className="erp-card p-4 erp-card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Low Stock Warning</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {alerts.filter((a) => a.type === 'LOW_RAW_MATERIAL' || a.type === 'LOW_FINISHED_GOOD').length} SKUs
          </div>
          <div className="mt-1 flex items-center text-[11px] text-rose-400 font-medium">
            Below safety reorder point
          </div>
        </div>

        {/* 8. Net Profit Margin */}
        <div className="erp-card p-4 erp-card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Estimated Profit</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-300">
            ₹{financials.totalProfit.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-amber-400 font-medium">
            Gross Manufacturing Margin
          </div>
        </div>
      </div>

      {/* Analytics Charts & Live Alert Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Manufacturing Revenue Trend */}
        <div className="lg:col-span-2 erp-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Weekly Revenue vs Manufacturing Cost</h2>
              <p className="text-xs text-slate-400">OBD Cable sales volume compared to raw material production input cost.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              7 Days Trend
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0284C7" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Sales Revenue (₹)" />
                <Area type="monotone" dataKey="cost" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" name="Mfg Cost (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Alerts Feeds */}
        <div className="erp-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Active System Alerts
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                {alerts.length} Total
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No operational warnings.
                </div>
              ) : (
                alerts.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => a.actionLinkModule && setActiveTab(a.actionLinkModule)}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 cursor-pointer transition text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span>{a.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{a.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('rawMaterials')}
            className="mt-4 w-full py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Manage Stock Reorder Points &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
