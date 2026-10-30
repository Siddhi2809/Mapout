'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { FollowUp, Customer, Lead, Quotation } from '@/types/erp';
import {
  Calendar,
  Clock,
  PhoneCall,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  UserCheck,
  Building2,
  Users,
  FileCheck,
  Send,
  MessageSquare,
  Mail,
  Video,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Phone,
  Check,
  AlertCircle,
  RotateCcw,
  Tag,
  ExternalLink,
  MapPin,
} from 'lucide-react';

export default function FollowUpsPage() {
  const {
    followUps,
    customers,
    leads,
    quotations,
    createFollowUpFull,
    updateFollowUpStatusFull,
    updateQuotationStatus,
    activeRole,
  } = useERP();

  // Navigation Tabs: 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'CONVERTED' | 'LEADS' | 'ALL'
  const [activeTab, setActiveTab] = useState<'TODAY' | 'UPCOMING' | 'OVERDUE' | 'CONVERTED' | 'LEADS' | 'ALL'>('TODAY');

  // Filters
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'NEXT_WEEK' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [salespersonFilter, setSalespersonFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [targetFollowUp, setTargetFollowUp] = useState<FollowUp | null>(null);

  // Form State for New Follow-up
  const [formEntityType, setFormEntityType] = useState<'Customer' | 'Lead'>('Customer');
  const [formEntityId, setFormEntityId] = useState('');
  const [formQuotationId, setFormQuotationId] = useState('');
  const [formFollowUpDate, setFormFollowUpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formFollowUpTime, setFormFollowUpTime] = useState('11:00 AM');
  const [formFollowUpType, setFormFollowUpType] = useState<'Call' | 'WhatsApp' | 'Email' | 'Meeting' | 'Other'>('Call');
  const [formSalesperson, setFormSalesperson] = useState('Rajesh Kumar');
  const [formNotes, setFormNotes] = useState('');
  const [formNextDate, setFormNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [formStatus, setFormStatus] = useState<'Pending' | 'Completed'>('Pending');

  // Response Form State
  const [responseNotes, setResponseNotes] = useState('');
  const [responseOutcome, setResponseOutcome] = useState<
    'Requested Price Change' | 'Accepted' | 'Rejected' | 'Asked for Time' | 'Wants More Features' | 'Other'
  >('Asked for Time');
  const [responseNextDate, setResponseNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [responseMarkQuote, setResponseMarkQuote] = useState(true);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper date calculations
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const getDayOffsetStr = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const endOfThisWeek = useMemo(() => getDayOffsetStr(7), []);
  const endOfNextWeek = useMemo(() => getDayOffsetStr(14), []);

  const getFollowUpCity = (f: FollowUp): string => {
    if ((f as any).city) return (f as any).city;
    if (f.leadOrCustomerId) {
      const cust = customers.find(
        (c) => c.id === f.leadOrCustomerId || (c.customerCode && c.customerCode === f.leadOrCustomerId)
      );
      if (cust?.city) return cust.city;
      const lead = leads.find((l) => l.id === f.leadOrCustomerId || l.leadNumber === f.leadOrCustomerId);
      if (lead?.city) return lead.city;
    }
    if (f.customerNumber) {
      const cust = customers.find((c) => c.customerCode === f.customerNumber);
      if (cust?.city) return cust.city;
    }
    if (f.companyName) {
      const cust = customers.find((c) => (c.companyName || '').toLowerCase() === f.companyName?.toLowerCase());
      if (cust?.city) return cust.city;
      const lead = leads.find((l) => (l.companyName || '').toLowerCase() === f.companyName?.toLowerCase());
      if (lead?.city) return lead.city;
    }
    if (f.customerName || f.leadOrCustomerName) {
      const targetName = (f.customerName || f.leadOrCustomerName || '').toLowerCase();
      const cust = customers.find((c) => (c.name || '').toLowerCase() === targetName);
      if (cust?.city) return cust.city;
      const lead = leads.find((l) => (l.leadName || l.contactPerson || '').toLowerCase() === targetName);
      if (lead?.city) return lead.city;
    }
    return '';
  };

  // Combine followUps with leads marked as Follow-up or Contacted
  const combinedFollowUps = useMemo(() => {
    const list = [...followUps];
    const existingLeadIds = new Set(
      followUps.filter((f) => f.type === 'Lead').map((f) => f.leadOrCustomerId)
    );

    leads.forEach((l) => {
      const isEligible = l.status === 'Follow-up' || l.status === 'Contacted';
      if (isEligible && !existingLeadIds.has(l.id)) {
        const leadDisplay = l.companyName || l.leadName || 'Lead';
        list.push({
          id: `fol-lead-${l.id}`,
          followUpNumber: `FL-${l.leadNumber || l.id}`,
          leadOrCustomerId: l.id,
          leadOrCustomerName: leadDisplay,
          customerName: leadDisplay,
          companyName: l.companyName,
          contactPerson: l.contactPerson || l.leadName,
          mobile: l.mobile,
          email: l.email,
          type: 'Lead',
          followUpDate: l.nextFollowUpDate || todayStr,
          followUpTime: '11:00 AM',
          followUpType: 'Call',
          purpose: l.status === 'Contacted' ? 'Contacted Lead Discussion' : 'Follow-up Call Scheduled',
          notes: l.notes || `Lead Status: ${l.status}. Requirement: ${l.requirement || 'OBD Products'}`,
          status: 'Pending',
          assignedUser: l.salesperson || l.assignedUser || 'Sales Person',
          salesperson: l.salesperson || l.assignedUser || 'Sales Person',
          createdAt: l.createdAt || todayStr,
        });
      }
    });

    return list;
  }, [followUps, leads, todayStr]);

  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    customers.forEach((c) => {
      if (c.city && c.city.trim()) citySet.add(c.city.trim());
    });
    leads.forEach((l) => {
      if (l.city && l.city.trim()) citySet.add(l.city.trim());
    });
    combinedFollowUps.forEach((f) => {
      const c = getFollowUpCity(f);
      if (c && c.trim()) citySet.add(c.trim());
    });
    return Array.from(citySet).sort();
  }, [customers, leads, combinedFollowUps]);

  // Filtered Follow-ups
  const filteredFollowUps = useMemo(() => {
    return combinedFollowUps.filter((f) => {
      const fDate = (f.followUpDate || f.createdAt || '').split('T')[0];
      const isPast = fDate < todayStr;
      const isToday = fDate === todayStr;
      const isFuture = fDate > todayStr;
      const isConverted = f.type === 'Customer' || !!f.convertedCustomerId || !!f.customerNumber;
      const isLead = f.type === 'Lead' && !f.convertedCustomerId;

      // 1. Tab Filtering
      if (activeTab === 'TODAY' && !isToday) return false;
      if (activeTab === 'UPCOMING' && !isFuture) return false;
      if (activeTab === 'OVERDUE' && (!isPast || f.status === 'Completed')) return false;
      if (activeTab === 'CONVERTED' && !isConverted) return false;
      if (activeTab === 'LEADS' && !isLead) return false;

      // 2. Date Preset Filtering
      if (datePreset === 'TODAY' && !isToday) return false;
      if (datePreset === 'TOMORROW' && fDate !== tomorrowStr) return false;
      if (datePreset === 'THIS_WEEK' && (fDate < todayStr || fDate > endOfThisWeek)) return false;
      if (datePreset === 'NEXT_WEEK' && (fDate <= endOfThisWeek || fDate > endOfNextWeek)) return false;
      if (datePreset === 'CUSTOM' && customDate && fDate !== customDate) return false;

      // 3. Date Range Filtering (From & To)
      if (startDate && fDate < startDate) return false;
      if (endDate && fDate > endDate) return false;

      // 4. City Filter
      if (cityFilter !== 'ALL') {
        const fCity = getFollowUpCity(f).toLowerCase();
        const fNotes = (f.notes || '').toLowerCase();
        const matchCity = fCity === cityFilter.toLowerCase() || fNotes.includes(cityFilter.toLowerCase());
        if (!matchCity) return false;
      }

      // 5. Follow-up Type
      if (typeFilter !== 'ALL' && (f.followUpType || 'Call') !== typeFilter) return false;

      // 6. Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Overdue') {
          if (!isPast || f.status === 'Completed') return false;
        } else if (f.status !== statusFilter) {
          return false;
        }
      }

      // 7. Salesperson Filter
      if (salespersonFilter !== 'ALL') {
        const sp = f.salesperson || f.assignedUser || '';
        if (sp !== salespersonFilter) return false;
      }

      // 8. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCust = (f.customerName || '').toLowerCase().includes(q);
        const matchComp = (f.companyName || '').toLowerCase().includes(q);
        const matchCNum = (f.customerNumber || '').toLowerCase().includes(q);
        const matchQNum = (f.quotationNumber || '').toLowerCase().includes(q);
        const matchMob = (f.mobile || '').toLowerCase().includes(q);
        const matchNotes = (f.notes || '').toLowerCase().includes(q);
        return matchCust || matchComp || matchCNum || matchQNum || matchMob || matchNotes;
      }

      return true;
    });
  }, [
    combinedFollowUps,
    activeTab,
    datePreset,
    customDate,
    startDate,
    endDate,
    cityFilter,
    typeFilter,
    statusFilter,
    salespersonFilter,
    searchQuery,
    todayStr,
    tomorrowStr,
    endOfThisWeek,
    endOfNextWeek,
    customers,
    leads,
  ]);

  // Metric Counts
  const metrics = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;
    let convertedCount = 0;
    let leadsCount = 0;

    combinedFollowUps.forEach((f) => {
      const fDate = f.followUpDate || '';
      const isPast = fDate < todayStr;
      const isToday = fDate === todayStr;
      const isFuture = fDate > todayStr;
      const isConverted = f.type === 'Customer' || !!f.convertedCustomerId || !!f.customerNumber;
      const isLead = f.type === 'Lead' && !f.convertedCustomerId;

      if (isToday) todayCount++;
      if (isFuture) upcomingCount++;
      if (isPast && f.status !== 'Completed') overdueCount++;
      if (isConverted) convertedCount++;
      if (isLead) leadsCount++;
    });

    return { todayCount, upcomingCount, overdueCount, convertedCount, leadsCount, total: combinedFollowUps.length };
  }, [combinedFollowUps, todayStr]);

  // Unique salespersons list for filter
  const salespersons = useMemo(() => {
    const set = new Set<string>();
    combinedFollowUps.forEach((f) => {
      if (f.salesperson) set.add(f.salesperson);
      if (f.assignedUser) set.add(f.assignedUser);
    });
    return Array.from(set);
  }, [combinedFollowUps]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormEntityType('Customer');
    setFormEntityId(customers[0]?.id || '');
    setFormQuotationId('');
    setFormFollowUpDate(new Date().toISOString().split('T')[0]);
    setFormFollowUpTime('11:00 AM');
    setFormFollowUpType('Call');
    setFormSalesperson(activeRole === 'ADMIN' ? 'Administrator' : 'Rajesh Kumar');
    setFormNotes('');
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setFormNextDate(d.toISOString().split('T')[0]);
    setFormStatus('Pending');
    setIsCreateModalOpen(true);
  };

  // Submit Create Follow-up
  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();

    let customerName = 'Unknown';
    let customerNumber = '';
    let companyName = '';
    let contactPerson = '';
    let mobile = '';
    let email = '';

    if (formEntityType === 'Customer') {
      const c = customers.find((cust) => cust.id === formEntityId);
      if (c) {
        customerName = c.name || c.companyName || 'Unknown';
        customerNumber = c.customerNumber || c.customerCode || 'CUS-101';
        companyName = c.companyName || c.name;
        contactPerson = c.contactPerson || c.name;
        mobile = c.mobile || '';
        email = c.email || '';
      }
    } else {
      const l = leads.find((lead) => lead.id === formEntityId);
      if (l) {
        customerName = l.leadName || l.companyName || 'Unknown Lead';
        companyName = l.companyName || l.leadName || '';
        contactPerson = l.contactPerson || l.leadName || '';
        mobile = l.mobile || '';
        email = l.email || '';
      }
    }

    const linkedQuote = quotations.find((q) => q.id === formQuotationId);

    const res = createFollowUpFull({
      type: formEntityType,
      leadOrCustomerId: formEntityId,
      leadOrCustomerName: customerName || companyName || 'Customer',
      customerName,
      customerNumber,
      companyName,
      contactPerson,
      mobile,
      email,
      quotationId: linkedQuote?.id,
      quotationNumber: linkedQuote?.quotationNumber,
      followUpType: formFollowUpType,
      purpose: linkedQuote ? `Quotation Follow-up: ${linkedQuote.quotationNumber}` : `Sales Follow-up with ${companyName || customerName}`,
      followUpDate: formFollowUpDate,
      followUpTime: formFollowUpTime,
      nextFollowUpDate: formNextDate,
      status: formStatus,
      notes: formNotes,
      assignedUser: formSalesperson,
      salesperson: formSalesperson,
    });

    if (res.success) {
      if (linkedQuote && linkedQuote.status === 'Sent to Customer') {
        updateQuotationStatus(linkedQuote.id, 'Follow-up Required');
      }
      showToast('success', `✓ Follow-up scheduled for ${companyName || customerName}.`);
      setIsCreateModalOpen(false);
    } else {
      showToast('error', res.message || 'Failed to save follow-up.');
    }
  };

  // Open Quick Response Modal
  const handleOpenResponseModal = (f: FollowUp) => {
    setTargetFollowUp(f);
    setResponseNotes(f.notes || '');
    setResponseOutcome('Asked for Time');
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setResponseNextDate(d.toISOString().split('T')[0]);
    setIsResponseModalOpen(true);
  };

  // Submit Response
  const handleSaveResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFollowUp) return;

    const fullNotes = `[${responseOutcome}] ${responseNotes}`.trim();

    // Mark current follow-up completed
    updateFollowUpStatusFull(targetFollowUp.id, 'Completed');

    // If quotation linked and responseMarkQuote is checked, update quotation status
    if (targetFollowUp.quotationId && responseMarkQuote) {
      if (responseOutcome === 'Accepted') {
        updateQuotationStatus(targetFollowUp.quotationId, 'Customer Approved');
      } else if (responseOutcome === 'Rejected') {
        updateQuotationStatus(targetFollowUp.quotationId, 'Customer Rejected');
      } else {
        updateQuotationStatus(targetFollowUp.quotationId, 'Follow-up Required');
      }
    }

    // Schedule next follow-up if date is set and not accepted/rejected
    if (responseNextDate && responseOutcome !== 'Accepted' && responseOutcome !== 'Rejected') {
      createFollowUpFull({
        type: targetFollowUp.type,
        leadOrCustomerId: targetFollowUp.leadOrCustomerId,
        leadOrCustomerName: targetFollowUp.leadOrCustomerName || targetFollowUp.customerName || targetFollowUp.companyName || 'Contact',
        customerName: targetFollowUp.customerName,
        customerNumber: targetFollowUp.customerNumber,
        companyName: targetFollowUp.companyName,
        contactPerson: targetFollowUp.contactPerson,
        mobile: targetFollowUp.mobile,
        email: targetFollowUp.email,
        quotationId: targetFollowUp.quotationId,
        quotationNumber: targetFollowUp.quotationNumber,
        followUpType: targetFollowUp.followUpType,
        purpose: `Follow-up after: ${responseOutcome}`,
        followUpDate: responseNextDate,
        followUpTime: '11:00 AM',
        status: 'Pending',
        notes: `Previous outcome: ${responseOutcome}. Notes: ${responseNotes}`,
        assignedUser: targetFollowUp.assignedUser || targetFollowUp.salesperson || 'Unassigned',
        salesperson: targetFollowUp.salesperson || targetFollowUp.assignedUser || 'Unassigned',
      });
    }

    showToast(
      'success',
      `✓ Follow-up marked Completed! Outcome: "${responseOutcome}". Quotation and next steps updated.`
    );
    setIsResponseModalOpen(false);
    setTargetFollowUp(null);
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'WhatsApp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Email':
        return <Mail className="w-3.5 h-3.5 text-blue-600" />;
      case 'Meeting':
        return <Video className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <PhoneCall className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  return (
    <DashboardLayout roleTitle="Sales Management" roleBadge="Sales Representative" navItems={SALES_NAV}>
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`fixed top-20 right-8 z-50 px-4 py-3 rounded-xl text-white font-semibold text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
              toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.message}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Follow-up Management Dashboard</h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Track date-wise interactions, record client responses, and manage follow-ups for Converted Customers & Active Leads.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/sales/quotations"
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <FileCheck className="w-4 h-4" />
              <span>Quotations →</span>
            </Link>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Schedule Follow-up
            </button>
          </div>
        </div>

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {/* Today's Follow-ups */}
          <button
            onClick={() => {
              setActiveTab('TODAY');
              setDatePreset('ALL');
            }}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === 'TODAY'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider">Today&apos;s Follow-ups</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black mt-1.5">{metrics.todayCount}</div>
            <div className={`text-[10px] mt-1 ${activeTab === 'TODAY' ? 'text-blue-100' : 'text-slate-500'}`}>
              Due today
            </div>
          </button>

          {/* Overdue */}
          <button
            onClick={() => {
              setActiveTab('OVERDUE');
              setDatePreset('ALL');
            }}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === 'OVERDUE'
                ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                : 'bg-white border-rose-200 hover:border-rose-400 text-slate-700 shadow-xs bg-rose-50/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-rose-700">Overdue Follow-ups</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black mt-1.5 text-rose-700">{metrics.overdueCount}</div>
            <div className={`text-[10px] mt-1 ${activeTab === 'OVERDUE' ? 'text-rose-100' : 'text-rose-600 font-semibold'}`}>
              Date passed, pending
            </div>
          </button>

          {/* Upcoming */}
          <button
            onClick={() => {
              setActiveTab('UPCOMING');
              setDatePreset('ALL');
            }}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === 'UPCOMING'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider">Upcoming</span>
              <Calendar className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black mt-1.5">{metrics.upcomingCount}</div>
            <div className={`text-[10px] mt-1 ${activeTab === 'UPCOMING' ? 'text-indigo-100' : 'text-slate-500'}`}>
              Future scheduled
            </div>
          </button>

          {/* Converted Customers */}
          <button
            onClick={() => {
              setActiveTab('CONVERTED');
              setDatePreset('ALL');
            }}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === 'CONVERTED'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300'
                : 'bg-white border-purple-200 hover:border-purple-300 text-slate-700 shadow-xs bg-purple-50/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-purple-800">Converted Customers</span>
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black mt-1.5 text-purple-800">{metrics.convertedCount}</div>
            <div className={`text-[10px] mt-1 ${activeTab === 'CONVERTED' ? 'text-purple-100' : 'text-purple-700 font-semibold'}`}>
              With Customer #
            </div>
          </button>

          {/* Active Leads */}
          <button
            onClick={() => {
              setActiveTab('LEADS');
              setDatePreset('ALL');
            }}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === 'LEADS'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                : 'bg-white border-amber-200 hover:border-amber-300 text-slate-700 shadow-xs bg-amber-50/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-amber-800">Active Leads</span>
              <UserCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black mt-1.5 text-amber-800">{metrics.leadsCount}</div>
            <div className={`text-[10px] mt-1 ${activeTab === 'LEADS' ? 'text-amber-100' : 'text-amber-700 font-semibold'}`}>
              Non-converted leads
            </div>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          {/* Top row: Search + Date Range + Presets */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Customer, CUS-101, Company, QT-101, Mobile..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (datePreset !== 'CUSTOM' && e.target.value) setDatePreset('ALL');
                }}
                className="bg-transparent text-slate-800 font-medium focus:outline-none"
                title="From Follow-up Date"
              />
              <span className="text-slate-400 font-medium">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (datePreset !== 'CUSTOM' && e.target.value) setDatePreset('ALL');
                }}
                className="bg-transparent text-slate-800 font-medium focus:outline-none"
                title="To Follow-up Date"
              />
            </div>

            {/* Date Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-bold mr-1">Presets:</span>
              {(['ALL', 'TODAY', 'TOMORROW', 'THIS_WEEK', 'NEXT_WEEK', 'CUSTOM'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setDatePreset(preset);
                    if (preset !== 'CUSTOM' && preset !== 'ALL') {
                      setStartDate('');
                      setEndDate('');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                    datePreset === preset
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {preset === 'ALL'
                    ? 'All'
                    : preset === 'TODAY'
                    ? 'Today'
                    : preset === 'TOMORROW'
                    ? 'Tomorrow'
                    : preset === 'THIS_WEEK'
                    ? 'This Week'
                    : preset === 'NEXT_WEEK'
                    ? 'Next Week'
                    : 'Custom'}
                </button>
              ))}

              {datePreset === 'CUSTOM' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
              )}
            </div>
          </div>

          {/* Secondary Filters row */}
          <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Type:
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Types</option>
              <option value="Call">Call</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
              <option value="Meeting">Meeting</option>
              <option value="Other">Other</option>
            </select>

            <div className="flex items-center gap-1.5 text-slate-600 font-semibold ml-1">
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <div className="flex items-center gap-1.5 text-slate-600 font-semibold ml-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" /> City:
            </div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Cities ({availableCities.length})</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {salespersons.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold ml-1">
                  <span>Salesperson:</span>
                </div>
                <select
                  value={salespersonFilter}
                  onChange={(e) => setSalespersonFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="ALL">All Salespersons</option>
                  {salespersons.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </>
            )}

            {(startDate || endDate || cityFilter !== 'ALL' || datePreset !== 'ALL' || customDate || typeFilter !== 'ALL' || statusFilter !== 'ALL' || salespersonFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setCityFilter('ALL');
                  setDatePreset('ALL');
                  setCustomDate('');
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                  setSalespersonFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer text-xs ml-1"
                title="Clear all filters"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}

            <div className="ml-auto text-[11px] text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{filteredFollowUps.length}</strong> follow-ups
            </div>
          </div>
        </div>

        {/* Follow-ups Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                  <th className="p-3.5">Category & Customer</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Quotation Ref</th>
                  <th className="p-3.5">Follow-up Date & Time</th>
                  <th className="p-3.5">Type & Purpose</th>
                  <th className="p-3.5">Customer Response / Notes</th>
                  <th className="p-3.5">Next Date</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFollowUps.map((f) => {
                  const isConverted = f.type === 'Customer' || !!f.convertedCustomerId || !!f.customerNumber;
                  const fDate = f.followUpDate || '';
                  const isOverdue = fDate < todayStr && f.status !== 'Completed';
                  const isToday = fDate === todayStr;

                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 max-w-[200px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          {isConverted ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              Converted Customer
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Active Lead
                            </span>
                          )}
                          {f.customerNumber && (
                            <span className="font-mono text-[10px] font-bold text-blue-700">
                              {f.customerNumber}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 truncate">
                          {f.companyName || f.customerName}
                        </div>
                        {f.companyName && f.customerName && f.companyName !== f.customerName && (
                          <div className="text-[10px] text-slate-500">{f.customerName}</div>
                        )}
                        {getFollowUpCity(f) && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{getFollowUpCity(f)}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-600">
                        {f.contactPerson && (
                          <div className="font-semibold text-slate-800">{f.contactPerson}</div>
                        )}
                        {f.mobile && (
                          <div className="font-mono text-[11px] text-blue-700">{f.mobile}</div>
                        )}
                        {f.email && <div className="text-[10px] text-slate-500">{f.email}</div>}
                      </td>

                      <td className="p-3.5">
                        {f.quotationNumber ? (
                          <Link
                            href="/sales/quotations"
                            className="font-mono text-purple-700 font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <span>{f.quotationNumber}</span>
                            <ExternalLink className="w-3 h-3 text-purple-400" />
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-1">
                          <span>{f.followUpDate}</span>
                          {isToday && (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded text-[9px] font-bold">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">{f.followUpTime || '11:00 AM'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Rep: <strong>{f.salesperson || f.assignedUser || 'Sales Person'}</strong>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          {getTypeIcon(f.followUpType)}
                          <span>{f.followUpType || 'Call'}</span>
                        </div>
                        {f.purpose && (
                          <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{f.purpose}</div>
                        )}
                      </td>

                      <td className="p-3.5 max-w-[220px]">
                        <div className="text-slate-700 text-xs font-medium line-clamp-2">
                          {f.notes || <span className="text-slate-400 italic">No notes recorded yet</span>}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-600">
                        {f.nextFollowUpDate || '—'}
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            f.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : isOverdue
                              ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                              : isToday
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : f.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {f.status !== 'Completed' ? (
                            <button
                              onClick={() => handleOpenResponseModal(f)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Record Customer Response & Outcome"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Record Outcome</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenResponseModal(f)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] cursor-pointer"
                            >
                              Update
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredFollowUps.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500 text-xs font-medium">
                      No follow-ups found for the selected tab and filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SCHEDULE NEW FOLLOW-UP MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Schedule Follow-up</h3>
                    <p className="text-[11px] text-slate-500">Create follow-up for Converted Customer or Lead</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveFollowUp} className="p-6 space-y-4 text-xs">
                {/* Category Selector: Customer vs Lead */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Follow-up Target:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                    <input
                      type="radio"
                      name="entityType"
                      checked={formEntityType === 'Customer'}
                      onChange={() => {
                        setFormEntityType('Customer');
                        setFormEntityId(customers[0]?.id || '');
                      }}
                    />
                    <span>Converted Customer</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                    <input
                      type="radio"
                      name="entityType"
                      checked={formEntityType === 'Lead'}
                      onChange={() => {
                        setFormEntityType('Lead');
                        setFormEntityId(leads[0]?.id || '');
                      }}
                    />
                    <span>Active Lead</span>
                  </label>
                </div>

                {/* Target Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select {formEntityType === 'Customer' ? 'Customer' : 'Lead'} *
                  </label>
                  <select
                    value={formEntityId}
                    onChange={(e) => setFormEntityId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                    required
                  >
                    {formEntityType === 'Customer'
                      ? customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.companyName || c.name} ({c.customerNumber || c.customerCode || 'CUS-101'}) - {c.mobile || 'No Mobile'}
                          </option>
                        ))
                      : leads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.companyName || l.leadName} ({l.mobile || 'No Mobile'}) - {l.status}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Optional Linked Quotation */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Link with Quotation <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={formQuotationId}
                    onChange={(e) => setFormQuotationId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                  >
                    <option value="">-- No Quotation Linked --</option>
                    {quotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quotationNumber} - {q.customerName} (₹{q.totalAmount.toLocaleString('en-IN')}) [{q.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Follow-up Date *</label>
                    <input
                      type="date"
                      value={formFollowUpDate}
                      onChange={(e) => setFormFollowUpDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 11:00 AM"
                      value={formFollowUpTime}
                      onChange={(e) => setFormFollowUpTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Follow-up Type</label>
                    <select
                      value={formFollowUpType}
                      onChange={(e) => setFormFollowUpType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Call">Call</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Salesperson</label>
                    <input
                      type="text"
                      value={formSalesperson}
                      onChange={(e) => setFormSalesperson(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Follow-up Notes / Agenda</label>
                  <textarea
                    rows={3}
                    placeholder="Describe discussion agenda, quotation negotiation, customer request..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={formNextDate}
                    onChange={(e) => setFormNextDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Follow-up</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RECORD OUTCOME & CUSTOMER RESPONSE MODAL */}
        {isResponseModalOpen && targetFollowUp && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Record Customer Response & Outcome</h3>
                    <p className="text-[11px] text-slate-500">
                      {targetFollowUp.companyName || targetFollowUp.customerName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsResponseModalOpen(false)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveResponse} className="p-6 space-y-4 text-xs">
                {/* Target info card */}
                <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-3 flex items-center justify-between text-slate-800">
                  <div>
                    <span className="font-bold block text-slate-900">
                      {targetFollowUp.companyName || targetFollowUp.customerName}
                    </span>
                    <span className="text-[11px] text-slate-600">
                      {targetFollowUp.contactPerson || 'Contact'} • {targetFollowUp.mobile || 'No Mobile'}
                    </span>
                  </div>
                  {targetFollowUp.quotationNumber && (
                    <span className="font-mono text-xs font-bold text-purple-700 bg-white px-2 py-1 rounded border border-purple-200">
                      {targetFollowUp.quotationNumber}
                    </span>
                  )}
                </div>

                {/* Response Outcome Chips */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-2">
                    Customer Response Outcome *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'Accepted', label: '✓ Customer Accepted', color: 'emerald' },
                      { key: 'Requested Price Change', label: 'Requested Price Change', color: 'blue' },
                      { key: 'Asked for Time', label: 'Asked for Time / Thinking', color: 'amber' },
                      { key: 'Wants More Features', label: 'Wants More Features / Spec', color: 'purple' },
                      { key: 'Rejected', label: '✗ Customer Rejected', color: 'rose' },
                      { key: 'Other', label: 'Other / General Query', color: 'slate' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setResponseOutcome(item.key as any)}
                        className={`p-2.5 rounded-xl border text-left font-bold text-[11px] transition cursor-pointer ${
                          responseOutcome === item.key
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Customer Feedback & Discussion Details *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter what the customer specifically requested, agreed terms, next steps..."
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-purple-600 resize-none"
                    required
                  />
                </div>

                {targetFollowUp.quotationNumber && (
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="font-semibold text-purple-900">
                        Sync linked Quotation status ({targetFollowUp.quotationNumber})
                      </span>
                    </div>
                    <label className="flex items-center gap-1 font-bold text-purple-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={responseMarkQuote}
                        onChange={(e) => setResponseMarkQuote(e.target.checked)}
                      />
                      <span>Auto-Sync</span>
                    </label>
                  </div>
                )}

                {responseOutcome !== 'Accepted' && responseOutcome !== 'Rejected' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Schedule Next Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={responseNextDate}
                      onChange={(e) => setResponseNextDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsResponseModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Response & Complete</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
