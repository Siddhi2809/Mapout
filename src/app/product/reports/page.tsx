'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PRODUCT_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  Calendar,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Printer,
  Layers,
  Factory,
  RotateCcw,
  Sliders,
  Boxes,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  PanelLeftClose,
} from 'lucide-react';

export default function ReportsPage() {
  const {
    products,
    boms,
    productionOrders,
    materialConsumptions,
    productReturns,
    stockAdjustments,
    fgTransactions,
    rawMaterials,
  } = useERP();

  const [activeReport, setActiveReport] = useState<number>(1);
  const [isModulesCollapsed, setIsModulesCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const reportList = [
    { id: 1, name: 'Product Stock Report', icon: Boxes },
    { id: 2, name: 'Finished Goods Stock Report', icon: Layers },
    { id: 3, name: 'Production Report', icon: Factory },
    { id: 4, name: 'BOM Report', icon: Layers },
    { id: 5, name: 'Material Requirement Report', icon: BarChart3 },
    { id: 6, name: 'Material Consumption Report', icon: Factory },
    { id: 7, name: 'Damaged Product Report', icon: RotateCcw },
    { id: 8, name: 'Returns/Replacement Report', icon: RotateCcw },
    { id: 9, name: 'Stock Adjustment Report', icon: Sliders },
    { id: 10, name: 'Product Performance Report', icon: BarChart3 },
  ];

  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Generate Report Data based on activeReport
  const getReportData = () => {
    switch (activeReport) {
      case 1: // Product Stock Report
        return products
          .filter((p) => {
            const mSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
            const mCat = selectedCategory === 'ALL' || p.category === selectedCategory;
            const mStat = selectedStatus === 'ALL' || p.status === selectedStatus;
            return mSearch && mCat && mStat;
          })
          .map((p) => ({
            col1: p.productCode,
            col2: p.name,
            col3: p.category,
            col4: `₹${p.sellingPrice}`,
            col5: p.currentStock,
            col6: p.minStock,
            col7: p.currentStock <= p.minStock ? 'LOW STOCK' : 'OK',
          }));

      case 2: // Finished Goods Stock Report
        return products
          .filter((p) => selectedProduct === 'ALL' || p.id === selectedProduct)
          .map((p) => ({
            col1: p.sku,
            col2: p.name,
            col3: p.openingStock,
            col4: p.currentStock,
            col5: `₹${(p.currentStock * p.sellingPrice).toLocaleString('en-IN')}`,
            col6: p.status,
            col7: 'Finished Good',
          }));

      case 3: // Production Report
        return productionOrders
          .filter((po: any) => {
            const mSearch = po.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || (po.productName || '').toLowerCase().includes(searchQuery.toLowerCase());
            const mStat = selectedStatus === 'ALL' || po.status === selectedStatus;
            return mSearch && mStat;
          })
          .map((po: any) => ({
            col1: po.orderNumber,
            col2: po.productName || po.finishedGoodName,
            col3: po.plannedQuantity || po.quantityToProduce,
            col4: po.producedQuantity || 0,
            col5: po.startDate || po.productionDate,
            col6: po.expectedCompletion || po.completionDate || 'N/A',
            col7: po.status,
          }));

      case 4: // BOM Report
        return boms.map((b) => ({
          col1: b.bomNumber,
          col2: b.productName,
          col3: `Version ${b.version}`,
          col4: `${b.items.length} Materials`,
          col5: b.createdDate,
          col6: b.createdBy || 'Product Manager',
          col7: b.status,
        }));

      case 5: // Material Requirement Report
        return boms.flatMap((b) =>
          b.items.map((i) => {
            const rm = rawMaterials.find((r) => r.id === i.rawMaterialId);
            return {
              col1: b.productName,
              col2: i.rawMaterialName,
              col3: `${i.quantity} ${i.unit}`,
              col4: `${i.wastagePercent}%`,
              col5: `${rm ? rm.currentStock : 0} ${i.unit}`,
              col6: rm && rm.currentStock < i.quantity * 100 ? 'SHORTAGE RISK' : 'SUFFICIENT',
              col7: b.status,
            };
          })
        );

      case 6: // Material Consumption Report
        return materialConsumptions.map((mc) => ({
          col1: mc.consumptionId,
          col2: mc.rawMaterialName,
          col3: `${mc.quantity} ${mc.unit}`,
          col4: mc.productionOrderId || 'Assembly Floor',
          col5: mc.date,
          col6: mc.user,
          col7: 'Consumed',
        }));

      case 7: // Damaged Product Report
        return productReturns
          .filter((r) => r.status === 'Damaged')
          .map((r) => ({
            col1: r.returnNumber,
            col2: r.productName,
            col3: r.customerName,
            col4: r.quantity,
            col5: r.defect || r.returnReason,
            col6: r.date,
            col7: 'Damaged / Scrapped',
          }));

      case 8: // Returns / Replacement Report
        return productReturns.map((r) => ({
          col1: r.returnNumber,
          col2: r.productName,
          col3: r.customerName,
          col4: r.quantity,
          col5: r.returnReason,
          col6: r.date,
          col7: r.status,
        }));

      case 9: // Stock Adjustment Report
        return stockAdjustments.map((sa) => ({
          col1: sa.adjustmentNumber,
          col2: sa.productName,
          col3: sa.currentSystemStock,
          col4: sa.physicalStock,
          col5: sa.difference >= 0 ? `+${sa.difference}` : sa.difference,
          col6: sa.reason,
          col7: sa.status,
        }));

      case 10: // Product Performance Report
        return products.map((p) => ({
          col1: p.productCode,
          col2: p.name,
          col3: `₹${p.purchaseCost}`,
          col4: `₹${p.sellingPrice}`,
          col5: `₹${p.sellingPrice - p.purchaseCost}`,
          col6: p.currentStock,
          col7: 'Active Model',
        }));

      default:
        return [];
    }
  };

  const reportData = getReportData();
  const totalPages = Math.ceil(reportData.length / itemsPerPage) || 1;
  const paginatedData = reportData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getReportHeaders = () => {
    switch (activeReport) {
      case 1:
        return ['Product Code', 'Product Name', 'Category', 'Selling Price', 'Current Stock', 'Min Stock', 'Stock Alert'];
      case 2:
        return ['SKU', 'Product Name', 'Opening Stock', 'Current Stock', 'Total Valuation', 'Status', 'Type'];
      case 3:
        return ['Production #', 'Product', 'Planned Qty', 'Produced Qty', 'Start Date', 'Expected Date', 'Status'];
      case 4:
        return ['BOM #', 'Product Name', 'Version', 'Total Materials', 'Created Date', 'Created By', 'Status'];
      case 5:
        return ['Product', 'Raw Material', 'Qty / Unit', 'Wastage %', 'Available Stock', 'Stock Status', 'BOM Status'];
      case 6:
        return ['Consumption ID', 'Raw Material', 'Quantity Consumed', 'Production Order', 'Date', 'User', 'Status'];
      case 7:
        return ['RMA #', 'Product', 'Customer', 'Qty Damaged', 'Defect / Cause', 'Date', 'Action'];
      case 8:
        return ['RMA #', 'Product', 'Customer', 'Quantity', 'Return Reason', 'Date', 'RMA Status'];
      case 9:
        return ['Adjustment #', 'Product', 'System Stock', 'Physical Count', 'Difference', 'Reason', 'Approval Status'];
      case 10:
        return ['Product Code', 'Product Name', 'Purchase Cost', 'Selling Price', 'Margin / Unit', 'Inventory Stock', 'Performance'];
      default:
        return ['Col 1', 'Col 2', 'Col 3', 'Col 4', 'Col 5', 'Col 6', 'Col 7'];
    }
  };

  const headers = getReportHeaders();

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...reportData.map((row) => Object.values(row).map((v) => `"${v}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportList.find((r) => r.id === activeReport)?.name.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Visual Chart Analytics Summary Metrics
  const chartMetrics = useMemo(() => {
    switch (activeReport) {
      case 1: { // Product Stock Report
        const totalStock = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
        const lowStock = products.filter((p) => (p.currentStock || 0) <= (p.minStock || 0)).length;
        const healthyStock = products.length - lowStock;
        const totalValuation = products.reduce((acc, p) => acc + (p.currentStock || 0) * (p.sellingPrice || 0), 0);
        return {
          title: 'Stock Health & Distribution Chart',
          totalLabel: 'Total Stock Units',
          totalVal: totalStock.toLocaleString('en-IN'),
          subKpi: `₹${totalValuation.toLocaleString('en-IN')} Total Value`,
          bars: [
            { label: 'Healthy Stock', count: healthyStock, color: 'bg-emerald-600', pct: products.length ? Math.round((healthyStock / products.length) * 100) : 0 },
            { label: 'Low Stock Alert', count: lowStock, color: 'bg-rose-600', pct: products.length ? Math.round((lowStock / products.length) * 100) : 0 },
          ],
        };
      }
      case 2: { // Finished Goods Stock
        const totalFG = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
        const totalValuation = products.reduce((acc, p) => acc + (p.currentStock || 0) * (p.sellingPrice || 0), 0);
        return {
          title: 'Finished Goods Inventory Valuation Chart',
          totalLabel: 'FG Valuation',
          totalVal: `₹${totalValuation.toLocaleString('en-IN')}`,
          subKpi: `${totalFG.toLocaleString('en-IN')} Finished Units in Warehouse`,
          bars: [
            { label: 'Active FG Inventory', count: totalFG, color: 'bg-blue-600', pct: 100 },
          ],
        };
      }
      case 3: { // Production Report
        const planned = productionOrders.reduce((acc: number, p: any) => acc + (p.plannedQuantity || p.quantityToProduce || 0), 0);
        const produced = productionOrders.reduce((acc: number, p: any) => acc + (p.producedQuantity || 0), 0);
        const completionRate = planned > 0 ? Math.min(100, Math.round((produced / planned) * 100)) : 0;
        return {
          title: 'Production Order Fulfillment Chart',
          totalLabel: 'Units Produced',
          totalVal: `${produced} / ${planned} Units`,
          subKpi: `${completionRate}% Completion Rate`,
          bars: [
            { label: 'Completed Output', count: produced, color: 'bg-blue-600', pct: completionRate },
            { label: 'Pending Production', count: Math.max(0, planned - produced), color: 'bg-amber-500', pct: 100 - completionRate },
          ],
        };
      }
      case 4: { // BOM Report
        const totalBoms = boms.length;
        const totalItems = boms.reduce((acc, b) => acc + (b.items?.length || 0), 0);
        return {
          title: 'BOM Recipes & Component Count Chart',
          totalLabel: 'Active BOM Recipes',
          totalVal: `${totalBoms} BOMs`,
          subKpi: `${totalItems} Total Linked Raw Materials`,
          bars: [
            { label: 'Configured BOMs', count: totalBoms, color: 'bg-blue-600', pct: 100 },
          ],
        };
      }
      default: {
        return {
          title: `${reportList.find((r) => r.id === activeReport)?.name} Analytics Chart`,
          totalLabel: 'Total Records Filtered',
          totalVal: `${reportData.length} Entries`,
          subKpi: 'Live Synchronized ERP Data',
          bars: [
            { label: 'Filtered Output', count: reportData.length, color: 'bg-blue-600', pct: 100 },
          ],
        };
      }
    }
  }, [activeReport, products, productionOrders, boms, reportData.length]);

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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Management Reports</h1>
            <p className="text-xs text-slate-600 mt-1">
              Comprehensive analytics reports for inventory valuation, BOM recipes, shopfloor builds, material consumption, and RMA returns.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-blue-900/10 shrink-0"
          >
            <Download className="w-4 h-4 text-white" /> Export Report (CSV)
          </button>
        </div>

        {/* 10 Report Selector Cards Grid with Collapse/Expand Option */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Report Modules (10)
              </span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md border border-blue-200">
                Current: #{activeReport} {reportList.find((r) => r.id === activeReport)?.name}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsModulesCollapsed(!isModulesCollapsed)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-2xs transition"
              title="Toggle report modules grid to free up screen space"
            >
              {isModulesCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Show All Modules</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide Module Cards</span>
                </>
              )}
            </button>
          </div>

          {!isModulesCollapsed && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              {reportList.map((rep) => {
                const Icon = rep.icon;
                const isSelected = activeReport === rep.id;
                return (
                  <button
                    key={rep.id}
                    onClick={() => {
                      setActiveReport(rep.id);
                      setCurrentPage(1);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-white' : 'text-blue-600'}`}>#{rep.id}</span>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <div className="text-xs font-bold leading-tight">{rep.name}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Visual Chart & Analytics Summary Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{chartMetrics.title}</h3>
                <p className="text-[11px] text-slate-500">{chartMetrics.subKpi}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-black font-mono text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                {chartMetrics.totalVal}
              </span>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                {chartMetrics.totalLabel}
              </span>
            </div>
          </div>

          {/* Visual Progress / Comparison Chart Bars */}
          <div className="space-y-2 pt-1">
            {chartMetrics.bars.map((bar, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${bar.color}`} />
                    {bar.label}
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    {typeof bar.count === 'number' ? bar.count.toLocaleString('en-IN') : bar.count} ({bar.pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${bar.color} rounded-full transition-all duration-500`}
                    style={{ width: `${bar.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search report entries..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold">
              <Calendar className="w-3.5 h-3.5" /> Range:
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none transition"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none transition"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none transition"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Report Output Table */}
        <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              {reportList.find((r) => r.id === activeReport)?.name} Output
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Showing {paginatedData.length} of {reportData.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                  {headers.map((h, idx) => (
                    <th key={idx} className="p-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-blue-700 font-bold">{row.col1}</td>
                    <td className="p-3.5 font-bold text-slate-900">{row.col2}</td>
                    <td className="p-3.5 text-slate-700">{row.col3}</td>
                    <td className="p-3.5 text-slate-700">{row.col4}</td>
                    <td className="p-3.5 text-slate-700">{row.col5}</td>
                    <td className="p-3.5 text-slate-600">{row.col6}</td>
                    <td className="p-3.5 font-bold text-emerald-700">{row.col7}</td>
                  </tr>
                ))}

                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500 text-xs">
                      No matching records found for this report.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-semibold"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
