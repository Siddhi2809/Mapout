'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  Plus,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Building2,
  UserCheck,
} from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  meetingType: 'Customer' | 'Supplier' | 'Internal';
  participantId?: string;
  participantName: string;
  assignedUser: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  location?: string;
  meetLink?: string;
  notes?: string;
}

export default function AdminMeetingsPage() {
  const { customers, suppliers } = useERP();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formState, setFormState] = useState({
    title: '',
    meetingType: 'Customer' as 'Customer' | 'Supplier' | 'Internal',
    participantName: '',
    assignedUser: 'Sales Manager',
    date: todayStr,
    time: '02:00 PM',
    status: 'Scheduled' as 'Scheduled' | 'Completed' | 'Cancelled',
    location: '',
    meetLink: '',
    notes: '',
  });

  // Fetch meetings from API
  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMeetings(data.data);
      } else {
        // Fallback default sample meetings if table is new
        setMeetings([
          {
            id: 'meet_01',
            title: 'Bulk Pricing & Q4 Supply Agreement',
            meetingType: 'Customer',
            participantName: 'Apex Electronics Ltd',
            assignedUser: 'Sales Manager',
            date: todayStr,
            time: '02:30 PM',
            status: 'Scheduled',
            meetLink: 'https://meet.google.com/map-out-apex',
            notes: 'Discussion on annual connector requirements and volume rebate scheme.',
          },
          {
            id: 'meet_02',
            title: 'Copper Rod & Raw Material Delivery Timeline',
            meetingType: 'Supplier',
            participantName: 'Bharat Copper Ind',
            assignedUser: 'Raw Material Head',
            date: todayStr,
            time: '04:00 PM',
            status: 'Scheduled',
            location: 'Factory Conference Room A',
            notes: 'Confirm dispatch of PO-2026-089 and GST e-way bill verification.',
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.participantName) return;

    if (editingMeeting) {
      // Update
      const updated = { ...editingMeeting, ...formState };
      setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      await fetch('/api/meetings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } else {
      // Create
      const newM: Meeting = {
        id: `meet_${Date.now()}`,
        ...formState,
      };
      setMeetings((prev) => [newM, ...prev]);
      await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newM),
      });
    }

    setShowModal(false);
    setEditingMeeting(null);
    setFormState({
      title: '',
      meetingType: 'Customer',
      participantName: '',
      assignedUser: 'Sales Manager',
      date: todayStr,
      time: '02:00 PM',
      status: 'Scheduled',
      location: '',
      meetLink: '',
      notes: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/meetings?id=${id}`, { method: 'DELETE' });
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const matchSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.assignedUser.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter ? m.meetingType === typeFilter : true;
      const matchStatus = statusFilter ? m.status === statusFilter : true;

      return matchSearch && matchType && matchStatus;
    });
  }, [meetings, searchQuery, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Meetings & Calendar</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {meetings.length} Scheduled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized calendar: schedule, delegate, and manage customer check-ins and supplier vendor reviews.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingMeeting(null);
            setFormState({
              title: '',
              meetingType: 'Customer',
              participantName: '',
              assignedUser: 'Sales Manager',
              date: todayStr,
              time: '02:00 PM',
              status: 'Scheduled',
              location: '',
              meetLink: '',
              notes: '',
            });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Schedule New Meeting
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search meetings by title, client, attendee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Meeting Types</option>
              <option value="Customer">Customer Meetings</option>
              <option value="Supplier">Supplier Reviews</option>
              <option value="Internal">Internal Management</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meetings Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeetings.map((m) => (
          <div
            key={m.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    m.meetingType === 'Customer'
                      ? 'bg-blue-100 text-blue-800'
                      : m.meetingType === 'Supplier'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {m.meetingType} Meeting
                </span>

                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    m.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : m.status === 'Cancelled'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {m.status}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{m.title}</h3>

              <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{m.participantName}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {m.date} at {m.time}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Assigned: <strong>{m.assignedUser}</strong></span>
              </div>

              {m.notes && (
                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                  &quot;{m.notes}&quot;
                </p>
              )}
            </div>

            {/* Card Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                {m.meetLink ? (
                  <a
                    href={m.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <Video className="w-3.5 h-3.5" /> Join Meet
                  </a>
                ) : m.location ? (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {m.location}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingMeeting(m);
                    setFormState({
                      title: m.title,
                      meetingType: m.meetingType,
                      participantName: m.participantName,
                      assignedUser: m.assignedUser,
                      date: m.date,
                      time: m.time,
                      status: m.status,
                      location: m.location || '',
                      meetLink: m.meetLink || '',
                      notes: m.notes || '',
                    });
                    setShowModal(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredMeetings.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-300">
            No meetings found for the selected filter.
          </div>
        )}
      </div>

      {/* Modal: Schedule / Edit Meeting */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingMeeting ? 'Edit Scheduled Meeting' : 'Schedule New Meeting'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Contract Negotiation / Product Demo"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Meeting Type</label>
                  <select
                    value={formState.meetingType}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        meetingType: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Internal">Internal Team</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Participant / Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Electronics Ltd"
                    value={formState.participantName}
                    onChange={(e) => setFormState({ ...formState, participantName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formState.date}
                    onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={formState.time}
                    onChange={(e) => setFormState({ ...formState, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Assigned Employee</label>
                  <input
                    type="text"
                    value={formState.assignedUser}
                    onChange={(e) => setFormState({ ...formState, assignedUser: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Google Meet Link</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={formState.meetLink}
                    onChange={(e) => setFormState({ ...formState, meetLink: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Physical Location</label>
                  <input
                    type="text"
                    placeholder="Conference Room B / Factory"
                    value={formState.location}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Agenda / Meeting Notes</label>
                <textarea
                  rows={2}
                  placeholder="Discussion points, preparation required..."
                  value={formState.notes}
                  onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm"
                >
                  {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
