'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RAW_MATERIAL_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import {
  Boxes,
  Package,
  AlertTriangle,
  ShoppingCart,
  Clock,
  FileCheck,
  Factory,
  CreditCard,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  Truck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function RawMaterialDashboard() {
  const {
    rawMaterials,
    suppliers,
    purchaseOrders,
    materialReceipts,
    materialConsumptions,
    supplierPayments,
  } = useERP();

  const today = new Date().toISOString().split('T')[0];

  // 1. Calculations for 8 Summary Cards
  const totalRawMaterialsCount = rawMaterials.length;
  const totalAvailableQty = rawMaterials.reduce((acc, rm) => acc + rm.currentStock, 0);
  const lowStockMaterials = rawMaterials.filter((rm) => rm.currentStock <= rm.minStock);

  const todaysPurchases = purchaseOrders
    .filter((po) => po.orderDate === today)
    .reduce((acc, po) => acc + po.totalAmount, 0);

  const pendingPOs = purchaseOrders.filter((po) =>
    ['Pending', 'Draft', 'Approved', 'Partially Received'].includes(po.status)
  );

  const todaysReceipts = materialReceipts.filter((rec) => rec.receiptDate === today);
  const todaysReceiptsQty = todaysReceipts.reduce((acc, rec) => acc + rec.acceptedQuantity, 0);

  const totalConsumedQty = materialConsumptions.reduce((acc, mc) => acc + mc.quantity, 0);
  const totalSupplierOutstanding = suppliers.reduce((acc, s) => acc + s.totalOutstanding, 0);

  const summaryCards = [
    {
      label: 'Total Raw Materials',
      value: `${totalRawMaterialsCount} SKUs`,
      subtext: `₹${rawMaterials
        .reduce((acc, rm) => acc + rm.currentStock * rm.unitCost, 0)
        .toLocaleString('en-IN')} Inventory Value`,
      icon: Boxes,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      href: '/raw-material/materials',
    },
    {
      label: 'Total Available Quantity',
      value: `${totalAvailableQty.toLocaleString('en-IN')} Units`,
      subtext: 'Across all stock bins',
      icon: Package,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      href: '/raw-material/materials',
    },
    {
      label: 'Low Stock Materials',
      value: `${lowStockMaterials.length} Items`,
      subtext: lowStockMaterials.length > 0 ? 'Requires immediate reorder' : 'All stocks optimal',
      icon: AlertTriangle,
      color: lowStockMaterials.length > 0 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-slate-400 bg-slate-800 border-slate-700',
      href: '/raw-material/materials?filter=low-stock',
    },
    {
      label: "Today's Purchase",
      value: `₹${todaysPurchases.toLocaleString('en-IN')}`,
      subtext: `${purchaseOrders.filter((po) => po.orderDate === today).length} POs created today`,
      icon: ShoppingCart,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      href: '/raw-material/purchase',
    },
    {
      label: 'Pending Purchase Orders',
      value: `${pendingPOs.length} Orders`,
      subtext: `Awaiting delivery from vendors`,
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      href: '/raw-material/purchase',
    },
    {
      label: "Today's Material Receipts",
      value: `${todaysReceipts.length} Shipments`,
      subtext: `${todaysReceiptsQty.toLocaleString('en-IN')} units accepted today`,
      icon: FileCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      href: '/raw-material/receipts',
    },
    {
      label: 'Material Consumed',
      value: `${totalConsumedQty.toLocaleString('en-IN')} Units`,
      subtext: `${materialConsumptions.length} shopfloor requisitions`,
      icon: Factory,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      href: '/raw-material/consumption',
    },
    {
      label: 'Supplier Outstanding',
      value: `₹${totalSupplierOutstanding.toLocaleString('en-IN')}`,
      subtext: `${suppliers.filter((s) => s.totalOutstanding > 0).length} suppliers payable`,
      icon: CreditCard,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      href: '/raw-material/payments',
    },
  ];

  return (
    <DashboardLayout
      roleTitle="Raw Material Management"
      roleBadge="Raw Material Manager"
      navItems={RAW_MATERIAL_NAV}
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Raw Material Operational Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live inventory tracking, vendor purchases, material inwards, shopfloor consumption, and supplier payables.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/raw-material/purchase"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" /> Create Purchase Order
            </Link>
            <Link
              href="/raw-material/receipts"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center gap-2 transition shadow-2xs"
            >
              <FileCheck className="w-4 h-4 text-blue-600" /> Record Material Receipt
            </Link>
          </div>
        </div>

        {/* 8 Operational Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link key={idx} href={card.href} className="group">
                <div className="erp-card p-5 h-full flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition duration-150">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs text-slate-600 font-semibold tracking-wide truncate">{card.label}</span>
                    <div className={`p-2.5 rounded-xl border shrink-0 ${card.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xl font-bold text-slate-900 tracking-tight">{card.value}</div>
                    <div className="text-[11px] text-slate-500 font-medium truncate">{card.subtext}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Dashboard Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* SECTION 1: RAW MATERIAL STOCK (CENTRALIZED) */}
          <div className="erp-card p-5 space-y-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-600" /> Current Raw Material Stock
              </h3>
              <Link
                href="/raw-material/stock"
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                Manage Stock <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Stock Name</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {rawMaterials.slice(0, 5).map((rm) => {
                    const isLow = rm.currentStock <= rm.minStock;
                    return (
                      <tr key={rm.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900 max-w-[140px] truncate">{rm.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{rm.sku}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span className={isLow ? 'text-amber-600' : 'text-slate-900'}>
                            {rm.currentStock.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{rm.unit}</td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href="/raw-material/stock"
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

          {/* SECTION 2: LOW STOCK ALERTS */}
          <div className="erp-card p-5 space-y-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Alerts
              </h3>
              <Link
                href="/raw-material/stock"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                Resolve Stock <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {lowStockMaterials.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                All raw material stock levels are currently above minimum safety thresholds.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Material Code</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Current Stock</th>
                      <th className="py-2 px-3">Min Stock</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lowStockMaterials.slice(0, 5).map((rm) => (
                      <tr key={rm.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-blue-600 font-semibold">{rm.sku}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 max-w-[150px] truncate">{rm.name}</td>
                        <td className="py-2 px-3 font-bold text-amber-600">
                          {rm.currentStock} {rm.unit}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{rm.minStock} {rm.unit}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                            Low Stock
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 2: RECENT PURCHASES */}
          <div className="erp-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" /> Recent Purchase Orders
              </h3>
              <Link
                href="/raw-material/purchase"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                All Orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">PO Number</th>
                    <th className="py-2 px-3">Supplier</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.slice(0, 5).map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-blue-600">{po.poNumber}</td>
                      <td className="py-2 px-3 text-slate-900 font-medium max-w-[140px] truncate">{po.supplierName}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono">{po.orderDate}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        ₹{po.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            po.status === 'Received'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : po.status === 'Partially Received'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : po.status === 'Approved'
                              ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : 'bg-amber-50 text-amber-600 border-amber-200'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: RECENT MATERIAL RECEIPTS */}
          <div className="erp-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" /> Recent Material Receipts
              </h3>
              <Link
                href="/raw-material/receipts"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                View Receipts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Receipt No</th>
                    <th className="py-2 px-3">PO Ref</th>
                    <th className="py-2 px-3">Supplier</th>
                    <th className="py-2 px-3">Accepted Qty</th>
                    <th className="py-2 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materialReceipts.slice(0, 5).map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-blue-600">{rec.receiptNumber}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{rec.poNumber}</td>
                      <td className="py-2 px-3 text-slate-900 font-medium max-w-[130px] truncate">{rec.supplierName}</td>
                      <td className="py-2 px-3 font-bold text-emerald-600">
                        +{rec.acceptedQuantity.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-mono">{rec.receiptDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4: RECENT MATERIAL CONSUMPTION */}
          <div className="erp-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Factory className="w-4 h-4 text-blue-600" /> Shopfloor Material Consumption
              </h3>
              <Link
                href="/raw-material/consumption"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                View Consumptions <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Consumption ID</th>
                    <th className="py-2 px-3">Material</th>
                    <th className="py-2 px-3">Quantity</th>
                    <th className="py-2 px-3">Order Ref</th>
                    <th className="py-2 px-3">Issued To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materialConsumptions.slice(0, 5).map((mc) => (
                    <tr key={mc.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-blue-600">{mc.consumptionId}</td>
                      <td className="py-2 px-3 text-slate-900 font-medium max-w-[140px] truncate">{mc.rawMaterialName}</td>
                      <td className="py-2 px-3 font-bold text-rose-600">
                        -{mc.quantity} {mc.unit}
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-mono">{mc.productionOrderId || 'General'}</td>
                      <td className="py-2 px-3 text-slate-600">{mc.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 5: SUPPLIER OUTSTANDING OVERVIEW */}
          <div className="erp-card p-5 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-600" /> Supplier Payable Outstanding Summary
              </h3>
              <Link
                href="/raw-material/payments"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                Record Payment <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Supplier Code</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Total Purchase</th>
                    <th className="py-2.5 px-3">Total Paid</th>
                    <th className="py-2.5 px-3">Outstanding</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers.map((s) => {
                    const totalPurchase = s.totalPurchase || 0;
                    const outstanding = s.totalOutstanding;
                    const paid = Math.max(0, totalPurchase - outstanding);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-blue-600 font-semibold">{s.supplierCode}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{s.companyName}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          ₹{totalPurchase.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-600 font-semibold">
                          ₹{paid.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-rose-600">
                          ₹{outstanding.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/raw-material/payments?supplierId=${s.id}`}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-semibold border border-rose-200 inline-flex items-center gap-1 transition"
                          >
                            Pay Bill
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
