'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { Lead } from '@/types/erp';
import {
  UserCheck,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  CheckCircle,
  X,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function AdminLeadsPage() {
  const { leads, addCustomer, salesOrders } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);

  // Sync with ERPContext leads
  React.useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  const [leadForm, setLeadForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    mobile: '',
    source: 'Website',
    interestedProductName: 'OBD-II Diagnostic Scanner Pro',
    expectedValue: '50000',
    assignedUser: 'Sales Manager',
    status: 'NEW',
    notes: '',
  });

  const uniqueSalespersons = useMemo(() => {
    const set = new Set<string>();
    localLeads.forEach((l) => {
      if (l.assignedUser) set.add(l.assignedUser);
    });
    return Array.from(set).sort();
  }, [localLeads]);

  const filteredLeads = useMemo(() => {
    return localLeads.filter((lead) => {
      const matchSearch =
        lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.leadNumber && lead.leadNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter ? lead.status === statusFilter : true;
      const matchRep = salespersonFilter ? lead.assignedUser === salespersonFilter : true;

      return matchSearch && matchStatus && matchRep;
    });
  }, [localLeads, searchQuery, statusFilter, salespersonFilter]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: Lead = {
      id: `lead_${Date.now()}`,
      leadNumber: `LD-${Date.now().toString().slice(-4)}`,
      leadName: leadForm.contactPerson,
      companyName: leadForm.companyName,
      contactPerson: leadForm.contactPerson,
      email: leadForm.email,
      mobile: leadForm.mobile,
      source: leadForm.source,
      interestedProductName: leadForm.interestedProductName,
      expectedValue: parseFloat(leadForm.expectedValue || '0'),
      assignedUser: leadForm.assignedUser,
      status: leadForm.status as any,
      notes: leadForm.notes,
      createdAt: new Date().toISOString(),
    };

    setLocalLeads((prev) => [newLead, ...prev]);

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      });
    } catch (err) {
      console.error(err);
    }

    setShowAddModal(false);
    setLeadForm({
      companyName: '',
      contactPerson: '',
      email: '',
      mobile: '',
      source: 'Website',
      interestedProductName: 'OBD-II Diagnostic Scanner Pro',
      expectedValue: '50000',
      assignedUser: 'Sales Manager',
      status: 'NEW',
      notes: '',
    });
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setLocalLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus as any } : l))
    );

    try {
      await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertLead = async (lead: Lead) => {
    const confirmConvert = window.confirm(`Convert ${lead.companyName} into an Active Customer?`);
    if (!confirmConvert) return;

    const newCustomer = {
      customerCode: `CUST-${Date.now().toString().slice(-4)}`,
      name: lead.companyName,
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      mobile: lead.mobile,
      category: 'Distributor',
      status: 'ACTIVE',
      totalOrders: 0,
      totalSales: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    };

    addCustomer(newCustomer as any);
    await handleUpdateStatus(lead.id, 'CONVERTED');
    alert(`Lead converted successfully into customer ${lead.companyName}!`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lead Pipeline Management</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {localLeads.length} Leads
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pipeline monitoring, salesperson assignments, conversion tracking, and deal stages.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Create Lead
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by company, person, email..."
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
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="PROPOSAL">Proposal Sent</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="CONVERTED">Converted</option>
              <option value="LOST">Lost</option>
            </select>
          </div>

          <div>
            <select
              value={salespersonFilter}
              onChange={(e) => setSalespersonFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Sales Representatives</option>
              {uniqueSalespersons.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Lead & Contact</th>
                <th className="px-4 py-3.5">Product of Interest</th>
                <th className="px-4 py-3.5 text-right">Expected Value</th>
                <th className="px-4 py-3.5">Assigned To</th>
                <th className="px-4 py-3.5 text-center">Status Stage</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{lead.companyName}</div>
                    <div className="text-[11px] text-slate-500">{lead.contactPerson}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span>{lead.email}</span>
                      <span>•</span>
                      <span>{lead.mobile || 'N/A'}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-800">{lead.interestedProductName || 'Automotive Sensors'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Source: {lead.source || 'Website'}</div>
                  </td>

                  <td className="px-4 py-4 text-right font-bold text-slate-900">
                    ₹{(lead.expectedValue || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="px-4 py-4">
                    <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-[11px]">
                      {lead.assignedUser || 'Sales Team'}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <select
                      value={lead.status}
                      onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer ${
                        lead.status === 'CONVERTED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : lead.status === 'LOST'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="QUALIFIED">QUALIFIED</option>
                      <option value="PROPOSAL">PROPOSAL</option>
                      <option value="NEGOTIATION">NEGOTIATION</option>
                      <option value="CONVERTED">CONVERTED</option>
                      <option value="LOST">LOST</option>
                    </select>
                  </td>

                  <td className="px-5 py-4 text-right">
                    {lead.status !== 'CONVERTED' ? (
                      <button
                        onClick={() => handleConvertLead(lead)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition border border-emerald-200"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Convert to Customer
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Converted
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No leads match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Lead */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add New Inbound Lead</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Company / Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Auto Parts Ltd"
                  value={leadForm.companyName}
                  onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={leadForm.contactPerson}
                    onChange={(e) => setLeadForm({ ...leadForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={leadForm.mobile}
                    onChange={(e) => setLeadForm({ ...leadForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@metroauto.in"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="Website">Website</option>
                    <option value="Exhibition">Trade Exhibition</option>
                    <option value="Referral">Client Referral</option>
                    <option value="Cold Call">Cold Outreach</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Expected Deal Value (₹)</label>
                  <input
                    type="number"
                    value={leadForm.expectedValue}
                    onChange={(e) => setLeadForm({ ...leadForm, expectedValue: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Assign Representative</label>
                  <input
                    type="text"
                    value={leadForm.assignedUser}
                    onChange={(e) => setLeadForm({ ...leadForm, assignedUser: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes & Requirements</label>
                <textarea
                  rows={2}
                  placeholder="Client requirements, volume estimates, etc."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
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
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
