'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
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
  Trash2,
  ExternalLink,
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
  { key: 'contactDate', label: 'Contact Date', placeholder: 'YYYY-MM-DD', type: 'date' },
  { key: 'contactTime', label: 'Contact Time', placeholder: 'e.g. 11:30 AM' },
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
    deleteLead,
    clearAllLeads,
    createFollowUpFull,
    updateFollowUpStatusFull,
    activeRole,
    currentUser,
    scopedSalesperson,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [completenessFilter, setCompletenessFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

  // Clear All & Single Delete Confirmation Modals
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const [formStatus, setFormStatus] = useState<LeadStatus>('Not Contacted');
  const [formContactDate, setFormContactDate] = useState('');
  const [formContactTime, setFormContactTime] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Quick Contact Timing Modal State
  const [isContactTimeModalOpen, setIsContactTimeModalOpen] = useState(false);
  const [selectedLeadForContactTime, setSelectedLeadForContactTime] = useState<Lead | null>(null);
  const [quickContactDate, setQuickContactDate] = useState('');
  const [quickContactTime, setQuickContactTime] = useState('');

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
    // Individual Salesperson Scoping
    if (scopedSalesperson) {
      const sp = (l.salesperson || l.assignedUser || '').toLowerCase().trim();
      const myName = scopedSalesperson.toLowerCase().trim();
      if (sp !== myName) {
        return false;
      }
    }

    const q = searchQuery.toLowerCase();
    const matchSearch =
      (l.leadName || '').toLowerCase().includes(q) ||
      (l.companyName || '').toLowerCase().includes(q) ||
      (l.contactPerson || '').toLowerCase().includes(q) ||
      (l.leadNumber || '').toLowerCase().includes(q) ||
      (l.mobile || '').includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.city || '').toLowerCase().includes(q) ||
      (l.requirement || '').toLowerCase().includes(q) ||
      (l.salesperson || '').toLowerCase().includes(q) ||
      (l.contactDate || '').toLowerCase().includes(q);

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'Not Contacted' ? (l.status === 'Not Contacted' || l.status === 'New') : l.status === statusFilter);
    const matchSource = sourceFilter === 'ALL' || l.source === sourceFilter;

    let matchCompleteness = true;
    if (completenessFilter === 'COMPLETE') {
      matchCompleteness = getLeadProfileAudit(l).missing.length === 0;
    } else if (completenessFilter === 'INCOMPLETE') {
      matchCompleteness = getLeadProfileAudit(l).missing.length > 0;
    }

    // Date-wise Filter
    let matchDate = true;
    const leadDate = l.createdAt ? l.createdAt.split('T')[0] : '';
    if (datePreset !== 'ALL' || dateFrom || dateTo) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (datePreset === 'TODAY') {
        matchDate = leadDate === todayStr;
      } else if (datePreset === 'YESTERDAY') {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        const yestStr = yest.toISOString().split('T')[0];
        matchDate = leadDate === yestStr;
      } else if (datePreset === 'LAST_7') {
        const d7 = new Date(now);
        d7.setDate(d7.getDate() - 7);
        const d7Str = d7.toISOString().split('T')[0];
        matchDate = leadDate >= d7Str && leadDate <= todayStr;
      } else if (datePreset === 'THIS_MONTH') {
        const ym = todayStr.substring(0, 7);
        matchDate = leadDate.startsWith(ym);
      } else if (datePreset === 'CUSTOM') {
        if (dateFrom && dateTo) {
          matchDate = leadDate >= dateFrom && leadDate <= dateTo;
        } else if (dateFrom) {
          matchDate = leadDate >= dateFrom;
        } else if (dateTo) {
          matchDate = leadDate <= dateTo;
        }
      }
      if (dateFrom && leadDate && leadDate < dateFrom) matchDate = false;
      if (dateTo && leadDate && leadDate > dateTo) matchDate = false;
    }

    return matchSearch && matchStatus && matchSource && matchCompleteness && matchDate;
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
    setFormSalesperson(scopedSalesperson || (activeRole === 'ADMIN' ? 'Administrator' : 'Rajesh Kumar'));
    setFormWebsite('');
    setFormRequirement('');
    if (products.length > 0) setFormProductId(products[0].id);
    setFormExpectedValue('100000');
    setFormStatus('Not Contacted');
    setFormContactDate('');
    setFormContactTime('');
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
    setFormStatus(l.status === 'New' ? 'Not Contacted' : (l.status as LeadStatus));
    setFormContactDate(l.contactDate || '');
    setFormContactTime(l.contactTime || '');
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
  const handleSaveCompletedProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForProfile) return;

    const updates: Partial<Lead> = {
      leadNumber: selectedLeadForProfile.leadNumber,
    };
    KEY_PROFILE_FIELDS.forEach((f) => {
      const val = profileFormData[f.key];
      if (val !== undefined) {
        (updates as any)[f.key] = val.trim();
      }
    });

    try {
      await updateLeadFull(selectedLeadForProfile.id, updates);
      showToast(`Lead "${profileFormData.leadName || selectedLeadForProfile.leadName}" profile updated and saved to database.`);
    } catch {
      showToast(`Profile updated.`);
    }
    setIsProfileModalOpen(false);
  };

  // Save Lead (Add / Edit)
  const handleSaveLead = async (e: React.FormEvent) => {
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
      contactDate: formContactDate.trim() || (formStatus === 'Contacted' ? new Date().toISOString().split('T')[0] : undefined),
      contactTime: formContactTime.trim() || (formStatus === 'Contacted' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined),
      notes: formNotes.trim(),
    };

    if (editingLead) {
      await updateLeadFull(editingLead.id, {
        leadNumber: editingLead.leadNumber,
        ...leadPayload,
      });
      showToast(`Lead "${formLeadName}" updated and saved to database.`);
    } else {
      await createLeadFull(leadPayload);
      showToast(`New Lead "${formLeadName}" created and saved to database.`);
    }

    setIsLeadModalOpen(false);
  };

  // Open Quick Contact Timing Modal
  const handleOpenContactTimeModal = (l: Lead) => {
    setSelectedLeadForContactTime(l);
    setQuickContactDate(l.contactDate || new Date().toISOString().split('T')[0]);
    setQuickContactTime(l.contactTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setIsContactTimeModalOpen(true);
  };

  // Save Quick Contact Timing
  const handleSaveContactTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForContactTime) return;

    const nextStatus = selectedLeadForContactTime.status === 'Not Contacted' || selectedLeadForContactTime.status === 'New'
      ? 'Contacted'
      : selectedLeadForContactTime.status;

    await updateLeadFull(selectedLeadForContactTime.id, {
      leadNumber: selectedLeadForContactTime.leadNumber,
      contactDate: quickContactDate.trim() || undefined,
      contactTime: quickContactTime.trim() || undefined,
      status: nextStatus,
    });

    showToast(`✓ Contact timing recorded for "${selectedLeadForContactTime.companyName || selectedLeadForContactTime.leadName}": ${quickContactDate} at ${quickContactTime}`);
    setIsContactTimeModalOpen(false);
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
      companyName: selectedLeadForFollowUp.companyName,
      contactPerson: selectedLeadForFollowUp.contactPerson,
      mobile: selectedLeadForFollowUp.mobile,
      alternateMobile: selectedLeadForFollowUp.alternateMobile,
      email: selectedLeadForFollowUp.email,
      city: selectedLeadForFollowUp.city,
      state: selectedLeadForFollowUp.state,
      address: selectedLeadForFollowUp.address,
      requirement: selectedLeadForFollowUp.requirement,
      expectedValue: selectedLeadForFollowUp.expectedValue,
    });

    updateLeadFull(selectedLeadForFollowUp.id, {
      leadNumber: selectedLeadForFollowUp.leadNumber,
      status: 'Follow-up',
    });

    showToast(`Follow-up scheduled for ${selectedLeadForFollowUp.companyName || selectedLeadForFollowUp.leadName} & status updated to Follow-up.`);
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

  // Delete Single Lead Handler
  const handleDeleteLeadConfirm = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteLead(leadToDelete.id);
      if (res.success) {
        showToast('Lead deleted successfully from database.');
      } else {
        showToast(res.message || 'Failed to delete lead.');
      }
    } catch {
      showToast('Error deleting lead.');
    } finally {
      setIsDeleting(false);
      setLeadToDelete(null);
    }
  };

  // Clear All Leads Handler
  const handleClearAllLeadsConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await clearAllLeads();
      if (res.success) {
        showToast('All CRM leads and import history cleared from database.');
      } else {
        showToast(res.message || 'Failed to clear leads.');
      }
    } catch {
      showToast('Error clearing leads.');
    } finally {
      setIsDeleting(false);
      setIsClearAllModalOpen(false);
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
      case 'Not Contacted':
      case 'New':
        return 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400';
      case 'Contacted':
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:border-blue-400';
      case 'Follow-up':
        return 'bg-amber-100 text-amber-800 border-amber-300 hover:border-amber-400';
      case 'Interested':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:border-emerald-400';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const handleQuickStatusChange = (l: Lead, newStatus: LeadStatus) => {
    const updates: Partial<Lead> = { leadNumber: l.leadNumber, status: newStatus };
    if (newStatus === 'Contacted') {
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!l.contactDate) updates.contactDate = today;
      if (!l.contactTime) updates.contactTime = nowTime;
    }
    updateLeadFull(l.id, updates);
    if (newStatus === 'Follow-up') {
      showToast(`✓ Lead "${l.companyName || l.leadName}" updated to Follow-up — recorded with all details in Follow-ups!`);
    } else if (newStatus === 'Contacted') {
      showToast(`✓ Lead "${l.companyName || l.leadName}" marked Contacted — contact date & time recorded!`);
    } else if (newStatus === 'Interested') {
      showToast(`✓ Lead "${l.companyName || l.leadName}" marked as Interested!`);
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

            {/* Clear All Leads Button */}
            {leads.length > 0 && (
              <button
                onClick={() => setIsClearAllModalOpen(true)}
                title="Reduce / clear all leads from database"
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Trash2 className="w-4 h-4 text-rose-600" /> Clear All Data
              </button>
            )}

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

        {/* Individual Salesperson Scope Notification */}
        {scopedSalesperson && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
              <span>
                <strong>Personal Lead Pipeline:</strong> Only showing leads assigned to <strong>{scopedSalesperson}</strong> ({filteredLeads.length} records).
              </span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-800">
              Personal Scope
            </span>
          </div>
        )}

        {/* PENDING FOLLOW-UPS NOTIFICATION (Compact single row) */}
        {pendingFollowups.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-2 flex items-center justify-between text-xs shadow-2xs">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
              <span>
                <strong className="text-blue-900">{pendingFollowups.length} CRM Follow-ups scheduled</strong>
                {pendingFollowups[0] && (
                  <span className="text-slate-600 ml-1.5 hidden sm:inline">
                    — Next: <strong>{pendingFollowups[0].leadOrCustomerName}</strong> on {pendingFollowups[0].followUpDate} at {pendingFollowups[0].followUpTime}
                  </span>
                )}
              </span>
            </div>
            <Link
              href="/sales/follow-ups"
              className="text-blue-700 hover:text-blue-900 font-bold hover:underline flex items-center gap-1 text-[11px] shrink-0"
            >
              <span>Follow-ups Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
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

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                <Filter className="w-3.5 h-3.5 text-slate-500" /> Filters:
              </div>

              {/* Date Filter Preset */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <select
                  value={datePreset}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setDatePreset(val);
                    if (val !== 'CUSTOM') {
                      setDateFrom('');
                      setDateTo('');
                    }
                  }}
                  className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
                  title="Filter leads by date"
                >
                  <option value="ALL">All Dates</option>
                  <option value="TODAY">Created Today</option>
                  <option value="YESTERDAY">Created Yesterday</option>
                  <option value="LAST_7">Last 7 Days</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="CUSTOM">Custom Date Range...</option>
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="Not Contacted">Not Contacted</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Interested">Interested</option>
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

          {/* Custom Date Range Picker Row */}
          {(datePreset === 'CUSTOM' || dateFrom || dateTo) && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Filter Date Range:
              </span>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-600 font-medium">From:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setDatePreset('CUSTOM');
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:bg-white focus:border-blue-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-600 font-medium">To:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setDatePreset('CUSTOM');
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:bg-white focus:border-blue-600"
                />
              </div>
              <button
                onClick={() => {
                  setDatePreset('ALL');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <X className="w-3 h-3" /> Reset Date
              </button>
            </div>
          )}

          {/* Active Filter Indicators Bar */}
          {(searchQuery || statusFilter !== 'ALL' || sourceFilter !== 'ALL' || completenessFilter !== 'ALL' || datePreset !== 'ALL' || dateFrom || dateTo) && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  Showing {filteredLeads.length} of {leads.length} leads
                </span>
                {datePreset !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                    Date: {datePreset === 'CUSTOM' ? `${dateFrom || 'start'} → ${dateTo || 'now'}` : datePreset}
                  </span>
                )}
                {statusFilter !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                    Status: {statusFilter}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setSourceFilter('ALL');
                  setCompletenessFilter('ALL');
                  setDatePreset('ALL');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Lead Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-hidden">
            <table className="w-full text-left text-xs table-fixed">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-2.5 px-3 w-[10%]">Lead ID</th>
                  <th className="py-2.5 px-3 w-[20%]">Company & POC</th>
                  <th className="py-2.5 px-3 w-[15%]">Contact Details</th>
                  <th className="py-2.5 px-3 w-[17%]">Location & Req</th>
                  <th className="py-2.5 px-3 w-[14%]">Salesperson</th>
                  <th className="py-2.5 px-2 text-center w-[12%]">Status</th>
                  <th className="py-2.5 px-2 text-center w-[12%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((l) => {
                  const audit = getLeadProfileAudit(l);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition">
                      {/* Lead ID */}
                      <td className="py-2 px-3 font-mono text-blue-600 font-bold whitespace-nowrap">
                        <div>{l.leadNumber}</div>
                        <div className="text-[10px] text-slate-500 font-sans font-medium flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5 text-slate-400" />
                          {l.createdAt ? l.createdAt.split('T')[0] : 'N/A'}
                        </div>
                      </td>

                      {/* Company & POC */}
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900 leading-tight">{l.companyName || l.leadName}</div>
                        {l.contactPerson && l.contactPerson !== l.companyName && (
                          <div className="text-[11px] text-slate-500 font-medium truncate">POC: {l.contactPerson}</div>
                        )}
                        {audit.missing.length === 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-semibold mt-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> 100% Complete
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenProfileModal(l)}
                            className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 hover:text-amber-900 font-semibold hover:underline mt-0.5 text-left"
                            title="Click to complete missing details"
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            <span>{audit.missing.length} missing ({audit.percent}%)</span>
                          </button>
                        )}
                      </td>

                      {/* Contact Details */}
                      <td className="py-2 px-3">
                        {l.mobile ? (
                          <div className="text-slate-900 font-mono font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {l.mobile}
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-600 italic">No mobile</div>
                        )}
                        {l.email ? (
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" /> {l.email}
                          </div>
                        ) : null}
                      </td>

                      {/* Location & Requirement */}
                      <td className="py-2 px-3">
                        {(l.city || l.state) && (
                          <div className="text-slate-800 font-medium flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {[l.city, l.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                        {l.requirement ? (
                          <div className="text-[11px] text-slate-600 truncate mt-0.5" title={l.requirement}>
                            <span className="font-semibold text-slate-700">Req:</span> {l.requirement}
                          </div>
                        ) : (
                          !l.city && !l.state && <span className="text-[11px] text-slate-400 italic">No location</span>
                        )}
                      </td>

                      {/* Salesperson & Contact Time */}
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900 flex items-center justify-between gap-1">
                          <span className="truncate">{l.salesperson || l.assignedUser || 'Sales Team'}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenContactTimeModal(l)}
                            title="Set Contact Date & Time"
                            className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {l.contactDate ? (
                          <button
                            type="button"
                            onClick={() => handleOpenContactTimeModal(l)}
                            className="text-[10px] text-blue-800 font-semibold flex items-center gap-1 mt-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5 text-left transition shadow-2xs group"
                            title="Click to edit contact timing"
                          >
                            <Calendar className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                            <span>{l.contactDate}</span>
                            {l.contactTime && (
                              <>
                                <span className="text-blue-300">•</span>
                                <Clock className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                <span>{l.contactTime}</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenContactTimeModal(l)}
                            className="text-[10px] text-slate-400 hover:text-blue-600 hover:underline italic mt-0.5 flex items-center gap-1 text-left transition"
                            title="Click to record contact date & time"
                          >
                            <Clock className="w-2.5 h-2.5" /> + Log Contact Time
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-2 text-center overflow-hidden">
                        <div className="inline-flex flex-col items-center gap-1 max-w-full">
                          <select
                            value={l.status === 'New' ? 'Not Contacted' : l.status}
                            onChange={(e) => handleQuickStatusChange(l, e.target.value as LeadStatus)}
                            className={`max-w-full px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer focus:outline-none transition shadow-2xs ${getStatusBadge(l.status)}`}
                            title="Click to update lead status"
                          >
                            <option value="Not Contacted">Not Contacted</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Interested">Interested</option>
                          </select>
                          {l.status === 'Follow-up' && (
                            <Link
                              href={`/sales/follow-ups?search=${encodeURIComponent(l.leadNumber || l.companyName || l.leadName || '')}&tab=ALL`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-[9px] font-bold transition shadow-2xs whitespace-nowrap"
                              title="Display this lead with complete data in Follow-up page"
                            >
                              <span>Follow-up</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-2 text-center overflow-hidden">
                        <div className="flex items-center justify-center gap-1">
                          {/* Profile Details Button (view & edit full details) */}
                          <button
                            type="button"
                            onClick={() => handleOpenProfileModal(l)}
                            title="View & Edit Lead Details"
                            className="p-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Convert to Customer */}
                          {l.status !== 'Converted' && (
                            <button
                              type="button"
                              onClick={() => handleConvertLead(l)}
                              title="Convert Lead to Customer Account"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                            </button>
                          )}

                          {/* Delete Lead */}
                          <button
                            type="button"
                            onClick={() => setLeadToDelete(l)}
                            title="Delete Lead"
                            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-800 hover:bg-rose-100 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500 text-xs font-medium">
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
                        value={formStatus === 'New' ? 'Not Contacted' : formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      >
                        <option value="Not Contacted">Not Contacted</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Interested">Interested</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" /> Contact Date
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormContactDate(new Date().toISOString().split('T')[0])}
                          className="text-[10px] text-blue-600 font-semibold hover:underline"
                        >
                          Today
                        </button>
                      </div>
                      <input
                        type="date"
                        value={formContactDate}
                        onChange={(e) => setFormContactDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> Contact Time
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormContactTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                          className="text-[10px] text-blue-600 font-semibold hover:underline"
                        >
                          Now
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 11:30 AM"
                        value={formContactTime}
                        onChange={(e) => setFormContactTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
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

        {/* CLEAR ALL LEADS CONFIRMATION MODAL */}
        {isClearAllModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Reduce / Clear All Leads Data?</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  This action will permanently delete all <strong className="text-rose-700">{leads.length} lead records</strong> and all lead import histories from the database.
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-[11px] text-amber-800 mb-6 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Existing converted customers, sales orders, and invoices in other modules will remain intact.</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setIsClearAllModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleClearAllLeadsConfirm}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Clearing Data...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" /> Yes, Clear All Leads
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SINGLE LEAD DELETE CONFIRMATION MODAL */}
        {leadToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Delete Lead</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Are you sure you want to permanently delete lead:
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs mb-5">
                  <div className="font-bold text-slate-900">{leadToDelete.companyName || leadToDelete.leadName}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {leadToDelete.leadNumber} | Mobile: {leadToDelete.mobile || 'N/A'}</div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setLeadToDelete(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteLeadConfirm}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" /> Delete Lead
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUICK CONTACT DATE & TIME MODAL */}
        {isContactTimeModalOpen && selectedLeadForContactTime && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsContactTimeModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Log Salesperson Contact Timing</h3>
                    <p className="text-[11px] text-blue-100 truncate max-w-[260px]">
                      {selectedLeadForContactTime.companyName || selectedLeadForContactTime.leadName} ({selectedLeadForContactTime.leadNumber})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsContactTimeModalOpen(false)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveContactTime} className="p-6 space-y-4">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Record salesperson contact timing:</div>
                    <div className="text-[11px] text-blue-700 mt-0.5">
                      Salesperson: <strong>{selectedLeadForContactTime.salesperson || selectedLeadForContactTime.assignedUser || 'Sales Team'}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Contact Date *
                    </label>
                    <button
                      type="button"
                      onClick={() => setQuickContactDate(new Date().toISOString().split('T')[0])}
                      className="text-[11px] text-blue-600 font-bold hover:underline"
                    >
                      Set Today
                    </button>
                  </div>
                  <input
                    type="date"
                    required
                    value={quickContactDate}
                    onChange={(e) => setQuickContactDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> Contact Time *
                    </label>
                    <button
                      type="button"
                      onClick={() => setQuickContactTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                      className="text-[11px] text-blue-600 font-bold hover:underline"
                    >
                      Set Current Time
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 11:30 AM or 15:45"
                    value={quickContactTime}
                    onChange={(e) => setQuickContactTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsContactTimeModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Save Contact Timing
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
