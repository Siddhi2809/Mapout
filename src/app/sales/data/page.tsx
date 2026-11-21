'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { Lead, LeadStatus, ProductMaster } from '@/types/erp';
import {
  Database,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Building2,
  Edit2,
  PhoneCall,
  Plus,
  Download,
  Share2,
  Send,
  MessageSquare,
  Package,
  Image as ImageIcon,
  DollarSign,
} from 'lucide-react';
import { exportLeadsToExcel } from '@/lib/leadExcel';

const STATUS_OPTIONS: LeadStatus[] = [
  'Contacted',
  'Interested',
  'Follow-up',
  'Send Quotation',
  'Quotation Sent',
  'Converted',
  'Lost',
  'Not Contacted',
];

// Normalize brand names to unify casing and variations (e.g., 'Ashok Leyland', 'ashok leyland')
export function normalizeBrand(val?: string | null): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (/ashok[\s_-]?leyland/i.test(trimmed)) {
    return 'Ashok Leyland';
  }
  return trimmed;
}

export default function SalesDataPage() {
  const {
    leads,
    products,
    updateLeadFull,
    convertLeadToCustomer,
    refreshLeadsFromDB,
    refreshProductsFromDB,
    scopedSalesperson,
  } = useERP();

  useEffect(() => {
    refreshLeadsFromDB();
    if (refreshProductsFromDB) refreshProductsFromDB();
  }, [refreshLeadsFromDB, refreshProductsFromDB]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  // Modal States
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Catalogue Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLead, setShareLead] = useState<Lead | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductMaster | null>(null);
  const [shareText, setShareText] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered Products for Typeahead in Share Modal
  const searchedProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 15);
    const q = productSearch.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [products, productSearch]);

  const handleOpenShareModal = (lead: Lead) => {
    setShareLead(lead);
    // Auto-prefill if lead already has an interested product or requirement
    const matchingProd = products.find(
      (p) =>
        (lead.interestedProductId && p.id === lead.interestedProductId) ||
        (lead.requirement && p.name.toLowerCase().includes(lead.requirement.toLowerCase())) ||
        (lead.interestedProductName && p.name.toLowerCase().includes(lead.interestedProductName.toLowerCase()))
    );
    if (matchingProd) {
      setSelectedProduct(matchingProd);
      setProductSearch(matchingProd.name);
    } else {
      setSelectedProduct(null);
      setProductSearch('');
    }
    setShareText(
      `Hello ${lead.contactPerson || lead.companyName || 'Sir/Madam'},\n\nThank you for showing interest in our solutions. Please find the product details and specifications for your review.\n\nLooking forward to assisting you!`
    );
    setIsShareModalOpen(true);
  };

  const handleSendWhatsApp = () => {
    if (!shareLead || !selectedProduct) return;
    const phone = (shareLead.mobile || '').replace(/[^0-9]/g, '');
    if (!phone) {
      alert('This lead does not have a valid mobile phone number.');
      return;
    }

    // Format WhatsApp message
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
    let msg = `${shareText.trim()}\n\n`;
    msg += `*${selectedProduct.name}*\n`;
    if (selectedProduct.brand) msg += `Brand: ${selectedProduct.brand}\n`;
    if (selectedProduct.sellingPrice) msg += `Price: ₹${Number(selectedProduct.sellingPrice).toLocaleString('en-IN')}\n`;
    if (selectedProduct.description) msg += `\nDescription:\n${selectedProduct.description}\n`;
    if (selectedProduct.imageUrl) msg += `\nProduct Image / Catalogue:\n${selectedProduct.imageUrl}\n`;

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    showToast(`✓ Opened WhatsApp to send catalogue to ${shareLead.companyName || shareLead.contactPerson}`);
  };

  const handleSendEmail = async () => {
    if (!shareLead || !selectedProduct) return;
    if (!shareLead.email || !shareLead.email.includes('@')) {
      alert('This lead does not have a valid email address.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/catalogue/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: shareLead.email,
          recipientName: shareLead.contactPerson || shareLead.companyName,
          productName: selectedProduct.name,
          productDescription: selectedProduct.description,
          productImage: selectedProduct.imageUrl,
          customMessage: shareText,
          sellingPrice: selectedProduct.sellingPrice,
          brand: selectedProduct.brand,
          leadNumber: shareLead.leadNumber,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Catalogue email successfully sent to ${shareLead.email}`);
        setIsShareModalOpen(false);
      } else {
        alert(data.message || 'Failed to send email.');
      }
    } catch (err: any) {
      alert(`Error sending email: ${err?.message || 'Server error'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Filter leads: Exclude "Not Contacted" and initial raw "New" leads
  // Strictly display pipeline data (Contacted, Interested, Follow-up, Converted, etc.)
  const pipelineLeads = useMemo(() => {
    return leads.filter((l) => {
      // Exclude Not Contacted
      const st = (l.status || '').trim();
      if (!st || st === 'Not Contacted' || st === 'New') {
        return false;
      }
      return true;
    });
  }, [leads]);

  // Unique salespersons in pipeline
  const salespersons = useMemo(() => {
    const list = Array.from(new Set(pipelineLeads.map((l) => l.salesperson).filter(Boolean))) as string[];
    return list.sort();
  }, [pipelineLeads]);

  // Unique states in pipeline
  const states = useMemo(() => {
    const list = Array.from(new Set(pipelineLeads.map((l) => l.state?.trim()).filter(Boolean))) as string[];
    return list.sort();
  }, [pipelineLeads]);

  // Unique brands/requirements in pipeline (with unified brand names)
  const brands = useMemo(() => {
    const list = Array.from(
      new Set(
        pipelineLeads
          .map((l) => normalizeBrand(l.requirement || l.interestedProductName))
          .filter(Boolean)
      )
    ) as string[];
    return list.sort();
  }, [pipelineLeads]);

  // Status Counts for Quick Stat Pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: pipelineLeads.length,
      Contacted: 0,
      Interested: 0,
      'Follow-up': 0,
      Converted: 0,
      Other: 0,
    };
    pipelineLeads.forEach((l) => {
      const s = l.status;
      if (s === 'Contacted') counts['Contacted']++;
      else if (s === 'Interested') counts['Interested']++;
      else if (s === 'Follow-up') counts['Follow-up']++;
      else if (s === 'Converted') counts['Converted']++;
      else counts['Other']++;
    });
    return counts;
  }, [pipelineLeads]);

  // Filtered and Searched data
  const filteredData = useMemo(() => {
    return pipelineLeads.filter((l) => {
      // Status filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'OTHER') {
          if (['Contacted', 'Interested', 'Follow-up', 'Converted'].includes(l.status)) {
            return false;
          }
        } else if (l.status !== selectedStatus) {
          return false;
        }
      }

      // Salesperson filter
      if (selectedSalesperson !== 'ALL' && l.salesperson !== selectedSalesperson) {
        return false;
      }

      // State filter
      if (selectedState !== 'ALL') {
        const leadState = (l.state || '').trim();
        if (leadState !== selectedState) {
          return false;
        }
      }

      // Brand / Requirement filter (unified brand comparison)
      if (selectedBrand !== 'ALL') {
        const leadBrand = normalizeBrand(l.requirement || l.interestedProductName);
        if (leadBrand !== selectedBrand) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (l.leadNumber && l.leadNumber.toLowerCase().includes(q)) ||
          (l.companyName && l.companyName.toLowerCase().includes(q)) ||
          (l.leadName && l.leadName.toLowerCase().includes(q)) ||
          (l.contactPerson && l.contactPerson.toLowerCase().includes(q)) ||
          (l.mobile && l.mobile.toLowerCase().includes(q)) ||
          (l.alternateMobile && l.alternateMobile.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.city && l.city.toLowerCase().includes(q)) ||
          (l.state && l.state.toLowerCase().includes(q)) ||
          (l.requirement && l.requirement.toLowerCase().includes(q)) ||
          (l.salesperson && l.salesperson.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [pipelineLeads, selectedStatus, selectedSalesperson, searchQuery]);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setIsUpdatingStatus(leadId);
    try {
      await updateLeadFull(leadId, { status: newStatus });
      // If modal open for this lead, update it
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'Contacted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Interested':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Follow-up':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Converted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Lost':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Send Quotation':
      case 'Quotation Sent':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
          <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" /> {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Pipeline Data</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                {pipelineLeads.length} Active Records
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Qualified pipeline leads in active stages (Contacted, Interested, Follow-up, Quotations & Converted). Excludes &apos;Not Contacted&apos;.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                exportLeadsToExcel(filteredData, `Pipeline_Data_${selectedBrand !== 'ALL' ? selectedBrand + '_' : ''}${today}.xlsx`);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 shadow-sm transition-colors"
              title="Export current filtered records to Excel"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Export to Excel ({filteredData.length})
            </button>
            <button
              onClick={() => refreshLeadsFromDB()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              title="Refresh from Neon Database"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
              Refresh Data
            </button>
            <Link
              href="/sales/leads"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              Go to All Leads
            </Link>
          </div>
        </div>

        {/* Quick Filter Status Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedStatus === 'ALL'
                ? 'bg-blue-50 border-blue-300 shadow-sm ring-1 ring-blue-300'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="text-xs font-medium text-gray-500 uppercase">All Pipeline</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{statusCounts.ALL}</p>
          </button>

          <button
            onClick={() => setSelectedStatus('Contacted')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedStatus === 'Contacted'
                ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="text-xs font-medium text-blue-600 uppercase">Contacted</p>
            <p className="text-xl font-bold text-blue-900 mt-0.5">{statusCounts.Contacted}</p>
          </button>

          <button
            onClick={() => setSelectedStatus('Interested')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedStatus === 'Interested'
                ? 'bg-amber-50 border-amber-400 shadow-sm ring-1 ring-amber-400'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="text-xs font-medium text-amber-600 uppercase">Interested</p>
            <p className="text-xl font-bold text-amber-900 mt-0.5">{statusCounts.Interested}</p>
          </button>

          <button
            onClick={() => setSelectedStatus('Follow-up')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedStatus === 'Follow-up'
                ? 'bg-purple-50 border-purple-400 shadow-sm ring-1 ring-purple-400'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="text-xs font-medium text-purple-600 uppercase">Follow-up</p>
            <p className="text-xl font-bold text-purple-900 mt-0.5">{statusCounts['Follow-up']}</p>
          </button>

          <button
            onClick={() => setSelectedStatus('Converted')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedStatus === 'Converted'
                ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-1 ring-emerald-400'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="text-xs font-medium text-emerald-600 uppercase">Converted</p>
            <p className="text-xl font-bold text-emerald-900 mt-0.5">{statusCounts.Converted}</p>
          </button>

          <button
            onClick={() => setSelectedStatus('OTHER')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedStatus === 'OTHER'
                ? 'bg-gray-100 border-gray-400 shadow-sm ring-1 ring-gray-400'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="text-xs font-medium text-gray-600 uppercase">Other Active</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{statusCounts.Other}</p>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Company, Contact, Mobile, City, State, or Requirement..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Brand Filter */}
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold">Brand:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[170px]"
              >
                <option value="ALL">All Brands ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* State Filter */}
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold">State:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[150px]"
              >
                <option value="ALL">All States ({states.length})</option>
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Salesperson Filter */}
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <UserCheck className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold">Salesperson:</span>
              <select
                value={selectedSalesperson}
                onChange={(e) => setSelectedSalesperson(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[150px]"
              >
                <option value="ALL">All Salespersons</option>
                {salespersons.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {(selectedBrand !== 'ALL' || selectedState !== 'ALL' || selectedSalesperson !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedBrand('ALL');
                  setSelectedState('ALL');
                  setSelectedSalesperson('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline px-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Lead ID & Date</th>
                  <th className="py-3 px-4">Company & Contact</th>
                  <th className="py-3 px-4">Phone / Email</th>
                  <th className="py-3 px-4">Location & Requirement</th>
                  <th className="py-3 px-4">Salesperson</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Database className="w-10 h-10 text-gray-300 mb-2" />
                        <p className="text-base font-medium text-gray-700">No Pipeline Data Found</p>
                        <p className="text-xs text-gray-400 max-w-sm mt-1">
                          Leads marked as &apos;Contacted&apos;, &apos;Interested&apos;, or &apos;Follow-up&apos; in the Leads module will automatically show up here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((lead) => {
                    const isUpdating = isUpdatingStatus === lead.id;
                    return (
                      <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                        {/* Lead ID & Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-blue-700 text-sm">
                            {lead.leadNumber || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {lead.contactDate || lead.createdAt?.slice(0, 10) || '—'}
                          </div>
                        </td>

                        {/* Company & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-gray-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[220px]" title={lead.companyName || lead.leadName}>
                              {lead.companyName || lead.leadName || 'Unnamed Business'}
                            </span>
                          </div>
                          {lead.contactPerson && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">
                              POC: {lead.contactPerson}
                            </div>
                          )}
                        </td>

                        {/* Phone / Email */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {lead.mobile && (
                            <a
                              href={`tel:${lead.mobile}`}
                              className="text-xs font-medium text-gray-800 hover:text-blue-600 flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {lead.mobile}
                            </a>
                          )}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 mt-0.5 truncate max-w-[180px]"
                            >
                              <Mail className="w-3 h-3 text-blue-500" />
                              {lead.email}
                            </a>
                          )}
                          {!lead.mobile && !lead.email && (
                            <span className="text-xs text-gray-400 italic">No contact info</span>
                          )}
                        </td>

                        {/* Location & Requirement */}
                        <td className="py-3.5 px-4">
                          {(lead.city || lead.state) && (
                            <div className="text-xs text-gray-700 flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
                              {[lead.city, lead.state].filter(Boolean).join(', ')}
                            </div>
                          )}
                          {lead.requirement && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]" title={lead.requirement}>
                              Req: {normalizeBrand(lead.requirement)}
                            </div>
                          )}
                          {!lead.city && !lead.state && !lead.requirement && (
                            <span className="text-xs text-gray-400 italic">—</span>
                          )}
                        </td>

                        {/* Salesperson */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-700 font-medium">
                          {lead.salesperson || 'Unassigned'}
                        </td>

                        {/* Status (with inline selector) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <select
                            disabled={isUpdating}
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${getStatusBadge(
                              lead.status
                            )}`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt} className="bg-white text-gray-900 font-normal">
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Share Catalogue Button */}
                            <button
                              onClick={() => handleOpenShareModal(lead)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors shadow-2xs"
                              title="Share Product Catalogue via WhatsApp & Email"
                            >
                              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Share</span>
                            </button>

                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="View Lead Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/sales/leads?search=${encodeURIComponent(lead.leadNumber || lead.mobile || '')}`}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Open in Leads Page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Showing <span className="font-semibold text-gray-700">{filteredData.length}</span> of{' '}
              <span className="font-semibold text-gray-700">{pipelineLeads.length}</span> active pipeline records
            </span>
            <span className="italic">
              * Leads updated to &apos;Not Contacted&apos; will move out of this view back to raw leads.
            </span>
          </div>
        </div>

        {/* Lead Details Modal */}
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedLead.companyName || selectedLead.leadName || 'Lead Details'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      ID: {selectedLead.leadNumber} &bull; Created: {selectedLead.createdAt?.slice(0, 10)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Switcher in Modal */}
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-900 uppercase">Current Pipeline Status</p>
                    <p className="text-sm text-blue-700 mt-0.5">Change stage to instantly sync with CRM pipeline</p>
                  </div>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleStatusChange(selectedLead.id, e.target.value as LeadStatus)}
                    className="text-xs font-bold px-3 py-2 rounded-lg border border-blue-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500 block">Contact Person</span>
                    <span className="font-semibold text-gray-800">{selectedLead.contactPerson || '—'}</span>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500 block">Salesperson</span>
                    <span className="font-semibold text-gray-800">{selectedLead.salesperson || '—'}</span>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500 block">Mobile Phone</span>
                    {selectedLead.mobile ? (
                      <a href={`tel:${selectedLead.mobile}`} className="font-semibold text-blue-600 hover:underline">
                        {selectedLead.mobile}
                      </a>
                    ) : (
                      <span className="font-semibold text-gray-800">—</span>
                    )}
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500 block">Alternate Mobile</span>
                    <span className="font-semibold text-gray-800">{selectedLead.alternateMobile || '—'}</span>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 sm:col-span-2">
                    <span className="text-xs text-gray-500 block">Email Address</span>
                    {selectedLead.email ? (
                      <a href={`mailto:${selectedLead.email}`} className="font-semibold text-blue-600 hover:underline">
                        {selectedLead.email}
                      </a>
                    ) : (
                      <span className="font-semibold text-gray-800">—</span>
                    )}
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 sm:col-span-2">
                    <span className="text-xs text-gray-500 block">Location (City, State, Pincode)</span>
                    <span className="font-semibold text-gray-800">
                      {[selectedLead.city, selectedLead.state, selectedLead.pincode].filter(Boolean).join(', ') || '—'}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 sm:col-span-2">
                    <span className="text-xs text-gray-500 block">Full Address</span>
                    <span className="font-medium text-gray-800">{selectedLead.address || '—'}</span>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 sm:col-span-2">
                    <span className="text-xs text-gray-500 block">Requirement</span>
                    <span className="font-medium text-gray-800">{selectedLead.requirement || '—'}</span>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 sm:col-span-2">
                    <span className="text-xs text-gray-500 block">Notes / Follow-up Details</span>
                    <span className="font-medium text-gray-800">{selectedLead.notes || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <Link
                  href={`/sales/leads?search=${encodeURIComponent(selectedLead.leadNumber || selectedLead.mobile || '')}`}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  Edit Full Profile in Leads Page <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Catalogue Modal */}
        {isShareModalOpen && shareLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-gray-200">
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Share Product Catalogue
                    </h3>
                    <p className="text-xs text-gray-500">
                      Sending to <span className="font-semibold text-gray-800">{shareLead.companyName || shareLead.contactPerson}</span> ({shareLead.leadNumber})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Product Search & Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    1. Select / Type Product Name
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setSelectedProduct(null);
                      }}
                      placeholder="Type product name, model number, or SKU to search products..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                    />
                  </div>

                  {/* Dropdown suggestions list if not yet selected */}
                  {!selectedProduct && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white shadow-sm">
                      {searchedProducts.length === 0 ? (
                        <div className="p-3 text-xs text-gray-400 text-center">
                          No matching product found in product catalog.
                        </div>
                      ) : (
                        searchedProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct(p);
                              setProductSearch(p.name);
                            }}
                            className="w-full p-2.5 text-left hover:bg-emerald-50/60 flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-8 h-8 rounded-md object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-semibold text-gray-800">{p.name}</p>
                                <p className="text-[11px] text-gray-400">
                                  SKU: {p.sku || p.productCode} &bull; Brand: {p.brand || 'MapOut'}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-700">
                              ₹{Number(p.sellingPrice || 0).toLocaleString('en-IN')}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Product Card (Displays image fetched from Product Master) */}
                {selectedProduct && (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 relative">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      {/* Product Image */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white border border-emerald-200 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                        {selectedProduct.imageUrl ? (
                          <img
                            src={selectedProduct.imageUrl}
                            alt={selectedProduct.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-400 text-xs">
                            <ImageIcon className="w-6 h-6 mb-1 text-gray-300" />
                            <span>No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-1">
                              {selectedProduct.brand || 'Product Catalogue'}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 leading-snug">
                              {selectedProduct.name}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(null);
                              setProductSearch('');
                            }}
                            className="text-xs text-gray-400 hover:text-rose-600 underline"
                          >
                            Change
                          </button>
                        </div>

                        <p className="text-xs text-gray-500">
                          SKU: <span className="font-mono font-medium text-gray-700">{selectedProduct.sku || selectedProduct.productCode}</span> &bull; Category: {selectedProduct.category || 'Automotive / OBD'}
                        </p>

                        <p className="text-sm font-bold text-emerald-700 pt-0.5">
                          Price: ₹{Number(selectedProduct.sellingPrice || 0).toLocaleString('en-IN')}
                        </p>

                        {selectedProduct.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 pt-1 border-t border-emerald-100/80">
                            {selectedProduct.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Sales Pitch / Message */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    2. Add Custom Message / Note for Lead
                  </label>
                  <textarea
                    rows={4}
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value)}
                    placeholder="Write a custom note, price offer, discount, or product specifications to accompany this catalogue..."
                    className="w-full p-3 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                  />
                </div>

                {/* Recipient Details Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp / Mobile: <strong>{shareLead.mobile || 'Not available'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Email: <strong>{shareLead.email || 'Not available'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Modal Footer / Action Buttons */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Share on WhatsApp */}
                  <button
                    type="button"
                    disabled={!selectedProduct || !shareLead.mobile}
                    onClick={handleSendWhatsApp}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition"
                    title={!shareLead.mobile ? 'Mobile number missing' : 'Send via WhatsApp'}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send via WhatsApp
                  </button>

                  {/* Send via Email */}
                  <button
                    type="button"
                    disabled={!selectedProduct || !shareLead.email || isSendingEmail}
                    onClick={handleSendEmail}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition"
                    title={!shareLead.email ? 'Email address missing' : 'Send via Email'}
                  >
                    <Mail className="w-4 h-4" />
                    {isSendingEmail ? 'Sending Email...' : 'Send via Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
