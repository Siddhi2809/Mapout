'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { SalesOrder } from '@/types/erp';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  CreditCard,
  Building2,
  X,
  Sparkles,
  PackageCheck,
  Camera,
} from 'lucide-react';

export default function AdminSalesOrdersPage() {
  const { salesOrders, updateSalesOrderStatusFull, sendSalesOrderToProduct } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dispatchFilter, setDispatchFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const filteredOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      const matchSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.salesperson && order.salesperson.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter ? order.orderStatus === statusFilter : true;
      const matchDispatch = dispatchFilter ? order.dispatchStatus === dispatchFilter : true;
      const matchPayment = paymentFilter ? order.paymentStatus === paymentFilter : true;

      return matchSearch && matchStatus && matchDispatch && matchPayment;
    });
  }, [salesOrders, searchQuery, statusFilter, dispatchFilter, paymentFilter]);

  const handleUpdateStatus = (id: string, newOrderStatus: string, newDispatchStatus?: string) => {
    updateSalesOrderStatusFull(id, newDispatchStatus as any, undefined, newOrderStatus as any);
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newOrderStatus as any, dispatchStatus: (newDispatchStatus as any) || prev.dispatchStatus } : null));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Orders Management</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {salesOrders.length} Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized control over all Sales Orders, packing status, factory processing, and dispatch fulfillment.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order #, customer, rep..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Order Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <select
              value={dispatchFilter}
              onChange={(e) => setDispatchFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Dispatch Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="READY_FOR_DISPATCH">READY FOR DISPATCH</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Payment Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="UNPAID">UNPAID</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Order Number</th>
                <th className="px-4 py-3.5">Customer & Salesperson</th>
                <th className="px-4 py-3.5">Items Summary</th>
                <th className="px-4 py-3.5 text-right">Grand Total</th>
                <th className="px-4 py-3.5 text-center">Payment Status</th>
                <th className="px-4 py-3.5 text-center">Dispatch Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const totalItemsCount = order.items?.reduce((acc, i) => acc + (i.quantity || 0), 0) || 0;
                const hasPackedProof = !!order.packedImage || order.items?.some((i) => !!i.productImage);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{order.orderNumber}</div>
                      <div className="text-[11px] text-slate-500">{order.orderDate}</div>
                      {hasPackedProof && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1 font-bold">
                          <Camera className="w-3 h-3" /> Packed Photo Attached
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.salesperson || order.createdBy || 'Direct'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-800">
                        {order.items && order.items[0] ? order.items[0].productName : 'Standard Item'}
                        {order.items && order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Total Quantity: {totalItemsCount} units</div>
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-slate-900">
                      ₹{(order.grandTotal || order.totalAmount || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.paymentStatus === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          order.dispatchStatus === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.dispatchStatus === 'DISPATCHED'
                            ? 'bg-blue-100 text-blue-800'
                            : order.dispatchStatus === 'READY_FOR_DISPATCH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.dispatchStatus.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Order
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No sales orders found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Order Detail & Authority Actions */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">Order #{selectedOrder.orderNumber}</h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Client: <strong>{selectedOrder.customerName}</strong> · Placed: {selectedOrder.orderDate}
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Order Status Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Order Status</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedOrder.orderStatus}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Dispatch Status</div>
                  <div className="text-xs font-bold text-blue-600 mt-0.5">{selectedOrder.dispatchStatus}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Payment Status</div>
                  <div className="text-xs font-bold text-emerald-600 mt-0.5">{selectedOrder.paymentStatus}</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900">Ordered Products & Line Items</div>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between bg-slate-50/40">
                      <div>
                        <div className="font-bold text-slate-800">{item.productName}</div>
                        <div className="text-[11px] text-slate-400">SKU: {item.sku} · Qty: {item.quantity} units</div>
                      </div>
                      <div className="text-right font-bold text-slate-900">
                        ₹{(item.totalPrice || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Team Photo & Packing Proof */}
              {(selectedOrder.packedImage || selectedOrder.items?.some((i) => !!i.productImage)) && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Packing Photo & Factory Proof Attached</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto py-1">
                    {selectedOrder.packedImage && (
                      <img
                        src={selectedOrder.packedImage}
                        alt="Order Packing Proof"
                        className="h-28 w-28 object-cover rounded-xl border border-emerald-300 shadow-sm"
                      />
                    )}
                    {selectedOrder.items
                      ?.filter((i) => !!i.productImage)
                      .map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <img
                            src={item.productImage!}
                            alt={item.productName}
                            className="h-28 w-28 object-cover rounded-xl border border-emerald-300 shadow-sm"
                          />
                          <div className="text-[10px] font-semibold text-emerald-800 truncate max-w-[112px]">
                            {item.productName}
                          </div>
                        </div>
                      ))}
                  </div>
                  {selectedOrder.productTeamRemarks && (
                    <div className="text-[11px] text-emerald-800 bg-white p-2 rounded-lg border border-emerald-200">
                      <strong>Product Team Remarks:</strong> {selectedOrder.productTeamRemarks}
                    </div>
                  )}
                </div>
              )}

              {/* Admin Actions */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Admin Authority Controls</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.dispatchStatus === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING', 'READY_FOR_DISPATCH')}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
                    >
                      Mark Ready for Dispatch
                    </button>
                  )}
                  {selectedOrder.dispatchStatus === 'READY_FOR_DISPATCH' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING', 'DISPATCHED')}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
                    >
                      Mark Dispatched
                    </button>
                  )}
                  {selectedOrder.dispatchStatus === 'DISPATCHED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED', 'DELIVERED')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
                    >
                      Mark Delivered & Completed
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
