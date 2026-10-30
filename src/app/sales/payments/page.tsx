'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { CustomerPayment } from '@/types/erp';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Wallet,
  Building2,
  FileText,
  DollarSign,
  Users,
  Eye,
  Download,
  UploadCloud,
  Trash2,
  Paperclip,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  Image as ImageIcon,
  Send,
  Lock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function parseProofFile(item: string) {
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
}

function SalesPaymentsContent() {
  const searchParams = useSearchParams();
  const preselectedInvoiceId = searchParams.get('invoiceId');

  const {
    customerPayments,
    invoices,
    customers,
    createCustomerPaymentFull,
    verifyCustomerPayment,
    completeCustomerPayment,
    rejectCustomerPayment,
    updatePaymentProofFiles,
    activeRole,
    generateEntityCode,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'payments' | 'outstanding'>('payments');
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<CustomerPayment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [previewProofModalUrl, setPreviewProofModalUrl] = useState<string | null>(null);

  // Verification & Rejection form states inside details modal
  const [verifyNotesInput, setVerifyNotesInput] = useState('');
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [isRejectBoxOpen, setIsRejectBoxOpen] = useState(false);

  // Form State for Recording New Payment
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formInvoiceId, setFormInvoiceId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPaymentDate, setFormPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMode, setFormMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other'>('Bank Transfer');
  const [formReferenceNumber, setFormReferenceNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [allowOverpayment, setAllowOverpayment] = useState(false);
  const [formProofFiles, setFormProofFiles] = useState<Array<{ name: string; url: string; type: string; size?: number }>>([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  useEffect(() => {
    if (preselectedInvoiceId) {
      const inv = invoices.find((i) => i.id === preselectedInvoiceId);
      if (inv) {
        setFormCustomerId(inv.customerId);
        setFormInvoiceId(inv.id);
        setFormAmount(String(inv.outstandingAmount));
        setIsCreateModalOpen(true);
      }
    }
  }, [preselectedInvoiceId, invoices]);

  // Keep selectedPayment in sync with ERPContext
  useEffect(() => {
    if (selectedPayment) {
      const updated = customerPayments.find((p) => p.id === selectedPayment.id);
      if (updated) setSelectedPayment(updated);
    }
  }, [customerPayments]);

  const filteredPayments = useMemo(() => {
    return customerPayments.filter((p) => {
      const matchSearch =
        p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMode = modeFilter === 'ALL' || p.paymentMode === modeFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        p.status === statusFilter ||
        (statusFilter === 'Payment Completed' && (p.status === 'Completed' || (p.status as string) === 'Paid'));
      return matchSearch && matchMode && matchStatus;
    });
  }, [customerPayments, searchQuery, modeFilter, statusFilter]);

  // Filter invoices for selected customer
  const customerInvoices = invoices.filter((i) => i.customerId === formCustomerId && i.outstandingAmount > 0);
  const selectedInvoiceObj = invoices.find((i) => i.id === formInvoiceId);

  const getPaymentBadge = (status?: string) => {
    switch (status) {
      case 'Payment Completed':
      case 'Completed':
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
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';
    }
  };

  const handleOpenCreateModal = () => {
    if (customers.length > 0) {
      const cust = customers[0];
      setFormCustomerId(cust.id);
      const custInvs = invoices.filter((i) => i.customerId === cust.id && i.outstandingAmount > 0);
      if (custInvs.length > 0) {
        setFormInvoiceId(custInvs[0].id);
        setFormAmount(String(custInvs[0].outstandingAmount));
      } else {
        setFormInvoiceId('');
        setFormAmount('0');
      }
    }
    setFormPaymentDate(new Date().toISOString().split('T')[0]);
    setFormMode('Bank Transfer');
    setFormReferenceNumber(`NEFT-${Math.floor(1000000 + Math.random() * 9000000)}`);
    setFormNotes('');
    setFormProofFiles([]);
    setAllowOverpayment(false);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleCustomerSelectChange = (cid: string) => {
    setFormCustomerId(cid);
    const custInvs = invoices.filter((i) => i.customerId === cid && i.outstandingAmount > 0);
    if (custInvs.length > 0) {
      setFormInvoiceId(custInvs[0].id);
      setFormAmount(String(custInvs[0].outstandingAmount));
    } else {
      setFormInvoiceId('');
      setFormAmount('0');
    }
  };

  const handleInvoiceSelectChange = (invId: string) => {
    setFormInvoiceId(invId);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      setFormAmount(String(inv.outstandingAmount));
    }
  };

  const handleFormProofFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        alert(`File ${file.name} is not allowed. Only JPG, JPEG, PNG, and PDF files are accepted.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const type = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');
          setFormProofFiles((prev) => [
            ...prev,
            { name: file.name, url: reader.result as string, type, size: file.size },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCustomerId) return setFormError('Please select a customer.');
    if (!formInvoiceId) return setFormError('Please select an invoice with outstanding balance.');

    const payAmt = parseFloat(formAmount) || 0;
    if (payAmt <= 0) return setFormError('Payment amount must be greater than 0.');

    const custObj = customers.find((c) => c.id === formCustomerId);
    const invObj = invoices.find((i) => i.id === formInvoiceId);

    const res = createCustomerPaymentFull(
      {
        customerId: formCustomerId,
        customerName: custObj ? custObj.companyName : 'Unknown Customer',
        customerNumber: custObj?.customerNumber || custObj?.customerCode,
        invoiceId: formInvoiceId,
        invoiceNumber: invObj ? invObj.invoiceNumber : 'INV-2026',
        invoiceAmount: invObj?.grandTotal,
        paidAmount: payAmt,
        pendingAmount: Math.max(0, (invObj?.grandTotal || 0) - payAmt),
        paymentDate: formPaymentDate,
        amount: payAmt,
        paymentMode: formMode,
        referenceNumber: formReferenceNumber.trim(),
        notes: formNotes,
        proofFiles: formProofFiles.map((f) => JSON.stringify(f)),
        uploadedBy: activeRole === 'ADMIN' ? 'Administrator' : 'Sales Person',
        uploadedDate: new Date().toISOString(),
        status: 'Payment Completed',
        createdBy: activeRole === 'ADMIN' ? 'Admin' : 'Sales Desk',
      },
      allowOverpayment
    );

    if (!res.success) {
      setFormError(res.message || 'Failed to process payment.');
      return;
    }

    showToast(`✓ Payment of ₹${payAmt.toLocaleString('en-IN')} logged & invoice balances updated!`);
    setIsCreateModalOpen(false);
  };

  const handleOpenDetailsModal = (payment: CustomerPayment) => {
    setSelectedPayment(payment);
    setVerifyNotesInput(payment.verificationNotes || '');
    setRejectReasonInput('');
    setIsRejectBoxOpen(false);
    setIsDetailsModalOpen(true);
  };

  // Payment Verification Workflow Handlers
  const handleVerifyPayment = () => {
    if (!selectedPayment) return;
    const res = verifyCustomerPayment(selectedPayment.id, verifyNotesInput);
    if (res.success) {
      showToast(`✓ Payment ${selectedPayment.paymentNumber} verified successfully!`);
    } else {
      showToast(res.message || 'Verification failed.');
    }
  };

  const handleCompletePayment = () => {
    if (!selectedPayment) return;
    const res = completeCustomerPayment(selectedPayment.id, undefined, verifyNotesInput);
    if (res.success) {
      showToast(`✓ Payment completed! Invoice is now ready for Production.`);
    } else {
      showToast(res.message || 'Payment completion failed.');
    }
  };

  const handleRejectPayment = () => {
    if (!selectedPayment) return;
    if (!rejectReasonInput.trim()) {
      alert('Please enter a rejection reason (e.g. Blurry receipt, amount mismatch, etc.).');
      return;
    }
    const res = rejectCustomerPayment(selectedPayment.id, rejectReasonInput.trim());
    if (res.success) {
      showToast(`Payment marked as Rejected. Rejection reason recorded.`);
      setIsRejectBoxOpen(false);
    } else {
      showToast(res.message || 'Payment rejection failed.');
    }
  };

  // Proof Management Handlers (Replace, Delete, Add)
  const handleReplaceProof = (proofIndex: number, file: File) => {
    if (!selectedPayment) return;
    const isAllowed =
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      file.type === 'image/jpg' ||
      file.type === 'application/pdf' ||
      file.name.match(/\.(jpg|jpeg|png|pdf)$/i);
    if (!isAllowed) {
      alert('Only JPG, JPEG, PNG, and PDF files are accepted.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const type = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');
        const newFileObj = JSON.stringify({ name: file.name, url: reader.result, type, size: file.size });
        const currentProofs = [...(selectedPayment.proofFiles || [])];
        currentProofs[proofIndex] = newFileObj;
        updatePaymentProofFiles(selectedPayment.id, currentProofs, 'replace');
        showToast('✓ Payment proof replaced successfully.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteProof = (proofIndex: number) => {
    if (!selectedPayment) return;
    // Authorization Check: Delete Proof (only if authorized)
    if (activeRole !== 'ADMIN') {
      alert('Unauthorized action: Only Admin or authorized users can delete payment proof documents.');
      return;
    }
    if (!confirm('Are you sure you want to delete this payment proof? This action is permanent.')) return;

    const currentProofs = [...(selectedPayment.proofFiles || [])].filter((_, i) => i !== proofIndex);
    updatePaymentProofFiles(selectedPayment.id, currentProofs, 'delete');
    showToast('✓ Payment proof removed.');
  };

  const handleAddMoreProof = (files: FileList) => {
    if (!selectedPayment) return;
    Array.from(files).forEach((file) => {
      const isAllowed =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/jpg' ||
        file.type === 'application/pdf' ||
        file.name.match(/\.(jpg|jpeg|png|pdf)$/i);
      if (!isAllowed) return;

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const type = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');
          const newFileObj = JSON.stringify({ name: file.name, url: reader.result, type, size: file.size });
          const currentProofs = [...(selectedPayment.proofFiles || []), newFileObj];
          updatePaymentProofFiles(selectedPayment.id, currentProofs, 'add');
          showToast('✓ Additional proof file added.');
        }
      };
      reader.readAsDataURL(file);
    });
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
          <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Workflow Pipeline Breadcrumb Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 text-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold tracking-wide">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Customer Payment Proof & Verification Workflow:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-300">
              <span className="opacity-70">1. Invoice Sent</span>
              <span className="text-slate-500">→</span>
              <span className="text-amber-300 font-bold">2. Payment Pending</span>
              <span className="text-slate-500">→</span>
              <span className="text-purple-300 font-bold">3. Proof Uploaded</span>
              <span className="text-slate-500">→</span>
              <span className="text-blue-300 font-bold">4. Payment Verified</span>
              <span className="text-slate-500">→</span>
              <span className="text-emerald-400 font-bold">5. Payment Completed</span>
              <span className="text-slate-500">→</span>
              <span className="text-white font-bold bg-emerald-600/60 px-2 py-0.5 rounded">6. Unlocks Production</span>
            </div>
          </div>
        </div>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Payments & Proofs</h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Review customer payment receipts, verify bank transfer & UPI payment screenshots, and unlock production once payment is completed.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Record Customer Payment
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 border-b-2 transition cursor-pointer ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Payment Transactions & Proofs ({customerPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('outstanding')}
            className={`pb-3 border-b-2 transition cursor-pointer ${
              activeTab === 'outstanding'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Outstanding Ledger
          </button>
        </div>

        {activeTab === 'payments' ? (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Payment #, Customer, Invoice #, Ref..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                  <Filter className="w-3.5 h-3.5 text-slate-500" /> Status:
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Payment Pending">Payment Pending</option>
                  <option value="Payment Proof Uploaded">Payment Proof Uploaded</option>
                  <option value="Payment Verified">Payment Verified</option>
                  <option value="Payment Completed">Payment Completed</option>
                  <option value="Payment Rejected">Payment Rejected</option>
                </select>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                  <Wallet className="w-3.5 h-3.5 text-slate-500" /> Mode:
                </div>
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="ALL">All Modes</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Customer Payments Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                      <th className="p-3.5">Payment #</th>
                      <th className="p-3.5">Customer Name</th>
                      <th className="p-3.5">Invoice Ref</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right font-bold">Amount Paid</th>
                      <th className="p-3.5">Payment Method</th>
                      <th className="p-3.5">Transaction Ref</th>
                      <th className="p-3.5 text-center">Payment Proof</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((p) => {
                      const proofCount = p.proofFiles?.length || 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-mono text-emerald-700 font-bold">{p.paymentNumber}</td>
                          <td className="p-3.5 font-bold text-slate-900 max-w-[180px] truncate">{p.customerName}</td>
                          <td className="p-3.5 font-mono text-blue-600 font-bold">{p.invoiceNumber}</td>
                          <td className="p-3.5 text-slate-600 font-mono">{p.paymentDate}</td>
                          <td className="p-3.5 text-right font-extrabold text-emerald-700 font-mono text-sm">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3.5 text-slate-700 font-medium">{p.paymentMode}</td>
                          <td className="p-3.5 font-mono text-slate-600">{p.referenceNumber}</td>
                          <td className="p-3.5 text-center">
                            {proofCount > 0 ? (
                              <button
                                onClick={() => handleOpenDetailsModal(p)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition cursor-pointer"
                                title="Click to view payment proof"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span>{proofCount} File{proofCount > 1 ? 's' : ''}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">No Proof</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${getPaymentBadge(
                                p.status
                              )}`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleOpenDetailsModal(p)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 mx-auto transition cursor-pointer"
                              title="View Payment Details & Proof Gallery"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-12 text-center text-slate-500 text-xs font-medium">
                          No payment transactions matching your filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* CUSTOMER OUTSTANDING LEDGER TAB */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 text-xs text-slate-600 flex justify-between items-center bg-slate-50/50 font-medium">
              <span>Customer Balance Ledger & Credit Risk Overview</span>
              <span className="font-bold text-rose-700 font-mono text-sm">
                Total Receivables: ₹{customers.reduce((acc, c) => acc + (c.totalOutstanding || 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                    <th className="p-3.5">Customer Code</th>
                    <th className="p-3.5">Company Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Total Orders</th>
                    <th className="p-3.5 text-right">Total Invoices Amount</th>
                    <th className="p-3.5 text-right font-bold text-emerald-700">Total Payments</th>
                    <th className="p-3.5 text-right font-bold text-rose-700">Outstanding Receivable</th>
                    <th className="p-3.5 text-right">Credit Limit</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const isOverLimit = (c.totalOutstanding || 0) > c.creditLimit;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-mono text-blue-600 font-bold">{c.customerCode || c.id}</td>
                        <td className="p-3.5 font-bold text-slate-900 max-w-[200px] truncate">{c.companyName}</td>
                        <td className="p-3.5 text-slate-600 font-medium">{c.category || c.customerType}</td>
                        <td className="p-3.5 text-right font-semibold text-slate-800">{c.totalOrders || 0}</td>
                        <td className="p-3.5 text-right font-bold text-slate-900 font-mono">₹{(c.totalSales || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3.5 text-right font-bold text-emerald-700 font-mono">₹{(c.totalPaid || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3.5 text-right font-extrabold text-rose-700 font-mono">
                          ₹{(c.totalOutstanding || 0).toLocaleString('en-IN')}
                          {isOverLimit && <span className="block text-[9px] text-rose-600 font-normal">EXCEEDS CREDIT LIMIT</span>}
                        </td>
                        <td className="p-3.5 text-right text-slate-600 font-mono">₹{(c.creditLimit || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setFormCustomerId(c.id);
                              handleCustomerSelectChange(c.id);
                              setActiveTab('payments');
                              setIsCreateModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 shadow-sm flex items-center gap-1 mx-auto transition cursor-pointer"
                          >
                            + Log Payment
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAYMENT DETAILS MODAL (Inside Sales -> Payments -> Payment Details) */}
        {isDetailsModalOpen && selectedPayment && (() => {
          const linkedInv = invoices.find((i) => i.id === selectedPayment.invoiceId);
          const proofItems = selectedPayment.proofFiles || [];

          return (
            <div
              className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsDetailsModalOpen(false);
              }}
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700 font-mono font-bold text-sm">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{selectedPayment.paymentNumber}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] border ${getPaymentBadge(
                            selectedPayment.status
                          )}`}
                        >
                          {selectedPayment.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Invoice: <strong className="text-blue-700 font-mono">{selectedPayment.invoiceNumber}</strong> • Customer: <strong className="text-slate-800">{selectedPayment.customerName}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-5 text-xs">
                  {/* Rejection Alert if Rejected */}
                  {selectedPayment.status === 'Payment Rejected' && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Payment Proof Rejected</span>
                        <span className="text-[11px]">Reason: {selectedPayment.rejectionReason || 'Proof document was not acceptable.'}</span>
                      </div>
                    </div>
                  )}

                  {/* Payment Completed Banner */}
                  {(selectedPayment.status === 'Payment Completed' || selectedPayment.status === 'Completed') && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2.5 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        ✓ Payment is verified and completed. Invoice <strong>{selectedPayment.invoiceNumber}</strong> is unlocked for Production.
                      </span>
                    </div>
                  )}

                  {/* Payment Details Key-Value Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Payment Status</span>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] border ${getPaymentBadge(selectedPayment.status)}`}>
                        {selectedPayment.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Payment Amount</span>
                      <span className="font-extrabold text-emerald-700 font-mono text-sm block mt-0.5">
                        ₹{selectedPayment.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Payment Date</span>
                      <span className="font-mono text-slate-800 font-semibold block mt-1">{selectedPayment.paymentDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Payment Method</span>
                      <span className="font-medium text-slate-800 block mt-1">{selectedPayment.paymentMode}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Transaction Reference</span>
                      <span className="font-mono text-blue-700 font-bold block mt-1">{selectedPayment.referenceNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Invoice Amount</span>
                      <span className="font-mono text-slate-800 font-semibold block mt-1">
                        ₹{(selectedPayment.invoiceAmount || linkedInv?.grandTotal || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Pending Balance</span>
                      <span className="font-mono text-rose-700 font-bold block mt-1">
                        ₹{(selectedPayment.pendingAmount ?? (linkedInv?.outstandingAmount ?? 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Uploaded By</span>
                      <span className="font-medium text-slate-800 block mt-1">
                        {selectedPayment.uploadedBy || 'Sales Person'}
                      </span>
                    </div>

                    {selectedPayment.uploadedDate && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Uploaded Date</span>
                        <span className="font-medium text-slate-700 block mt-0.5">
                          {new Date(selectedPayment.uploadedDate).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {selectedPayment.verifiedBy && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Verified By</span>
                        <span className="font-medium text-slate-700 block mt-0.5">
                          {selectedPayment.verifiedBy} {selectedPayment.verifiedDate ? `(${new Date(selectedPayment.verifiedDate).toLocaleString()})` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedPayment.verificationNotes && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
                      <span className="font-bold">Verification Notes: </span>
                      <span>{selectedPayment.verificationNotes}</span>
                    </div>
                  )}

                  {/* PAYMENT PROOF SECTION */}
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        <Paperclip className="w-4 h-4 text-indigo-600" />
                        <span>Uploaded Payment Proof ({proofItems.length})</span>
                      </div>

                      {/* Add More Proof button */}
                      <label className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Add Proof File</span>
                        <input
                          type="file"
                          multiple
                          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                          onChange={(e) => {
                            if (e.target.files) handleAddMoreProof(e.target.files);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {proofItems.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {proofItems.map((item, idx) => {
                          const parsed = parseProofFile(item);
                          const isPdf = parsed.type === 'application/pdf' || parsed.url.includes('application/pdf') || parsed.name.toLowerCase().endsWith('.pdf');

                          return (
                            <div
                              key={idx}
                              className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition group"
                            >
                              {isPdf ? (
                                <div className="h-32 flex flex-col items-center justify-center bg-rose-50/60 rounded-lg border border-rose-100 p-2 text-center">
                                  <FileText className="w-9 h-9 text-rose-600 mb-1" />
                                  <span className="text-[11px] font-bold text-slate-800 truncate max-w-full" title={parsed.name}>
                                    {parsed.name}
                                  </span>
                                  <span className="text-[9px] text-rose-600 font-semibold uppercase">PDF Document</span>
                                </div>
                              ) : (
                                <div
                                  onClick={() => setPreviewProofModalUrl(parsed.url)}
                                  className="h-32 rounded-lg overflow-hidden bg-slate-100 relative cursor-pointer"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={parsed.url} alt={parsed.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold">
                                    Click to View
                                  </div>
                                </div>
                              )}

                              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                                <span className="font-medium text-slate-700 truncate max-w-[120px]" title={parsed.name}>
                                  {parsed.name}
                                </span>
                              </div>

                              {/* Action Buttons: View, Download, Replace, Delete */}
                              <div className="mt-2 grid grid-cols-2 gap-1.5">
                                {isPdf ? (
                                  <a
                                    href={parsed.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] flex items-center justify-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>View Proof</span>
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewProofModalUrl(parsed.url)}
                                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View Proof</span>
                                  </button>
                                )}

                                <a
                                  href={parsed.url}
                                  download={parsed.name || `Proof_${idx + 1}`}
                                  className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[10px] flex items-center justify-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download Proof</span>
                                </a>

                                {/* Replace Proof Button */}
                                <label className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition">
                                  <UploadCloud className="w-3 h-3" />
                                  <span>Replace Proof</span>
                                  <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleReplaceProof(idx, e.target.files[0]);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>

                                {/* Delete Proof (only if authorized) */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProof(idx)}
                                  disabled={activeRole !== 'ADMIN'}
                                  className={`px-2 py-1 rounded font-semibold text-[10px] flex items-center justify-center gap-1 transition ${
                                    activeRole === 'ADMIN'
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer'
                                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  }`}
                                  title={activeRole === 'ADMIN' ? 'Delete this proof' : 'Delete Proof (Only Admin authorized)'}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete Proof</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-5 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-xs">
                        No payment proof uploaded yet for this transaction.
                      </div>
                    )}
                  </div>

                  {/* PAYMENT VERIFICATION WORKFLOW ACTION CONTROLS */}
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Payment Verification Actions (Authorized User / Admin)</span>
                    </div>

                    {isRejectBoxOpen ? (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5">
                        <label className="block text-rose-900 font-bold text-xs">
                          Rejection Reason * <span className="font-normal text-rose-700">(Explain what is incorrect with the payment proof)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={rejectReasonInput}
                          onChange={(e) => setRejectReasonInput(e.target.value)}
                          placeholder="e.g. Transaction amount does not match invoice total, or screenshot is blurry..."
                          className="w-full bg-white border border-rose-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsRejectBoxOpen(false)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleRejectPayment}
                            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                          >
                            Confirm Reject Payment
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-slate-600 font-medium text-[11px] mb-1">
                            Verification Notes / Comments (Optional):
                          </label>
                          <input
                            type="text"
                            value={verifyNotesInput}
                            onChange={(e) => setVerifyNotesInput(e.target.value)}
                            placeholder="Add notes before verifying or approving..."
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {/* When Proof Uploaded: can Verify, Complete, or Reject */}
                          {selectedPayment.status === 'Payment Proof Uploaded' && (
                            <>
                              <button
                                type="button"
                                onClick={handleVerifyPayment}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                                <span>Verify Payment (Set Verified)</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleCompletePayment}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Mark Payment Completed & Unlock Production</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsRejectBoxOpen(true)}
                                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                <span>Reject Payment (Incorrect Proof)</span>
                              </button>
                            </>
                          )}

                          {/* When Verified: can Complete or Reject */}
                          {selectedPayment.status === 'Payment Verified' && (
                            <>
                              <button
                                type="button"
                                onClick={handleCompletePayment}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Mark Payment Completed & Unlock Production</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsRejectBoxOpen(true)}
                                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                <span>Reject Payment</span>
                              </button>
                            </>
                          )}

                          {/* When Rejected: can reset to Pending or Verify */}
                          {selectedPayment.status === 'Payment Rejected' && (
                            <button
                              type="button"
                              onClick={() => {
                                verifyCustomerPayment(selectedPayment.id, 'Reset to verified status upon review.');
                                showToast('Payment status changed to Verified.');
                              }}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <RefreshCwIcon className="w-4 h-4" />
                              <span>Re-evaluate & Verify Proof</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* PROOF FULL IMAGE PREVIEW MODAL */}
        {previewProofModalUrl && (
          <div
            className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4"
            onClick={() => setPreviewProofModalUrl(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewProofModalUrl} alt="Proof Full Preview" className="max-w-full max-h-[85vh] object-contain" />
              <button
                onClick={() => setPreviewProofModalUrl(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* RECORD PAYMENT MODAL */}
        {isCreateModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsCreateModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-700" /> Record Customer Payment Receipt
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                  title="Close Form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePayment} className="p-6 space-y-4 text-xs">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" /> {formError}
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Payment Receipt Number <span className="text-slate-400 font-normal">(Auto-generated)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={generateEntityCode('PAYMENT')}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-emerald-700 font-mono focus:outline-none cursor-not-allowed opacity-90 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Customer *</label>
                  <select
                    required
                    value={formCustomerId}
                    onChange={(e) => handleCustomerSelectChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} (Outstanding: ₹{(c.totalOutstanding || 0).toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Invoice *</label>
                  <select
                    required
                    value={formInvoiceId}
                    onChange={(e) => handleInvoiceSelectChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  >
                    {customerInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - Due: ₹{inv.outstandingAmount.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedInvoiceObj && (
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Invoice Grand Total:</span>
                      <div className="font-bold text-slate-900 font-mono">₹{selectedInvoiceObj.grandTotal.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Current Outstanding:</span>
                      <div className="font-bold text-rose-700 font-mono">₹{selectedInvoiceObj.outstandingAmount.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Payment Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-emerald-700 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={formPaymentDate}
                      onChange={(e) => setFormPaymentDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Payment Mode</label>
                    <select
                      value={formMode}
                      onChange={(e) => setFormMode(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Reference Number *</label>
                    <input
                      type="text"
                      required
                      value={formReferenceNumber}
                      onChange={(e) => setFormReferenceNumber(e.target.value)}
                      placeholder="e.g. UTR / NEFT Number"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                {/* Attach Payment Proof Option */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Attach Payment Proof / Receipt <span className="font-normal text-slate-400">(Optional: JPG, PNG, PDF)</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={handleFormProofFileSelect}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
                  />
                  {formProofFiles.length > 0 && (
                    <div className="mt-2 text-[11px] text-emerald-700 font-semibold">
                      ✓ {formProofFiles.length} file(s) attached
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Notes / Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Part payment received via HDFC bank"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition cursor-pointer"
                  >
                    Save & Update Balances
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

function RefreshCwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading sales payments...</div>}>
      <SalesPaymentsContent />
    </Suspense>
  );
}
