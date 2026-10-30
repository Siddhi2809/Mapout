'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RAW_MATERIAL_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { PurchaseOrder, PurchaseOrderItem, PurchaseRequest, PurchaseRequestStatus } from '@/types/erp';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  FileText,
  Clock,
  Calendar,
  Calculator,
  PlusCircle,
  Truck,
  ArrowRight,
  ClipboardList,
  Printer,
  Download,
  Building2,
} from 'lucide-react';

export default function PurchasePage() {
  const {
    purchaseOrders,
    purchaseRequests,
    suppliers,
    rawMaterials,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    updatePurchaseRequestStatus,
    generateEntityCode,
    refreshRawMaterialsFromDB,
  } = useERP();

  useEffect(() => {
    refreshRawMaterialsFromDB();
  }, []);

  const [activeTab, setActiveTab] = useState<'orders' | 'requests'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [poNumber, setPoNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [orderDate, setOrderDate] = useState(today);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [paymentDueDate, setPaymentDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [freight, setFreight] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // PO Line Items
  const [items, setItems] = useState<
    {
      rawMaterialId: string;
      quantity: number;
      unitCost: number;
      discountPercent: number;
      gstPercent: number;
    }[]
  >([
    {
      rawMaterialId: rawMaterials[0]?.id || '',
      quantity: 100,
      unitCost: rawMaterials[0]?.unitCost || 0,
      discountPercent: 0,
      gstPercent: 18,
    },
  ]);

  const [formError, setFormError] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Item Calculations
  const calculatedItems = useMemo(() => {
    return items.map((item) => {
      const rm = rawMaterials.find((r) => r.id === item.rawMaterialId);
      const rawMaterialName = rm ? rm.name : 'Selected Material';
      const sku = rm ? rm.sku : 'RM-CODE';
      const unit = rm ? rm.unit : 'PCS';

      const lineSub = item.quantity * item.unitCost;
      const lineDisc = lineSub * (item.discountPercent / 100);
      const lineTax = (lineSub - lineDisc) * (item.gstPercent / 100);
      const totalCost = Math.round(lineSub - lineDisc + lineTax);

      return {
        ...item,
        rawMaterialName,
        sku,
        unit,
        lineSub,
        lineDisc,
        lineTax,
        totalCost,
      };
    });
  }, [items, rawMaterials]);

  const grandSubtotal = useMemo(
    () => calculatedItems.reduce((acc, i) => acc + i.lineSub, 0),
    [calculatedItems]
  );
  const grandDiscount = useMemo(
    () => calculatedItems.reduce((acc, i) => acc + i.lineDisc, 0),
    [calculatedItems]
  );
  const grandGST = useMemo(
    () => calculatedItems.reduce((acc, i) => acc + i.lineTax, 0),
    [calculatedItems]
  );
  const grandTotal = useMemo(
    () => Math.round(grandSubtotal - grandDiscount + grandGST + (freight || 0)),
    [grandSubtotal, grandDiscount, grandGST, freight]
  );

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
      const matchesSup = supplierFilter === 'ALL' || po.supplierId === supplierFilter;

      return matchesSearch && matchesStatus && matchesSup;
    });
  }, [purchaseOrders, searchTerm, statusFilter, supplierFilter]);

  const filteredPRs = useMemo(() => {
    return purchaseRequests.filter((pr) => {
      const matchesSearch =
        pr.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pr.rawMaterialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pr.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pr.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || pr.status === statusFilter;
      const matchesSup = supplierFilter === 'ALL' || pr.supplierId === supplierFilter;

      return matchesSearch && matchesStatus && matchesSup;
    });
  }, [purchaseRequests, searchTerm, statusFilter, supplierFilter]);

  const handleConvertPRToPO = (pr: PurchaseRequest) => {
    const targetRM = rawMaterials.find((r) => r.id === pr.rawMaterialId || r.sku === pr.sku);
    const targetSup = suppliers.find((s) => s.id === pr.supplierId);

    if (targetSup) {
      setSelectedSupplierId(targetSup.id);
    } else if (suppliers.length > 0) {
      setSelectedSupplierId(suppliers[0].id);
    }

    setItems([
      {
        rawMaterialId: targetRM ? targetRM.id : pr.rawMaterialId,
        quantity: pr.requestedQuantity,
        unitCost: targetRM ? targetRM.unitCost : 0,
        discountPercent: 0,
        gstPercent: 18,
      },
    ]);

    setNotes(`Converted from Stock Request ${pr.requestId}. ${pr.notes ? `[Notes: ${pr.notes}]` : ''}`);
    setPoNumber(generateEntityCode('PURCHASE_ORDER'));

    if (['Pending', 'Sent'].includes(pr.status)) {
      updatePurchaseRequestStatus(pr.id, 'Supplier Confirmed');
    }

    setIsAddModalOpen(true);
    showToast(`Purchase Request ${pr.requestId} loaded into PO creator.`);
  };

  const handleAddItemRow = () => {
    const firstRM = rawMaterials[0];
    setItems([
      ...items,
      {
        rawMaterialId: firstRM?.id || '',
        quantity: 100,
        unitCost: firstRM?.unitCost || 0,
        discountPercent: 0,
        gstPercent: 18,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) {
      alert('A purchase order must contain at least 1 material item.');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleMaterialChange = (index: number, rmId: string) => {
    const rm = rawMaterials.find((r) => r.id === rmId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      rawMaterialId: rmId,
      unitCost: rm ? rm.unitCost : updated[index].unitCost,
    };
    setItems(updated);
  };

  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedSupplierId) {
      setFormError('Please select a supplier.');
      return;
    }
    if (items.some((i) => i.quantity <= 0)) {
      setFormError('Quantity for all items must be greater than 0.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    const supplierName = supplier ? supplier.name : 'Unknown Vendor';

    const poItems: PurchaseOrderItem[] = calculatedItems.map((ci) => ({
      rawMaterialId: ci.rawMaterialId,
      rawMaterialName: ci.rawMaterialName,
      sku: ci.sku,
      quantity: ci.quantity,
      unit: ci.unit,
      unitCost: ci.unitCost,
      discountPercent: ci.discountPercent,
      gstPercent: ci.gstPercent,
      totalCost: ci.totalCost,
    }));

    const result = createPurchaseOrder({
      poNumber: poNumber || generateEntityCode('PURCHASE_ORDER'),
      invoiceNumber: invoiceNumber || `INV-${poNumber || '001'}`,
      supplierId: selectedSupplierId,
      supplierName,
      orderDate,
      expectedDate,
      paymentDueDate,
      items: poItems,
      subtotal: grandSubtotal,
      discountAmount: grandDiscount,
      gstAmount: grandGST,
      freight,
      totalAmount: grandTotal,
      amountPaid: 0,
      paymentStatus: 'UNPAID',
      status: 'Pending',
      notes,
      createdBy: 'Raw Material Manager',
    });

    if (result.success) {
      showToast(`Purchase Order ${poNumber} created successfully! (Note: Stock will increase only when Material Receipt is accepted)`);
      setIsAddModalOpen(false);
      // Reset form
      setPoNumber(generateEntityCode('PURCHASE_ORDER'));
      setInvoiceNumber('');
      setFreight(0);
      setNotes('');
    } else {
      setFormError(result.message || 'Failed to create purchase order.');
    }
  };

  return (
    <DashboardLayout
      roleTitle="Raw Material Management"
      roleBadge="Raw Material Manager"
      navItems={RAW_MATERIAL_NAV}
    >
      <div className="space-y-6">
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-500/90 text-white shadow-2xl border border-emerald-400 backdrop-blur-md flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-blue-600" /> Purchases & Requisitions
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage Purchase Orders, vendor requisitions, and Low Stock Requests raised from Raw Materials catalog.
            </p>
          </div>
          <button
            onClick={() => {
              setPoNumber(generateEntityCode('PURCHASE_ORDER'));
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Create Purchase Order
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-1">
          <button
            onClick={() => {
              setActiveTab('orders');
              setStatusFilter('ALL');
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" /> Purchase Orders ({purchaseOrders.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('requests');
              setStatusFilter('ALL');
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
              activeTab === 'requests'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-amber-600" /> Stock Requests ({purchaseRequests.length})
            {purchaseRequests.filter((pr) => pr.status === 'Pending' || pr.status === 'Sent').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                {purchaseRequests.filter((pr) => pr.status === 'Pending' || pr.status === 'Sent').length} Active
              </span>
            )}
          </button>
        </div>

        {/* Toolbar */}
        <div className="erp-card p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'orders'
                    ? 'Search PO Number, Supplier...'
                    : 'Search Request ID, Material Name, Code...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
              >
                {activeTab === 'orders' ? (
                  <>
                    <option value="ALL">All PO Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Partially Received">Partially Received</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </>
                ) : (
                  <>
                    <option value="ALL">All Request Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Sent">Sent</option>
                    <option value="Supplier Confirmed">Supplier Confirmed</option>
                    <option value="Partially Received">Partially Received</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TAB 1: PURCHASE ORDERS TABLE */}
        {activeTab === 'orders' && (
          <div className="erp-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">PO Date</th>
                    <th className="py-3 px-4">Expected Date</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Received Qty</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">PO Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPOs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No purchase orders found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPOs.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{po.poNumber}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 max-w-[150px] truncate">{po.supplierName}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{po.orderDate}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{po.expectedDate}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹{po.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">
                          {po.receivedQuantity || 0} units
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              po.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                : po.paymentStatus === 'PARTIAL'
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-rose-50 text-rose-600 border-rose-200'
                            }`}
                          >
                            {po.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={po.status}
                            onChange={(e) =>
                              updatePurchaseOrderStatus(po.id, e.target.value as PurchaseOrder['status'])
                            }
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-800"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Partially Received">Partially Received</option>
                            <option value="Received">Received</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setViewingPO(po)}
                            title="View PO Details"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PURCHASE REQUESTS (LOW STOCK REQUESTS) TABLE */}
        {activeTab === 'requests' && (
          <div className="erp-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Request ID</th>
                    <th className="py-3 px-4">Material Name & Code</th>
                    <th className="py-3 px-4">Preferred Supplier</th>
                    <th className="py-3 px-4">Requested Qty</th>
                    <th className="py-3 px-4">Request Date</th>
                    <th className="py-3 px-4">Created By</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPRs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No purchase requests found. Raise a stock request directly from the Raw Materials catalog when low stock occurs.
                      </td>
                    </tr>
                  ) : (
                    filteredPRs.map((pr) => (
                      <tr key={pr.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-amber-600">{pr.requestId}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{pr.rawMaterialName}</div>
                          <div className="text-[10px] text-blue-600 font-mono">{pr.sku}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{pr.supplierName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                          {pr.requestedQuantity} {pr.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{pr.date}</td>
                        <td className="py-3 px-4 text-slate-500">{pr.createdBy}</td>
                        <td className="py-3 px-4">
                          <select
                            value={pr.status}
                            onChange={(e) => {
                              updatePurchaseRequestStatus(pr.id, e.target.value as PurchaseRequestStatus);
                              showToast(`Purchase Request ${pr.requestId} updated to ${e.target.value}`);
                            }}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold border focus:outline-none ${
                              pr.status === 'Pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : pr.status === 'Sent'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : pr.status === 'Supplier Confirmed'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : pr.status === 'Partially Received'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : pr.status === 'Received'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Sent">Sent</option>
                            <option value="Supplier Confirmed">Supplier Confirmed</option>
                            <option value="Partially Received">Partially Received</option>
                            <option value="Received">Received</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleConvertPRToPO(pr)}
                            className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-sm transition"
                            title="Convert Purchase Request to Official Purchase Order"
                          >
                            Convert to PO <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL 1: CREATE PURCHASE ORDER */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Create Purchase Order</h3>
                    <div className="text-xs text-blue-600 font-mono">{poNumber}</div>
                  </div>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitPO} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Supplier <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.companyName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Invoice Number</label>
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-881"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">PO Date</label>
                    <input
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Due Date</label>
                    <input
                      type="date"
                      value={paymentDueDate}
                      onChange={(e) => setPaymentDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Multi-Item Line Entry Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-600" /> Materials Requisition Items
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 transition border border-blue-200"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add Another Material
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 min-w-[200px]">Raw Material</th>
                          <th className="py-2.5 px-3">Quantity</th>
                          <th className="py-2.5 px-3">Unit Rate (₹)</th>
                          <th className="py-2.5 px-3">Discount %</th>
                          <th className="py-2.5 px-3">GST %</th>
                          <th className="py-2.5 px-3">Total (₹)</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {calculatedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">
                              <select
                                value={item.rawMaterialId}
                                onChange={(e) => handleMaterialChange(idx, e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                              >
                                {rawMaterials.map((rm) => (
                                  <option key={rm.id} value={rm.id}>
                                    {rm.name} ({rm.sku})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const updated = [...items];
                                    updated[idx].quantity = Number(e.target.value);
                                    setItems(updated);
                                  }}
                                  className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900"
                                />
                                <span className="text-[10px] text-slate-500">{item.unit}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min={0}
                                value={item.unitCost}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[idx].unitCost = Number(e.target.value);
                                  setItems(updated);
                                }}
                                className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={item.discountPercent}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[idx].discountPercent = Number(e.target.value);
                                  setItems(updated);
                                }}
                                className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <select
                                value={item.gstPercent}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[idx].gstPercent = Number(e.target.value);
                                  setItems(updated);
                                }}
                                className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                              >
                                <option value={0}>0%</option>
                                <option value={5}>5%</option>
                                <option value={12}>12%</option>
                                <option value={18}>18%</option>
                                <option value={28}>28%</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              ₹{item.totalCost.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PO Financial Calculation Summary Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-2 max-w-xs">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Freight / Delivery Charges (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={freight}
                        onChange={(e) => setFreight(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Note: Stock will be incremented only when a Material Receipt is created and accepted.
                    </p>
                  </div>
                  <div className="space-y-1.5 text-right shrink-0">
                    <div>
                      <span className="text-slate-500">Subtotal:</span>{' '}
                      <span className="font-semibold text-slate-800">
                        ₹{grandSubtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Discount Amount:</span>{' '}
                      <span className="font-semibold text-rose-600">
                        -₹{grandDiscount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">GST Tax Amount:</span>{' '}
                      <span className="font-semibold text-blue-600">
                        +₹{grandGST.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Freight Charges:</span>{' '}
                      <span className="font-semibold text-amber-600">
                        +₹{(freight || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                      Grand Total: ₹{grandTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Order Remarks / Terms
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter delivery instructions, packaging specs, or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm"
                  >
                    Issue Purchase Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: PROFESSIONAL PRINTABLE / PDF STYLE PURCHASE ORDER VIEW */}
        {viewingPO && (() => {
          const supplierObj = suppliers.find((s) => s.id === viewingPO.supplierId);
          return (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[92vh]">
                {/* Modal Toolbar Actions */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 font-mono">
                      PO Document View
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        viewingPO.status === 'Received'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}
                    >
                      {viewingPO.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center gap-2 transition"
                    >
                      <Printer className="w-4 h-4 text-blue-600" /> Print PO
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </button>
                    <button
                      onClick={() => setViewingPO(null)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* --- PRINTABLE BUSINESS DOCUMENT CANVAS --- */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 text-slate-900 font-sans text-xs print:p-0 print:border-none print:bg-white print:text-black">
                  
                  {/* Document Header: Company Brand & PO Title */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-600 text-white font-extrabold text-sm">
                          MAPOUT
                        </div>
                        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                          MAPOUT ENTERPRISE ERP
                        </h2>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Industrial Manufacturing & Procurement Operations<br />
                        GSTIN: 24AAACM1001A1Z0 | Reg. Off: GIDC Industrial Estate, Vadodara, Gujarat
                      </p>
                    </div>

                    <div className="text-right sm:text-right">
                      <h1 className="text-xl font-black text-blue-600 tracking-wider uppercase">
                        PURCHASE ORDER
                      </h1>
                      <div className="text-sm font-mono font-bold text-slate-900 mt-1">
                        {viewingPO.poNumber}
                      </div>
                      {viewingPO.invoiceNumber && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Ref Invoice: <span className="text-slate-800">{viewingPO.invoiceNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Supplier & Order Meta Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        VENDOR / SUPPLIER DETAILS
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {supplierObj?.companyName || viewingPO.supplierName}
                      </div>
                      <div className="text-[11px] text-slate-700">
                        Attn: {supplierObj?.contactPerson || 'Sales Department'}
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono">
                        GSTIN: {supplierObj?.gstNumber || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Address: {supplierObj?.address || 'N/A'}, {supplierObj?.city || ''}
                      </div>
                      <div className="text-[11px] text-blue-600 font-medium">
                        Phone: {supplierObj?.phone || 'N/A'} | {supplierObj?.email || ''}
                      </div>
                    </div>

                    <div className="space-y-1 sm:text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        ORDER SPECIFICATIONS
                      </div>
                      <div>
                        <span className="text-slate-500">PO Date:</span>{' '}
                        <span className="font-mono text-slate-900 font-bold">{viewingPO.orderDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Expected Delivery:</span>{' '}
                        <span className="font-mono text-amber-600 font-bold">{viewingPO.expectedDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Payment Due Date:</span>{' '}
                        <span className="font-mono text-emerald-600 font-bold">
                          {viewingPO.paymentDueDate || viewingPO.expectedDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Payment Status:</span>{' '}
                        <span className="font-bold text-rose-600">{viewingPO.paymentStatus}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Payment Terms:</span>{' '}
                        <span className="font-semibold text-slate-800">
                          {supplierObj?.paymentTerms || 'Net 30 Days'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Material Line Items Table */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      ORDERED RAW MATERIALS & COMPONENT BREAKDOWN
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Material Name</th>
                            <th className="py-2.5 px-3">Material Code</th>
                            <th className="py-2.5 px-3 text-center">Ordered Qty</th>
                            <th className="py-2.5 px-3 text-center">Received Qty</th>
                            <th className="py-2.5 px-3 text-center">Pending Qty</th>
                            <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                            <th className="py-2.5 px-3 text-center">GST %</th>
                            <th className="py-2.5 px-3 text-right">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {viewingPO.items.map((item, idx) => {
                            const recQty = item.receivedQuantity || 0;
                            const pendingQty = Math.max(0, item.quantity - recQty);
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900">
                                  {item.rawMaterialName}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-blue-600 font-bold">
                                  {item.sku}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                                  {item.quantity} {item.unit || 'PCS'}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-emerald-600 font-mono">
                                  {recQty} {item.unit || 'PCS'}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-amber-600 font-mono">
                                  {pendingQty} {item.unit || 'PCS'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                  ₹{item.unitCost.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                                  {item.gstPercent || 18}%
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                                  ₹{item.totalCost.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Calculation Summary & Terms */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">
                          TERMS & CONDITIONS
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1 mt-1">
                          <li>Materials must meet technical engineering specifications.</li>
                          <li>Stock count will be updated upon Material Receipt inspection & acceptance.</li>
                          <li>Bills and payments remain strictly linked to PO #{viewingPO.poNumber}.</li>
                        </ul>
                      </div>
                      {viewingPO.notes && (
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold">NOTES</div>
                          <p className="text-[11px] text-slate-700 italic">{viewingPO.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-right bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="font-mono text-slate-800">
                          ₹{(viewingPO.subtotal || viewingPO.totalAmount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {!!viewingPO.discountAmount && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Total Discount:</span>
                          <span className="font-mono text-rose-600">
                            -₹{viewingPO.discountAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">GST Tax:</span>
                        <span className="font-mono text-blue-600">
                          +₹{(viewingPO.gstAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {!!viewingPO.freight && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Freight Charges:</span>
                          <span className="font-mono text-amber-600">
                            +₹{viewingPO.freight.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                        <span>Grand Total:</span>
                        <span className="text-blue-600 font-mono">
                          ₹{viewingPO.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Authorized Signatures Line */}
                  <div className="pt-8 border-t border-slate-200 flex flex-row justify-between items-end text-xs">
                    <div>
                      <div className="text-slate-500 text-[10px]">Issued By</div>
                      <div className="font-bold text-slate-900 mt-1">{viewingPO.createdBy || 'Store & Procurement Manager'}</div>
                      <div className="text-slate-500 text-[10px]">MAPOUT Manufacturing Division</div>
                    </div>

                    <div className="text-right space-y-8">
                      <div className="border-b border-slate-300 w-48 ml-auto"></div>
                      <div>
                        <div className="font-bold text-slate-900">Authorized Signatory</div>
                        <div className="text-slate-500 text-[10px]">Official Stamp & Signature</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}
