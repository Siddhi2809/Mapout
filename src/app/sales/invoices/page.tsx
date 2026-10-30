'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { SalesInvoice } from '@/types/erp';
import { numberToIndianWords } from '@/lib/numberToWords';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Printer,
  Eye,
  Plus,
  Building2,
  CreditCard,
  Send,
  Factory,
  Package,
  Image as ImageIcon,
  ShieldCheck,
  ArrowRight,
  DollarSign,
  Lock,
  Sparkles,
  ExternalLink,
  Receipt,
  PhoneCall,
  Clock,
  Layers,
  ChevronRight,
  Check,
  UploadCloud,
  FileUp,
  Download,
  FileCheck,
  Paperclip,
  Calendar,
  MapPin,
} from 'lucide-react';

// Indian GST State Codes Reference
const INDIAN_STATE_CODES: Record<string, string> = {
  'JAMMU AND KASHMIR': '01',
  'HIMACHAL PRADESH': '02',
  'PUNJAB': '03',
  'CHANDIGARH': '04',
  'UTTARAKHAND': '05',
  'HARYANA': '06',
  'DELHI': '07',
  'RAJASTHAN': '08',
  'UTTAR PRADESH': '09',
  'BIHAR': '10',
  'SIKKIM': '11',
  'ARUNACHAL PRADESH': '12',
  'NAGALAND': '13',
  'MANIPUR': '14',
  'MIZORAM': '15',
  'TRIPURA': '16',
  'MEGHALAYA': '17',
  'ASSAM': '18',
  'WEST BENGAL': '19',
  'JHARKHAND': '20',
  'ODISHA': '21',
  'CHHATTISGARH': '22',
  'MADHYA PRADESH': '23',
  'GUJARAT': '24',
  'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': '26',
  'MAHARASHTRA': '27',
  'ANDHRA PRADESH': '37',
  'KARNATAKA': '29',
  'GOA': '30',
  'LAKSHADWEEP': '31',
  'KERALA': '32',
  'TAMIL NADU': '33',
  'PUDUCHERRY': '34',
  'ANDAMAN AND NICOBAR ISLANDS': '35',
  'TELANGANA': '36',
  'LADAKH': '38',
};

function formatInvoiceDate(d?: string | Date): string {
  if (!d) return '12-May-26';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

export default function InvoicesPage() {
  const {
    invoices,
    salesOrders,
    quotations,
    customers,
    createInvoiceFromSO,
    sendInvoiceToProduction,
    updateInvoiceStatus,
    createCustomerPaymentFull,
    uploadCustomerPaymentProof,
    generateEntityCode,
    activeRole,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [productionFilter, setProductionFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');

  // Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUploadProofModalOpen, setIsUploadProofModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<SalesInvoice | null>(null);
  const [proofTargetInvoice, setProofTargetInvoice] = useState<SalesInvoice | null>(null);
  const [selectedSoId, setSelectedSoId] = useState('');

  // Payment Proof Upload Form State
  const [proofType, setProofType] = useState<string>('Payment Screenshot');
  const [proofMode, setProofMode] = useState<'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'Other'>('UPI');
  const [proofAmount, setProofAmount] = useState<number>(0);
  const [proofDate, setProofDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [proofRef, setProofRef] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [proofFiles, setProofFiles] = useState<Array<{ name: string; url: string; type: string; size?: number }>>([]);
  const [sendToProductionImmediately, setSendToProductionImmediately] = useState<boolean>(true);
  const [isSubmittingProof, setIsSubmittingProof] = useState<boolean>(false);

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payMode, setPayMode] = useState<'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other'>('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Preview Image Modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Find linked SalesOrder for an invoice to get live production status & images
  const getLinkedOrder = (inv: SalesInvoice) => {
    return salesOrders.find(
      (so) =>
        so.invoiceId === inv.id ||
        (inv.salesOrderId && so.id === inv.salesOrderId) ||
        (so.orderNumber && so.orderNumber === inv.salesOrderNumber) ||
        (inv.quotationId && so.quotationId === inv.quotationId)
    );
  };

  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    invoices.forEach((inv) => {
      const cust = customers.find((c) => c.id === inv.customerId);
      const cCity = cust?.city || '';
      if (cCity) citySet.add(cCity);
    });
    customers.forEach((c) => {
      if (c.city && c.city.trim()) citySet.add(c.city.trim());
    });
    return Array.from(citySet).sort();
  }, [invoices, customers]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.customerNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.quotationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPayment = paymentFilter === 'ALL' || inv.paymentStatus === paymentFilter;

      let matchProd = true;
      if (productionFilter !== 'ALL') {
        const linked = getLinkedOrder(inv);
        const pStatus = inv.productionStatus || linked?.productionStatus || 'Not Sent';
        matchProd = pStatus === productionFilter;
      }

      // Date Filter
      const iDate = (inv.invoiceDate || '').split('T')[0];
      const matchStartDate = !startDate || iDate >= startDate;
      const matchEndDate = !endDate || iDate <= endDate;

      // City Filter
      let matchCity = true;
      if (cityFilter !== 'ALL') {
        const cust = customers.find((c) => c.id === inv.customerId);
        const cCity = (cust?.city || '').toLowerCase();
        const bAddress = (inv.billingAddress || '').toLowerCase();
        matchCity = cCity === cityFilter.toLowerCase() || bAddress.includes(cityFilter.toLowerCase());
      }

      return matchSearch && matchPayment && matchProd && matchStartDate && matchEndDate && matchCity;
    });
  }, [invoices, searchQuery, paymentFilter, productionFilter, startDate, endDate, cityFilter, customers, salesOrders]);

  // Invoice Statistics
  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((i) => i.paymentStatus === 'Paid' || i.invoiceStatus === 'Payment Completed').length;
    const pendingPayment = invoices.filter((i) => i.paymentStatus !== 'Paid' && i.invoiceStatus !== 'Payment Completed').length;
    const sentToProduction = invoices.filter((i) => {
      const linked = getLinkedOrder(i);
      return i.productionStatus === 'Sent to Production' || linked?.orderStatus === 'Sent to Production' || linked?.productionStatus === 'Sent to Production';
    }).length;
    return { total, paid, pendingPayment, sentToProduction };
  }, [invoices, salesOrders]);

  const handleOpenViewModal = (inv: SalesInvoice) => {
    setSelectedInvoice(inv);
    setIsViewModalOpen(false); // reset
    setTimeout(() => {
      setSelectedInvoice(inv);
      setIsViewModalOpen(true);
    }, 10);
  };

  const handleOpenGenerateModal = () => {
    if (salesOrders.length > 0) setSelectedSoId(salesOrders[0].id);
    setIsGenerateModalOpen(true);
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSoId) return;

    const res = createInvoiceFromSO(selectedSoId);
    if (!res.success) {
      showToast('error', res.message || 'Failed to generate invoice.');
    } else {
      showToast('success', 'New GST Tax Invoice generated successfully from Sales Order.');
      setIsGenerateModalOpen(false);
    }
  };

  // Open Quick Payment Modal
  const handleOpenPaymentModal = (inv: SalesInvoice) => {
    setPaymentTargetInvoice(inv);
    setPayAmount(inv.outstandingAmount > 0 ? inv.outstandingAmount : 0);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMode('Bank Transfer');
    setPayRef(`TXN-${Date.now().toString().slice(-6)}`);
    setPayNotes(`Payment received for Invoice ${inv.invoiceNumber}`);
    setIsPaymentModalOpen(true);
  };

  // Handle Save Payment
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetInvoice) return;

    if (payAmount <= 0) {
      showToast('error', 'Payment amount must be greater than ₹0.');
      return;
    }

    const res = createCustomerPaymentFull({
      customerId: paymentTargetInvoice.customerId,
      customerName: paymentTargetInvoice.customerName,
      customerNumber: paymentTargetInvoice.customerNumber,
      invoiceId: paymentTargetInvoice.id,
      invoiceNumber: paymentTargetInvoice.invoiceNumber,
      amount: Number(payAmount),
      paymentDate: payDate,
      paymentMode: payMode,
      referenceNumber: payRef || 'N/A',
      notes: payNotes,
      status: 'Completed',
    });

    if (res.success) {
      const remaining = Math.max(0, paymentTargetInvoice.outstandingAmount - payAmount);
      if (remaining === 0) {
        showToast(
          'success',
          `✓ Payment of ₹${Number(payAmount).toLocaleString('en-IN')} recorded! Invoice ${paymentTargetInvoice.invoiceNumber} is now "Payment Completed" and UNLOCKED for Production.`
        );
      } else {
        showToast(
          'info',
          `✓ Partial payment of ₹${Number(payAmount).toLocaleString('en-IN')} recorded. Pending balance: ₹${remaining.toLocaleString('en-IN')}. Full payment required before sending to Production.`
        );
      }
      setIsPaymentModalOpen(false);
      setPaymentTargetInvoice(null);
    } else {
      showToast('error', res.message || 'Failed to record payment.');
    }
  };

  // Open Payment Proof Upload Modal
  const handleOpenUploadProofModal = (inv: SalesInvoice) => {
    setProofTargetInvoice(inv);
    setProofAmount(inv.outstandingAmount > 0 ? inv.outstandingAmount : inv.grandTotal);
    setProofDate(new Date().toISOString().split('T')[0]);
    setProofType('Payment Screenshot');
    setProofMode('UPI');
    setProofRef('');
    setProofNotes('');
    setProofFiles([]);
    setIsUploadProofModalOpen(true);
  };

  const handleProofFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const isAllowed =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/jpg' ||
        file.type === 'application/pdf' ||
        file.name.match(/\.(jpg|jpeg|png|pdf)$/i);
      if (!isAllowed) {
        showToast('error', `File ${file.name} is not allowed. Only JPG, JPEG, PNG, and PDF files are accepted.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const type = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');
          setProofFiles((prev) => [
            ...prev,
            { name: file.name, url: reader.result as string, type, size: file.size },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveProofFile = (index: number) => {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitProofUpload = async (e?: React.FormEvent, forceSendToProduction?: boolean) => {
    if (e) e.preventDefault();
    if (!proofTargetInvoice) return;

    if (proofFiles.length === 0) {
      showToast('error', 'Please upload at least one payment proof screenshot or receipt document (JPG, PNG, or PDF).');
      return;
    }

    if (proofAmount <= 0) {
      showToast('error', 'Payment amount must be greater than ₹0.');
      return;
    }

    const shouldSendToProd = forceSendToProduction !== undefined ? forceSendToProduction : sendToProductionImmediately;
    setIsSubmittingProof(true);

    try {
      const res = await uploadCustomerPaymentProof({
        invoiceId: proofTargetInvoice.id,
        amount: Number(proofAmount),
        paymentDate: proofDate,
        paymentMode: proofMode,
        referenceNumber: proofRef || `TXN-${Date.now().toString().slice(-6)}`,
        proofFiles: proofFiles.map((f) => JSON.stringify(f)),
        notes: `${proofType}: ${proofNotes || 'Payment proof uploaded by sales person.'}`,
        uploadedBy: activeRole === 'ADMIN' ? 'Administrator' : 'Sales Person',
        sendToProductionImmediately: shouldSendToProd,
      });

      if (res.success) {
        const fullAmount = proofTargetInvoice.grandTotal;
        if (shouldSendToProd) {
          showToast(
            'success',
            `✓ Payment proof saved in database! Payment status marked as "Paid" (₹${fullAmount.toLocaleString('en-IN')}) & sent to Production successfully!`
          );
        } else {
          showToast(
            'success',
            `✓ Payment proof saved in database! Payment status marked as "Paid" (₹${fullAmount.toLocaleString('en-IN')}). Proof option removed.`
          );
        }

        if (selectedInvoice && selectedInvoice.id === proofTargetInvoice.id) {
          setSelectedInvoice((prev) =>
            prev
              ? {
                  ...prev,
                  paidAmount: fullAmount,
                  outstandingAmount: 0,
                  paymentStatus: 'Paid',
                  invoiceStatus: 'Payment Completed',
                  paymentProofFiles: proofFiles.map((f) => JSON.stringify(f)),
                  paymentProofUploadedBy: activeRole === 'ADMIN' ? 'Administrator' : 'Sales Person',
                  paymentProofUploadedDate: new Date().toISOString(),
                  ...(shouldSendToProd && { productionStatus: 'Sent to Production' }),
                }
              : null
          );
        }
        setIsUploadProofModalOpen(false);
        setProofTargetInvoice(null);
      } else {
        showToast('error', res.message || 'Failed to upload payment proof.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save payment proof to database.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const parseProofFile = (item: string) => {
    try {
      if (item.startsWith('{')) {
        return JSON.parse(item);
      }
    } catch (e) {}
    const isPdf = item.includes('application/pdf') || item.toLowerCase().endsWith('.pdf');
    return {
      name: isPdf ? 'Payment_Document.pdf' : 'Payment_Screenshot.png',
      url: item,
      type: isPdf ? 'application/pdf' : 'image/png',
    };
  };

  // Handle Send Invoice to Production
  const handleSendToProduction = (inv: SalesInvoice) => {
    // Unlocked when Payment Proof is uploaded, verified, or payment completed
    const isEligible =
      inv.paymentStatus === 'Payment Proof Uploaded' ||
      inv.paymentStatus === 'Payment Verified' ||
      inv.paymentStatus === 'Payment Completed' ||
      inv.invoiceStatus === 'Payment Completed' ||
      (Array.isArray(inv.paymentProofFiles) && inv.paymentProofFiles.length > 0);

    if (!isEligible) {
      showToast(
        'error',
        `Production locked: Please upload payment proof first before sending to Production. Current status: "${inv.paymentStatus || 'Payment Pending'}".`
      );
      return;
    }

    const res = sendInvoiceToProduction(inv.id, activeRole === 'ADMIN' ? 'Administrator' : 'Sales Person');
    if (res.success) {
      showToast(
        'success',
        `✓ Invoice ${inv.invoiceNumber} successfully transferred to Production Team! Linked with Quote & Customer records.`
      );
      if (selectedInvoice && selectedInvoice.id === inv.id) {
        setSelectedInvoice((prev) => (prev ? { ...prev, productionStatus: 'Sent to Production' } : null));
      }
    } else {
      showToast('error', res.message || 'Failed to send invoice to production.');
    }
  };

  // Handle Send to Customer
  const handleSendToCustomer = (inv: SalesInvoice) => {
    const newStatus =
      inv.paymentStatus === 'Payment Completed' || inv.paymentStatus === 'Paid'
        ? 'Payment Completed'
        : 'Payment Pending';
    updateInvoiceStatus(inv.id, newStatus);
    showToast('success', `✓ Invoice ${inv.invoiceNumber} marked as "${newStatus}" and sent to customer.`);
    if (selectedInvoice && selectedInvoice.id === inv.id) {
      setSelectedInvoice((prev) => (prev ? { ...prev, invoiceStatus: newStatus as any } : null));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getPaymentBadge = (status?: string) => {
    switch (status) {
      case 'Payment Completed':
      case 'Paid':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      case 'Payment Verified':
        return 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
      case 'Payment Proof Uploaded':
        return 'bg-purple-50 text-purple-800 border-purple-300 font-bold';
      case 'Payment Rejected':
        return 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
      case 'Payment Pending':
      case 'Pending':
      case 'Unpaid':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      case 'Partially Paid':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300 font-bold';
      case 'Overdue':
        return 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';
    }
  };

  const getProductionBadge = (status?: string) => {
    switch (status) {
      case 'Sent to Production':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Production':
        return 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse';
      case 'Production Completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Packing':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Packed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Ready for Dispatch':
        return 'bg-cyan-50 text-cyan-800 border-cyan-300 font-bold';
      case 'Dispatched':
        return 'bg-teal-50 text-teal-800 border-teal-200 font-bold';
      case 'Completed':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <DashboardLayout roleTitle="Sales Management" roleBadge="Sales Manager" navItems={SALES_NAV}>
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`fixed top-20 right-8 z-50 px-4 py-3 rounded-xl text-white font-semibold text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600'
                : toastMessage.type === 'error'
                ? 'bg-rose-600'
                : 'bg-blue-600'
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

        {/* Workflow Pipeline Breadcrumb Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 text-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold tracking-wide">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Full Sales to Production Pipeline:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-300">
              <span className="opacity-70">1. Customer</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="opacity-70">2. Quotation</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="opacity-70">3. Follow-up</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="opacity-70">4. Customer Approval</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="text-white font-bold bg-white/20 px-2 py-0.5 rounded-md">5. Invoice</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="text-emerald-400 font-bold">6. Payment (100%)</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="text-amber-300 font-bold">7. Send to Production</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="opacity-70">8. Packing</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="opacity-70">9. Dispatch</span>
            </div>
          </div>
        </div>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tax Invoices & Payment Gate</h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Manage GST invoices generated from approved quotations, record customer payments, and unlock production upon 100% payment completion.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/sales/quotations"
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Receipt className="w-4 h-4" />
              <span>Approved Quotes →</span>
            </Link>
            <button
              onClick={handleOpenGenerateModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Generate Invoice from SO
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Invoices</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
            <div className="text-[10px] text-slate-500 mt-1">Generated tax invoices</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
              <span>Paid (Production Ready)</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{stats.paid}</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1">100% Payment Received</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
              <span>Payment Pending</span>
              <Lock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1">{stats.pendingPayment}</div>
            <div className="text-[10px] text-amber-700 font-semibold mt-1">Production Locked until paid</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs bg-blue-50/20">
            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center justify-between">
              <span>Sent to Production</span>
              <Factory className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700 mt-1">{stats.sentToProduction}</div>
            <div className="text-[10px] text-blue-700 font-semibold mt-1">Active in Production</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Invoice #, Customer, CUS-101, QT-101..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
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
                title="From Invoice Date"
              />
              <span className="text-slate-400 text-xs font-medium">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                title="To Invoice Date"
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
                <Filter className="w-3.5 h-3.5 text-slate-500" /> Payment:
              </div>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="ALL">All Payments</option>
                <option value="Paid">Paid (100%)</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Overdue">Overdue</option>
              </select>

              <div className="flex items-center gap-1.5 text-slate-600 font-semibold ml-1">
                <Factory className="w-3.5 h-3.5 text-slate-500" /> Production:
              </div>
              <select
                value={productionFilter}
                onChange={(e) => setProductionFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="ALL">All Stages</option>
                <option value="Not Sent">Not Sent</option>
                <option value="Sent to Production">Sent to Production</option>
                <option value="In Production">In Production</option>
                <option value="Packed">Packed</option>
                <option value="Ready for Dispatch">Ready for Dispatch</option>
              </select>

              {(startDate || endDate || cityFilter !== 'ALL' || paymentFilter !== 'ALL' || productionFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setCityFilter('ALL');
                    setPaymentFilter('ALL');
                    setProductionFilter('ALL');
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
              Showing <strong className="text-slate-800">{filteredInvoices.length}</strong> of {invoices.length} invoices
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Quotation Ref</th>
                  <th className="p-3.5 text-right font-bold">Grand Total</th>
                  <th className="p-3.5 text-right text-emerald-700">Paid</th>
                  <th className="p-3.5 text-right text-rose-700">Pending</th>
                  <th className="p-3.5 text-center">Payment Status</th>
                  <th className="p-3.5 text-center">Production Status</th>
                  <th className="p-3.5 text-center">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const linkedOrder = getLinkedOrder(inv);
                  // Production eligibility: Unlocked when Payment Proof is Uploaded, Verified, or Completed
                  const isPaymentCompleted =
                    inv.paymentStatus === 'Payment Completed' ||
                    inv.paymentStatus === 'Paid' ||
                    inv.paymentStatus === 'PAID' ||
                    inv.invoiceStatus === 'Payment Completed';

                  const hasProofOrPaid =
                    isPaymentCompleted ||
                    inv.paymentStatus === 'Payment Proof Uploaded' ||
                    inv.paymentStatus === 'Payment Verified' ||
                    (Array.isArray(inv.paymentProofFiles) && inv.paymentProofFiles.length > 0);

                  const prodStatus =
                    inv.productionStatus ||
                    linkedOrder?.productionStatus ||
                    (linkedOrder?.orderStatus === 'Sent to Production' ? 'Sent to Production' : 'Not Sent');

                  const isSentToProd =
                    prodStatus === 'Sent to Production' ||
                    prodStatus === 'In Production' ||
                    prodStatus === 'Production Completed' ||
                    prodStatus === 'Packing' ||
                    prodStatus === 'Packed' ||
                    prodStatus === 'Ready for Dispatch' ||
                    prodStatus === 'Dispatched' ||
                    prodStatus === 'Completed';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-mono text-blue-700 font-bold">{inv.invoiceNumber}</div>
                        {inv.invoiceStatus && (
                          <div className="text-[10px] text-slate-500 font-medium">{inv.invoiceStatus}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">{inv.invoiceDate}</td>
                      <td className="p-3.5 max-w-[200px]">
                        <div className="font-bold text-slate-900 truncate">{inv.customerName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {inv.customerNumber || 'CUS-101'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-purple-700 font-bold">
                        {inv.quotationNumber || inv.salesOrderNumber || '—'}
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-slate-900 font-mono text-sm">
                        ₹{inv.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-700 font-mono">
                        ₹{(hasProofOrPaid ? inv.grandTotal : inv.paidAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-500 font-mono">
                        ₹{(hasProofOrPaid ? 0 : inv.outstandingAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${getPaymentBadge(
                            hasProofOrPaid ? 'Paid' : (inv.paymentStatus || 'Payment Pending')
                          )}`}
                        >
                          {hasProofOrPaid ? 'Paid' : (inv.paymentStatus || 'Payment Pending')}
                        </span>
                        {inv.paymentProofFiles && inv.paymentProofFiles.length > 0 && (
                          <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Proof Attached</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getProductionBadge(
                            prodStatus
                          )}`}
                        >
                          {prodStatus}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* SEND INVOICE TO PRODUCTION: Rendered when Payment Proof is Uploaded, Verified, or Completed */}
                          {hasProofOrPaid ? (
                            !isSentToProd ? (
                              <button
                                onClick={() => handleSendToProduction(inv)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 cursor-pointer transition hover:scale-105 active:scale-95 animate-pulse"
                                title="Payment proof uploaded! Click to send Invoice to Production"
                              >
                                <Factory className="w-3.5 h-3.5" />
                                <span>Send to Production</span>
                              </button>
                            ) : (
                              <span
                                className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1"
                                title="Transferred to Production Team"
                              >
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>In Production</span>
                              </span>
                            )
                          ) : (
                            <div className="flex items-center gap-1 flex-wrap">
                              {/* Upload Payment Proof button */}
                              <button
                                onClick={() => handleOpenUploadProofModal(inv)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition hover:scale-105"
                                title="Upload Customer Payment Proof / Screenshot"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>Upload Payment Proof</span>
                              </button>
                              <span
                                className="p-1 text-slate-400 flex items-center"
                                title="Upload payment proof to unlock Send to Production"
                              >
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              </span>
                            </div>
                          )}

                          <button
                            onClick={() => handleOpenViewModal(inv)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                            title="View full tax invoice and payment proof details"
                          >
                            <Eye className="w-3 h-3 text-blue-600" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-500 text-xs font-medium">
                      No tax invoices matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK RECORD PAYMENT MODAL */}
        {isPaymentModalOpen && paymentTargetInvoice && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Record Customer Payment</h3>
                    <p className="text-[11px] text-slate-500">Record customer payment against Invoice {paymentTargetInvoice.invoiceNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-xs">
                {/* Invoice & Outstanding Balance Card */}
                <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-purple-900 font-bold">
                    <span>Invoice: {paymentTargetInvoice.invoiceNumber}</span>
                    <span className="font-mono text-xs">Total: ₹{paymentTargetInvoice.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-slate-600 flex items-center justify-between text-[11px]">
                    <span>Customer: <strong>{paymentTargetInvoice.customerName}</strong> ({paymentTargetInvoice.customerNumber || 'CUS-101'})</span>
                    <span>Paid So Far: ₹{paymentTargetInvoice.paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-purple-200 text-rose-700 font-bold">
                    <span>Pending Amount:</span>
                    <span className="font-mono text-sm">₹{paymentTargetInvoice.outstandingAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Amount (₹) *</label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max={paymentTargetInvoice.outstandingAmount}
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                      required
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => setPayAmount(paymentTargetInvoice.outstandingAmount)}
                      className="px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold cursor-pointer transition text-center"
                    >
                      Pay Full (₹{paymentTargetInvoice.outstandingAmount.toLocaleString('en-IN')})
                    </button>
                  </div>
                </div>

                {/* Live balance calculation preview */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Remaining Pending after this payment:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{Math.max(0, paymentTargetInvoice.outstandingAmount - payAmount).toLocaleString('en-IN')}
                    {paymentTargetInvoice.outstandingAmount - payAmount <= 0 && (
                      <span className="ml-2 text-emerald-600 font-bold">→ Status: Payment Completed ✓</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={payMode}
                      onChange={(e) => setPayMode(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600 font-medium"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Transaction Reference / UTR / Cheque Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR1029384756 or Cheque #987654"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Notes</label>
                  <input
                    type="text"
                    placeholder="Remarks or payment notes..."
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Payment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* GENERATE INVOICE FROM SO MODAL */}
        {isGenerateModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsGenerateModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Generate Tax Invoice from Order
                </h3>
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                  title="Close Form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGenerateInvoice} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Invoice Number <span className="text-slate-400 font-normal">(Auto-generated)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={generateEntityCode('INVOICE')}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-blue-700 font-mono focus:outline-none cursor-not-allowed opacity-90 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Confirmed Sales Order *</label>
                  <select
                    value={selectedSoId}
                    onChange={(e) => setSelectedSoId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  >
                    {salesOrders.map((so) => (
                      <option key={so.id} value={so.id}>
                        {so.orderNumber} - {so.customerName} (₹{so.grandTotal.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1 font-medium">
                  <div>* Auto-calculates Subtotal, 18% GST Tax Amount, and Grand Total.</div>
                  <div>* Links directly to Customer Account receivables ledger.</div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition cursor-pointer"
                  >
                    Generate Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRINTABLE GST INVOICE MODAL + PRODUCTION TRACKING */}
        {isViewModalOpen && selectedInvoice && (() => {
          const linkedOrder = getLinkedOrder(selectedInvoice);
          const isPaymentCompleted =
            selectedInvoice.paymentStatus === 'Payment Completed' ||
            selectedInvoice.paymentStatus === 'Paid' ||
            selectedInvoice.paymentStatus === 'PAID' ||
            selectedInvoice.invoiceStatus === 'Payment Completed';

          const hasProofOrPaid =
            isPaymentCompleted ||
            selectedInvoice.paymentStatus === 'Payment Proof Uploaded' ||
            selectedInvoice.paymentStatus === 'Payment Verified' ||
            (Array.isArray(selectedInvoice.paymentProofFiles) && selectedInvoice.paymentProofFiles.length > 0);

          const prodStatus =
            selectedInvoice.productionStatus ||
            linkedOrder?.productionStatus ||
            (linkedOrder?.orderStatus === 'Sent to Production' ? 'Sent to Production' : 'Not Sent');

          const isSentToProd =
            prodStatus === 'Sent to Production' ||
            prodStatus === 'In Production' ||
            prodStatus === 'Production Completed' ||
            prodStatus === 'Packing' ||
            prodStatus === 'Packed' ||
            prodStatus === 'Ready for Dispatch' ||
            prodStatus === 'Dispatched' ||
            prodStatus === 'Completed';

          const imagesToShow = selectedInvoice.packedImages || linkedOrder?.packedImages || [];
          const packNotes = selectedInvoice.packingNotes || linkedOrder?.packingNotes;
          const prodNotes = selectedInvoice.productionNotes || linkedOrder?.productionNotes;
          const sNum = selectedInvoice.serialNumber || linkedOrder?.serialNumber;
          const bNum = selectedInvoice.batchNumber || linkedOrder?.batchNumber;
          const wPeriod = selectedInvoice.warrantyPeriod || linkedOrder?.warrantyPeriod || '1 Year';

          return (
            <div
              className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsViewModalOpen(false);
              }}
            >
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl p-8 space-y-6 my-8 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
                {/* Actions Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-4 gap-3 print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono font-bold tracking-wider uppercase">
                      TAX INVOICE PREVIEW
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPaymentBadge(hasProofOrPaid ? 'Paid' : selectedInvoice.paymentStatus)}`}>
                      {hasProofOrPaid ? 'Paid' : (selectedInvoice.paymentStatus || 'Payment Pending')}
                    </span>
                    {selectedInvoice.invoiceStatus && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {hasProofOrPaid ? 'Payment Completed' : selectedInvoice.invoiceStatus}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Send to Customer Button */}
                    <button
                      onClick={() => handleSendToCustomer(selectedInvoice)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Customer</span>
                    </button>

                    {/* Upload Payment Proof Button - REMOVED after proof is uploaded or paid */}
                    {!hasProofOrPaid && (
                      <button
                        onClick={() => handleOpenUploadProofModal(selectedInvoice)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Payment Proof</span>
                      </button>
                    )}

                    {/* SEND INVOICE TO PRODUCTION: Rendered when Payment Proof is Uploaded, Verified, or Completed */}
                    {hasProofOrPaid && !isSentToProd && (
                      <button
                        onClick={() => handleSendToProduction(selectedInvoice)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer hover:scale-105 active:scale-95 animate-pulse"
                      >
                        <Factory className="w-4 h-4" />
                        <span>Send Invoice to Production</span>
                      </button>
                    )}

                    <button
                      onClick={handlePrint}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Print / PDF
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsViewModalOpen(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      title="Close Invoice"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* EXACT TAX INVOICE PAPER DOCUMENT CONTAINER (Matches Sunyash Multi Trading PDF) */}
                {(() => {
                  const cust = customers.find(
                    (c) =>
                      c.id === selectedInvoice.customerId ||
                      c.name === selectedInvoice.customerName ||
                      c.companyName === selectedInvoice.customerName
                  );
                  const linkedQuote = quotations.find(
                    (q) =>
                      q.id === selectedInvoice.quotationId ||
                      q.quotationNumber === selectedInvoice.quotationNumber
                  );

                  // Consignee and Buyer Details
                  const companyTitle = 'SUNYASH MULTI TRADING PVT LTD 26-27';
                  const consigneeName =
                    cust?.companyName ||
                    cust?.name ||
                    selectedInvoice.customerName ||
                    'Pathankot Vehicleades pvt. Ltd- Gurdaspur';
                  const consigneeAddress =
                    cust?.shippingAddress ||
                    cust?.address ||
                    selectedInvoice.billingAddress ||
                    'Batala Road , Jeevanwal babri gurdaspur,';
                  const consigneeCity = cust?.city || 'Gurdaspur';
                  const consigneePincode = cust?.pincode || '143521';
                  const consigneeState = cust?.state || 'Punjab';
                  const consigneeGstin =
                    selectedInvoice.gstNumber ||
                    cust?.gstin ||
                    cust?.gstNumber ||
                    '03AAACP9610Q1Z6';

                  let consigneeStateCode = '03';
                  if (consigneeGstin && consigneeGstin.length >= 2 && !isNaN(Number(consigneeGstin.slice(0, 2)))) {
                    consigneeStateCode = consigneeGstin.slice(0, 2);
                  } else if (consigneeState) {
                    consigneeStateCode = INDIAN_STATE_CODES[consigneeState.toUpperCase().trim()] || '03';
                  }

                  const buyerName = consigneeName;
                  const buyerAddress = consigneeAddress;
                  const buyerCity = consigneeCity;
                  const buyerPincode = consigneePincode;
                  const buyerState = consigneeState;
                  const buyerGstin = consigneeGstin;
                  const buyerStateCode = consigneeStateCode;
                  const placeOfSupply = buyerState;

                  // SUNYASH is in Maharashtra (Code 27). If buyer is outside Maharashtra => IGST 18%
                  const isInterstate = consigneeStateCode !== '27';

                  // Items breakdown
                  const rawItems =
                    selectedInvoice.items && Array.isArray(selectedInvoice.items) && selectedInvoice.items.length > 0
                      ? selectedInvoice.items
                      : linkedOrder?.items && linkedOrder.items.length > 0
                      ? linkedOrder.items.map((i) => ({
                          productName: i.productName,
                          sku: i.sku || 'SKU-01',
                          quantity: i.quantity,
                          rate: i.sellingPrice || i.unitPrice || 0,
                          subtotal: i.totalPrice,
                          hsn: '85369090',
                        }))
                      : [
                          {
                            productName: 'BOSCH OBD-II Male to DB 26 Female Cable(Universal Cable)',
                            sku: 'BOSCH-CBL-01',
                            quantity: 6,
                            rate: 2459.18,
                            subtotal: 14755.08,
                            hsn: '85369090',
                          },
                        ];

                  const invoiceItems = rawItems.map((item) => {
                    const qty = Number(item.quantity) || 1;
                    const rate = Number(item.rate) || 0;
                    const sub = Number(item.subtotal || (item as any).total || qty * rate);
                    return {
                      ...item,
                      quantity: qty,
                      rate,
                      subtotal: sub,
                      hsn: (item as any).hsn || '85369090',
                    };
                  });

                  const totalQty = invoiceItems.reduce((acc, it) => acc + it.quantity, 0);
                  const goodsTaxable = invoiceItems.reduce((acc, it) => acc + it.subtotal, 0);

                  // Freight charges
                  const freightAmount = Number(
                    (selectedInvoice as any).freightCharges ??
                    linkedQuote?.freightCharges ??
                    (selectedInvoice.subtotal > goodsTaxable ? selectedInvoice.subtotal - goodsTaxable : 0)
                  );

                  const totalTaxable = goodsTaxable + freightAmount;

                  // Tax amounts
                  const goodsIgst = isInterstate ? Math.round(goodsTaxable * 0.18 * 100) / 100 : 0;
                  const goodsCgst = !isInterstate ? Math.round(goodsTaxable * 0.09 * 100) / 100 : 0;
                  const goodsSgst = !isInterstate ? Math.round(goodsTaxable * 0.09 * 100) / 100 : 0;
                  const goodsTotalTax = isInterstate ? goodsIgst : goodsCgst + goodsSgst;

                  const freightIgst = freightAmount > 0 && isInterstate ? Math.round(freightAmount * 0.18 * 100) / 100 : 0;
                  const freightCgst = freightAmount > 0 && !isInterstate ? Math.round(freightAmount * 0.09 * 100) / 100 : 0;
                  const freightSgst = freightAmount > 0 && !isInterstate ? Math.round(freightAmount * 0.09 * 100) / 100 : 0;
                  const freightTotalTax = isInterstate ? freightIgst : freightCgst + freightSgst;

                  const totalIgst = goodsIgst + freightIgst;
                  const totalCgst = goodsCgst + freightCgst;
                  const totalSgst = goodsSgst + freightSgst;
                  const totalTax = isInterstate ? totalIgst : totalCgst + totalSgst;

                  const rawGrandTotal = totalTaxable + totalTax;
                  const grandTotal = Number(selectedInvoice.grandTotal) || Math.round(rawGrandTotal);
                  const roundingOff = Math.round((grandTotal - rawGrandTotal) * 100) / 100;

                  const invoiceNumber = selectedInvoice.invoiceNumber || 'SUN/26-27/83';
                  const invoiceDateFormatted = formatInvoiceDate(selectedInvoice.invoiceDate);
                  const paymentTerms =
                    (selectedInvoice as any).paymentTerms || cust?.paymentTerms || '100 % Advance';
                  const quotationNumber = selectedInvoice.quotationNumber || '';
                  const buyersOrderNo = selectedInvoice.salesOrderNumber || '';
                  const destination = `${consigneeCity} ${consigneeState}`;

                  const remarksStr =
                    sNum || bNum
                      ? `Sr.No. ${sNum || ''}${bNum ? ` / Batch: ${bNum}` : ''}`
                      : selectedInvoice.notes || 'Sr.No.375/360/373/381/367/385';

                  return (
                    <div className="space-y-6">
                      {/* PRINTABLE PAPER DOCUMENT */}
                      <div className="bg-white text-black font-sans border-2 border-black max-w-[850px] mx-auto text-[11px] leading-tight shadow-md print:shadow-none print:border-black print:max-w-none">
                        {/* TITLE: Tax Invoice */}
                        <div className="text-center font-bold text-sm py-1.5 border-b border-black tracking-wide">
                          Tax Invoice
                        </div>

                        {/* TOP SECTION: 50% / 50% split */}
                        <div className="grid grid-cols-2 border-b border-black divide-x divide-black">
                          {/* LEFT COLUMN: Seller, Consignee, Buyer */}
                          <div className="flex flex-col divide-y divide-black">
                            {/* Seller Company */}
                            <div className="p-2 space-y-0.5">
                              <div className="font-bold text-[12px]">{companyTitle}</div>
                              <div>B-5, 3rd Floor ,Devyani Height,Near Fortune</div>
                              <div>Building Kaspate Wasti Wakad Pune-411057</div>
                              <div>Contact:-9503009988</div>
                              <div>GSTIN/UIN: 27AAXCS4923Q1Z8</div>
                              <div>State Name : Maharashtra, Code : 27</div>
                            </div>

                            {/* Consignee (Ship to) */}
                            <div className="p-2 space-y-0.5">
                              <div className="text-[10px] text-slate-700 font-medium">Consignee (Ship to)</div>
                              <div className="font-bold text-[11px]">{consigneeName}</div>
                              <div>{consigneeAddress}</div>
                              <div>{consigneeCity} - {consigneePincode}</div>
                              <div>{consigneeState}</div>
                              <div className="flex">
                                <span className="w-24">GSTIN/UIN</span>
                                <span>: {consigneeGstin}</span>
                              </div>
                              <div className="flex">
                                <span className="w-24">State Name</span>
                                <span>: {consigneeState}, Code : {consigneeStateCode}</span>
                              </div>
                            </div>

                            {/* Buyer (Bill to) */}
                            <div className="p-2 space-y-0.5">
                              <div className="text-[10px] text-slate-700 font-medium">Buyer (Bill to)</div>
                              <div className="font-bold text-[11px]">{buyerName}</div>
                              <div>{buyerAddress}</div>
                              <div>{buyerCity} - {buyerPincode}</div>
                              <div>{buyerState}</div>
                              <div className="flex">
                                <span className="w-24">GSTIN/UIN</span>
                                <span>: {buyerGstin}</span>
                              </div>
                              <div className="flex">
                                <span className="w-24">State Name</span>
                                <span>: {buyerState}, Code : {buyerStateCode}</span>
                              </div>
                              <div className="flex">
                                <span className="w-24">Place of Supply</span>
                                <span>: {placeOfSupply}</span>
                              </div>
                            </div>
                          </div>

                          {/* RIGHT COLUMN: 7-Row Grid */}
                          <div className="flex flex-col divide-y divide-black text-[11px]">
                            {/* Row 1 */}
                            <div className="grid grid-cols-2 divide-x divide-black min-h-[38px]">
                              <div className="p-1.5">
                                <div className="text-[10px] text-slate-700">Invoice No.</div>
                                <div className="font-bold">{invoiceNumber}</div>
                              </div>
                              <div className="p-1.5">
                                <div className="text-[10px] text-slate-700">Dated</div>
                                <div className="font-bold">{invoiceDateFormatted}</div>
                              </div>
                            </div>

                            {/* Row 2 */}
                            <div className="grid grid-cols-2 divide-x divide-black min-h-[34px]">
                              <div className="p-1.5">
                                <div className="text-[10px] text-slate-700">Delivery Note</div>
                                <div>{(selectedInvoice as any).deliveryNote || ''}</div>
                              </div>
                              <div className="p-1.5">
                                <div className="text-[10px] text-slate-700">Mode/Terms of Payment</div>
                                <div className="font-bold">{paymentTerms}</div>
                              </div>
                            </div>

                            {/* Row 3 */}
                            <div className="grid grid-cols-2 divide-x divide-black min-h-[34px]">
                              <div className="p-1.5">
                                <div className="text-[10px] text-slate-700">Reference No. & Date.</div>
                                <div>{(selectedInvoice as any).referenceNo || ''}</div>
                              </div>
                              <div className="p-1.5">
                                <div className="text-[10px] text-slate-700">Other References</div>
                                <div>{quotationNumber || (selectedInvoice as any).otherReferences || ''}</div>
                              </div>
                            </div>

                            {/* Row 4 */}
                            <div className="grid grid-cols-2 divide-x divide-black min-h-[34px]">
                              <div className="p-1.5">
                                <div className="text-[10px] text-slate-700">Buyer’s Order No.</div>
                                <div className="font-bold">{buyersOrderNo}</div>
                              </div>
                              <div className="p-1.5">
                                <div className="text-[10px] text-slate-700">Dated</div>
                                <div>{invoiceDateFormatted}</div>
                              </div>
                            </div>

                            {/* Row 5 */}
                            <div className="grid grid-cols-2 divide-x divide-black min-h-[34px]">
                              <div className="p-1.5">
                                <div className="text-[10px] text-slate-700">Dispatch Doc No.</div>
                                <div>{(selectedInvoice as any).dispatchDocNo || linkedOrder?.trackingNumber || ''}</div>
                              </div>
                              <div className="p-1.5">
                                <div className="text-[10px] text-slate-700">Delivery Note Date</div>
                                <div>{(selectedInvoice as any).deliveryNoteDate || ''}</div>
                              </div>
                            </div>

                            {/* Row 6 */}
                            <div className="grid grid-cols-2 divide-x divide-black min-h-[34px]">
                              <div className="p-1.5">
                                <div className="text-[10px] text-slate-700">Dispatched through</div>
                                <div className="font-bold">Courier</div>
                              </div>
                              <div className="p-1.5">
                                <div className="text-[10px] text-slate-700">Destination</div>
                                <div className="font-bold">{destination}</div>
                              </div>
                            </div>

                            {/* Row 7 */}
                            <div className="p-1.5 min-h-[44px]">
                              <div className="text-[10px] text-slate-700">Terms of Delivery</div>
                              <div>{(selectedInvoice as any).termsOfDelivery || 'Ex Works : Sunyash Multi Trading'}</div>
                            </div>
                          </div>
                        </div>

                        {/* ITEMS TABLE */}
                        <div className="border-b border-black">
                          <table className="w-full border-collapse text-[11px]">
                            <thead>
                              <tr className="border-b border-black text-center font-bold">
                                <th className="p-1.5 w-10 border-r border-black">Sl<br/>No.</th>
                                <th className="p-1.5 w-24 border-r border-black text-left">Marks & Nos./<br/>Container No.</th>
                                <th className="p-1.5 border-r border-black text-center">Description of<br/>Goods and Services</th>
                                <th className="p-1.5 w-20 border-r border-black">HSN/SAC</th>
                                <th className="p-1.5 w-16 border-r border-black text-right">Quantity</th>
                                <th className="p-1.5 w-20 border-r border-black text-right">Rate</th>
                                <th className="p-1.5 w-12 border-r border-black text-center">per</th>
                                <th className="p-1.5 w-24 text-right pr-2">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Products */}
                              {invoiceItems.map((item, idx) => (
                                <tr key={idx} className="align-top">
                                  <td className="p-1.5 text-center border-r border-black">{idx + 1}</td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black font-bold">
                                    {item.productName}
                                  </td>
                                  <td className="p-1.5 text-center border-r border-black font-mono">
                                    {item.hsn || '85369090'}
                                  </td>
                                  <td className="p-1.5 text-right border-r border-black font-bold">
                                    {item.quantity} PCS
                                  </td>
                                  <td className="p-1.5 text-right border-r border-black">
                                    {item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-1.5 text-center border-r border-black">
                                    PCS
                                  </td>
                                  <td className="p-1.5 text-right font-bold pr-2">
                                    {item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}

                              {/* Freight Charges Row */}
                              {freightAmount > 0 && (
                                <tr className="align-top">
                                  <td className="p-1.5 text-center border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black text-right font-bold italic pr-6">
                                    Freight Charges
                                  </td>
                                  <td className="p-1.5 text-center border-r border-black font-mono">996812</td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 text-right font-bold pr-2">
                                    {freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              )}

                              {/* Taxes Rows */}
                              {isInterstate ? (
                                <tr className="align-top">
                                  <td className="p-1.5 text-center border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black text-right font-bold italic pr-6">
                                    OUTPUT IGST@18%
                                  </td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 text-right font-bold pr-2">
                                    {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ) : (
                                <>
                                  <tr className="align-top">
                                    <td className="p-1.5 text-center border-r border-black"></td>
                                    <td className="p-1.5 border-r border-black"></td>
                                    <td className="p-1.5 border-r border-black text-right font-bold italic pr-6">
                                      OUTPUT CGST@9%
                                    </td>
                                    <td className="p-1.5 border-r border-black"></td>
                                    <td className="p-1.5 border-r border-black"></td>
                                    <td className="p-1.5 border-r border-black"></td>
                                    <td className="p-1.5 border-r border-black"></td>
                                    <td className="p-1.5 text-right font-bold pr-2">
                                      {totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                  <tr className="align-top">
                                    <td className="p-1.5 text-center border-r border-black"></td>
                                    <td className="p-1.5 border-r border-black"></td>
                                    <td className="p-1.5 border-r border-black text-right font-bold italic pr-6">
                                      OUTPUT SGST@9%
                                    </td>
                                    <td className="p-1.5 border-r border-black"></td>
                                    <td className="p-1.5 border-r border-black"></td>
                                    <td className="p-1.5 border-r border-black"></td>
                                    <td className="p-1.5 border-r border-black"></td>
                                    <td className="p-1.5 text-right font-bold pr-2">
                                      {totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                </>
                              )}

                              {/* Rounding Off */}
                              <tr className="align-top">
                                <td className="p-1.5 text-center border-r border-black"></td>
                                <td className="p-1.5 border-r border-black"></td>
                                <td className="p-1.5 border-r border-black text-right font-bold italic pr-6">
                                  Rounding Off
                                </td>
                                <td className="p-1.5 border-r border-black"></td>
                                <td className="p-1.5 border-r border-black"></td>
                                <td className="p-1.5 border-r border-black"></td>
                                <td className="p-1.5 border-r border-black"></td>
                                <td className="p-1.5 text-right font-bold pr-2">
                                  {roundingOff.toFixed(2)}
                                </td>
                              </tr>

                              {/* Table spacer row for authentic presentation */}
                              <tr className="h-10">
                                <td className="border-r border-black"></td>
                                <td className="border-r border-black"></td>
                                <td className="border-r border-black"></td>
                                <td className="border-r border-black"></td>
                                <td className="border-r border-black"></td>
                                <td className="border-r border-black"></td>
                                <td className="border-r border-black"></td>
                                <td></td>
                              </tr>

                              {/* Total Row */}
                              <tr className="border-t border-black font-bold">
                                <td className="p-1.5 text-center border-r border-black"></td>
                                <td className="p-1.5 border-r border-black"></td>
                                <td className="p-1.5 border-r border-black text-right pr-6">Total</td>
                                <td className="p-1.5 border-r border-black"></td>
                                <td className="p-1.5 text-right border-r border-black">{totalQty} PCS</td>
                                <td className="p-1.5 border-r border-black"></td>
                                <td className="p-1.5 border-r border-black"></td>
                                <td className="p-1.5 text-right font-bold text-sm pr-2">
                                  ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Amount Chargeable (in words) */}
                        <div className="p-2 border-b border-black flex justify-between items-center text-[11px]">
                          <div>
                            <div className="text-[10px] text-slate-700 font-medium">Amount Chargeable (in words)</div>
                            <div className="font-bold text-[12px]">{numberToIndianWords(grandTotal)}</div>
                          </div>
                          <div className="font-bold text-[11px]">E. & O.E</div>
                        </div>

                        {/* TAX BREAKDOWN & SCAN TO PAY */}
                        <div className="grid grid-cols-12 border-b border-black">
                          {/* Scan to pay (3 cols) */}
                          <div className="col-span-3 p-2 border-r border-black flex flex-col items-center justify-center text-center">
                            <div className="text-[10px] text-slate-700 font-medium mb-1">Scan to pay</div>
                            <img
                              src="/sunyash-upi-qr.png"
                              alt="Scan to pay UPI"
                              className="w-24 h-24 object-contain border border-slate-300 p-0.5 bg-white shadow-2xs"
                            />
                          </div>

                          {/* HSN/SAC Tax Table (9 cols) */}
                          <div className="col-span-9">
                            <table className="w-full border-collapse text-[10px]">
                              <thead>
                                <tr className="border-b border-black text-center font-bold">
                                  <th className="p-1 border-r border-black" rowSpan={2}>HSN/SAC</th>
                                  <th className="p-1 border-r border-black" rowSpan={2}>Taxable<br/>Value</th>
                                  {isInterstate ? (
                                    <th className="p-1 border-r border-black" colSpan={2}>IGST</th>
                                  ) : (
                                    <>
                                      <th className="p-1 border-r border-black" colSpan={2}>Central Tax</th>
                                      <th className="p-1 border-r border-black" colSpan={2}>State Tax</th>
                                    </>
                                  )}
                                  <th className="p-1" rowSpan={2}>Total<br/>Tax Amount</th>
                                </tr>
                                <tr className="border-b border-black text-center font-bold">
                                  {isInterstate ? (
                                    <>
                                      <th className="p-0.5 border-r border-black w-12">Rate</th>
                                      <th className="p-0.5 border-r border-black text-right pr-1">Amount</th>
                                    </>
                                  ) : (
                                    <>
                                      <th className="p-0.5 border-r border-black w-10">Rate</th>
                                      <th className="p-0.5 border-r border-black text-right pr-1">Amount</th>
                                      <th className="p-0.5 border-r border-black w-10">Rate</th>
                                      <th className="p-0.5 border-r border-black text-right pr-1">Amount</th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-black/30">
                                {/* Goods Row */}
                                <tr>
                                  <td className="p-1 text-center border-r border-black font-mono">85369090</td>
                                  <td className="p-1 text-right border-r border-black font-mono">
                                    {goodsTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  {isInterstate ? (
                                    <>
                                      <td className="p-1 text-center border-r border-black">18%</td>
                                      <td className="p-1 text-right border-r border-black font-mono">
                                        {goodsIgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="p-1 text-center border-r border-black">9%</td>
                                      <td className="p-1 text-right border-r border-black font-mono">
                                        {goodsCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="p-1 text-center border-r border-black">9%</td>
                                      <td className="p-1 text-right border-r border-black font-mono">
                                        {goodsSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </>
                                  )}
                                  <td className="p-1 text-right font-mono pr-1">
                                    {goodsTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>

                                {/* Freight Row */}
                                {freightAmount > 0 && (
                                  <tr>
                                    <td className="p-1 text-center border-r border-black font-mono">996812</td>
                                    <td className="p-1 text-right border-r border-black font-mono">
                                      {freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    {isInterstate ? (
                                      <>
                                        <td className="p-1 text-center border-r border-black">18%</td>
                                        <td className="p-1 text-right border-r border-black font-mono">
                                          {freightIgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="p-1 text-center border-r border-black">9%</td>
                                        <td className="p-1 text-right border-r border-black font-mono">
                                          {freightCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-1 text-center border-r border-black">9%</td>
                                        <td className="p-1 text-right border-r border-black font-mono">
                                          {freightSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                      </>
                                    )}
                                    <td className="p-1 text-right font-mono pr-1">
                                      {freightTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                )}

                                {/* Total Row */}
                                <tr className="border-t border-black font-bold">
                                  <td className="p-1 text-center border-r border-black">Total</td>
                                  <td className="p-1 text-right border-r border-black font-mono">
                                    {totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  {isInterstate ? (
                                    <>
                                      <td className="p-1 border-r border-black"></td>
                                      <td className="p-1 text-right border-r border-black font-mono">
                                        {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="p-1 border-r border-black"></td>
                                      <td className="p-1 text-right border-r border-black font-mono">
                                        {totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="p-1 border-r border-black"></td>
                                      <td className="p-1 text-right border-r border-black font-mono">
                                        {totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </>
                                  )}
                                  <td className="p-1 text-right font-mono pr-1">
                                    {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Tax Amount (in words) */}
                        <div className="p-2 border-b border-black text-[11px]">
                          <span>Tax Amount (in words) : </span>
                          <span className="font-bold">{numberToIndianWords(totalTax)}</span>
                        </div>

                        {/* Remarks and Signatory */}
                        <div className="grid grid-cols-2 divide-x divide-black min-h-[95px]">
                          {/* Left: Remarks */}
                          <div className="p-2 space-y-1">
                            <div className="text-[10px] text-slate-700 font-medium">Remarks:</div>
                            <div className="font-mono text-[11px] font-medium">
                              {remarksStr}
                            </div>
                          </div>

                          {/* Right: for SUNYASH MULTI TRADING PVT LTD */}
                          <div className="p-2 flex flex-col justify-between text-right">
                            <div className="font-bold text-[11px]">for SUNYASH MULTI TRADING PVT LTD 26-27</div>
                            <div className="font-bold text-[11px] pt-8">Authorised Signatory</div>
                          </div>
                        </div>
                      </div>

                      {/* Computer Generated Footer (Centered below box) */}
                      <div className="text-center text-[10px] italic text-slate-600 font-medium print:text-black">
                        This is a Computer Generated Invoice
                      </div>

                      {/* PAYMENT PROOF & VERIFICATION DETAILS SECTION (Screen Only) */}
                      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 space-y-4 print:hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-indigo-600" />
                            <h4 className="font-bold text-xs text-slate-900">
                              Customer Payment Proof & Verification Workflow
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPaymentBadge(hasProofOrPaid ? 'Paid' : selectedInvoice.paymentStatus)}`}>
                              {hasProofOrPaid ? 'Paid' : (selectedInvoice.paymentStatus || 'Payment Pending')}
                            </span>
                            {!hasProofOrPaid ? (
                              <button
                                onClick={() => handleOpenUploadProofModal(selectedInvoice)}
                                className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>Upload Payment Proof</span>
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Proof Attached & Paid</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rejection Alert if rejected */}
                        {selectedInvoice.paymentStatus === 'Payment Rejected' && (
                          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 font-medium">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block">Payment Proof Rejected by Admin/Authorized User</span>
                              <span>Reason: {selectedInvoice.paymentRejectionReason || 'Proof document does not match payment records.'}</span>
                              <span className="block mt-1 text-[11px] text-rose-700">Please contact customer, obtain valid payment receipt/screenshot, and click &quot;Upload / Replace Proof&quot; above.</span>
                            </div>
                          </div>
                        )}

                        {/* Verification Notes */}
                        {selectedInvoice.paymentVerificationNotes && (
                          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
                            <span className="font-bold">Verification Notes: </span>
                            <span>{selectedInvoice.paymentVerificationNotes}</span>
                          </div>
                        )}

                        {/* Uploader Meta */}
                        {(selectedInvoice.paymentProofUploadedBy || selectedInvoice.paymentProofUploadedDate) && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-4 flex-wrap">
                            {selectedInvoice.paymentProofUploadedBy && (
                              <span>Uploaded By: <strong className="text-slate-800">{selectedInvoice.paymentProofUploadedBy}</strong></span>
                            )}
                            {selectedInvoice.paymentProofUploadedDate && (
                              <span>Uploaded Date: <strong className="text-slate-800">{new Date(selectedInvoice.paymentProofUploadedDate).toLocaleString()}</strong></span>
                            )}
                          </div>
                        )}

                        {/* Gallery of Uploaded Proofs */}
                        <div>
                          <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Attached Payment Proof Documents ({selectedInvoice.paymentProofFiles?.length || 0})</span>
                          </div>

                          {selectedInvoice.paymentProofFiles && selectedInvoice.paymentProofFiles.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {selectedInvoice.paymentProofFiles.map((item, idx) => {
                                const parsed = parseProofFile(item);
                                const isPdf = parsed.type === 'application/pdf' || parsed.url.includes('application/pdf') || parsed.name.toLowerCase().endsWith('.pdf');

                                return (
                                  <div
                                    key={idx}
                                    className="group relative rounded-xl border border-slate-200 bg-white p-2.5 flex flex-col justify-between hover:shadow-md transition"
                                  >
                                    {isPdf ? (
                                      <div className="h-28 flex flex-col items-center justify-center bg-rose-50/50 rounded-lg border border-rose-100 p-2 text-center">
                                        <FileText className="w-8 h-8 text-rose-600 mb-1" />
                                        <span className="text-[10px] font-bold text-slate-800 truncate max-w-full" title={parsed.name}>
                                          {parsed.name}
                                        </span>
                                        <span className="text-[9px] text-rose-600 font-semibold uppercase">PDF Document</span>
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => setPreviewImageUrl(parsed.url)}
                                        className="h-28 rounded-lg overflow-hidden bg-slate-100 relative cursor-pointer"
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={parsed.url} alt={parsed.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                                          View Image
                                        </div>
                                      </div>
                                    )}

                                    <div className="mt-2 flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                                      <span className="text-[10px] font-medium text-slate-600 truncate max-w-[100px]" title={parsed.name}>
                                        {parsed.name}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {isPdf ? (
                                          <a
                                            href={parsed.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                                            title="Open PDF in new tab"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </a>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setPreviewImageUrl(parsed.url)}
                                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                            title="View Proof"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <a
                                          href={parsed.url}
                                          download={parsed.name || `Payment_Proof_${idx + 1}`}
                                          className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700"
                                          title="Download Proof"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-xs">
                              No payment proof uploaded yet. Click &quot;Upload Payment Proof&quot; to attach payment screenshot, bank receipt, UPI slip, or cheque document.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SECTION 14: SALES PERSON PRODUCTION & PACKING TRACKING UPDATES (Screen Only) */}
                      {isSentToProd && (
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-5 rounded-2xl border border-blue-200 space-y-4 print:hidden">
                          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                            <div className="flex items-center gap-2">
                              <Factory className="w-4 h-4 text-blue-600" />
                              <h4 className="font-bold text-xs text-slate-900">
                                Live Production & Packing Tracking (Real-Time Updates)
                              </h4>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getProductionBadge(prodStatus)}`}>
                              {prodStatus}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <div className="text-[10px] uppercase font-bold text-slate-500">Production Stage</div>
                              <div className="font-bold text-slate-900 mt-0.5">{prodStatus}</div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <div className="text-[10px] uppercase font-bold text-slate-500">Packing Status</div>
                              <div className="font-bold text-purple-700 mt-0.5">{linkedOrder?.packingStatus || 'Pending'}</div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <div className="text-[10px] uppercase font-bold text-slate-500">Serial & Batch</div>
                              <div className="font-mono font-bold text-blue-700 mt-0.5">
                                {sNum || bNum ? `${sNum || 'N/A'} / ${bNum || 'N/A'}` : 'To be assigned in Packing'}
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <div className="text-[10px] uppercase font-bold text-slate-500">Warranty Coverage</div>
                              <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{wPeriod}</span>
                              </div>
                            </div>
                          </div>

                          {/* Production & Packing Notes */}
                          {(prodNotes || packNotes) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {prodNotes && (
                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Production Notes:</span>
                                  <p className="text-slate-800 mt-0.5 font-medium">{prodNotes}</p>
                                </div>
                              )}
                              {packNotes && (
                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                  <span className="text-[10px] font-bold text-purple-700 uppercase block">Packing Notes:</span>
                                  <p className="text-slate-800 mt-0.5 font-medium">{packNotes}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Uploaded Product & Packing Images */}
                          <div>
                            <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                              <span>Uploaded Product & Packing Proof Images ({imagesToShow.length})</span>
                            </div>
                            {imagesToShow.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {imagesToShow.map((img, i) => (
                                  <div
                                    key={i}
                                    onClick={() => setPreviewImageUrl(img)}
                                    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video cursor-pointer hover:shadow-md transition"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={img} alt={`Proof ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold">
                                      View Full Image
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-xs">
                                No product or packing proof images uploaded yet. Production team will upload photos upon packing.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })()}

        {/* UPLOAD PAYMENT PROOF MODAL */}
        {isUploadProofModalOpen && proofTargetInvoice && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsUploadProofModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/50">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Upload Customer Payment Proof</h3>
                    <p className="text-[11px] text-slate-500">Invoice: {proofTargetInvoice.invoiceNumber} • {proofTargetInvoice.customerName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadProofModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitProofUpload} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Invoice Total Amount</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 font-mono font-bold text-slate-800">
                      ₹{proofTargetInvoice.grandTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Paid Amount (₹) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={proofAmount}
                      onChange={(e) => setProofAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Proof Document Type *</label>
                    <select
                      value={proofType}
                      onChange={(e) => setProofType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-600"
                    >
                      <option value="Payment Screenshot">Payment Screenshot</option>
                      <option value="Payment Receipt">Payment Receipt</option>
                      <option value="Bank Transfer Proof">Bank Transfer Proof</option>
                      <option value="UPI Payment Screenshot">UPI Payment Screenshot</option>
                      <option value="Cheque/Payment Document">Cheque/Payment Document</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Payment Method *</label>
                    <select
                      value={proofMode}
                      onChange={(e) => setProofMode(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-600"
                    >
                      <option value="UPI">UPI Payment</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash Receipt</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={proofDate}
                      onChange={(e) => setProofDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Transaction / Reference Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UPI Ref / UTR / Cheque No"
                      value={proofRef}
                      onChange={(e) => setProofRef(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* FILE UPLOAD ZONE */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Payment Proof Image / File * <span className="font-normal text-slate-500">(JPG, JPEG, PNG, PDF - Multiple files allowed)</span>
                  </label>
                  <div className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 rounded-xl p-5 text-center transition cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      onChange={handleProofFilesSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <FileUp className="w-8 h-8 text-indigo-600 mb-1" />
                      <span className="font-bold text-slate-800 text-xs">Click or drag & drop files here</span>
                      <span className="text-[11px] text-slate-500">Supports JPG, JPEG, PNG screenshots and PDF receipts</span>
                    </div>
                  </div>

                  {/* PREVIEW OF SELECTED FILES */}
                  {proofFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-[11px] font-bold text-slate-700">Selected Files ({proofFiles.length}):</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {proofFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {file.type === 'application/pdf' ? (
                                <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                              )}
                              <span className="truncate text-slate-800 font-medium text-[11px]" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveProofFile(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Remove file"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Notes / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Add verification notes, bank transfer details, or UPI receipt notes..."
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-600"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Payment Proof Workflow Notice:</span>
                  </div>
                  <div>• Uploading proof sets status to <strong>&quot;Payment Proof Uploaded&quot;</strong>.</div>
                  <div>• Payment is NOT automatically marked as completed upon upload.</div>
                  <div>• Admin / Authorized user will verify proof $\rightarrow$ <strong>&quot;Payment Verified&quot;</strong> $\rightarrow$ <strong>&quot;Payment Completed&quot;</strong>.</div>
                  <div>• <strong>&quot;Send Invoice to Production&quot;</strong> will appear ONLY once payment is <strong>&quot;Payment Completed&quot;</strong>.</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsUploadProofModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Payment Proof</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FULL IMAGE PREVIEW MODAL */}

        {/* FULL IMAGE PREVIEW MODAL */}
        {previewImageUrl && (
          <div
            className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4"
            onClick={() => setPreviewImageUrl(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImageUrl} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain" />
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
