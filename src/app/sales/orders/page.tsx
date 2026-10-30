'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SALES_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { SalesOrder, SalesOrderItem, SalesOrderStatus, Quotation, QuotationStatus } from '@/types/erp';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Eye,
  Ban,
  Boxes,
  FileText,
  DollarSign,
  UserCheck,
  Truck,
  Globe,
  Wallet,
  Send,
  Camera,
  PackageCheck,
  Layers,
  Sparkles,
  Image as ImageIcon,
  ExternalLink,
  FileCheck,
  ShieldCheck,
  Clock,
  ArrowRight,
  Check,
  Calendar,
  Tag,
  MapPin,
  HandCoins,
  CreditCard,
} from 'lucide-react';

export default function SalesOrdersPage() {
  const {
    salesOrders,
    customers,
    products,
    rawMaterials,
    createSalesOrderFull,
    updateSalesOrderStatusFull,
    createQuotationFromSalesOrder,
    updateQuotationStatus,
    createInvoiceFromQuotation,
    invoices,
    quotations,
    activeRole,
    generateEntityCode,
    refreshProductsFromDB,
    refreshRawMaterialsFromDB,
  } = useERP();

  // Fetch latest products and raw materials from database on load
  useEffect(() => {
    refreshProductsFromDB();
    refreshRawMaterialsFromDB();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<{ src: string; title: string } | null>(null);

  // Post-creation Action Prompt Modal
  const [createdOrderPrompt, setCreatedOrderPrompt] = useState<SalesOrder | null>(null);

  // Quick Quotation Generation Modal
  const [quoteTargetOrder, setQuoteTargetOrder] = useState<SalesOrder | null>(null);
  const [quoteWarrantyPeriod, setQuoteWarrantyPeriod] = useState('1 Year');
  const [quoteInitialStatus, setQuoteInitialStatus] = useState<QuotationStatus>('Draft');

  // Form State
  const [formOrderNumber, setFormOrderNumber] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formSalesChannel, setFormSalesChannel] = useState<string>('Distributor');
  const [formSalesperson, setFormSalesperson] = useState('Rajesh Kumar');
  const [formShippingDetails, setFormShippingDetails] = useState('');
  const [formExpectedDelivery, setFormExpectedDelivery] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [formPaymentReceived, setFormPaymentReceived] = useState('0');
  const [formNotes, setFormNotes] = useState('');
  const [allowBackorder, setAllowBackorder] = useState(false);
  const [formPaymentMode, setFormPaymentMode] = useState<'COD' | 'Prepaid'>('Prepaid');

  // Quotation generation option on order creation
  const [formCreateQuotation, setFormCreateQuotation] = useState(true);
  const [formQuotationWarranty, setFormQuotationWarranty] = useState('1 Year');

  // Sale Type: 'Finished Product' | 'Raw Material'
  const [formSaleType, setFormSaleType] = useState<'Finished Product' | 'Raw Material'>('Finished Product');

  // Form Item Rows
  const [orderItems, setOrderItems] = useState<
    {
      productId: string;
      productName: string;
      sku: string;
      unit: string;
      availableStock: number;
      quantity: number;
      sellingPrice: number;
      discount: number;
      gstPercent: number;
      itemType: 'PRODUCT' | 'RAW_MATERIAL';
    }[]
  >([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    salesOrders.forEach((so) => {
      const cust = customers.find((c) => c.id === so.customerId);
      const cCity = cust?.city || '';
      if (cCity) citySet.add(cCity);
    });
    customers.forEach((c) => {
      if (c.city && c.city.trim()) citySet.add(c.city.trim());
    });
    return Array.from(citySet).sort();
  }, [salesOrders, customers]);

  const filteredOrders = useMemo(() => {
    return salesOrders.filter((so) => {
      const matchSearch =
        so.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (so.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (so.quotationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        so.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (so.salesChannel || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || so.orderStatus === statusFilter;
      const matchPayment = paymentFilter === 'ALL' || so.paymentStatus === paymentFilter;

      // Date Filter
      const oDate = (so.orderDate || '').split('T')[0];
      const matchStartDate = !startDate || oDate >= startDate;
      const matchEndDate = !endDate || oDate <= endDate;

      // City Filter
      let matchCity = true;
      if (cityFilter !== 'ALL') {
        const cust = customers.find((c) => c.id === so.customerId);
        const cCity = (cust?.city || '').toLowerCase();
        const sDetails = (so.shippingDetails || '').toLowerCase();
        matchCity = cCity === cityFilter.toLowerCase() || sDetails.includes(cityFilter.toLowerCase());
      }

      return matchSearch && matchStatus && matchPayment && matchStartDate && matchEndDate && matchCity;
    });
  }, [salesOrders, searchQuery, statusFilter, paymentFilter, startDate, endDate, cityFilter, customers]);

  const handleCustomerSelect = (customerId: string) => {
    setFormCustomerId(customerId);
    const selectedCust = customers.find((c) => c.id === customerId);
    if (selectedCust) {
      if (selectedCust.assignedSalesUser) {
        setFormSalesperson(selectedCust.assignedSalesUser);
      }
      if (selectedCust.customerSource) {
        const sourceMap: { [key: string]: string } = {
          Website: 'Website',
          Amazon: 'Amazon',
          IndiaMART: 'IndiaMART',
          WhatsApp: 'WhatsApp',
          Dealer: 'Dealer',
          Distributor: 'Distributor',
          Referral: 'Offline',
          Other: 'Offline',
        };
        setFormSalesChannel(sourceMap[selectedCust.customerSource] || 'Distributor');
      }
      if (selectedCust.shippingAddress || selectedCust.address) {
        const addr = selectedCust.shippingAddress || `${selectedCust.address}, ${selectedCust.city}, ${selectedCust.state}`;
        setFormShippingDetails(addr);
      }
    }
  };

  const handleOpenCreateModal = (initialSaleType: 'Finished Product' | 'Raw Material' = 'Finished Product') => {
    refreshProductsFromDB();
    refreshRawMaterialsFromDB();
    const generatedOrderNumber = generateEntityCode('SALES_ORDER');
    const generatedInvoiceNumber = generateEntityCode('INVOICE');
    setFormOrderNumber(generatedOrderNumber);
    setFormInvoiceNumber(generatedInvoiceNumber);

    const defaultCustomer = customers.length > 0 ? customers[0] : null;
    const defaultCustomerId = defaultCustomer ? defaultCustomer.id : '';
    const defaultSalesperson = defaultCustomer?.assignedSalesUser || 'Rajesh Kumar';
    const defaultChannel = defaultCustomer?.customerSource || 'Distributor';
    const defaultShipping = defaultCustomer?.shippingAddress || (defaultCustomer?.address ? `${defaultCustomer.address}, ${defaultCustomer.city}` : '');

    setFormCustomerId(defaultCustomerId);
    setFormSaleType(initialSaleType);

    if (initialSaleType === 'Raw Material') {
      if (rawMaterials.length > 0) {
        const rm = rawMaterials[0];
        setOrderItems([
          {
            productId: rm.id,
            productName: rm.name,
            sku: rm.sku,
            unit: rm.unit || 'PCS',
            availableStock: rm.currentStock,
            quantity: 1,
            sellingPrice: rm.unitCost ? Math.round(rm.unitCost * 1.25) : 100,
            discount: 0,
            gstPercent: 18,
            itemType: 'RAW_MATERIAL',
          },
        ]);
      } else {
        setOrderItems([]);
      }
    } else {
      if (products.length > 0) {
        const p = products[0];
        setOrderItems([
          {
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            unit: 'PCS',
            availableStock: p.currentStock,
            quantity: 10,
            sellingPrice: p.sellingPrice,
            discount: p.discount || 0,
            gstPercent: p.gstPercent || 18,
            itemType: 'PRODUCT',
          },
        ]);
      } else {
        setOrderItems([]);
      }
    }

    setFormSalesChannel(defaultChannel);
    setFormSalesperson(defaultSalesperson);
    setFormShippingDetails(defaultShipping);
    setFormPaymentReceived('0');
    setFormPaymentMode('Prepaid');
    setFormNotes('');
    setFormCreateQuotation(true);
    setAllowBackorder(false);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleSaleTypeChange = (newType: 'Finished Product' | 'Raw Material') => {
    setFormSaleType(newType);
    if (newType === 'Raw Material') {
      if (rawMaterials.length > 0) {
        const rm = rawMaterials[0];
        setOrderItems([
          {
            productId: rm.id,
            productName: rm.name,
            sku: rm.sku,
            unit: rm.unit || 'PCS',
            availableStock: rm.currentStock,
            quantity: 1,
            sellingPrice: rm.unitCost ? Math.round(rm.unitCost * 1.25) : 100,
            discount: 0,
            gstPercent: 18,
            itemType: 'RAW_MATERIAL',
          },
        ]);
      } else {
        setOrderItems([]);
      }
    } else {
      if (products.length > 0) {
        const p = products[0];
        setOrderItems([
          {
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            unit: 'PCS',
            availableStock: p.currentStock,
            quantity: 10,
            sellingPrice: p.sellingPrice,
            discount: p.discount || 0,
            gstPercent: p.gstPercent || 18,
            itemType: 'PRODUCT',
          },
        ]);
      } else {
        setOrderItems([]);
      }
    }
  };

  const handleAddItemRow = () => {
    if (formSaleType === 'Raw Material') {
      if (rawMaterials.length === 0) return;
      const rm = rawMaterials[0];
      setOrderItems((prev) => [
        ...prev,
        {
          productId: rm.id,
          productName: rm.name,
          sku: rm.sku,
          unit: rm.unit || 'PCS',
          availableStock: rm.currentStock,
          quantity: 1,
          sellingPrice: rm.unitCost ? Math.round(rm.unitCost * 1.25) : 100,
          discount: 0,
          gstPercent: 18,
          itemType: 'RAW_MATERIAL',
        },
      ]);
    } else {
      if (products.length === 0) return;
      const p = products[0];
      setOrderItems((prev) => [
        ...prev,
        {
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          unit: 'PCS',
          availableStock: p.currentStock,
          quantity: 1,
          sellingPrice: p.sellingPrice,
          discount: p.discount || 0,
          gstPercent: p.gstPercent || 18,
          itemType: 'PRODUCT',
        },
      ]);
    }
  };

  const handleRemoveItemRow = (idx: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemSelectChange = (idx: number, selectedId: string) => {
    if (formSaleType === 'Raw Material') {
      const rm = rawMaterials.find((m) => m.id === selectedId);
      if (!rm) return;
      setOrderItems((prev) =>
        prev.map((row, i) => {
          if (i === idx) {
            return {
              ...row,
              productId: rm.id,
              productName: rm.name,
              sku: rm.sku,
              unit: rm.unit || 'PCS',
              availableStock: rm.currentStock,
              sellingPrice: row.sellingPrice || (rm.unitCost ? Math.round(rm.unitCost * 1.25) : 100),
              itemType: 'RAW_MATERIAL',
            };
          }
          return row;
        })
      );
    } else {
      const p = products.find((prod) => prod.id === selectedId);
      if (!p) return;
      setOrderItems((prev) =>
        prev.map((row, i) => {
          if (i === idx) {
            return {
              ...row,
              productId: p.id,
              productName: p.name,
              sku: p.sku,
              unit: 'PCS',
              availableStock: p.currentStock,
              sellingPrice: p.sellingPrice,
              discount: p.discount || 0,
              gstPercent: p.gstPercent || 18,
              itemType: 'PRODUCT',
            };
          }
          return row;
        })
      );
    }
  };

  const handleItemQtyChange = (idx: number, qtyStr: string) => {
    const q = parseInt(qtyStr, 10) || 0;
    setOrderItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, quantity: q } : row))
    );
  };

  const handleItemPriceChange = (idx: number, priceStr: string) => {
    const pr = parseFloat(priceStr) || 0;
    setOrderItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, sellingPrice: pr } : row))
    );
  };

  const handleItemDiscountChange = (idx: number, discStr: string) => {
    const d = parseFloat(discStr) || 0;
    setOrderItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, discount: d } : row))
    );
  };

  const handleItemGstChange = (idx: number, gstStr: string) => {
    const g = parseFloat(gstStr) || 0;
    setOrderItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, gstPercent: g } : row))
    );
  };

  // Calculations
  const calculatedSubtotal = orderItems.reduce((acc, i) => {
    const lineSub = i.quantity * i.sellingPrice;
    const lineDisc = lineSub * ((i.discount || 0) / 100);
    return acc + (lineSub - lineDisc);
  }, 0);

  const calculatedDiscountAmount = orderItems.reduce((acc, i) => {
    return acc + (i.quantity * i.sellingPrice * ((i.discount || 0) / 100));
  }, 0);

  const calculatedGstAmount = orderItems.reduce((acc, i) => {
    const lineSub = i.quantity * i.sellingPrice;
    const lineDisc = lineSub * ((i.discount || 0) / 100);
    return acc + (lineSub - lineDisc) * ((i.gstPercent || 18) / 100);
  }, 0);

  const calculatedGrandTotal = Math.round(calculatedSubtotal + calculatedGstAmount);
  const paymentReceivedVal = Math.max(0, parseFloat(formPaymentReceived) || 0);
  const calculatedPendingAmount = Math.max(0, calculatedGrandTotal - paymentReceivedVal);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCustomerId) return setFormError('Please select a customer.');
    if (orderItems.length === 0) return setFormError('Sale must contain at least one item.');

    for (const item of orderItems) {
      if (item.quantity <= 0) return setFormError(`Quantity for "${item.productName}" must be greater than 0.`);
    }

    const custObj = customers.find((c) => c.id === formCustomerId);

    const formattedItems: SalesOrderItem[] = orderItems.map((i) => {
      let liveStock = Number(i.availableStock || 0);
      if (i.itemType === 'RAW_MATERIAL') {
        const liveRM = rawMaterials.find((m) => m.id === i.productId);
        if (liveRM !== undefined) liveStock = Number(liveRM.currentStock);
      } else {
        const liveP = products.find((p) => p.id === i.productId);
        if (liveP !== undefined) liveStock = Number(liveP.currentStock);
      }

      const lineSub = i.quantity * i.sellingPrice;
      const lineDisc = lineSub * ((i.discount || 0) / 100);
      const lineNet = lineSub - lineDisc;
      const lineGst = lineNet * ((i.gstPercent || 18) / 100);
      return {
        itemType: i.itemType,
        rawMaterialId: i.itemType === 'RAW_MATERIAL' ? i.productId : undefined,
        productId: i.productId,
        productName: i.productName,
        sku: i.sku,
        unit: i.unit || 'PCS',
        availableStock: liveStock,
        quantity: i.quantity,
        unitPrice: i.sellingPrice,
        sellingPrice: i.sellingPrice,
        discount: i.discount,
        discountPercent: i.discount,
        gstPercent: i.gstPercent,
        totalPrice: Math.round(lineNet + lineGst),
      };
    });

    const paymentStatus: SalesOrder['paymentStatus'] =
      paymentReceivedVal >= calculatedGrandTotal
        ? 'PAID'
        : paymentReceivedVal > 0
        ? 'PARTIAL'
        : 'UNPAID';

    // IMPORTANT: Sales Order is NOT sent to Production at this stage. It is Confirmed/Draft awaiting Quotation & Approval!
    const orderStatus: SalesOrder['orderStatus'] = 'Confirmed';

    const res = createSalesOrderFull(
      {
        orderNumber: formOrderNumber,
        invoiceNumber: formInvoiceNumber,
        saleType: formSaleType,
        customerId: formCustomerId,
        customerName: custObj ? custObj.companyName : 'Unknown Customer',
        expectedDelivery: formExpectedDelivery,
        dueDate: formExpectedDelivery,
        items: formattedItems,
        subtotal: Math.round(calculatedSubtotal),
        totalAmount: Math.round(calculatedSubtotal),
        discountAmount: Math.round(calculatedDiscountAmount),
        taxAmount: Math.round(calculatedGstAmount),
        gstAmount: Math.round(calculatedGstAmount),
        grandTotal: calculatedGrandTotal,
        amountPaid: paymentReceivedVal,
        amountOutstanding: calculatedPendingAmount,
        pendingAmount: calculatedPendingAmount,
        paymentMode: formPaymentMode,
        paymentStatus: paymentStatus,
        dispatchStatus: 'PENDING',
        orderStatus: orderStatus,
        salesChannel: formSalesChannel,
        salesperson: formSalesperson,
        shippingDetails: formShippingDetails,
        notes: formNotes,
        createdBy: activeRole === 'ADMIN' ? 'Admin' : formSalesperson,
      },
      allowBackorder
    );

    if (!res.success) {
      setFormError(res.message || 'Failed to create sales order');
      return;
    }

    setIsCreateModalOpen(false);

    if (formCreateQuotation) {
      const quoteRes = createQuotationFromSalesOrder(
        formOrderNumber,
        formQuotationWarranty,
        'Draft'
      );
      if (quoteRes.success) {
        showToast(
          `Sales Order ${formOrderNumber} saved & Quotation ${quoteRes.data?.quotationNumber} (${formQuotationWarranty} Warranty) created! Status: Draft`
        );
      } else {
        showToast(`Sales Order ${formOrderNumber} created successfully.`);
      }
    } else {
      // Prompt user with action: "Create Quotation"
      const createdObj = {
        id: formOrderNumber,
        orderNumber: formOrderNumber,
        customerName: custObj ? custObj.companyName : 'Customer',
        grandTotal: calculatedGrandTotal,
        items: formattedItems,
      } as any;
      setCreatedOrderPrompt(createdObj);
      showToast(`Sales Order ${formOrderNumber} created! Ready for quotation generation.`);
    }
  };

  const handleOpenViewModal = (so: SalesOrder) => {
    setSelectedOrder(so);
    setIsViewModalOpen(true);
  };

  const handleUpdateStatus = (soId: string, targetStatus: SalesOrderStatus) => {
    updateSalesOrderStatusFull(soId, targetStatus);
    showToast(`Sales order status updated to "${targetStatus}".`);
  };

  const handleGenerateInvoiceFromOrderQuote = (quotationId: string, orderNumber: string) => {
    const res = createInvoiceFromQuotation(quotationId);
    if (res.success) {
      showToast(`✓ Invoice generated from approved quotation for order ${orderNumber}! Proceed to Invoices for payment.`);
    } else {
      showToast(res.message || 'Failed to generate invoice.');
    }
  };

  const findLinkedQuotation = (so: SalesOrder): Quotation | undefined => {
    return quotations.find(
      (q) =>
        q.salesOrderId === so.id ||
        (q.orderNumber && q.orderNumber === so.orderNumber) ||
        (so.quotationNumber && q.quotationNumber === so.quotationNumber)
    );
  };

  const getWorkflowSteps = (so: SalesOrder, linkedQuote?: Quotation) => {
    const quoteStatus = linkedQuote?.status;
    const prodStatus = so.productionStatus || (so.orderStatus as string);
    const packStatus = so.packingStatus;
    const orderStatus = so.orderStatus;

    const hasQuote = Boolean(so.quotationNumber || linkedQuote);
    const isQuoteSentToClient = hasQuote && (
      quoteStatus === 'Sent to Client' ||
      quoteStatus === 'Approved' ||
      quoteStatus === 'Confirmed' ||
      quoteStatus === 'Sent to Production' ||
      quoteStatus === 'In Production' ||
      quoteStatus === 'Production Completed' ||
      quoteStatus === 'Packing' ||
      quoteStatus === 'Packed' ||
      quoteStatus === 'Ready for Dispatch' ||
      quoteStatus === 'Dispatched'
    );
    const isClientApproved = hasQuote && (
      quoteStatus === 'Approved' ||
      quoteStatus === 'Confirmed' ||
      quoteStatus === 'Sent to Production' ||
      quoteStatus === 'In Production' ||
      quoteStatus === 'Production Completed' ||
      quoteStatus === 'Packing' ||
      quoteStatus === 'Packed' ||
      quoteStatus === 'Ready for Dispatch' ||
      quoteStatus === 'Dispatched'
    );
    const isSentToProduction = Boolean(
      quoteStatus === 'Sent to Production' ||
      quoteStatus === 'In Production' ||
      quoteStatus === 'Production Completed' ||
      quoteStatus === 'Packing' ||
      quoteStatus === 'Packed' ||
      quoteStatus === 'Ready for Dispatch' ||
      quoteStatus === 'Dispatched' ||
      so.productionStatus ||
      so.sentToProductDate ||
      orderStatus === 'Sent to Product' ||
      orderStatus === 'Processing' ||
      orderStatus === 'Packed' ||
      orderStatus === 'Ready for Dispatch' ||
      orderStatus === 'Dispatched'
    );
    const isInProduction = isSentToProduction && (
      prodStatus === 'In Production' ||
      prodStatus === 'Production Completed' ||
      prodStatus === 'Packing' ||
      prodStatus === 'Packed' ||
      prodStatus === 'Ready for Dispatch' ||
      prodStatus === 'Dispatched' ||
      orderStatus === 'Processing' ||
      quoteStatus === 'In Production' ||
      quoteStatus === 'Production Completed' ||
      quoteStatus === 'Packing' ||
      quoteStatus === 'Packed' ||
      quoteStatus === 'Ready for Dispatch' ||
      quoteStatus === 'Dispatched'
    );
    const isProdCompleted = isInProduction && (
      prodStatus === 'Production Completed' ||
      prodStatus === 'Packing' ||
      prodStatus === 'Packed' ||
      prodStatus === 'Ready for Dispatch' ||
      prodStatus === 'Dispatched' ||
      quoteStatus === 'Production Completed' ||
      quoteStatus === 'Packing' ||
      quoteStatus === 'Packed' ||
      quoteStatus === 'Ready for Dispatch' ||
      quoteStatus === 'Dispatched'
    );
    const isPacking = isProdCompleted && (
      prodStatus === 'Packing' ||
      prodStatus === 'Packed' ||
      prodStatus === 'Ready for Dispatch' ||
      prodStatus === 'Dispatched' ||
      packStatus === 'Packing' ||
      packStatus === 'Packed' ||
      quoteStatus === 'Packing' ||
      quoteStatus === 'Packed' ||
      quoteStatus === 'Ready for Dispatch' ||
      quoteStatus === 'Dispatched'
    );
    const isPacked = isPacking && (
      prodStatus === 'Packed' ||
      prodStatus === 'Ready for Dispatch' ||
      prodStatus === 'Dispatched' ||
      packStatus === 'Packed' ||
      orderStatus === 'Packed' ||
      quoteStatus === 'Packed' ||
      quoteStatus === 'Ready for Dispatch' ||
      quoteStatus === 'Dispatched'
    );
    const isReadyForDispatch = isPacked && (
      prodStatus === 'Ready for Dispatch' ||
      prodStatus === 'Dispatched' ||
      orderStatus === 'Ready for Dispatch' ||
      orderStatus === 'Dispatched' ||
      so.dispatchStatus === 'Ready to Dispatch' ||
      so.dispatchStatus === 'PACKED' ||
      quoteStatus === 'Ready for Dispatch' ||
      quoteStatus === 'Dispatched'
    );
    const isDispatched = isReadyForDispatch && (
      orderStatus === 'Dispatched' ||
      orderStatus === 'Completed' ||
      orderStatus === 'Delivered' ||
      so.dispatchStatus === 'DISPATCHED' ||
      quoteStatus === 'Dispatched'
    );

    return [
      { id: 'so', title: 'Sales Order Created', completed: true, current: !hasQuote },
      { id: 'qc', title: 'Quotation Created', completed: hasQuote, current: hasQuote && !isQuoteSentToClient },
      { id: 'qs', title: 'Quotation Sent to Client', completed: isQuoteSentToClient, current: isQuoteSentToClient && !isClientApproved },
      { id: 'ca', title: 'Client Approved', completed: isClientApproved, current: isClientApproved && !isSentToProduction },
      { id: 'sp', title: 'Sent to Production', completed: isSentToProduction, current: isSentToProduction && !isInProduction },
      { id: 'ip', title: 'In Production', completed: isInProduction, current: isInProduction && !isProdCompleted },
      { id: 'pc', title: 'Production Completed', completed: isProdCompleted, current: isProdCompleted && !isPacking },
      { id: 'pk', title: 'Packing', completed: isPacking, current: isPacking && !isPacked },
      { id: 'pd', title: 'Packed', completed: isPacked, current: isPacked && !isReadyForDispatch },
      { id: 'rd', title: 'Ready for Dispatch', completed: isReadyForDispatch, current: isReadyForDispatch && !isDispatched },
      { id: 'dp', title: 'Dispatched', completed: isDispatched, current: isDispatched },
    ];
  };

  const getQuotationStatusBadge = (status?: string) => {
    switch (status) {
      case 'Approved':
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Sent to Production':
      case 'In Production':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Packed':
      case 'Ready for Dispatch':
      case 'Dispatched':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Sent to Client':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Draft':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Expired':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getProductionStatusBadge = (status?: string) => {
    switch (status) {
      case 'Ready for Dispatch':
        return 'bg-blue-600 text-white border-blue-700';
      case 'Packed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Packing':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Production Completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'In Production':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Sent to Production':
      case 'Sent to Product':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
      case 'Completed':
      case 'Paid':
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Dispatched':
      case 'Ready for Dispatch':
      case 'Ready to Dispatch':
      case 'Confirmed':
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Sent to Product':
      case 'Sent to Production':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Packed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Draft':
      case 'Processing':
      case 'Pending':
      case 'PENDING':
      case 'Unpaid':
      case 'UNPAID':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Cancelled':
      case 'Overdue':
      case 'OVERDUE':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
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

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Orders & Billing</h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Create sales orders, generate linked quotations, track client approvals, and monitor real-time production & packing progress.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenCreateModal('Raw Material')}
              className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Sell Raw Material
            </button>
            <button
              onClick={() => handleOpenCreateModal('Finished Product')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Sales Order
            </button>
          </div>
        </div>

        {/* Action Prompt Banner: If an order was created without a quotation */}
        {createdOrderPrompt && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-950">
                  Sales Order {createdOrderPrompt.orderNumber} Created Successfully!
                </h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Order is saved in the database. Next step: Generate a formal Quotation for customer {createdOrderPrompt.customerName}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCreatedOrderPrompt(null)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuoteTargetOrder(createdOrderPrompt);
                  setQuoteWarrantyPeriod('1 Year');
                  setQuoteInitialStatus('Draft');
                  setCreatedOrderPrompt(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Create Quotation Now
              </button>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Sales Order #, Quotation #, Customer..."
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
                title="From Order Date"
              />
              <span className="text-slate-400 text-xs font-medium">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                title="To Order Date"
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
                <Filter className="w-3.5 h-3.5 text-slate-500" /> Status:
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="ALL">All Order Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Sent to Product">Sent to Production</option>
                <option value="Processing">In Production</option>
                <option value="Packed">Packed</option>
                <option value="Ready for Dispatch">Ready for Dispatch</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <div className="flex items-center gap-1.5 text-slate-600 font-semibold ml-1">
                <span>Payment:</span>
              </div>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>

              {(startDate || endDate || cityFilter !== 'ALL' || statusFilter !== 'ALL' || paymentFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setCityFilter('ALL');
                    setStatusFilter('ALL');
                    setPaymentFilter('ALL');
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
              Showing <strong className="text-slate-800">{filteredOrders.length}</strong> of {salesOrders.length} orders
            </div>
          </div>
        </div>

        {/* Sales Orders Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                  <th className="p-3.5">Sales Order #</th>
                  <th className="p-3.5">Quotation Ref</th>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Order Date</th>
                  <th className="p-3.5 text-right font-bold">Grand Total</th>
                  <th className="p-3.5 text-center">Quotation Status</th>
                  <th className="p-3.5 text-center">Production Status</th>
                  <th className="p-3.5 text-center">Packing Status</th>
                  <th className="p-3.5 text-center">Photos</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((so) => {
                  const linkedQuote = findLinkedQuotation(so);
                  const effectiveProdStatus = so.productionStatus || (so.orderStatus === 'Sent to Product' ? 'Sent to Production' : so.orderStatus);
                  const effectivePackingStatus = so.packingStatus || (so.orderStatus === 'Packed' ? 'Packed' : 'Pending');
                  const imagesCount = (so.productionImages?.length || 0) + (so.packedImage && !so.productionImages?.includes(so.packedImage) ? 1 : 0);

                  return (
                    <tr key={so.id} className="hover:bg-slate-50/80 transition">
                      {/* SO Number */}
                      <td className="p-3.5">
                        <div className="font-mono text-blue-600 font-bold flex items-center gap-1.5">
                          <span>{so.orderNumber}</span>
                          {so.paymentMode === 'COD' ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                              <HandCoins className="w-2.5 h-2.5 text-amber-600" />
                              <span>COD</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                              <CreditCard className="w-2.5 h-2.5 text-blue-500" />
                              <span>Prepaid</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">{so.invoiceNumber || 'INV-AUTO'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{so.salesperson || 'Rajesh Kumar'}</div>
                      </td>

                      {/* Quotation Ref & Action */}
                      <td className="p-3.5">
                        {so.quotationNumber || linkedQuote ? (
                          <div>
                            <Link
                              href="/sales/quotations"
                              className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded transition"
                              title="View linked Quotation"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{so.quotationNumber || linkedQuote?.quotationNumber}</span>
                            </Link>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setQuoteTargetOrder(so);
                              setQuoteWarrantyPeriod('1 Year');
                              setQuoteInitialStatus('Draft');
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition cursor-pointer"
                            title="Create quotation from this sales order"
                          >
                            <Plus className="w-3 h-3 text-blue-600" />
                            <span>Create Quotation</span>
                          </button>
                        )}
                      </td>

                      {/* Customer Name */}
                      <td className="p-3.5 font-bold text-slate-900 max-w-[160px] truncate">
                        {so.customerName}
                      </td>

                      {/* Order Date */}
                      <td className="p-3.5 text-slate-600 font-mono whitespace-nowrap">
                        {so.orderDate}
                      </td>

                      {/* Grand Total */}
                      <td className="p-3.5 text-right font-bold text-slate-900 font-mono text-sm whitespace-nowrap">
                        ₹{so.grandTotal.toLocaleString('en-IN')}
                      </td>

                      {/* Quotation Status */}
                      <td className="p-3.5 text-center">
                        {linkedQuote ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getQuotationStatusBadge(linkedQuote.status)}`}>
                            {linkedQuote.status}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No Quotation</span>
                        )}
                      </td>

                      {/* Production Status */}
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getProductionStatusBadge(effectiveProdStatus)}`}>
                          {effectiveProdStatus || 'Pending'}
                        </span>
                      </td>

                      {/* Packing Status */}
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          effectivePackingStatus === 'Packed'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : effectivePackingStatus === 'Packing'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {effectivePackingStatus}
                        </span>
                      </td>

                      {/* Production Images */}
                      <td className="p-3.5 text-center">
                        {imagesCount > 0 ? (
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                const first = so.productionImages?.[0] || so.packedImage;
                                if (first) {
                                  setPreviewImageModal({
                                    src: first,
                                    title: `Sales Order ${so.orderNumber} - Production Photo Proof`,
                                  });
                                }
                              }}
                              className="group relative inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                              title="Click to zoom uploaded product/packing photos"
                            >
                              <Camera className="w-3.5 h-3.5 text-blue-600" />
                              <span className="font-bold text-[11px]">{imagesCount}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No photos</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* 1. If NO quotation exists: prompt "Create Quotation" */}
                          {!linkedQuote && !so.quotationNumber && (
                            <button
                              type="button"
                              onClick={() => {
                                setQuoteTargetOrder(so);
                                setQuoteWarrantyPeriod('1 Year');
                                setQuoteInitialStatus('Draft');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm cursor-pointer"
                              title="Automatically create quotation using this order data"
                            >
                              <Plus className="w-3 h-3" /> Create Quotation
                            </button>
                          )}

                          {/* 2. If Quotation is Approved: Show "Generate Invoice" */}
                          {linkedQuote && (linkedQuote.status === 'Approved' || linkedQuote.status === 'Confirmed' || linkedQuote.status === 'Customer Approved') && (
                            <button
                              type="button"
                              onClick={() => handleGenerateInvoiceFromOrderQuote(linkedQuote.id, so.orderNumber)}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm cursor-pointer"
                              title="Customer Approved! Generate invoice to collect payment"
                            >
                              <FileText className="w-3 h-3" /> Generate Invoice
                            </button>
                          )}

                          {/* 3. If Quotation is Sent to Client: Show quick Approve action */}
                          {linkedQuote && linkedQuote.status === 'Sent to Client' && (
                            <button
                              type="button"
                              onClick={() => {
                                updateQuotationStatus(linkedQuote.id, 'Approved');
                                showToast(`Quotation ${linkedQuote.quotationNumber} approved by client! "Send to Production" is now ready.`);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                              title="Client Confirmed - Mark Approved"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Client Approved
                            </button>
                          )}

                          {/* 4. If Ready for Dispatch: Mark Dispatched */}
                          {(so.orderStatus === 'Ready for Dispatch' || so.productionStatus === 'Ready for Dispatch') && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(so.id, 'Dispatched')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm cursor-pointer"
                            >
                              <Truck className="w-3 h-3" /> Dispatch
                            </button>
                          )}

                          {/* View Order Details Modal */}
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(so)}
                            title="View Complete Order Details & Workflow Tracker"
                            className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-500 text-xs font-medium">
                      No sales orders recorded matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATE SALES ORDER MODAL */}
        {isCreateModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsCreateModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Sticky Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" /> Create Sales Order
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Step 1 of Workflow: Sales Person records order. (Order will NOT be sent to Production until Quotation is approved).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                  title="Close Form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleCreateOrder} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-6 text-xs">
                  {formError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" /> {formError}
                    </div>
                  )}

                  {/* AUTO-GENERATED IDS & CORE METADATA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Sales Order Number <span className="text-slate-400 font-normal">(Auto)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={formOrderNumber}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-blue-700 font-mono focus:outline-none cursor-not-allowed font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Invoice Number <span className="text-slate-400 font-normal">(Auto)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={formInvoiceNumber}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-blue-700 font-mono focus:outline-none cursor-not-allowed font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Customer Name *</label>
                      <select
                        required
                        value={formCustomerId}
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.companyName} ({c.name}) - {c.city || 'N/A'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Sales Channel *</label>
                      <select
                        value={formSalesChannel}
                        onChange={(e) => setFormSalesChannel(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                      >
                        <option value="Website">Website</option>
                        <option value="Amazon">Amazon</option>
                        <option value="IndiaMART">IndiaMART</option>
                        <option value="Dealer">Dealer</option>
                        <option value="Distributor">Distributor</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Offline">Offline</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Salesperson / Representative</label>
                      <input
                        type="text"
                        value={formSalesperson}
                        onChange={(e) => setFormSalesperson(e.target.value)}
                        placeholder="e.g. Rajesh Kumar"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Expected Delivery Date</label>
                      <input
                        type="date"
                        value={formExpectedDelivery}
                        onChange={(e) => setFormExpectedDelivery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                        <span>Payment Mode *</span>
                        <span className={`text-[10px] font-bold ${formPaymentMode === 'COD' ? 'text-amber-600' : 'text-blue-600'}`}>
                          {formPaymentMode === 'COD' ? 'Cash on Delivery' : 'Prepaid'}
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-white border border-slate-300 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setFormPaymentMode('COD')}
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
                          onClick={() => setFormPaymentMode('Prepaid')}
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

                    <div className="lg:col-span-2">
                      <label className="block text-slate-700 font-bold mb-1">Shipping / Delivery Details</label>
                      <input
                        type="text"
                        value={formShippingDetails}
                        onChange={(e) => setFormShippingDetails(e.target.value)}
                        placeholder="Transporter, Delivery Address, Shipping instructions..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                  </div>

                  {/* SALE TYPE SELECTOR: FINISHED PRODUCT VS RAW MATERIAL */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="block text-slate-800 font-bold text-xs">Select Product Type *</span>
                      <p className="text-[11px] text-slate-500">
                        Sell finished goods from Product Master or existing raw materials directly to customer.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaleTypeChange('Finished Product')}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                          formSaleType === 'Finished Product'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Boxes className="w-3.5 h-3.5" /> Finished Product
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaleTypeChange('Raw Material')}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                          formSaleType === 'Raw Material'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Raw Material
                      </button>
                    </div>
                  </div>

                  {/* PRODUCT / RAW MATERIAL LINE ITEMS TABLE */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-blue-600" />
                        {formSaleType === 'Raw Material' ? 'Raw Materials Line Items' : 'Finished Products Line Items'}
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddItemRow}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                          formSaleType === 'Raw Material'
                            ? 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
                            : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" /> + Add {formSaleType === 'Raw Material' ? 'Raw Material' : 'Product'}
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-2.5">Product / Material</th>
                            <th className="p-2.5">SKU</th>
                            <th className="p-2.5 text-center">Unit</th>
                            <th className="p-2.5 text-right">Available Stock</th>
                            <th className="p-2.5 text-right">Quantity</th>
                            <th className="p-2.5 text-right">Rate (₹)</th>
                            <th className="p-2.5 text-right">Disc %</th>
                            <th className="p-2.5 text-right">GST %</th>
                            <th className="p-2.5 text-right">Line Total</th>
                            <th className="p-2.5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orderItems.map((row, idx) => {
                            const lineSub = row.quantity * row.sellingPrice;
                            const lineDisc = lineSub * ((row.discount || 0) / 100);
                            const lineNet = lineSub - lineDisc;
                            const lineGst = lineNet * ((row.gstPercent || 18) / 100);
                            const lineTotal = Math.round(lineNet + lineGst);

                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2.5 min-w-[200px]">
                                  <select
                                    value={row.productId}
                                    onChange={(e) => handleItemSelectChange(idx, e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1 text-xs text-slate-900 font-semibold focus:border-blue-600"
                                  >
                                    {formSaleType === 'Raw Material'
                                      ? rawMaterials.map((rm) => (
                                          <option key={rm.id} value={rm.id}>
                                            {rm.name} ({rm.sku})
                                          </option>
                                        ))
                                      : products.map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.name} ({p.sku})
                                          </option>
                                        ))}
                                  </select>
                                </td>
                                <td className="p-2.5 font-mono text-blue-600 font-bold">{row.sku}</td>
                                <td className="p-2.5 text-center font-mono text-slate-600 font-semibold">{row.unit || 'PCS'}</td>
                                <td className="p-2.5 text-right font-mono font-bold text-slate-700">
                                  {row.availableStock}
                                </td>
                                <td className="p-2.5 text-right max-w-[80px]">
                                  <input
                                    type="number"
                                    min="1"
                                    value={row.quantity}
                                    onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-1 text-xs text-right text-slate-900 font-bold font-mono"
                                  />
                                </td>
                                <td className="p-2.5 text-right max-w-[90px]">
                                  <input
                                    type="number"
                                    min="0"
                                    value={row.sellingPrice}
                                    onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-1 text-xs text-right text-slate-900 font-mono"
                                  />
                                </td>
                                <td className="p-2.5 text-right max-w-[70px]">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={row.discount}
                                    onChange={(e) => handleItemDiscountChange(idx, e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-1 text-xs text-right text-slate-900 font-mono"
                                  />
                                </td>
                                <td className="p-2.5 text-right max-w-[70px]">
                                  <input
                                    type="number"
                                    min="0"
                                    max="28"
                                    value={row.gstPercent}
                                    onChange={(e) => handleItemGstChange(idx, e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-1 text-xs text-right text-slate-900 font-mono"
                                  />
                                </td>
                                <td className="p-2.5 text-right font-bold text-slate-900 font-mono text-xs">
                                  ₹{lineTotal.toLocaleString('en-IN')}
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItemRow(idx)}
                                    className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Stock Shortage Warning Message */}
                    {orderItems.some((i) => i.quantity > i.availableStock) && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>Insufficient stock for one or more items.</span>
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-900">
                          <input
                            type="checkbox"
                            checked={allowBackorder}
                            onChange={(e) => setAllowBackorder(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-0"
                          />
                          Allow Backorder
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Notes & Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Order Notes / Terms</label>
                        <textarea
                          rows={2}
                          value={formNotes}
                          onChange={(e) => setFormNotes(e.target.value)}
                          placeholder="Special instructions, delivery terms, payment arrangements..."
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Advance Payment (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={formPaymentReceived}
                            onChange={(e) => setFormPaymentReceived(e.target.value)}
                            placeholder="0"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-emerald-700 focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Pending Amount (₹)</label>
                          <input
                            type="text"
                            readOnly
                            value={`₹${calculatedPendingAmount.toLocaleString('en-IN')}`}
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-rose-700 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-medium text-right">
                      <div className="text-slate-600">Subtotal: <span className="text-slate-900 font-bold font-mono">₹{Math.round(calculatedSubtotal).toLocaleString('en-IN')}</span></div>
                      <div className="text-slate-600">Discount: <span className="text-slate-900 font-bold font-mono">-₹{Math.round(calculatedDiscountAmount).toLocaleString('en-IN')}</span></div>
                      <div className="text-slate-600">GST Tax: <span className="text-slate-900 font-bold font-mono">₹{Math.round(calculatedGstAmount).toLocaleString('en-IN')}</span></div>
                      <div className="text-sm font-extrabold text-emerald-700 pt-2 border-t border-slate-200 font-mono">
                        Total Amount (Grand Total): ₹{calculatedGrandTotal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition">
                      <input
                        type="checkbox"
                        checked={formCreateQuotation}
                        onChange={(e) => setFormCreateQuotation(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Automatically Create Quotation</span>
                      </div>
                    </label>

                    {formCreateQuotation && (
                      <div className="flex items-center gap-1 bg-white border border-emerald-300 rounded-xl px-2.5 py-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <select
                          value={formQuotationWarranty}
                          onChange={(e) => setFormQuotationWarranty(e.target.value)}
                          className="text-xs font-bold text-emerald-900 bg-transparent focus:outline-none cursor-pointer"
                        >
                          <option value="1 Year">1 Year Warranty</option>
                          <option value="6 Months">6 Months Warranty</option>
                          <option value="2 Years">2 Years Warranty</option>
                          <option value="3 Months">3 Months Warranty</option>
                          <option value="No Warranty">No Warranty</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition cursor-pointer flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Save Sales Order
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW SALES ORDER DETAILS & WORKFLOW TRACKER MODAL */}
        {isViewModalOpen && selectedOrder && (() => {
          const linkedQuote = findLinkedQuotation(selectedOrder);
          const workflowSteps = getWorkflowSteps(selectedOrder, linkedQuote);
          const allProductionImages: string[] = [];
          if (selectedOrder.productionImages && Array.isArray(selectedOrder.productionImages)) {
            allProductionImages.push(...selectedOrder.productionImages);
          }
          if (selectedOrder.packedImage && !allProductionImages.includes(selectedOrder.packedImage)) {
            allProductionImages.push(selectedOrder.packedImage);
          }

          return (
            <div
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsViewModalOpen(false);
              }}
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                  <div>
                    <div className="text-xs font-mono text-blue-600 font-bold flex items-center gap-2">
                      <span>Order: {selectedOrder.orderNumber}</span>
                      <span className="text-slate-400 font-normal">|</span>
                      <span className="text-blue-600 font-mono">Invoice: {selectedOrder.invoiceNumber || 'INV-AUTO'}</span>
                      {selectedOrder.quotationNumber && (
                        <>
                          <span className="text-slate-400 font-normal">|</span>
                          <span className="text-emerald-700 font-semibold">Quote: {selectedOrder.quotationNumber}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedOrder.customerName}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsViewModalOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                    title="Close Modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                  {/* 1. VISUAL WORKFLOW TRACKER / TIMELINE */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" /> Order End-to-End Workflow & Tracking
                      </h4>
                      <span className="text-[11px] font-mono text-blue-700 font-bold bg-blue-100 px-2.5 py-0.5 rounded-full">
                        Live Status: {selectedOrder.productionStatus || selectedOrder.orderStatus}
                      </span>
                    </div>

                    {/* Stepper Progression Line */}
                    <div className="overflow-x-auto pb-2 pt-1">
                      <div className="flex items-center min-w-[780px]">
                        {workflowSteps.map((step, idx) => (
                          <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center text-center relative group min-w-[70px]">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition shadow-xs ${
                                  step.completed
                                    ? 'bg-emerald-600 text-white'
                                    : step.current
                                    ? 'bg-blue-600 text-white ring-4 ring-blue-200 animate-pulse'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {step.completed ? <Check className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span
                                className={`text-[10px] mt-1.5 font-bold leading-tight max-w-[80px] ${
                                  step.completed
                                    ? 'text-emerald-800'
                                    : step.current
                                    ? 'text-blue-800 font-extrabold'
                                    : 'text-slate-400'
                                }`}
                              >
                                {step.title}
                              </span>
                            </div>
                            {idx < workflowSteps.length - 1 && (
                              <div
                                className={`flex-1 h-1 mx-1 rounded-full ${
                                  workflowSteps[idx + 1].completed
                                    ? 'bg-emerald-600'
                                    : step.completed
                                    ? 'bg-blue-400'
                                    : 'bg-slate-200'
                                }`}
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. ORDER CORE METADATA SUMMARY */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block font-medium">Sales Channel:</span>
                      <div className="font-bold text-slate-900">{selectedOrder.salesChannel || 'Distributor'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Salesperson:</span>
                      <div className="font-bold text-slate-900">{selectedOrder.salesperson || 'Rajesh Kumar'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Sale Type:</span>
                      <div className="font-bold text-slate-900">
                        {selectedOrder.saleType ||
                          (selectedOrder.items.some((i) => i.itemType === 'RAW_MATERIAL') ? 'Raw Material' : 'Finished Product')}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Order Status:</span>
                      <div className="font-bold text-blue-700">{selectedOrder.orderStatus}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Grand Total:</span>
                      <div className="font-bold text-emerald-700 font-mono text-sm">₹{selectedOrder.grandTotal.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Payment Received:</span>
                      <div className="font-bold text-emerald-700 font-mono">₹{(selectedOrder.amountPaid || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Pending Amount:</span>
                      <div className="font-bold text-rose-700 font-mono">
                        ₹{(selectedOrder.pendingAmount ?? (selectedOrder.grandTotal - (selectedOrder.amountPaid || 0))).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Quotation Status:</span>
                      <div className="font-bold text-emerald-800">
                        {linkedQuote?.status || (selectedOrder.quotationNumber ? 'Generated' : 'Not created')}
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-4">
                      <span className="text-slate-500 block font-medium">Shipping / Delivery Details:</span>
                      <div className="text-slate-800 font-medium">{selectedOrder.shippingDetails || 'Standard logistics transport'}</div>
                    </div>
                  </div>

                  {/* 3. ORDERED PRODUCTS BREAKDOWN */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Ordered Products / Raw Materials Breakdown
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-2.5">Item Name</th>
                            <th className="p-2.5">SKU / Code</th>
                            <th className="p-2.5 text-center">Unit</th>
                            <th className="p-2.5 text-right">Qty</th>
                            <th className="p-2.5 text-right">Unit Price</th>
                            <th className="p-2.5 text-right">Disc %</th>
                            <th className="p-2.5 text-right">GST %</th>
                            <th className="p-2.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedOrder.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                              <td className="p-2.5 font-mono text-blue-600 font-bold">{item.sku}</td>
                              <td className="p-2.5 text-center font-mono text-slate-600 font-semibold">{item.unit || 'PCS'}</td>
                              <td className="p-2.5 text-right font-bold text-slate-900 font-mono">{item.quantity}</td>
                              <td className="p-2.5 text-right text-slate-700 font-mono">₹{(item.unitPrice || item.sellingPrice || 0).toLocaleString('en-IN')}</td>
                              <td className="p-2.5 text-right text-slate-600 font-mono">{item.discount || 0}%</td>
                              <td className="p-2.5 text-right text-slate-600 font-mono">{item.gstPercent || 18}%</td>
                              <td className="p-2.5 text-right font-bold text-emerald-700 font-mono">₹{item.totalPrice.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 4. REAL-TIME PRODUCTION & PACKING UPDATES */}
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-blue-600" /> Real-Time Production & Packing Updates (From Production Team)
                      </h4>
                      <span className="text-[11px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-semibold">
                        Live Synchronized
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-white p-3.5 rounded-xl border border-blue-100">
                      <div>
                        <span className="text-slate-500 font-semibold block">Production Status:</span>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border ${getProductionStatusBadge(selectedOrder.productionStatus || selectedOrder.orderStatus)}`}>
                          {selectedOrder.productionStatus || selectedOrder.orderStatus || 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Packing Status:</span>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          selectedOrder.packingStatus === 'Packed'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {selectedOrder.packingStatus || (selectedOrder.orderStatus === 'Packed' ? 'Packed' : 'Pending')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Production / Sent Date:</span>
                        <div className="font-mono font-bold text-slate-800 mt-0.5">
                          {selectedOrder.productionDate || selectedOrder.sentToProductDate || selectedOrder.orderDate}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Packing Date:</span>
                        <div className="font-mono font-bold text-slate-800 mt-0.5">
                          {selectedOrder.packingDate || (selectedOrder.packingStatus === 'Packed' ? 'Recorded' : 'Pending')}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <span className="text-slate-500 font-semibold block">Production Notes:</span>
                        <div className="text-slate-800 italic mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          {selectedOrder.productionNotes || selectedOrder.productTeamRemarks || 'No production notes recorded yet.'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 font-semibold block">Packing Notes:</span>
                        <div className="text-slate-800 italic mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          {selectedOrder.packingNotes || 'No packing notes recorded yet.'}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 font-semibold block">Batch / Lot #:</span>
                        <div className="font-mono font-bold text-slate-800 mt-0.5">
                          {selectedOrder.batchNumber || 'Not assigned'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Serial Number(s):</span>
                        <div className="font-mono font-bold text-slate-800 mt-0.5">
                          {selectedOrder.serialNumber || 'Not assigned'}
                        </div>
                      </div>
                    </div>

                    {/* 5. UPLOADED IMAGES GALLERY (PRODUCT PHOTO, PACKED PHOTO, PACKAGING, FINAL PRODUCT) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-blue-600" /> Uploaded Photos From Production ({allProductionImages.length})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Photos taken by Production Team during assembly and packing
                        </span>
                      </div>

                      {allProductionImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-blue-100">
                          {allProductionImages.map((imgSrc, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={() =>
                                setPreviewImageModal({
                                  src: imgSrc,
                                  title: `Order ${selectedOrder.orderNumber} - Photo ${imgIdx + 1}`,
                                })
                              }
                              className="group relative rounded-xl overflow-hidden border border-slate-300 bg-slate-900 cursor-pointer shadow-sm hover:ring-2 hover:ring-blue-500 transition"
                              title="Click to zoom image"
                            >
                              <img
                                src={imgSrc}
                                alt={`Production Proof ${imgIdx + 1}`}
                                className="w-full h-28 object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                              <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-[9px] font-mono">
                                Photo {imgIdx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-white border border-blue-100 text-center text-slate-500 text-xs">
                          <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                          <span>No photos uploaded by Production Team yet. Uploaded images will automatically appear here live.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 6. STATUS HISTORY & AUDIT TRAIL */}
                  {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-600" /> Order Status History & Audit Trail
                      </h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 max-h-36 overflow-y-auto">
                        {selectedOrder.statusHistory.map((hist, hIdx) => (
                          <div key={hIdx} className="flex items-start justify-between text-[11px] border-b border-slate-200 pb-1.5 last:border-0 last:pb-0">
                            <div>
                              <span className="font-bold text-slate-900">{hist.status}</span>
                              <span className="text-slate-500 ml-2">by {hist.updatedBy}</span>
                              {hist.remarks && <p className="text-slate-600 italic mt-0.5">{hist.remarks}</p>}
                            </div>
                            <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-2">{hist.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modal Footer Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Quotation action */}
                      {linkedQuote ? (
                        <Link
                          href="/sales/quotations"
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition shadow-xs"
                        >
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <span>View Quotation ({linkedQuote.quotationNumber} - {linkedQuote.status})</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setQuoteTargetOrder(selectedOrder);
                            setQuoteWarrantyPeriod('1 Year');
                            setQuoteInitialStatus('Draft');
                            setIsViewModalOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>Create Quotation</span>
                        </button>
                      )}

                      {/* If quotation is Approved: "Generate Invoice" button */}
                      {linkedQuote && (linkedQuote.status === 'Approved' || linkedQuote.status === 'Confirmed' || linkedQuote.status === 'Customer Approved') && (
                        <button
                          type="button"
                          onClick={() => handleGenerateInvoiceFromOrderQuote(linkedQuote.id, selectedOrder.orderNumber)}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" /> Generate Invoice
                        </button>
                      )}

                      {/* If Ready for Dispatch */}
                      {(selectedOrder.orderStatus === 'Ready for Dispatch' || selectedOrder.productionStatus === 'Ready for Dispatch') && (
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateStatus(selectedOrder.id, 'Dispatched');
                            setIsViewModalOpen(false);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" /> Complete Dispatch
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsViewModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* LIGHTBOX MODAL FOR PREVIEWING PRODUCTION IMAGES */}
        {previewImageModal && (
          <div
            className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewImageModal(null)}
          >
            <div
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900">{previewImageModal.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewImageModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-slate-950 flex items-center justify-center">
                <img
                  src={previewImageModal.src}
                  alt="Production Preview"
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                />
              </div>

              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Verified Product & Packing Proof</span>
                <div className="flex items-center gap-2">
                  <a
                    href={previewImageModal.src}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-1.5 text-xs shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> Open Full Image
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewImageModal(null)}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition text-xs shadow-sm cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUICK CREATE QUOTATION FROM SALES ORDER MODAL */}
        {quoteTargetOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Create Quotation from Sales Order</h3>
                    <p className="text-[11px] text-slate-500 font-mono">Order: {quoteTargetOrder.orderNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuoteTargetOrder(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Customer</label>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900">
                    {quoteTargetOrder.customerName}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Select Product Warranty Period</span>
                  </label>
                  <select
                    value={quoteWarrantyPeriod}
                    onChange={(e) => setQuoteWarrantyPeriod(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="1 Year">1 Year Standard Warranty</option>
                    <option value="6 Months">6 Months Warranty</option>
                    <option value="2 Years">2 Years Extended Warranty</option>
                    <option value="3 Years">3 Years Commercial Warranty</option>
                    <option value="3 Months">3 Months Warranty</option>
                    <option value="No Warranty">No Warranty</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    * Automatically pulls customer, product items, rates, discounts & tax without re-entry.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Quotation Status</label>
                  <select
                    value={quoteInitialStatus}
                    onChange={(e) => setQuoteInitialStatus(e.target.value as QuotationStatus)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="Draft">Draft (Internal review)</option>
                    <option value="Sent to Client">Sent to Client (Ready for client approval)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Items count:</span>
                    <span className="font-bold">{quoteTargetOrder.items.length} item(s)</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Value:</span>
                    <span className="font-bold text-slate-900">
                      ₹{(quoteTargetOrder.grandTotal || quoteTargetOrder.totalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuoteTargetOrder(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = createQuotationFromSalesOrder(
                      quoteTargetOrder.id,
                      quoteWarrantyPeriod,
                      quoteInitialStatus
                    );
                    if (res.success) {
                      showToast(
                        `Quotation ${res.data?.quotationNumber} generated successfully! Linked to Order ${quoteTargetOrder.orderNumber}.`
                      );
                      setQuoteTargetOrder(null);
                    } else {
                      showToast(res.message || 'Failed to create quotation');
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Generate Quotation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
