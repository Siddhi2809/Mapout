'use client';

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Supplier } from '../../types/erp';
import { Building, Plus, Search, Phone, Mail, MapPin, Edit2, X, CreditCard } from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Supplier | null>(null);

  const availableCities = React.useMemo(() => {
    const list = suppliers
      .map((s) => s.city)
      .filter((c): c is string => Boolean(c && c.trim()));
    return Array.from(new Set(list)).sort();
  }, [suppliers]);

  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    category: 'Raw Components',
    totalOutstanding: 0,
    paymentTerms: 'Net 30 Days',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    accountHolderName: '',
  });

  const categories = ['Raw Components', 'Cable Extrusion', 'Electronics', 'Packaging'];

  const filteredSuppliers = suppliers.filter(
    (s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.city || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = cityFilter === 'ALL' || (s.city && s.city.toLowerCase() === cityFilter.toLowerCase());
      return matchesSearch && matchesCity;
    }
  );

  const handleOpenModal = (item?: Supplier) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        contactPerson: item.contactPerson,
        email: item.email,
        phone: item.phone,
        address: item.address,
        category: item.category,
        totalOutstanding: item.totalOutstanding,
        paymentTerms: item.paymentTerms,
        bankName: item.bankName || '',
        accountNumber: item.accountNumber || '',
        ifscCode: item.ifscCode || '',
        branchName: item.branchName || '',
        accountHolderName: item.accountHolderName || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '+91 ',
        address: '',
        category: 'Raw Components',
        totalOutstanding: 0,
        paymentTerms: 'Net 30 Days',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        accountHolderName: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateSupplier(editingItem.id, formData);
    } else {
      addSupplier(formData);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 erp-card p-5 bg-white border border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-600" /> Supplier Directory & Accounts Payable
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Vendor contacts, component source directories, and outstanding payable terms.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-900/10 transition"
        >
          <Plus className="w-4 h-4 text-white" /> Add Vendor / Supplier
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor name, contact, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-sm"
          />
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 shadow-sm"
        >
          <option value="ALL">🌆 All Cities</option>
          {availableCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => (
          <div key={s.id} className="erp-card p-4 flex flex-col justify-between erp-card-interactive bg-white border border-slate-200 shadow-sm">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {s.category}
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1.5">{s.name}</h3>
              <p className="text-xs text-slate-600 font-medium">Contact: {s.contactPerson}</p>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> {s.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {s.email}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {s.address}
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Accounts Payable Due:</span>
                  <span className={`font-extrabold ${s.totalOutstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    ₹{s.totalOutstanding.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span className="font-medium">Payment Terms:</span>
                  <span className="font-semibold text-slate-800">{s.paymentTerms}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => handleOpenModal(s)}
                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1 px-2.5 border border-amber-200"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Supplier
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl p-6 relative text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit Supplier Vendor' : 'Add New Supplier Vendor'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Company / Vendor Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Vendor Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Supplier['category'] })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" /> Bank & Settlement Account
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 50200012345678"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-mono text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-mono text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Branch Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alkapuri, Vadodara"
                      value={formData.branchName}
                      onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vendor Registered Name"
                    value={formData.accountHolderName}
                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
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
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow-lg"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
