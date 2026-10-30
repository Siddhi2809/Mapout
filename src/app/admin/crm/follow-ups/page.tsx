'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { FollowUp } from '@/types/erp';
import {
  Clock,
  Calendar,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Building2,
  X,
  ChevronRight,
  Phone,
  MessageSquare,
} from 'lucide-react';

export default function AdminFollowUpsPage() {
  const { followUps, customers, createFollowUpFull, updateFollowUpStatusFull } = useERP();

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'overdue' | 'completed' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const [newFollowUp, setNewFollowUp] = useState({
    customerId: '',
    customerName: '',
    purpose: '',
    followUpDate: todayStr,
    followUpTime: '11:00 AM',
    assignedUser: 'Sales Manager',
    notes: '',
  });

  // Categorize follow-ups
  const categorized = useMemo(() => {
    const todayList: FollowUp[] = [];
    const upcomingList: FollowUp[] = [];
    const overdueList: FollowUp[] = [];
    const completedList: FollowUp[] = [];

    followUps.forEach((f) => {
      if (f.status === 'Completed') {
        completedList.push(f);
      } else if (f.followUpDate === todayStr) {
        todayList.push(f);
      } else if (f.followUpDate < todayStr) {
        overdueList.push(f);
      } else {
        upcomingList.push(f);
      }
    });

    return {
      todayList,
      upcomingList,
      overdueList,
      completedList,
    };
  }, [followUps, todayStr]);

  const uniqueSalespersons = useMemo(() => {
    const set = new Set<string>();
    followUps.forEach((f) => {
      if (f.assignedUser) set.add(f.assignedUser);
    });
    return Array.from(set).sort();
  }, [followUps]);

  // Current list to display
  const currentList = useMemo(() => {
    let base: FollowUp[] = [];
    if (activeTab === 'today') base = categorized.todayList;
    else if (activeTab === 'upcoming') base = categorized.upcomingList;
    else if (activeTab === 'overdue') base = categorized.overdueList;
    else if (activeTab === 'completed') base = categorized.completedList;
    else base = followUps;

    return base.filter((f) => {
      const matchSearch =
        f.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.notes && f.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRep = salespersonFilter ? f.assignedUser === salespersonFilter : true;
      return matchSearch && matchRep;
    });
  }, [activeTab, categorized, followUps, searchQuery, salespersonFilter]);

  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowUp.customerName || !newFollowUp.purpose) return;

    createFollowUpFull({
      customerId: newFollowUp.customerId || 'cust_gen',
      customerName: newFollowUp.customerName,
      purpose: newFollowUp.purpose,
      followUpDate: newFollowUp.followUpDate,
      followUpTime: newFollowUp.followUpTime,
      assignedUser: newFollowUp.assignedUser,
      notes: newFollowUp.notes,
      status: 'Pending',
    });

    setShowAddModal(false);
    setNewFollowUp({
      customerId: '',
      customerName: '',
      purpose: '',
      followUpDate: todayStr,
      followUpTime: '11:00 AM',
      assignedUser: 'Sales Manager',
      notes: '',
    });
  };

  const toggleComplete = (f: FollowUp) => {
    const newStatus = f.status === 'Completed' ? 'Pending' : 'Completed';
    updateFollowUpStatusFull(f.id, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Follow-ups & Outreach</h1>
            {categorized.overdueList.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {categorized.overdueList.length} Overdue
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized schedule tracking: monitor daily customer check-ins, client renewals, and payment follow-ups.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Schedule Follow-up
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'today'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>Today&apos;s Follow-ups</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'today' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
          }`}>
            {categorized.todayList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>Upcoming</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {categorized.upcomingList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Overdue</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'overdue' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
          }`}>
            {categorized.overdueList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {categorized.completedList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>All Records ({followUps.length})</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, purpose, or remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={salespersonFilter}
              onChange={(e) => setSalespersonFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Representatives</option>
              {uniqueSalespersons.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {currentList.map((f) => {
            const isOverdue = f.followUpDate < todayStr && f.status !== 'Completed';
            const isToday = f.followUpDate === todayStr && f.status !== 'Completed';

            return (
              <div
                key={f.id}
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  isOverdue ? 'bg-rose-50/30' : isToday ? 'bg-blue-50/20' : 'hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{f.customerName}</span>
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                        OVERDUE
                      </span>
                    )}
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700">
                        DUE TODAY
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-semibold text-slate-700">{f.purpose}</div>

                  {f.notes && (
                    <div className="text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100 max-w-xl">
                      &quot;{f.notes}&quot;
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {f.followUpDate} at {f.followUpTime || '11:00 AM'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      Assigned: <strong className="text-slate-700">{f.assignedUser || 'Sales Team'}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleComplete(f)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                      f.status === 'Completed'
                        ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                        : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{f.status === 'Completed' ? 'Mark as Pending' : 'Mark Completed'}</span>
                  </button>
                </div>
              </div>
            );
          })}
          {currentList.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No follow-ups recorded in this category.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Follow-up */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Schedule New Follow-up</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Customer *</label>
                <select
                  required
                  value={newFollowUp.customerId}
                  onChange={(e) => {
                    const c = customers.find((cust) => cust.id === e.target.value);
                    setNewFollowUp({
                      ...newFollowUp,
                      customerId: e.target.value,
                      customerName: c ? c.name : e.target.value,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Choose Existing Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.companyName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Purpose / Agenda *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discuss bulk pricing quote / payment check"
                  value={newFollowUp.purpose}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, purpose: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newFollowUp.followUpDate}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, followUpDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={newFollowUp.followUpTime}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, followUpTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Assigned Representative</label>
                <input
                  type="text"
                  value={newFollowUp.assignedUser}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, assignedUser: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or expectations..."
                  value={newFollowUp.notes}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
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
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
