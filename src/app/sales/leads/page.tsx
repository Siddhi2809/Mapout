'use client';

import React, { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { Lead, LeadSource, LeadStatus, LeadImportHistory } from '@/types/erp';
import {
  downloadLeadExcelTemplate,
  parseLeadFile,
  analyzeLeadsForImport,
  downloadErrorReport,
  ImportPreviewAnalysis,
  ParsedLeadRow,
} from '@/lib/leadExcel';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  X,
  PhoneCall,
  Calendar,
  Edit2,
  Building2,
  Mail,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  TrendingUp,
  Upload,
  Download,
  FileSpreadsheet,
  History,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Eye,
  ArrowRight,
  RefreshCw,
  FileDown,
  Clock,
  ChevronRight,
  Check,
  FileText,
  MapPin,
  Globe,
  Phone,
} from 'lucide-react';

const KEY_PROFILE_FIELDS: { key: keyof Lead; label: string; placeholder: string; type?: string }[] = [
  { key: 'leadName', label: 'Lead Name', placeholder: 'e.g. ABC Enterprises' },
  { key: 'companyName', label: 'Company Name', placeholder: 'e.g. ABC Pvt Ltd' },
  { key: 'contactPerson', label: 'Contact Person', placeholder: 'e.g. John Doe' },
  { key: 'mobile', label: 'Mobile Number', placeholder: 'e.g. 9876543210' },
  { key: 'alternateMobile', label: 'Alternate Mobile', placeholder: 'e.g. 9123456780' },
  { key: 'email', label: 'Email Address', placeholder: 'e.g. contact@abc.com', type: 'email' },
  { key: 'city', label: 'City', placeholder: 'e.g. Pune' },
  { key: 'state', label: 'State', placeholder: 'e.g. Maharashtra' },
  { key: 'pincode', label: 'Pincode', placeholder: 'e.g. 411001' },
  { key: 'address', label: 'Office Address', placeholder: 'e.g. 102 Business Hub, Main Road' },
  { key: 'gstin', label: 'GSTIN', placeholder: 'e.g. 27ABCDE1234F1Z5' },
  { key: 'industry', label: 'Industry', placeholder: 'e.g. Manufacturing / Automotive' },
  { key: 'website', label: 'Website', placeholder: 'e.g. www.abc.com' },
  { key: 'requirement', label: 'Requirement', placeholder: 'e.g. OBD GPS Trackers & Software' },
  { key: 'salesperson', label: 'Salesperson', placeholder: 'e.g. Rajesh Kumar' },
  { key: 'notes', label: 'Notes / Remarks', placeholder: 'e.g. Interested in bulk pilot testing' },
];

function getLeadProfileAudit(l: Lead) {
  const filled: { key: keyof Lead; label: string; value: string }[] = [];
  const missing: { key: keyof Lead; label: string; placeholder: string; type?: string }[] = [];

  KEY_PROFILE_FIELDS.forEach((f) => {
    const val = l[f.key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      filled.push({ key: f.key, label: f.label, value: String(val) });
    } else {
      missing.push(f);
    }
  });

  const percent = Math.round((filled.length / KEY_PROFILE_FIELDS.length) * 100);
  return { filled, missing, percent };
}

export default function LeadsPage() {
  const {
    leads,
    leadImportHistories,
    importLeadsBatch,
    followUps,
    products,
    createLeadFull,
    updateLeadFull,
    convertLeadToCustomer,
    createFollowUpFull,
    updateFollowUpStatusFull,
    activeRole,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [completenessFilter, setCompletenessFilter] = useState('ALL');

  // Modal States
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<Lead | null>(null);

  // Profile Completeness Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedLeadForProfile, setSelectedLeadForProfile] = useState<Lead | null>(null);
  const [profileFormData, setProfileFormData] = useState<Record<string, string>>({});

  // Import Leads Wizard State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [importFileName, setImportFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [analysis, setAnalysis] = useState<ImportPreviewAnalysis | null>(null);
  const [duplicateDecisions, setDuplicateDecisions] = useState<Record<number, 'update' | 'skip' | 'asNew'>>({});
  const [bulkDuplicateAction, setBulkDuplicateAction] = useState<'update' | 'skip' | 'asNew'>('update');
  const [importResult, setImportResult] = useState<{
    totalRows: number;
    newLeads: number;
    updatedLeads: number;
    duplicateLeads: number;
    failedRows: number;
    failedItems: { rowNumber: number; leadName: string; reason: string }[];
  } | null>(null);
  const [showFailedDetails, setShowFailedDetails] = useState(false);

  // Import History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form Lead State (Create / Edit)
  const [formLeadName, setFormLeadName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formAlternateMobile, setFormAlternateMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formSource, setFormSource] = useState<LeadSource>('Website');
  const [formSalesperson, setFormSalesperson] = useState('Rajesh Kumar');
  const [formWebsite, setFormWebsite] = useState('');
  const [formRequirement, setFormRequirement] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formExpectedValue, setFormExpectedValue] = useState('100000');
  const [formStatus, setFormStatus] = useState<LeadStatus>('New');
  const [formNotes, setFormNotes] = useState('');

  // Form FollowUp State
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpTime, setFollowUpTime] = useState('11:00 AM');
  const [followUpPurpose, setFollowUpPurpose] = useState('Product Demo & Pricing Negotiation');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (l.leadName || '').toLowerCase().includes(q) ||
      (l.companyName || '').toLowerCase().includes(q) ||
      (l.contactPerson || '').toLowerCase().includes(q) ||
      (l.leadNumber || '').toLowerCase().includes(q) ||
      (l.mobile || '').includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.city || '').toLowerCase().includes(q) ||
      (l.requirement || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchSource = sourceFilter === 'ALL' || l.source === sourceFilter;

    let matchCompleteness = true;
    if (completenessFilter === 'COMPLETE') {
      matchCompleteness = getLeadProfileAudit(l).missing.length === 0;
    } else if (completenessFilter === 'INCOMPLETE') {
      matchCompleteness = getLeadProfileAudit(l).missing.length > 0;
    }

    return matchSearch && matchStatus && matchSource && matchCompleteness;
  });

  // Open Create Lead Modal
  const handleOpenCreateLeadModal = () => {
    setEditingLead(null);
    setFormLeadName('');
    setFormCompany('');
    setFormContactPerson('');
    setFormMobile('');
    setFormAlternateMobile('');
    setFormEmail('');
    setFormAddress('');
    setFormCity('');
    setFormState('');
    setFormPincode('');
    setFormGstin('');
    setFormIndustry('');
    setFormSource('Website');
    setFormSalesperson(activeRole === 'ADMIN' ? 'Administrator' : 'Rajesh Kumar');
    setFormWebsite('');
    setFormRequirement('');
    if (products.length > 0) setFormProductId(products[0].id);
    setFormExpectedValue('100000');
    setFormStatus('New');
    setFormNotes('');
    setIsLeadModalOpen(true);
  };

  // Open Edit Lead Modal
  const handleOpenEditLeadModal = (l: Lead) => {
    setEditingLead(l);
    setFormLeadName(l.leadName || '');
    setFormCompany(l.companyName || '');
    setFormContactPerson(l.contactPerson || '');
    setFormMobile(l.mobile || '');
    setFormAlternateMobile(l.alternateMobile || '');
    setFormEmail(l.email || '');
    setFormAddress(l.address || '');
    setFormCity(l.city || '');
    setFormState(l.state || '');
    setFormPincode(l.pincode || '');
    setFormGstin(l.gstin || '');
    setFormIndustry(l.industry || '');
    setFormSource(l.source || 'Website');
    setFormSalesperson(l.salesperson || l.assignedUser || 'Rajesh Kumar');
    setFormWebsite(l.website || '');
    setFormRequirement(l.requirement || '');
    setFormProductId(l.interestedProductId || (products.length > 0 ? products[0].id : ''));
    setFormExpectedValue(String(l.expectedValue || 0));
    setFormStatus(l.status);
    setFormNotes(l.notes || '');
    setIsLeadModalOpen(true);
  };

  // Open Lead Profile Completion Modal
  const handleOpenProfileModal = (l: Lead) => {
    setSelectedLeadForProfile(l);
    const formVals: Record<string, string> = {};
    KEY_PROFILE_FIELDS.forEach((f) => {
      formVals[f.key] = (l[f.key] as string) || '';
    });
    setProfileFormData(formVals);
    setIsProfileModalOpen(true);
  };

  // Save Completed Profile
  const handleSaveCompletedProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForProfile) return;

    const updates: Partial<Lead> = {};
    KEY_PROFILE_FIELDS.forEach((f) => {
      const val = profileFormData[f.key];
      if (val !== undefined) {
        (updates as any)[f.key] = val.trim();
      }
    });

    updateLeadFull(selectedLeadForProfile.id, updates);
    showToast(`Lead "${profileFormData.leadName || selectedLeadForProfile.leadName}" profile updated successfully.`);
    setIsProfileModalOpen(false);
  };

  // Save Lead (Add / Edit)
  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    const prodObj = products.find((p) => p.id === formProductId);
    const val = parseFloat(formExpectedValue) || 0;

    const leadPayload = {
      leadName: formLeadName.trim(),
      companyName: formCompany.trim(),
      contactPerson: formContactPerson.trim(),
      mobile: formMobile.trim(),
      alternateMobile: formAlternateMobile.trim(),
      email: formEmail.trim(),
      address: formAddress.trim(),
      city: formCity.trim(),
      state: formState.trim(),
      pincode: formPincode.trim(),
      gstin: formGstin.trim(),
      industry: formIndustry.trim(),
      source: formSource,
      salesperson: formSalesperson.trim(),
      website: formWebsite.trim(),
      requirement: formRequirement.trim(),
      interestedProductId: formProductId,
      interestedProductName: prodObj ? prodObj.name : formRequirement.trim() || 'OBD Product',
      expectedValue: val,
      assignedUser: formSalesperson.trim(),
      status: formStatus,
      notes: formNotes.trim(),
    };

    if (editingLead) {
      updateLeadFull(editingLead.id, leadPayload);
      showToast(`Lead "${formLeadName}" updated successfully.`);
    } else {
      createLeadFull(leadPayload);
      showToast(`New Lead "${formLeadName}" created successfully.`);
    }

    setIsLeadModalOpen(false);
  };

  // Open Follow-up Modal
  const handleOpenFollowUpModal = (l: Lead) => {
    setSelectedLeadForFollowUp(l);
    setFollowUpDate(new Date().toISOString().split('T')[0]);
    setFollowUpTime('11:00 AM');
    setFollowUpPurpose(`Follow up call with ${l.companyName || l.leadName}`);
    setFollowUpNotes('');
    setIsFollowUpModalOpen(true);
  };

  // Save Follow-up
  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForFollowUp) return;

    createFollowUpFull({
      leadOrCustomerId: selectedLeadForFollowUp.id,
      leadOrCustomerName: selectedLeadForFollowUp.companyName || selectedLeadForFollowUp.leadName || 'Lead',
      type: 'Lead',
      followUpDate,
      followUpTime,
      purpose: followUpPurpose,
      notes: followUpNotes,
      status: 'Pending',
      assignedUser: selectedLeadForFollowUp.salesperson || selectedLeadForFollowUp.assignedUser || 'Sales Team',
    });

    showToast(`Follow-up call scheduled for ${selectedLeadForFollowUp.companyName || selectedLeadForFollowUp.leadName}.`);
    setIsFollowUpModalOpen(false);
  };

  // Convert Lead to Customer
  const handleConvertLead = (l: Lead) => {
    const leadDisplayName = l.companyName || l.leadName;
    if (confirm(`Convert lead "${leadDisplayName}" into an active CRM customer account?\nExisting matching customer records will be linked without creating duplicates.`)) {
      const res = convertLeadToCustomer(l.id);
      if (res.success) {
        showToast(`Lead "${leadDisplayName}" successfully converted to Customer account!`);
      } else {
        alert(res.message);
      }
    }
  };

  // Handle Excel File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setIsAnalyzing(true);

    try {
      const rawRows = await parseLeadFile(file);
      const previewAnalysis = analyzeLeadsForImport(rawRows, leads);
      setAnalysis(previewAnalysis);

      // Default duplicate decisions to 'update'
      const decisions: Record<number, 'update' | 'skip' | 'asNew'> = {};
      previewAnalysis.rows.forEach((r) => {
        if (r.isDuplicate) {
          decisions[r.rowNumber] = 'update';
        }
      });
      setDuplicateDecisions(decisions);
      setImportStep('preview');
    } catch (err: any) {
      alert(`Error reading Excel file: ${err.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Bulk Apply Duplicate Action
  const handleApplyBulkDuplicateAction = (action: 'update' | 'skip' | 'asNew') => {
    setBulkDuplicateAction(action);
    if (!analysis) return;
    const newDecisions: Record<number, 'update' | 'skip' | 'asNew'> = {};
    analysis.rows.forEach((r) => {
      if (r.isDuplicate) {
        newDecisions[r.rowNumber] = action;
      }
    });
    setDuplicateDecisions(newDecisions);
  };

  // Execute Batch Import
  const handleConfirmImport = async () => {
    if (!analysis) return;
    setIsImporting(true);

    try {
      // Map chosen decisions onto the parsed rows
      const resolvedRows: ParsedLeadRow[] = analysis.rows.map((r) => ({
        ...r,
        chosenAction: r.isDuplicate ? duplicateDecisions[r.rowNumber] || 'update' : 'asNew',
      }));

      const res = await importLeadsBatch(resolvedRows, {
        fileName: importFileName || 'Leads_Import.xlsx',
        importedBy: activeRole === 'ADMIN' ? 'Administrator' : 'Sales Person',
        duplicateHandling: bulkDuplicateAction,
      });

      setImportResult({
        totalRows: res.totalRows,
        newLeads: res.newLeads,
        updatedLeads: res.updatedLeads,
        duplicateLeads: res.duplicateLeads,
        failedRows: res.failedRows,
        failedItems: res.failedItems,
      });

      setImportStep('result');
      showToast(`Import completed: ${res.newLeads} new leads, ${res.updatedLeads} updated.`);
    } catch (err: any) {
      alert(`Import failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Converted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Send Quotation':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Interested':
      case 'Quotation Sent':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'New':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Contacted':
      case 'Follow-up':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Lost':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const handleQuickStatusChange = (l: Lead, newStatus: LeadStatus) => {
    updateLeadFull(l.id, { status: newStatus });
    if (newStatus === 'Follow-up' || newStatus === 'Contacted') {
      showToast(`✓ Lead "${l.companyName || l.leadName}" updated to ${newStatus} — automatically added to Follow-ups!`);
    } else if (newStatus === 'Send Quotation' || newStatus === 'Quotation Sent') {
      showToast(`✓ Lead "${l.companyName || l.leadName}" updated to Send Quotation — added to Customers & Quotations!`);
    } else {
      showToast(`Lead "${l.companyName || l.leadName}" status updated to ${newStatus}.`);
    }
  };

  const pendingFollowups = followUps.filter((f) => f.status === 'Pending');

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

        {/* Hidden File Input for Excel */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Top Header & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads & Follow-ups (CRM)</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold">
                {leads.length} Leads
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Capture inbound inquiries, schedule client follow-up reminders, import incomplete leads from Excel, and convert qualified leads into customer accounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Download Template Button */}
            <button
              onClick={downloadLeadExcelTemplate}
              title="Download standardized Lead import Excel template"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Download className="w-4 h-4 text-slate-600" /> Download Template
            </button>

            {/* Import History Button */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              title="View previous Excel lead import history"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <History className="w-4 h-4 text-blue-600" /> Import History
              {leadImportHistories.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                  {leadImportHistories.length}
                </span>
              )}
            </button>

            {/* Import Leads Button */}
            <button
              onClick={() => {
                setImportStep('upload');
                setAnalysis(null);
                setImportResult(null);
                setIsImportModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              <Upload className="w-4 h-4" /> Import Leads
            </button>

            {/* Add New CRM Lead Button */}
            <button
              onClick={handleOpenCreateLeadModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          </div>
        </div>

        {/* UPCOMING FOLLOW-UPS WIDGET */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-blue-600" /> Upcoming Scheduled CRM Follow-ups
            </h3>
            <span className="text-[11px] text-blue-800 font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {pendingFollowups.length} Pending Reminders
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {followUps.slice(0, 4).map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs hover:border-slate-300 transition"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    {f.leadOrCustomerName}
                    <span className="text-[10px] text-slate-500 font-mono font-normal">({f.type})</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">{f.purpose}</div>
                  <div className="text-[11px] text-blue-700 font-mono font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> {f.followUpDate} @ {f.followUpTime}
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-right">
                  {f.status === 'Pending' ? (
                    <button
                      onClick={() => updateFollowUpStatusFull(f.id, 'Completed')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 hover:bg-emerald-200 text-[11px] font-bold transition"
                    >
                      Mark Done
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                      {f.status}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {followUps.length === 0 && (
              <div className="col-span-2 text-center py-6 text-slate-500 text-xs font-medium">
                No scheduled follow-up calls found.
              </div>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Lead, Company, Contact, Phone, City..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Filters:
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Send Quotation">Send Quotation</option>
              <option value="Quotation Sent">Quotation Sent</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="ALL">All Sources</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Social Media">Social Media</option>
              <option value="Advertisement">Advertisement</option>
              <option value="Phone">Phone</option>
              <option value="Email">Email</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={completenessFilter}
              onChange={(e) => setCompletenessFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="ALL">All Profiles</option>
              <option value="INCOMPLETE">⚠️ Incomplete Profile</option>
              <option value="COMPLETE">✓ 100% Complete Profile</option>
            </select>
          </div>
        </div>

        {/* Lead Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                  <th className="p-3.5">Lead ID</th>
                  <th className="p-3.5">Lead & Company</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Location & Requirement</th>
                  <th className="p-3.5 text-center">Profile Completeness</th>
                  <th className="p-3.5 text-right">Expected Value</th>
                  <th className="p-3.5">Salesperson</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((l) => {
                  const audit = getLeadProfileAudit(l);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono text-blue-600 font-bold">
                        <div>{l.leadNumber}</div>
                        {l.importId && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Excel Import
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 max-w-[200px]">
                        <div className="font-bold text-slate-900 truncate">{l.companyName || l.leadName}</div>
                        {l.contactPerson && l.contactPerson !== l.companyName && (
                          <div className="text-[11px] text-slate-500 font-medium truncate">POC: {l.contactPerson}</div>
                        )}
                        {l.leadName && l.leadName !== l.companyName && (
                          <div className="text-[10px] text-slate-400 truncate">{l.leadName}</div>
                        )}
                      </td>
                      <td className="p-3.5 max-w-[190px]">
                        {l.mobile ? (
                          <div className="text-slate-900 font-mono font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {l.mobile}
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-600 italic">No mobile</div>
                        )}
                        {l.email ? (
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {l.email}
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-600 italic">No email</div>
                        )}
                      </td>
                      <td className="p-3.5 max-w-[190px]">
                        {(l.city || l.state) && (
                          <div className="text-slate-800 font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {[l.city, l.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                        {l.requirement && (
                          <div className="text-[11px] text-slate-600 truncate mt-0.5">
                            <span className="font-semibold text-slate-700">Req:</span> {l.requirement}
                          </div>
                        )}
                        {!l.city && !l.state && !l.requirement && (
                          <span className="text-[11px] text-slate-400 italic">No location/requirement</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {audit.missing.length === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Complete (100%)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenProfileModal(l)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition"
                            title={`Click to complete ${audit.missing.length} missing fields`}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {audit.missing.length} Missing ({audit.percent}%)
                          </button>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-700 font-mono text-xs">
                        ₹{(l.expectedValue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {l.salesperson || l.assignedUser || 'Sales Team'}
                      </td>
                      <td className="p-3.5 text-center">
                        <select
                          value={l.status}
                          onChange={(e) => handleQuickStatusChange(l, e.target.value as LeadStatus)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border cursor-pointer focus:outline-none transition shadow-2xs ${getStatusBadge(l.status)}`}
                          title="Click to update lead status"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted (→ Follow-ups)</option>
                          <option value="Follow-up">Follow-up (→ Follow-ups)</option>
                          <option value="Interested">Interested</option>
                          <option value="Send Quotation">Send Quotation (→ Cust & Quote)</option>
                          <option value="Quotation Sent">Quotation Sent (→ Cust & Quote)</option>
                          <option value="Converted">Converted</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Profile Details & Completion Button */}
                          <button
                            onClick={() => handleOpenProfileModal(l)}
                            title="View Details & Complete Profile"
                            className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200 font-semibold text-[11px] flex items-center gap-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-700" /> Profile
                          </button>

                          {/* Call / Follow-up */}
                          <button
                            onClick={() => handleOpenFollowUpModal(l)}
                            title="Schedule Follow-up Call"
                            className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] flex items-center gap-1 transition"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          {/* Edit Lead */}
                          <button
                            onClick={() => handleOpenEditLeadModal(l)}
                            title="Edit Lead"
                            className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Convert to Customer */}
                          {l.status !== 'Converted' && (
                            <button
                              onClick={() => handleConvertLead(l)}
                              title="Convert Lead to Customer Account"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 shadow-sm flex items-center gap-1 transition"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Convert
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500 text-xs font-medium">
                      No CRM lead records found. Use &quot;Add Lead&quot; or &quot;Import Leads&quot; to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* LEAD PROFILE DETAILS & COMPLETION MODAL (REQUIREMENT 6)       */}
        {/* ------------------------------------------------------------- */}
        {isProfileModalOpen && selectedLeadForProfile && (() => {
          const audit = getLeadProfileAudit(selectedLeadForProfile);
          return (
            <div
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsProfileModalOpen(false);
              }}
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {(selectedLeadForProfile.leadName || 'L').charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {selectedLeadForProfile.companyName || selectedLeadForProfile.leadName}
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700">
                          {selectedLeadForProfile.leadNumber}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Lead Pipeline Status: <span className="font-semibold text-slate-800">{selectedLeadForProfile.status}</span> • Created: {selectedLeadForProfile.createdAt}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
                  {/* Progress Header Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" /> Lead Profile Completeness
                      </div>
                      <div className="font-mono font-bold text-sm text-blue-700">{audit.percent}%</div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          audit.percent === 100
                            ? 'bg-emerald-500'
                            : audit.percent >= 60
                            ? 'bg-blue-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${audit.percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>✓ {audit.filled.length} fields completed</span>
                      <span>⚠ {audit.missing.length} fields missing</span>
                    </div>
                  </div>

                  {/* Missing Fields Indicators (Exact Requirement 6 Specification) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Filled Information List */}
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                      <h4 className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Completed Information ({audit.filled.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {audit.filled.map((item) => (
                          <span
                            key={item.key}
                            className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <strong>{item.label}:</strong> {item.value}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Information List */}
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                      <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> Missing Information ({audit.missing.length})
                      </h4>
                      {audit.missing.length === 0 ? (
                        <p className="text-emerald-700 text-xs font-semibold">
                          🎉 Profile is 100% complete! All profile fields are recorded.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {audit.missing.map((item) => (
                            <span
                              key={item.key}
                              className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                            >
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              ⚠ {item.label} Missing
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form to update missing & available fields directly into the existing record */}
                  <form onSubmit={handleSaveCompletedProfile} id="complete-profile-form" className="space-y-4 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" /> Complete / Edit Lead Details
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Updates will be saved directly into lead record <code className="font-mono text-blue-600 font-bold">{selectedLeadForProfile.leadNumber}</code>.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {KEY_PROFILE_FIELDS.map((f) => {
                        const isMissing = !profileFormData[f.key] || profileFormData[f.key].trim() === '';
                        return (
                          <div key={f.key} className="space-y-1">
                            <label className="flex items-center justify-between text-slate-700 font-bold text-[11px]">
                              <span>{f.label}</span>
                              {isMissing ? (
                                <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                                  <AlertCircle className="w-2.5 h-2.5" /> Missing
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> Filled
                                </span>
                              )}
                            </label>
                            <input
                              type={f.type || 'text'}
                              value={profileFormData[f.key] || ''}
                              onChange={(e) =>
                                setProfileFormData((prev) => ({ ...prev, [f.key]: e.target.value }))
                              }
                              placeholder={f.placeholder}
                              className={`w-full rounded-xl px-3 py-2 text-xs transition ${
                                isMissing
                                  ? 'bg-amber-50/50 border border-amber-300 focus:bg-white focus:border-blue-600 text-slate-900'
                                  : 'bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 text-slate-900'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </form>
                </div>

                {/* Footer Action Bar */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Saving removes the missing-field indicators and retains all lead history and follow-ups.
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsProfileModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="complete-profile-form"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Complete Lead Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ------------------------------------------------------------- */}
        {/* IMPORT LEADS WIZARD MODAL (REQUIREMENTS 1, 2, 3, 4, 5, 11)   */}
        {/* ------------------------------------------------------------- */}
        {isImportModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isImporting) setIsImportModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Wizard Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Excel Lead Import Wizard
                    </h3>
                    <p className="text-xs text-slate-500">
                      Step {importStep === 'upload' ? '1 of 3: Select File' : importStep === 'preview' ? '2 of 3: Preview & Duplicate Resolution' : '3 of 3: Import Results'}
                    </p>
                  </div>
                </div>

                {!isImporting && (
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Wizard Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
                {/* STEP 1: UPLOAD & TEMPLATE */}
                {importStep === 'upload' && (
                  <div className="space-y-6">
                    {/* Guidance Alert */}
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-2">
                      <div className="font-bold flex items-center gap-1.5 text-xs text-blue-800">
                        <Sparkles className="w-4 h-4 text-blue-600" /> Lead Excel Import Guidelines
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-800">
                        <li>
                          <strong>Incomplete Leads Allowed:</strong> The Sales Person does NOT need to fill every field. Only enter available info; empty fields will remain blank.
                        </li>
                        <li>
                          <strong>Minimum Information:</strong> Only requires <em>Lead Name</em> (or identifying name), preferably with Mobile or Email.
                        </li>
                        <li>
                          <strong>Duplicate Protection:</strong> Automatically matches on Mobile, Email, and Company Name. You choose whether to update existing leads, skip, or create as new.
                        </li>
                        <li>
                          <strong>No Dummy Values:</strong> Missing data is preserved as empty/null; fake defaults (N/A, Unknown) are never created.
                        </li>
                      </ul>
                    </div>

                    {/* Upload Box */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/20 group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition">
                        <Upload className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Click to select Lead Excel file (.xlsx or .xls)
                      </h4>
                      <p className="text-slate-500 text-xs mt-1">
                        Upload any Excel sheet containing columns like Lead Name, Company, Mobile, Email, City, etc.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm group-hover:bg-emerald-700 transition">
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Columns...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="w-4 h-4" /> Browse Excel File
                          </>
                        )}
                      </div>
                    </div>

                    {/* Download Sample Template Section */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">Need the official template?</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Download our standardized Excel template with pre-styled headers, sample data, and instructions.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={downloadLeadExcelTemplate}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs flex items-center gap-2 transition shadow-sm whitespace-nowrap"
                      >
                        <Download className="w-4 h-4 text-emerald-600" /> Download Excel Template
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: PREVIEW & DUPLICATE RESOLUTION */}
                {importStep === 'preview' && analysis && (
                  <div className="space-y-6">
                    {/* Summary Counters */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[11px] font-semibold text-slate-500">Total Rows</div>
                        <div className="text-lg font-bold font-mono text-slate-900">{analysis.totalRows}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <div className="text-[11px] font-semibold text-emerald-700">Valid Leads</div>
                        <div className="text-lg font-bold font-mono text-emerald-800">{analysis.validCount}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                        <div className="text-[11px] font-semibold text-blue-700">New Leads</div>
                        <div className="text-lg font-bold font-mono text-blue-800">{analysis.newCount}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                        <div className="text-[11px] font-semibold text-amber-700">Duplicate Found</div>
                        <div className="text-lg font-bold font-mono text-amber-800">{analysis.duplicateCount}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                        <div className="text-[11px] font-semibold text-rose-700">Invalid / Failed</div>
                        <div className="text-lg font-bold font-mono text-rose-800">{analysis.invalidCount}</div>
                      </div>
                    </div>

                    {/* Field Stats Breakdown (Filled vs Empty Optional Fields) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">Fields Available vs Missing Optional Fields</span>
                        <span className="text-[11px] text-slate-500">Empty optional fields are permitted</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {analysis.fieldStats.slice(0, 12).map((st) => (
                          <div key={st.field} className="p-2 rounded-lg bg-white border border-slate-200 text-[10px]">
                            <div className="font-semibold text-slate-800 truncate">{st.label}</div>
                            <div className="text-slate-500 font-mono mt-0.5">
                              {st.filledCount}/{analysis.totalRows} ({st.filledPercent}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DUPLICATE DETECTION RESOLUTION SECTION (REQUIREMENT 4) */}
                    {analysis.duplicateCount > 0 && (
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2">
                          <div>
                            <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-600" /> Existing Leads Found ({analysis.duplicateCount})
                            </div>
                            <div className="text-amber-800 text-[11px] mt-0.5">
                              These rows match existing leads in CRM by Mobile, Email, or Company Name. Choose an action:
                            </div>
                          </div>

                          {/* Bulk Decision Selector */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-amber-900 font-semibold">Bulk Action:</span>
                            <button
                              type="button"
                              onClick={() => handleApplyBulkDuplicateAction('update')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                bulkDuplicateAction === 'update'
                                  ? 'bg-amber-600 text-white border-amber-700'
                                  : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-100'
                              }`}
                            >
                              Update All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyBulkDuplicateAction('skip')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                bulkDuplicateAction === 'skip'
                                  ? 'bg-slate-700 text-white border-slate-800'
                                  : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-100'
                              }`}
                            >
                              Skip All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyBulkDuplicateAction('asNew')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                bulkDuplicateAction === 'asNew'
                                  ? 'bg-blue-600 text-white border-blue-700'
                                  : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-100'
                              }`}
                            >
                              Import All As New
                            </button>
                          </div>
                        </div>

                        {/* List of Duplicate Rows with Per-Row Action Buttons */}
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {analysis.rows
                            .filter((r) => r.isDuplicate)
                            .map((r) => (
                              <div
                                key={r.rowNumber}
                                className="p-2.5 rounded-lg bg-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-900 flex items-center gap-2">
                                    <span className="font-mono text-slate-500">Row #{r.rowNumber}:</span>
                                    <span>{r.companyName || r.leadName}</span>
                                    {r.mobile && <span className="font-mono text-[11px] text-slate-500 font-normal">({r.mobile})</span>}
                                  </div>
                                  <div className="text-[11px] text-amber-700 font-medium">
                                    {r.duplicateReason}
                                  </div>
                                </div>

                                {/* Row decision toggles */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDuplicateDecisions((prev) => ({ ...prev, [r.rowNumber]: 'update' }))
                                    }
                                    className={`px-2 py-1 rounded-md text-[10px] font-bold border transition ${
                                      duplicateDecisions[r.rowNumber] === 'update'
                                        ? 'bg-amber-600 text-white border-amber-700'
                                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    Update Existing
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDuplicateDecisions((prev) => ({ ...prev, [r.rowNumber]: 'skip' }))
                                    }
                                    className={`px-2 py-1 rounded-md text-[10px] font-bold border transition ${
                                      duplicateDecisions[r.rowNumber] === 'skip'
                                        ? 'bg-slate-700 text-white border-slate-800'
                                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    Skip
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDuplicateDecisions((prev) => ({ ...prev, [r.rowNumber]: 'asNew' }))
                                    }
                                    className={`px-2 py-1 rounded-md text-[10px] font-bold border transition ${
                                      duplicateDecisions[r.rowNumber] === 'asNew'
                                        ? 'bg-blue-600 text-white border-blue-700'
                                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    Import As New
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Preview Table of Rows */}
                    <div className="space-y-2">
                      <div className="font-bold text-slate-900 text-xs">Previewing First 8 Rows:</div>
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">Row</th>
                              <th className="p-2.5">Lead Name</th>
                              <th className="p-2.5">Company</th>
                              <th className="p-2.5">Mobile</th>
                              <th className="p-2.5">Email</th>
                              <th className="p-2.5">City</th>
                              <th className="p-2.5">Requirement</th>
                              <th className="p-2.5 text-center">Classification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {analysis.rows.slice(0, 8).map((r) => (
                              <tr key={r.rowNumber} className="hover:bg-slate-50/60">
                                <td className="p-2.5 font-mono text-slate-500">#{r.rowNumber}</td>
                                <td className="p-2.5 font-bold text-slate-900">{r.leadName || '—'}</td>
                                <td className="p-2.5 text-slate-700">{r.companyName || '—'}</td>
                                <td className="p-2.5 font-mono text-slate-800">{r.mobile || '—'}</td>
                                <td className="p-2.5 text-slate-600">{r.email || '—'}</td>
                                <td className="p-2.5 text-slate-700">{r.city || '—'}</td>
                                <td className="p-2.5 text-slate-600 max-w-[150px] truncate">{r.requirement || '—'}</td>
                                <td className="p-2.5 text-center">
                                  {!r.isValid ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                      Invalid
                                    </span>
                                  ) : r.isDuplicate ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                      Duplicate ({duplicateDecisions[r.rowNumber] || 'update'})
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      New Lead
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: IMPORT RESULT (REQUIREMENTS 10 & 11) */}
                {importStep === 'result' && importResult && (
                  <div className="space-y-6">
                    {/* Completion Banner */}
                    <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h4 className="text-lg font-bold text-emerald-900">Import Completed Successfully</h4>
                      <p className="text-xs text-emerald-700 max-w-md mx-auto">
                        Leads have been integrated directly into the CRM database with initial status <strong>&quot;New&quot;</strong>.
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[11px] font-semibold text-slate-500">Total Rows</div>
                        <div className="text-xl font-bold font-mono text-slate-900">{importResult.totalRows}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <div className="text-[11px] font-semibold text-emerald-700">New Leads</div>
                        <div className="text-xl font-bold font-mono text-emerald-800">{importResult.newLeads}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                        <div className="text-[11px] font-semibold text-amber-700">Updated Leads</div>
                        <div className="text-xl font-bold font-mono text-amber-800">{importResult.updatedLeads}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                        <div className="text-[11px] font-semibold text-blue-700">Duplicates</div>
                        <div className="text-xl font-bold font-mono text-blue-800">{importResult.duplicateLeads}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                        <div className="text-[11px] font-semibold text-rose-700">Failed Rows</div>
                        <div className="text-xl font-bold font-mono text-rose-800">{importResult.failedRows}</div>
                      </div>
                    </div>

                    {/* Failed Rows Detail & Error Report Download */}
                    {importResult.failedRows > 0 && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600" /> {importResult.failedRows} Rows Could Not Be Imported
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowFailedDetails((prev) => !prev)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 text-[11px] font-semibold hover:bg-rose-100 transition"
                            >
                              {showFailedDetails ? 'Hide Reasons' : 'View Failed Rows'}
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadErrorReport(importResult.failedItems)}
                              className="px-3 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition flex items-center gap-1 shadow-sm"
                            >
                              <FileDown className="w-3.5 h-3.5" /> Download Error Report
                            </button>
                          </div>
                        </div>

                        {showFailedDetails && (
                          <div className="overflow-x-auto border border-rose-200 rounded-lg bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-rose-100/60 text-rose-800 font-bold border-b border-rose-200">
                                <tr>
                                  <th className="p-2">Row #</th>
                                  <th className="p-2">Lead Name</th>
                                  <th className="p-2">Exact Reason</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-rose-100">
                                {importResult.failedItems.map((fi, idx) => (
                                  <tr key={idx}>
                                    <td className="p-2 font-mono text-rose-700">#{fi.rowNumber}</td>
                                    <td className="p-2 font-semibold text-slate-800">{fi.leadName}</td>
                                    <td className="p-2 text-rose-600">{fi.reason}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wizard Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div>
                  {importStep === 'preview' && (
                    <button
                      type="button"
                      onClick={() => setImportStep('upload')}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                      ← Back to Upload
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {importStep === 'upload' && (
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                  )}

                  {importStep === 'preview' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsImportModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmImport}
                        disabled={isImporting || !analysis}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                      >
                        {isImporting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Importing Leads...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> Confirm & Import Leads
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {importStep === 'result' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsImportModalOpen(false);
                          setStatusFilter('New');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" /> View Imported Leads
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsImportModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* IMPORT HISTORY MODAL (REQUIREMENT 10)                         */}
        {/* ------------------------------------------------------------- */}
        {isHistoryModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsHistoryModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Lead Excel Import History</h3>
                    <p className="text-xs text-slate-500">Record of previous Excel lead batch import operations</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Table */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                {leadImportHistories.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300" />
                    <div className="font-semibold text-slate-700">No import history yet</div>
                    <p className="text-xs text-slate-400">
                      Imported files and statistics will automatically be recorded here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Import ID</th>
                          <th className="p-3">File Name</th>
                          <th className="p-3">Imported By</th>
                          <th className="p-3">Date & Time</th>
                          <th className="p-3 text-center">Total Rows</th>
                          <th className="p-3 text-center">New</th>
                          <th className="p-3 text-center">Updated</th>
                          <th className="p-3 text-center">Duplicates</th>
                          <th className="p-3 text-center">Failed</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leadImportHistories.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50/70">
                            <td className="p-3 font-mono text-blue-600 font-bold">{h.id}</td>
                            <td className="p-3 font-semibold text-slate-900 flex items-center gap-1.5">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                              {h.fileName}
                            </td>
                            <td className="p-3 text-slate-700">{h.importedBy}</td>
                            <td className="p-3 font-mono text-slate-600">
                              {h.importDate ? new Date(h.importDate).toLocaleString() : '—'}
                            </td>
                            <td className="p-3 text-center font-bold font-mono text-slate-900">{h.totalRows}</td>
                            <td className="p-3 text-center font-bold font-mono text-emerald-700">+{h.newLeads}</td>
                            <td className="p-3 text-center font-bold font-mono text-amber-700">{h.updatedLeads}</td>
                            <td className="p-3 text-center font-bold font-mono text-blue-700">{h.duplicateLeads}</td>
                            <td className="p-3 text-center font-bold font-mono text-rose-700">{h.failedRows}</td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  h.status === 'Success'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : h.status === 'Partial'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}
                              >
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CREATE / EDIT LEAD MODAL                                     */}
        {/* ------------------------------------------------------------- */}
        {isLeadModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsLeadModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Sticky Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  {editingLead ? `Edit Lead: ${editingLead.companyName || editingLead.leadName}` : 'Add New CRM Lead Inquiry'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                  title="Close Form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveLead} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Lead Name *</label>
                      <input
                        type="text"
                        required
                        value={formLeadName}
                        onChange={(e) => setFormLeadName(e.target.value)}
                        placeholder="Lead / Prospect Name"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Company Name</label>
                      <input
                        type="text"
                        value={formCompany}
                        onChange={(e) => setFormCompany(e.target.value)}
                        placeholder="Company / Firm Name"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={formContactPerson}
                        onChange={(e) => setFormContactPerson(e.target.value)}
                        placeholder="Representative / POC"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Mobile Number</label>
                      <input
                        type="text"
                        value={formMobile}
                        onChange={(e) => setFormMobile(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Alternate Mobile</label>
                      <input
                        type="text"
                        value={formAlternateMobile}
                        onChange={(e) => setFormAlternateMobile(e.target.value)}
                        placeholder="+91 91234 56780"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="inquiry@company.com"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">City</label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        placeholder="e.g. Pune"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">State</label>
                      <input
                        type="text"
                        value={formState}
                        onChange={(e) => setFormState(e.target.value)}
                        placeholder="e.g. Maharashtra"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Pincode</label>
                      <input
                        type="text"
                        value={formPincode}
                        onChange={(e) => setFormPincode(e.target.value)}
                        placeholder="e.g. 411001"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">GSTIN</label>
                      <input
                        type="text"
                        value={formGstin}
                        onChange={(e) => setFormGstin(e.target.value)}
                        placeholder="e.g. 27ABCDE1234F1Z5"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono uppercase text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Industry</label>
                      <input
                        type="text"
                        value={formIndustry}
                        onChange={(e) => setFormIndustry(e.target.value)}
                        placeholder="e.g. Logistics & Fleet"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Lead Source</label>
                      <select
                        value={formSource}
                        onChange={(e) => setFormSource(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      >
                        <option value="Website">Website</option>
                        <option value="Referral">Referral</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Advertisement">Advertisement</option>
                        <option value="Phone">Phone</option>
                        <option value="Email">Email</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Interested Product</label>
                      <select
                        value={formProductId}
                        onChange={(e) => setFormProductId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      >
                        <option value="">-- Select Product (Optional) --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Requirement Details</label>
                      <input
                        type="text"
                        value={formRequirement}
                        onChange={(e) => setFormRequirement(e.target.value)}
                        placeholder="Product needs / volume..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Expected Deal Value (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={formExpectedValue}
                        onChange={(e) => setFormExpectedValue(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Salesperson</label>
                      <input
                        type="text"
                        value={formSalesperson}
                        onChange={(e) => setFormSalesperson(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Lead Pipeline Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Interested">Interested</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Send Quotation">Send Quotation</option>
                        <option value="Quotation Sent">Quotation Sent</option>
                        <option value="Converted">Converted</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-slate-700 font-bold mb-1">Address</label>
                      <input
                        type="text"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        placeholder="Street, Office suite, Landmark..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-slate-700 font-bold mb-1">Notes / Remarks</label>
                      <textarea
                        rows={2}
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Additional inquiry notes, call logs, requirements..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Sticky Action Bar */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsLeadModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
                  >
                    {editingLead ? 'Update Lead' : 'Save Lead Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SCHEDULE FOLLOW-UP MODAL (CRM FOLLOW-UP SYSTEM)             */}
        {/* ------------------------------------------------------------- */}
        {isFollowUpModalOpen && selectedLeadForFollowUp && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsFollowUpModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-blue-600" /> Schedule CRM Follow-up Call
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFollowUp} className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                  <span className="font-semibold text-blue-700">Target Lead:</span>{' '}
                  <span className="font-bold">{selectedLeadForFollowUp.companyName || selectedLeadForFollowUp.leadName}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Follow-up Date *</label>
                    <input
                      type="date"
                      required
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Time *</label>
                    <input
                      type="text"
                      required
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      placeholder="11:00 AM"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 font-medium focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Call Purpose *</label>
                  <input
                    type="text"
                    required
                    value={followUpPurpose}
                    onChange={(e) => setFollowUpPurpose(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Follow-up Agenda / Notes</label>
                  <textarea
                    rows={2}
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="Discuss bulk order quotation terms..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsFollowUpModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
                  >
                    Schedule Reminder
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
