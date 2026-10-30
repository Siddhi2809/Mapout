'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PRODUCT_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import {
  Boxes,
  PackageCheck,
  Factory,
  Clock,
  AlertTriangle,
  Flame,
  Wrench,
  RotateCcw,
  ArrowRight,
  PlusCircle,
  Layers,
  Sliders,
} from 'lucide-react';

export default function ProductDashboard() {
  const {
    products,
    productionOrders,
    productReturns,
    boms,
    stockAdjustments,
  } = useERP();

  const todayStr = new Date().toISOString().split('T')[0];

  // Summary Metrics calculations
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'ACTIVE').length;
  const totalFinishedGoodsUnits = products.reduce((acc, p) => acc + p.currentStock, 0);

  const todaysProductionUnits = productionOrders
    .filter(
      (p: any) =>
        (p.completionDate === todayStr || p.startDate === todayStr || p.productionDate === todayStr) &&
        (p.status === 'COMPLETED' || p.status === 'Completed')
    )
    .reduce((acc, p: any) => acc + (p.producedQuantity || p.plannedQuantity || p.quantityToProduce || 0), 0);

  const pendingProductionOrders = productionOrders.filter(
    (p: any) =>
      p.status === 'PENDING' ||
      p.status === 'Draft' ||
      p.status === 'Material Check' ||
      p.status === 'Ready' ||
      p.status === 'IN_PROGRESS' ||
      p.status === 'In Production'
  ).length;

  const lowStockProductsList = products.filter((p) => p.currentStock <= p.minStock);
  const lowStockCount = lowStockProductsList.length;

  const damagedProductsCount = productReturns
    .filter((r) => r.status === 'Damaged')
    .reduce((acc, r) => acc + r.quantity, 0);

  const productsInRepairCount = productReturns
    .filter((r) => r.status === 'Repair Required' || r.status === 'Under Inspection')
    .reduce((acc, r) => acc + r.quantity, 0);

  const summaryCards = [
    { label: 'Total Products', value: `${totalProducts} Models`, icon: Boxes, color: 'text-blue-600', href: '/product/products' },
    { label: 'Active Products', value: `${activeProducts} Active`, icon: PackageCheck, color: 'text-emerald-600', href: '/product/products' },
    { label: 'Total Finished Goods', value: `${totalFinishedGoodsUnits.toLocaleString('en-IN')} Units`, icon: Layers, color: 'text-blue-700', href: '/product/finished-goods' },
    { label: "Today's Production", value: `${todaysProductionUnits} Units`, icon: Factory, color: 'text-slate-800', href: '/product/orders' },
    { label: 'Pending Production', value: `${pendingProductionOrders} Orders`, icon: Clock, color: 'text-amber-600', href: '/product/orders' },
    { label: 'Low Stock Products', value: `${lowStockCount} SKUs`, icon: AlertTriangle, color: 'text-rose-600', href: '/product/products' },
    { label: 'Damaged Products', value: `${damagedProductsCount} Units`, icon: Flame, color: 'text-rose-600', href: '/product/returns' },
    { label: 'Products Under Repair', value: `${productsInRepairCount} Units`, icon: Wrench, color: 'text-amber-600', href: '/product/returns' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'ACTIVE':
      case 'REPAIRED':
      case 'REPLACED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
      case 'IN PRODUCTION':
      case 'READY':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDING':
      case 'DRAFT':
      case 'MATERIAL CHECK':
      case 'REQUESTED':
      case 'UNDER INSPECTION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REPAIR REQUIRED':
      case 'REPLACEMENT REQUIRED':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'CANCELLED':
      case 'DAMAGED':
      case 'REJECTED':
      case 'INACTIVE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <DashboardLayout
      roleTitle="Product Management"
      roleBadge="Product Manager"
      navItems={PRODUCT_NAV}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Management Dashboard</h1>
            <p className="text-xs text-slate-600 mt-1">
              Real-time operational dashboard for master catalogs, BOM, shopfloor production, finished inventory, and RMA returns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/product/products"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-blue-900/10"
            >
              <PlusCircle className="w-4 h-4 text-white" /> Add New Product
            </Link>
            <Link
              href="/product/production"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-2 transition"
            >
              <Factory className="w-4 h-4 text-blue-600" /> New Production Order
            </Link>
          </div>
        </div>

        {/* Operational Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link key={idx} href={card.href} className="group">
                <div className="erp-card p-5 h-full flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition duration-150">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs text-slate-600 font-semibold tracking-wide truncate">{card.label}</span>
                    <div className={`p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0 ${card.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-slate-900 tracking-tight">{card.value}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Dashboard Operational Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* PRODUCTION STATUS */}
          <div className="erp-card p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Factory className="w-4 h-4 text-blue-600" /> Active Production Orders
              </h3>
              <Link
                href="/product/production"
                className="text-xs text-blue-600 hover:text-blue-500 font-bold flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead>
                  <tr className="text-slate-700 font-bold border-b border-slate-200 bg-slate-50">
                    <th className="py-2 px-3 font-semibold">Order #</th>
                    <th className="py-2 px-3 font-semibold">Product</th>
                    <th className="py-2 px-3 font-semibold text-right">Qty</th>
                    <th className="py-2 px-3 font-semibold">Start</th>
                    <th className="py-2 px-3 font-semibold">Expected</th>
                    <th className="py-2 px-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productionOrders.slice(0, 4).map((po: any) => (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-bold">{po.orderNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 max-w-[150px] truncate">
                        {po.productName || po.finishedGoodName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {po.plannedQuantity || po.quantityToProduce || 0}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{po.startDate || po.productionDate}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{po.expectedCompletion || po.completionDate || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            po.status
                          )}`}
                        >
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {productionOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                        No production orders logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FINISHED GOODS STOCK */}
          <div className="erp-card p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-600" /> Finished Goods Stock
              </h3>
              <Link
                href="/product/stock"
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                Manage Stock <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead>
                  <tr className="text-slate-700 font-bold border-b border-slate-200 bg-slate-50">
                    <th className="py-2 px-3 font-semibold">SKU</th>
                    <th className="py-2 px-3 font-semibold">Product Name</th>
                    <th className="py-2 px-3 font-semibold text-right">Quantity</th>
                    <th className="py-2 px-3 font-semibold text-right">Min Stock</th>
                    <th className="py-2 px-3 font-semibold text-center">Status</th>
                    <th className="py-2 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.slice(0, 5).map((p) => {
                    const isLow = p.currentStock <= p.minStock;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-600">{p.sku}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 max-w-[160px] truncate">{p.name}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">{p.currentStock} PCS</td>
                        <td className="py-2.5 px-3 text-right text-slate-600 font-mono">{p.minStock}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isLow
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {isLow ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href="/product/stock"
                            className="px-2 py-1 rounded-md text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* LOW STOCK ALERTS */}
          <div className="erp-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Low Stock Alerts (Stock ≤ Minimum)
              </h3>
              <span className="text-[10px] text-amber-800 font-bold font-mono bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {lowStockCount} Action Required
              </span>
            </div>

            {lowStockProductsList.length > 0 ? (
              <div className="space-y-2.5">
                {lowStockProductsList.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                        SKU: {p.sku} | Min Safety Stock: {p.minStock} Units
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-amber-800">{p.currentStock} Units left</div>
                      <Link
                        href={`/product/production?productId=${p.id}`}
                        className="text-[10px] text-blue-700 hover:underline font-bold"
                      >
                        + Create Build Order
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                All finished goods inventory levels are currently above minimum safety thresholds.
              </div>
            )}
          </div>

          {/* RECENT PRODUCTION LOGS */}
          <div className="erp-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Recent Production Runs
              </h3>
              <Link
                href="/product/production"
                className="text-xs text-blue-600 hover:text-blue-500 font-bold flex items-center gap-1"
              >
                View History <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead>
                  <tr className="text-slate-700 font-bold border-b border-slate-200 bg-slate-50">
                    <th className="py-2 px-3 font-semibold">Build #</th>
                    <th className="py-2 px-3 font-semibold">Product</th>
                    <th className="py-2 px-3 font-semibold text-right">Qty</th>
                    <th className="py-2 px-3 font-semibold">Date</th>
                    <th className="py-2 px-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productionOrders.slice(0, 4).map((po: any) => (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">{po.orderNumber}</td>
                      <td className="py-2.5 px-3 text-slate-900 font-semibold truncate max-w-[150px]">{po.productName || po.finishedGoodName}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{po.plannedQuantity || po.quantityToProduce}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{po.startDate || po.productionDate}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(po.status)}`}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RECENT RETURNS & RMA */}
          <div className="erp-card p-6 bg-white border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" /> Recent Customer Product Returns (RMA)
              </h3>
              <Link
                href="/product/returns"
                className="text-xs text-blue-600 hover:text-blue-500 font-bold flex items-center gap-1"
              >
                Manage RMA <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead>
                  <tr className="text-slate-700 font-bold border-b border-slate-200 bg-slate-50">
                    <th className="py-2 px-3 font-semibold">RMA #</th>
                    <th className="py-2 px-3 font-semibold">Customer</th>
                    <th className="py-2 px-3 font-semibold">Product</th>
                    <th className="py-2 px-3 font-semibold text-right">Qty</th>
                    <th className="py-2 px-3 font-semibold">Return Reason</th>
                    <th className="py-2 px-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productReturns.slice(0, 4).map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono text-rose-700 font-bold">{ret.returnNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 truncate max-w-[140px]">{ret.customerName}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium truncate max-w-[160px]">{ret.productName}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{ret.quantity}</td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[200px]">{ret.returnReason}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(ret.status)}`}>
                          {ret.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
