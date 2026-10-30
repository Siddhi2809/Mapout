'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { Customer, SalesOrder, ProductReturn, FollowUp } from '@/types/erp';
import {
  Users,
  Search,
  Filter,
  Eye,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  CreditCard,
  ShoppingCart,
  FileText,
  ShieldCheck,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export default function AdminCustomersPage() {
  const {
    customers,
    salesOrders,
    invoices,
    customerPayments,
    productReturns,
    followUps,
    addCustomer,
    updateCustomer,
    createFollowUpFull,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected customer for full 360 detail modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustForm, setNewCustForm] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    email: '',
    mobile: '',
    city: '',
    state: 'Maharashtra',
    category: 'Distributor',
    creditLimit: '100000',
    address: '',
    gstNumber: '',
  });

  // Follow-up quick add modal
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    time: '11:00 AM',
    notes: '',
  });

  // Unique states
  const uniqueStates = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.state) set.add(c.state);
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = categoryFilter ? c.category === categoryFilter : true;
      const matchState = stateFilter ? c.state?.toLowerCase() === stateFilter.toLowerCase() : true;
      const matchStatus = statusFilter ? c.status === statusFilter : true;

      return matchSearch && matchCat && matchState && matchStatus;
    });
  }, [customers, searchQuery, categoryFilter, stateFilter, statusFilter]);

  // Customer 360 metrics calculation
  const customer360Data = useMemo(() => {
    if (!selectedCustomer) return null;

    const orders = salesOrders.filter(
      (o) => o.customerId === selectedCustomer.id || o.customerName === selectedCustomer.name
    );

    const custInvoices = invoices.filter(
      (i) => i.customerId === selectedCustomer.id || i.customerName === selectedCustomer.name
    );

    const payments = customerPayments.filter(
      (p) => p.customerId === selectedCustomer.id || p.customerName === selectedCustomer.name
    );

    const returns = productReturns.filter(
      (r) => r.customerName === selectedCustomer.name || r.customerName === selectedCustomer.companyName
    );

    const custFollowUps = followUps.filter(
      (f) => f.customerId === selectedCustomer.id || f.customerName === selectedCustomer.name
    );

    // Products & Raw Materials Purchased
    const productsPurchased: { name: string; sku: string; qty: number; total: number; orderNumber: string }[] = [];
    const rawMaterialsPurchased: { name: string; sku: string; qty: number; total: number; orderNumber: string }[] = [];

    orders.forEach((o) => {
      o.items?.forEach((item) => {
        if (item.productName?.toLowerCase().includes('wire') || item.productName?.toLowerCase().includes('cable') || item.sku?.startsWith('RM')) {
          rawMaterialsPurchased.push({
            name: item.productName,
            sku: item.sku,
            qty: item.quantity,
            total: item.totalPrice,
            orderNumber: o.orderNumber,
          });
        } else {
          productsPurchased.push({
            name: item.productName,
            sku: item.sku,
            qty: item.quantity,
            total: item.totalPrice,
            orderNumber: o.orderNumber,
          });
        }
      });
    });

    const totalRevenue = orders.reduce((acc, o) => acc + (o.grandTotal || o.totalAmount || 0), 0);
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalOutstanding = Math.max(0, totalRevenue - totalPaid);

    return {
      orders,
      invoices: custInvoices,
      payments,
      returns,
      followUps: custFollowUps,
      productsPurchased,
      rawMaterialsPurchased,
      totalRevenue,
      totalPaid,
      totalOutstanding,
    };
  }, [selectedCustomer, salesOrders, invoices, customerPayments, productReturns, followUps]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustForm.name || !newCustForm.email) return;

    const code = `CUST-${Date.now().toString().slice(-4)}`;
    const newCust: Omit<Customer, 'id'> = {
      customerCode: code,
      name: newCustForm.name,
      companyName: newCustForm.companyName || newCustForm.name,
      contactPerson: newCustForm.contactPerson || newCustForm.name,
      email: newCustForm.email,
      mobile: newCustForm.mobile,
      address: newCustForm.address,
      city: newCustForm.city,
      state: newCustForm.state,
      pincode: '400001',
      category: newCustForm.category,
      creditLimit: parseFloat(newCustForm.creditLimit || '100000'),
      totalOutstanding: 0,
      totalOrders: 0,
      totalSales: 0,
      totalPaid: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addCustomer(newCust);

    // Also persist directly to API
    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCust),
      });
    } catch (err) {
      console.error(err);
    }

    setShowAddModal(false);
    setNewCustForm({
      name: '',
      companyName: '',
      contactPerson: '',
      email: '',
      mobile: '',
      city: '',
      state: 'Maharashtra',
      category: 'Distributor',
      creditLimit: '100000',
      address: '',
      gstNumber: '',
    });
  };

  const handleSaveFollowUp = () => {
    if (!selectedCustomer || !followUpForm.purpose) return;
    createFollowUpFull({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      purpose: followUpForm.purpose,
      followUpDate: followUpForm.date,
      followUpTime: followUpForm.time,
      assignedUser: 'Admin',
      notes: followUpForm.notes,
      status: 'Pending',
    });
    setShowFollowUpModal(false);
    setFollowUpForm({
      purpose: '',
      date: new Date().toISOString().split('T')[0],
      time: '11:00 AM',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Management</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {customers.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized Admin CRM access to all client records, purchasing history, warranties, and ledger.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Add New Customer
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company, code, city, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Distributor">Distributor</option>
              <option value="Dealer">Dealer</option>
              <option value="OEM Manufacturer">OEM Manufacturer</option>
              <option value="Fleet Owner">Fleet Owner</option>
              <option value="Retailer">Retailer</option>
            </select>
          </div>

          <div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All States</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Customer & Code</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-right">Total Revenue</th>
                <th className="px-4 py-3.5 text-right">Outstanding</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => {
                const custOrders = salesOrders.filter((o) => o.customerId === cust.id || o.customerName === cust.name);
                const custRevenue = custOrders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-500">{cust.companyName}</div>
                      <div className="text-[10px] text-blue-600 font-mono mt-0.5">{cust.customerCode || cust.id}</div>
                    </td>

                    <td className="px-4 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust.mobile || cust.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-[180px]">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust.city || 'Mumbai'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{cust.state || 'Maharashtra'}</div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {cust.category || 'Distributor'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-slate-900">
                      ₹{custRevenue.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <span
                        className={`font-bold ${
                          (cust.totalOutstanding || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        ₹{(cust.totalOutstanding || 0).toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          cust.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cust.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> 360 View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No customers match the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CUSTOMER 360 COMPREHENSIVE VIEW */}
      {/* ======================================================== */}
      {selectedCustomer && customer360Data && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{selectedCustomer.companyName}</span>
                    <span>•</span>
                    <span className="font-mono text-blue-600">{selectedCustomer.customerCode || selectedCustomer.id}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFollowUpModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition shadow-sm"
                >
                  + Add Follow-up
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Top Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Total Orders</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{customer360Data.orders.length}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    ₹{customer360Data.totalRevenue.toLocaleString('en-IN')} Lifetime
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Payments Collected</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    ₹{customer360Data.totalPaid.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">
                    {customer360Data.payments.length} Payments recorded
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Pending Outstanding</div>
                  <div className="text-2xl font-black text-rose-700 mt-1">
                    ₹{customer360Data.totalOutstanding.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-rose-600 mt-0.5">
                    Credit Limit: ₹{selectedCustomer.creditLimit?.toLocaleString('en-IN') || '1,00,000'}
                  </div>
                </div>
              </div>

              {/* 1. Orders Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <span>Sales Orders ({customer360Data.orders.length})</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {customer360Data.orders.map((o) => (
                    <div key={o.id} className="p-3 bg-slate-50/40 hover:bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{o.orderNumber}</div>
                        <div className="text-[11px] text-slate-500">
                          Date: {o.orderDate} · Dispatch: {o.dispatchStatus} · Payment: {o.paymentStatus}
                        </div>
                      </div>
                      <div className="text-right font-bold text-slate-900">
                        ₹{(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                  {customer360Data.orders.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">No orders recorded yet.</div>
                  )}
                </div>
              </div>

              {/* 2. Products & Raw Materials Purchased */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Finished Products Purchased ({customer360Data.productsPurchased.length})</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {customer360Data.productsPurchased.map((p, idx) => (
                      <div key={idx} className="p-2.5 text-xs flex justify-between items-center bg-slate-50/30">
                        <div>
                          <div className="font-semibold text-slate-800">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.sku} · Qty: {p.qty}</div>
                        </div>
                        <div className="font-bold text-slate-700">₹{p.total.toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                    {customer360Data.productsPurchased.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">No product items found.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Raw Materials / Cables Purchased ({customer360Data.rawMaterialsPurchased.length})</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {customer360Data.rawMaterialsPurchased.map((r, idx) => (
                      <div key={idx} className="p-2.5 text-xs flex justify-between items-center bg-slate-50/30">
                        <div>
                          <div className="font-semibold text-slate-800">{r.name}</div>
                          <div className="text-[10px] text-slate-400">{r.sku} · Qty: {r.qty}</div>
                        </div>
                        <div className="font-bold text-slate-700">₹{r.total.toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                    {customer360Data.rawMaterialsPurchased.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">No raw material items found.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Invoices & Payments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Invoices ({customer360Data.invoices.length})</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto">
                    {customer360Data.invoices.map((inv) => (
                      <div key={inv.id} className="p-2.5 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-800">{inv.invoiceNumber}</div>
                          <div className="text-[10px] text-slate-400">Date: {inv.invoiceDate}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </div>
                    ))}
                    {customer360Data.invoices.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">No invoices generated yet.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Payments ({customer360Data.payments.length})</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto">
                    {customer360Data.payments.map((pm) => (
                      <div key={pm.id} className="p-2.5 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-800">{pm.paymentNumber}</div>
                          <div className="text-[10px] text-slate-400">Mode: {pm.paymentMode} · Date: {pm.paymentDate}</div>
                        </div>
                        <div className="font-bold text-emerald-700">₹{pm.amount.toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                    {customer360Data.payments.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">No payments recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Follow-ups & Activity Timeline */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Follow-ups & Activity Timeline ({customer360Data.followUps.length})</span>
                  </div>
                  <button
                    onClick={() => setShowFollowUpModal(true)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    + Add New
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {customer360Data.followUps.map((f) => (
                    <div key={f.id} className="p-3 text-xs flex justify-between items-start bg-slate-50/40">
                      <div>
                        <div className="font-bold text-slate-900">{f.purpose}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Scheduled: {f.followUpDate} at {f.followUpTime} · Rep: {f.assignedUser || 'Sales Team'}
                        </div>
                        {f.notes && <div className="text-[11px] text-slate-600 italic mt-1">&quot;{f.notes}&quot;</div>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        f.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                  ))}
                  {customer360Data.followUps.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">No follow-ups recorded yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
              >
                Close 360 View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD CUSTOMER */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Create New Customer Record</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Electronics Ltd"
                  value={newCustForm.name}
                  onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="contact@company.com"
                    value={newCustForm.email}
                    onChange={(e) => setNewCustForm({ ...newCustForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newCustForm.mobile}
                    onChange={(e) => setNewCustForm({ ...newCustForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={newCustForm.city}
                    onChange={(e) => setNewCustForm({ ...newCustForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State</label>
                  <select
                    value={newCustForm.state}
                    onChange={(e) => setNewCustForm({ ...newCustForm, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCustForm.category}
                    onChange={(e) => setNewCustForm({ ...newCustForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="Distributor">Distributor</option>
                    <option value="Dealer">Dealer</option>
                    <option value="OEM Manufacturer">OEM Manufacturer</option>
                    <option value="Fleet Owner">Fleet Owner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newCustForm.creditLimit}
                    onChange={(e) => setNewCustForm({ ...newCustForm, creditLimit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: QUICK SCHEDULE FOLLOW-UP */}
      {/* ======================================================== */}
      {showFollowUpModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Schedule Follow-up: {selectedCustomer.name}</h3>
              <button onClick={() => setShowFollowUpModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Purpose *</label>
                <input
                  type="text"
                  placeholder="e.g. Discuss bulk pricing / quotation review"
                  value={followUpForm.purpose}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, purpose: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={followUpForm.date}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={followUpForm.time}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Notes or agenda for the follow-up..."
                  value={followUpForm.notes}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFollowUp}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm"
              >
                Save Follow-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
