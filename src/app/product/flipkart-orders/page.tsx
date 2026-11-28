'use client';

import React, { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PRODUCT_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { SalesOrderItem } from '@/types/erp';
import { ProductSearchInput } from '@/components/product/ProductSearchInput';
import {
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Package,
  Calendar,
  Truck,
} from 'lucide-react';

interface OrderLineDraft {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export default function FlipkartSaleOrdersPage() {
  const {
    salesOrders,
    products,
    createSalesOrderFull,
    refreshSalesOrdersFromDB,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('Flipkart Customer');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'Prepaid' | 'COD'>('Prepaid');
  const [shippingDetails, setShippingDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<OrderLineDraft[]>([
    { productId: '', quantity: 1, unitPrice: 0 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const flipkartOrders = useMemo(() => {
    return salesOrders
      .filter((o) => (o.salesChannel || '').toLowerCase() === 'flipkart')
      .filter((o) => {
        if (startDate && o.orderDate < startDate) return false;
        if (endDate && o.orderDate > endDate) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchesOrder =
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.shippingDetails?.toLowerCase().includes(q);
        const matchesItem = o.items?.some(
          (i) =>
            i.productName?.toLowerCase().includes(q) ||
            i.sku?.toLowerCase().includes(q)
        );
        return matchesOrder || matchesItem;
      });
  }, [salesOrders, searchQuery, startDate, endDate]);

  const totalUnitsSold = useMemo(
    () =>
      flipkartOrders.reduce(
        (sum, o) => sum + (o.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0),
        0
      ),
    [flipkartOrders]
  );

  const totalRevenue = useMemo(
    () => flipkartOrders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0),
    [flipkartOrders]
  );

  const openCreateModal = () => {
    setOrderNumber(`FK-${Date.now().toString().slice(-6)}`);
    setCustomerName('Flipkart Customer');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('Prepaid');
    setShippingDetails('');
    setNotes('');
    setLines([{ productId: '', quantity: 1, unitPrice: 0 }]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const defaultPrice = prod ? Number(prod.sellingPrice || 0) : 0;
    setLines((prev) =>
      prev.map((line, idx) =>
        idx === index ? { ...line, productId, unitPrice: defaultPrice } : line
      )
    );
  };

  const handleLineChange = (index: number, field: keyof OrderLineDraft, value: number | string) => {
    setLines((prev) =>
      prev.map((line, idx) => (idx === index ? { ...line, [field]: value } : line))
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      setFormError('Please select at least one product with quantity greater than 0.');
      return;
    }

    const items: SalesOrderItem[] = validLines.map((line) => {
      const prod = products.find((p) => p.id === line.productId)!;
      const qty = Number(line.quantity) || 1;
      const price = Number(line.unitPrice) || 0;
      const lineTotal = qty * price;
      return {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku || prod.id,
        itemType: 'PRODUCT',
        quantity: qty,
        unitPrice: price,
        sellingPrice: price,
        discount: 0,
        gstPercent: 0,
        totalPrice: lineTotal,
      };
    });

    const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);

    const result = createSalesOrderFull(
      {
        orderNumber: orderNumber.trim() || `FK-${Date.now().toString().slice(-6)}`,
        salesChannel: 'Flipkart',
        saleType: 'PRODUCT',
        customerId: 'flipkart-marketplace',
        customerName: customerName.trim() || 'Flipkart Customer',
        dueDate: orderDate,
        subtotal,
        discountAmount: 0,
        taxAmount: 0,
        grandTotal: subtotal,
        totalAmount: subtotal,
        amountPaid: paymentMode === 'Prepaid' ? subtotal : 0,
        amountOutstanding: paymentMode === 'Prepaid' ? 0 : subtotal,
        pendingAmount: paymentMode === 'Prepaid' ? 0 : subtotal,
        paymentStatus: paymentMode === 'Prepaid' ? 'PAID' : 'UNPAID',
        paymentMode,
        dispatchStatus: 'PENDING',
        orderStatus: 'Confirmed',
        shippingDetails: shippingDetails.trim() || undefined,
        notes: notes.trim() || undefined,
        createdBy: 'Product Team',
        items,
      },
      false
    );

    if (!result.success) {
      setFormError(result.message || 'Failed to create Flipkart order.');
      return;
    }

    setIsModalOpen(false);
    setSuccessMsg(`Flipkart order ${orderNumber} recorded and product stock updated.`);
    setTimeout(() => setSuccessMsg(null), 4000);
    refreshSalesOrdersFromDB?.();
  };

  return (
    <DashboardLayout navItems={PRODUCT_NAV} roleTitle="Product Team" roleBadge="Product">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              Flipkart Sale Orders
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Record Flipkart orders directly. Creating an order automatically deducts product stock.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Record Flipkart Order
          </button>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase">Total Flipkart Orders</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{flipkartOrders.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase">Total Units Sold</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalUnitsSold}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase">Total Order Value</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order #, product, SKU, buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Buyer / Customer</th>
                  <th className="px-4 py-3">Products & Qty</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Shipping / Tracking</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {flipkartOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      No Flipkart sale orders recorded yet. Click &quot;Record Flipkart Order&quot; to add one.
                    </td>
                  </tr>
                ) : (
                  flipkartOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{order.orderDate}</td>
                      <td className="px-4 py-3 text-slate-700">{order.customerName}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs">
                              <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium text-slate-800">{item.productName}</span>
                              <span className="text-slate-500">× {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${order.paymentMode === 'COD'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                            }`}
                        >
                          {order.paymentMode || 'Prepaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {order.shippingDetails ? (
                          <span className="inline-flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            {order.shippingDetails}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ₹{(order.grandTotal || order.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Flipkart Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Record Flipkart Sale Order</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-5">
              {formError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Flipkart Order ID / #
                  </label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Order Date
                  </label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Buyer / Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Flipkart Customer"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as 'Prepaid' | 'COD')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Prepaid">Prepaid</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>

              {/* Product Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase">
                    Products & Quantity
                  </label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Product
                  </button>
                </div>

                <div className="space-y-2.5">
                  {lines.map((line, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                    >
                      <div className="col-span-6">
                        <ProductSearchInput
                          products={products}
                          value={line.productId}
                          onChange={(productId) => handleProductChange(index, productId)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          required
                          value={line.quantity}
                          onChange={(e) =>
                            handleLineChange(index, 'quantity', Math.max(1, Number(e.target.value)))
                          }
                          placeholder="Qty"
                          className="w-full px-2.5 py-1.5 text-sm bg-white border border-slate-200 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) =>
                            handleLineChange(index, 'unitPrice', Math.max(0, Number(e.target.value)))
                          }
                          placeholder="Price (₹)"
                          className="w-full px-2.5 py-1.5 text-sm bg-white border border-slate-200 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          disabled={lines.length === 1}
                          className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tracking / Shipping Details (Optional)
                  </label>
                  <input
                    type="text"
                    value={shippingDetails}
                    onChange={(e) => setShippingDetails(e.target.value)}
                    placeholder="AWB / Courier / Tracking ID"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Notes / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any order notes"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Create Order &amp; Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
