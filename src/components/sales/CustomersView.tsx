'use client';

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Customer } from '../../types/erp';
import { Users, Plus, Search, Phone, Mail, MapPin, Calendar, AlertTriangle, Edit2, X } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, updateCustomer } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
    name: '',
    companyName: '',
    contactPerson: '',
    mobile: '',
    phone: '',
    email: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    category: 'Fleet Owner',
    totalOutstanding: 0,
    creditLimit: 100000,
    status: 'ACTIVE',
    lastFollowUp: new Date().toISOString().split('T')[0],
    nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const categories = ['Distributor', 'Fleet Owner', 'OEM Manufacturer', 'Retailer'];

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (item?: Customer) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        companyName: item.companyName,
        contactPerson: item.contactPerson || item.name,
        mobile: item.mobile || item.phone || '',
        phone: item.phone || item.mobile || '',
        email: item.email,
        address: item.address,
        city: item.city || 'Mumbai',
        state: item.state || 'Maharashtra',
        pincode: item.pincode || '400001',
        category: item.category,
        totalOutstanding: item.totalOutstanding,
        creditLimit: item.creditLimit,
        status: item.status,
        lastFollowUp: item.lastFollowUp,
        nextFollowUpDate: item.nextFollowUpDate,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        companyName: '',
        contactPerson: '',
        mobile: '',
        phone: '',
        email: '',
        address: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        category: 'Fleet Owner',
        totalOutstanding: 0,
        creditLimit: 150000,
        status: 'ACTIVE',
        lastFollowUp: new Date().toISOString().split('T')[0],
        nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateCustomer(editingItem.id, formData);
    } else {
      addCustomer(formData);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 erp-card p-5 bg-white border border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Customer CRM & Accounts Receivables
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage B2B client directory, credit limits, outstanding dues, and follow-up schedules.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/10 transition"
        >
          <Plus className="w-4 h-4 text-white" /> Add New Customer Account
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search company or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Customer Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => {
          const isOverdueFollowup = c.nextFollowUpDate && c.nextFollowUpDate <= new Date().toISOString().split('T')[0];

          return (
            <div key={c.id} className="erp-card p-4 flex flex-col justify-between erp-card-interactive bg-white border border-slate-200 shadow-sm">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {c.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">{c.companyName}</h3>
                    <p className="text-xs text-slate-600 font-medium">Contact: {c.name}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" /> {c.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" /> {c.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> {c.address}
                  </div>
                </div>

                {/* Outstanding & Credit Box */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Total Outstanding Due:</span>
                    <span className={`font-extrabold ${c.totalOutstanding > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      ₹{c.totalOutstanding.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Credit Limit:</span>
                    <span className="font-semibold text-slate-900">₹{c.creditLimit.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Follow-up status */}
                {c.nextFollowUpDate && (
                  <div className={`mt-3 p-2 rounded-lg text-[11px] font-medium flex items-center justify-between ${
                    isOverdueFollowup ? 'bg-amber-50 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Next Follow-Up:
                    </span>
                    <span className="font-bold">{c.nextFollowUpDate}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => handleOpenModal(c)}
                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 px-2.5 border border-blue-200"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Customer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl p-6 relative text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit Customer Account' : 'Add New B2B Customer'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Office / Factory Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Customer Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Customer['category'] })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
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
                  Save Customer Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
