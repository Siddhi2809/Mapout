'use client';

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { SalesOrder, SalesOrderItem } from '../../types/erp';
import {
  ShoppingCart,
  Plus,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  X,
  FileText,
  UserCheck,
  Send,
} from 'lucide-react';

export const SalesOrdersView: React.FC = () => {
  const {
    salesOrders,
    createSalesOrder,
    updateSalesOrderStatus,
    customers,
    finishedGoods,
  } = useERP();

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');

  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([
    {
      productId: finishedGoods[0]?.id || '',
      productName: finishedGoods[0]?.name || '',
      finishedGoodId: finishedGoods[0]?.id || '',
      finishedGoodName: finishedGoods[0]?.name || '',
      sku: finishedGoods[0]?.sku || '',
      quantity: 10,
      unitPrice: finishedGoods[0]?.sellingPrice || 799,
      sellingPrice: finishedGoods[0]?.sellingPrice || 799,
      totalPrice: (finishedGoods[0]?.sellingPrice || 799) * 10,
    },
  ]);

  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleAddItemRow = () => {
    const defaultGood = finishedGoods[0];
    if (!defaultGood) return;
    setOrderItems([
      ...orderItems,
      {
        productId: defaultGood.id,
        productName: defaultGood.name,
        finishedGoodId: defaultGood.id,
        finishedGoodName: defaultGood.name,
        sku: defaultGood.sku,
        quantity: 5,
        unitPrice: defaultGood.sellingPrice,
        sellingPrice: defaultGood.sellingPrice,
        totalPrice: defaultGood.sellingPrice * 5,
      },
    ]);
  };

  const handleUpdateItem = (index: number, finishedGoodId: string, quantity: number) => {
    const fg = finishedGoods.find((g) => g.id === finishedGoodId);
    if (!fg) return;
    const updated = [...orderItems];
    updated[index] = {
      productId: fg.id,
      productName: fg.name,
      finishedGoodId: fg.id,
      finishedGoodName: fg.name,
      sku: fg.sku,
      quantity,
      unitPrice: fg.sellingPrice,
      sellingPrice: fg.sellingPrice,
      totalPrice: fg.sellingPrice * quantity,
    };
    setOrderItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const subtotal = orderItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const taxAmount = Math.round(subtotal * 0.18); // 18% GST
  const grandTotal = subtotal + taxAmount;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    let paymentStatus: SalesOrder['paymentStatus'] = 'UNPAID';
    if (amountPaid >= grandTotal) paymentStatus = 'PAID';
    else if (amountPaid > 0) paymentStatus = 'PARTIAL';

    const success = createSalesOrder({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.companyName,
      orderDate: new Date().toISOString().split('T')[0],
      dueDate,
      items: orderItems,
      subtotal,
      discountAmount: 0,
      totalAmount: subtotal,
      taxAmount,
      grandTotal,
      amountPaid,
      paymentStatus,
      dispatchStatus: 'PENDING',
      orderStatus: 'Confirmed',
      notes: 'B2B Sales order generated.',
    });

    if (success) {
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 erp-card p-5 bg-white border border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" /> B2B Sales Orders & Dispatch Pipeline
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Generate invoices, process customer shipments, track delivery dispatch status, and log payments.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/10 transition"
        >
          <Plus className="w-4 h-4 text-white" /> Create Sales Order
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {salesOrders.map((order) => {
          const isOverdue = order.paymentStatus === 'OVERDUE';
          const isPaid = order.paymentStatus === 'PAID';
          const isDispatched = order.dispatchStatus === 'DISPATCHED' || order.dispatchStatus === 'DELIVERED';

          return (
            <div key={order.id} className="erp-card p-5 space-y-4 bg-white border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isOverdue
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      Payment: {order.paymentStatus}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDispatched
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      Dispatch: {order.dispatchStatus}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{order.customerName}</h3>
                  <div className="text-xs text-slate-600">Order Date: {order.orderDate} | Payment Due: {order.dueDate}</div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-xs text-slate-600 block">Grand Total (inc. 18% GST)</span>
                  <span className="text-xl font-extrabold text-emerald-700">
                    ₹{order.grandTotal.toLocaleString('en-IN')}
                  </span>
                  {order.grandTotal - order.amountPaid > 0 && (
                    <span className="text-[11px] text-rose-700 block font-semibold">
                      Due: ₹{(order.grandTotal - order.amountPaid).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-600 border-b border-slate-200 text-[10px] uppercase bg-slate-50">
                      <th className="py-2.5 px-2 font-bold">Item SKU & Description</th>
                      <th className="py-2.5 px-2 font-bold">Qty</th>
                      <th className="py-2.5 px-2 font-bold">Unit Price</th>
                      <th className="py-2.5 px-2 font-bold text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-2 font-semibold text-slate-900">
                          {item.finishedGoodName} <span className="text-[10px] text-slate-600 font-mono">({item.sku})</span>
                        </td>
                        <td className="py-2.5 px-2 font-semibold">{item.quantity}</td>
                        <td className="py-2.5 px-2 font-mono">₹{item.unitPrice}</td>
                        <td className="py-2.5 px-2 text-right font-mono text-emerald-700 font-bold">₹{item.totalPrice.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dispatch & Payment Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                {order.dispatchStatus === 'PENDING' && (
                  <button
                    onClick={() => updateSalesOrderStatus(order.id, 'DISPATCHED')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-white" /> Mark Dispatched & Shipped
                  </button>
                )}
                {order.paymentStatus !== 'PAID' && (
                  <button
                    onClick={() => updateSalesOrderStatus(order.id, undefined, 'PAID')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-white" /> Mark Full Payment Received
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Sales Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-2xl p-6 relative text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Generate B2B Sales Invoice Order</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Finished Products Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    + Add Product Line
                  </button>
                </div>

                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                    <select
                      value={item.finishedGoodId}
                      onChange={(e) => handleUpdateItem(idx, e.target.value, item.quantity)}
                      className="flex-1 bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900 focus:outline-none"
                    >
                      {finishedGoods.map((g) => {
                        const isOutOfStock = g.currentStock <= 0;
                        return (
                          <option key={g.id} value={g.id} disabled={isOutOfStock}>
                            {g.name} - ₹{g.sellingPrice} {isOutOfStock ? '(OUT OF STOCK)' : `(Stock: ${g.currentStock})`}
                          </option>
                        );
                      })}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(idx, item.finishedGoodId || item.productId || '', Number(e.target.value))}
                      className="w-20 bg-white border border-slate-300 rounded p-1.5 text-xs text-center text-slate-900 font-bold focus:outline-none"
                    />

                    <span className="w-24 text-right font-mono text-emerald-700 font-bold">
                      ₹{item.totalPrice.toLocaleString('en-IN')}
                    </span>

                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Financial Calculation Bar */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax (18%):</span>
                  <span>₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Initial Advance Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg"
                >
                  Generate Invoice & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
