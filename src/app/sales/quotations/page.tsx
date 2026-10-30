'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { Quotation, QuotationItem, QuotationStatus } from '@/types/erp';
import { numberToIndianWords } from '@/lib/numberToWords';
import {
  FileCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Eye,
  Send,
  Boxes,
  FileText,
  Printer,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Building2,
  User,
  Calendar,
  AlertCircle,
  Truck,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  QrCode,
  ExternalLink,
  Receipt,
  PhoneCall,
  MessageSquare,
  Check,
  HandCoins,
  CreditCard,
} from 'lucide-react';

export default function QuotationsPage() {
  const {
    quotations,
    customers,
    leads,
    products,
    rawMaterials,
    createQuotation,
    updateQuotationStatus,
    createInvoiceFromQuotation,
    createFollowUpFull,
    generateEntityCode,
    activeRole,
    refreshProductsFromDB,
    refreshRawMaterialsFromDB,
  } = useERP();

  // Fetch latest products and raw materials from database on load
  useEffect(() => {
    refreshProductsFromDB();
    refreshRawMaterialsFromDB();
  }, []);

  const leadsRequestingQuote = useMemo(() => {
    return (leads || []).filter(
      (l) => l.status === 'Send Quotation' || l.status === 'Quotation Sent'
    );
  }, [leads]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | QuotationStatus>('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState<'ALL' | 'COD' | 'Prepaid'>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Searchable Customer Selector State
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);

  // Quick Follow-up Modal State
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpTargetQuote, setFollowUpTargetQuote] = useState<Quotation | null>(null);
  const [fuDate, setFuDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fuTime, setFuTime] = useState('11:00 AM');
  const [fuType, setFuType] = useState<'Call' | 'WhatsApp' | 'Email' | 'Meeting' | 'Other'>('Call');
  const [fuNotes, setFuNotes] = useState('');
  const [fuNextDate, setFuNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [fuSalesperson, setFuSalesperson] = useState('Rajesh Kumar');

  // Form State
  const [formQuotationNumber, setFormQuotationNumber] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formQuotationDate, setFormQuotationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formValidUntil, setFormValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [formWarrantyPeriod, setFormWarrantyPeriod] = useState('1 Year');
  const [formFreightCharges, setFormFreightCharges] = useState(330);
  const [formAdjustment, setFormAdjustment] = useState(0);
  const [formDeliveryTerms, setFormDeliveryTerms] = useState(
    '10-15 Working Days After Receiving Purchase Order & Full Payment.'
  );
  const [formWarrantyTerms, setFormWarrantyTerms] = useState(
    '6 Month Free Replacement Warranty only applicable for Data Cables and 1 Year Warranty Applicable for GPS Telematics Devices.'
  );
  const [formSignatory, setFormSignatory] = useState('Ms. Mayuri Shinde');
  const [formTerms, setFormTerms] = useState(
    'Price Valid with MOQ and all parts as 1 PO\nPayment : 100 % Advance\nTax, Shipping : Extra if applicable\nQuote Validity : 7 Days or till quoted stock available\nEx Works : Sunyash Multi Trading\nTerms : Sunyash Multi Trading Pvt Ltd - India\nStock Subjected to Prior Sale, we may not be able to support if quoted stock lost'
  );
  const [formNotes, setFormNotes] = useState('Price Valid with MOQ and all parts as 1 PO');
  const [formPaymentMode, setFormPaymentMode] = useState<'COD' | 'Prepaid'>('Prepaid');

  const formatIndianDate = (dateStr?: string) => {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch {}
    return dateStr;
  };

  // Line Items in Form
  const [formItems, setFormItems] = useState<
    {
      itemType: 'PRODUCT' | 'RAW_MATERIAL';
      productId: string;
      productName: string;
      sku: string;
      unit: string;
      quantity: number;
      rate: number;
      discount: number;
      gstPercent: number;
      totalAmount: number;
      warrantyPeriod: string;
    }[]
  >([]);

  // Selected Item to Add
  const [selectedItemType, setSelectedItemType] = useState<'PRODUCT' | 'RAW_MATERIAL'>('PRODUCT');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [inputQuantity, setInputQuantity] = useState(1);
  const [inputRate, setInputRate] = useState(0);
  const [inputDiscount, setInputDiscount] = useState(0);
  const [inputGstPercent, setInputGstPercent] = useState(18);
  const [inputWarrantyPeriod, setInputWarrantyPeriod] = useState('1 Year');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    refreshProductsFromDB();
    refreshRawMaterialsFromDB();
    const nextCode = generateEntityCode('QUOTATION');
    setFormQuotationNumber(nextCode);
    setFormCustomerId(customers[0]?.id || '');
    setFormQuotationDate(new Date().toISOString().split('T')[0]);
    const validD = new Date();
    validD.setDate(validD.getDate() + 7);
    setFormValidUntil(validD.toISOString().split('T')[0]);
    setFormWarrantyPeriod('1 Year');
    setFormFreightCharges(330);
    setFormAdjustment(0);
    setFormDeliveryTerms('10-15 Working Days After Receiving Purchase Order & Full Payment.');
    setFormWarrantyTerms('6 Month Free Replacement Warranty only applicable for Data Cables and 1 Year Warranty Applicable for GPS Telematics Devices.');
    setFormSignatory('Ms. Mayuri Shinde');
    setFormNotes('Price Valid with MOQ and all parts as 1 PO');
    setFormTerms(
      'Price Valid with MOQ and all parts as 1 PO\nPayment : 100 % Advance\nTax, Shipping : Extra if applicable\nQuote Validity : 7 Days or till quoted stock available\nEx Works : Sunyash Multi Trading\nTerms : Sunyash Multi Trading Pvt Ltd - India\nStock Subjected to Prior Sale, we may not be able to support if quoted stock lost'
    );
    setFormPaymentMode('Prepaid');
    setFormItems([]);
    setSelectedItemType('PRODUCT');
    setSelectedItemId('');
    setInputQuantity(1);
    setInputRate(0);
    setInputDiscount(0);
    setInputGstPercent(18);
    setInputWarrantyPeriod('1 Year');
    setIsCreateModalOpen(true);
  };

  // When selectedItemId changes in Add Item row
  const handleItemSelect = (id: string, type: 'PRODUCT' | 'RAW_MATERIAL') => {
    setSelectedItemId(id);
    if (!id) {
      setInputRate(0);
      return;
    }
    if (type === 'PRODUCT') {
      const p = products.find((prod) => prod.id === id || prod.sku === id);
      if (p) {
        setInputRate(p.sellingPrice || 0);
        setInputGstPercent(p.gstPercent || 18);
      }
    } else {
      const rm = rawMaterials.find((m) => m.id === id || m.sku === id);
      if (rm) {
        setInputRate(rm.unitCost || 0);
        setInputGstPercent(18);
      }
    }
  };

  // Add Item to Form Items list
  const handleAddItemToForm = () => {
    if (!selectedItemId) {
      alert('Please select a Product or Raw Material.');
      return;
    }
    if (inputQuantity <= 0) {
      alert('Quantity must be greater than 0.');
      return;
    }

    let name = '';
    let sku = '';
    let unit = 'PCS';

    if (selectedItemType === 'PRODUCT') {
      const p = products.find((prod) => prod.id === selectedItemId || prod.sku === selectedItemId);
      if (!p) return;
      name = p.name;
      sku = p.sku;
      unit = 'PCS';
    } else {
      const rm = rawMaterials.find((m) => m.id === selectedItemId || m.sku === selectedItemId);
      if (!rm) return;
      name = rm.name;
      sku = rm.sku;
      unit = rm.unit || 'PCS';
    }

    const baseAmount = inputRate * inputQuantity;
    const discountVal = (baseAmount * inputDiscount) / 100;
    const taxable = baseAmount - discountVal;
    const gstVal = (taxable * inputGstPercent) / 100;
    const totalAmount = Math.round((taxable + gstVal) * 100) / 100;

    setFormItems((prev) => [
      ...prev,
      {
        itemType: selectedItemType,
        productId: selectedItemId,
        productName: name,
        sku,
        unit,
        quantity: inputQuantity,
        rate: inputRate,
        discount: inputDiscount,
        gstPercent: inputGstPercent,
        totalAmount,
        warrantyPeriod: inputWarrantyPeriod || formWarrantyPeriod || '1 Year',
      },
    ]);

    setSelectedItemId('');
    setInputQuantity(1);
    setInputRate(0);
    setInputDiscount(0);
    setInputWarrantyPeriod(formWarrantyPeriod || '1 Year');
  };

  const handleRemoveFormItem = (index: number) => {
    setFormItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculate form totals matching Sunyash Multi Trading PDF format
  const formCalculations = useMemo(() => {
    let itemsBaseTotal = 0;
    let totalDiscount = 0;

    formItems.forEach((item) => {
      const base = item.rate * item.quantity;
      const disc = (base * (item.discount || 0)) / 100;
      itemsBaseTotal += base;
      totalDiscount += disc;
    });

    const freight = Number(formFreightCharges) || 0;
    const adjustment = Number(formAdjustment) || 0;

    // In Sunyash PDF:
    // Sub Total = Items Base Total + Shipping Charges (e.g. 12,375.00 + 330.00 = 12,705.00)
    const subtotal = Math.round((itemsBaseTotal + freight) * 100) / 100;
    const taxableAfterDiscount = Math.max(0, subtotal - totalDiscount);
    // 18% Tax on Sub Total (e.g. 12,705 * 0.18 = 2,286.90)
    const taxAmount = Math.round(taxableAfterDiscount * 0.18 * 100) / 100;
    // Grand Total = Sub Total - Discount + Tax + Adjustment (e.g. 12,705.00 + 2,286.90 = 14,991.90)
    const grandTotal = Math.round((subtotal - totalDiscount + taxAmount + adjustment) * 100) / 100;

    return {
      subtotal,
      rawItemsSubtotal: Math.round(itemsBaseTotal * 100) / 100,
      discountAmount: Math.round(totalDiscount * 100) / 100,
      taxAmount,
      freightCharges: freight,
      adjustment,
      totalAmount: grandTotal,
    };
  }, [formItems, formFreightCharges, formAdjustment]);

  // Save Quotation
  const handleSaveQuotation = (initialStatus: QuotationStatus) => {
    if (!formCustomerId) {
      alert('Please select a Customer.');
      return;
    }
    if (formItems.length === 0) {
      alert('Please add at least one Product or Raw Material item to the quotation.');
      return;
    }

    const customer = customers.find((c) => c.id === formCustomerId);
    const customerName = customer ? customer.companyName || customer.name : 'Unknown Customer';
    const customerNumber = customer?.customerNumber || customer?.customerCode || 'CUS-101';

    const quotationData: Omit<Quotation, 'id'> = {
      quotationNumber: formQuotationNumber || generateEntityCode('QUOTATION'),
      customerId: formCustomerId,
      customerName,
      customerNumber,
      quotationDate: formQuotationDate,
      validUntil: formValidUntil,
      status: initialStatus,
      items: formItems.map((item, idx) => ({
        id: `qti_${Date.now()}_${idx}`,
        ...item,
      })),
      subtotal: formCalculations.subtotal,
      discountAmount: formCalculations.discountAmount,
      taxAmount: formCalculations.taxAmount,
      totalAmount: formCalculations.totalAmount,
      freightCharges: formCalculations.freightCharges,
      adjustment: formCalculations.adjustment,
      warrantyPeriod: formWarrantyPeriod || '1 Year',
      paymentMode: formPaymentMode,
      termsAndConditions: formTerms,
      notes: formNotes,
      contactPerson: customer?.contactPerson || customerName,
      billingAddress: customer?.address || '',
      shippingAddress: customer?.shippingAddress || customer?.address || '',
      customerGst: customer?.gstin || customer?.gstNumber || '',
      customerPhone: customer?.mobile || customer?.phone || '',
      deliveryTerms: formDeliveryTerms,
      warrantyTerms: formWarrantyTerms,
      signatory: formSignatory,
      salesperson: activeRole === 'ADMIN' ? 'Administrator' : 'Sales Person',
    };

    const res = createQuotation(quotationData);
    if (res.success) {
      showNotification('success', `Quotation ${quotationData.quotationNumber} saved as "${initialStatus}".`);
      setIsCreateModalOpen(false);
    } else {
      showNotification('error', res.message || 'Failed to save quotation.');
    }
  };

  // Searchable Customer Combobox Helpers
  const matchingCustomers = useMemo(() => {
    const q = customerSearchQuery.toLowerCase().trim();
    if (!q) return customers.slice(0, 8);
    return customers.filter((c) => {
      const cNum = (c.customerNumber || c.customerCode || '').toLowerCase();
      const cName = (c.name || '').toLowerCase();
      const comp = (c.companyName || '').toLowerCase();
      const mob = (c.mobile || '').toLowerCase();
      const person = (c.contactPerson || '').toLowerCase();
      const city = (c.city || '').toLowerCase();
      return (
        cNum.includes(q) ||
        cName.includes(q) ||
        comp.includes(q) ||
        mob.includes(q) ||
        person.includes(q) ||
        city.includes(q)
      );
    });
  }, [customers, customerSearchQuery]);

  const selectedCustomerObj = useMemo(() => {
    return customers.find((c) => c.id === formCustomerId);
  }, [customers, formCustomerId]);

  // Generate Invoice Handler (Strict rule: ONLY when Customer Approved)
  const handleGenerateInvoice = (quotation: Quotation) => {
    const isApproved =
      quotation.status === 'Customer Approved' ||
      quotation.status === 'Approved' ||
      quotation.status === 'Confirmed';

    if (!isApproved) {
      showNotification(
        'error',
        `Quotation status is "${quotation.status}". Invoice can ONLY be generated after "Customer Approved".`
      );
      return;
    }

    const res = createInvoiceFromQuotation(quotation.id);
    if (res.success) {
      showNotification(
        'success',
        `✓ ${res.message || 'Invoice generated successfully from Customer Approved quotation!'} View invoice in Invoices module to process payment.`
      );
      if (selectedQuotation && selectedQuotation.id === quotation.id) {
        setSelectedQuotation((prev) =>
          prev ? { ...prev, status: 'Invoice Generated' as QuotationStatus } : null
        );
      }
    } else {
      showNotification('error', res.message || 'Failed to generate invoice.');
    }
  };

  // Follow-up Handlers
  const handleOpenFollowUpModal = (quotation: Quotation) => {
    setFollowUpTargetQuote(quotation);
    setFuDate(new Date().toISOString().split('T')[0]);
    setFuTime('10:30 AM');
    setFuType('Call');
    setFuNotes(`Follow up with ${quotation.customerName} regarding quotation ${quotation.quotationNumber} approval`);
    const nextD = new Date();
    nextD.setDate(nextD.getDate() + 3);
    setFuNextDate(nextD.toISOString().split('T')[0]);
    setFuSalesperson(quotation.salesperson || (activeRole === 'ADMIN' ? 'Admin' : 'Sales Person'));
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpTargetQuote) return;

    const cust = customers.find((c) => c.id === followUpTargetQuote.customerId);
    const customerNumber =
      followUpTargetQuote.customerNumber || cust?.customerNumber || cust?.customerCode || 'CUS-101';

    const res = createFollowUpFull({
      type: 'Customer',
      leadOrCustomerId: followUpTargetQuote.customerId,
      leadOrCustomerName: followUpTargetQuote.customerName || cust?.name || 'Customer',
      customerName: followUpTargetQuote.customerName,
      customerNumber,
      companyName: cust?.companyName || followUpTargetQuote.customerName,
      contactPerson: cust?.contactPerson || '',
      mobile: cust?.mobile || '',
      email: cust?.email || '',
      quotationId: followUpTargetQuote.id,
      quotationNumber: followUpTargetQuote.quotationNumber,
      followUpType: fuType,
      purpose: `Quotation Follow-up: ${followUpTargetQuote.quotationNumber}`,
      followUpDate: fuDate,
      followUpTime: fuTime,
      nextFollowUpDate: fuNextDate,
      status: 'Pending',
      notes: fuNotes,
      assignedUser: fuSalesperson,
      salesperson: fuSalesperson,
    });

    if (res.success) {
      if (
        followUpTargetQuote.status === 'Sent to Customer' ||
        followUpTargetQuote.status === 'Sent to Client' ||
        followUpTargetQuote.status === 'Draft'
      ) {
        updateQuotationStatus(followUpTargetQuote.id, 'Follow-up Required');
      }
      showNotification('success', `✓ Follow-up scheduled for Quotation ${followUpTargetQuote.quotationNumber}.`);
      setIsFollowUpModalOpen(false);
    }
  };

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      // Tab filter
      if (statusTab !== 'ALL') {
        if (statusTab === 'Rejected') {
          if (q.status !== 'Rejected' && q.status !== 'Expired') return false;
        } else if (statusTab === 'Approved') {
          if (q.status !== 'Approved' && q.status !== 'Confirmed') return false;
        } else if (q.status !== statusTab) {
          return false;
        }
      }

      // Payment Mode filter
      if (paymentModeFilter !== 'ALL' && (q.paymentMode || 'Prepaid') !== paymentModeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchNum = q.quotationNumber.toLowerCase().includes(query);
        const matchCust = q.customerName.toLowerCase().includes(query);
        const matchSO = (q.orderNumber || '').toLowerCase().includes(query);
        const matchItem = q.items.some((i) => i.productName.toLowerCase().includes(query) || i.sku.toLowerCase().includes(query));
        return matchNum || matchCust || matchSO || matchItem;
      }

      return true;
    });
  }, [quotations, statusTab, paymentModeFilter, searchQuery]);

  // Statistics KPI counts
  const stats = useMemo(() => {
    const total = quotations.length;
    const drafts = quotations.filter((q) => q.status === 'Draft' || q.status === 'Sent to Customer' || q.status === 'Sent to Client').length;
    const approved = quotations.filter((q) => q.status === 'Customer Approved' || q.status === 'Approved' || q.status === 'Confirmed').length;
    const invoiceGenerated = quotations.filter((q) => q.status === 'Invoice Generated' || q.status === 'Payment Pending' || q.status === 'Payment Completed').length;
    const inProduction = quotations.filter(
      (q) =>
        q.status === 'Sent to Production' ||
        q.status === 'Sent to Product' ||
        q.status === 'In Production' ||
        q.status === 'Production Completed' ||
        q.status === 'Packing' ||
        q.status === 'Packed' ||
        q.status === 'Ready for Dispatch'
    ).length;
    const dispatched = quotations.filter((q) => q.status === 'Dispatched' || q.status === 'Completed').length;

    return { total, drafts, approved, invoiceGenerated, inProduction, dispatched };
  }, [quotations]);

  // Status Badge Helper
  const renderStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
      case 'Sent to Customer':
      case 'Sent to Client':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Sent to Customer</span>;
      case 'Follow-up Required':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">Follow-up Required</span>;
      case 'Customer Approved':
      case 'Approved':
      case 'Confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse flex items-center gap-1 w-max">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Customer Approved</span>
          </span>
        );
      case 'Invoice Generated':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Invoice Generated</span>;
      case 'Payment Pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">Payment Pending</span>;
      case 'Payment Completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Payment Completed</span>;
      case 'Sent to Production':
      case 'Sent to Product':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Sent to Production</span>;
      case 'In Production':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">In Production</span>;
      case 'Production Completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">Production Done</span>;
      case 'Packing':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">Packing</span>;
      case 'Packed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Packed</span>;
      case 'Ready for Dispatch':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white border border-blue-700">Ready for Dispatch</span>;
      case 'Dispatched':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Dispatched</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">Completed</span>;
      case 'Customer Rejected':
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Customer Rejected</span>;
      case 'Expired':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Expired</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <DashboardLayout
      roleTitle="Sales Management"
      roleBadge="Sales"
      navItems={SALES_NAV}
    >
      <div className="space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between shadow-md transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-bold">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-blue-600" /> Quotation Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Sales Workflow: Customer Creation → Quotation → Follow-up → Customer Approval → Invoice → Payment → Send to Production.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Quotation</span>
            </button>
          </div>
        </div>

        {/* Leads in Send Quotation Stage Notification */}
        {leadsRequestingQuote.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {leadsRequestingQuote.length}
              </div>
              <div>
                <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Leads Ready for Quotations ({leadsRequestingQuote.length})
                </h3>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Leads with status set to &apos;Send Quotation&apos; have automatically been converted to Customer CRM profiles and draft Quotations generated below for immediate review.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/sales/leads"
                className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
              >
                <span>View Leads</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Workflow Pipeline Guide Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50 border border-blue-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" /> Strict CRM & Sales to Production Workflow Pipeline
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
              <div className="text-slate-400 text-[10px] font-bold">STEP 1</div>
              <div className="font-bold text-slate-800 mt-0.5">Select Customer</div>
              <div className="text-[10px] text-slate-500">Searchable Selector</div>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
              <div className="text-blue-500 text-[10px] font-bold">STEP 2</div>
              <div className="font-bold text-blue-700 mt-0.5">Send Quote</div>
              <div className="text-[10px] text-slate-500">Follow-up on Date</div>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-emerald-300 bg-emerald-50/50">
              <div className="text-emerald-600 text-[10px] font-bold">STEP 3</div>
              <div className="font-bold text-emerald-800 mt-0.5">Customer Approved</div>
              <div className="text-[10px] text-emerald-700 font-semibold">Enables Invoice</div>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-purple-200 bg-purple-50/40">
              <div className="text-purple-600 text-[10px] font-bold">STEP 4</div>
              <div className="font-bold text-purple-800 mt-0.5">Generate Invoice</div>
              <div className="text-[10px] text-slate-500">Collect Payment</div>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-blue-200">
              <div className="text-blue-600 text-[10px] font-bold">STEP 5</div>
              <div className="font-bold text-blue-800 mt-0.5">Send Invoice to Prod</div>
              <div className="text-[10px] text-emerald-700 font-semibold">After 100% Payment</div>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
              <div className="text-emerald-600 text-[10px] font-bold">STEP 6</div>
              <div className="font-bold text-emerald-800 mt-0.5">Pack & Dispatch</div>
              <div className="text-[10px] text-slate-500">Stock Decrements</div>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Quotations</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Draft / Sent / Follow-up</div>
            <div className="text-xl font-bold text-blue-600 mt-1">{stats.drafts}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Customer Approved</div>
            <div className="text-xl font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
              <span>{stats.approved}</span>
              {stats.approved > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900 animate-pulse">
                  Invoice Ready
                </span>
              )}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/30 shadow-2xs">
            <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Invoice / Payment</div>
            <div className="text-xl font-bold text-purple-700 mt-1">{stats.invoiceGenerated}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Production / Pack / Done</div>
            <div className="text-xl font-bold text-blue-600 mt-1">{stats.inProduction + stats.dispatched}</div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {(
                [
                  'ALL',
                  'Draft',
                  'Sent to Client',
                  'Confirmed',
                  'Sent to Product',
                  'Packed',
                  'Ready for Dispatch',
                  'Dispatched',
                  'Rejected',
                ] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    statusTab === tab
                      ? tab === 'Confirmed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {tab === 'ALL'
                    ? 'All'
                    : tab === 'Confirmed'
                    ? 'Confirmed (Ready to Send)'
                    : tab === 'Rejected'
                    ? 'Rejected / Expired'
                    : tab}
                </button>
              ))}
            </div>

            {/* Payment Mode Filter & Search Input */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                {(['ALL', 'COD', 'Prepaid'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentModeFilter(mode)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      paymentModeFilter === mode
                        ? mode === 'COD'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode === 'COD' && <HandCoins className="w-3 h-3" />}
                    {mode === 'Prepaid' && <CreditCard className="w-3 h-3" />}
                    <span>{mode === 'ALL' ? 'All Payment' : mode}</span>
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Quote #, Customer, Product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quotations List Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3.5 px-4">Quotation #</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date / Validity</th>
                  <th className="py-3.5 px-4">Warranty</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4 text-right">Total (₹)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Workflow Action</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No quotations found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((q) => {
                    const isApproved = q.status === 'Approved' || q.status === 'Confirmed';
                    const isSentToProduction =
                      q.status === 'Sent to Production' ||
                      q.status === 'Sent to Product' ||
                      q.status === 'In Production' ||
                      q.status === 'Production Completed' ||
                      q.status === 'Packing' ||
                      q.status === 'Packed' ||
                      q.status === 'Ready for Dispatch' ||
                      q.status === 'Dispatched';

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/60 transition">
                        {/* Quotation Number */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap align-middle">
                          <div className="flex items-center gap-1.5">
                            <span className="text-blue-700 font-extrabold">{q.quotationNumber}</span>
                          </div>
                          {q.orderNumber && (
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                              <span>SO:</span>
                              <Link
                                href="/sales/orders"
                                className="text-blue-600 hover:underline font-bold"
                              >
                                {q.orderNumber}
                              </Link>
                            </div>
                          )}
                        </td>

                        {/* Payment Mode (COD / Prepaid) */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                          {q.paymentMode === 'COD' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                              <HandCoins className="w-3 h-3 text-amber-600" />
                              <span>COD</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                              <CreditCard className="w-3 h-3 text-blue-500" />
                              <span>Prepaid</span>
                            </span>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4 font-semibold text-slate-800 align-middle">
                          <div className="truncate max-w-[170px]">{q.customerName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {q.salesperson && (
                              <span className="text-[10px] text-slate-400 font-medium">By: {q.salesperson}</span>
                            )}
                            {(q.notes?.includes('Lead') || customers.some((c) => c.id === q.customerId && c.convertedFromLeadId)) && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                From Lead
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date / Validity */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 align-middle">
                          <div className="font-semibold text-slate-800">{q.quotationDate}</div>
                          <div className="text-[10px] text-slate-400">Valid: {q.validUntil}</div>
                        </td>

                        {/* Warranty Period */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{q.warrantyPeriod || '1 Year'}</span>
                          </div>
                        </td>

                        {/* Items Summary */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="text-slate-700 font-medium truncate max-w-[200px]">
                            {q.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {q.items.length} {q.items.length === 1 ? 'item' : 'items'}
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap align-middle">
                          <div>₹{q.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Tax: ₹{q.taxAmount.toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                          {renderStatusBadge(q.status)}
                        </td>

                        {/* Workflow Action (Generate Invoice / Customer Decision / Follow-up) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                          {q.status === 'Customer Approved' || q.status === 'Approved' || q.status === 'Confirmed' ? (
                            /* STRICT RULE: ONLY when Customer Approved, show "Generate Invoice" button */
                            <button
                              onClick={() => handleGenerateInvoice(q)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 mx-auto transition cursor-pointer hover:scale-105"
                              title="Customer Approved! Click to automatically generate Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Generate Invoice</span>
                            </button>
                          ) : q.status === 'Draft' ? (
                            <button
                              onClick={() => updateQuotationStatus(q.id, 'Sent to Customer')}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition cursor-pointer"
                            >
                              Send to Customer
                            </button>
                          ) : q.status === 'Sent to Customer' || q.status === 'Sent to Client' || q.status === 'Follow-up Required' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  updateQuotationStatus(q.id, 'Customer Approved');
                                  showNotification('success', `✓ Quotation ${q.quotationNumber} is marked Customer Approved. You can now Generate Invoice.`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-300 transition cursor-pointer flex items-center gap-1"
                                title="Customer has approved quotation"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleOpenFollowUpModal(q)}
                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-[11px] border border-amber-200 transition cursor-pointer flex items-center gap-1"
                                title="Schedule Follow-up"
                              >
                                <Calendar className="w-3 h-3" />
                                <span>Follow-up</span>
                              </button>
                              <button
                                onClick={() => updateQuotationStatus(q.id, 'Customer Rejected')}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] border border-rose-200 transition cursor-pointer"
                                title="Customer rejected quotation"
                              >
                                Reject
                              </button>
                            </div>
                          ) : q.status === 'Invoice Generated' || q.status === 'Payment Pending' ? (
                            <Link
                              href="/sales/invoices"
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition shadow-2xs"
                              title="Invoice generated. Click to view invoice and record payment"
                            >
                              <FileText className="w-3.5 h-3.5 text-purple-600" />
                              <span>Invoice Generated (Awaiting Payment)</span>
                            </Link>
                          ) : q.status === 'Payment Completed' ? (
                            <Link
                              href="/sales/invoices"
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 transition shadow-2xs"
                              title="Full Payment Received. Order ready for Production"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Paid → Ready for Production</span>
                            </Link>
                          ) : q.status === 'Customer Rejected' || q.status === 'Rejected' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              Customer Rejected
                            </span>
                          ) : q.status === 'Expired' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Expired
                            </span>
                          ) : isSentToProduction ? (
                            <Link
                              href="/product/orders"
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition shadow-2xs group"
                              title="Click to view & process on Production side"
                            >
                              <PackageCheck className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                              <span>{q.status}</span>
                              <ExternalLink className="w-3 h-3 text-blue-400 group-hover:text-blue-600" />
                            </Link>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No action</span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Follow-up button */}
                            <button
                              onClick={() => handleOpenFollowUpModal(q)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition cursor-pointer"
                              title="Add / Schedule Follow-up"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>

                            {/* View / Print modal */}
                            <button
                              onClick={() => {
                                setSelectedQuotation(q);
                                setIsViewModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition cursor-pointer"
                              title="View & Print Quotation Format"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Status Quick Dropdown */}
                            <select
                              value={q.status}
                              onChange={(e) => updateQuotationStatus(q.id, e.target.value as QuotationStatus)}
                              className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                              <option value="Draft">Draft</option>
                              <option value="Sent to Client">Sent to Client</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Expired">Expired</option>
                              <option value="Sent to Production">Sent to Production</option>
                              <option value="In Production">In Production</option>
                              <option value="Packed">Packed</option>
                              <option value="Ready for Dispatch">Ready for Dispatch</option>
                              <option value="Dispatched">Dispatched</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CREATE QUOTATION MODAL */}
        {/* ======================================================== */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Create New Quotation</h3>
                    <p className="text-xs text-slate-500">
                      Configure customer details, warranty period, product items, and tax rates.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                {/* 1. Header Metadata Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Quotation Number</label>
                    <input
                      type="text"
                      value={formQuotationNumber}
                      onChange={(e) => setFormQuotationNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Quotation Date</label>
                    <input
                      type="date"
                      value={formQuotationDate}
                      onChange={(e) => setFormQuotationDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={formValidUntil}
                      onChange={(e) => setFormValidUntil(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Payment Type:</span>
                      <span className={`text-[10px] font-extrabold ${formPaymentMode === 'COD' ? 'text-amber-600' : 'text-blue-600'}`}>
                        {formPaymentMode === 'COD' ? 'Cash on Delivery' : 'Prepaid Order'}
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-white border border-slate-200 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setFormPaymentMode('COD');
                          setFormTerms((prev) =>
                            prev.replace(/Payment terms: .*/i, 'Payment terms: Cash on Delivery (COD) upon product receipt.')
                          );
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          formPaymentMode === 'COD'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <HandCoins className="w-3.5 h-3.5" />
                        <span>COD</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormPaymentMode('Prepaid');
                          setFormTerms((prev) =>
                            prev.replace(/Payment terms: .*/i, 'Payment terms: Net 30 days from invoice date.')
                          );
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          formPaymentMode === 'Prepaid'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Prepaid</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1B. Searchable Customer Selector & Auto-fetched Profile */}
                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>Search & Select Customer</span>
                      <span className="text-[10px] text-blue-600 font-normal ml-1">
                        (Search by: Customer Number, Customer Name, Company Name, Mobile Number)
                      </span>
                    </label>
                    {selectedCustomerObj && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Customer Auto-Fetched: {selectedCustomerObj.customerNumber || selectedCustomerObj.customerCode || 'CUS-101'}
                      </span>
                    )}
                  </div>

                  {/* Search Input Box */}
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search: CUS-101, ABC Industries, or 9876543210..."
                          value={customerSearchQuery}
                          onFocus={() => setIsCustomerSelectorOpen(true)}
                          onChange={(e) => {
                            setCustomerSearchQuery(e.target.value);
                            setIsCustomerSelectorOpen(true);
                          }}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-600 shadow-xs font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomerSelectorOpen((prev) => !prev)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors"
                      >
                        {isCustomerSelectorOpen ? 'Close List' : 'Browse Customers'}
                      </button>
                    </div>

                    {/* Search Results Dropdown List */}
                    {isCustomerSelectorOpen && (
                      <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                        {matchingCustomers.length === 0 ? (
                          <div className="p-4 text-center text-slate-500 text-xs">
                            No customers found matching &quot;{customerSearchQuery}&quot;. Please verify the Customer Number, Company, Name, or Mobile.
                          </div>
                        ) : (
                          matchingCustomers.map((c) => {
                            const isSelected = c.id === formCustomerId;
                            const cCode = c.customerNumber || c.customerCode || 'CUS-101';
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setFormCustomerId(c.id);
                                  setIsCustomerSelectorOpen(false);
                                  setCustomerSearchQuery(`${c.companyName || c.name} (${cCode})`);
                                }}
                                className={`w-full text-left p-3 hover:bg-blue-50/80 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                                  isSelected ? 'bg-blue-50/90 border-l-4 border-blue-600' : ''
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-xs">
                                      {c.companyName || c.name}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                      {cCode}
                                    </span>
                                    {(c.gstin || c.gstNumber) && (
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        GSTIN: {c.gstin || c.gstNumber}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                                    <span>Contact: <strong className="text-slate-800">{c.contactPerson || c.name}</strong></span>
                                    <span>Mobile: <strong className="text-slate-800">{c.mobile || 'N/A'}</strong></span>
                                    {c.city && <span>City: <strong className="text-slate-800">{c.city}</strong></span>}
                                  </div>
                                </div>
                                {isSelected ? (
                                  <span className="text-xs font-bold text-blue-600 shrink-0 bg-blue-100/60 px-2 py-1 rounded">Selected ✓</span>
                                ) : (
                                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-blue-600">Select →</span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Auto-fetched Customer Information Card (No manual re-entry) */}
                  {selectedCustomerObj ? (
                    <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-slate-700">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Number</div>
                        <div className="font-mono font-bold text-xs text-blue-700 mt-0.5">
                          {selectedCustomerObj.customerNumber || selectedCustomerObj.customerCode || 'CUS-101'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company / Name</div>
                        <div className="font-bold text-xs text-slate-900 mt-0.5">
                          {selectedCustomerObj.companyName || selectedCustomerObj.name}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact & Mobile</div>
                        <div className="text-xs font-semibold text-slate-800 mt-0.5">
                          {selectedCustomerObj.contactPerson || selectedCustomerObj.name} • {selectedCustomerObj.mobile || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GSTIN / Tax ID</div>
                        <div className="font-mono text-xs text-slate-800 mt-0.5">
                          {selectedCustomerObj.gstin || selectedCustomerObj.gstNumber || 'Unregistered'}
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Billing Address</div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {selectedCustomerObj.address || 'N/A'}{selectedCustomerObj.city ? `, ${selectedCustomerObj.city}` : ''}{selectedCustomerObj.state ? `, ${selectedCustomerObj.state}` : ''} {selectedCustomerObj.pincode ? `- ${selectedCustomerObj.pincode}` : ''}
                        </div>
                      </div>
                      <div className="sm:col-span-1 flex items-center justify-end">
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          ✓ Auto-Populated
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Please search and select an existing customer from the dropdown above.</span>
                    </div>
                  )}
                </div>

                {/* 2. Warranty & Freight Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/40 p-4 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Product Warranty Period Option:</span>
                    </label>
                    <select
                      value={formWarrantyPeriod}
                      onChange={(e) => {
                        setFormWarrantyPeriod(e.target.value);
                        setInputWarrantyPeriod(e.target.value);
                        // Also update warranty in terms
                        setFormTerms(
                          (prev) =>
                            prev.replace(
                              /Standard .* Warranty/i,
                              `Standard ${e.target.value} Warranty`
                            )
                        );
                      }}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs text-emerald-900 font-bold focus:outline-none focus:border-emerald-600"
                    >
                      <option value="1 Year">1 Year Standard Warranty</option>
                      <option value="6 Months">6 Months Warranty</option>
                      <option value="2 Years">2 Years Extended Warranty</option>
                      <option value="3 Years">3 Years Commercial Warranty</option>
                      <option value="3 Months">3 Months Warranty</option>
                      <option value="No Warranty">No Warranty (As is)</option>
                    </select>
                    <p className="text-[10px] text-emerald-700 mt-1">
                      * Warranty is printed on the quotation description and terms (serial number required).
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Shipping / Freight Charges (₹) - Included in Sub Total:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formFreightCharges}
                      onChange={(e) => setFormFreightCharges(parseFloat(e.target.value || '0'))}
                      placeholder="e.g. 330"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      * In Sunyash quotation format, shipping charges are included in Sub Total and subject to 18% GST.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Adjustment / Round Off (₹):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formAdjustment}
                      onChange={(e) => setFormAdjustment(parseFloat(e.target.value || '0'))}
                      placeholder="e.g. 0.00"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      * Appears as Adjustment line in Quotation Grand Total calculation.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Authorized Signatory Name:
                    </label>
                    <input
                      type="text"
                      value={formSignatory}
                      onChange={(e) => setFormSignatory(e.target.value)}
                      placeholder="Ms. Mayuri Shinde"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* 3. Add Line Item Section */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-blue-600" /> Add Product or Raw Material Item
                    </span>
                    {/* Item type toggle */}
                    <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItemType('PRODUCT');
                          setSelectedItemId('');
                          setInputRate(0);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                          selectedItemType === 'PRODUCT'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Finished Product
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItemType('RAW_MATERIAL');
                          setSelectedItemId('');
                          setInputRate(0);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                          selectedItemType === 'RAW_MATERIAL'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Raw Material
                      </button>
                    </div>
                  </div>

                  {/* Add Row Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* Item Dropdown */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Select {selectedItemType === 'PRODUCT' ? 'Product' : 'Material'}
                      </label>
                      <select
                        value={selectedItemId}
                        onChange={(e) => handleItemSelect(e.target.value, selectedItemType)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                      >
                        <option value="">-- Choose item --</option>
                        {selectedItemType === 'PRODUCT'
                          ? products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) - Stock: {p.currentStock} - ₹{p.sellingPrice}
                              </option>
                            ))
                          : rawMaterials.map((rm) => (
                              <option key={rm.id} value={rm.id}>
                                {rm.name} ({rm.sku}) - Stock: {rm.currentStock} {rm.unit} - ₹{rm.unitCost}
                              </option>
                            ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={inputQuantity}
                        onChange={(e) => setInputQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 text-center"
                      />
                    </div>

                    {/* Rate */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={inputRate}
                        onChange={(e) => setInputRate(parseFloat(e.target.value || '0'))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 text-right"
                      />
                    </div>

                    {/* Discount % */}
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Disc %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={inputDiscount}
                        onChange={(e) => setInputDiscount(parseFloat(e.target.value || '0'))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 text-center"
                      />
                    </div>

                    {/* GST % */}
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">GST %</label>
                      <select
                        value={inputGstPercent}
                        onChange={(e) => setInputGstPercent(parseFloat(e.target.value || '18'))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-1.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 text-center"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>

                    {/* Warranty Period for this item */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Warranty</label>
                      <input
                        type="text"
                        value={inputWarrantyPeriod}
                        onChange={(e) => setInputWarrantyPeriod(e.target.value)}
                        placeholder="e.g. 1 Year"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    {/* Add Item Button */}
                    <div className="sm:col-span-1">
                      <button
                        type="button"
                        onClick={handleAddItemToForm}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center transition"
                        title="Add item to quotation"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items Added Table */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Quotation Line Items ({formItems.length})
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3">Item Description</th>
                          <th className="py-2.5 px-2 text-center">Warranty</th>
                          <th className="py-2.5 px-2 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                          <th className="py-2.5 px-2 text-center">Disc %</th>
                          <th className="py-2.5 px-2 text-center">GST %</th>
                          <th className="py-2.5 px-3 text-right">Total (₹)</th>
                          <th className="py-2.5 px-2 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formItems.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              No items added yet. Choose a Product or Raw Material above and click &quot;+&quot;.
                            </td>
                          </tr>
                        ) : (
                          formItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                <div>{item.productName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {item.sku} ({item.itemType})
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  {item.warrantyPeriod || formWarrantyPeriod || '1 Year'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                                ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-2 text-center text-slate-600">
                                {item.discount > 0 ? `${item.discount}%` : '-'}
                              </td>
                              <td className="py-2.5 px-2 text-center text-slate-600">{item.gstPercent}%</td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900">
                                ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFormItem(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Calculation Summary Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-xs text-slate-500">
                    <div>* All taxes calculated automatically based on entered GST rates.</div>
                    <div>* Freight charges of ₹{formCalculations.freightCharges} added with 18% IGST.</div>
                    <div>* Confirmed quotations unlock immediate handoff to Product Team.</div>
                  </div>
                  <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold">₹{formCalculations.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {formCalculations.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount:</span>
                        <span className="font-semibold">-₹{formCalculations.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {formCalculations.freightCharges > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Freight Charges:</span>
                        <span className="font-semibold">₹{formCalculations.freightCharges.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>GST Tax (IGST/CGST):</span>
                      <span className="font-semibold">+₹{formCalculations.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-1">
                      <span>Total Amount:</span>
                      <span className="text-blue-700">₹{formCalculations.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Terms & Conditions</label>
                    <textarea
                      rows={3}
                      value={formTerms}
                      onChange={(e) => setFormTerms(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Serial Number Notes</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Sr.No.105 (Replacement is given only when serial number is present on the cable)..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveQuotation('Draft')}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveQuotation('Sent to Client')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Save & Send to Client
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveQuotation('Confirmed')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save as Confirmed</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW & PRINT QUOTATION / TAX INVOICE FORMAT MODAL */}
        {/* MATCHES THE SUNYASH MULTI TRADING PVT LTD FORMAT (IMAGE) */}
        {/* ======================================================== */}
        {isViewModalOpen && selectedQuotation && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:m-0 print:overflow-visible print:rounded-none">
              {/* Modal Top Control Bar */}
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-100/90 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 text-xs">
                    Quotation Document: {selectedQuotation.quotationNumber}
                  </span>
                  {renderStatusBadge(selectedQuotation.status)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Document</span>
                  </button>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Exact Paper Document Formatted Container (Matches User's Sunyash Quotation PDF) */}
              <div className="p-4 md:p-8 overflow-y-auto flex-1 font-sans text-slate-900 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
                {(() => {
                  const cust = customers.find((c) => c.id === selectedQuotation.customerId);
                  const accountName = selectedQuotation.customerName || cust?.name || 'BTM SHOPPEE';
                  const contactName = selectedQuotation.contactPerson || cust?.contactPerson || 'Naveen Kumar Kanakaraj';
                  const billAddress = selectedQuotation.billingAddress || cust?.address || 'No 94,100 Feet Ring Road, BTM 1 st Stage Next to Citi Bank ATM';
                  const shipAddress = selectedQuotation.shippingAddress || cust?.shippingAddress || billAddress;
                  const city = cust?.city || 'Banglore';
                  const state = cust?.state || 'Karnataka';
                  const pincode = cust?.pincode || '560029';
                  const gstNo = selectedQuotation.customerGst || cust?.gstNumber || '29ACYPA5997Q1Z6';
                  const phoneNo = selectedQuotation.customerPhone || cust?.phone || '8152876531';

                  const itemsTotal = (selectedQuotation.items || []).reduce((sum, it) => sum + (it.rate * it.quantity), 0);
                  const freight = Number(selectedQuotation.freightCharges ?? (selectedQuotation.subtotal > itemsTotal ? selectedQuotation.subtotal - itemsTotal : 0));
                  const subTotal = itemsTotal + freight;
                  const discountVal = Number(selectedQuotation.discount || 0);
                  const taxVal = Number(selectedQuotation.taxAmount || 0);
                  const adjVal = Number(selectedQuotation.adjustment || 0);
                  const grandTotalVal = Number(selectedQuotation.totalAmount || (subTotal - discountVal + taxVal + adjVal));

                  const fmtPrice = (val: number) =>
                    `Rs. ${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                  return (
                    <div className="max-w-[820px] mx-auto bg-white shadow-lg print:shadow-none print:max-w-none text-[#111] font-sans">
                      {/* PAGE 1 */}
                      <div className="p-8 md:p-10 min-h-[1050px] flex flex-col justify-between print:min-h-0 print:p-8">
                        <div>
                          {/* Header: Company Logo & Details (Left) + Big Serif "Quote" & Meta (Right) */}
                          <div className="flex justify-between items-start pb-4">
                            {/* Company Branding */}
                            <div className="flex items-start gap-4">
                              <img
                                src="/sunyash-logo.png"
                                alt="Sunyash Logo"
                                className="w-16 h-16 object-contain shrink-0 mt-0.5"
                              />
                              <div className="text-[12px] leading-tight text-slate-800 space-y-0.5">
                                <div className="font-bold text-[14px] text-black">Sunyash Multi Trading Pvt Ltd</div>
                                <div>Devyani Heights, B-5, Kaspate Wasti Rd</div>
                                <div>Pune</div>
                                <div>Maharashtra</div>
                                <div>India 411057</div>
                                <div className="font-semibold text-black">GSTIN: 27AAXCS4923Q1Z8</div>
                                <div>Phone: 9503009988 &nbsp; Email: sales@mapout24.com</div>
                              </div>
                            </div>

                            {/* Quote Title & Details */}
                            <div className="text-right">
                              <h1 className="text-4xl font-serif font-normal text-black tracking-tight">Quote</h1>
                              <div className="text-[12px] text-slate-800 mt-2 space-y-0.5">
                                <div>
                                  Valid Until: {formatIndianDate(selectedQuotation.validUntil) || '21/10/2026'}
                                </div>
                                <div className="font-medium">
                                  Quote Number : {selectedQuotation.quotationNumber}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* BILL TO & SHIP TO Columns */}
                          <div className="grid grid-cols-2 gap-8 pt-4 pb-3 text-[12px] leading-snug">
                            {/* BILL TO */}
                            <div>
                              <div className="font-bold text-[13px] text-black uppercase mb-1">BILL TO:</div>
                              <div className="font-bold text-[13px] text-black mb-0.5">{accountName}</div>
                              <div className="text-slate-800">{billAddress}</div>
                              <div className="text-slate-800">{city}</div>
                              <div className="text-slate-800">{state} - {pincode}</div>
                              <div className="text-slate-800">India</div>
                              <div className="font-semibold text-black mt-1">GST No - {gstNo}</div>
                            </div>

                            {/* SHIP TO */}
                            <div>
                              <div className="font-bold text-[13px] text-black uppercase mb-1">SHIP TO:</div>
                              <div className="font-bold text-[13px] text-black mb-0.5">{accountName}</div>
                              <div className="text-slate-800">{shipAddress}</div>
                              <div className="text-slate-800">{city}</div>
                              <div className="text-slate-800">{state} - {pincode}</div>
                              <div className="text-slate-800">India</div>
                              <div className="font-semibold text-black mt-1">Mo No - {phoneNo}</div>
                            </div>
                          </div>

                          {/* Account & Quote Stage Bar */}
                          <div className="bg-slate-50 border-y border-slate-200 py-1.5 px-3 my-3 text-[12px] flex justify-between items-start">
                            <div className="space-y-0.5">
                              <div>
                                <span className="text-slate-700">Account Name:</span>
                                <span className="font-bold text-black ml-1">{accountName}</span>
                              </div>
                              <div>
                                <span className="text-slate-700">Contact Name:</span>
                                <span className="font-bold text-black ml-1">{contactName}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-700">Quote Stage:</span>
                              <span className="font-bold text-black ml-1">
                                {selectedQuotation.status || 'Draft'}
                              </span>
                            </div>
                          </div>

                          {/* Products Table */}
                          <div className="mt-4">
                            <table className="w-full text-left border-collapse text-[12px]">
                              <thead>
                                <tr className="border-t-2 border-b-2 border-slate-300 font-bold text-black">
                                  <th className="py-2 pr-2 w-12">S.No.</th>
                                  <th className="py-2 px-2">Product Details</th>
                                  <th className="py-2 px-2 w-20">Quantity</th>
                                  <th className="py-2 px-2 w-28 text-right">List Price</th>
                                  <th className="py-2 pl-2 w-32 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(selectedQuotation.items || []).map((it, idx) => (
                                  <tr key={idx} className="align-top">
                                    <td className="py-2.5 pr-2 font-medium text-slate-800">{idx + 1}</td>
                                    <td className="py-2.5 px-2">
                                      <div className="font-medium text-black">{it.productName}</div>
                                      {it.sku && it.sku !== it.productName && (
                                        <div className="text-[11px] text-slate-500 font-mono">{it.sku}</div>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-2 font-medium text-slate-900">{it.quantity}</td>
                                    <td className="py-2.5 px-2 text-right font-medium text-slate-900">
                                      {fmtPrice(it.rate)}
                                    </td>
                                    <td className="py-2.5 pl-2 text-right font-medium text-slate-900">
                                      {fmtPrice(it.rate * it.quantity)}
                                    </td>
                                  </tr>
                                ))}

                                {/* Shipping Charges line item if present */}
                                {freight > 0 && (
                                  <tr className="align-top">
                                    <td className="py-2.5 pr-2 font-medium text-slate-800">
                                      {(selectedQuotation.items || []).length + 1}
                                    </td>
                                    <td className="py-2.5 px-2 font-medium text-black">Shipping Charges</td>
                                    <td className="py-2.5 px-2 font-medium text-slate-900">1</td>
                                    <td className="py-2.5 px-2 text-right font-medium text-slate-900">
                                      {fmtPrice(freight)}
                                    </td>
                                    <td className="py-2.5 pl-2 text-right font-medium text-slate-900">
                                      {fmtPrice(freight)}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

                            {/* Dotted line below table */}
                            <div className="border-b border-dotted border-slate-300 mt-1 mb-2"></div>

                            {/* Financial Summary */}
                            <div className="flex justify-end pt-1 pb-4">
                              <div className="w-72 text-[12px] space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-black">Sub Total</span>
                                  <span className="font-bold text-black">{fmtPrice(subTotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-700">
                                  <span>Discount</span>
                                  <span>{fmtPrice(discountVal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-700">
                                  <span>Tax</span>
                                  <span>{fmtPrice(taxVal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-700">
                                  <span>Adjustment</span>
                                  <span>{fmtPrice(adjVal)}</span>
                                </div>
                                <div className="flex justify-between items-center font-bold text-[13px] text-black pt-1.5 border-t border-slate-300">
                                  <span>Grand Total</span>
                                  <span>{fmtPrice(grandTotalVal)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Terms, QR & Bank Details */}
                        <div className="pt-4 space-y-4">
                          {/* Terms and Conditions */}
                          <div className="border-t border-slate-300 pt-3">
                            <h2 className="font-bold text-[13px] text-black mb-2">Terms and Conditions</h2>
                            <div className="text-[12px] leading-relaxed text-slate-800 space-y-1">
                              <div>
                                <span className="font-bold">Delivery: </span>
                                <span>
                                  {selectedQuotation.deliveryTerms ||
                                    '10-15 Working Days After Receiving Purchase Order & Full Payment.'}
                                </span>
                              </div>
                              <div>
                                <span className="font-bold">Product Warranty : </span>
                                <span>
                                  {selectedQuotation.warrantyTerms ||
                                    '6 Month Free Replacement Warranty only applicable for Data Cables and 1 Year Warranty Applicable for GPS Telematics Devices.'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Scan To Pay UPI */}
                          <div>
                            <div className="text-[12px] text-slate-700 mb-1.5 font-medium">Scan To Pay UPI</div>
                            <div className="flex items-start gap-4">
                              <div>
                                <img
                                  src="/sunyash-upi-qr.png"
                                  alt="Scan to pay UPI"
                                  className="w-28 h-28 object-contain border border-slate-200 p-1 bg-white shadow-xs"
                                />
                                <div className="text-[10px] text-slate-600 font-mono mt-1">
                                  UPI ID: mnshinde2011-6@okhdfcbank
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bank Details */}
                          <div className="text-[12px] leading-snug space-y-0.5">
                            <div className="font-bold text-[13px] text-black mb-1">Bank Details :</div>
                            <div>
                              <span className="font-bold text-black">Bank Name: </span>
                              <span className="text-slate-800">HDFC Bank Ltd</span>
                            </div>
                            <div>
                              <span className="font-bold text-black">Account Name : </span>
                              <span className="text-slate-800">Sunyash Multi Trading Pvt Ltd</span>
                            </div>
                            <div>
                              <span className="font-bold text-black">Account Number : </span>
                              <span className="text-slate-800">50200023896104</span>
                            </div>
                            <div>
                              <span className="font-bold text-black">IFSC Code : </span>
                              <span className="text-slate-800">HDFC0004887</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PAGE BREAK INDICATOR (Screen Preview) */}
                      <div className="my-6 border-t-2 border-dashed border-slate-300 relative print:hidden">
                        <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-slate-200 text-slate-700 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                          Page 2
                        </span>
                      </div>

                      {/* PAGE 2 */}
                      <div className="p-8 md:p-10 min-h-[700px] flex flex-col justify-between print:break-before-page print:min-h-0 print:p-8">
                        <div>
                          {/* Bank Address */}
                          <div className="font-bold text-[13px] text-black mb-4">
                            Bank Address:- WAKAD PUNE MAHARASHTRA
                          </div>

                          {/* 7-Row Boxed Terms Table */}
                          <div className="border-2 border-black divide-y-2 divide-black text-[12px] font-bold text-black">
                            <div className="p-2 px-3">
                              Price Valid with MOQ and all parts as 1 PO
                            </div>
                            <div className="p-2 px-3 flex">
                              <span className="w-36 shrink-0">Payment</span>
                              <span>: 100 % Advance</span>
                            </div>
                            <div className="p-2 px-3 flex">
                              <span className="w-36 shrink-0">Tax, Shipping</span>
                              <span>: Extra if applicable</span>
                            </div>
                            <div className="p-2 px-3 flex">
                              <span className="w-36 shrink-0">Quote Validity</span>
                              <span>: 7 Days or till quoted stock available</span>
                            </div>
                            <div className="p-2 px-3 flex">
                              <span className="w-36 shrink-0">Ex Works</span>
                              <span>: Sunyash Multi Trading</span>
                            </div>
                            <div className="p-2 px-3 flex">
                              <span className="w-36 shrink-0">Terms</span>
                              <span>: Sunyash Multi Trading Pvt Ltd - India</span>
                            </div>
                            <div className="p-2 px-3">
                              Stock Subjected to Prior Sale, we may not be able to support if quoted stock lost
                            </div>
                          </div>

                          {/* Authorized Signatory */}
                          <div className="font-mono text-[13px] text-black space-y-4 pt-8">
                            <div>Authorized Signatory:</div>
                            <div className="pt-2 font-sans font-medium text-[13px]">
                              {selectedQuotation.signatory || 'Ms. Mayuri Shinde'}
                            </div>
                          </div>
                        </div>

                        {/* Computer Generated Disclaimer */}
                        <div className="text-center text-[10px] font-medium text-slate-400 pt-8 italic print:hidden">
                          Sunyash Multi Trading Pvt Ltd &bull; Computer Generated Quotation
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer Workflow Actions */}
              <div className="p-4 border-t border-slate-200 flex flex-wrap items-center justify-between bg-slate-50 shrink-0 print:hidden">
                <div className="text-xs">
                  {selectedQuotation.status === 'Customer Approved' || selectedQuotation.status === 'Approved' || selectedQuotation.status === 'Confirmed' ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Customer Approved! Click &quot;Generate Invoice&quot; to create invoice for payment.</span>
                    </span>
                  ) : selectedQuotation.status === 'Invoice Generated' ? (
                    <span className="text-purple-700 font-bold flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-purple-600" />
                      <span>Invoice Generated! Customer payment pending before production.</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 font-medium">
                      Current Status: <strong className="text-slate-900">{selectedQuotation.status}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* GENERATE INVOICE: Appears ONLY when Customer Approved */}
                  {(selectedQuotation.status === 'Customer Approved' || selectedQuotation.status === 'Approved' || selectedQuotation.status === 'Confirmed') && (
                    <button
                      onClick={() => {
                        handleGenerateInvoice(selectedQuotation);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer animate-pulse"
                      title="Generate official Invoice from this approved quotation"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Generate Invoice</span>
                    </button>
                  )}

                  {selectedQuotation.status === 'Invoice Generated' && (
                    <Link
                      href="/sales/invoices"
                      className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Invoices & Payments →</span>
                    </Link>
                  )}

                  {/* Customer Decision Actions after Follow-up */}
                  {(selectedQuotation.status === 'Sent to Customer' ||
                    selectedQuotation.status === 'Sent to Client' ||
                    selectedQuotation.status === 'Follow-up Required') && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          updateQuotationStatus(selectedQuotation.id, 'Customer Approved');
                          setSelectedQuotation((prev) => (prev ? { ...prev, status: 'Customer Approved' as QuotationStatus } : null));
                          showNotification('success', `Quotation ${selectedQuotation.quotationNumber} is marked as Customer Approved! You can now generate the Invoice.`);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Customer Approved</span>
                      </button>

                      <button
                        onClick={() => {
                          handleOpenFollowUpModal(selectedQuotation);
                        }}
                        className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Schedule Follow-up</span>
                      </button>

                      <button
                        onClick={() => {
                          updateQuotationStatus(selectedQuotation.id, 'Customer Rejected');
                          setSelectedQuotation((prev) => (prev ? { ...prev, status: 'Customer Rejected' as QuotationStatus } : null));
                          showNotification('error', `Quotation ${selectedQuotation.quotationNumber} marked as Customer Rejected.`);
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                      >
                        Customer Rejected
                      </button>
                    </div>
                  )}

                  {selectedQuotation.status === 'Draft' && (
                    <button
                      onClick={() => {
                        updateQuotationStatus(selectedQuotation.id, 'Sent to Customer');
                        setSelectedQuotation((prev) => (prev ? { ...prev, status: 'Sent to Customer' as QuotationStatus } : null));
                        showNotification('success', `Quotation ${selectedQuotation.quotationNumber} marked as Sent to Customer.`);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Customer</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUICK FOLLOW-UP MODAL */}
        {isFollowUpModalOpen && followUpTargetQuote && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Quotation Follow-Up</h3>
                    <p className="text-[11px] text-slate-500">Record customer interaction & schedule next follow-up</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveFollowUp} className="p-6 space-y-4 text-xs">
                {/* Linked Quote & Customer card */}
                <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3 grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Customer</span>
                    <span className="font-bold text-slate-900 text-xs">{followUpTargetQuote.customerName}</span>
                    <span className="text-[10px] font-mono text-blue-700 block">{followUpTargetQuote.customerNumber || 'CUS-101'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Quotation No.</span>
                    <span className="font-mono font-bold text-blue-700 text-xs">{followUpTargetQuote.quotationNumber}</span>
                    <span className="text-[10px] text-slate-500 block">Amount: ₹{followUpTargetQuote.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      value={fuDate}
                      onChange={(e) => setFuDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Follow-up Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 11:00 AM"
                      value={fuTime}
                      onChange={(e) => setFuTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Follow-up Type</label>
                    <select
                      value={fuType}
                      onChange={(e) => setFuType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
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
                      value={fuSalesperson}
                      onChange={(e) => setFuSalesperson(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Follow-up Notes / Customer Response</label>
                  <textarea
                    rows={3}
                    placeholder="Describe discussion, client objections, terms negotiated, next steps..."
                    value={fuNotes}
                    onChange={(e) => setFuNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-600 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={fuNextDate}
                    onChange={(e) => setFuNextDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFollowUpModalOpen(false)}
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
      </div>
    </DashboardLayout>
  );
}
