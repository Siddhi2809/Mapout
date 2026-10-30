'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PRODUCT_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { SalesOrder, SalesOrderItem, SalesInvoice } from '@/types/erp';
import { TaxInvoiceModal } from '@/components/sales/TaxInvoiceModal';
import {
  ShoppingCart,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  PackageCheck,
  Boxes,
  Camera,
  Layers,
  Upload,
  Clock,
  ArrowRight,
  Send,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  Trash2,
  Tag,
  Factory,
} from 'lucide-react';

export default function ProductSalesOrdersPage() {
  const {
    salesOrders,
    quotations,
    invoices,
    customers,
    products,
    rawMaterials,
    boms,
    updateSalesOrderProcessing,
    deductRawMaterialsForOrder,
    refreshRawMaterialsFromDB,
    activeRole,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<
    | 'ALL'
    | 'Sent to Production'
    | 'In Production'
    | 'Production Completed'
    | 'Packing'
    | 'Packed'
    | 'Ready for Dispatch'
  >('ALL');

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [previewLightboxImage, setPreviewLightboxImage] = useState<string | null>(null);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<SalesInvoice | null>(null);
  const [isInvoiceViewModalOpen, setIsInvoiceViewModalOpen] = useState(false);

  // Form State for Order Processing
  const [targetProductionStatus, setTargetProductionStatus] = useState<
    | 'Sent to Production'
    | 'In Production'
    | 'Production Completed'
    | 'Packing'
    | 'Packed'
    | 'Ready for Dispatch'
  >('In Production');
  const [targetPackingStatus, setTargetPackingStatus] = useState<
    'Pending' | 'Packing' | 'Packed' | 'Ready for Dispatch'
  >('Pending');

  const [formProductionNotes, setFormProductionNotes] = useState('');
  const [formPackingNotes, setFormPackingNotes] = useState('');
  const [formBatchNumber, setFormBatchNumber] = useState('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formWarrantyInfo, setFormWarrantyInfo] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [autoDeductMaterials, setAutoDeductMaterials] = useState<boolean>(true);

  const [itemPackingStatuses, setItemPackingStatuses] = useState<{
    [productId: string]: 'Pending' | 'Processing' | 'Packed' | 'Ready for Dispatch';
  }>({});

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  React.useEffect(() => {
    refreshRawMaterialsFromDB();
  }, []);

  // Dynamic Product Orders list: Includes any approved order received from Sales, or sent to production
  const productOrders = React.useMemo(() => {
    const list: SalesOrder[] = [];
    const seenOrderNumbers = new Set<string>();
    const seenQuotationNumbers = new Set<string>();
    const seenIds = new Set<string>();

    // 1. Process all salesOrders
    salesOrders.forEach((so) => {
      const statusNormalized = (so.orderStatus || '').toLowerCase();
      const prodStatusNormalized = (so.productionStatus || '').toLowerCase();
      const hasProductItems =
        !so.items ||
        so.items.length === 0 ||
        so.items.some((i) => !i.itemType || i.itemType === 'PRODUCT');

      // Direct match: if explicitly marked sent to production, quotation linked, or advanced in workflow
      const isExplicitlySent = Boolean(
        so.productionStatus ||
        so.sentToProductDate ||
        so.quotationNumber ||
        so.quotationId ||
        statusNormalized.includes('product') ||
        statusNormalized.includes('process') ||
        statusNormalized.includes('pack') ||
        statusNormalized.includes('dispatch') ||
        statusNormalized.includes('complete') ||
        statusNormalized === 'sent to production' ||
        prodStatusNormalized.length > 0
      );

      // Or if it's an active confirmed order that includes products
      const isActiveProductOrder =
        hasProductItems &&
        (statusNormalized === 'confirmed' ||
          statusNormalized === 'sent to production' ||
          statusNormalized === 'sent to product');

      if (isExplicitlySent || isActiveProductOrder) {
        const effectiveProd =
          so.productionStatus ||
          (statusNormalized === 'sent to production' || statusNormalized === 'sent to product'
            ? 'Sent to Production'
            : so.orderStatus === 'Packed'
            ? 'Packed'
            : so.orderStatus === 'Ready for Dispatch'
            ? 'Ready for Dispatch'
            : 'Sent to Production');

        list.push({
          ...so,
          productionStatus: effectiveProd,
          packingStatus: so.packingStatus || (so.orderStatus === 'Packed' ? 'Packed' : 'Pending'),
        });

        if (so.id) seenIds.add(so.id);
        if (so.orderNumber) seenOrderNumbers.add(so.orderNumber);
        if (so.quotationNumber) seenQuotationNumbers.add(so.quotationNumber);
        if (so.quotationId) seenIds.add(so.quotationId);
      }
    });

    // 2. Direct synthesis from quotations: if any quotation has been sent to production,
    // ensure it is present on the production side even if sales order state has not loaded
    quotations.forEach((q) => {
      const qStatus = (q.status || '').toLowerCase();
      const isSent =
        qStatus.includes('production') ||
        qStatus.includes('product') ||
        qStatus === 'in production' ||
        qStatus === 'packed' ||
        qStatus === 'packing';

      if (isSent) {
        const alreadyInList =
          (q.salesOrderId && seenIds.has(q.salesOrderId)) ||
          (q.orderNumber && seenOrderNumbers.has(q.orderNumber)) ||
          (q.quotationNumber && seenQuotationNumbers.has(q.quotationNumber)) ||
          (q.id && seenIds.has(q.id));

        if (!alreadyInList) {
          const synthOrder: SalesOrder = {
            id: q.salesOrderId || `so_synth_${q.id}`,
            orderNumber: q.orderNumber || `SO-${q.quotationNumber?.replace('QT-', '') || Math.floor(1000 + Math.random() * 9000)}`,
            quotationId: q.id,
            quotationNumber: q.quotationNumber,
            customerId: q.customerId,
            customerName: q.customerName,
            orderDate: q.quotationDate || new Date().toISOString().split('T')[0],
            dueDate: q.validUntil || new Date().toISOString().split('T')[0],
            orderStatus: 'Sent to Production',
            productionStatus: 'Sent to Production',
            packingStatus: 'Pending',
            sentToProductDate: q.quotationDate || new Date().toISOString().split('T')[0],
            productionDate: q.quotationDate || new Date().toISOString().split('T')[0],
            items: (q.items || []).map((qi) => ({
              productId: qi.productId,
              productName: qi.productName,
              sku: qi.sku,
              quantity: qi.quantity,
              sellingPrice: qi.rate,
              unitPrice: qi.rate,
              discount: qi.discount || 0,
              gstPercent: qi.gstPercent || 18,
              totalPrice: qi.totalAmount,
              unit: qi.unit || 'PCS',
              packingStatus: 'Pending',
              warrantyPeriod: qi.warrantyPeriod || q.warrantyPeriod || '1 Year',
            })),
            subtotal: q.subtotal,
            discountAmount: q.discountAmount,
            taxAmount: q.taxAmount,
            totalAmount: q.totalAmount,
            grandTotal: q.totalAmount,
            amountPaid: 0,
            amountOutstanding: q.totalAmount,
            pendingAmount: q.totalAmount,
            paymentStatus: 'UNPAID',
            dispatchStatus: 'PENDING',
            salesperson: q.salesperson || 'Sales Person',
            notes: q.notes || `From Quotation ${q.quotationNumber}`,
            createdAt: q.createdAt || new Date().toISOString(),
          };

          list.unshift(synthOrder);
          if (synthOrder.orderNumber) seenOrderNumbers.add(synthOrder.orderNumber);
          if (synthOrder.quotationNumber) seenQuotationNumbers.add(synthOrder.quotationNumber);
        }
      }
    });

    // 3. Direct synthesis from invoices sent to production:
    // Ensures every invoice sent to production appears in the product team's order queue
    invoices.forEach((inv) => {
      const invProdStatus = (inv.productionStatus || '').toLowerCase();
      const invStatus = (inv.invoiceStatus || (inv as any).status || '').toLowerCase();
      const isSent =
        invProdStatus.includes('production') ||
        invProdStatus.includes('product') ||
        invStatus.includes('production');

      if (isSent) {
        const alreadyInList =
          (inv.id && seenIds.has(inv.id)) ||
          (inv.salesOrderId && seenIds.has(inv.salesOrderId)) ||
          (inv.salesOrderNumber && seenOrderNumbers.has(inv.salesOrderNumber)) ||
          (inv.invoiceNumber && seenOrderNumbers.has(inv.invoiceNumber)) ||
          (inv.quotationId && seenIds.has(inv.quotationId)) ||
          (inv.quotationNumber && seenQuotationNumbers.has(inv.quotationNumber));

        if (!alreadyInList) {
          const linkedCust = customers.find((c) => c.id === inv.customerId);
          const synthOrder: SalesOrder = {
            id: inv.salesOrderId || `so_synth_inv_${inv.id}`,
            orderNumber: inv.salesOrderNumber || `SO-${inv.invoiceNumber?.replace('INV-', '').replace('SUN/26-27/', '') || Math.floor(1000 + Math.random() * 9000)}`,
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            quotationId: inv.quotationId,
            quotationNumber: inv.quotationNumber,
            customerId: inv.customerId,
            customerName: inv.customerName,
            customerNumber: inv.customerNumber || linkedCust?.customerNumber || 'CUS-101',
            orderDate: inv.invoiceDate || new Date().toISOString().split('T')[0],
            dueDate: inv.dueDate || inv.invoiceDate || new Date().toISOString().split('T')[0],
            orderStatus: 'Sent to Production',
            productionStatus: 'Sent to Production',
            packingStatus: 'Pending',
            sentToProductDate: inv.invoiceDate || new Date().toISOString().split('T')[0],
            productionDate: inv.invoiceDate || new Date().toISOString().split('T')[0],
            items: (inv.items || []).map((ii: any) => ({
              productId: ii.productId || 'PROD-AUTO',
              productName: ii.productName || 'Finished Product',
              sku: ii.sku || 'SKU-01',
              quantity: ii.quantity || 1,
              sellingPrice: ii.rate || ii.unitPrice || 0,
              unitPrice: ii.rate || ii.unitPrice || 0,
              discount: ii.discount || 0,
              gstPercent: ii.gstPercent || 18,
              totalPrice: ii.subtotal || ii.total || (ii.quantity * (ii.rate || 0)) || 0,
              unit: ii.unit || 'PCS',
              packingStatus: 'Pending',
              warrantyPeriod: inv.warrantyPeriod || '1 Year',
            })),
            subtotal: inv.subtotal,
            discountAmount: inv.discountAmount || 0,
            taxAmount: inv.gstAmount || 0,
            totalAmount: inv.grandTotal,
            grandTotal: inv.grandTotal,
            amountPaid: inv.paidAmount || inv.grandTotal,
            amountOutstanding: inv.outstandingAmount || 0,
            pendingAmount: inv.outstandingAmount || 0,
            paymentStatus: 'PAID',
            dispatchStatus: 'PENDING',
            salesperson: inv.salesperson || 'Sales Person',
            notes: inv.notes || `From Invoice ${inv.invoiceNumber}`,
            createdAt: inv.createdAt || new Date().toISOString(),
          };

          list.unshift(synthOrder);
          if (synthOrder.id) seenIds.add(synthOrder.id);
          if (synthOrder.orderNumber) seenOrderNumbers.add(synthOrder.orderNumber);
          if (synthOrder.quotationNumber) seenQuotationNumbers.add(synthOrder.quotationNumber);
        }
      }
    });

    return list;
  }, [salesOrders, quotations, invoices, customers]);

  const filteredOrders = productOrders.filter((so) => {
    // Search query
    const searchLower = searchQuery.toLowerCase().trim();
    const matchSearch =
      !searchLower ||
      so.orderNumber.toLowerCase().includes(searchLower) ||
      so.customerName.toLowerCase().includes(searchLower) ||
      (so.quotationNumber || '').toLowerCase().includes(searchLower) ||
      (so.invoiceNumber || '').toLowerCase().includes(searchLower) ||
      so.items.some(
        (i) =>
          i.productName.toLowerCase().includes(searchLower) ||
          i.sku.toLowerCase().includes(searchLower)
      );

    // Tab Filter
    if (filterTab === 'ALL') return matchSearch;

    const currentProd = (so.productionStatus || so.orderStatus || '').toLowerCase();
    const tabLower = filterTab.toLowerCase();

    let matchTab = false;
    if (filterTab === 'Sent to Production') {
      matchTab = currentProd === 'sent to production' || currentProd === 'sent to product' || currentProd === 'pending';
    } else if (filterTab === 'In Production') {
      matchTab = currentProd === 'in production' || currentProd === 'processing';
    } else if (filterTab === 'Production Completed') {
      matchTab = currentProd === 'production completed';
    } else if (filterTab === 'Packing') {
      matchTab = currentProd === 'packing';
    } else if (filterTab === 'Packed') {
      matchTab = currentProd === 'packed' || (so.packingStatus || '').toLowerCase() === 'packed';
    } else if (filterTab === 'Ready for Dispatch') {
      matchTab = currentProd.includes('ready');
    }

    return matchSearch && matchTab;
  });

  const handleOpenProcessModal = (order: SalesOrder) => {
    setSelectedOrder(order);

    // Determine current production status
    const currentProd = order.productionStatus || (order.orderStatus as any);
    if (currentProd === 'Sent to Production' || currentProd === 'Sent to Product') {
      setTargetProductionStatus('In Production');
    } else if (currentProd === 'In Production' || currentProd === 'Processing') {
      setTargetProductionStatus('Production Completed');
    } else if (currentProd === 'Production Completed') {
      setTargetProductionStatus('Packing');
    } else if (currentProd === 'Packing') {
      setTargetProductionStatus('Packed');
    } else if (currentProd === 'Packed') {
      setTargetProductionStatus('Ready for Dispatch');
    } else {
      setTargetProductionStatus((currentProd as any) || 'In Production');
    }

    setTargetPackingStatus((order.packingStatus as any) || (order.orderStatus === 'Packed' ? 'Packed' : 'Pending'));
    setFormProductionNotes(order.productionNotes || order.productTeamRemarks || '');
    setFormPackingNotes(order.packingNotes || '');
    setFormBatchNumber(order.batchNumber || `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setFormSerialNumber(order.serialNumber || `SN-${Date.now().toString().slice(-6)}`);
    setFormWarrantyInfo(order.warrantyTerms || '1 Year Standard Warranty');

    // Collect all existing images
    const existingImgs: string[] = [];
    if (order.productionImages && Array.isArray(order.productionImages)) {
      existingImgs.push(...order.productionImages);
    }
    if (order.packedImage && !existingImgs.includes(order.packedImage)) {
      existingImgs.push(order.packedImage);
    }
    setUploadedImages(existingImgs);

    // Initialize item packing statuses
    const initialItemStatuses: { [id: string]: 'Pending' | 'Processing' | 'Packed' | 'Ready for Dispatch' } = {};
    order.items.forEach((item) => {
      initialItemStatuses[item.productId] = item.packingStatus || (order.orderStatus === 'Packed' ? 'Packed' : 'Processing');
    });
    setItemPackingStatuses(initialItemStatuses);

    setAutoDeductMaterials(!order.rawMaterialsDeducted);
    setFormError(null);
    setIsProcessModalOpen(true);
  };

  const handleOpenInvoiceView = (order: SalesOrder, linkedInv?: SalesInvoice) => {
    let invToView: SalesInvoice;
    if (linkedInv) {
      invToView = {
        ...linkedInv,
        productionStatus: order.productionStatus || linkedInv.productionStatus || 'Sent to Production',
        packingNotes: order.packingNotes || linkedInv.packingNotes,
        productionNotes: order.productionNotes || linkedInv.productionNotes,
        batchNumber: order.batchNumber || linkedInv.batchNumber,
        serialNumber: order.serialNumber || linkedInv.serialNumber,
      };
    } else {
      const linkedCust = customers.find((c) => c.id === order.customerId);
      const invNum = order.invoiceNumber || (order.quotationNumber ? `INV-${order.quotationNumber.replace('QT-', '')}` : `INV-${order.orderNumber.replace('SO-', '')}`);
      invToView = {
        id: order.invoiceId || `inv_synth_${order.id}`,
        invoiceNumber: invNum,
        salesOrderId: order.id,
        salesOrderNumber: order.orderNumber,
        quotationId: order.quotationId,
        quotationNumber: order.quotationNumber,
        customerId: order.customerId,
        customerName: order.customerName,
        customerNumber: order.customerNumber || linkedCust?.customerNumber || 'CUS-101',
        invoiceDate: order.sentToProductDate || order.orderDate || new Date().toISOString().split('T')[0],
        dueDate: order.dueDate || order.orderDate || new Date().toISOString().split('T')[0],
        subtotal: order.subtotal || order.grandTotal || 0,
        discountAmount: order.discountAmount || 0,
        gstAmount: order.taxAmount || 0,
        grandTotal: order.grandTotal || order.totalAmount || 0,
        paidAmount: order.amountPaid || order.grandTotal || 0,
        outstandingAmount: order.amountOutstanding || 0,
        paymentStatus: 'Paid',
        invoiceStatus: 'Payment Completed',
        status: 'Active',
        productionStatus: order.productionStatus || 'Sent to Production',
        packingNotes: order.packingNotes,
        productionNotes: order.productionNotes,
        batchNumber: order.batchNumber,
        serialNumber: order.serialNumber,
        billingAddress: linkedCust?.address || linkedCust?.billingAddress || 'Batala Road, Jeevanwal babri gurdaspur',
        shippingAddress: linkedCust?.shippingAddress || linkedCust?.address || 'Batala Road, Jeevanwal babri gurdaspur',
        items: (order.items && order.items.length > 0 ? order.items : []).map((i) => ({
          productId: i.productId,
          productName: i.productName,
          sku: i.sku || 'SKU-01',
          quantity: i.quantity,
          rate: i.sellingPrice || i.unitPrice || 0,
          discount: i.discount || 0,
          gstPercent: i.gstPercent || 18,
          subtotal: i.totalPrice,
          total: i.totalPrice,
          hsn: '85369090',
        })),
        notes: order.notes || `Production Order ${order.orderNumber}`,
        createdAt: order.createdAt || new Date().toISOString(),
      };
    }
    setSelectedInvoiceForView(invToView);
    setIsInvoiceViewModalOpen(true);
  };

  const handleMultiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        setFormError('Each image should be under 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Resize to max 800px width/height and compress to lightweight JPEG
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            setUploadedImages((prev) => [...prev, compressedBase64]);
          } else {
            setUploadedImages((prev) => [...prev, event.target?.result as string]);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Compute live raw material component quantities required & stock balances for selected order
  const rawMaterialComponents = React.useMemo(() => {
    if (!selectedOrder) return [];
    const componentsMap: Record<
      string,
      {
        rawMaterialId: string;
        name: string;
        sku: string;
        unit: string;
        qtyPerProduct: number;
        totalRequired: number;
        currentStock: number;
        updatedStock: number;
        hasSufficientStock: boolean;
        forProducts: string[];
      }
    > = {};

    selectedOrder.items.forEach((item) => {
      const prod = products.find(
        (p) =>
          p.id === item.productId ||
          p.sku === item.sku ||
          p.name.toLowerCase() === item.productName.toLowerCase()
      );
      const orderQty = Number(item.quantity) || 1;

      // Extract raw materials from ProductMaster or BOM
      let rmList: any[] = [];
      if (
        prod?.rawMaterialQuantities &&
        Array.isArray(prod.rawMaterialQuantities) &&
        prod.rawMaterialQuantities.length > 0
      ) {
        rmList = prod.rawMaterialQuantities.map((q) => ({
          rawMaterialId: q.rawMaterialId,
          rawMaterialName: q.rawMaterialName,
          sku: q.sku,
          unit: q.unit,
          quantityUsed: q.quantityUsed,
        }));
      } else {
        const normProdName = (prod?.name || item.productName || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const bom = boms.find((b) => {
          const normBomName = (b.productName || '').toLowerCase().replace(/\s+/g, ' ').trim();
          return (
            b.productId === prod?.id ||
            b.productId === item.productId ||
            (normProdName && normBomName === normProdName) ||
            (normProdName && (normBomName.includes(normProdName) || normProdName.includes(normBomName)))
          );
        });
        if (bom && Array.isArray(bom.items) && bom.items.length > 0) {
          rmList = bom.items.map((bi) => ({
            rawMaterialId: bi.rawMaterialId,
            rawMaterialName: bi.rawMaterialName,
            sku: bi.sku,
            unit: bi.unit,
            quantityUsed: bi.quantity,
          }));
        }
      }

      // If no explicit raw materials configured yet on this product, link available raw materials in database
      if (rmList.length === 0 && rawMaterials.length > 0) {
        const matchingRm =
          rawMaterials.find(
            (r) =>
              r.category.toLowerCase().includes('wire') ||
              r.category.toLowerCase().includes('connector')
          ) || rawMaterials[0];
        if (matchingRm) {
          rmList.push({
            rawMaterialId: matchingRm.id,
            rawMaterialName: matchingRm.name,
            sku: matchingRm.sku,
            unit: matchingRm.unit,
            quantityUsed: 1,
          });
        }
      }

      rmList.forEach((rm) => {
        const liveRm = rawMaterials.find(
          (r) =>
            r.id === rm.rawMaterialId ||
            r.sku === rm.sku ||
            r.name.toLowerCase() === rm.rawMaterialName.toLowerCase()
        );
        const rmId = liveRm?.id || rm.rawMaterialId;
        const rmName = liveRm?.name || rm.rawMaterialName;
        const rmSku = liveRm?.sku || rm.sku || 'RM-SKU';
        const rmUnit = liveRm?.unit || rm.unit || 'PCS';
        const currentStock = liveRm ? liveRm.currentStock : 0;
        const perUnit = Number(rm.quantityUsed || 1);
        const reqForThisItem = perUnit * orderQty;

        if (componentsMap[rmId]) {
          componentsMap[rmId].totalRequired += reqForThisItem;
          componentsMap[rmId].updatedStock = Math.max(
            0,
            currentStock - componentsMap[rmId].totalRequired
          );
          componentsMap[rmId].hasSufficientStock =
            currentStock >= componentsMap[rmId].totalRequired;
          if (!componentsMap[rmId].forProducts.includes(item.productName)) {
            componentsMap[rmId].forProducts.push(item.productName);
          }
        } else {
          const updatedStock = Math.max(0, currentStock - reqForThisItem);
          componentsMap[rmId] = {
            rawMaterialId: rmId,
            name: rmName,
            sku: rmSku,
            unit: rmUnit,
            qtyPerProduct: perUnit,
            totalRequired: reqForThisItem,
            currentStock,
            updatedStock,
            hasSufficientStock: currentStock >= reqForThisItem,
            forProducts: [item.productName],
          };
        }
      });
    });

    return Object.values(componentsMap);
  }, [selectedOrder, products, boms, rawMaterials]);

  const handleSaveProcessing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    let deductionMessage = '';
    let deductedRecords: any[] = [];

    // Deduct raw materials if order moves to production/completed/packing and not already deducted
    const shouldDeduct =
      autoDeductMaterials &&
      !selectedOrder.rawMaterialsDeducted &&
      (targetProductionStatus === 'In Production' ||
        targetProductionStatus === 'Production Completed' ||
        targetProductionStatus === 'Packing' ||
        targetProductionStatus === 'Packed' ||
        targetProductionStatus === 'Ready for Dispatch');

    if (shouldDeduct) {
      const deductionRes = await deductRawMaterialsForOrder(
        selectedOrder.id,
        selectedOrder.orderNumber,
        selectedOrder.items
      );
      if (deductionRes.success && deductionRes.deductedList.length > 0) {
        deductedRecords = deductionRes.deductedList;
        const details = deductionRes.deductedList
          .map(
            (d) =>
              `${d.name}: -${d.deducted} ${d.unit} (Updated Stock: ${d.updatedStock} ${d.unit})`
          )
          .join(', ');
        deductionMessage = ` Raw materials deducted: ${details}.`;
      }
    }

    // Build updated items list
    const updatedItems: SalesOrderItem[] = selectedOrder.items.map((item) => ({
      ...item,
      packingStatus:
        itemPackingStatuses[item.productId] ||
        (targetPackingStatus === 'Packed' ? 'Packed' : 'Processing'),
      batchNumber: formBatchNumber,
      serialNumber: formSerialNumber,
      productRemarks: formProductionNotes,
      productImage: uploadedImages[0] || item.productImage,
    }));

    // Map production workflow status to sales order status
    let mappedOrderStatus: SalesOrder['orderStatus'] = 'Processing';
    if (targetProductionStatus === 'Packed') {
      mappedOrderStatus = 'Packed';
    } else if (targetProductionStatus === 'Ready for Dispatch') {
      mappedOrderStatus = 'Ready for Dispatch';
    } else if (
      targetProductionStatus === 'Production Completed' ||
      targetProductionStatus === 'Packing'
    ) {
      mappedOrderStatus = 'Processing';
    } else if (targetProductionStatus === 'Sent to Production') {
      mappedOrderStatus = 'Sent to Product';
    } else {
      mappedOrderStatus = 'Processing';
    }

    const res = updateSalesOrderProcessing(selectedOrder.id, {
      orderStatus: mappedOrderStatus,
      productionStatus: targetProductionStatus,
      packingStatus: targetPackingStatus,
      productionNotes: formProductionNotes,
      packingNotes: formPackingNotes,
      productionImages: uploadedImages,
      packedImage: uploadedImages[0] || '',
      productTeamRemarks: `${formProductionNotes ? 'Production: ' + formProductionNotes : ''} ${formPackingNotes ? 'Packing: ' + formPackingNotes : ''}`.trim(),
      serialNumber: formSerialNumber,
      batchNumber: formBatchNumber,
      items: updatedItems,
      rawMaterialsDeducted: selectedOrder.rawMaterialsDeducted || (deductedRecords.length > 0),
      rawMaterialsUsed: selectedOrder.rawMaterialsUsed || deductedRecords,
      updatedBy: activeRole === 'ADMIN' ? 'Product Team Lead' : 'Production Team',
    });

    if (res.success) {
      showToast(
        `✓ Order ${selectedOrder.orderNumber} updated: Production is "${targetProductionStatus}" & Packing is "${targetPackingStatus}".${deductionMessage} Live synced with Database & Sales!`
      );
      setIsProcessModalOpen(false);
    } else {
      setFormError(res.message || 'Failed to update order processing details.');
    }
  };

  const getProductionBadge = (status?: string) => {
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

  const getPackingBadge = (status?: string) => {
    switch (status) {
      case 'Packed':
      case 'Ready for Dispatch':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Packing':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <DashboardLayout
      roleTitle="Product Management"
      roleBadge="Production Team"
      navItems={PRODUCT_NAV}
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-blue-600" /> Production / Sales Orders Processing
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              View all client-approved orders received from Sales, track 6-stage production & packing workflow, upload product photos, and sync live with Sales.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-900 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-blue-600" />
              <span>{productOrders.length} Approved Orders in Production</span>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs & Search Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
              {(
                [
                  'ALL',
                  'Sent to Production',
                  'In Production',
                  'Production Completed',
                  'Packing',
                  'Packed',
                  'Ready for Dispatch',
                ] as const
              ).map((tab) => {
                let tabCount = 0;
                if (tab === 'ALL') {
                  tabCount = productOrders.length;
                } else {
                  tabCount = productOrders.filter((so) => {
                    const currentProd = (so.productionStatus || so.orderStatus || '').toLowerCase();
                    if (tab === 'Sent to Production') {
                      return currentProd === 'sent to production' || currentProd === 'sent to product' || currentProd === 'pending';
                    } else if (tab === 'In Production') {
                      return currentProd === 'in production' || currentProd === 'processing';
                    } else if (tab === 'Production Completed') {
                      return currentProd === 'production completed';
                    } else if (tab === 'Packing') {
                      return currentProd === 'packing';
                    } else if (tab === 'Packed') {
                      return currentProd === 'packed' || (so.packingStatus || '').toLowerCase() === 'packed';
                    } else if (tab === 'Ready for Dispatch') {
                      return currentProd.includes('ready');
                    }
                    return false;
                  }).length;
                }

                return (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      filterTab === tab
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        filterTab === tab ? 'bg-blue-100 text-blue-800' : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {tabCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SO #, Quotation #, Customer, Product..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                  <th className="p-3.5">Invoice & Quote #</th>
                  <th className="p-3.5">Customer & ID</th>
                  <th className="p-3.5">Product & SKU</th>
                  <th className="p-3.5 text-right font-bold">Qty</th>
                  <th className="p-3.5 text-center">Required Date</th>
                  <th className="p-3.5 text-center">Payment Status</th>
                  <th className="p-3.5 text-center">Production Status</th>
                  <th className="p-3.5 text-center">Packing Status</th>
                  <th className="p-3.5 text-center">Photos</th>
                  <th className="p-3.5">Production Notes</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((so) => {
                  const totalRequiredQty = so.items.reduce((acc, i) => acc + i.quantity, 0);
                  const effectiveProdStatus = so.productionStatus || so.orderStatus || 'Sent to Production';
                  const effectivePackingStatus = so.packingStatus || (so.orderStatus === 'Packed' ? 'Packed' : 'Pending');
                  const imagesCount = (so.productionImages?.length || 0) + (so.packedImage && !so.productionImages?.includes(so.packedImage) ? 1 : 0);

                  const linkedInv = invoices.find(
                    (inv) =>
                      inv.id === so.invoiceId ||
                      inv.salesOrderId === so.id ||
                      inv.salesOrderNumber === so.orderNumber ||
                      (so.quotationId && inv.quotationId === so.quotationId)
                  );
                  const linkedCust = customers.find((c) => c.id === so.customerId);
                  const customerNumber =
                    so.customerNumber ||
                    linkedCust?.customerNumber ||
                    linkedCust?.customerCode ||
                    linkedInv?.customerNumber ||
                    'CUS-101';
                  const invoiceNumber =
                    so.invoiceNumber ||
                    linkedInv?.invoiceNumber ||
                    (so.quotationNumber ? `INV-${so.quotationNumber.replace('QT-', '')}` : 'INV-101');
                  const paymentStatus = linkedInv?.paymentStatus || 'Paid';

                  return (
                    <tr key={so.id} className="hover:bg-slate-50/80 transition">
                      {/* Invoice & Quotation # */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenInvoiceView(so, linkedInv)}
                            className="font-mono text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 group cursor-pointer hover:underline text-left"
                            title="Click to view full Tax Invoice"
                          >
                            <span className="text-[10px] text-slate-500 uppercase font-sans font-medium">Inv:</span>
                            <span>{invoiceNumber}</span>
                            <Eye className="w-3 h-3 text-blue-500 group-hover:text-blue-700 shrink-0" />
                          </button>
                        </div>
                        {so.quotationNumber ? (
                          <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                            <FileText className="w-3 h-3 text-purple-600" />
                            <span>Quote: {so.quotationNumber}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{so.orderNumber}</div>
                        )}
                      </td>

                      {/* Customer & ID */}
                      <td className="p-3.5 max-w-[180px]">
                        <div className="font-bold text-slate-900 truncate">{so.customerName}</div>
                        <div className="mt-0.5">
                          <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {customerNumber}
                          </span>
                        </div>
                      </td>

                      {/* Products & SKU */}
                      <td className="p-3.5 max-w-[220px]">
                        <div className="space-y-1">
                          {so.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-slate-800">
                              <span className="font-semibold truncate">{item.productName}</span>
                              <span className="font-mono text-[10px] text-blue-600 font-bold">({item.sku})</span>
                            </div>
                          ))}
                        </div>
                        {so.rawMaterialsDeducted && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Raw material components deducted from stock in DB">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Stock Deducted
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="p-3.5 text-right font-bold text-slate-900 font-mono text-sm">
                        {totalRequiredQty}
                      </td>

                      {/* Required / Sent Date */}
                      <td className="p-3.5 text-center font-mono text-slate-600 font-medium whitespace-nowrap">
                        {so.sentToProductDate || so.expectedDelivery || so.orderDate}
                      </td>

                      {/* Payment Status (Section 12: Production verifies payment received) */}
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{paymentStatus === 'Paid' ? 'Paid (100%)' : paymentStatus}</span>
                        </span>
                      </td>

                      {/* Production Status */}
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getProductionBadge(effectiveProdStatus)}`}>
                          {effectiveProdStatus}
                        </span>
                      </td>

                      {/* Packing Status */}
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPackingBadge(effectivePackingStatus)}`}>
                          {effectivePackingStatus}
                        </span>
                      </td>

                      {/* Uploaded Images Preview */}
                      <td className="p-3.5 text-center">
                        {imagesCount > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const first = so.productionImages?.[0] || so.packedImage;
                                if (first) setPreviewLightboxImage(first);
                              }}
                              className="group relative inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition"
                              title="Click to view images"
                            >
                              <Camera className="w-3.5 h-3.5 text-blue-600" />
                              <span className="font-bold text-[11px]">{imagesCount}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No photos</span>
                        )}
                      </td>

                      {/* Production Notes Preview */}
                      <td className="p-3.5 max-w-[180px] truncate text-slate-600 italic">
                        {so.productionNotes || so.productTeamRemarks || 'No notes added'}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenInvoiceView(so, linkedInv)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 font-bold text-[11px] flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                            title="View official Tax Invoice for this production order"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Invoice</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenProcessModal(so)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Process Order</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-500 text-xs font-medium">
                      No production orders found under the selected filter tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ORDER DETAILS & PRODUCTION PROCESSING MODAL */}
        {isProcessModalOpen && selectedOrder && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsProcessModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div>
                  <div className="text-xs font-mono text-blue-600 font-bold flex items-center gap-2">
                    {selectedOrder.orderNumber}
                    {selectedOrder.quotationNumber && (
                      <>
                        <span className="text-slate-400 font-normal">|</span>
                        <span className="text-emerald-700 font-semibold">Quote: {selectedOrder.quotationNumber}</span>
                      </>
                    )}
                    <span className="text-slate-400 font-normal">|</span>
                    <span className="text-slate-600 font-normal">Customer: <strong className="text-slate-900">{selectedOrder.customerName}</strong></span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                    <PackageCheck className="w-5 h-5 text-blue-600" /> Production & Packing Workflow Processing
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProcessModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveProcessing} className="flex-1 overflow-y-auto p-6 space-y-6">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. ORDER SUMMARY BANNER (Section 12: Production Side Information) */}
                {(() => {
                  const linkedInv = invoices.find(
                    (inv) =>
                      inv.id === selectedOrder.invoiceId ||
                      inv.salesOrderId === selectedOrder.id ||
                      inv.salesOrderNumber === selectedOrder.orderNumber ||
                      (selectedOrder.quotationId && inv.quotationId === selectedOrder.quotationId)
                  );
                  const linkedCust = customers.find((c) => c.id === selectedOrder.customerId);
                  const customerNumber =
                    selectedOrder.customerNumber ||
                    linkedCust?.customerNumber ||
                    linkedCust?.customerCode ||
                    linkedInv?.customerNumber ||
                    'CUS-101';
                  const invoiceNumber =
                    selectedOrder.invoiceNumber ||
                    linkedInv?.invoiceNumber ||
                    (selectedOrder.quotationNumber ? `INV-${selectedOrder.quotationNumber.replace('QT-', '')}` : 'INV-101');
                  const paymentStatus = linkedInv?.paymentStatus || 'Paid';

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium block">Invoice Number:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-blue-700">{invoiceNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenInvoiceView(selectedOrder, linkedInv)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] font-bold border border-blue-300 transition cursor-pointer"
                            title="Open full Tax Invoice document"
                          >
                            <Eye className="w-3 h-3 text-blue-700" /> View
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">Quotation Ref:</span>
                        <span className="font-mono font-bold text-purple-700">
                          {selectedOrder.quotationNumber || 'Direct Order'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">Customer & ID:</span>
                        <span className="font-bold text-slate-900 block truncate">{selectedOrder.customerName}</span>
                        <span className="font-mono text-[10px] text-blue-700 font-bold">{customerNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">Payment Status:</span>
                        <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{paymentStatus === 'Paid' ? 'Paid (100%)' : paymentStatus}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">Required Delivery:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedOrder.expectedDelivery || selectedOrder.orderDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">Production & Packing:</span>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border ${getProductionBadge(selectedOrder.productionStatus || selectedOrder.orderStatus)}`}>
                          {selectedOrder.productionStatus || selectedOrder.orderStatus}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. ORDERED PRODUCTS & FINISHED GOODS STOCK CHECK */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-blue-600" /> Ordered Products & Finished Goods Stock Verification
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Live Finished Goods Inventory Check
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-3">Product Name</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3 text-right">Required Qty</th>
                          <th className="p-3 text-right">Available FG Stock</th>
                          <th className="p-3 text-center">Stock Check</th>
                          <th className="p-3 text-center">Item Stage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.items.map((item, idx) => {
                          const prod = products.find((p) => p.id === item.productId || p.sku === item.sku);
                          const currentStock = prod ? prod.currentStock : (item.availableStock || 0);
                          const hasStock = currentStock >= item.quantity;

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900">
                                {item.productName}
                              </td>
                              <td className="p-3 font-mono text-blue-600 font-bold">
                                {item.sku}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                                {item.quantity} {item.unit || 'PCS'}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-800">
                                {currentStock} {item.unit || 'PCS'}
                              </td>
                              <td className="p-3 text-center">
                                {hasStock ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1 w-max mx-auto">
                                    <CheckCircle2 className="w-3 h-3" /> In Stock
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center gap-1 w-max mx-auto">
                                    <AlertTriangle className="w-3 h-3" /> Shortage
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <select
                                  value={itemPackingStatuses[item.productId] || 'Processing'}
                                  onChange={(e) =>
                                    setItemPackingStatuses((prev) => ({
                                      ...prev,
                                      [item.productId]: e.target.value as any,
                                    }))
                                  }
                                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Packed">Packed</option>
                                  <option value="Ready for Dispatch">Ready for Dispatch</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. RAW MATERIAL COMPONENTS CONSUMPTION & STOCK DEDUCTION */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <Factory className="w-4 h-4 text-emerald-600" /> Raw Material Components Used in Production
                    </h4>
                    {selectedOrder.rawMaterialsDeducted ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Raw Materials Deducted in Database
                      </span>
                    ) : (
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 px-2.5 py-1 rounded-lg transition">
                        <input
                          type="checkbox"
                          checked={autoDeductMaterials}
                          onChange={(e) => setAutoDeductMaterials(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                        />
                        <span>Auto-deduct raw materials from stock when saving</span>
                      </label>
                    )}
                  </div>

                  {rawMaterialComponents.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-3">Raw Material Component</th>
                            <th className="p-3">SKU</th>
                            <th className="p-3 text-center">Qty / Product</th>
                            <th className="p-3 text-right">Total Required</th>
                            <th className="p-3 text-right">Current DB Stock</th>
                            <th className="p-3 text-right">Updated Stock</th>
                            <th className="p-3 text-center">Stock Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rawMaterialComponents.map((rmc, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900">
                                <div>{rmc.name}</div>
                                <div className="text-[10px] text-slate-500 font-normal">
                                  Used in: {rmc.forProducts.join(', ')}
                                </div>
                              </td>
                              <td className="p-3 font-mono text-blue-600 font-bold">
                                {rmc.sku}
                              </td>
                              <td className="p-3 text-center font-mono font-medium text-slate-700">
                                {rmc.qtyPerProduct} {rmc.unit}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-rose-700 text-sm">
                                -{rmc.totalRequired} {rmc.unit}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-800">
                                {rmc.currentStock} {rmc.unit}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                                {selectedOrder.rawMaterialsDeducted
                                  ? `${rmc.currentStock} ${rmc.unit} (Deducted)`
                                  : `${rmc.updatedStock} ${rmc.unit}`}
                              </td>
                              <td className="p-3 text-center">
                                {rmc.hasSufficientStock ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> In Stock
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" /> Shortage
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 italic">
                      No raw material components linked to these products. Configure in Product Master or BOM to enable automated stock deduction.
                    </div>
                  )}
                </div>

                {/* 3. COMPLETE 6-STAGE PRODUCTION WORKFLOW SELECTION */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" /> Production Status Progression Workflow
                    </h5>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Select Current Production Stage
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {(
                      [
                        'Sent to Production',
                        'In Production',
                        'Production Completed',
                        'Packing',
                        'Packed',
                        'Ready for Dispatch',
                      ] as const
                    ).map((st, idx) => {
                      const isSelected = targetProductionStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setTargetProductionStatus(st);
                            if (st === 'Packed' || st === 'Ready for Dispatch') {
                              setTargetPackingStatus('Packed');
                            } else if (st === 'Packing') {
                              setTargetPackingStatus('Packing');
                            }
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition text-center flex flex-col items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-[10px] font-mono opacity-80">Step {idx + 1}</span>
                          <span className="leading-tight">{st}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Packing Status Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">
                        Specific Packing Stage:
                      </label>
                      <select
                        value={targetPackingStatus}
                        onChange={(e) => setTargetPackingStatus(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        <option value="Pending">Pending (Not packed yet)</option>
                        <option value="Packing">Packing (In progress)</option>
                        <option value="Packed">Packed (All boxes sealed)</option>
                        <option value="Ready for Dispatch">Ready for Dispatch (Labeled & Staged)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Warranty Information:</span>
                      </label>
                      <input
                        type="text"
                        value={formWarrantyInfo}
                        onChange={(e) => setFormWarrantyInfo(e.target.value)}
                        placeholder="e.g. 1 Year Comprehensive Onsite Warranty"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Batch Number & Serial Number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">
                        Batch / Lot Number:
                      </label>
                      <input
                        type="text"
                        value={formBatchNumber}
                        onChange={(e) => setFormBatchNumber(e.target.value)}
                        placeholder="e.g. BATCH-2026-001"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">
                        Serial Number(s):
                      </label>
                      <input
                        type="text"
                        value={formSerialNumber}
                        onChange={(e) => setFormSerialNumber(e.target.value)}
                        placeholder="e.g. SN-88921, SN-88922"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. PRODUCTION & PACKING NOTES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-slate-800 font-bold text-xs">
                      Production Notes:
                    </label>
                    <textarea
                      rows={3}
                      value={formProductionNotes}
                      onChange={(e) => setFormProductionNotes(e.target.value)}
                      placeholder="Notes on fabrication, assembly, QA testing, component batches..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 resize-none"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-slate-800 font-bold text-xs">
                      Packing Notes:
                    </label>
                    <textarea
                      rows={3}
                      value={formPackingNotes}
                      onChange={(e) => setFormPackingNotes(e.target.value)}
                      placeholder="Notes on packaging box dimensions, bubble wrap, fragile labels, weight..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 resize-none"
                    />
                  </div>
                </div>

                {/* 5. MULTI-IMAGE UPLOAD (PRODUCT PHOTO, PACKED PHOTO, PACKAGING, FINAL PRODUCT) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-600" /> Upload Product/Packing Images
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        Upload multiple photos: Product photo, Packed product photo, Packaging photo, Final product photo.
                      </p>
                    </div>

                    <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm w-max">
                      <Upload className="w-4 h-4" /> Upload Product/Packing Images
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleMultiImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Image Thumbnails Gallery */}
                  {uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                      {uploadedImages.map((imgSrc, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="relative group rounded-xl overflow-hidden border border-slate-300 bg-white shadow-sm"
                        >
                          <img
                            src={imgSrc}
                            alt={`Production Upload ${imgIdx + 1}`}
                            className="w-full h-24 object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition">
                            <button
                              type="button"
                              onClick={() => setPreviewLightboxImage(imgSrc)}
                              className="p-1.5 bg-white/90 text-slate-900 rounded-lg shadow hover:bg-white transition"
                              title="Zoom Image"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(imgIdx)}
                              className="p-1.5 bg-rose-600 text-white rounded-lg shadow hover:bg-rose-700 transition"
                              title="Delete Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[9px] font-mono">
                            Photo {imgIdx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center text-slate-500 text-xs">
                      <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <span>No photos uploaded yet. Click &quot;Upload Product/Packing Images&quot; above to attach verification photos for Sales & Client.</span>
                    </div>
                  )}
                </div>

                {/* 6. PREVIOUS STATUS HISTORY */}
                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> Audit Trail & Status History
                    </h5>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1.5">
                      {selectedOrder.statusHistory.map((h, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] border-b border-slate-200/80 pb-1 last:border-0 last:pb-0">
                          <div>
                            <span className="font-bold text-slate-900">{h.status}</span>
                            <span className="text-slate-500 ml-2">by {h.updatedBy}</span>
                            {h.remarks && <span className="text-slate-600 italic ml-2">- {h.remarks}</span>}
                          </div>
                          <span className="font-mono text-slate-400 text-[10px] shrink-0">{h.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sticky Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsProcessModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save & Update Status to &quot;{targetProductionStatus}&quot;
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LIGHTBOX PREVIEW MODAL */}
        {previewLightboxImage && (
          <div
            className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewLightboxImage(null)}
          >
            <div
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Camera className="w-4 h-4 text-blue-600" /> Production Image Verification
                </div>
                <button
                  onClick={() => setPreviewLightboxImage(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 bg-slate-950 flex items-center justify-center">
                <img
                  src={previewLightboxImage}
                  alt="Production Preview"
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                />
              </div>
              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                <a
                  href={previewLightboxImage}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-1.5 text-xs shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> Open Full Image
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewLightboxImage(null)}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition text-xs shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULL TAX INVOICE PREVIEW MODAL FOR PRODUCTION */}
        <TaxInvoiceModal
          isOpen={isInvoiceViewModalOpen}
          onClose={() => setIsInvoiceViewModalOpen(false)}
          invoice={selectedInvoiceForView}
          linkedOrder={selectedOrder}
          roleBadge="Production Copy"
        />
      </div>
    </DashboardLayout>
  );
}
