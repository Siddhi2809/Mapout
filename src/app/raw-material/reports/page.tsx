'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RAW_MATERIAL_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import {
  BarChart3,
  Download,
  Filter,
  Search,
  Calendar,
  Boxes,
  AlertTriangle,
  History,
  ShoppingCart,
  Truck,
  FileCheck,
  Factory,
  CreditCard,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

export default function RawMaterialReportsPage() {
  const {
    rawMaterials,
    suppliers,
    purchaseOrders,
    materialReceipts,
    materialConsumptions,
    supplierPayments,
    stockTransactions,
  } = useERP();

  const [activeReportTab, setActiveReportTab] = useState<number>(1);

  // Common Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [materialFilter, setMaterialFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const reportTabs = [
    { id: 1, name: '1. Raw Material Stock Report', icon: Boxes },
    { id: 2, name: '2. Low Stock Report', icon: AlertTriangle },
    { id: 3, name: '3. Stock Movement Report', icon: History },
    { id: 4, name: '4. Purchase Report', icon: ShoppingCart },
    { id: 5, name: '5. Supplier Report', icon: Truck },
    { id: 6, name: '6. Material Receipt Report', icon: FileCheck },
    { id: 7, name: '7. Material Consumption Report', icon: Factory },
    { id: 8, name: '8. Supplier Outstanding Report', icon: CreditCard },
    { id: 9, name: '9. Payment Report', icon: DollarSign },
  ];

  // Helper date checker
  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return true;
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  };

  // 1. Raw Material Stock Report Data
  const stockReportData = useMemo(() => {
    return rawMaterials.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || m.category === categoryFilter;
      const matchSup = supplierFilter === 'ALL' || m.supplierId === supplierFilter;
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      const matchMat = materialFilter === 'ALL' || m.id === materialFilter;
      return matchSearch && matchCat && matchSup && matchStatus && matchMat;
    });
  }, [rawMaterials, searchTerm, categoryFilter, supplierFilter, statusFilter, materialFilter]);

  // 2. Low Stock Report Data
  const lowStockReportData = useMemo(() => {
    return rawMaterials.filter((m) => {
      const isLow = m.currentStock <= m.minStock;
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || m.category === categoryFilter;
      const matchSup = supplierFilter === 'ALL' || m.supplierId === supplierFilter;
      return isLow && matchSearch && matchCat && matchSup;
    });
  }, [rawMaterials, searchTerm, categoryFilter, supplierFilter]);

  // 3. Stock Movement Report Data
  const stockMovementData = useMemo(() => {
    return stockTransactions.filter((tx) => {
      const matchSearch =
        tx.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.user.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMat = materialFilter === 'ALL' || tx.materialId === materialFilter;
      const matchDate = isDateInRange(tx.date);
      return matchSearch && matchMat && matchDate;
    });
  }, [stockTransactions, searchTerm, materialFilter, fromDate, toDate]);

  // 4. Purchase Report Data
  const purchaseReportData = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchSearch =
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSup = supplierFilter === 'ALL' || po.supplierId === supplierFilter;
      const matchStatus = statusFilter === 'ALL' || po.status === statusFilter;
      const matchDate = isDateInRange(po.orderDate);
      return matchSearch && matchSup && matchStatus && matchDate;
    });
  }, [purchaseOrders, searchTerm, supplierFilter, statusFilter, fromDate, toDate]);

  // 5. Supplier Report Data
  const supplierReportData = useMemo(() => {
    return suppliers.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.city || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || s.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [suppliers, searchTerm, categoryFilter, statusFilter]);

  // 6. Material Receipt Report Data
  const receiptReportData = useMemo(() => {
    return materialReceipts.filter((rec) => {
      const matchSearch =
        rec.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSup = supplierFilter === 'ALL' || rec.supplierId === supplierFilter;
      const matchDate = isDateInRange(rec.receiptDate);
      return matchSearch && matchSup && matchDate;
    });
  }, [materialReceipts, searchTerm, supplierFilter, fromDate, toDate]);

  // 7. Material Consumption Report Data
  const consumptionReportData = useMemo(() => {
    return materialConsumptions.filter((mc) => {
      const matchSearch =
        mc.consumptionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mc.rawMaterialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mc.productionOrderId || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchMat = materialFilter === 'ALL' || mc.rawMaterialId === materialFilter;
      const matchDate = isDateInRange(mc.date);
      return matchSearch && matchMat && matchDate;
    });
  }, [materialConsumptions, searchTerm, materialFilter, fromDate, toDate]);

  // 8. Supplier Outstanding Report Data
  const outstandingReportData = useMemo(() => {
    return suppliers.filter((s) => {
      const hasOutstanding = s.totalOutstanding > 0;
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchSup = supplierFilter === 'ALL' || s.id === supplierFilter;
      return hasOutstanding && matchSearch && matchSup;
    });
  }, [suppliers, searchTerm, supplierFilter]);

  // 9. Payment Report Data
  const paymentReportData = useMemo(() => {
    return supplierPayments.filter((p) => {
      const matchSearch =
        p.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.billPoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSup = supplierFilter === 'ALL' || p.supplierId === supplierFilter;
      const matchDate = isDateInRange(p.paymentDate);
      return matchSearch && matchSup && matchDate;
    });
  }, [supplierPayments, searchTerm, supplierFilter, fromDate, toDate]);

  // Export CSV Action for current active report
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let fileName = 'report.csv';

    switch (activeReportTab) {
      case 1:
        fileName = `raw_material_stock_report_${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['Material Code', 'Name', 'Category', 'Unit', 'Stock', 'Min Stock', 'Unit Cost', 'Inventory Value', 'Location', 'Supplier'];
        rows = stockReportData.map((m) => [
          `"${m.sku}"`,
          `"${m.name}"`,
          `"${m.category}"`,
          `"${m.unit}"`,
          m.currentStock,
          m.minStock,
          m.unitCost,
          m.currentStock * m.unitCost,
          `"${m.location}"`,
          `"${m.supplierName}"`,
        ]);
        break;
      case 2:
        fileName = `low_stock_alert_report_${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['Material Code', 'Name', 'Category', 'Current Stock', 'Min Stock', 'Deficit Qty', 'Supplier'];
        rows = lowStockReportData.map((m) => [
          `"${m.sku}"`,
          `"${m.name}"`,
          `"${m.category}"`,
          m.currentStock,
          m.minStock,
          m.minStock - m.currentStock,
          `"${m.supplierName}"`,
        ]);
        break;
      case 3:
        fileName = `stock_movement_report_${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['Date', 'Material Name', 'Type', 'Reference', 'Qty In', 'Qty Out', 'Balance', 'User'];
        rows = stockMovementData.map((tx) => [
          `"${tx.date}"`,
          `"${tx.materialName}"`,
          `"${tx.transactionType}"`,
          `"${tx.reference}"`,
          tx.quantityIn,
          tx.quantityOut,
          tx.newBalance,
          `"${tx.user}"`,
        ]);
        break;
      case 4:
        fileName = `purchase_orders_report_${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['PO Number', 'Supplier', 'Order Date', 'Expected Date', 'Subtotal', 'Tax', 'Total Amount', 'Status'];
        rows = purchaseReportData.map((po) => [
          `"${po.poNumber}"`,
          `"${po.supplierName}"`,
          `"${po.orderDate}"`,
          `"${po.expectedDate}"`,
          po.subtotal ?? 0,
          po.gstAmount ?? 0,
          po.totalAmount,
          `"${po.status}"`,
        ]);
        break;
      case 5:
        fileName = `suppliers_report_${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['Code', 'Supplier Name', 'Company', 'GST', 'Total Purchase', 'Outstanding', 'Payment Terms'];
        rows = supplierReportData.map((s) => [
          `"${s.supplierCode}"`,
          `"${s.name}"`,
          `"${s.companyName}"`,
          `"${s.gstNumber}"`,
          s.totalPurchase || 0,
          s.totalOutstanding,
          `"${s.paymentTerms}"`,
        ]);
        break;
      case 6:
        fileName = `material_receipts_report_${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['Receipt No', 'PO Ref', 'Supplier', 'Date', 'Received Qty', 'Accepted Qty', 'Rejected Qty', 'Status'];
        rows = receiptReportData.map((rec) => [
          `"${rec.receiptNumber}"`,
          `"${rec.poNumber}"`,
          `"${rec.supplierName}"`,
          `"${rec.receiptDate}"`,
          rec.receivedQuantity,
          rec.acceptedQuantity,
          rec.rejectedQuantity,
          `"${rec.status}"`,
        ]);
        break;
      case 7:
        fileName = `material_consumption_report_${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['Consumption ID', 'Material Code', 'Material Name', 'Quantity', 'Order Ref', 'Date', 'User'];
        rows = consumptionReportData.map((mc) => [
          `"${mc.consumptionId}"`,
          `"${mc.sku}"`,
          `"${mc.rawMaterialName}"`,
          mc.quantity,
          `"${mc.productionOrderId || 'General'}"`,
          `"${mc.date}"`,
          `"${mc.user}"`,
        ]);
        break;
      case 8:
        fileName = `supplier_outstanding_report_${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['Supplier Code', 'Supplier Name', 'Total Purchase', 'Paid', 'Outstanding Balance', 'Payment Terms'];
        rows = outstandingReportData.map((s) => [
          `"${s.supplierCode}"`,
          `"${s.name}"`,
          s.totalPurchase || 0,
          (s.totalPurchase || 0) - s.totalOutstanding,
          s.totalOutstanding,
          `"${s.paymentTerms}"`,
        ]);
        break;
      case 9:
        fileName = `supplier_payments_report_${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['Payment ID', 'Supplier', 'Bill/PO Ref', 'Amount Paid', 'Date', 'Mode', 'Reference UTR'];
        rows = paymentReportData.map((p) => [
          `"${p.paymentId}"`,
          `"${p.supplierName}"`,
          `"${p.billPoNumber}"`,
          p.amount,
          `"${p.paymentDate}"`,
          `"${p.paymentMode}"`,
          `"${p.referenceNumber}"`,
        ]);
        break;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout
      roleTitle="Raw Material Management"
      roleBadge="Raw Material Manager"
      navItems={RAW_MATERIAL_NAV}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" /> Raw Material Intelligence Reports
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Analytical audit reports for stock valuation, vendor payables, shopfloor requisitions, and inwards.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/10 transition shrink-0"
          >
            <Download className="w-4 h-4 text-white" /> Export Active Report (CSV)
          </button>
        </div>

        {/* Global Filter Bar */}
        <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
            <Filter className="w-4 h-4 text-blue-600" /> Report Filters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Search Keywords</label>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Material Filter</label>
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Materials</option>
                {rawMaterials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.sku})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Supplier Filter</label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Category Filter</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Categories</option>
                <option value="Connectors">Connectors</option>
                <option value="Wires & Cables">Wires & Cables</option>
                <option value="Enclosures">Enclosures</option>
                <option value="Chips & PCB">Chips & PCB</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>
          </div>
        </div>

        {/* 9 Report Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeReportTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="text-[11px] font-bold leading-tight line-clamp-2">{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Active Report View */}
        <div className="erp-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {reportTabs.find((t) => t.id === activeReportTab)?.name}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Showing matching records based on active filters
            </span>
          </div>

          {/* REPORT 1: STOCK REPORT */}
          {activeReportTab === 1 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Material Code</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 px-3">Min Stock</th>
                    <th className="py-2.5 px-3">Unit Cost</th>
                    <th className="py-2.5 px-3">Inventory Value</th>
                    <th className="py-2.5 px-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockReportData.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-bold">{m.sku}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{m.category}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">{m.currentStock} {m.unit}</td>
                      <td className="py-2.5 px-3 text-slate-600">{m.minStock}</td>
                      <td className="py-2.5 px-3 text-slate-800">₹{m.unitCost}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        ₹{(m.currentStock * m.unitCost).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{m.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 2: LOW STOCK REPORT */}
          {activeReportTab === 2 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Material Code</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Current Stock</th>
                    <th className="py-2.5 px-3">Min Safety Stock</th>
                    <th className="py-2.5 px-3 text-amber-800 font-bold">Reorder Deficit</th>
                    <th className="py-2.5 px-3">Preferred Supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockReportData.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-bold">{m.sku}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-700">{m.currentStock} {m.unit}</td>
                      <td className="py-2.5 px-3 text-slate-600">{m.minStock} {m.unit}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">
                        {m.minStock - m.currentStock} {m.unit}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{m.supplierName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 3: STOCK MOVEMENT */}
          {activeReportTab === 3 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Material Name</th>
                    <th className="py-2.5 px-3">Transaction Type</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3 text-emerald-800 font-bold">Qty In</th>
                    <th className="py-2.5 px-3 text-rose-800 font-bold">Qty Out</th>
                    <th className="py-2.5 px-3">New Balance</th>
                    <th className="py-2.5 px-3">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockMovementData.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-600">{tx.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{tx.materialName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{tx.transactionType}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-semibold">{tx.reference}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">
                        {tx.quantityIn > 0 ? `+${tx.quantityIn}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">
                        {tx.quantityOut > 0 ? `-${tx.quantityOut}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">{tx.newBalance}</td>
                      <td className="py-2.5 px-3 text-slate-600">{tx.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 4: PURCHASE REPORT */}
          {activeReportTab === 4 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">PO Number</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Order Date</th>
                    <th className="py-2.5 px-3">Expected Date</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseReportData.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{po.poNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{po.supplierName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{po.orderDate}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{po.expectedDate}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        ₹{po.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">{po.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 5: SUPPLIER REPORT */}
          {activeReportTab === 5 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Supplier Code</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">GST Number</th>
                    <th className="py-2.5 px-3">Total Purchase</th>
                    <th className="py-2.5 px-3 text-rose-800 font-bold">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplierReportData.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-bold">{s.supplierCode}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3 text-slate-700">{s.companyName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{s.gstNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        ₹{(s.totalPurchase || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">
                        ₹{s.totalOutstanding.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 6: MATERIAL RECEIPT REPORT */}
          {activeReportTab === 6 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Receipt Number</th>
                    <th className="py-2.5 px-3">PO Reference</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-blue-700 font-bold">Received Qty</th>
                    <th className="py-2.5 px-3 text-emerald-700 font-bold">Accepted Qty</th>
                    <th className="py-2.5 px-3 text-rose-700 font-bold">Rejected Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receiptReportData.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{rec.receiptNumber}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-semibold">{rec.poNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{rec.supplierName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{rec.receiptDate}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{rec.receivedQuantity}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">+{rec.acceptedQuantity}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">{rec.rejectedQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 7: MATERIAL CONSUMPTION REPORT */}
          {activeReportTab === 7 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Consumption ID</th>
                    <th className="py-2.5 px-3">Material Code</th>
                    <th className="py-2.5 px-3">Material Name</th>
                    <th className="py-2.5 px-3 text-rose-800 font-bold">Quantity Consumed</th>
                    <th className="py-2.5 px-3">Order Ref</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consumptionReportData.map((mc) => (
                    <tr key={mc.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{mc.consumptionId}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-semibold">{mc.sku}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{mc.rawMaterialName}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">
                        -{mc.quantity} {mc.unit}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{mc.productionOrderId || 'General'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{mc.date}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{mc.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 8: SUPPLIER OUTSTANDING REPORT */}
          {activeReportTab === 8 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Supplier Code</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Total Purchase</th>
                    <th className="py-2.5 px-3">Total Paid</th>
                    <th className="py-2.5 px-3 text-rose-800 font-bold">Outstanding Balance</th>
                    <th className="py-2.5 px-3">Payment Terms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outstandingReportData.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-bold">{s.supplierCode}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">
                        ₹{(s.totalPurchase || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">
                        ₹{Math.max(0, (s.totalPurchase || 0) - s.totalOutstanding).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">
                        ₹{s.totalOutstanding.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{s.paymentTerms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 9: PAYMENT REPORT */}
          {activeReportTab === 9 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Payment ID</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Bill / PO Ref</th>
                    <th className="py-2.5 px-3 text-emerald-800 font-bold">Amount Paid</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Reference No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentReportData.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-700">{p.paymentId}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{p.supplierName}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-semibold">{p.billPoNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{p.paymentDate}</td>
                      <td className="py-2.5 px-3 text-slate-700">{p.paymentMode}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 text-[11px]">{p.referenceNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
