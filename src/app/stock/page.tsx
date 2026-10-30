'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RAW_MATERIAL_NAV, PRODUCT_NAV, SALES_NAV, ADMIN_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { DemoUser } from '@/lib/auth';
import { UserRole } from '@/types/erp';
import {
  Boxes,
  Layers,
  PackageCheck,
  Search,
  Filter,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp,
  TrendingDown,
  X,
  Lock,
  ArrowRight,
  ShieldCheck,
  Info,
  Calendar,
  User,
  Sparkles,
  Download,
  ArrowUpDown,
  SlidersHorizontal,
  Clock,
  List,
  RotateCcw,
} from 'lucide-react';

interface UnifiedStockItem {
  id: string;
  name: string;
  code: string;
  type: 'Raw Material' | 'Finished Product';
  currentStock: number;
  minStock: number;
  unit: string;
  category?: string;
}

interface UnifiedStockHistoryItem {
  id: string;
  date: string;
  stockName: string;
  stockCode: string;
  stockType: 'Raw Material' | 'Finished Product';
  source: string;
  previousStock: number;
  newStock: number;
  adjustment: number;
  reason: string;
  notes?: string;
  updatedBy: string;
  unit: string;
}

export default function CentralizedStockPage({
  defaultType,
  pageTitle,
}: {
  defaultType?: 'ALL' | 'Raw Material' | 'Finished Product';
  pageTitle?: string;
} = {}) {
  const {
    activeRole,
    rawMaterials,
    products,
    stockAdjustments,
    stockTransactions,
    fgTransactions,
    updateStockQuantity,
    refreshRawMaterialsFromDB,
    refreshProductsFromDB,
  } = useERP();

  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Raw Material' | 'Finished Product' | 'LOW_STOCK'>(
    defaultType || 'ALL'
  );

  // Date-wise History View Controls
  const [historyScope, setHistoryScope] = useState<'ADJUSTMENTS' | 'ALL_MOVEMENTS'>('ADJUSTMENTS');
  const [historyDatePreset, setHistoryDatePreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  const [historySpecificDate, setHistorySpecificDate] = useState<string>('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'ALL' | 'Raw Material' | 'Finished Product'>('ALL');
  const [historySortOrder, setHistorySortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [historyGroupByDate, setHistoryGroupByDate] = useState<boolean>(true);

  // Edit Stock Modal State
  const [editingItem, setEditingItem] = useState<UnifiedStockItem | null>(null);
  const [newQuantityInput, setNewQuantityInput] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('Physical Stock Correction');
  const [customReason, setCustomReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Direct Inline Quantity Editing State
  const [inlineQuantities, setInlineQuantities] = useState<Record<string, string>>({});
  const [savingRowKey, setSavingRowKey] = useState<string | null>(null);

  const handleInlineChange = (key: string, val: string) => {
    setInlineQuantities((prev) => ({ ...prev, [key]: val }));
  };

  const handleCancelInline = (key: string) => {
    setInlineQuantities((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleDirectSave = async (item: UnifiedStockItem) => {
    const key = `${item.type}-${item.id}`;
    const rawVal = inlineQuantities[key];
    if (rawVal === undefined || rawVal === '') return;

    const parsedVal = parseFloat(rawVal);
    if (isNaN(parsedVal) || parsedVal < 0) {
      setFeedbackMsg({ type: 'error', text: 'Please enter a valid non-negative number for stock quantity.' });
      return;
    }

    if (parsedVal === item.currentStock) {
      handleCancelInline(key);
      return;
    }

    setSavingRowKey(key);
    try {
      const res = updateStockQuantity({
        itemId: item.id,
        stockType: item.type,
        newQuantity: parsedVal,
        reason: 'Direct Stock Update',
        notes: `Direct table inline quantity update: ${item.currentStock} -> ${parsedVal} ${item.unit}`,
        updatedBy: currentUser?.name || (activeRole === 'ADMIN' ? 'Admin' : activeRole),
      });

      if (res.success) {
        handleCancelInline(key);
        setFeedbackMsg({
          type: 'success',
          text: `Directly updated "${item.name}" stock to ${parsedVal} ${item.unit}. Centralized stock synced everywhere!`,
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Failed to update stock quantity.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error updating stock.' });
    } finally {
      setSavingRowKey(null);
    }
  };

  // Load user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('crm_user');
      if (stored) {
        const u: DemoUser = JSON.parse(stored);
        setCurrentUser(u);
        if (!defaultType) {
          if (u.role === 'RAW_MATERIAL') setTypeFilter('Raw Material');
          else if (u.role === 'PRODUCT') setTypeFilter('Finished Product');
        }
      }
    } catch {
      // Ignore fallback
    }
  }, [defaultType]);

  useEffect(() => {
    refreshRawMaterialsFromDB();
    refreshProductsFromDB();
  }, []);

  // Determine navigation items based on role
  const getNavItems = () => {
    if (activeRole === 'ADMIN' || currentUser?.role === 'ADMIN') return ADMIN_NAV;
    if (activeRole === 'RAW_MATERIAL' || currentUser?.role === 'RAW_MATERIAL') return RAW_MATERIAL_NAV;
    if (activeRole === 'PRODUCT' || currentUser?.role === 'PRODUCT') return PRODUCT_NAV;
    return SALES_NAV;
  };

  const getRoleTitle = () => {
    if (activeRole === 'ADMIN' || currentUser?.role === 'ADMIN') return 'Executive Administration';
    if (activeRole === 'RAW_MATERIAL') return 'Raw Material Portal';
    if (activeRole === 'PRODUCT') return 'Product Portal';
    return 'Sales Portal';
  };

  const getRoleBadge = () => {
    return activeRole;
  };

  // Combine raw materials and products into ONE single stock list
  const combinedStock: UnifiedStockItem[] = useMemo(() => {
    const list: UnifiedStockItem[] = [];

    // 1. Raw Materials
    rawMaterials.forEach((rm) => {
      list.push({
        id: rm.id,
        name: rm.name,
        code: rm.sku,
        type: 'Raw Material',
        currentStock: rm.currentStock,
        minStock: rm.minStock,
        unit: rm.unit || 'PCS',
        category: rm.category,
      });
    });

    // 2. Finished Products
    products.forEach((p) => {
      list.push({
        id: p.id,
        name: p.name,
        code: p.productCode || p.sku,
        type: 'Finished Product',
        currentStock: p.currentStock,
        minStock: p.minStock,
        unit: 'PCS',
        category: p.category,
      });
    });

    return list;
  }, [rawMaterials, products]);

  // Statistics counters
  const stats = useMemo(() => {
    const totalItems = combinedStock.length;
    const rawMaterialCount = rawMaterials.length;
    const finishedProductCount = products.length;
    const lowStockCount = combinedStock.filter((item) => item.currentStock <= item.minStock).length;
    const totalAdjustments = stockAdjustments.length;

    return {
      totalItems,
      rawMaterialCount,
      finishedProductCount,
      lowStockCount,
      totalAdjustments,
    };
  }, [combinedStock, rawMaterials, products, stockAdjustments]);

  // Filtered stock items
  const filteredStock = useMemo(() => {
    return combinedStock.filter((item) => {
      // Type filter
      if (typeFilter === 'Raw Material' && item.type !== 'Raw Material') return false;
      if (typeFilter === 'Finished Product' && item.type !== 'Finished Product') return false;
      if (typeFilter === 'LOW_STOCK' && item.currentStock > item.minStock) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchCategory) return false;
      }

      return true;
    });
  }, [combinedStock, typeFilter, searchQuery]);

  // Date Formatter helper
  const formatDateHeader = (dateStr: string) => {
    if (!dateStr) return 'Unknown Date';
    const todayStr = new Date().toISOString().split('T')[0];
    const yestDate = new Date();
    yestDate.setDate(yestDate.getDate() - 1);
    const yesterdayStr = yestDate.toISOString().split('T')[0];

    const d = new Date(dateStr);
    const isValid = !isNaN(d.getTime());
    const formatted = isValid
      ? d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
      : dateStr;

    if (dateStr === todayStr) return `${formatted} • Today`;
    if (dateStr === yesterdayStr) return `${formatted} • Yesterday`;
    return formatted;
  };

  // 1. Combine All Stock History Data
  const allHistoryItems = useMemo<UnifiedStockHistoryItem[]>(() => {
    const list: UnifiedStockHistoryItem[] = [];

    // Stock Adjustments (Quantity modifications)
    (stockAdjustments || []).forEach((adj) => {
      const stockName = adj.productName || adj.materialName || 'Stock Item';
      const stockCode = adj.stockCode || adj.productId || '-';
      const stockType: 'Raw Material' | 'Finished Product' =
        adj.stockType || (stockCode.startsWith('RM') ? 'Raw Material' : 'Finished Product');
      const prev = adj.currentSystemStock ?? adj.previousStock ?? 0;
      const updated = adj.physicalStock ?? adj.newStock ?? 0;
      const diff = adj.difference ?? (updated - prev);

      list.push({
        id: adj.id,
        date: adj.date || new Date().toISOString().split('T')[0],
        stockName,
        stockCode,
        stockType,
        source: 'Quantity Adjustment',
        previousStock: prev,
        newStock: updated,
        adjustment: diff,
        reason: adj.reason || 'Physical Stock Correction',
        notes: adj.notes,
        updatedBy: adj.requestedBy || adj.adjustedBy || 'Admin',
        unit: adj.unit || (stockType === 'Raw Material' ? 'Meter' : 'PCS'),
      });
    });

    if (historyScope === 'ALL_MOVEMENTS') {
      // Raw Material Transactions (Receipts, Consumptions, etc.)
      (stockTransactions || []).forEach((tx) => {
        const isDuplicate = list.some((it) => it.id === tx.id || it.notes?.includes(tx.reference));
        if (isDuplicate) return;

        const rm = rawMaterials.find((m) => m.id === tx.materialId || m.name === tx.materialName);
        const diff = tx.quantityIn > 0 ? tx.quantityIn : -tx.quantityOut;

        list.push({
          id: tx.id,
          date: tx.date || new Date().toISOString().split('T')[0],
          stockName: tx.materialName,
          stockCode: rm?.sku || tx.materialId,
          stockType: 'Raw Material',
          source: tx.transactionType,
          previousStock: tx.previousBalance,
          newStock: tx.newBalance,
          adjustment: diff,
          reason: `${tx.transactionType}${tx.reference ? ` (${tx.reference})` : ''}`,
          notes: tx.reference,
          updatedBy: tx.user || 'Store Manager',
          unit: rm?.unit || 'PCS',
        });
      });

      // Finished Goods Transactions (Production, Sales, etc.)
      (fgTransactions || []).forEach((tx) => {
        const isDuplicate = list.some((it) => it.id === tx.id || it.notes?.includes(tx.reference));
        if (isDuplicate) return;

        const p = products.find((prod) => prod.id === tx.productId || prod.name === tx.productName);
        const diff = tx.quantityIn > 0 ? tx.quantityIn : -tx.quantityOut;

        list.push({
          id: tx.id,
          date: tx.date || new Date().toISOString().split('T')[0],
          stockName: tx.productName,
          stockCode: p?.productCode || p?.sku || tx.productId,
          stockType: 'Finished Product',
          source: tx.transactionType,
          previousStock: tx.previousBalance,
          newStock: tx.newBalance,
          adjustment: diff,
          reason: `${tx.transactionType}${tx.reference ? ` (${tx.reference})` : ''}`,
          notes: tx.reference,
          updatedBy: tx.user || 'Production',
          unit: 'PCS',
        });
      });
    }

    return list;
  }, [stockAdjustments, stockTransactions, fgTransactions, rawMaterials, products, historyScope]);

  // 2. Filtered History Records (Date-Wise, Search, and Type)
  const filteredHistory = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yestDate = new Date();
    yestDate.setDate(yestDate.getDate() - 1);
    const yesterdayStr = yestDate.toISOString().split('T')[0];

    const sevenDaysAgoDate = new Date();
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().split('T')[0];

    const currentMonthPrefix = todayStr.slice(0, 7); // YYYY-MM

    return allHistoryItems
      .filter((item) => {
        // Stock Type Filter
        if (historyTypeFilter !== 'ALL' && item.stockType !== historyTypeFilter) {
          return false;
        }

        // Specific Date Picker Filter
        if (historySpecificDate && item.date !== historySpecificDate) {
          return false;
        }

        // Date Preset / Range Filters
        if (!historySpecificDate) {
          if (historyDatePreset === 'TODAY' && item.date !== todayStr) return false;
          if (historyDatePreset === 'YESTERDAY' && item.date !== yesterdayStr) return false;
          if (historyDatePreset === 'LAST_7_DAYS' && (item.date < sevenDaysAgoStr || item.date > todayStr)) return false;
          if (historyDatePreset === 'THIS_MONTH' && !item.date.startsWith(currentMonthPrefix)) return false;
          if (historyDatePreset === 'CUSTOM') {
            if (historyStartDate && item.date < historyStartDate) return false;
            if (historyEndDate && item.date > historyEndDate) return false;
          }
        }

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = item.stockName.toLowerCase();
          const code = item.stockCode.toLowerCase();
          const reason = item.reason.toLowerCase();
          const user = item.updatedBy.toLowerCase();
          const date = item.date.toLowerCase();
          if (!name.includes(q) && !code.includes(q) && !reason.includes(q) && !user.includes(q) && !date.includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (historySortOrder === 'NEWEST') {
          return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
        }
        return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
      });
  }, [
    allHistoryItems,
    historyTypeFilter,
    historySpecificDate,
    historyDatePreset,
    historyStartDate,
    historyEndDate,
    searchQuery,
    historySortOrder,
  ]);

  // 3. Group History Records by Date
  const groupedHistory = useMemo(() => {
    const map = new Map<string, UnifiedStockHistoryItem[]>();

    filteredHistory.forEach((item) => {
      const d = item.date || 'Unknown Date';
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(item);
    });

    const groups: {
      date: string;
      displayDate: string;
      items: UnifiedStockHistoryItem[];
      totalNetAdj: number;
      additionsCount: number;
      deductionsCount: number;
    }[] = [];

    map.forEach((items, date) => {
      let net = 0;
      let additions = 0;
      let deductions = 0;

      items.forEach((it) => {
        net += it.adjustment || 0;
        if ((it.adjustment || 0) > 0) additions++;
        else if ((it.adjustment || 0) < 0) deductions++;
      });

      groups.push({
        date,
        displayDate: formatDateHeader(date),
        items,
        totalNetAdj: net,
        additionsCount: additions,
        deductionsCount: deductions,
      });
    });

    return groups;
  }, [filteredHistory]);

  // 4. History Stats KPI calculations
  const historyStats = useMemo(() => {
    const totalEntries = filteredHistory.length;
    const activeDates = new Set(filteredHistory.map((h) => h.date)).size;
    const netAdjustment = filteredHistory.reduce((acc, h) => acc + (h.adjustment || 0), 0);
    const totalAdditions = filteredHistory.filter((h) => (h.adjustment || 0) > 0).reduce((acc, h) => acc + h.adjustment, 0);
    const totalDeductions = filteredHistory.filter((h) => (h.adjustment || 0) < 0).reduce((acc, h) => acc + Math.abs(h.adjustment), 0);

    return {
      totalEntries,
      activeDates,
      netAdjustment,
      totalAdditions,
      totalDeductions,
    };
  }, [filteredHistory]);

  // 5. CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Stock Name',
      'Stock Code',
      'Stock Type',
      'Movement / Source',
      'Previous Qty',
      'Updated Qty',
      'Adjustment',
      'Unit',
      'Reason',
      'Updated By',
    ];

    const rows = filteredHistory.map((item) => [
      item.date,
      `"${item.stockName.replace(/"/g, '""')}"`,
      `"${item.stockCode}"`,
      item.stockType,
      item.source,
      item.previousStock,
      item.newStock,
      item.adjustment > 0 ? `+${item.adjustment}` : item.adjustment,
      item.unit,
      `"${item.reason.replace(/"/g, '""')}"`,
      `"${item.updatedBy.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_History_Datewise_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Permission check helper
  const canEditItem = (itemType: 'Raw Material' | 'Finished Product'): boolean => {
    if (activeRole === 'ADMIN') return true;
    if (activeRole === 'PRODUCT' || activeRole === 'PRODUCTION') return true;
    if (activeRole === 'RAW_MATERIAL' || activeRole === 'STORE') return true;
    return false;
  };

  // Open Edit Modal
  const handleOpenEdit = (item: UnifiedStockItem) => {
    if (!canEditItem(item.type)) {
      setFeedbackMsg({
        type: 'error',
        text: `Unauthorized: ${activeRole} is not permitted to edit ${item.type} stock.`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }
    setEditingItem(item);
    setNewQuantityInput(String(item.currentStock));
    setSelectedReason('Physical Stock Correction');
    setCustomReason('');
    setNotes('');
    setFeedbackMsg(null);
  };

  // Live adjustment calculation
  const parsedNewQty = parseFloat(newQuantityInput);
  const isValidNumber = !isNaN(parsedNewQty) && parsedNewQty >= 0;
  const previousQty = editingItem ? editingItem.currentStock : 0;
  const adjustmentDiff = isValidNumber ? parsedNewQty - previousQty : 0;

  // Handle Save Updated Stock Quantity
  const handleSaveQuantity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!isValidNumber) {
      setFeedbackMsg({ type: 'error', text: 'Please enter a valid non-negative number for the new stock quantity.' });
      return;
    }

    const finalReason = selectedReason === 'Other' ? (customReason.trim() || 'Other Adjustment') : selectedReason;

    setIsSubmitting(true);
    try {
      const res = updateStockQuantity({
        itemId: editingItem.id,
        stockType: editingItem.type,
        newQuantity: parsedNewQty,
        reason: finalReason,
        notes: notes.trim() || undefined,
        updatedBy: currentUser?.name || (activeRole === 'ADMIN' ? 'Admin' : activeRole),
      });

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Updated "${editingItem.name}" stock to ${parsedNewQty} ${editingItem.unit}. Centralized stock synced everywhere!`,
        });
        setEditingItem(null);
        setTimeout(() => setFeedbackMsg(null), 5000);
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Failed to update stock quantity.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error updating stock.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      roleTitle={getRoleTitle()}
      roleBadge={getRoleBadge()}
      navItems={getNavItems()}
    >
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-600 to-slate-800 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {pageTitle || (defaultType === 'Raw Material' ? 'Raw Material Stock' : defaultType === 'Finished Product' ? 'Finished Product Stock' : 'Centralized Stock')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Single Source of Truth
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Unified live inventory for all Raw Materials and Finished Products. Quantities edited here immediately update all modules.
              </p>
            </div>
          </div>

          {/* Role Access Indicator */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 self-start md:self-auto">
            <div className={`w-2.5 h-2.5 rounded-full ${activeRole === 'ADMIN' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-blue-500 ring-4 ring-blue-100'}`} />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Role</div>
              <div className="text-xs font-bold text-slate-800">
                {activeRole}
                <span className="font-normal text-slate-500 ml-1.5">
                  {activeRole === 'ADMIN'
                    ? '• Full Stock Access'
                    : activeRole === 'PRODUCT' || activeRole === 'PRODUCTION'
                    ? '• Product & Raw Material Stock Update'
                    : activeRole === 'RAW_MATERIAL' || activeRole === 'STORE'
                    ? '• Raw Material & Product Stock Update'
                    : '• View Only'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="p-1 rounded-md hover:bg-black/5 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Stock Items</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.totalItems}</span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Shared ERP Catalog</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Raw Materials</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.rawMaterialCount}</span>
              <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Connectors, Wires & Parts</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Finished Products</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.finishedProductCount}</span>
              <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">Cables & Harnesses</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Low Stock Alerts</span>
              <span className={`text-2xl font-black mt-1 block ${stats.lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {stats.lowStockCount}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {stats.lowStockCount > 0 ? 'Requires attention' : 'All stocks optimal'}
              </span>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${stats.lowStockCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 pt-3 rounded-t-2xl border-t border-x">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('current')}
              className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'current'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Boxes className="w-4 h-4" /> Current Stock
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold">
                {combinedStock.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-4 h-4" /> Stock History
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold">
                {stockAdjustments.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            {activeTab === 'current' ? 'Click "Edit" to adjust any stock level' : 'Read-only audit record'}
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-b-2xl border-b border-x border-slate-200 shadow-xs p-6 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === 'current' ? 'Search by stock name or code...' : 'Search history logs...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filters (Current Stock tab) */}
            {activeTab === 'current' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    typeFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({combinedStock.length})
                </button>
                <button
                  onClick={() => setTypeFilter('Raw Material')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    typeFilter === 'Raw Material'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Raw Material ({stats.rawMaterialCount})
                </button>
                <button
                  onClick={() => setTypeFilter('Finished Product')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    typeFilter === 'Finished Product'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  Finished Product ({stats.finishedProductCount})
                </button>
                <button
                  onClick={() => setTypeFilter('LOW_STOCK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    typeFilter === 'LOW_STOCK'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Low Stock ({stats.lowStockCount})
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: CURRENT STOCK TABLE */}
          {activeTab === 'current' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-2.5 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Direct Stock Editing:</strong> You can directly change the quantity inside the input box in the table and press <kbd className="px-1.5 py-0.5 rounded bg-white border border-blue-200 text-[10px] font-mono font-bold shadow-2xs">Enter</kbd> or click <strong>Update</strong> to save immediately.
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Stock Name</th>
                    <th className="px-4 py-3.5">Stock Code</th>
                    <th className="px-4 py-3.5">Stock Type</th>
                    <th className="px-4 py-3.5 text-right">Quantity</th>
                    <th className="px-4 py-3.5 text-center">Unit</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStock.map((item) => {
                    const rowKey = `${item.type}-${item.id}`;
                    const isLow = item.currentStock <= item.minStock;
                    const canEdit = canEditItem(item.type);
                    const inlineVal = inlineQuantities[rowKey] !== undefined ? inlineQuantities[rowKey] : String(item.currentStock);
                    const parsedInline = parseFloat(inlineVal);
                    const isChanged = inlineQuantities[rowKey] !== undefined && !isNaN(parsedInline) && parsedInline !== item.currentStock;
                    const inlineDiff = isChanged ? parsedInline - item.currentStock : 0;

                    return (
                      <tr
                        key={rowKey}
                        className={`hover:bg-slate-50/80 transition ${
                          isChanged ? 'bg-blue-50/20' : isLow ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Stock Name */}
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {item.category && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{item.category}</div>
                          )}
                        </td>

                        {/* Stock Code */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {item.code}
                          </span>
                        </td>

                        {/* Stock Type */}
                        <td className="px-4 py-3.5">
                          {item.type === 'Raw Material' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Raw Material
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                              Finished Product
                            </span>
                          )}
                        </td>

                        {/* Quantity (Direct Editable Input for authorized users) */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit ? (
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={inlineVal}
                                    onChange={(e) => handleInlineChange(rowKey, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleDirectSave(item);
                                      if (e.key === 'Escape') handleCancelInline(rowKey);
                                    }}
                                    title="Directly edit quantity here. Press Enter or click Update to save."
                                    className={`w-28 px-2.5 py-1 text-right font-mono text-sm font-bold rounded-lg border transition focus:outline-none focus:ring-2 ${
                                      isChanged
                                        ? 'border-blue-500 bg-blue-50/60 text-blue-900 focus:ring-blue-500/20 shadow-2xs'
                                        : item.currentStock === 0
                                        ? 'border-rose-200 bg-rose-50/30 text-rose-600 focus:border-blue-500'
                                        : isLow
                                        ? 'border-amber-200 bg-amber-50/30 text-amber-600 focus:border-blue-500'
                                        : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-blue-500'
                                    }`}
                                  />
                                  {isLow && !isChanged && (
                                    <span
                                      title={`Low Stock! Min required: ${item.minStock} ${item.unit}`}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-tight shrink-0"
                                    >
                                      Low
                                    </span>
                                  )}
                                </div>
                                {isChanged && (
                                  <span
                                    className={`text-[10px] font-mono font-bold ${
                                      inlineDiff > 0 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                  >
                                    {inlineDiff > 0 ? `+${inlineDiff}` : inlineDiff} {item.unit}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-mono text-sm font-black ${
                                    item.currentStock === 0
                                      ? 'text-rose-600'
                                      : isLow
                                      ? 'text-amber-600'
                                      : 'text-slate-900'
                                  }`}
                                >
                                  {item.currentStock.toLocaleString('en-IN')}
                                </span>
                                {isLow && (
                                  <span
                                    title={`Low Stock! Min required: ${item.minStock} ${item.unit}`}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-tight"
                                  >
                                    Low
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Unit */}
                        <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-500">
                          {item.unit}
                        </td>

                        {/* Action: Quick Update or Modal Edit */}
                        <td className="px-5 py-3.5 text-right">
                          {canEdit ? (
                            isChanged ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDirectSave(item)}
                                  disabled={savingRowKey === rowKey}
                                  title="Save updated stock quantity"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {savingRowKey === rowKey ? 'Saving...' : 'Update'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelInline(rowKey)}
                                  title="Cancel changes"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                title="Open adjustment modal for reason & remarks"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white transition shadow-2xs cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            )
                          ) : (
                            <span
                              title={`View only: ${activeRole} cannot edit ${item.type} stock.`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                            >
                              <Lock className="w-3 h-3" />
                              View Only
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredStock.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 text-xs">
                        <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No stock records matching the current criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

          {/* TAB 2: STOCK HISTORY (DATE-WISE VIEW) */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Info banner */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Date-Wise Stock History & Audit Trail</div>
                    <div className="text-[11px] text-blue-700 mt-0.5">
                      Every stock quantity change and movement is logged date-wise with immutable records of previous stock, new stock, calculated differences, and user audits.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition shadow-2xs shrink-0 cursor-pointer"
                  title="Export filtered date-wise stock history to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* DATE-WISE CONTROLS TOOLBAR */}
              {/* ------------------------------------------------------------- */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                {/* Row 1: Scope, Type, Grouping & Sort */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Left: Scope Selector (Adjustments vs All Movements) */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Scope:
                    </span>
                    <div className="inline-flex p-0.5 bg-slate-200/80 rounded-lg text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setHistoryScope('ADJUSTMENTS')}
                        className={`px-3 py-1 rounded-md transition ${
                          historyScope === 'ADJUSTMENTS'
                            ? 'bg-white text-blue-700 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Quantity Adjustments
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistoryScope('ALL_MOVEMENTS')}
                        className={`px-3 py-1 rounded-md transition ${
                          historyScope === 'ALL_MOVEMENTS'
                            ? 'bg-white text-blue-700 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All Stock Movements
                      </button>
                    </div>
                  </div>

                  {/* Stock Type Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type:</span>
                    <select
                      value={historyTypeFilter}
                      onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="ALL">All Stock Types</option>
                      <option value="Raw Material">Raw Material Only</option>
                      <option value="Finished Product">Finished Product Only</option>
                    </select>
                  </div>

                  {/* Right: Layout Toggle & Sort */}
                  <div className="flex items-center gap-2">
                    {/* Group by Date Toggle */}
                    <div className="inline-flex p-0.5 bg-slate-200/80 rounded-lg text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setHistoryGroupByDate(true)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                          historyGroupByDate
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Display history grouped by calendar date"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Date Groups
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistoryGroupByDate(false)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                          !historyGroupByDate
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Display history as a continuous flat table"
                      >
                        <List className="w-3.5 h-3.5" />
                        Flat Table
                      </button>
                    </div>

                    {/* Sort Order */}
                    <button
                      type="button"
                      onClick={() => setHistorySortOrder((prev) => (prev === 'NEWEST' ? 'OLDEST' : 'NEWEST'))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                      title="Toggle Date Sort Order"
                    >
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      {historySortOrder === 'NEWEST' ? 'Newest First' : 'Oldest First'}
                    </button>
                  </div>
                </div>

                {/* Row 2: Date Presets & Date Picker Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/70">
                  {/* Date Presets */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      Date:
                    </span>
                    {(
                      [
                        { id: 'ALL', label: 'All Dates' },
                        { id: 'TODAY', label: 'Today' },
                        { id: 'YESTERDAY', label: 'Yesterday' },
                        { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                        { id: 'THIS_MONTH', label: 'This Month' },
                        { id: 'CUSTOM', label: 'Custom Range' },
                      ] as const
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setHistoryDatePreset(preset.id);
                          setHistorySpecificDate('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                          historyDatePreset === preset.id && !historySpecificDate
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Specific Date Picker / Jump to Date */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 whitespace-nowrap">Jump to Date:</span>
                      <input
                        type="date"
                        value={historySpecificDate}
                        onChange={(e) => {
                          setHistorySpecificDate(e.target.value);
                          if (e.target.value) setHistoryDatePreset('ALL');
                        }}
                        className="bg-transparent text-xs font-mono font-semibold text-slate-800 focus:outline-none"
                      />
                      {historySpecificDate && (
                        <button
                          type="button"
                          onClick={() => setHistorySpecificDate('')}
                          className="text-slate-400 hover:text-slate-600 ml-1"
                          title="Clear date selection"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Reset All Filters Button */}
                    {(historyDatePreset !== 'ALL' ||
                      historySpecificDate ||
                      historyTypeFilter !== 'ALL' ||
                      searchQuery.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryDatePreset('ALL');
                          setHistorySpecificDate('');
                          setHistoryStartDate('');
                          setHistoryEndDate('');
                          setHistoryTypeFilter('ALL');
                          setSearchQuery('');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
                        title="Clear all date and filter constraints"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Custom Date Range Inputs (if CUSTOM is selected) */}
                {historyDatePreset === 'CUSTOM' && !historySpecificDate && (
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200/70 bg-white/70 p-3 rounded-xl border border-dashed">
                    <span className="text-xs font-bold text-slate-700">Custom Range:</span>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-500">From:</label>
                      <input
                        type="date"
                        value={historyStartDate}
                        onChange={(e) => setHistoryStartDate(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-500">To:</label>
                      <input
                        type="date"
                        value={historyEndDate}
                        onChange={(e) => setHistoryEndDate(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {(historyStartDate || historyEndDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryStartDate('');
                          setHistoryEndDate('');
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 underline ml-2"
                      >
                        Clear Range
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* DATE-WISE SUMMARY KPIS */}
              {/* ------------------------------------------------------------- */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Entries</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {historyStats.totalEntries}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Across {historyStats.activeDates} active {historyStats.activeDates === 1 ? 'date' : 'dates'}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Stock Change</div>
                  <div
                    className={`text-lg font-black font-mono mt-0.5 ${
                      historyStats.netAdjustment > 0
                        ? 'text-emerald-600'
                        : historyStats.netAdjustment < 0
                        ? 'text-rose-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {historyStats.netAdjustment > 0 ? `+${historyStats.netAdjustment.toLocaleString('en-IN')}` : historyStats.netAdjustment.toLocaleString('en-IN')} units
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Net quantity variance in period
                  </div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Additions (+)</div>
                  <div className="text-lg font-black font-mono text-emerald-700 mt-0.5">
                    +{historyStats.totalAdditions.toLocaleString('en-IN')} units
                  </div>
                  <div className="text-[11px] text-emerald-600/80 mt-0.5">
                    Incoming & positive adjustments
                  </div>
                </div>

                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Total Deductions (-)</div>
                  <div className="text-lg font-black font-mono text-rose-700 mt-0.5">
                    -{historyStats.totalDeductions.toLocaleString('en-IN')} units
                  </div>
                  <div className="text-[11px] text-rose-600/80 mt-0.5">
                    Outgoing, consumption & write-offs
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* DATE-WISE CONTENT DISPLAY */}
              {/* ------------------------------------------------------------- */}
              {historyGroupByDate ? (
                /* 1. DATE-GROUPED CARDS VIEW */
                <div className="space-y-6">
                  {groupedHistory.map((group) => (
                    <div
                      key={group.date}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs"
                    >
                      {/* Date Group Header */}
                      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-2xs">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 font-mono">
                              {group.displayDate}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {group.items.length} {group.items.length === 1 ? 'modification record' : 'modification records'}
                            </div>
                          </div>
                        </div>

                        {/* Date Metrics Pill */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                              group.totalNetAdj > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : group.totalNetAdj < 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {group.totalNetAdj > 0 ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : group.totalNetAdj < 0 ? (
                              <TrendingDown className="w-3.5 h-3.5" />
                            ) : null}
                            Net: {group.totalNetAdj > 0 ? `+${group.totalNetAdj}` : group.totalNetAdj} units
                          </span>

                          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                            (<span className="text-emerald-600 font-bold">+{group.additionsCount}</span> /{' '}
                            <span className="text-rose-600 font-bold">-{group.deductionsCount}</span>)
                          </span>
                        </div>
                      </div>

                      {/* Date Items Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-white border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="px-5 py-3">Movement / Source</th>
                              <th className="px-4 py-3">Stock Item</th>
                              <th className="px-4 py-3">Code & Type</th>
                              <th className="px-4 py-3 text-right">Previous</th>
                              <th className="px-4 py-3 text-right">Updated</th>
                              <th className="px-4 py-3 text-center">Adjustment</th>
                              <th className="px-4 py-3">Reason / Details</th>
                              <th className="px-5 py-3 text-right">Updated By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {group.items.map((item) => {
                              const isPositive = item.adjustment > 0;
                              const isNegative = item.adjustment < 0;

                              return (
                                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                  {/* Movement / Source */}
                                  <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      {item.source}
                                    </span>
                                  </td>

                                  {/* Stock Item */}
                                  <td className="px-4 py-3.5">
                                    <div className="font-bold text-slate-900">{item.stockName}</div>
                                    {item.notes && (
                                      <div className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate" title={item.notes}>
                                        {item.notes}
                                      </div>
                                    )}
                                  </td>

                                  {/* Code & Type */}
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block w-max">
                                      {item.stockCode}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                      {item.stockType}
                                    </span>
                                  </td>

                                  {/* Previous */}
                                  <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-600">
                                    {item.previousStock} {item.unit}
                                  </td>

                                  {/* Updated */}
                                  <td className="px-4 py-3.5 text-right font-mono text-xs font-black text-slate-900">
                                    {item.newStock} {item.unit}
                                  </td>

                                  {/* Adjustment Difference */}
                                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                                        isPositive
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : isNegative
                                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {isPositive ? (
                                        <TrendingUp className="w-3 h-3" />
                                      ) : isNegative ? (
                                        <TrendingDown className="w-3 h-3" />
                                      ) : null}
                                      {isPositive ? `+${item.adjustment}` : item.adjustment} {item.unit}
                                    </span>
                                  </td>

                                  {/* Reason / Details */}
                                  <td className="px-4 py-3.5 text-slate-700">
                                    <div className="font-medium text-xs">{item.reason}</div>
                                  </td>

                                  {/* Updated By */}
                                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                      <User className="w-3 h-3 text-slate-400" />
                                      {item.updatedBy}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* 2. FLAT TABLE VIEW (WHEN GROUPING IS DISABLED) */
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-4 py-3.5">Source</th>
                        <th className="px-4 py-3.5">Stock Name</th>
                        <th className="px-4 py-3.5">Code & Type</th>
                        <th className="px-4 py-3.5 text-right">Previous</th>
                        <th className="px-4 py-3.5 text-right">Updated</th>
                        <th className="px-4 py-3.5 text-center">Adjustment</th>
                        <th className="px-4 py-3.5">Reason</th>
                        <th className="px-5 py-3.5 text-right">Updated By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredHistory.map((item) => {
                        const isPositive = item.adjustment > 0;
                        const isNegative = item.adjustment < 0;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition">
                            {/* Date */}
                            <td className="px-5 py-3.5 font-mono text-xs text-slate-600 whitespace-nowrap">
                              {item.date}
                            </td>

                            {/* Source */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {item.source}
                              </span>
                            </td>

                            {/* Stock Name */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-900">{item.stockName}</div>
                              {item.notes && (
                                <div className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate" title={item.notes}>
                                  {item.notes}
                                </div>
                              )}
                            </td>

                            {/* Code & Type */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="font-mono text-xs font-bold text-slate-700 block">
                                {item.stockCode}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {item.stockType}
                              </span>
                            </td>

                            {/* Previous */}
                            <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-600">
                              {item.previousStock} {item.unit}
                            </td>

                            {/* Updated */}
                            <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900">
                              {item.newStock} {item.unit}
                            </td>

                            {/* Adjustment */}
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                                  isPositive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : isNegative
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isPositive ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : isNegative ? (
                                  <TrendingDown className="w-3 h-3" />
                                ) : null}
                                {isPositive ? `+${item.adjustment}` : item.adjustment}
                              </span>
                            </td>

                            {/* Reason */}
                            <td className="px-4 py-3.5 text-slate-700">
                              <span className="font-medium">{item.reason}</span>
                            </td>

                            {/* Updated By */}
                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                <User className="w-3 h-3 text-slate-400" />
                                {item.updatedBy}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* EMPTY STATE */}
              {filteredHistory.length === 0 && (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">No Stock History Records Found</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      No stock adjustments or transactions match the selected date preset{' '}
                      {historySpecificDate ? `("${historySpecificDate}")` : `(${historyDatePreset})`}
                      {historyTypeFilter !== 'ALL' ? ` and type "${historyTypeFilter}"` : ''}
                      {searchQuery ? ` matching "${searchQuery}"` : ''}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryDatePreset('ALL');
                      setHistorySpecificDate('');
                      setHistoryStartDate('');
                      setHistoryEndDate('');
                      setHistoryTypeFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset All Date & Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* EDIT STOCK QUANTITY MODAL (Requirement 2 & 3) */}
        {/* ======================================================== */}
        {editingItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Edit Stock Quantity</h3>
                    <p className="text-xs text-slate-500">Update current stock as single source of truth</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stock Item Details (Read-only reference) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Name</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">{editingItem.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Code</div>
                    <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 mt-0.5 inline-block">
                      {editingItem.code}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Type</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">
                      {editingItem.type === 'Raw Material' ? (
                        <span className="text-amber-700">Raw Material</span>
                      ) : (
                        <span className="text-blue-700">Finished Product</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Quantity</div>
                    <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                      {editingItem.currentStock} {editingItem.unit}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSaveQuantity} className="space-y-4">
                {/* New Quantity Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      New Stock Quantity <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Unit: {editingItem.unit}</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="Enter final current stock..."
                    value={newQuantityInput}
                    onChange={(e) => setNewQuantityInput(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter the final stock count. The system sets this value as the new current stock.
                  </p>
                </div>

                {/* Live Adjustment Calculation (Requirement 3) */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Calculated Adjustment (New - Previous)
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-slate-600">
                      {previousQty} &rarr; {isValidNumber ? parsedNewQty : '—'} {editingItem.unit}
                    </div>
                    <div>
                      {isValidNumber ? (
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-black ${
                            adjustmentDiff > 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : adjustmentDiff < 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {adjustmentDiff > 0 ? (
                            <>
                              <TrendingUp className="w-3.5 h-3.5" /> +{adjustmentDiff} {editingItem.unit} (Addition)
                            </>
                          ) : adjustmentDiff < 0 ? (
                            <>
                              <TrendingDown className="w-3.5 h-3.5" /> {adjustmentDiff} {editingItem.unit} (Deduction)
                            </>
                          ) : (
                            '0 (No Change)'
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Enter valid quantity</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Adjustment Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Adjustment Reason <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Physical Stock Correction">Physical Stock Correction</option>
                    <option value="Physical Audit Reconciliation">Physical Audit Reconciliation</option>
                    <option value="Damaged Stock">Damaged Stock</option>
                    <option value="Missing / Scrap">Missing / Scrap</option>
                    <option value="Counting Error Correction">Counting Error Correction</option>
                    <option value="Supplier Excess / Shortage">Supplier Excess / Shortage</option>
                    <option value="Other">Other (Specify below)</option>
                  </select>

                  {selectedReason === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify adjustment reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="w-full mt-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      required
                    />
                  )}
                </div>

                {/* Notes / Remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Notes / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Audit bay 3, verified with store manager..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !isValidNumber}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Save Stock Quantity
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
