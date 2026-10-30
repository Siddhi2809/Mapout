'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { Customer } from '@/types/erp';
import {
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  Edit2,
  Power,
  Download,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShoppingCart,
  FileText,
  RotateCcw,
  UserCheck,
  Briefcase,
  Calendar,
} from 'lucide-react';

export default function CustomersPage() {
  const {
    customers,
    salesOrders,
    invoices,
    customerPayments,
    salesReturns,
    followUps,
    addCustomerFull,
    updateCustomerFull,
    toggleCustomerStatus,
    generateEntityCode,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'sales' | 'outstanding'>('name');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');

  // Modal & Drawer States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [formCustomerCode, setFormCustomerCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formType, setFormType] = useState('Distributor');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formAltMobile, setFormAltMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGstNumber, setFormGstNumber] = useState('');
  const [formPanNumber, setFormPanNumber] = useState('');
  const [formGstType, setFormGstType] = useState('Regular');
  const [formAddress, setFormAddress] = useState('');
  const [formShippingAddress, setFormShippingAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formCountry, setFormCountry] = useState('India');
  const [formCustomerSource, setFormCustomerSource] = useState('Website');
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 30 Days');
  const [formCreditLimit, setFormCreditLimit] = useState('150000');
  const [formAssignedSalesUser, setFormAssignedSalesUser] = useState('Rajesh Kumar');
  const [formFollowUpDate, setFormFollowUpDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    customers.forEach((c) => {
      if (c.city && c.city.trim()) citySet.add(c.city.trim());
    });
    return Array.from(citySet).sort();
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const matchSearch =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.customerCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.city.toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
        const matchCategory = categoryFilter === 'ALL' || c.category === categoryFilter || c.customerType === categoryFilter;

        // City Filter
        const matchCity = cityFilter === 'ALL' || (c.city || '').toLowerCase() === cityFilter.toLowerCase();

        // Date Filter
        const cDate = (c.createdAt || c.lastOrderDate || '').split('T')[0];
        const matchStartDate = !startDate || (cDate ? cDate >= startDate : true);
        const matchEndDate = !endDate || (cDate ? cDate <= endDate : true);

        return matchSearch && matchStatus && matchCategory && matchCity && matchStartDate && matchEndDate;
      })
      .sort((a, b) => {
        if (sortBy === 'sales') return (b.totalSales || 0) - (a.totalSales || 0);
        if (sortBy === 'outstanding') return (b.totalOutstanding || 0) - (a.totalOutstanding || 0);
        return a.companyName.localeCompare(b.companyName);
      });
  }, [customers, searchQuery, statusFilter, categoryFilter, cityFilter, startDate, endDate, sortBy]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormCustomerCode(generateEntityCode('CUSTOMER'));
    setFormName('');
    setFormCompanyName('');
    setFormType('Distributor');
    setFormContactPerson('');
    setFormMobile('');
    setFormAltMobile('');
    setFormEmail('');
    setFormGstNumber('');
    setFormPanNumber('');
    setFormGstType('Regular');
    setFormAddress('');
    setFormShippingAddress('');
    setFormCity('');
    setFormState('');
    setFormPincode('');
    setFormCountry('India');
    setFormCustomerSource('Website');
    setFormPaymentTerms('Net 30 Days');
    setFormCreditLimit('150000');
    setFormAssignedSalesUser('Rajesh Kumar');
    setFormFollowUpDate('');
    setFormNotes('');
    setFormStatus('ACTIVE');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormCustomerCode(c.customerCode || c.id);
    setFormName(c.name);
    setFormCompanyName(c.companyName);
    setFormType(c.customerType || c.category || 'Distributor');
    setFormContactPerson(c.contactPerson);
    setFormMobile(c.mobile);
    setFormAltMobile(c.alternateMobile || '');
    setFormEmail(c.email);
    setFormGstNumber(c.gstNumber || '');
    setFormPanNumber(c.panNumber || '');
    setFormGstType(c.gstType || 'Regular');
    setFormAddress(c.address);
    setFormShippingAddress(c.shippingAddress || c.address);
    setFormCity(c.city);
    setFormState(c.state);
    setFormPincode(c.pincode);
    setFormCountry(c.country || 'India');
    setFormCustomerSource(c.customerSource || 'Website');
    setFormPaymentTerms(c.paymentTerms || 'Net 30 Days');
    setFormCreditLimit(String(c.creditLimit));
    setFormAssignedSalesUser(c.assignedSalesUser || 'Rajesh Kumar');
    setFormFollowUpDate(c.nextFollowUpDate || '');
    setFormNotes(c.notes || '');
    setFormStatus(c.status);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailsDrawer = (c: Customer) => {
    setSelectedCustomer(c);
    setIsDetailsDrawerOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) return setFormError('Customer Name is required.');
    if (!formCompanyName.trim()) return setFormError('Company Name is required.');
    if (!formMobile.trim()) return setFormError('Mobile number is required.');

    // Email validation
    if (formEmail.trim() && !/\S+@\S+\.\S+/.test(formEmail.trim())) {
      return setFormError('Please enter a valid email address format.');
    }

    // GST validation if provided (15 character standard regex in India)
    if (formGstNumber.trim() && formGstNumber.trim().length !== 15) {
      return setFormError('GST number must be exactly 15 characters long if provided.');
    }

    const credLimit = parseFloat(formCreditLimit) || 0;

    if (editingCustomer) {
      const res = updateCustomerFull(editingCustomer.id, {
        name: formName.trim(),
        companyName: formCompanyName.trim(),
        customerType: formType,
        category: formType,
        contactPerson: formContactPerson.trim(),
        mobile: formMobile.trim(),
        alternateMobile: formAltMobile.trim(),
        email: formEmail.trim(),
        gstNumber: formGstNumber.trim().toUpperCase(),
        panNumber: formPanNumber.trim().toUpperCase(),
        gstType: formGstType,
        address: formAddress.trim(),
        shippingAddress: formShippingAddress.trim() || formAddress.trim(),
        city: formCity.trim(),
        state: formState.trim(),
        pincode: formPincode.trim(),
        country: formCountry.trim(),
        customerSource: formCustomerSource,
        paymentTerms: formPaymentTerms,
        creditLimit: credLimit,
        assignedSalesUser: formAssignedSalesUser,
        nextFollowUpDate: formFollowUpDate || undefined,
        notes: formNotes.trim() || undefined,
        status: formStatus,
      });

      if (!res.success) {
        setFormError(res.message || 'Failed to update customer');
        return;
      }
      showToast(`Customer account "${formCompanyName}" updated.`);
    } else {
      const res = addCustomerFull({
        customerNumber: formCustomerCode,
        customerCode: formCustomerCode,
        name: formName.trim(),
        companyName: formCompanyName.trim(),
        customerType: formType,
        category: formType,
        contactPerson: formContactPerson.trim(),
        mobile: formMobile.trim(),
        alternateMobile: formAltMobile.trim(),
        email: formEmail.trim(),
        gstin: formGstNumber.trim().toUpperCase(),
        gstNumber: formGstNumber.trim().toUpperCase(),
        panNumber: formPanNumber.trim().toUpperCase(),
        gstType: formGstType,
        address: formAddress.trim(),
        shippingAddress: formShippingAddress.trim() || formAddress.trim(),
        city: formCity.trim(),
        state: formState.trim(),
        pincode: formPincode.trim(),
        country: formCountry.trim(),
        customerSource: formCustomerSource,
        paymentTerms: formPaymentTerms,
        creditLimit: credLimit,
        assignedSalesUser: formAssignedSalesUser,
        nextFollowUpDate: formFollowUpDate || undefined,
        notes: formNotes.trim() || undefined,
        status: formStatus,
        totalOrders: 0,
        totalSales: 0,
        totalPaid: 0,
        totalOutstanding: 0,
      });

      if (!res.success) {
        setFormError(res.message || 'Failed to add customer');
        return;
      }
      showToast(`Customer account "${formCompanyName}" created successfully.`);
    }

    setIsFormModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Customer ID', 'Company Name', 'Customer Name', 'Type', 'Mobile', 'Email', 'GST', 'City', 'Total Sales', 'Outstanding', 'Status'];
    const rows = filteredCustomers.map((c) => [
      c.customerCode || c.id,
      c.companyName,
      c.name,
      c.category || c.customerType,
      c.mobile,
      c.email,
      c.gstNumber || '-',
      c.city,
      c.totalSales || 0,
      c.totalOutstanding || 0,
      c.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Customer_CRM_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" /> {toastMessage}
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customers & CRM Accounts</h1>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive B2B customer records, credit terms, sales histories, and client interaction ledger.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Add New Customer
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Customer, Company, Code, City..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Date:
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                title="From Date"
              />
              <span className="text-slate-400 text-xs font-medium">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                title="To Date"
              />

              <div className="flex items-center gap-1.5 text-slate-600 font-semibold ml-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> City:
              </div>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="ALL">All Cities ({availableCities.length})</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <Filter className="w-3.5 h-3.5 text-slate-500" /> Category:
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="ALL">All Categories</option>
                <option value="Distributor">Distributor</option>
                <option value="Fleet Owner">Fleet Owner</option>
                <option value="OEM Manufacturer">OEM Manufacturer</option>
                <option value="Retailer">Retailer</option>
              </select>

              <div className="flex items-center gap-1.5 text-slate-600 font-semibold ml-1">
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white ml-1"
              >
                <option value="name">Sort by Company</option>
                <option value="sales">Sort by Total Sales</option>
                <option value="outstanding">Sort by Outstanding</option>
              </select>

              {(startDate || endDate || cityFilter !== 'ALL' || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setCityFilter('ALL');
                    setStatusFilter('ALL');
                    setCategoryFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                  title="Clear all filters"
                >
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-medium ml-auto">
              Showing <strong className="text-slate-800">{filteredCustomers.length}</strong> of {customers.length} clients
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                  <th className="p-3.5">Customer ID</th>
                  <th className="p-3.5">Company & Contact</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Mobile & Email</th>
                  <th className="p-3.5">GST Number</th>
                  <th className="p-3.5">City</th>
                  <th className="p-3.5 text-right">Orders</th>
                  <th className="p-3.5 text-right">Total Sales</th>
                  <th className="p-3.5 text-right">Outstanding</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono text-blue-600 font-bold">
                      <div>{c.customerCode || c.id}</div>
                      {c.convertedFromLeadId && (
                        <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Lead Converted
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 max-w-[200px]">
                      <div className="font-bold text-slate-900 truncate">{c.companyName}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Contact: {c.name}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                        {c.category || c.customerType}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-[180px]">
                      <div className="text-slate-900 font-semibold">{c.mobile}</div>
                      <div className="text-[10px] text-slate-500 truncate">{c.email}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 font-semibold">{c.gstNumber || '-'}</td>
                    <td className="p-3.5 text-slate-700 font-medium">{c.city}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">{c.totalOrders || 0}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-700">₹{(c.totalSales || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right font-bold text-rose-700">₹{(c.totalOutstanding || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetailsDrawer(c)}
                          title="View Complete Customer Profile"
                          className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          title="Edit Customer"
                          className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-slate-200 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleCustomerStatus(c.id)}
                          title={c.status === 'ACTIVE' ? 'Deactivate Customer' : 'Activate Customer'}
                          className={`p-1.5 rounded-lg border transition ${
                            c.status === 'ACTIVE'
                              ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-slate-500 text-xs">
                      No customer accounts found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD / EDIT CUSTOMER MODAL */}
        {isFormModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 lg:p-6 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsFormModalOpen(false);
            }}
          >
            <div className="erp-card w-full max-w-4xl max-h-[90vh] flex flex-col bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden my-auto">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80 shrink-0">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                    <Building2 className="w-5 h-5" />
                  </div>
                  {editingCustomer ? `Edit Customer: ${editingCustomer.companyName}` : 'Add New B2B Customer Account'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition flex items-center justify-center shadow-sm"
                  title="Close Form"
                  aria-label="Close Form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" /> {formError}
                  </div>
                )}

                <form onSubmit={handleSaveCustomer} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" /> 1. Basic Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">
                          Customer Code <span className="text-slate-500 font-normal">(Auto-generated)</span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={formCustomerCode}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-blue-600 font-mono focus:outline-none cursor-not-allowed font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Customer Contact Name *</label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Primary Contact Full Name"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Company Name *</label>
                        <input
                          type="text"
                          required
                          value={formCompanyName}
                          onChange={(e) => setFormCompanyName(e.target.value)}
                          placeholder="Registered Business Name"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Customer Type / Category</label>
                        <select
                          value={formType}
                          onChange={(e) => setFormType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        >
                          <option value="Dealer">Dealer</option>
                          <option value="Distributor">Distributor</option>
                          <option value="Retailer">Retailer</option>
                          <option value="Garage">Garage</option>
                          <option value="End Customer">End Customer</option>
                          <option value="Fleet Owner">Fleet Owner</option>
                          <option value="OEM Manufacturer">OEM Manufacturer</option>
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-4 h-4" /> 2. Contact Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Mobile Number *</label>
                        <input
                          type="text"
                          required
                          value={formMobile}
                          onChange={(e) => setFormMobile(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Alternate Mobile</label>
                        <input
                          type="text"
                          value={formAltMobile}
                          onChange={(e) => setFormAltMobile(e.target.value)}
                          placeholder="Landline or secondary phone"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Email Address</label>
                        <input
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="purchasing@company.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GST & Taxation */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" /> 3. GST & Tax Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">GST Number (15 Digits)</label>
                        <input
                          type="text"
                          maxLength={15}
                          value={formGstNumber}
                          onChange={(e) => setFormGstNumber(e.target.value.toUpperCase())}
                          placeholder="27AAACV1234F1Z8"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 uppercase focus:outline-none focus:border-blue-500 focus:bg-white transition font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">PAN Number</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={formPanNumber}
                          onChange={(e) => setFormPanNumber(e.target.value.toUpperCase())}
                          placeholder="AAACV1234F"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 uppercase focus:outline-none focus:border-blue-500 focus:bg-white transition font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">GST Registration Type</label>
                        <select
                          value={formGstType}
                          onChange={(e) => setFormGstType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        >
                          <option value="Regular">Regular Taxable</option>
                          <option value="Composition">Composition Scheme</option>
                          <option value="Unregistered">Unregistered Business</option>
                          <option value="SEZ">SEZ / Special Export Zone</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address Information (Billing & Shipping) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> 4. Billing & Shipping Address
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Billing Address *</label>
                        <textarea
                          rows={2}
                          required
                          value={formAddress}
                          onChange={(e) => setFormAddress(e.target.value)}
                          placeholder="Building / Plot No, Street, Industrial Estate"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Shipping Address (If Different)</label>
                        <textarea
                          rows={2}
                          value={formShippingAddress}
                          onChange={(e) => setFormShippingAddress(e.target.value)}
                          placeholder="Warehouse / Factory Delivery Address"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">City *</label>
                        <input
                          type="text"
                          required
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          placeholder="e.g. Pune"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">State *</label>
                        <input
                          type="text"
                          required
                          value={formState}
                          onChange={(e) => setFormState(e.target.value)}
                          placeholder="e.g. Maharashtra"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Pincode</label>
                        <input
                          type="text"
                          value={formPincode}
                          onChange={(e) => setFormPincode(e.target.value)}
                          placeholder="411018"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Country</label>
                        <input
                          type="text"
                          value={formCountry}
                          onChange={(e) => setFormCountry(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Source, CRM Follow-ups & Notes */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" /> 5. Customer Source & CRM Follow-ups
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Customer Source</label>
                        <select
                          value={formCustomerSource}
                          onChange={(e) => setFormCustomerSource(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        >
                          <option value="Website">Website</option>
                          <option value="Amazon">Amazon</option>
                          <option value="IndiaMART">IndiaMART</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Referral">Referral</option>
                          <option value="Dealer">Dealer Network</option>
                          <option value="Distributor">Distributor Network</option>
                          <option value="Other">Other / Direct Contact</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Assigned Salesperson</label>
                        <input
                          type="text"
                          value={formAssignedSalesUser}
                          onChange={(e) => setFormAssignedSalesUser(e.target.value)}
                          placeholder="Sales Executive Name"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Next Follow-Up Date</label>
                        <input
                          type="date"
                          value={formFollowUpDate}
                          onChange={(e) => setFormFollowUpDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">CRM Log / Follow-up Notes</label>
                        <textarea
                          rows={2}
                          value={formNotes}
                          onChange={(e) => setFormNotes(e.target.value)}
                          placeholder="Log interaction notes, preferred products, credit history remarks..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Terms & Status */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" /> 6. Business Credit Terms & Status
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Payment Terms</label>
                        <select
                          value={formPaymentTerms}
                          onChange={(e) => setFormPaymentTerms(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        >
                          <option value="Net 30 Days">Net 30 Days</option>
                          <option value="Net 15 Days">Net 15 Days</option>
                          <option value="Immediate">Immediate / Advance</option>
                          <option value="Net 45 Days">Net 45 Days</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Credit Limit (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={formCreditLimit}
                          onChange={(e) => setFormCreditLimit(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Account Status</label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition font-semibold"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Sticky Footer Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 bg-slate-50/80 px-6 py-4 -mx-6 -mb-6 mt-6 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsFormModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
                    >
                      {editingCustomer ? 'Update Customer' : 'Create Customer Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER PROFILE & CRM DRAWER */}
        {isDetailsDrawerOpen && selectedCustomer && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsDetailsDrawerOpen(false);
            }}
          >
            <div className="w-full max-w-2xl bg-white border-l border-slate-200 p-6 space-y-6 overflow-y-auto h-full shadow-2xl text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-mono text-blue-600 font-bold">{selectedCustomer.customerCode || selectedCustomer.id}</div>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">{selectedCustomer.companyName}</h3>
                  <div className="text-xs text-slate-500 font-medium">{selectedCustomer.name} | {selectedCustomer.category || selectedCustomer.customerType}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailsDrawerOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition flex items-center justify-center"
                  title="Close Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SALES SUMMARY METRICS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Total Orders:</span>
                  <div className="text-base font-bold text-slate-900">{selectedCustomer.totalOrders || 0}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Total Revenue:</span>
                  <div className="text-base font-bold text-emerald-700">₹{(selectedCustomer.totalSales || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Total Paid:</span>
                  <div className="text-base font-bold text-blue-600">₹{(selectedCustomer.totalPaid || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Outstanding:</span>
                  <div className="text-base font-bold text-rose-700">₹{(selectedCustomer.totalOutstanding || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* ACCOUNT DETAILS & CRM INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-blue-600" /> Contacts & Sales Representative</div>
                  <div className="text-slate-600">Mobile: <span className="text-slate-900 font-mono font-semibold">{selectedCustomer.mobile}</span></div>
                  {selectedCustomer.alternateMobile && <div className="text-slate-600">Alt Mobile: <span className="text-slate-900 font-mono font-medium">{selectedCustomer.alternateMobile}</span></div>}
                  <div className="text-slate-600">Email: <span className="text-slate-900 font-medium">{selectedCustomer.email || 'N/A'}</span></div>
                  <div className="text-slate-600">Assigned Salesperson: <span className="text-slate-900 font-semibold">{selectedCustomer.assignedSalesUser || 'Unassigned'}</span></div>
                  <div className="text-slate-600">Customer Source: <span className="text-slate-900 font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 inline-block mt-0.5">{selectedCustomer.customerSource || 'Direct'}</span></div>
                </div>

                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-blue-600" /> Tax & Credit Terms</div>
                  <div className="text-slate-600">GST Number: <span className="text-slate-900 font-mono font-bold">{selectedCustomer.gstNumber || 'Unregistered'}</span></div>
                  {selectedCustomer.panNumber && <div className="text-slate-600">PAN: <span className="text-slate-900 font-mono">{selectedCustomer.panNumber}</span></div>}
                  <div className="text-slate-600">Payment Terms: <span className="text-slate-900 font-semibold">{selectedCustomer.paymentTerms || 'Net 30 Days'}</span></div>
                  <div className="text-slate-600">Credit Limit: <span className="text-slate-900 font-bold">₹{(selectedCustomer.creditLimit || 0).toLocaleString('en-IN')}</span></div>
                </div>
              </div>

              {/* ADDRESSES & FOLLOW-UPS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-600" /> Billing & Shipping Address</div>
                  <div className="text-slate-600">
                    <span className="font-semibold block text-slate-700">Billing Address:</span>
                    <span className="text-slate-900">{selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.pincode ? `- ${selectedCustomer.pincode}` : ''}</span>
                  </div>
                  {selectedCustomer.shippingAddress && (
                    <div className="text-slate-600 pt-1 border-t border-slate-200">
                      <span className="font-semibold block text-slate-700">Shipping Address:</span>
                      <span className="text-slate-900">{selectedCustomer.shippingAddress}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-amber-600" /> CRM & Follow-up Log</div>
                  <div className="text-slate-600">Next Follow-Up Date: <span className="text-slate-900 font-semibold">{selectedCustomer.nextFollowUpDate || 'No follow-up set'}</span></div>
                  <div className="text-slate-600">
                    <span className="font-semibold block text-slate-700">Notes / Remarks:</span>
                    <span className="text-slate-800 italic">{selectedCustomer.notes || 'No CRM notes recorded.'}</span>
                  </div>
                </div>
              </div>

              {/* SALES ORDERS HISTORY */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-amber-600" /> Sales Orders History
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2">SO #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2 text-right">Amount</th>
                        <th className="p-2 text-right">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salesOrders
                        .filter((so) => so.customerId === selectedCustomer.id)
                        .map((so) => (
                          <tr key={so.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-blue-600 font-bold">{so.orderNumber}</td>
                            <td className="p-2 text-slate-600 font-mono">{so.orderDate}</td>
                            <td className="p-2 text-right font-bold text-slate-900">₹{so.grandTotal.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {so.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      {salesOrders.filter((so) => so.customerId === selectedCustomer.id).length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-500">No orders logged for this customer.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INVOICES & PAYMENTS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" /> Invoices & Ledger
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2">Invoice #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2 text-right">Grand Total</th>
                        <th className="p-2 text-right">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices
                        .filter((inv) => inv.customerId === selectedCustomer.id)
                        .map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-blue-600 font-bold">{inv.invoiceNumber}</td>
                            <td className="p-2 text-slate-600 font-mono">{inv.invoiceDate}</td>
                            <td className="p-2 text-right font-bold text-slate-900">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right font-bold text-rose-700">₹{inv.outstandingAmount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setIsDetailsDrawerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

