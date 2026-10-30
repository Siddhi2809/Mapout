'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { SalesDispatch, DispatchItem } from '@/types/erp';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  PackageCheck,
  Eye,
  ArrowRight,
  Boxes,
} from 'lucide-react';

export default function DispatchPage() {
  const {
    dispatches,
    salesOrders,
    invoices,
    customers,
    products,
    rawMaterials,
    createDispatchFull,
    generateEntityCode,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('ALL');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<SalesDispatch | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Form State
  const [formSoId, setFormSoId] = useState('');
  const [formDispatchDate, setFormDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTransporter, setFormTransporter] = useState('VRL Logistics');
  const [formVehicleNumber, setFormVehicleNumber] = useState('MH-12-PQ-8842');
  const [formTrackingNumber, setFormTrackingNumber] = useState('LR-9982310');
  const [formRemarks, setFormRemarks] = useState('');

  // Form Items
  const [dispatchItems, setDispatchItems] = useState<DispatchItem[]>([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredDispatches = dispatches.filter((d) => {
    const matchSearch =
      d.dispatchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = deliveryFilter === 'ALL' || d.deliveryStatus === deliveryFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenCreateModal = () => {
    if (salesOrders.length > 0) {
      const so = salesOrders[0];
      setFormSoId(so.id);
      loadItemsFromSO(so.id);
    }
    setFormDispatchDate(new Date().toISOString().split('T')[0]);
    setFormTransporter('VRL Logistics');
    setFormVehicleNumber('MH-12-PQ-8842');
    setFormTrackingNumber(`LR-${Math.floor(1000000 + Math.random() * 9000000)}`);
    setFormRemarks('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const loadItemsFromSO = (soId: string) => {
    const so = salesOrders.find((s) => s.id === soId);
    if (!so) return;

    // Check previous dispatches for this order to calculate previouslyDispatched
    const prevDispatches = dispatches.filter((d) => d.salesOrderId === soId);

    const items: DispatchItem[] = so.items.map((i) => {
      const alreadyDisp = prevDispatches.reduce((acc, d) => {
        const itemMatch = d.items.find((di) => di.productId === i.productId || di.sku === i.sku);
        return acc + (itemMatch ? itemMatch.dispatchQuantity : 0);
      }, 0);

      const rem = Math.max(0, i.quantity - alreadyDisp);

      const isRM =
        i.itemType === 'RAW_MATERIAL' ||
        Boolean(i.rawMaterialId) ||
        so.saleType === 'RAW_MATERIAL' ||
        so.saleType === 'Raw Material' ||
        rawMaterials.some((m) => m.id === i.productId || m.sku === i.sku);

      return {
        itemType: isRM ? 'RAW_MATERIAL' : 'PRODUCT',
        rawMaterialId: isRM ? (i.rawMaterialId || i.productId) : undefined,
        productId: i.productId,
        productName: i.productName,
        sku: i.sku,
        unit: i.unit,
        orderedQuantity: i.quantity,
        previouslyDispatched: alreadyDisp,
        remainingQuantity: rem,
        dispatchQuantity: rem, // default to remaining
      };
    });

    setDispatchItems(items);
  };

  const handleSoChange = (soId: string) => {
    setFormSoId(soId);
    loadItemsFromSO(soId);
  };

  const handleItemDispatchQtyChange = (idx: number, qtyStr: string) => {
    const q = parseInt(qtyStr, 10) || 0;
    setDispatchItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, dispatchQuantity: q } : row))
    );
  };

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetSO = salesOrders.find((s) => s.id === formSoId);
    if (!targetSO) return setFormError('Please select a valid Sales Order.');

    let totalDispQty = 0;
    for (const item of dispatchItems) {
      if (item.dispatchQuantity > item.remainingQuantity) {
        return setFormError(`Dispatch quantity for "${item.productName}" cannot exceed remaining quantity (${item.remainingQuantity}).`);
      }

      // Live stock availability verification
      const isRM =
        item.itemType === 'RAW_MATERIAL' ||
        Boolean(item.rawMaterialId) ||
        targetSO.saleType === 'RAW_MATERIAL' ||
        targetSO.saleType === 'Raw Material' ||
        rawMaterials.some((m) => m.id === item.productId || m.sku === item.sku);

      if (isRM) {
        const rm = rawMaterials.find((m) => m.id === item.productId || m.sku === item.sku || m.id === item.rawMaterialId);
        const avail = rm ? rm.currentStock : 0;
        if (item.dispatchQuantity > avail) {
          return setFormError(
            `Cannot dispatch ${item.dispatchQuantity} of "${item.productName}". Available raw material stock is only ${avail} ${rm?.unit || 'Units'}.`
          );
        }
      } else {
        const prod = products.find((p) => p.id === item.productId || p.sku === item.sku);
        const avail = prod ? prod.currentStock : 0;
        if (item.dispatchQuantity > avail) {
          return setFormError(
            `Cannot dispatch ${item.dispatchQuantity} of "${item.productName}". Available finished goods stock is only ${avail} Units.`
          );
        }
      }

      totalDispQty += item.dispatchQuantity;
    }

    if (totalDispQty <= 0) {
      return setFormError('Total dispatch quantity must be greater than zero.');
    }

    const matchingInvoice = invoices.find((i) => i.salesOrderId === targetSO.id);

    const res = createDispatchFull({
      salesOrderId: targetSO.id,
      salesOrderNumber: targetSO.orderNumber,
      invoiceId: matchingInvoice?.id,
      invoiceNumber: matchingInvoice?.invoiceNumber,
      customerId: targetSO.customerId,
      customerName: targetSO.customerName,
      dispatchDate: formDispatchDate,
      items: dispatchItems,
      totalQuantity: totalDispQty,
      transporter: formTransporter.trim(),
      vehicleNumber: formVehicleNumber.trim(),
      trackingNumber: formTrackingNumber.trim(),
      deliveryStatus: 'Dispatched',
      remarks: formRemarks,
    });

    if (!res.success) {
      setFormError(res.message || 'Failed to create dispatch.');
      return;
    }

    showToast(`Dispatch confirmed! ${totalDispQty} Finished Goods units deducted from inventory & logged.`);
    setIsCreateModalOpen(false);
  };

  const getDeliveryBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Dispatched':
      case 'In Transit':
      case 'Ready':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <DashboardLayout
      roleTitle="Sales Management"
      roleBadge="Sales Manager"
      navItems={SALES_NAV}
    >
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" /> {toastMessage}
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finished Goods Dispatch</h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Dispatch confirmed sales orders, log transport LR numbers, track delivery status, and reduce finished goods inventory.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create New Dispatch
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Dispatch #, SO Ref, Customer, Tracking LR..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Delivery Status:
            </div>
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Ready">Ready</option>
              <option value="Dispatched">Dispatched</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Dispatches Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                  <th className="p-3.5">Dispatch #</th>
                  <th className="p-3.5">Sales Order Ref</th>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Dispatch Date</th>
                  <th className="p-3.5 text-right font-bold">Total Qty</th>
                  <th className="p-3.5">Transporter</th>
                  <th className="p-3.5">Tracking / LR #</th>
                  <th className="p-3.5 text-center">Delivery Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDispatches.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono text-blue-700 font-bold">{d.dispatchNumber}</td>
                    <td className="p-3.5 font-mono text-blue-600 font-bold">{d.salesOrderNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900 max-w-[180px] truncate">{d.customerName}</td>
                    <td className="p-3.5 text-slate-600 font-mono">{d.dispatchDate}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900 font-mono">{d.totalQuantity} Units</td>
                    <td className="p-3.5 text-slate-700 font-medium">{d.transporter}</td>
                    <td className="p-3.5 font-mono text-slate-600">{d.trackingNumber}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getDeliveryBadge(d.deliveryStatus)}`}>
                        {d.deliveryStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          setSelectedDispatch(d);
                          setIsViewModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] flex items-center gap-1 mx-auto transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" /> Details
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredDispatches.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500 text-xs font-medium">
                      No dispatch records logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATE DISPATCH MODAL */}
        {isCreateModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsCreateModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Sticky Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-700" /> Create Dispatch & Reduce Finished Inventory
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                  title="Close Form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleCreateDispatch} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-6 text-xs">
                  {formError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" /> {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold mb-1">
                        Dispatch Number <span className="text-slate-400 font-normal">(Auto-generated)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={generateEntityCode('DISPATCH')}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-blue-700 font-mono focus:outline-none cursor-not-allowed opacity-90 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Select Confirmed Sales Order *</label>
                      <select
                        required
                        value={formSoId}
                        onChange={(e) => handleSoChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      >
                        {salesOrders.map((so) => (
                          <option key={so.id} value={so.id}>
                            {so.orderNumber} - {so.customerName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Dispatch Date *</label>
                      <input
                        type="date"
                        required
                        value={formDispatchDate}
                        onChange={(e) => setFormDispatchDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Transporter Name *</label>
                      <input
                        type="text"
                        required
                        value={formTransporter}
                        onChange={(e) => setFormTransporter(e.target.value)}
                        placeholder="e.g. VRL Logistics / BlueDart"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Vehicle Number (Optional)</label>
                      <input
                        type="text"
                        value={formVehicleNumber}
                        onChange={(e) => setFormVehicleNumber(e.target.value)}
                        placeholder="MH-12-PQ-8842"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Tracking / LR Number *</label>
                      <input
                        type="text"
                        required
                        value={formTrackingNumber}
                        onChange={(e) => setFormTrackingNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Remarks / Shipping Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Packed in 2 cartons"
                        value={formRemarks}
                        onChange={(e) => setFormRemarks(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                  </div>

                  {/* DISPATCH QUANTITIES BREAKDOWN */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-emerald-700" /> Dispatch Quantities Breakdown
                    </h4>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                            <th className="p-2.5">Item Name</th>
                            <th className="p-2.5 text-center">Type</th>
                            <th className="p-2.5 text-center">SKU</th>
                            <th className="p-2.5 text-right">Ordered</th>
                            <th className="p-2.5 text-right">Previously Dispatched</th>
                            <th className="p-2.5 text-right">Remaining</th>
                            <th className="p-2.5 text-right">Dispatch Now Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dispatchItems.map((item, idx) => {
                            const isRM = item.itemType === 'RAW_MATERIAL';
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                                <td className="p-2.5 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      isRM
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}
                                  >
                                    {isRM ? 'Raw Material' : 'Product'}
                                  </span>
                                </td>
                                <td className="p-2.5 text-center font-mono text-slate-600">{item.sku}</td>
                                <td className="p-2.5 text-right text-slate-700 font-mono font-medium">{item.orderedQuantity} {item.unit || ''}</td>
                                <td className="p-2.5 text-right text-slate-500 font-mono font-medium">{item.previouslyDispatched}</td>
                                <td className="p-2.5 text-right font-bold text-blue-700 font-mono">{item.remainingQuantity}</td>
                                <td className="p-2.5 text-right max-w-[100px]">
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.remainingQuantity}
                                    value={item.dispatchQuantity}
                                    onChange={(e) => handleItemDispatchQtyChange(idx, e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-1 text-xs text-right font-bold text-emerald-700 focus:bg-white focus:border-blue-600"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* STOCK FLOW RULE REMINDER */}
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between">
                    <span>* Confirming this dispatch will reduce Finished Goods or Raw Material stock immediately and record a sale stock transaction (RAW_MATERIAL_SALE / SALE_DISPATCH).</span>
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
                  >
                    Confirm Dispatch & Deduct Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW DISPATCH DETAILS MODAL */}
        {isViewModalOpen && selectedDispatch && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsViewModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div>
                  <div className="text-xs font-mono text-blue-700 font-bold">{selectedDispatch.dispatchNumber}</div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedDispatch.customerName}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block font-medium">Sales Order Ref:</span>
                    <div className="font-mono text-blue-600 font-bold">{selectedDispatch.salesOrderNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Dispatch Date:</span>
                    <div className="text-slate-900 font-mono font-semibold">{selectedDispatch.dispatchDate}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Transporter:</span>
                    <div className="text-slate-900 font-semibold">{selectedDispatch.transporter}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Tracking LR #:</span>
                    <div className="font-mono text-slate-900 font-bold">{selectedDispatch.trackingNumber}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Dispatched Items Breakdown</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2.5">Item Name</th>
                          <th className="p-2.5 text-center">Type</th>
                          <th className="p-2.5 text-center">SKU</th>
                          <th className="p-2.5 text-right">Dispatched Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedDispatch.items.map((item, idx) => {
                          const isRM = item.itemType === 'RAW_MATERIAL';
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                              <td className="p-2.5 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isRM
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}
                                >
                                  {isRM ? 'Raw Material' : 'Product'}
                                </span>
                              </td>
                              <td className="p-2.5 text-center font-mono text-slate-600">{item.sku}</td>
                              <td className="p-2.5 text-right font-bold text-emerald-700 font-mono">
                                {item.dispatchQuantity} {item.unit || 'Units'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
