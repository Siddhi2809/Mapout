'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  UserRole,
  ROLE_PERMISSIONS,
  RawMaterial,
  FinishedGood,
  ProductionOrder,
  Customer,
  SalesOrder,
  SalesOrderItem,
  OrderStatusHistoryItem,
  Supplier,
  PurchaseOrder,
  MaterialReceipt,
  MaterialConsumption,
  SupplierPayment,
  RawMaterialStockTransaction,
  ProductMaster,
  BOM,
  BOMItem,
  ProductReturn,
  StockAdjustment,
  FinishedGoodsStockTransaction,
  SystemAlert,
  FinancialSummary,
  Lead,
  LeadSource,
  LeadStatus,
  LeadImportHistory,
  FollowUp,
  SalesInvoice,
  SalesDispatch,
  SalesReturn,
  CustomerPayment,
  PurchaseRequest,
  PurchaseRequestStatus,
  Quotation,
  QuotationItem,
  QuotationStatus,
} from '../types/erp';
import {
  generateNextEntityCode,
  ENTITY_PREFIXES,
  EntityType,
  extractCodeNumber,
} from '../lib/sequence';
import {
  INITIAL_RAW_MATERIALS,
  INITIAL_FINISHED_GOODS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES_ORDERS,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_MATERIAL_RECEIPTS,
  INITIAL_MATERIAL_CONSUMPTIONS,
  INITIAL_SUPPLIER_PAYMENTS,
  INITIAL_STOCK_TRANSACTIONS,
  INITIAL_PRODUCTS,
  INITIAL_BOMS,
  INITIAL_PRODUCT_RETURNS,
  INITIAL_STOCK_ADJUSTMENTS,
  INITIAL_FG_TRANSACTIONS,
  INITIAL_LEADS,
  INITIAL_FOLLOWUPS,
  INITIAL_INVOICES,
  INITIAL_DISPATCHES,
  INITIAL_CUSTOMER_PAYMENTS,
  INITIAL_SALES_RETURNS,
  INITIAL_QUOTATIONS,
} from '../lib/mockData';

interface ERPContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  generateEntityCode: (entityType: EntityType) => string;
  rawMaterials: RawMaterial[];
  finishedGoods: FinishedGood[];
  productionOrders: ProductionOrder[];
  customers: Customer[];
  salesOrders: SalesOrder[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  materialReceipts: MaterialReceipt[];
  materialConsumptions: MaterialConsumption[];
  supplierPayments: SupplierPayment[];
  stockTransactions: RawMaterialStockTransaction[];
  purchaseRequests: PurchaseRequest[];

  // Product Management States
  products: ProductMaster[];
  boms: BOM[];
  productReturns: ProductReturn[];
  stockAdjustments: StockAdjustment[];
  fgTransactions: FinishedGoodsStockTransaction[];

  // Sales Management States
  quotations: Quotation[];
  leads: Lead[];
  followUps: FollowUp[];
  invoices: SalesInvoice[];
  dispatches: SalesDispatch[];
  customerPayments: CustomerPayment[];
  salesReturns: SalesReturn[];

  // Product Master Actions
  addProduct: (product: Omit<ProductMaster, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateProduct: (id: string, product: Partial<ProductMaster>) => { success: boolean; message?: string };
  deleteProduct: (id: string) => { success: boolean; message?: string };
  toggleProductStatus: (id: string) => { success: boolean; message?: string };
  refreshProductsFromDB: () => Promise<ProductMaster[]>;
  refreshRawMaterialsFromDB: () => Promise<RawMaterial[]>;

  // BOM Actions
  addBOM: (bom: Omit<BOM, 'id' | 'bomNumber' | 'createdDate'>) => { success: boolean; message?: string };
  updateBOM: (id: string, bom: Partial<BOM>) => { success: boolean; message?: string };
  createNewBOMVersion: (productId: string, items: BOMItem[]) => { success: boolean; message?: string };

  // Production Workflow Actions
  createProductionOrderFull: (order: {
    productId: string;
    productName: string;
    bomId: string;
    bomVersion: number;
    plannedQuantity: number;
    productionDate: string;
    expectedCompletion: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    notes?: string;
    assignedEngineer?: string;
  }) => { success: boolean; message?: string };
  updateProductionOrderStatus: (id: string, newStatus: string, allowShortageOverride?: boolean) => { success: boolean; message?: string };
  checkMaterialAvailability: (productId: string, quantity: number, bomVersion?: number) => {
    isAvailable: boolean;
    materials: {
      rawMaterialId: string;
      rawMaterialName: string;
      unit: string;
      required: number;
      available: number;
      shortage: number;
      status: 'AVAILABLE' | 'INSUFFICIENT STOCK';
    }[];
  };

  // Product Returns Actions
  createProductReturn: (ret: Omit<ProductReturn, 'id' | 'returnNumber' | 'date'>) => { success: boolean; message?: string };
  updateProductReturnStatus: (
    id: string,
    status: ProductReturn['status'],
    notes?: string,
    actionTaken?: string,
    defect?: string,
    extraDetails?: Partial<ProductReturn>
  ) => { success: boolean; message?: string };

  // Stock Adjustments Actions
  createStockAdjustment: (adj: Omit<StockAdjustment, 'id' | 'adjustmentNumber' | 'date'>) => { success: boolean; message?: string };
  approveStockAdjustment: (id: string) => { success: boolean; message?: string };

  // Sales Management Actions
  addCustomerFull: (customer: Omit<Customer, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateCustomerFull: (id: string, customer: Partial<Customer>) => { success: boolean; message?: string };
  toggleCustomerStatus: (id: string) => { success: boolean; message?: string };

  createLeadFull: (lead: Omit<Lead, 'id' | 'leadNumber' | 'createdAt'>) => { success: boolean; message?: string };
  updateLeadFull: (id: string, lead: Partial<Lead>) => { success: boolean; message?: string };
  convertLeadToCustomer: (leadId: string) => { success: boolean; message?: string; customerId?: string };
  leadImportHistories: LeadImportHistory[];
  importLeadsBatch: (
    rows: any[],
    options: {
      fileName: string;
      importedBy: string;
      duplicateHandling?: 'update' | 'skip' | 'asNew';
    }
  ) => Promise<{
    success: boolean;
    totalRows: number;
    newLeads: number;
    updatedLeads: number;
    duplicateLeads: number;
    failedRows: number;
    failedItems: { rowNumber: number; leadName: string; reason: string }[];
    importRecord?: LeadImportHistory;
  }>;

  createFollowUpFull: (followUp: Omit<FollowUp, 'id' | 'followUpNumber' | 'createdAt'>) => { success: boolean; message?: string };
  updateFollowUpStatusFull: (id: string, status: FollowUp['status']) => { success: boolean; message?: string };

  // Quotation Workflow Actions
  createQuotation: (quotation: Omit<Quotation, 'id'>) => { success: boolean; data?: Quotation; message?: string };
  createQuotationFromSalesOrder: (
    salesOrderId: string,
    warrantyPeriod?: string,
    initialStatus?: QuotationStatus
  ) => { success: boolean; data?: Quotation; message?: string };
  updateQuotationStatus: (id: string, status: QuotationStatus) => { success: boolean; message?: string };
  createInvoiceFromQuotation: (quotationId: string) => { success: boolean; message?: string; invoiceId?: string };
  sendInvoiceToProduction: (invoiceId: string, senderName?: string) => { success: boolean; message?: string; salesOrder?: SalesOrder };
  updateInvoiceStatus: (invoiceId: string, invoiceStatus: string) => { success: boolean; message?: string };
  sendQuotationToProduction: (id: string, senderName?: string) => { success: boolean; message?: string; salesOrder?: SalesOrder };
  sendQuotationToProduct: (id: string, senderName?: string) => { success: boolean; message?: string; salesOrder?: SalesOrder };
  updateQuotation: (id: string, data: Partial<Quotation>) => { success: boolean; message?: string };
  deleteQuotation: (id: string) => { success: boolean; message?: string };

  createSalesOrderFull: (order: Omit<SalesOrder, 'id' | 'orderDate'> & { orderNumber?: string }, allowBackorder?: boolean) => { success: boolean; message?: string };
  updateSalesOrderStatusFull: (
    id: string,
    orderStatus?: SalesOrder['orderStatus'],
    dispatchStatus?: SalesOrder['dispatchStatus'],
    paymentStatus?: SalesOrder['paymentStatus'],
    statusRemarks?: string,
    updatedBy?: string
  ) => { success: boolean; message?: string };
  sendSalesOrderToProduct: (id: string, senderName?: string) => { success: boolean; message?: string };
  updateSalesOrderProcessing: (
    id: string,
    data: {
      orderStatus?: SalesOrder['orderStatus'];
      productionStatus?: string;
      packingStatus?: string;
      productionNotes?: string;
      packingNotes?: string;
      productionDate?: string;
      packingDate?: string;
      productionImages?: string[];
      productTeamRemarks?: string;
      packedImage?: string;
      serialNumber?: string;
      batchNumber?: string;
      items?: SalesOrderItem[];
      updatedBy?: string;
      rawMaterialsDeducted?: boolean;
      rawMaterialsUsed?: any[];
    }
  ) => { success: boolean; message?: string };
  deductRawMaterialsForOrder: (
    orderId: string,
    orderNumber: string,
    items: Array<{ productId: string; productName: string; quantity: number }>
  ) => Promise<{
    success: boolean;
    deductedList: Array<{
      id: string;
      name: string;
      sku: string;
      unit: string;
      deducted: number;
      previousStock: number;
      updatedStock: number;
    }>;
    message?: string;
  }>;

  createInvoiceFromSO: (soId: string) => { success: boolean; message?: string; invoiceId?: string };
  createDispatchFull: (dispatch: Omit<SalesDispatch, 'id' | 'dispatchNumber'>) => { success: boolean; message?: string };
  createCustomerPaymentFull: (payment: Omit<CustomerPayment, 'id' | 'paymentNumber'>, allowOverpayment?: boolean) => { success: boolean; message?: string };
  uploadCustomerPaymentProof: (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';
    referenceNumber: string;
    proofFiles: string[];
    uploadedBy?: string;
    notes?: string;
    sendToProductionImmediately?: boolean;
  }) => Promise<{ success: boolean; message?: string; paymentId?: string; sentToProduction?: boolean }>;
  verifyCustomerPayment: (paymentId: string, notes?: string, verifiedBy?: string) => { success: boolean; message?: string };
  completeCustomerPayment: (paymentId: string, verifiedBy?: string, notes?: string) => { success: boolean; message?: string };
  rejectCustomerPayment: (paymentId: string, rejectionReason: string, rejectedBy?: string) => { success: boolean; message?: string };
  updatePaymentProofFiles: (paymentId: string, proofFiles: string[], action?: 'replace' | 'delete' | 'add') => { success: boolean; message?: string };
  createSalesReturnFull: (ret: Omit<SalesReturn, 'id' | 'returnNumber' | 'returnDate'>) => { success: boolean; message?: string };
  clearAllSalesData: () => Promise<{ success: boolean; message?: string; deletedCounts?: any }>;
  clearAllSystemData: () => Promise<{ success: boolean; message?: string; deletedCounts?: any }>;
  createPurchaseRequest: (req: Omit<PurchaseRequest, 'id' | 'requestId' | 'date'>) => { success: boolean; message?: string; requestId?: string };
  updatePurchaseRequestStatus: (id: string, status: PurchaseRequestStatus) => { success: boolean; message?: string };

  // CRUD & Workflow Actions
  addRawMaterial: (material: Omit<RawMaterial, 'id'>) => { success: boolean; message?: string };
  updateRawMaterial: (id: string, material: Partial<RawMaterial>) => { success: boolean; message?: string };
  deleteRawMaterial: (id: string) => { success: boolean; message?: string };

  addFinishedGood: (good: Omit<FinishedGood, 'id'>) => void;
  updateFinishedGood: (id: string, good: Partial<FinishedGood>) => void;
  deleteFinishedGood: (id: string) => void;

  createProductionOrder: (order: Omit<ProductionOrder, 'id' | 'orderNumber'>) => void;
  completeProductionOrder: (id: string) => boolean;

  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;

  createSalesOrder: (order: Omit<SalesOrder, 'id' | 'orderNumber'>) => boolean;
  updateSalesOrderStatus: (
    id: string,
    dispatchStatus?: SalesOrder['dispatchStatus'],
    paymentStatus?: SalesOrder['paymentStatus']
  ) => void;

  addSupplier: (supplier: Omit<Supplier, 'id'>) => { success: boolean; message?: string; id?: string };
  updateSupplier: (id: string, supplier: Partial<Supplier>) => { success: boolean; message?: string };
  deleteSupplier: (id: string) => { success: boolean; message?: string };

  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id'> | Omit<PurchaseOrder, 'id' | 'poNumber'>) => { success: boolean; message?: string };
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void;
  receivePurchaseOrder: (id: string) => void;

  createMaterialReceipt: (
    receipt: Omit<MaterialReceipt, 'id' | 'receiptNumber'>,
    allowOverReceive?: boolean
  ) => { success: boolean; message?: string };

  createMaterialConsumption: (
    consumption: Omit<MaterialConsumption, 'id' | 'consumptionId'>,
    allowNegativeStock?: boolean
  ) => { success: boolean; message?: string };

  createSupplierPayment: (
    payment: Omit<SupplierPayment, 'id' | 'paymentId'>,
    allowOverPayment?: boolean
  ) => { success: boolean; message?: string };

  // Centralized Stock Actions
  updateStockQuantity: (params: {
    itemId: string;
    stockType: 'Raw Material' | 'Finished Product';
    newQuantity: number;
    reason: string;
    notes?: string;
    updatedBy?: string;
  }) => { success: boolean; message?: string };

  // Computed & Derived Values
  alerts: SystemAlert[];
  financials: FinancialSummary;
  hasPermission: (moduleKey: keyof typeof ROLE_PERMISSIONS['ADMIN']) => boolean;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'SUNYASH_MAPOUT_ERP_STATE_V3';

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('ADMIN');

  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(INITIAL_RAW_MATERIALS);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>(INITIAL_FINISHED_GOODS);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(INITIAL_PRODUCTION_ORDERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(INITIAL_SALES_ORDERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [materialReceipts, setMaterialReceipts] = useState<MaterialReceipt[]>(INITIAL_MATERIAL_RECEIPTS);
  const [materialConsumptions, setMaterialConsumptions] = useState<MaterialConsumption[]>(INITIAL_MATERIAL_CONSUMPTIONS);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(INITIAL_SUPPLIER_PAYMENTS);
  const [stockTransactions, setStockTransactions] = useState<RawMaterialStockTransaction[]>(INITIAL_STOCK_TRANSACTIONS);

  // Product Management States
  const [products, setProducts] = useState<ProductMaster[]>(INITIAL_PRODUCTS);
  const [boms, setBoms] = useState<BOM[]>(INITIAL_BOMS);
  const [productReturns, setProductReturns] = useState<ProductReturn[]>(INITIAL_PRODUCT_RETURNS);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(INITIAL_STOCK_ADJUSTMENTS);
  const [fgTransactions, setFgTransactions] = useState<FinishedGoodsStockTransaction[]>(INITIAL_FG_TRANSACTIONS);

  // Sales Management States
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [leadImportHistories, setLeadImportHistories] = useState<LeadImportHistory[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>(INITIAL_FOLLOWUPS);
  const [invoices, setInvoices] = useState<SalesInvoice[]>(INITIAL_INVOICES);
  const [dispatches, setDispatches] = useState<SalesDispatch[]>(INITIAL_DISPATCHES);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>(INITIAL_CUSTOMER_PAYMENTS);
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(INITIAL_SALES_RETURNS);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);

  // Load saved state from LocalStorage & Next.js Prisma API Backend
  useEffect(() => {
    try {
      localStorage.removeItem('SUNYASH_MAPOUT_ERP_STATE_V2');
      localStorage.removeItem('SUNYASH_MAPOUT_ERP_STATE');
      localStorage.removeItem('crm_stock_data');
    } catch {}

    try {
      const userStr = localStorage.getItem('crm_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role) setActiveRole(u.role);
      }
    } catch {}

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rawMaterials) setRawMaterials(parsed.rawMaterials);
        if (parsed.finishedGoods) setFinishedGoods(parsed.finishedGoods);
        if (parsed.productionOrders) setProductionOrders(parsed.productionOrders);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.salesOrders) setSalesOrders(parsed.salesOrders);
        if (parsed.suppliers) setSuppliers(parsed.suppliers);
        if (parsed.purchaseOrders) setPurchaseOrders(parsed.purchaseOrders);
        if (parsed.materialReceipts) setMaterialReceipts(parsed.materialReceipts);
        if (parsed.materialConsumptions) setMaterialConsumptions(parsed.materialConsumptions);
        if (parsed.supplierPayments) setSupplierPayments(parsed.supplierPayments);
        if (parsed.stockTransactions) setStockTransactions(parsed.stockTransactions);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.boms) setBoms(parsed.boms);
        if (parsed.productReturns) setProductReturns(parsed.productReturns);
        if (parsed.stockAdjustments) setStockAdjustments(parsed.stockAdjustments);
        if (parsed.fgTransactions) setFgTransactions(parsed.fgTransactions);
        if (parsed.quotations) setQuotations(parsed.quotations);
        if (parsed.leads) setLeads(parsed.leads);
        if (parsed.leadImportHistories) setLeadImportHistories(parsed.leadImportHistories);
        if (parsed.followUps) setFollowUps(parsed.followUps);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.dispatches) setDispatches(parsed.dispatches);
        if (parsed.customerPayments) setCustomerPayments(parsed.customerPayments);
        if (parsed.salesReturns) setSalesReturns(parsed.salesReturns);
        if (parsed.purchaseRequests) setPurchaseRequests(parsed.purchaseRequests);
      }

      // Fetch latest real database records from Next.js App Router API Routes
      const fetchBackendData = async () => {
        try {
          const [resProd, resRM, resBOM, resCust, resSales, resRet, resSup, resPO, resInv, resDisp, resLead, resPay, resQuot, resLeadHistory] = await Promise.all([
            fetch('/api/products').then((r) => r.json()).catch(() => null),
            fetch('/api/raw-materials').then((r) => r.json()).catch(() => null),
            fetch('/api/boms').then((r) => r.json()).catch(() => null),
            fetch('/api/customers').then((r) => r.json()).catch(() => null),
            fetch('/api/sales-orders').then((r) => r.json()).catch(() => null),
            fetch('/api/returns').then((r) => r.json()).catch(() => null),
            fetch('/api/suppliers').then((r) => r.json()).catch(() => null),
            fetch('/api/purchase-orders').then((r) => r.json()).catch(() => null),
            fetch('/api/invoices').then((r) => r.json()).catch(() => null),
            fetch('/api/dispatches').then((r) => r.json()).catch(() => null),
            fetch('/api/leads').then((r) => r.json()).catch(() => null),
            fetch('/api/payments').then((r) => r.json()).catch(() => null),
            fetch('/api/quotations').then((r) => r.json()).catch(() => null),
            fetch('/api/leads/import-history').then((r) => r.json()).catch(() => null),
          ]);

          if (resProd?.success && Array.isArray(resProd.data)) setProducts(resProd.data);
          if (resRM?.success && Array.isArray(resRM.data)) setRawMaterials(resRM.data);
          if (resBOM?.success && Array.isArray(resBOM.data)) setBoms(resBOM.data);
          if (resSales?.success && Array.isArray(resSales.data)) {
            setSalesOrders(resSales.data);
          }
          if (resCust?.success && Array.isArray(resCust.data)) setCustomers(resCust.data);
          if (resRet?.success && Array.isArray(resRet.data)) setProductReturns(resRet.data);
          if (resSup?.success && Array.isArray(resSup.data)) setSuppliers(resSup.data);
          if (resPO?.success && Array.isArray(resPO.data)) setPurchaseOrders(resPO.data);
          if (resInv?.success && Array.isArray(resInv.data)) setInvoices(resInv.data);
          if (resDisp?.success && Array.isArray(resDisp.data)) setDispatches(resDisp.data);
          if (resLead?.success && Array.isArray(resLead.data)) setLeads(resLead.data);
          if (resLeadHistory?.success && Array.isArray(resLeadHistory.data)) setLeadImportHistories(resLeadHistory.data);
          if (resQuot?.success && Array.isArray(resQuot.data)) {
            setQuotations(resQuot.data);

            // Populate in-memory productionOrders for any Quotation marked Sent to Production
            const sentQuotations = resQuot.data.filter(
              (q: any) => q.status === 'Sent to Production' || q.status === 'Sent to Product'
            );
            if (sentQuotations.length > 0) {
              setProductionOrders((prev) => {
                const existingQuoteIds = new Set(prev.map((p: any) => p.quotationId));
                const newProds: any[] = [];
                sentQuotations.forEach((q: any) => {
                  if (!existingQuoteIds.has(q.id)) {
                    (q.items || []).forEach((item: any, idx: number) => {
                      newProds.push({
                        id: `po_sync_${q.id}_${idx}`,
                        orderNumber: `PO-${q.quotationNumber?.replace('QT-', '') || idx}`,
                        finishedGoodId: item.productId,
                        finishedGoodName: item.productName,
                        productId: item.productId,
                        productName: item.productName,
                        bomId: 'BOM-DEFAULT',
                        bomVersion: 1,
                        plannedQuantity: item.quantity,
                        producedQuantity: 0,
                        quantityToProduce: item.quantity,
                        productionDate: q.quotationDate || new Date().toISOString().split('T')[0],
                        expectedCompletion: q.validUntil || new Date().toISOString().split('T')[0],
                        startDate: q.quotationDate || new Date().toISOString().split('T')[0],
                        priority: 'High',
                        status: 'In Progress',
                        assignedEngineer: 'Production Team',
                        notes: `Quotation ${q.quotationNumber} for ${q.customerName}`,
                        quotationId: q.id,
                        salesOrderId: q.salesOrderId,
                        customerId: q.customerId,
                      });
                    });
                  }
                });
                return [...newProds, ...prev];
              });
            }
          }
          if (resPay?.success && resPay.data) {
            if (Array.isArray(resPay.data.customerPayments)) {
              setCustomerPayments(resPay.data.customerPayments);
            }
            if (Array.isArray(resPay.data.supplierPayments)) {
              setSupplierPayments(resPay.data.supplierPayments);
            }
          }
        } catch (e) {
          // DB API Sync notice
        }
      };
      fetchBackendData();
    } catch (e) {
      console.warn('Failed to load local storage state:', e);
    }
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      const stateToSave = {
        rawMaterials,
        finishedGoods,
        productionOrders,
        customers,
        salesOrders,
        suppliers,
        purchaseOrders,
        materialReceipts,
        materialConsumptions,
        supplierPayments,
        stockTransactions,
        products,
        boms,
        productReturns,
        stockAdjustments,
        fgTransactions,
        quotations,
        leads,
        leadImportHistories,
        followUps,
        invoices,
        dispatches,
        customerPayments,
        salesReturns,
        purchaseRequests,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save state to local storage:', e);
    }
  }, [
    rawMaterials,
    finishedGoods,
    productionOrders,
    customers,
    salesOrders,
    suppliers,
    purchaseOrders,
    materialReceipts,
    materialConsumptions,
    supplierPayments,
    stockTransactions,
    products,
    boms,
    productReturns,
    stockAdjustments,
    fgTransactions,
    quotations,
    leads,
    leadImportHistories,
    followUps,
    invoices,
    dispatches,
    customerPayments,
    salesReturns,
    purchaseRequests,
  ]);

  // Independent persistent sequence counters per entity
  const [maxCounters, setMaxCounters] = useState<Record<string, number>>({});

  // Centralized Sequence Code Generator
  const generateEntityCode = (entityType: EntityType): string => {
    let existingCodes: (string | undefined | null)[] = [];
    switch (entityType) {
      case 'QUOTATION':
        existingCodes = quotations.map((q) => q.quotationNumber);
        break;
      case 'RAW_MATERIAL':
        existingCodes = rawMaterials.map((r) => r.sku);
        break;
      case 'PRODUCT':
        existingCodes = products.map((p) => p.productCode || p.sku);
        break;
      case 'SUPPLIER':
        existingCodes = suppliers.map((s) => s.supplierCode);
        break;
      case 'CUSTOMER':
        existingCodes = customers.map((c) => c.customerCode);
        break;
      case 'PRODUCTION':
        existingCodes = productionOrders.map((p) => p.orderNumber);
        break;
      case 'PURCHASE_ORDER':
        existingCodes = purchaseOrders.map((p) => p.poNumber);
        break;
      case 'SALES_ORDER':
        existingCodes = salesOrders.map((s) => s.orderNumber);
        break;
      case 'INVOICE':
        existingCodes = invoices.map((i) => i.invoiceNumber);
        break;
      case 'DISPATCH':
        existingCodes = dispatches.map((d) => d.dispatchNumber);
        break;
      case 'PAYMENT':
        existingCodes = customerPayments.map((p) => p.paymentNumber);
        break;
      case 'RETURN':
        existingCodes = salesReturns.map((r) => r.returnNumber);
        break;
      case 'PURCHASE_REQUEST':
        existingCodes = purchaseRequests.map((pr) => pr.requestId);
        break;
    }

    return generateNextEntityCode(entityType, existingCodes, maxCounters);
  };

  const recordEntityCodeCreated = (entityType: EntityType, code?: string) => {
    if (!code) return;
    const prefix = ENTITY_PREFIXES[entityType];
    const num = extractCodeNumber(code, prefix);
    if (num !== null) {
      setMaxCounters((prev) => ({
        ...prev,
        [entityType]: Math.max(prev[entityType] || 100, num),
      }));
    }
  };

  const hasPermission = (moduleKey: keyof typeof ROLE_PERMISSIONS['ADMIN']) => {
    return ROLE_PERMISSIONS[activeRole]?.[moduleKey] ?? false;
  };

  // --- RAW MATERIALS ACTIONS ---
  const addRawMaterial = (material: Omit<RawMaterial, 'id'>) => {
    const skuCode = material.sku || generateEntityCode('RAW_MATERIAL');
    // Check duplicate code/SKU
    const exists = rawMaterials.some((rm) => rm.sku.trim().toLowerCase() === skuCode.trim().toLowerCase());
    if (exists) {
      return { success: false, message: `Material Code "${skuCode}" already exists!` };
    }
    const newId = `rm-${Date.now().toString().slice(-4)}`;
    const newMaterial: RawMaterial = { ...material, sku: skuCode, id: newId };
    setRawMaterials((prev) => [...prev, newMaterial]);
    recordEntityCodeCreated('RAW_MATERIAL', skuCode);

    // Record Opening Stock Transaction if stock > 0
    if (material.currentStock > 0) {
      const tx: RawMaterialStockTransaction = {
        id: `tx-${Date.now().toString().slice(-5)}`,
        materialId: newId,
        materialName: material.name,
        date: new Date().toISOString().split('T')[0],
        transactionType: 'Opening Stock',
        reference: `INIT-${newMaterial.sku}`,
        quantityIn: material.currentStock,
        quantityOut: 0,
        previousBalance: 0,
        newBalance: material.currentStock,
        user: activeRole === 'ADMIN' ? 'Admin' : 'Raw Material Manager',
      };
      setStockTransactions((prev) => [tx, ...prev]);
    }

    // Persist to Prisma DB API in background
    fetch('/api/raw-materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMaterial),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.data) {
          setRawMaterials((prev) =>
            prev.map((rm) => (rm.sku === newMaterial.sku ? { ...rm, ...data.data } : rm))
          );
        }
      })
      .catch((err) => console.warn('Failed to sync raw material to DB:', err));

    return { success: true };
  };

  const updateRawMaterial = (id: string, updated: Partial<RawMaterial>) => {
    if (updated.sku) {
      const exists = rawMaterials.some(
        (rm) => rm.id !== id && rm.sku.trim().toLowerCase() === updated.sku?.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, message: `Material Code "${updated.sku}" is already in use by another item.` };
      }
    }
    setRawMaterials((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );

    fetch('/api/raw-materials', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updated }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.data) {
          setRawMaterials((prev) =>
            prev.map((rm) => (rm.id === id || rm.sku === updated.sku ? { ...rm, ...data.data } : rm))
          );
        }
      })
      .catch((err) => console.warn('Failed to update raw material in DB:', err));

    return { success: true };
  };

  const deleteRawMaterial = (id: string) => {
    // Check if raw material is referenced in POs, Receipts, or Consumptions
    const usedInPO = purchaseOrders.some((po) => po.items.some((i) => i.rawMaterialId === id));
    const usedInReceipt = materialReceipts.some((rec) => rec.items.some((i) => i.rawMaterialId === id));
    const usedInCons = materialConsumptions.some((c) => c.rawMaterialId === id);

    if (usedInPO || usedInReceipt || usedInCons) {
      return {
        success: false,
        message: 'Cannot delete material with existing purchase, receipt, or consumption transactions. Mark as Inactive instead.',
      };
    }

    const targetRm = rawMaterials.find((item) => item.id === id);
    setRawMaterials((prev) => prev.filter((item) => item.id !== id));

    // Delete from PostgreSQL database via API
    fetch(`/api/raw-materials?id=${encodeURIComponent(id)}&sku=${encodeURIComponent(targetRm?.sku || '')}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Failed to delete raw material from database:', err));

    return { success: true };
  };

  // --- FINISHED GOODS ACTIONS ---
  const addFinishedGood = (good: Omit<FinishedGood, 'id'>) => {
    const newId = `fg-${Date.now().toString().slice(-4)}`;
    setFinishedGoods((prev) => [...prev, { ...good, id: newId }]);
  };

  const updateFinishedGood = (id: string, updated: Partial<FinishedGood>) => {
    setFinishedGoods((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const deleteFinishedGood = (id: string) => {
    setFinishedGoods((prev) => prev.filter((item) => item.id !== id));
  };

  // --- PRODUCTION ACTIONS ---
  const createProductionOrder = (order: Omit<ProductionOrder, 'id' | 'orderNumber'>) => {
    const newId = `prod-${Date.now().toString().slice(-4)}`;
    const orderNumber = (order as any).orderNumber || generateEntityCode('PRODUCTION');
    setProductionOrders((prev) => [{ ...order, id: newId, orderNumber }, ...prev]);
  };

  const completeProductionOrder = (id: string): boolean => {
    const pOrder = productionOrders.find((p) => p.id === id);
    if (!pOrder || pOrder.status === 'COMPLETED') return false;

    const targetGood = finishedGoods.find((fg) => fg.id === pOrder.finishedGoodId);
    if (!targetGood) return false;

    // Check raw material stock
    const missingMaterials: string[] = [];
    targetGood.bom.forEach((bomItem) => {
      const requiredQty = bomItem.quantityRequired * pOrder.quantityToProduce;
      const rm = rawMaterials.find((r) => r.id === bomItem.rawMaterialId);
      if (!rm || rm.currentStock < requiredQty) {
        missingMaterials.push(rm ? rm.name : bomItem.rawMaterialId);
      }
    });

    if (missingMaterials.length > 0) {
      alert(`Cannot complete production order. Insufficient stock for: ${missingMaterials.join(', ')}`);
      return false;
    }

    const today = new Date().toISOString().split('T')[0];

    // Deduct Raw Materials & Record Stock Transactions
    const deductionsToPersist: Array<{ rawMaterialId: string; quantity: number }> = [];

    setRawMaterials((prev) =>
      prev.map((rm) => {
        const bomItem = targetGood.bom.find((b) => b.rawMaterialId === rm.id);
        if (bomItem) {
          const requiredQty = bomItem.quantityRequired * pOrder.quantityToProduce;
          const prevBal = rm.currentStock;
          const newBal = prevBal - requiredQty;
          deductionsToPersist.push({ rawMaterialId: rm.id, quantity: requiredQty });

          const tx: RawMaterialStockTransaction = {
            id: `tx-${Date.now().toString().slice(-5)}-${rm.id}`,
            materialId: rm.id,
            materialName: rm.name,
            date: today,
            transactionType: 'Material Consumption',
            reference: pOrder.orderNumber,
            quantityIn: 0,
            quantityOut: requiredQty,
            previousBalance: prevBal,
            newBalance: newBal,
            user: pOrder.assignedEngineer || 'Production Engineer',
          };
          setStockTransactions((st) => [tx, ...st]);

          return { ...rm, currentStock: newBal };
        }
        return rm;
      })
    );

    if (deductionsToPersist.length > 0) {
      fetch('/api/raw-materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deductions: deductionsToPersist }),
      }).then(() => refreshRawMaterialsFromDB()).catch(console.warn);
    }

    // Increment Finished Good Stock & Product Master Stock
    setFinishedGoods((prev) =>
      prev.map((fg) =>
        fg.id === targetGood.id
          ? { ...fg, currentStock: fg.currentStock + pOrder.quantityToProduce }
          : fg
      )
    );
    setProducts((prev) =>
      prev.map((p) =>
        p.id === targetGood.id || p.sku === targetGood.sku
          ? { ...p, currentStock: p.currentStock + pOrder.quantityToProduce }
          : p
      )
    );

    // Update Order Status
    setProductionOrders((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'COMPLETED', completionDate: today } : p
      )
    );

    return true;
  };

  // --- CUSTOMER ACTIONS ---
  const addCustomer = (customer: Omit<Customer, 'id'>) => {
    const newId = `cust-${Date.now().toString().slice(-4)}`;
    setCustomers((prev) => [...prev, { ...customer, id: newId }]);
  };

  const updateCustomer = (id: string, updated: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const addCustomerFull = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const code = customer.customerNumber?.trim() || customer.customerCode?.trim() || generateEntityCode('CUSTOMER');
    const targetMobile = (customer.mobile || '').trim();
    const targetEmail = (customer.email || '').trim().toLowerCase();
    const targetGstin = (customer.gstin || customer.gstNumber || '').trim().toUpperCase();

    // STRICT BUSINESS RULE: Check existing customers using:
    // 1. Customer Number
    // 2. Mobile Number
    // 3. Email
    // 4. GSTIN
    const exists = customers.some((c) => {
      const cCode = (c.customerNumber || c.customerCode || '').trim().toLowerCase();
      if (cCode && cCode === code.toLowerCase()) return true;
      if (targetMobile && c.mobile && c.mobile.trim() === targetMobile) return true;
      if (targetEmail && c.email && c.email.trim().toLowerCase() === targetEmail) return true;
      if (targetGstin && (c.gstin || c.gstNumber) && (c.gstin || c.gstNumber || '').trim().toUpperCase() === targetGstin) return true;
      return false;
    });

    if (exists) {
      return {
        success: false,
        message: `Customer already exists with matching Customer Number (${code}), Mobile (${targetMobile}), Email (${targetEmail}), or GSTIN (${targetGstin}). Duplicates are not allowed.`,
      };
    }

    const newId = `cust-${Date.now().toString().slice(-4)}`;
    const newCustomer: Customer = {
      ...customer,
      id: newId,
      customerNumber: code,
      customerCode: code,
      totalOrders: customer.totalOrders || 0,
      totalSales: customer.totalSales || 0,
      totalPaid: customer.totalPaid || 0,
      totalOutstanding: customer.totalOutstanding || 0,
      status: customer.status || 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    recordEntityCodeCreated('CUSTOMER', code);

    // Persist to Prisma DB API in background
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer),
    }).catch((err) => console.warn('Failed to sync customer to DB:', err));

    return { success: true };
  };

  const updateCustomerFull = (id: string, updated: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
    return { success: true };
  };

  const toggleCustomerStatus = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : c
      )
    );
    return { success: true };
  };

  // --- CRM LEADS & FOLLOW-UPS ACTIONS ---
  const handleLeadStatusAutomation = (targetLead: Lead, newStatus: LeadStatus) => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Follow-up or Contacted: Automatically ensure entry in Follow-ups
    if (newStatus === 'Follow-up' || newStatus === 'Contacted') {
      setFollowUps((prev) => {
        const hasExisting = prev.some(
          (f) => f.leadOrCustomerId === targetLead.id && f.status === 'Pending'
        );
        if (hasExisting) return prev;

        const year = new Date().getFullYear();
        const followUpNumber = `FL-${year}-${Math.floor(100 + Math.random() * 900)}`;
        const newId = `fol-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5)}`;
        const leadDisplayName = targetLead.companyName || targetLead.leadName || 'Lead';

        const newFollowUp: FollowUp = {
          id: newId,
          followUpNumber,
          leadOrCustomerId: targetLead.id,
          leadOrCustomerName: leadDisplayName,
          customerName: leadDisplayName,
          companyName: targetLead.companyName,
          contactPerson: targetLead.contactPerson || targetLead.leadName,
          mobile: targetLead.mobile,
          email: targetLead.email,
          type: 'Lead',
          followUpDate: targetLead.nextFollowUpDate || today,
          followUpTime: '11:00 AM',
          followUpType: 'Call',
          purpose: newStatus === 'Contacted' ? 'Requirement Inquiry & Contact Discussion' : 'Scheduled Follow-up Call',
          notes: targetLead.notes || `Lead Status: ${newStatus}. Requirement: ${targetLead.requirement || 'OBD Products'}`,
          status: 'Pending',
          assignedUser: targetLead.salesperson || targetLead.assignedUser || 'Sales Person',
          salesperson: targetLead.salesperson || targetLead.assignedUser || 'Sales Person',
          createdAt: today,
        };
        return [newFollowUp, ...prev];
      });
    }

    // 2. Send Quotation or Quotation Sent: Automatically ensure in Customers & Quotations
    if (newStatus === 'Send Quotation' || newStatus === 'Quotation Sent') {
      let linkedCustId = targetLead.convertedCustomerId;

      // A. Create or get Customer
      setCustomers((prevCusts) => {
        let existingCust = linkedCustId ? prevCusts.find((c) => c.id === linkedCustId) : undefined;
        if (!existingCust) {
          const targetMobile = (targetLead.mobile || '').replace(/\D/g, '');
          const targetEmail = (targetLead.email || '').toLowerCase().trim();
          const targetCompany = (targetLead.companyName || '').toLowerCase().trim();

          existingCust = prevCusts.find((c) => {
            if (targetMobile && c.mobile && c.mobile.replace(/\D/g, '') === targetMobile) return true;
            if (targetEmail && c.email && c.email.toLowerCase().trim() === targetEmail) return true;
            if (targetCompany && targetCompany.length > 2 && (c.companyName || '').toLowerCase().trim() === targetCompany) return true;
            return false;
          });
        }

        let updatedCusts = prevCusts;
        if (existingCust) {
          linkedCustId = existingCust.id;
        } else {
          const code = generateEntityCode('CUSTOMER');
          const newCustId = `cust-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5)}`;
          linkedCustId = newCustId;
          const newCust: Customer = {
            id: newCustId,
            customerNumber: code,
            customerCode: code,
            name: targetLead.leadName || targetLead.companyName || 'Valued Customer',
            companyName: targetLead.companyName || targetLead.leadName || 'Company',
            customerType: 'Distributor',
            contactPerson: targetLead.contactPerson || targetLead.leadName || 'Contact Person',
            mobile: targetLead.mobile || '',
            alternateMobile: targetLead.alternateMobile || '',
            email: targetLead.email || '',
            address: targetLead.address || 'Converted from Lead',
            city: targetLead.city || 'City',
            state: targetLead.state || 'State',
            pincode: targetLead.pincode || '000000',
            country: 'India',
            category: targetLead.industry || 'Distributor',
            gstin: targetLead.gstin || '',
            gstNumber: targetLead.gstin || '',
            paymentTerms: 'Net 30 Days',
            creditLimit: 150000,
            assignedSalesUser: targetLead.salesperson || targetLead.assignedUser || 'Sales Person',
            totalOrders: 0,
            totalSales: 0,
            totalPaid: 0,
            totalOutstanding: 0,
            status: 'ACTIVE',
            convertedFromLeadId: targetLead.id,
            createdAt: today,
          };
          recordEntityCodeCreated('CUSTOMER', code);
          fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCust),
          }).catch((e) => console.warn('Sync customer error:', e));
          updatedCusts = [newCust, ...prevCusts];
        }

        // Link customer to lead
        setLeads((prevLeads) =>
          prevLeads.map((l) => (l.id === targetLead.id ? { ...l, convertedCustomerId: linkedCustId } : l))
        );

        // B. Create Quotation if one doesn't exist yet
        setQuotations((prevQuotes) => {
          const hasQuote = prevQuotes.some(
            (q) =>
              q.customerId === linkedCustId ||
              (q.notes && q.notes.includes(targetLead.leadNumber))
          );
          if (hasQuote) return prevQuotes;

          const matchedProduct =
            products.find((p) => p.id === targetLead.interestedProductId) ||
            products.find(
              (p) =>
                targetLead.interestedProductName &&
                p.name.toLowerCase().includes(targetLead.interestedProductName.toLowerCase())
            ) ||
            (products.length > 0 ? products[0] : null);

          const quoteNum = generateEntityCode('QUOTATION');
          const quoteId = `qt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const validDate = new Date();
          validDate.setDate(validDate.getDate() + 30);
          const custObj = updatedCusts.find((c) => c.id === linkedCustId);

          const rate = matchedProduct ? matchedProduct.sellingPrice : (targetLead.expectedValue ? Math.min(targetLead.expectedValue, 5000) : 1200);
          const qty = 1;
          const subtotal = rate * qty;
          const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
          const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

          const newQuotation: Quotation = {
            id: quoteId,
            quotationNumber: quoteNum,
            customerId: linkedCustId || 'cust-101',
            customerName: custObj?.companyName || custObj?.name || targetLead.companyName || targetLead.leadName || 'Customer',
            customerNumber: custObj?.customerNumber || custObj?.customerCode || 'CUS-101',
            quotationDate: today,
            validUntil: validDate.toISOString().split('T')[0],
            status: 'Draft',
            paymentMode: 'Prepaid',
            warrantyPeriod: '1 Year',
            items: matchedProduct
              ? [
                  {
                    id: `qti_${Date.now()}_0`,
                    itemType: 'PRODUCT',
                    productId: matchedProduct.id,
                    productName: matchedProduct.name,
                    sku: matchedProduct.sku,
                    unit: 'PCS',
                    quantity: qty,
                    rate,
                    discount: 0,
                    gstPercent: 18,
                    totalAmount,
                    warrantyPeriod: '1 Year',
                  },
                ]
              : [
                  {
                    id: `qti_${Date.now()}_0`,
                    itemType: 'PRODUCT',
                    productId: 'prd-gen',
                    productName: targetLead.requirement || targetLead.interestedProductName || 'Custom OBD Cable',
                    sku: 'OBD-GEN-01',
                    unit: 'PCS',
                    quantity: 1,
                    rate: subtotal,
                    discount: 0,
                    gstPercent: 18,
                    totalAmount,
                    warrantyPeriod: '1 Year',
                  },
                ],
            subtotal,
            discountAmount: 0,
            taxAmount,
            totalAmount,
            termsAndConditions:
              '1. Prices are valid for 30 days from date of issue.\n2. Payment terms: Net 30 days from invoice date.\n3. Standard 1 Year Warranty against manufacturing defects.\n4. Replacement is given on cable with intact serial numbers.\n5. Freight charges extra as applicable.',
            notes: `Auto-generated for Lead ${targetLead.leadNumber} (${targetLead.companyName || targetLead.leadName}) | Req: ${targetLead.requirement || 'Standard OBD Cable Assembly'}`,
            salesperson: targetLead.salesperson || (activeRole === 'ADMIN' ? 'Administrator' : 'Sales Person'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          recordEntityCodeCreated('QUOTATION', quoteNum);
          fetch('/api/quotations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newQuotation),
          }).catch((e) => console.warn('Sync quotation error:', e));

          return [newQuotation, ...prevQuotes];
        });

        return updatedCusts;
      });
    }
  };

  const createLeadFull = (lead: Omit<Lead, 'id' | 'leadNumber' | 'createdAt'>) => {
    const year = new Date().getFullYear();
    const leadNumber = `LD-${year}-${Math.floor(100 + Math.random() * 900)}`;
    const newId = `lead-${Date.now().toString().slice(-4)}`;
    const newLead: Lead = {
      ...lead,
      id: newId,
      leadNumber,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setLeads((prev) => [newLead, ...prev]);

    if (newLead.status && newLead.status !== 'New') {
      handleLeadStatusAutomation(newLead, newLead.status);
    }

    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLead),
    }).catch((err) => console.warn('Sync lead create error:', err));
    return { success: true };
  };

  const updateLeadFull = (id: string, updated: Partial<Lead>) => {
    let currentLead: Lead | undefined;
    setLeads((prev) => {
      const match = prev.find((l) => l.id === id);
      if (match) {
        currentLead = { ...match, ...updated };
      }
      return prev.map((l) => (l.id === id ? { ...l, ...updated } : l));
    });

    if (currentLead && updated.status) {
      handleLeadStatusAutomation(currentLead, updated.status);
    }

    fetch('/api/leads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updated }),
    }).catch((err) => console.warn('Sync lead update error:', err));
    return { success: true };
  };

  const convertLeadToCustomer = (leadId: string) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return { success: false, message: 'Lead not found.' };

    const targetMobile = (targetLead.mobile || '').trim();
    const targetEmail = (targetLead.email || '').trim().toLowerCase();
    const targetCompany = (targetLead.companyName || '').trim().toLowerCase();
    const targetPerson = (targetLead.contactPerson || targetLead.leadName || '').trim().toLowerCase();
    const targetGstin = (targetLead.gstin || '').trim().toUpperCase();

    // Check if customer already exists by mobile, email, gstin, or company + contact
    const existingCust = customers.find((c) => {
      const cMobile = (c.mobile || '').trim();
      const cEmail = (c.email || '').trim().toLowerCase();
      const cCompany = (c.companyName || c.name || '').trim().toLowerCase();
      const cPerson = (c.contactPerson || '').trim().toLowerCase();
      const cGstin = (c.gstin || c.gstNumber || '').trim().toUpperCase();

      if (targetMobile && cMobile && targetMobile === cMobile) return true;
      if (targetEmail && cEmail && targetEmail === cEmail) return true;
      if (targetGstin && cGstin && targetGstin === cGstin) return true;
      if (targetCompany && targetCompany.length > 2 && cCompany === targetCompany) {
        if (targetPerson && cPerson && targetPerson === cPerson) return true;
      }
      return false;
    });

    let customerId = existingCust?.id;

    if (!existingCust) {
      const code = generateEntityCode('CUSTOMER');
      const newCustId = `cust-${Date.now().toString().slice(-4)}`;
      const newCustomer: Customer = {
        id: newCustId,
        customerNumber: code,
        customerCode: code,
        name: targetLead.leadName || targetLead.companyName || 'Valued Customer',
        companyName: targetLead.companyName || targetLead.leadName || 'Company',
        customerType: 'Distributor',
        contactPerson: targetLead.contactPerson || targetLead.leadName || 'Contact Person',
        mobile: targetLead.mobile || '',
        alternateMobile: targetLead.alternateMobile || '',
        email: targetLead.email || '',
        address: targetLead.address || 'Converted from Lead',
        city: targetLead.city || 'City',
        state: targetLead.state || 'State',
        pincode: targetLead.pincode || '000000',
        country: 'India',
        category: targetLead.industry || 'Distributor',
        gstin: targetLead.gstin || '',
        gstNumber: targetLead.gstin || '',
        paymentTerms: 'Net 30 Days',
        creditLimit: 100000,
        assignedSalesUser: targetLead.salesperson || targetLead.assignedUser,
        totalOrders: 0,
        totalSales: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        status: 'ACTIVE',
        convertedFromLeadId: leadId,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setCustomers((prev) => [newCustomer, ...prev]);
      recordEntityCodeCreated('CUSTOMER', code);
      customerId = newCustId;
      fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      }).catch((e) => console.warn('Sync customer error:', e));
    }

    // Update Lead status to Converted and preserve link
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: 'Converted', convertedCustomerId: customerId } : l))
    );
    fetch('/api/leads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: leadId, status: 'Converted', convertedCustomerId: customerId }),
    }).catch((e) => console.warn('Sync lead convert error:', e));

    // Preserve follow-up history: link customer ID to all existing lead follow-ups
    setFollowUps((prev) =>
      prev.map((f) =>
        f.leadOrCustomerId === leadId && f.type === 'Lead'
          ? { ...f, convertedCustomerId: customerId }
          : f
      )
    );

    return { success: true, customerId };
  };

  const importLeadsBatch = async (
    rows: any[],
    options: {
      fileName: string;
      importedBy: string;
      duplicateHandling?: 'update' | 'skip' | 'asNew';
    }
  ) => {
    const importId = `imp-${Date.now()}`;
    let newLeads = 0;
    let updatedLeads = 0;
    let duplicateLeads = 0;
    let failedRows = 0;
    const failedItems: { rowNumber: number; leadName: string; reason: string }[] = [];

    const leadsToAdd: Lead[] = [];
    const leadsToUpdate: { id: string; updates: Partial<Lead> }[] = [];

    rows.forEach((row, idx) => {
      const rowNumber = row.rowNumber || idx + 2;
      const rawLeadName = (row.leadName || row.companyName || row.contactPerson || '').trim();

      // Rule 3: Minimum Lead Information (Required: Lead Name)
      if (!rawLeadName) {
        failedRows++;
        failedItems.push({
          rowNumber,
          leadName: 'Unknown',
          reason: row.validationError || 'Missing Lead Name or identifying name.',
        });
        return;
      }

      if (row.isValid === false) {
        failedRows++;
        failedItems.push({
          rowNumber,
          leadName: rawLeadName,
          reason: row.validationError || 'Invalid lead row data.',
        });
        return;
      }

      const isDup = Boolean(row.isDuplicate);
      const chosenAction = row.chosenAction || (isDup ? (options.duplicateHandling || 'update') : 'create');

      if (isDup) {
        duplicateLeads++;
      }

      if (isDup && chosenAction === 'skip') {
        // Skip duplicate lead
        return;
      }

      if (isDup && (chosenAction === 'update') && row.matchedExistingLead) {
        // Rule 13: If an Excel cell is empty, do NOT overwrite existing CRM value with empty data!
        const existing: Lead = row.matchedExistingLead;
        const updates: Partial<Lead> = {};

        if (row.leadName?.trim()) updates.leadName = row.leadName.trim();
        if (row.companyName?.trim()) updates.companyName = row.companyName.trim();
        if (row.contactPerson?.trim()) updates.contactPerson = row.contactPerson.trim();
        if (row.mobile?.trim()) updates.mobile = row.mobile.trim();
        if (row.alternateMobile?.trim()) updates.alternateMobile = row.alternateMobile.trim();
        if (row.email?.trim()) updates.email = row.email.trim();
        if (row.address?.trim()) updates.address = row.address.trim();
        if (row.city?.trim()) updates.city = row.city.trim();
        if (row.state?.trim()) updates.state = row.state.trim();
        if (row.pincode?.trim()) updates.pincode = row.pincode.trim();
        if (row.gstin?.trim()) updates.gstin = row.gstin.trim();
        if (row.industry?.trim()) updates.industry = row.industry.trim();
        if (row.source?.trim()) updates.source = row.source.trim() as LeadSource;
        if (row.salesperson?.trim()) {
          updates.salesperson = row.salesperson.trim();
          updates.assignedUser = row.salesperson.trim();
        }
        if (row.website?.trim()) updates.website = row.website.trim();
        if (row.requirement?.trim()) {
          updates.requirement = row.requirement.trim();
          if (!existing.interestedProductName) {
            updates.interestedProductName = row.requirement.trim();
          }
        }
        if (row.notes?.trim()) {
          updates.notes = existing.notes ? `${existing.notes} | ${row.notes.trim()}` : row.notes.trim();
        }
        if (row.expectedValue && Number(row.expectedValue) > 0) {
          updates.expectedValue = Number(row.expectedValue);
        }
        if (row.status) {
          updates.status = row.status as LeadStatus;
        }

        leadsToUpdate.push({ id: existing.id, updates });
        updatedLeads++;
      } else {
        // Create as new lead
        const year = new Date().getFullYear();
        const randNum = Math.floor(1000 + Math.random() * 9000);
        const leadNumber = `LD-${year}-${randNum}`;
        const newId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        const newLead: Lead = {
          id: newId,
          leadNumber,
          leadName: rawLeadName,
          companyName: (row.companyName || '').trim(),
          contactPerson: (row.contactPerson || '').trim(),
          mobile: (row.mobile || '').trim(),
          alternateMobile: (row.alternateMobile || '').trim(),
          email: (row.email || '').trim(),
          address: (row.address || '').trim(),
          city: (row.city || '').trim(),
          state: (row.state || '').trim(),
          pincode: (row.pincode || '').trim(),
          gstin: (row.gstin || '').trim(),
          industry: (row.industry || '').trim(),
          source: (row.source || 'Website') as LeadSource,
          salesperson: (row.salesperson || options.importedBy || 'Sales Person').trim(),
          website: (row.website || '').trim(),
          requirement: (row.requirement || '').trim(),
          interestedProductId: '',
          interestedProductName: (row.requirement || 'General Product').trim(),
          expectedValue: parseFloat(row.expectedValue) || 0,
          assignedUser: (row.salesperson || options.importedBy || 'Sales Person').trim(),
          status: (row.status as LeadStatus) || 'New',
          notes: (row.notes || '').trim(),
          importId,
          createdAt: new Date().toISOString().split('T')[0],
        };

        leadsToAdd.push(newLead);
        newLeads++;
      }
    });

    if (leadsToUpdate.length > 0) {
      setLeads((prev) => {
        const updateMap = new Map(leadsToUpdate.map((u) => [u.id, u.updates]));
        return prev.map((l) => {
          const up = updateMap.get(l.id);
          return up ? { ...l, ...up } : l;
        });
      });

      leadsToUpdate.forEach(({ id, updates }) => {
        fetch('/api/leads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates }),
        }).catch((err) => console.warn('Sync lead update error:', err));
      });
    }

    if (leadsToAdd.length > 0) {
      setLeads((prev) => [...leadsToAdd, ...prev]);

      leadsToAdd.forEach((newLead) => {
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLead),
        }).catch((err) => console.warn('Sync lead create error:', err));
      });
    }

    // Auto-trigger Follow-ups and Customer/Quotation automation for imported leads
    leadsToAdd.forEach((l) => {
      if (l.status && l.status !== 'New') {
        handleLeadStatusAutomation(l, l.status);
      }
    });

    leadsToUpdate.forEach(({ id, updates }) => {
      if (updates.status && updates.status !== 'New') {
        const found = leads.find((l) => l.id === id);
        if (found) {
          handleLeadStatusAutomation({ ...found, ...updates }, updates.status);
        }
      }
    });

    const importRecord: LeadImportHistory = {
      id: importId,
      fileName: options.fileName,
      importedBy: options.importedBy || 'Sales Person',
      importDate: new Date().toISOString(),
      totalRows: rows.length,
      newLeads,
      updatedLeads,
      duplicateLeads,
      failedRows,
      status: failedRows === rows.length && rows.length > 0 ? 'Failed' : failedRows > 0 ? 'Partial' : 'Success',
      createdAt: new Date().toISOString(),
    };

    setLeadImportHistories((prev) => [importRecord, ...prev]);

    fetch('/api/leads/import-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importRecord),
    }).catch((err) => console.warn('Sync import history error:', err));

    return {
      success: true,
      totalRows: rows.length,
      newLeads,
      updatedLeads,
      duplicateLeads,
      failedRows,
      failedItems,
      importRecord,
    };
  };

  const createFollowUpFull = (followUp: Omit<FollowUp, 'id' | 'followUpNumber' | 'createdAt'>) => {
    const year = new Date().getFullYear();
    const followUpNumber = `FL-${year}-${Math.floor(100 + Math.random() * 900)}`;
    const newId = `fol-${Date.now().toString().slice(-4)}`;
    const newFollowUp: FollowUp = {
      ...followUp,
      id: newId,
      followUpNumber,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setFollowUps((prev) => [newFollowUp, ...prev]);

    // Update Next Follow Up date on target Lead or Customer
    if (followUp.type === 'Lead') {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === followUp.leadOrCustomerId ? { ...l, nextFollowUpDate: followUp.followUpDate } : l
        )
      );
    } else {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === followUp.leadOrCustomerId ? { ...c, nextFollowUpDate: followUp.followUpDate } : c
        )
      );
    }

    return { success: true };
  };

  const updateFollowUpStatusFull = (id: string, status: FollowUp['status']) => {
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
    return { success: true };
  };

  // --- QUOTATION WORKFLOW ACTIONS ---
  const createQuotation = (quotation: Omit<Quotation, 'id'>) => {
    const quotationNumber = quotation.quotationNumber || generateEntityCode('QUOTATION');
    const newId = `qt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newQuotation: Quotation = {
      ...quotation,
      id: newId,
      quotationNumber,
      createdAt: now,
      updatedAt: now,
    };

    setQuotations((prev) => [newQuotation, ...prev]);

    fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQuotation),
    }).catch((err) => console.warn('Failed to sync Quotation to DB:', err));

    return { success: true, data: newQuotation, message: `Quotation ${quotationNumber} created successfully.` };
  };

  const updateQuotationStatus = (id: string, status: QuotationStatus) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let linkedSOId: string | undefined;
    let quoteNum = '';

    setQuotations((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          linkedSOId = q.salesOrderId;
          quoteNum = q.quotationNumber;
          return { ...q, status, updatedAt: new Date().toISOString() };
        }
        return q;
      })
    );

    // If quotation is linked to a sales order, update its statusHistory
    if (linkedSOId) {
      setSalesOrders((prev) =>
        prev.map((so) => {
          if (so.id === linkedSOId || so.orderNumber === linkedSOId) {
            let remarks = `Quotation ${quoteNum} status updated to "${status}".`;
            if (status === 'Approved') remarks = `Quotation ${quoteNum} confirmed & approved by client. Ready for Production.`;
            else if (status === 'Sent to Client') remarks = `Quotation ${quoteNum} sent to client for review.`;
            else if (status === 'Rejected') remarks = `Quotation ${quoteNum} rejected by client.`;
            else if (status === 'Expired') remarks = `Quotation ${quoteNum} has expired.`;

            const hist: OrderStatusHistoryItem = {
              status: status === 'Approved' ? 'Confirmed' : so.orderStatus,
              updatedBy: activeRole || 'Sales Person',
              timestamp,
              remarks,
            };

            return {
              ...so,
              statusHistory: [...(so.statusHistory || []), hist],
            };
          }
          return so;
        })
      );
    }

    fetch('/api/quotations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    }).catch((err) => console.warn('Failed to sync Quotation status to DB:', err));

    return { success: true, message: `Quotation status updated to "${status}".` };
  };

  const updateQuotation = (id: string, data: Partial<Quotation>) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...data, updatedAt: new Date().toISOString() } : q))
    );

    fetch('/api/quotations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    }).catch((err) => console.warn('Failed to sync Quotation to DB:', err));

    return { success: true, message: 'Quotation updated successfully.' };
  };

  const deleteQuotation = (id: string) => {
    setQuotations((prev) => prev.filter((q) => q.id !== id));
    fetch(`/api/quotations?id=${id}`, { method: 'DELETE' }).catch((err) =>
      console.warn('Failed to delete Quotation from DB:', err)
    );
    return { success: true, message: 'Quotation deleted successfully.' };
  };

  const createQuotationFromSalesOrder = (
    salesOrderId: string,
    warrantyPeriod = '1 Year',
    initialStatus: QuotationStatus = 'Draft'
  ) => {
    const so = salesOrders.find((s) => s.id === salesOrderId || s.orderNumber === salesOrderId);
    if (!so) {
      return { success: false, message: 'Sales Order not found' };
    }

    const quotationNumber = generateEntityCode('QUOTATION');
    const newId = `qt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const validD = new Date();
    validD.setDate(validD.getDate() + 30);
    const validUntil = validD.toISOString().split('T')[0];

    const qItems: QuotationItem[] = so.items.map((i, idx) => ({
      id: `qti_${Date.now()}_${idx}`,
      itemType: (i.itemType as any) || 'PRODUCT',
      productId: i.productId,
      productName: i.productName,
      sku: i.sku,
      unit: i.unit || 'PCS',
      quantity: i.quantity,
      rate: i.unitPrice || i.sellingPrice || 0,
      discount: i.discount || 0,
      gstPercent: i.gstPercent || 18,
      totalAmount: i.totalPrice,
      warrantyPeriod: i.warrantyPeriod || warrantyPeriod || '1 Year',
    }));

    const newQuotation: Quotation = {
      id: newId,
      quotationNumber,
      customerId: so.customerId,
      customerName: so.customerName,
      quotationDate: today,
      validUntil: so.dueDate || validUntil,
      status: initialStatus,
      items: qItems,
      subtotal: so.subtotal,
      discountAmount: so.discountAmount,
      taxAmount: so.taxAmount,
      totalAmount: so.totalAmount || so.grandTotal,
      warrantyPeriod: warrantyPeriod || '1 Year',
      paymentMode: so.paymentMode || 'Prepaid',
      termsAndConditions: `1. Prices are valid for 30 days from date of issue.\n2. Payment terms: Net 30 days from invoice date.\n3. Standard ${warrantyPeriod || '1 Year'} Warranty against manufacturing defects.\n4. Replacement is given only when serial number is present on cable.\n5. Freight charges extra as applicable.`,
      notes: so.notes || 'Replacement is given only when serial number is present on the cable',
      salesperson: so.salesperson || (activeRole === 'ADMIN' ? 'Administrator' : 'Sales Person'),
      salesOrderId: so.id,
      orderNumber: so.orderNumber,
      createdAt: now,
      updatedAt: now,
    };

    setQuotations((prev) => [newQuotation, ...prev]);

    // Link quotation to sales order and add history
    const historyEntry: OrderStatusHistoryItem = {
      status: so.orderStatus,
      updatedBy: activeRole || 'Sales Person',
      timestamp: now.replace('T', ' ').slice(0, 19),
      remarks: `Quotation ${quotationNumber} generated from this Sales Order.`,
    };

    setSalesOrders((prev) =>
      prev.map((s) =>
        s.id === so.id
          ? {
              ...s,
              quotationId: newId,
              quotationNumber,
              statusHistory: [...(s.statusHistory || []), historyEntry],
            }
          : s
      )
    );

    // Sync to DB
    fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQuotation),
    }).catch((err) => console.warn('Failed to sync Quotation to DB:', err));

    fetch('/api/sales-orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: so.id,
        quotationId: newId,
        quotationNumber,
      }),
    }).catch((err) => console.warn('Failed to link Sales Order in DB:', err));

    return {
      success: true,
      data: newQuotation,
      message: `Quotation ${quotationNumber} created from Sales Order ${so.orderNumber}.`,
    };
  };

  const createInvoiceFromQuotation = (quotationId: string) => {
    const quotation = quotations.find((q) => q.id === quotationId);
    if (!quotation) {
      return { success: false, message: 'Quotation not found.' };
    }

    const isApproved =
      quotation.status === 'Customer Approved' ||
      quotation.status === 'Approved' ||
      quotation.status === 'Confirmed';

    if (!isApproved) {
      return {
        success: false,
        message: `Cannot generate invoice. Quotation status is "${quotation.status}". Invoice can only be generated after Customer Approval.`,
      };
    }

    // Check if invoice already exists
    const existingInv = invoices.find(
      (inv) => inv.quotationId === quotation.id || (inv.quotationNumber && inv.quotationNumber === quotation.quotationNumber)
    );
    if (existingInv) {
      return {
        success: true,
        message: `Invoice ${existingInv.invoiceNumber} already exists for this quotation.`,
        invoiceId: existingInv.id,
      };
    }

    const invoiceNumber = generateEntityCode('INVOICE');
    const newInvoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const today = new Date().toISOString().split('T')[0];
    const cust = customers.find(
      (c) => c.id === quotation.customerId || c.customerNumber === quotation.customerNumber || c.customerCode === quotation.customerNumber
    );

    const invoiceItems = quotation.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      rate: item.rate,
      discount: item.discount || 0,
      gstPercent: item.gstPercent || 18,
      subtotal: item.subtotal || Math.round(item.quantity * item.rate),
      total: item.totalAmount,
    }));

    const newInvoice: SalesInvoice = {
      id: newInvoiceId,
      invoiceNumber,
      invoiceDate: today,
      salesOrderId: '',
      salesOrderNumber: '',
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      customerNumber: quotation.customerNumber || cust?.customerNumber || cust?.customerCode || 'CUS-101',
      gstNumber: cust?.gstin || cust?.gstNumber || '',
      items: invoiceItems,
      subtotal: quotation.subtotal,
      discountAmount: quotation.discountAmount,
      gstAmount: quotation.taxAmount,
      grandTotal: quotation.totalAmount,
      paidAmount: 0,
      outstandingAmount: quotation.totalAmount,
      paymentStatus: 'Payment Pending',
      invoiceStatus: 'Generated',
      productionStatus: undefined,
      status: 'Active',
      termsAndConditions: quotation.termsAndConditions || 'Payment due upon invoice delivery.',
      notes: quotation.notes,
      warrantyPeriod: quotation.warrantyPeriod || '1 Year',
      paymentMode: quotation.paymentMode || 'Prepaid',
      createdBy: activeRole === 'ADMIN' ? 'Admin' : 'Sales Person',
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    recordEntityCodeCreated('INVOICE', invoiceNumber);

    // Update Quotation status to 'Invoice Generated'
    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quotation.id
          ? {
              ...q,
              status: 'Invoice Generated' as QuotationStatus,
              invoiceId: newInvoiceId,
              invoiceNumber,
              updatedAt: new Date().toISOString(),
            }
          : q
      )
    );

    // Persist to DB
    fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInvoice),
    }).catch((err) => console.warn('Failed to sync Invoice to DB:', err));

    fetch('/api/quotations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: quotation.id,
        status: 'Invoice Generated',
        invoiceId: newInvoiceId,
        invoiceNumber,
      }),
    }).catch((err) => console.warn('Failed to sync Quotation to DB:', err));

    return {
      success: true,
      message: `Invoice ${invoiceNumber} created from Customer Approved Quotation ${quotation.quotationNumber}.`,
      invoiceId: newInvoiceId,
    };
  };

  const sendInvoiceToProduction = (invoiceId: string, senderName?: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) {
      return { success: false, message: 'Invoice not found.' };
    }

    // BUSINESS RULE:
    // "Send Invoice to Production" is available when payment proof is uploaded, verified, completed, or order is COD.
    const isEligibleForProduction =
      invoice.paymentMode === 'COD' ||
      invoice.paymentStatus === 'Payment Proof Uploaded' ||
      invoice.paymentStatus === 'Payment Verified' ||
      invoice.paymentStatus === 'Payment Completed' ||
      invoice.invoiceStatus === 'Payment Completed' ||
      (Array.isArray(invoice.paymentProofFiles) && invoice.paymentProofFiles.length > 0);

    if (!isEligibleForProduction) {
      return {
        success: false,
        message: `Production locked: "Send Invoice to Production" requires payment proof to be uploaded first, payment completed, or COD payment mode. Current payment status: "${invoice.paymentStatus || 'Payment Pending'}".`,
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const existingSO = salesOrders.find(
      (so) =>
        so.invoiceId === invoice.id ||
        (invoice.salesOrderId && so.id === invoice.salesOrderId) ||
        (so.orderNumber && so.orderNumber === invoice.salesOrderNumber) ||
        (invoice.quotationId && so.quotationId === invoice.quotationId)
    );

    let targetSalesOrder: SalesOrder;

    // Safely extract items from invoice, linked quotation, linked SO, or default product fallback
    const linkedQuote = quotations.find(
      (q) => q.id === invoice.quotationId || (invoice.quotationNumber && q.quotationNumber === invoice.quotationNumber)
    );
    const linkedSoForItems = existingSO || salesOrders.find(
      (so) => so.id === invoice.salesOrderId || (invoice.salesOrderNumber && so.orderNumber === invoice.salesOrderNumber)
    );

    let rawItems: any[] = [];
    if (Array.isArray(invoice.items) && invoice.items.length > 0) {
      rawItems = invoice.items;
    } else if (linkedQuote?.items && Array.isArray(linkedQuote.items) && linkedQuote.items.length > 0) {
      rawItems = linkedQuote.items.map((qi: any) => ({
        productId: qi.productId || 'PROD-AUTO',
        productName: qi.productName || qi.description || 'Finished Product',
        sku: qi.sku || 'SKU-AUTO',
        quantity: qi.quantity || 1,
        rate: qi.rate || qi.unitPrice || qi.sellingPrice || 0,
        subtotal: qi.subtotal || qi.totalAmount || qi.total || 0,
        total: qi.totalAmount || qi.total || qi.subtotal || 0,
        discount: qi.discount || 0,
        gstPercent: qi.gstPercent || 18,
      }));
    } else if (linkedSoForItems?.items && Array.isArray(linkedSoForItems.items) && linkedSoForItems.items.length > 0) {
      rawItems = linkedSoForItems.items.map((soi) => ({
        productId: soi.productId || 'PROD-AUTO',
        productName: soi.productName || 'Finished Product',
        sku: soi.sku || 'SKU-AUTO',
        quantity: soi.quantity || 1,
        rate: soi.unitPrice || soi.sellingPrice || 0,
        subtotal: soi.totalPrice || 0,
        total: soi.totalPrice || 0,
        discount: soi.discount || 0,
        gstPercent: soi.gstPercent || 18,
      }));
    } else {
      const fallbackProduct = products[0];
      rawItems = [
        {
          productId: fallbackProduct?.id || 'PROD-AUTO',
          productName: fallbackProduct?.name || `Order for ${invoice.customerName}`,
          sku: fallbackProduct?.sku || 'SKU-AUTO',
          quantity: 1,
          rate: invoice.grandTotal || 0,
          subtotal: invoice.subtotal || invoice.grandTotal || 0,
          total: invoice.grandTotal || 0,
          discount: invoice.discountAmount || 0,
          gstPercent: 18,
        },
      ];
    }

    if (existingSO) {
      targetSalesOrder = {
        ...existingSO,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        quotationId: invoice.quotationId || existingSO.quotationId,
        quotationNumber: invoice.quotationNumber || existingSO.quotationNumber,
        paymentMode: invoice.paymentMode || existingSO.paymentMode || linkedQuote?.paymentMode || 'Prepaid',
        orderStatus: 'Sent to Production',
        productionStatus: 'Sent to Production',
        packingStatus: existingSO.packingStatus || 'Pending',
        sentToProductDate: today,
        productionDate: today,
        items: existingSO.items && existingSO.items.length > 0 ? existingSO.items : rawItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          unit: 'PCS',
          quantity: item.quantity,
          unitPrice: item.rate,
          sellingPrice: item.rate,
          discount: item.discount || 0,
          gstPercent: item.gstPercent || 18,
          totalPrice: item.total || item.subtotal,
          itemType: 'PRODUCT',
          warrantyPeriod: invoice.warrantyPeriod || '1 Year',
          packingStatus: 'Pending',
        })),
        statusHistory: [
          ...(existingSO.statusHistory || []),
          {
            status: 'Sent to Production',
            updatedBy: senderName || activeRole || 'Sales Person',
            timestamp,
            remarks: `Invoice ${invoice.invoiceNumber} (${invoice.paymentStatus || 'Payment Proof Uploaded'}) sent to Production Team.`,
          },
        ],
      };

      setSalesOrders((prev) => prev.map((s) => (s.id === existingSO.id ? targetSalesOrder : s)));

      fetch('/api/sales-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existingSO.id,
          orderStatus: 'Sent to Production',
          productionStatus: 'Sent to Production',
          sentToProductDate: today,
          productionDate: today,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        }),
      }).catch((e) => console.warn('Sync SO error:', e));
    } else {
      const orderNumber = generateEntityCode('SALES_ORDER');
      const newSOId = `so_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const soItems: SalesOrderItem[] = rawItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unit: 'PCS',
        quantity: item.quantity,
        unitPrice: item.rate,
        sellingPrice: item.rate,
        discount: item.discount || 0,
        gstPercent: item.gstPercent || 18,
        totalPrice: item.total || item.subtotal,
        itemType: 'PRODUCT',
        warrantyPeriod: invoice.warrantyPeriod || '1 Year',
        packingStatus: 'Pending',
      }));

      targetSalesOrder = {
        id: newSOId,
        orderNumber,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        quotationId: invoice.quotationId,
        quotationNumber: invoice.quotationNumber,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        orderDate: today,
        dueDate: today,
        items: soItems,
        subtotal: invoice.subtotal,
        discountAmount: invoice.discountAmount,
        taxAmount: invoice.gstAmount,
        totalAmount: invoice.grandTotal,
        grandTotal: invoice.grandTotal,
        amountPaid: invoice.paidAmount,
        amountOutstanding: invoice.outstandingAmount,
        pendingAmount: invoice.outstandingAmount,
        paymentMode: invoice.paymentMode || linkedQuote?.paymentMode || 'Prepaid',
        paymentStatus: (invoice.paymentMode === 'COD' || linkedQuote?.paymentMode === 'COD') ? (invoice.paidAmount >= invoice.grandTotal ? 'PAID' : 'UNPAID') : 'PAID',
        dispatchStatus: 'PENDING',
        orderStatus: 'Sent to Production',
        productionStatus: 'Sent to Production',
        packingStatus: 'Pending',
        sentToProductDate: today,
        productionDate: today,
        salesperson: senderName || 'Sales Person',
        notes: `Created from Invoice ${invoice.invoiceNumber} (Quotation: ${invoice.quotationNumber || 'N/A'})`,
        createdBy: senderName || 'Sales Person',
        createdAt: new Date().toISOString(),
        statusHistory: [
          {
            status: invoice.paymentStatus || 'Payment Proof Uploaded',
            updatedBy: senderName || 'Sales Person',
            timestamp,
            remarks: `Payment proof uploaded / verified for Invoice ${invoice.invoiceNumber}.`,
          },
          {
            status: 'Sent to Production',
            updatedBy: senderName || 'Sales Person',
            timestamp,
            remarks: `Invoice ${invoice.invoiceNumber} sent to Production Team for manufacturing & packing.`,
          },
        ],
      };

      setSalesOrders((prev) => [targetSalesOrder, ...prev]);

      fetch('/api/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetSalesOrder),
      }).catch((e) => console.warn('Sync SO error:', e));
    }

    // Link in productionOrders list
    rawItems.forEach((item, itemIdx) => {
      const prodOrderNum = generateEntityCode('PRODUCTION');
      const newProdOrder: any = {
        id: `po_prod_${Date.now()}_${itemIdx}`,
        orderNumber: prodOrderNum,
        finishedGoodId: item.productId,
        finishedGoodName: item.productName,
        productId: item.productId,
        productName: item.productName,
        bomId: boms.find((b) => b.productId === item.productId)?.id || 'BOM-DEFAULT',
        bomVersion: 1,
        plannedQuantity: item.quantity,
        producedQuantity: 0,
        quantityToProduce: item.quantity,
        productionDate: today,
        expectedCompletion: today,
        startDate: today,
        priority: 'High',
        status: 'Sent to Production',
        assignedEngineer: 'Production Team',
        notes: `From Invoice ${invoice.invoiceNumber} (Quote: ${invoice.quotationNumber || 'N/A'}) for ${invoice.customerName}`,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        quotationId: invoice.quotationId,
        quotationNumber: invoice.quotationNumber,
        salesOrderId: targetSalesOrder.id,
        customerId: invoice.customerId,
      };
      setProductionOrders((prev) => [newProdOrder, ...prev]);
    });

    // Update Invoice status to Sent to Production
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              items: Array.isArray(inv.items) && inv.items.length > 0 ? inv.items : rawItems,
              salesOrderId: targetSalesOrder.id,
              salesOrderNumber: targetSalesOrder.orderNumber,
              productionStatus: 'Sent to Production',
            }
          : inv
      )
    );

    // Sync to API
    fetch('/api/invoices', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: invoice.id,
        salesOrderId: targetSalesOrder.id,
        salesOrderNumber: targetSalesOrder.orderNumber,
        productionStatus: 'Sent to Production',
      }),
    }).catch(() => null);

    // Also update linked Quotation status
    if (invoice.quotationId) {
      setQuotations((prev) =>
        prev.map((q) =>
          q.id === invoice.quotationId
            ? {
                ...q,
                status: 'Sent to Production',
                salesOrderId: targetSalesOrder.id,
                orderNumber: targetSalesOrder.orderNumber,
                updatedAt: new Date().toISOString(),
              }
            : q
        )
      );
      fetch('/api/quotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: invoice.quotationId,
          status: 'Sent to Production',
          salesOrderId: targetSalesOrder.id,
          orderNumber: targetSalesOrder.orderNumber,
        }),
      }).catch(() => null);
    }

    return {
      success: true,
      message: `Invoice ${invoice.invoiceNumber} successfully sent to Production!`,
      salesOrder: targetSalesOrder,
    };
  };

  const updateInvoiceStatus = (invoiceId: string, invoiceStatus: string) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, invoiceStatus } : i))
    );
    fetch('/api/invoices', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: invoiceId, invoiceStatus }),
    }).catch(() => null);
    return { success: true };
  };

  // Deprecated direct quotation to production method
  const sendQuotationToProduction = (quotationId: string, _senderName?: string) => {
    return {
      success: false,
      message:
        'Direct transfer of Quotation to Production is removed. Workflow: Customer Approved -> Generate Invoice -> Customer Payment Completed -> Send Invoice to Production.',
    };
  };

  const sendQuotationToProduct = sendQuotationToProduction;

  // --- SALES ORDER ACTIONS ---
  const createSalesOrderFull = (
    order: Omit<SalesOrder, 'id' | 'orderDate'> & { orderNumber?: string },
    allowBackorder = false
  ) => {
    // 1. Stock Check against existing Products or Raw Materials
    const insufficientItems: string[] = [];
    order.items.forEach((item) => {
      const isRawMaterial = item.itemType === 'RAW_MATERIAL' || (order.saleType === 'RAW_MATERIAL' || order.saleType === 'Raw Material');
      if (isRawMaterial) {
        const rm = rawMaterials.find((m) => m.id === item.productId || m.sku === item.sku || m.id === item.rawMaterialId);
        const avail = rm ? rm.currentStock : 0;
        if (!allowBackorder && avail < item.quantity) {
          insufficientItems.push(`${item.productName} (Available Raw Stock: ${avail} ${rm?.unit || 'Units'}, Requested: ${item.quantity})`);
        }
      } else {
        const prod = products.find((p) => p.id === item.productId || p.sku === item.sku);
        const avail = prod ? prod.currentStock : 0;
        if (!allowBackorder && avail < item.quantity) {
          insufficientItems.push(`${item.productName} (Available FG Stock: ${avail}, Requested: ${item.quantity})`);
        }
      }
    });

    if (insufficientItems.length > 0) {
      return {
        success: false,
        message: `Insufficient stock for: ${insufficientItems.join('; ')}. Backorder required.`,
      };
    }

    const orderNumber = order.orderNumber || generateEntityCode('SALES_ORDER');
    const invoiceNumber = order.invoiceNumber || generateEntityCode('INVOICE');
    const newId = `so-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];

    const grandTotal = Math.round(order.subtotal - order.discountAmount + order.taxAmount);
    const amountPaid = order.amountPaid || 0;
    const pendingAmount = Math.max(0, grandTotal - amountPaid);
    const paymentStatus = amountPaid >= grandTotal ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'UNPAID';

    const initialHistory: OrderStatusHistoryItem = {
      status: order.orderStatus || 'Confirmed',
      updatedBy: order.createdBy || 'Sales Person',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      remarks: order.orderStatus === 'Sent to Product'
        ? 'Sales Order created and sent directly to Product Management for packing.'
        : 'Sales Order recorded and confirmed by Sales Team.',
    };

    const newSO: SalesOrder = {
      ...order,
      id: newId,
      orderNumber,
      invoiceNumber,
      orderDate: today,
      grandTotal,
      totalAmount: order.subtotal,
      amountPaid,
      amountOutstanding: pendingAmount,
      pendingAmount,
      paymentMode: order.paymentMode || 'Prepaid',
      paymentStatus: order.paymentStatus || paymentStatus,
      dispatchStatus: order.dispatchStatus || 'Pending',
      orderStatus: order.orderStatus || 'Confirmed',
      sentToProductDate: (order.orderStatus === 'Sent to Product' || order.sentToProductDate) ? (order.sentToProductDate || today) : undefined,
      statusHistory: order.statusHistory || [initialHistory],
    };

    setSalesOrders((prev) => [newSO, ...prev]);
    recordEntityCodeCreated('SALES_ORDER', orderNumber);

    // Update Customer order count & outstanding
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === order.customerId
          ? {
              ...c,
              totalOrders: (c.totalOrders || 0) + 1,
              totalSales: (c.totalSales || 0) + grandTotal,
              totalPaid: (c.totalPaid || 0) + amountPaid,
              totalOutstanding: (c.totalOutstanding || 0) + pendingAmount,
              lastOrderDate: today,
            }
          : c
      )
    );

    // Automatically generate invoice from Sales Order
    const invRes = createInvoiceFromSO(newId, newSO);

    // If payment was received upfront, log customer payment record
    if (amountPaid > 0 && invRes.invoiceId) {
      const paymentNumber = generateEntityCode('PAYMENT');
      const newPayId = `cpay-${Date.now().toString().slice(-4)}`;
      const custObj = customers.find((c) => c.id === order.customerId);
      
      const newPayment: CustomerPayment = {
        id: newPayId,
        paymentNumber,
        customerId: order.customerId,
        customerName: custObj ? custObj.companyName : order.customerName,
        invoiceId: invRes.invoiceId,
        invoiceNumber: invoiceNumber,
        paymentDate: today,
        amount: amountPaid,
        paymentMode: 'Bank Transfer',
        referenceNumber: `REC-${orderNumber}`,
        notes: `Upfront sale payment for Order ${orderNumber}`,
        status: 'Completed',
        createdBy: order.createdBy || 'Sales Desk',
      };

      setCustomerPayments((prev) => [newPayment, ...prev]);
      recordEntityCodeCreated('PAYMENT', paymentNumber);
    }

    // Persist to Prisma DB API in background
    fetch('/api/sales-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSO),
    }).catch((err) => console.warn('Failed to sync sales order to DB:', err));

    return { success: true };
  };

  const updateSalesOrderStatusFull = (
    id: string,
    orderStatus?: SalesOrder['orderStatus'],
    dispatchStatus?: SalesOrder['dispatchStatus'],
    paymentStatus?: SalesOrder['paymentStatus'],
    statusRemarks?: string,
    updatedBy?: string
  ) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setSalesOrders((prev) =>
      prev.map((so) => {
        if (so.id === id) {
          const newStatus = orderStatus ?? so.orderStatus;
          const historyEntry: OrderStatusHistoryItem = {
            status: newStatus,
            updatedBy: updatedBy || activeRole || 'User',
            timestamp,
            remarks: statusRemarks,
          };
          const updatedHistory = [...(so.statusHistory || []), historyEntry];
          return {
            ...so,
            orderStatus: newStatus,
            dispatchStatus: dispatchStatus ?? so.dispatchStatus,
            paymentStatus: paymentStatus ?? so.paymentStatus,
            statusHistory: updatedHistory,
          };
        }
        return so;
      })
    );
    return { success: true };
  };

  const sendSalesOrderToProduct = (id: string, senderName?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setSalesOrders((prev) =>
      prev.map((so) => {
        if (so.id === id) {
          const historyEntry: OrderStatusHistoryItem = {
            status: 'Sent to Product',
            updatedBy: senderName || activeRole || 'Sales Person',
            timestamp,
            remarks: 'Sales Order sent to Product Management Team for order packing & processing.',
          };
          return {
            ...so,
            orderStatus: 'Sent to Product',
            sentToProductDate: today,
            statusHistory: [...(so.statusHistory || []), historyEntry],
          };
        }
        return so;
      })
    );

    // Sync to database
    fetch('/api/sales-orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        orderStatus: 'Sent to Product',
      }),
    }).catch((err) => console.warn('Failed to sync Sent to Product status to DB:', err));

    return { success: true, message: 'Sales Order sent to Product Team successfully.' };
  };

  const updateSalesOrderProcessing = (
    id: string,
    data: {
      orderStatus?: SalesOrder['orderStatus'];
      productionStatus?: string;
      packingStatus?: string;
      productionNotes?: string;
      packingNotes?: string;
      productionDate?: string;
      packingDate?: string;
      productionImages?: string[];
      productTeamRemarks?: string;
      packedImage?: string;
      serialNumber?: string;
      batchNumber?: string;
      items?: SalesOrderItem[];
      updatedBy?: string;
      rawMaterialsDeducted?: boolean;
      rawMaterialsUsed?: any[];
    }
  ) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const today = new Date().toISOString().split('T')[0];

    // Normalize images array
    let images: string[] = data.productionImages ? [...data.productionImages] : [];
    if (data.packedImage && !images.includes(data.packedImage)) {
      images = [data.packedImage, ...images];
    }
    const primaryPackedImage = images[0] || data.packedImage || '';

    setSalesOrders((prev) =>
      prev.map((so) => {
        if (so.id === id || so.orderNumber === id) {
          const newOrderStatus = data.orderStatus ?? so.orderStatus;
          const newProdStatus = data.productionStatus ?? so.productionStatus ?? (data.orderStatus as string);
          const newPackStatus = data.packingStatus ?? so.packingStatus;

          const mergedImages = Array.from(new Set([...(images.length > 0 ? images : so.productionImages || [])]));

          const historyEntry: OrderStatusHistoryItem = {
            status: newOrderStatus,
            updatedBy: data.updatedBy || 'Production Team',
            timestamp,
            remarks:
              data.productTeamRemarks ||
              data.productionNotes ||
              data.packingNotes ||
              `Production & Packing status updated to "${newProdStatus || newOrderStatus}"`,
          };

          return {
            ...so,
            orderStatus: newOrderStatus,
            productionStatus: newProdStatus,
            packingStatus: newPackStatus,
            productionNotes: data.productionNotes !== undefined ? data.productionNotes : so.productionNotes,
            packingNotes: data.packingNotes !== undefined ? data.packingNotes : so.packingNotes,
            productionDate: data.productionDate !== undefined ? data.productionDate : (so.productionDate || today),
            packingDate: data.packingDate !== undefined ? data.packingDate : (newPackStatus === 'Packed' ? today : so.packingDate),
            productionImages: mergedImages,
            productTeamRemarks: data.productTeamRemarks !== undefined ? data.productTeamRemarks : so.productTeamRemarks,
            packedImage: primaryPackedImage || so.packedImage,
            serialNumber: data.serialNumber !== undefined ? data.serialNumber : so.serialNumber,
            batchNumber: data.batchNumber !== undefined ? data.batchNumber : so.batchNumber,
            rawMaterialsDeducted: data.rawMaterialsDeducted !== undefined ? data.rawMaterialsDeducted : so.rawMaterialsDeducted,
            rawMaterialsUsed: data.rawMaterialsUsed !== undefined ? data.rawMaterialsUsed : so.rawMaterialsUsed,
            items: data.items !== undefined ? data.items : so.items,
            statusHistory: [...(so.statusHistory || []), historyEntry],
          };
        }
        return so;
      })
    );

    // Sync to database
    fetch('/api/sales-orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        orderStatus: data.orderStatus,
        productionStatus: data.productionStatus,
        packingStatus: data.packingStatus,
        productionNotes: data.productionNotes,
        packingNotes: data.packingNotes,
        productionDate: data.productionDate,
        packingDate: data.packingDate,
        productionImages: images,
        dispatchStatus: data.orderStatus === 'Ready for Dispatch' ? 'Ready to Dispatch' : undefined,
        packedImage: primaryPackedImage,
        productTeamRemarks: data.productTeamRemarks,
        batchNumber: data.batchNumber,
        serialNumber: data.serialNumber,
        rawMaterialsDeducted: data.rawMaterialsDeducted,
        rawMaterialsUsed: data.rawMaterialsUsed,
      }),
    }).catch((err) => console.warn('Failed to sync updated order processing to DB:', err));

    // Sync linked quotation status
    const effectiveQuoteStatus = (data.orderStatus || data.productionStatus) as QuotationStatus;
    if (effectiveQuoteStatus) {
      setQuotations((prevQ) =>
        prevQ.map((q) =>
          q.salesOrderId === id || (salesOrders.find((so) => so.id === id)?.quotationId === q.id)
            ? { ...q, status: effectiveQuoteStatus, updatedAt: new Date().toISOString() }
            : q
        )
      );

      fetch('/api/quotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesOrderId: id,
          status: effectiveQuoteStatus,
        }),
      }).catch(() => null);
    }

    // Sync linked invoice details and packing images
    setInvoices((prevInv) =>
      prevInv.map((inv) => {
        const matchesSO =
          inv.salesOrderId === id ||
          inv.salesOrderNumber === id ||
          salesOrders.find((so) => so.id === id)?.invoiceId === inv.id;
        if (matchesSO) {
          const mergedPacked = Array.from(new Set([...(images.length > 0 ? images : inv.packedImages || [])]));
          return {
            ...inv,
            productionStatus: data.productionStatus || data.orderStatus || inv.productionStatus,
            packingNotes: data.packingNotes !== undefined ? data.packingNotes : inv.packingNotes,
            productionNotes: data.productionNotes !== undefined ? data.productionNotes : inv.productionNotes,
            packedImages: mergedPacked,
            serialNumber: data.serialNumber !== undefined ? data.serialNumber : inv.serialNumber,
            batchNumber: data.batchNumber !== undefined ? data.batchNumber : inv.batchNumber,
          };
        }
        return inv;
      })
    );

    // Sync to DB invoice
    const linkedInvoice = invoices.find(
      (inv) =>
        inv.salesOrderId === id ||
        inv.salesOrderNumber === id ||
        salesOrders.find((so) => so.id === id)?.invoiceId === inv.id
    );
    if (linkedInvoice) {
      fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: linkedInvoice.id,
          productionStatus: data.productionStatus || data.orderStatus,
          packingNotes: data.packingNotes,
          productionNotes: data.productionNotes,
          packedImages: images,
          batchNumber: data.batchNumber,
          serialNumber: data.serialNumber,
        }),
      }).catch(() => null);
    }

    return { success: true, message: 'Production & packing details updated and live synced to Sales.' };
  };

  // Deduct Raw Material components when order enters or completes production
  const deductRawMaterialsForOrder = async (
    orderId: string,
    orderNumber: string,
    items: Array<{ productId: string; productName: string; quantity: number }>
  ): Promise<{
    success: boolean;
    deductedList: Array<{
      id: string;
      name: string;
      sku: string;
      unit: string;
      deducted: number;
      previousStock: number;
      updatedStock: number;
    }>;
    message?: string;
  }> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const deductionsMap: Record<string, { rawMaterialId: string; rawMaterialName: string; sku?: string; unit?: string; quantity: number }> = {};

      for (const item of items) {
        const prod = products.find(
          (p) => p.id === item.productId || p.sku === (item as any).sku || p.name.toLowerCase() === item.productName.toLowerCase()
        );
        const orderQty = Number(item.quantity) || 1;

        // 1. Check ProductMaster.rawMaterialQuantities
        let components: any[] = [];
        if (prod?.rawMaterialQuantities && Array.isArray(prod.rawMaterialQuantities) && prod.rawMaterialQuantities.length > 0) {
          components = prod.rawMaterialQuantities;
        } else {
          // 2. Check BOM
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
            components = bom.items.map((bi) => ({
              rawMaterialId: bi.rawMaterialId,
              rawMaterialName: bi.rawMaterialName,
              sku: bi.sku,
              unit: bi.unit,
              quantityUsed: bi.quantity,
            }));
          }
        }

        // Fallback: If no components configured yet, use primary connector/wire from available inventory
        if (components.length === 0 && rawMaterials.length > 0) {
          const matchingRm =
            rawMaterials.find(
              (r) =>
                r.category.toLowerCase().includes('wire') ||
                r.category.toLowerCase().includes('connector')
            ) || rawMaterials[0];
          if (matchingRm) {
            components.push({
              rawMaterialId: matchingRm.id,
              rawMaterialName: matchingRm.name,
              sku: matchingRm.sku,
              unit: matchingRm.unit,
              quantityUsed: 1,
            });
          }
        }

        if (components.length > 0) {
          components.forEach((c) => {
            const qtyPerUnit = Number(c.quantityUsed || c.quantity || 1);
            const totalForThis = qtyPerUnit * orderQty;
            const liveRm = rawMaterials.find(
              (r) =>
                r.id === c.rawMaterialId ||
                (c.sku && r.sku.toLowerCase() === c.sku.toLowerCase()) ||
                (c.rawMaterialName && r.name.toLowerCase().trim() === c.rawMaterialName.toLowerCase().trim())
            );
            const rmId = liveRm?.id || c.rawMaterialId || c.id;
            const rmName = liveRm?.name || c.rawMaterialName || c.name || '';
            const rmSku = liveRm?.sku || c.sku || 'RM-SKU';
            const rmUnit = liveRm?.unit || c.unit || 'PCS';

            if (deductionsMap[rmId]) {
              deductionsMap[rmId].quantity += totalForThis;
            } else {
              deductionsMap[rmId] = {
                rawMaterialId: rmId,
                rawMaterialName: rmName,
                sku: rmSku,
                unit: rmUnit,
                quantity: totalForThis,
              };
            }
          });
        }
      }

      const deductionsList = Object.values(deductionsMap);
      if (deductionsList.length === 0) {
        return { success: true, deductedList: [], message: 'No raw material components configured for these products.' };
      }

      const res = await fetch('/api/raw-materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deductions: deductionsList }),
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const results = data.data;

        // Update local raw materials state
        setRawMaterials((prev) =>
          prev.map((rm) => {
            const found = results.find((r: any) => r.id === rm.id || r.sku === rm.sku);
            return found ? { ...rm, currentStock: found.updatedStock } : rm;
          })
        );

        // Record stock transactions and material consumptions
        results.forEach((r: any) => {
          const tx: RawMaterialStockTransaction = {
            id: `tx-${Date.now().toString().slice(-5)}-order-${r.id}`,
            materialId: r.id,
            materialName: r.name,
            date: today,
            transactionType: 'Material Consumption',
            reference: orderNumber,
            quantityIn: 0,
            quantityOut: r.deducted,
            previousBalance: r.previousStock,
            newBalance: r.updatedStock,
            user: activeRole === 'ADMIN' ? 'Admin' : 'Production Team',
          };
          setStockTransactions((st) => [tx, ...st]);

          const mc: MaterialConsumption = {
            id: `cons-${Date.now().toString().slice(-4)}-${r.id}`,
            consumptionId: `MC-${orderNumber}-${r.sku || r.id.slice(-4)}`,
            productionOrderId: orderNumber,
            rawMaterialId: r.id,
            rawMaterialName: r.name,
            sku: r.sku,
            quantity: r.deducted,
            unit: r.unit,
            date: today,
            user: activeRole === 'ADMIN' ? 'Admin' : 'Production Team',
            notes: `Auto-deducted for Production Order ${orderNumber}`,
          };
          setMaterialConsumptions((prev) => [mc, ...prev]);
        });

        // Mark sales order as rawMaterialsDeducted
        setSalesOrders((prev) =>
          prev.map((so) =>
            so.id === orderId || so.orderNumber === orderNumber
              ? { ...so, rawMaterialsDeducted: true, rawMaterialsUsed: results }
              : so
          )
        );

        fetch('/api/sales-orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: orderId,
            orderNumber,
            rawMaterialsDeducted: true,
            rawMaterialsUsed: results,
          }),
        }).catch(console.warn);

        refreshRawMaterialsFromDB();
        return { success: true, deductedList: results };
      }

      return { success: false, deductedList: [], message: data.message || 'Failed to deduct raw materials.' };
    } catch (err: any) {
      console.error('deductRawMaterialsForOrder error:', err);
      return { success: false, deductedList: [], message: err.message };
    }
  };

  // --- INVOICE ACTIONS ---
  const createInvoiceFromSO = (soId: string, existingSO?: SalesOrder) => {
    const targetSO = existingSO || salesOrders.find((s) => s.id === soId);
    if (!targetSO) return { success: false, message: 'Sales order not found.' };

    const invoiceNumber = targetSO.invoiceNumber || generateEntityCode('INVOICE');
    const newId = `inv-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];

    const cust = customers.find((c) => c.id === targetSO.customerId);

    const invoiceItems = targetSO.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      sku: i.sku,
      quantity: i.quantity,
      rate: i.unitPrice || i.sellingPrice || 0,
      discount: i.discount || 0,
      gstPercent: i.gstPercent || 18,
      subtotal: i.totalPrice,
      total: Math.round(i.totalPrice * (1 + (i.gstPercent || 18) / 100)),
    }));

    const newInvoice: SalesInvoice = {
      id: newId,
      invoiceNumber,
      invoiceDate: today,
      salesOrderId: targetSO.id,
      salesOrderNumber: targetSO.orderNumber,
      customerId: targetSO.customerId,
      customerName: targetSO.customerName,
      gstNumber: cust?.gstNumber,
      items: invoiceItems,
      subtotal: targetSO.subtotal,
      discountAmount: targetSO.discountAmount,
      gstAmount: targetSO.taxAmount || targetSO.gstAmount || 0,
      grandTotal: targetSO.grandTotal,
      paidAmount: targetSO.amountPaid || 0,
      outstandingAmount: targetSO.grandTotal - (targetSO.amountPaid || 0),
      paymentStatus: targetSO.amountPaid >= targetSO.grandTotal ? 'Paid' : targetSO.amountPaid > 0 ? 'Partially Paid' : 'Unpaid',
      status: 'Active',
      termsAndConditions: 'Payment due within 15 days of invoice issue.',
      createdBy: activeRole === 'ADMIN' ? 'Admin' : 'Sales Desk',
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    recordEntityCodeCreated('INVOICE', invoiceNumber);
    return { success: true, invoiceId: newId };
  };

  // --- DISPATCH ACTIONS ---
  const createDispatchFull = (dispatch: Omit<SalesDispatch, 'id' | 'dispatchNumber'>) => {
    const dispatchNumber = (dispatch as any).dispatchNumber || generateEntityCode('DISPATCH');
    const newId = `dsp-${Date.now().toString().slice(-4)}`;
    const today = dispatch.dispatchDate || new Date().toISOString().split('T')[0];

    const newDispatch: SalesDispatch = {
      ...dispatch,
      id: newId,
      dispatchNumber,
      deliveryStatus: dispatch.deliveryStatus || 'Dispatched',
    };

    setDispatches((prev) => [newDispatch, ...prev]);
    recordEntityCodeCreated('DISPATCH', dispatchNumber);

    // Find related sales order to check saleType if needed
    const relatedSO = salesOrders.find((s) => s.id === dispatch.salesOrderId);

    // STOCK FLOW RULE ON DISPATCH CONFIRMATION:
    // For Finished Products:
    // 1. Decrease ProductMaster & FinishedGood current stock
    // 2. Log Finished Goods Stock Transaction (SALE_DISPATCH / Sale)
    // For Raw Materials:
    // 1. Decrease RawMaterial current stock
    // 2. Log Raw Material Stock Transaction (RAW_MATERIAL_SALE)
    // 3. Persist DB update via /api/raw-materials PUT
    dispatch.items.forEach((item) => {
      if (item.dispatchQuantity > 0) {
        const isRawMaterial =
          item.itemType === 'RAW_MATERIAL' ||
          Boolean(item.rawMaterialId) ||
          relatedSO?.saleType === 'RAW_MATERIAL' ||
          relatedSO?.saleType === 'Raw Material' ||
          rawMaterials.some((m) => m.id === item.productId || m.sku === item.sku);

        if (isRawMaterial) {
          // Reduce Raw Material Stock
          setRawMaterials((prev) =>
            prev.map((m) => {
              if (m.id === item.productId || m.sku === item.sku || m.id === item.rawMaterialId) {
                const prevBal = m.currentStock;
                const newBal = Math.max(0, prevBal - item.dispatchQuantity);

                // Log Raw Material Stock Transaction
                const rmtx: RawMaterialStockTransaction = {
                  id: `rmtx-${Date.now().toString().slice(-5)}-${m.id}`,
                  materialId: m.id,
                  materialName: m.name,
                  date: today,
                  transactionType: 'RAW_MATERIAL_SALE',
                  reference: `${dispatchNumber} (SO: ${dispatch.salesOrderNumber})`,
                  quantityIn: 0,
                  quantityOut: item.dispatchQuantity,
                  previousBalance: prevBal,
                  newBalance: newBal,
                  user: dispatch.createdBy || 'Sales Dispatch',
                };
                setStockTransactions((st) => [rmtx, ...st]);

                // Persist new stock to database
                fetch('/api/raw-materials', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: m.id, currentStock: newBal }),
                }).catch((err) => console.warn('Failed to sync updated RM stock:', err));

                return { ...m, currentStock: newBal };
              }
              return m;
            })
          );
        } else {
          // Reduce Finished Goods & Product Master Stock
          setFinishedGoods((prev) =>
            prev.map((fg) => {
              if (fg.id === item.productId || fg.sku === item.sku) {
                return { ...fg, currentStock: Math.max(0, fg.currentStock - item.dispatchQuantity) };
              }
              return fg;
            })
          );
          setProducts((prev) =>
            prev.map((p) => {
              if (p.id === item.productId || p.sku === item.sku) {
                const prevBal = p.currentStock;
                const newBal = Math.max(0, prevBal - item.dispatchQuantity);

                // Log Finished Goods Stock Transaction
                const fgtx: FinishedGoodsStockTransaction = {
                  id: `fgtx-${Date.now().toString().slice(-5)}-${p.id}`,
                  productId: p.id,
                  productName: p.name,
                  date: today,
                  transactionType: 'Sale',
                  reference: dispatchNumber,
                  quantityIn: 0,
                  quantityOut: item.dispatchQuantity,
                  previousBalance: prevBal,
                  newBalance: newBal,
                  user: dispatch.createdBy || 'Sales Dispatch',
                };
                setFgTransactions((st) => [fgtx, ...st]);

                // Persist new stock to database
                fetch('/api/products', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: p.id, currentStock: newBal }),
                }).catch((err) => console.warn('Failed to sync updated Product stock:', err));

                return { ...p, currentStock: newBal };
              }
              return p;
            })
          );
        }
      }
    });

    // Update Sales Order Dispatch Status
    setSalesOrders((prev) =>
      prev.map((so) =>
        so.id === dispatch.salesOrderId
          ? { ...so, dispatchStatus: 'Dispatched', orderStatus: 'Dispatched' }
          : so
      )
    );

    return { success: true };
  };

  // --- CUSTOMER PAYMENT ACTIONS ---
  const createCustomerPaymentFull = (
    payment: Omit<CustomerPayment, 'id' | 'paymentNumber'>,
    allowOverpayment = false
  ) => {
    const invoice = invoices.find((i) => i.id === payment.invoiceId);
    if (!invoice) return { success: false, message: 'Invoice record not found.' };

    if (!allowOverpayment && payment.amount > invoice.outstandingAmount) {
      return {
        success: false,
        message: `Payment amount (₹${payment.amount.toLocaleString('en-IN')}) cannot exceed outstanding amount (₹${invoice.outstandingAmount.toLocaleString('en-IN')}).`,
      };
    }

    const paymentNumber = (payment as any).paymentNumber || generateEntityCode('PAYMENT');
    const newId = `cpay-${Date.now().toString().slice(-4)}`;

    const newPayment: CustomerPayment = {
      ...payment,
      id: newId,
      paymentNumber,
      status: 'Completed',
    };

    setCustomerPayments((prev) => [newPayment, ...prev]);
    recordEntityCodeCreated('PAYMENT', paymentNumber);

    // Update Invoice status
    const newPaidAmount = invoice.paidAmount + payment.amount;
    const newOutstanding = Math.max(0, invoice.grandTotal - newPaidAmount);
    const newPaymentStatus = newOutstanding === 0 ? 'Paid' : newPaidAmount > 0 ? 'Partially Paid' : 'Unpaid';
    const newInvoiceStatus = newOutstanding === 0 ? 'Payment Completed' : 'Partially Paid';

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoice.id
          ? {
              ...i,
              paidAmount: newPaidAmount,
              outstandingAmount: newOutstanding,
              paymentStatus: newPaymentStatus,
              invoiceStatus: newInvoiceStatus,
            }
          : i
      )
    );

    // Sync Invoice payment update to database
    fetch('/api/invoices', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: invoice.id,
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstanding,
        paymentStatus: newPaymentStatus,
        invoiceStatus: newInvoiceStatus,
      }),
    }).catch(() => null);

    // Update Sales Order status
    setSalesOrders((prev) =>
      prev.map((so) =>
        so.id === invoice.salesOrderId || so.invoiceId === invoice.id
          ? {
              ...so,
              amountPaid: (so.amountPaid || 0) + payment.amount,
              amountOutstanding: Math.max(0, so.grandTotal - ((so.amountPaid || 0) + payment.amount)),
              paymentStatus: newOutstanding === 0 ? 'PAID' : 'PARTIAL',
            }
          : so
      )
    );

    // Also update linked quotation status
    if (invoice.quotationId) {
      const targetQuoteStatus: QuotationStatus =
        newOutstanding === 0 ? 'Payment Completed' : 'Payment Pending';
      setQuotations((prev) =>
        prev.map((q) =>
          q.id === invoice.quotationId ? { ...q, status: targetQuoteStatus, updatedAt: new Date().toISOString() } : q
        )
      );
      fetch('/api/quotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: invoice.quotationId,
          status: targetQuoteStatus,
        }),
      }).catch(() => null);
    }

    // Update Customer outstanding
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === payment.customerId
          ? {
              ...c,
              totalPaid: (c.totalPaid || 0) + payment.amount,
              totalOutstanding: Math.max(0, (c.totalOutstanding || 0) - payment.amount),
            }
          : c
      )
    );

    return { success: true };
  };

  // --- PAYMENT PROOF & VERIFICATION WORKFLOW ACTIONS ---
  const uploadCustomerPaymentProof = async (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';
    referenceNumber: string;
    proofFiles: string[];
    uploadedBy?: string;
    notes?: string;
    sendToProductionImmediately?: boolean;
  }) => {
    const invoice = invoices.find((i) => i.id === data.invoiceId);
    if (!invoice) return { success: false, message: 'Invoice record not found.' };

    const paymentNumber = generateEntityCode('PAYMENT');
    const effectivePaidAmount = invoice.grandTotal;
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    const uploader = data.uploadedBy || (activeRole === 'ADMIN' ? 'Administrator' : 'Sales Person');

    // Find any existing payment for this invoice to update or create a new one
    const existingPayment = customerPayments.find(
      (p) => p.invoiceId === invoice.id
    );

    const newId = `cpay-${Date.now().toString().slice(-4)}`;
    let paymentId = newId;

    if (existingPayment) {
      paymentId = existingPayment.id;
      const updatedPayment: CustomerPayment = {
        ...existingPayment,
        amount: effectivePaidAmount,
        paidAmount: effectivePaidAmount,
        invoiceAmount: invoice.grandTotal,
        pendingAmount: 0,
        paymentDate: data.paymentDate || today,
        paymentMode: data.paymentMode,
        referenceNumber: data.referenceNumber,
        notes: data.notes !== undefined ? data.notes : (existingPayment.notes || 'Full payment with uploaded proof.'),
        proofFiles: data.proofFiles,
        uploadedBy: uploader,
        uploadedDate: timestamp,
        status: 'Paid',
        rejectionReason: undefined,
      };

      setCustomerPayments((prev) => prev.map((p) => (p.id === existingPayment.id ? updatedPayment : p)));

      try {
        await fetch('/api/payments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPayment),
        });
      } catch (e) {
        console.warn('Sync payment error:', e);
      }
    } else {
      const newPayment: CustomerPayment = {
        id: newId,
        paymentNumber,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        customerNumber: invoice.customerNumber,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceAmount: invoice.grandTotal,
        paidAmount: effectivePaidAmount,
        pendingAmount: 0,
        paymentDate: data.paymentDate || today,
        amount: effectivePaidAmount,
        paymentMode: data.paymentMode,
        referenceNumber: data.referenceNumber,
        notes: data.notes || 'Full payment with uploaded proof.',
        proofFiles: data.proofFiles,
        uploadedBy: uploader,
        uploadedDate: timestamp,
        status: 'Paid',
      };

      setCustomerPayments((prev) => [newPayment, ...prev]);
      recordEntityCodeCreated('PAYMENT', paymentNumber);

      try {
        await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPayment),
        });
      } catch (e) {
        console.warn('Sync payment error:', e);
      }
    }

    // Update invoice with complete payment status (PAID) and proof files in local state & database
    const updatedInvoice: SalesInvoice = {
      ...invoice,
      paidAmount: effectivePaidAmount,
      outstandingAmount: 0,
      paymentStatus: 'Paid',
      invoiceStatus: 'Payment Completed',
      paymentProofFiles: data.proofFiles,
      paymentProofUploadedBy: uploader,
      paymentProofUploadedDate: timestamp,
    };

    setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? updatedInvoice : i)));

    try {
      await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: invoice.id,
          paidAmount: effectivePaidAmount,
          outstandingAmount: 0,
          paymentStatus: 'Paid',
          invoiceStatus: 'Payment Completed',
          paymentProofFiles: data.proofFiles,
          paymentProofUploadedBy: uploader,
          paymentProofUploadedDate: timestamp,
        }),
      });
    } catch (e) {
      console.warn('Sync invoice error:', e);
    }

    // Update linked Sales Order payment status to PAID with zero balance
    setSalesOrders((prev) =>
      prev.map((so) => {
        const isLinked =
          so.id === invoice.salesOrderId ||
          so.invoiceId === invoice.id ||
          (so.orderNumber && so.orderNumber === invoice.salesOrderNumber) ||
          (invoice.quotationId && so.quotationId === invoice.quotationId);
        if (!isLinked) return so;
        return {
          ...so,
          amountPaid: so.grandTotal,
          amountOutstanding: 0,
          pendingAmount: 0,
          paymentStatus: 'PAID',
        };
      })
    );

    const linkedSo = salesOrders.find(
      (so) =>
        so.id === invoice.salesOrderId ||
        so.invoiceId === invoice.id ||
        (so.orderNumber && so.orderNumber === invoice.salesOrderNumber) ||
        (invoice.quotationId && so.quotationId === invoice.quotationId)
    );
    if (linkedSo) {
      fetch('/api/sales-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: linkedSo.id,
          orderNumber: linkedSo.orderNumber,
          paymentStatus: 'PAID',
          amountPaid: linkedSo.grandTotal,
          amountOutstanding: 0,
          pendingAmount: 0,
        }),
      }).catch(() => null);
    }

    // Update Customer outstanding balance
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === invoice.customerId
          ? {
              ...c,
              totalPaid: (c.totalPaid || 0) + invoice.grandTotal,
              totalOutstanding: Math.max(0, (c.totalOutstanding || 0) - invoice.grandTotal),
            }
          : c
      )
    );

    let sentToProduction = false;
    if (data.sendToProductionImmediately) {
      sendInvoiceToProduction(invoice.id, uploader);
      sentToProduction = true;
    }

    return {
      success: true,
      message: sentToProduction
        ? `✓ Payment proof saved in database! Payment status marked as Paid (₹${invoice.grandTotal.toLocaleString('en-IN')}) & sent to Production successfully!`
        : `✓ Payment proof saved in database! Payment status marked as Paid (₹${invoice.grandTotal.toLocaleString('en-IN')}).`,
      paymentId,
      sentToProduction,
    };
  };

  const verifyCustomerPayment = (paymentId: string, notes?: string, verifiedBy?: string) => {
    const payment = customerPayments.find((p) => p.id === paymentId);
    if (!payment) return { success: false, message: 'Payment record not found.' };

    const verifier = verifiedBy || (activeRole === 'ADMIN' ? 'Administrator' : 'Authorized User');
    const timestamp = new Date().toISOString();

    const updatedPayment: CustomerPayment = {
      ...payment,
      status: 'Payment Verified',
      verificationNotes: notes || payment.verificationNotes || 'Verified by authorized user.',
      verifiedBy: verifier,
      verifiedDate: timestamp,
    };

    setCustomerPayments((prev) => prev.map((p) => (p.id === payment.id ? updatedPayment : p)));

    fetch('/api/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayment),
    }).catch(() => null);

    if (payment.invoiceId) {
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === payment.invoiceId
            ? {
                ...i,
                paymentStatus: 'Payment Verified',
                paymentVerificationNotes: notes || 'Verified by authorized user.',
              }
            : i
        )
      );

      fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payment.invoiceId,
          paymentStatus: 'Payment Verified',
          paymentVerificationNotes: notes || 'Verified by authorized user.',
        }),
      }).catch(() => null);
    }

    return {
      success: true,
      message: `Payment ${payment.paymentNumber} has been verified successfully.`,
    };
  };

  const completeCustomerPayment = (paymentId: string, verifiedBy?: string, notes?: string) => {
    const payment = customerPayments.find((p) => p.id === paymentId);
    if (!payment) return { success: false, message: 'Payment record not found.' };

    const invoice = invoices.find((i) => i.id === payment.invoiceId);
    if (!invoice) return { success: false, message: 'Associated invoice not found.' };

    const verifier = verifiedBy || (activeRole === 'ADMIN' ? 'Administrator' : 'Authorized User');
    const timestamp = new Date().toISOString();

    const updatedPayment: CustomerPayment = {
      ...payment,
      status: 'Payment Completed',
      verifiedBy: verifier,
      verifiedDate: timestamp,
      verificationNotes: notes || payment.verificationNotes || 'Payment verified and completed.',
    };

    setCustomerPayments((prev) => prev.map((p) => (p.id === payment.id ? updatedPayment : p)));

    fetch('/api/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayment),
    }).catch(() => null);

    // Update Invoice status and balance
    const newPaidAmount = (invoice.paidAmount || 0) + payment.amount;
    const newOutstanding = Math.max(0, invoice.grandTotal - newPaidAmount);

    const updatedInvoice: SalesInvoice = {
      ...invoice,
      paidAmount: newPaidAmount,
      outstandingAmount: newOutstanding,
      paymentStatus: 'Payment Completed',
      invoiceStatus: 'Payment Completed',
      paymentVerificationNotes: notes || payment.verificationNotes || 'Payment completed.',
    };

    setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? updatedInvoice : i)));

    fetch('/api/invoices', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: invoice.id,
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstanding,
        paymentStatus: 'Payment Completed',
        invoiceStatus: 'Payment Completed',
      }),
    }).catch(() => null);

    // Update linked Sales Order
    setSalesOrders((prev) =>
      prev.map((so) =>
        so.id === invoice.salesOrderId || so.invoiceId === invoice.id
          ? {
              ...so,
              amountPaid: (so.amountPaid || 0) + payment.amount,
              amountOutstanding: Math.max(0, so.grandTotal - ((so.amountPaid || 0) + payment.amount)),
              paymentStatus: 'PAID',
            }
          : so
      )
    );

    // Update linked Quotation
    if (invoice.quotationId) {
      setQuotations((prev) =>
        prev.map((q) =>
          q.id === invoice.quotationId
            ? { ...q, status: 'Payment Completed' as QuotationStatus, updatedAt: new Date().toISOString() }
            : q
        )
      );
      fetch('/api/quotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: invoice.quotationId,
          status: 'Payment Completed',
        }),
      }).catch(() => null);
    }

    // Update Customer outstanding balance
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === payment.customerId
          ? {
              ...c,
              totalPaid: (c.totalPaid || 0) + payment.amount,
              totalOutstanding: Math.max(0, (c.totalOutstanding || 0) - payment.amount),
            }
          : c
      )
    );

    return {
      success: true,
      message: 'Payment completed successfully! Invoice is now ready for Production.',
    };
  };

  const rejectCustomerPayment = (paymentId: string, rejectionReason: string, rejectedBy?: string) => {
    const payment = customerPayments.find((p) => p.id === paymentId);
    if (!payment) return { success: false, message: 'Payment record not found.' };

    const verifier = rejectedBy || (activeRole === 'ADMIN' ? 'Administrator' : 'Authorized User');
    const timestamp = new Date().toISOString();

    const updatedPayment: CustomerPayment = {
      ...payment,
      status: 'Payment Rejected',
      rejectionReason: rejectionReason,
      verificationNotes: (payment.verificationNotes ? payment.verificationNotes + ' | ' : '') + `Rejected: ${rejectionReason}`,
      verifiedBy: verifier,
      verifiedDate: timestamp,
    };

    setCustomerPayments((prev) => prev.map((p) => (p.id === payment.id ? updatedPayment : p)));

    fetch('/api/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayment),
    }).catch(() => null);

    if (payment.invoiceId) {
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === payment.invoiceId
            ? {
                ...i,
                paymentStatus: 'Payment Rejected',
                paymentRejectionReason: rejectionReason,
              }
            : i
        )
      );

      fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payment.invoiceId,
          paymentStatus: 'Payment Rejected',
          paymentRejectionReason: rejectionReason,
        }),
      }).catch(() => null);
    }

    return {
      success: true,
      message: `Payment rejected. Reason recorded: "${rejectionReason}".`,
    };
  };

  const updatePaymentProofFiles = (
    paymentId: string,
    proofFiles: string[],
    action: 'replace' | 'delete' | 'add' = 'replace'
  ) => {
    const payment = customerPayments.find((p) => p.id === paymentId);
    if (!payment) return { success: false, message: 'Payment record not found.' };

    const updatedPayment: CustomerPayment = {
      ...payment,
      proofFiles: proofFiles,
    };

    setCustomerPayments((prev) => prev.map((p) => (p.id === payment.id ? updatedPayment : p)));

    fetch('/api/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: payment.id,
        proofFiles: proofFiles,
      }),
    }).catch(() => null);

    if (payment.invoiceId) {
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === payment.invoiceId
            ? {
                ...i,
                paymentProofFiles: proofFiles,
              }
            : i
        )
      );

      fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payment.invoiceId,
          paymentProofFiles: proofFiles,
        }),
      }).catch(() => null);
    }

    return { success: true, message: 'Payment proof files updated successfully.' };
  };

  // --- SALES RETURNS ACTIONS ---
  const createSalesReturnFull = (ret: Omit<SalesReturn, 'id' | 'returnNumber' | 'returnDate'>) => {
    const returnNumber = (ret as any).returnNumber || generateEntityCode('RETURN');
    const year = new Date().getFullYear();
    const rmaNumber = `RMA-${year}-${Math.floor(100 + Math.random() * 900)}`;
    const newId = `sret-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];

    // Create entry in Product Management RMA desk so QA can inspect it!
    const productReturnEntry: ProductReturn = {
      id: `ret-${Date.now().toString().slice(-4)}`,
      returnNumber: rmaNumber,
      customerName: ret.customerName,
      salesInvoice: ret.invoiceNumber || 'INV-2026-REF',
      productId: ret.productId,
      productName: ret.productName,
      quantity: ret.quantity,
      returnReason: ret.returnReason,
      inspectionNotes: ret.description,
      status: 'Requested',
      date: today,
      createdBy: 'Sales Desk',
    };
    setProductReturns((prev) => [productReturnEntry, ...prev]);

    const newReturn: SalesReturn = {
      ...ret,
      id: newId,
      returnNumber,
      returnDate: today,
      status: 'Requested',
      productReturnId: productReturnEntry.id,
    };
    setSalesReturns((prev) => [newReturn, ...prev]);
    recordEntityCodeCreated('RETURN', returnNumber);

    return { success: true };
  };

  const clearAllSalesData = async () => {
    try {
      const res = await fetch('/api/sales/reset', { method: 'POST' });
      const data = await res.json();
      setCustomers([]);
      setInvoices([]);
      setCustomerPayments([]);
      setSalesOrders([]);
      setQuotations([]);
      setLeads([]);
      setLeadImportHistories([]);
      setDispatches([]);
      setSalesReturns([]);
      return data;
    } catch {
      setCustomers([]);
      setInvoices([]);
      setCustomerPayments([]);
      setSalesOrders([]);
      setQuotations([]);
      setLeads([]);
      setLeadImportHistories([]);
      setDispatches([]);
      setSalesReturns([]);
      return { success: true, message: 'Sales data cleared locally.' };
    }
  };

  const clearAllSystemData = async () => {
    // 1. Reset all local in-memory states to clean empty slate
    setRawMaterials([]);
    setFinishedGoods([]);
    setProductionOrders([]);
    setCustomers([]);
    setSalesOrders([]);
    setSuppliers([]);
    setPurchaseOrders([]);
    setMaterialReceipts([]);
    setMaterialConsumptions([]);
    setSupplierPayments([]);
    setStockTransactions([]);
    setProducts([]);
    setBoms([]);
    setProductReturns([]);
    setStockAdjustments([]);
    setFgTransactions([]);
    setQuotations([]);
    setLeads([]);
    setLeadImportHistories([]);
    setFollowUps([]);
    setInvoices([]);
    setDispatches([]);
    setCustomerPayments([]);
    setSalesReturns([]);
    setPurchaseRequests([]);

    // 2. Clear local storage ERP keys
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem('SUNYASH_MAPOUT_ERP_STATE_V2');
      localStorage.removeItem('SUNYASH_MAPOUT_ERP_STATE');
      localStorage.removeItem('crm_stock_data');
    } catch {}

    // 3. Delete all database records via API
    try {
      const res = await fetch('/api/system/reset-all', { method: 'POST' });
      const data = await res.json();
      return data;
    } catch {
      return { success: true, message: 'All system data cleared locally and database reset triggered.' };
    }
  };

  // --- PURCHASE REQUEST ACTIONS ---
  const createPurchaseRequest = (req: Omit<PurchaseRequest, 'id' | 'requestId' | 'date'>) => {
    // Check if an active request already exists for this material
    const activeReq = purchaseRequests.find(
      (pr) =>
        pr.rawMaterialId === req.rawMaterialId &&
        ['Pending', 'Sent', 'Supplier Confirmed'].includes(pr.status)
    );

    if (activeReq) {
      return {
        success: false,
        message: `An active Purchase Request (${activeReq.requestId}) is already in progress for "${req.rawMaterialName}" (Status: ${activeReq.status}). Duplicate active requests are prevented.`,
        requestId: activeReq.requestId,
      };
    }

    const requestId = generateEntityCode('PURCHASE_REQUEST');
    const newId = `pr-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];

    const newReq: PurchaseRequest = {
      ...req,
      id: newId,
      requestId,
      date: today,
    };

    setPurchaseRequests((prev) => [newReq, ...prev]);
    recordEntityCodeCreated('PURCHASE_REQUEST', requestId);
    return { success: true, requestId };
  };

  const updatePurchaseRequestStatus = (id: string, status: PurchaseRequestStatus) => {
    setPurchaseRequests((prev) =>
      prev.map((pr) => (pr.id === id || pr.requestId === id ? { ...pr, status } : pr))
    );
    return { success: true };
  };

  // --- SALES ORDER ACTIONS ---
  const createSalesOrder = (order: Omit<SalesOrder, 'id' | 'orderNumber'>): boolean => {
    const stockShortages: string[] = [];
    order.items.forEach((item) => {
      const fgId = item.finishedGoodId || item.productId;
      const fg = finishedGoods.find((g) => g.id === fgId);
      if (!fg || fg.currentStock < item.quantity) {
        stockShortages.push(item.finishedGoodName || item.productName || 'Product');
      }
    });

    if (stockShortages.length > 0) {
      alert(`Cannot fulfill order. Insufficient finished goods stock for: ${stockShortages.join(', ')}`);
      return false;
    }

    setFinishedGoods((prev) =>
      prev.map((fg) => {
        const orderItem = order.items.find((i) => i.finishedGoodId === fg.id);
        if (orderItem) {
          return { ...fg, currentStock: fg.currentStock - orderItem.quantity };
        }
        return fg;
      })
    );

    const unpaidAmount = order.grandTotal - order.amountPaid;
    if (unpaidAmount > 0) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === order.customerId
            ? { ...c, totalOutstanding: c.totalOutstanding + unpaidAmount }
            : c
        )
      );
    }

    const newId = `so-${Date.now().toString().slice(-4)}`;
    const orderNumber = `SO-2026-${Math.floor(100 + Math.random() * 900)}`;

    setSalesOrders((prev) => [{ ...order, id: newId, orderNumber }, ...prev]);
    return true;
  };

  const updateSalesOrderStatus = (
    id: string,
    dispatchStatus?: SalesOrder['dispatchStatus'],
    paymentStatus?: SalesOrder['paymentStatus']
  ) => {
    setSalesOrders((prev) =>
      prev.map((so) => {
        if (so.id === id) {
          return {
            ...so,
            dispatchStatus: dispatchStatus ?? so.dispatchStatus,
            paymentStatus: paymentStatus ?? so.paymentStatus,
          };
        }
        return so;
      })
    );
  };

  // --- SUPPLIER ACTIONS ---
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const supplierCode = supplier.supplierCode || generateEntityCode('SUPPLIER');
    if (supplier.supplierCode) {
      const existsCode = suppliers.some(
        (s) => (s.supplierCode || '').trim().toLowerCase() === supplierCode.trim().toLowerCase()
      );
      if (existsCode) {
        return { success: false, message: `Supplier Code "${supplierCode}" already exists!` };
      }
    }
    const newId = `sup-${Date.now().toString().slice(-4)}`;
    const newSupplierData = { ...supplier, supplierCode, id: newId };
    setSuppliers((prev) => [...prev, newSupplierData]);
    recordEntityCodeCreated('SUPPLIER', supplierCode);

    // Persist to Prisma DB API in background
    fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSupplierData),
    }).catch((err) => console.warn('Failed to sync supplier to DB:', err));

    return { success: true, id: newId };
  };

  const updateSupplier = (id: string, updated: Partial<Supplier>) => {
    if (updated.supplierCode) {
      const existsCode = suppliers.some(
        (s) => s.id !== id && (s.supplierCode || '').trim().toLowerCase() === updated.supplierCode?.trim().toLowerCase()
      );
      if (existsCode) {
        return { success: false, message: `Supplier Code "${updated.supplierCode}" is already in use.` };
      }
    }
    setSuppliers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
    return { success: true };
  };

  const deleteSupplier = (id: string) => {
    // Check existing purchase transactions (POs, Receipts, Payments)
    const hasPOs = purchaseOrders.some((po) => po.supplierId === id);
    const hasReceipts = materialReceipts.some((rec) => rec.supplierId === id);
    const hasPayments = supplierPayments.some((pay) => pay.supplierId === id);

    if (hasPOs || hasReceipts || hasPayments) {
      return {
        success: false,
        message: 'Cannot delete supplier with existing purchase transactions or bills. You can set status to Inactive instead.',
      };
    }

    setSuppliers((prev) => prev.filter((item) => item.id !== id));
    return { success: true };
  };

  // --- PURCHASE ORDER ACTIONS ---
  const createPurchaseOrder = (po: Omit<PurchaseOrder, 'id'> | Omit<PurchaseOrder, 'id' | 'poNumber'>) => {
    const poNumber = (po as Partial<PurchaseOrder>).poNumber || generateEntityCode('PURCHASE_ORDER');

    const newId = `po-${Date.now().toString().slice(-4)}`;

    // Calculate item total cost
    const items = po.items.map((item) => {
      const sub = item.quantity * item.unitCost;
      const disc = sub * ((item.discountPercent || 0) / 100);
      const tax = (sub - disc) * ((item.gstPercent || 18) / 100);
      return {
        ...item,
        receivedQuantity: item.receivedQuantity || 0,
        totalCost: Math.round(sub - disc + tax),
      };
    });

    const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitCost, 0);
    const discountAmount = items.reduce((acc, i) => acc + (i.quantity * i.unitCost * ((i.discountPercent || 0) / 100)), 0);
    const gstAmount = items.reduce((acc, i) => {
      const lineSub = i.quantity * i.unitCost;
      const lineDisc = lineSub * ((i.discountPercent || 0) / 100);
      return acc + (lineSub - lineDisc) * ((i.gstPercent || 18) / 100);
    }, 0);

    const freight = po.freight || 0;
    const totalAmount = Math.round(subtotal - discountAmount + gstAmount + freight);

    const newPO: PurchaseOrder = {
      ...po,
      id: newId,
      poNumber,
      invoiceNumber: po.invoiceNumber || `INV-${poNumber}`,
      paymentDueDate: po.paymentDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items,
      subtotal,
      discountAmount,
      gstAmount,
      freight,
      totalAmount,
      amountPaid: po.amountPaid || 0,
      receivedQuantity: 0,
      status: po.status || 'Pending',
      paymentStatus: po.amountPaid >= totalAmount ? 'PAID' : po.amountPaid > 0 ? 'PARTIAL' : 'UNPAID',
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    recordEntityCodeCreated('PURCHASE_ORDER', poNumber);

    // Update Supplier totalPurchase
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === po.supplierId
          ? {
              ...s,
              totalPurchase: (s.totalPurchase || 0) + totalAmount,
              totalOutstanding: s.totalOutstanding + (totalAmount - (po.amountPaid || 0)),
            }
          : s
      )
    );

    // Persist to Prisma DB API in background
    fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPO),
    }).catch((err) => console.warn('Failed to sync purchase order to DB:', err));

    return { success: true };
  };

  const updatePurchaseOrderStatus = (id: string, status: PurchaseOrder['status']) => {
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  // --- MATERIAL RECEIPTS ACTIONS ---
  const createMaterialReceipt = (
    receipt: Omit<MaterialReceipt, 'id' | 'receiptNumber'>,
    allowOverReceive = false
  ) => {
    const po = purchaseOrders.find((p) => p.id === receipt.poId);
    if (!po) return { success: false, message: 'Purchase Order not found.' };

    // Validation: prevent over-receiving unless allowed
    let overReceivedItem: string | null = null;
    receipt.items.forEach((item) => {
      if (!allowOverReceive && item.receivedQuantity > item.remainingQuantity) {
        overReceivedItem = item.rawMaterialName;
      }
    });

    if (overReceivedItem) {
      return {
        success: false,
        message: `Cannot receive more than remaining PO quantity for ${overReceivedItem}. Enable over-receiving option to proceed.`,
      };
    }

    const receiptNumber = `MR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newId = `rec-${Date.now().toString().slice(-4)}`;
    const today = receipt.receiptDate || new Date().toISOString().split('T')[0];

    const totalItems = receipt.items.length;
    const receivedQuantity = receipt.items.reduce((acc, i) => acc + i.receivedQuantity, 0);
    const acceptedQuantity = receipt.items.reduce((acc, i) => acc + i.acceptedQuantity, 0);
    const rejectedQuantity = receipt.items.reduce((acc, i) => acc + i.rejectedQuantity, 0);

    const newReceipt: MaterialReceipt = {
      ...receipt,
      id: newId,
      receiptNumber,
      totalItems,
      receivedQuantity,
      acceptedQuantity,
      rejectedQuantity,
      status: acceptedQuantity > 0 ? 'Completed' : 'Rejected',
    };

    // 1. Save Receipt Record
    setMaterialReceipts((prev) => [newReceipt, ...prev]);

    // 2. Automatically Increase Raw Material Stock by Accepted Quantity & Log Stock Transactions
    receipt.items.forEach((item) => {
      if (item.acceptedQuantity > 0) {
        setRawMaterials((prev) =>
          prev.map((rm) => {
            if (rm.id === item.rawMaterialId) {
              const prevBal = rm.currentStock;
              const newBal = prevBal + item.acceptedQuantity;

              // Log Transaction
              const tx: RawMaterialStockTransaction = {
                id: `tx-${Date.now().toString().slice(-5)}-rec-${rm.id}`,
                materialId: rm.id,
                materialName: rm.name,
                date: today,
                transactionType: 'Material Receipt',
                reference: receiptNumber,
                quantityIn: item.acceptedQuantity,
                quantityOut: 0,
                previousBalance: prevBal,
                newBalance: newBal,
                user: receipt.createdBy || 'Store Incharge',
              };
              setStockTransactions((st) => [tx, ...st]);

              return { ...rm, currentStock: newBal, lastRestocked: today };
            }
            return rm;
          })
        );
      }
    });

    // 3. Update Purchase Order Received Quantities & Status
    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id === receipt.poId) {
          const totalOrdered = p.items.reduce((a, i) => a + i.quantity, 0);
          const currentReceived = (p.receivedQuantity || 0) + acceptedQuantity;
          const newStatus: PurchaseOrder['status'] =
            currentReceived >= totalOrdered ? 'Received' : 'Partially Received';

          return {
            ...p,
            receivedQuantity: currentReceived,
            status: newStatus,
          };
        }
        return p;
      })
    );

    return { success: true };
  };

  // --- MATERIAL CONSUMPTION ACTIONS ---
  const createMaterialConsumption = (
    consumption: Omit<MaterialConsumption, 'id' | 'consumptionId'>,
    allowNegativeStock = false
  ) => {
    const rm = rawMaterials.find((r) => r.id === consumption.rawMaterialId);
    if (!rm) return { success: false, message: 'Raw Material not found.' };

    if (!allowNegativeStock && rm.currentStock < consumption.quantity) {
      return {
        success: false,
        message: `Insufficient stock for ${rm.name}. Current stock: ${rm.currentStock} ${rm.unit}, requested: ${consumption.quantity} ${rm.unit}.`,
      };
    }

    const consumptionId = `MC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newId = `cons-${Date.now().toString().slice(-4)}`;
    const today = consumption.date || new Date().toISOString().split('T')[0];

    const newConsumption: MaterialConsumption = {
      ...consumption,
      id: newId,
      consumptionId,
      sku: rm.sku,
      unit: rm.unit,
    };

    setMaterialConsumptions((prev) => [newConsumption, ...prev]);

    // Decrease Raw Material Current Stock & Add Transaction Entry
    setRawMaterials((prev) =>
      prev.map((item) => {
        if (item.id === rm.id) {
          const prevBal = item.currentStock;
          const newBal = prevBal - consumption.quantity;

          const tx: RawMaterialStockTransaction = {
            id: `tx-${Date.now().toString().slice(-5)}-cons-${rm.id}`,
            materialId: rm.id,
            materialName: rm.name,
            date: today,
            transactionType: 'Material Consumption',
            reference: consumptionId,
            quantityIn: 0,
            quantityOut: consumption.quantity,
            previousBalance: prevBal,
            newBalance: newBal,
            user: consumption.user || 'Shopfloor Manager',
          };
          setStockTransactions((st) => [tx, ...st]);

          // Persist to PostgreSQL Neon database
          fetch('/api/raw-materials', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: rm.id, currentStock: newBal }),
          }).then(() => refreshRawMaterialsFromDB()).catch(console.warn);

          return { ...item, currentStock: newBal };
        }
        return item;
      })
    );

    return { success: true };
  };

  // --- SUPPLIER PAYMENT ACTIONS ---
  const createSupplierPayment = (
    payment: Omit<SupplierPayment, 'id' | 'paymentId'>,
    allowOverPayment = false
  ) => {
    const supplier = suppliers.find((s) => s.id === payment.supplierId);
    if (!supplier) return { success: false, message: 'Supplier not found.' };

    if (!allowOverPayment && payment.amount > supplier.totalOutstanding) {
      return {
        success: false,
        message: `Payment amount (₹${payment.amount.toLocaleString('en-IN')}) cannot exceed total outstanding (₹${supplier.totalOutstanding.toLocaleString('en-IN')}).`,
      };
    }

    const paymentId = `SP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newId = `pay-${Date.now().toString().slice(-4)}`;

    const newPayment: SupplierPayment = {
      ...payment,
      id: newId,
      paymentId,
      status: 'Completed',
    };

    setSupplierPayments((prev) => [newPayment, ...prev]);

    // Decrease Supplier Outstanding
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplier.id) {
          return {
            ...s,
            totalOutstanding: Math.max(0, s.totalOutstanding - payment.amount),
          };
        }
        return s;
      })
    );

    // Update PO amount paid & paymentStatus if billPoNumber references a PO
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.poNumber.trim().toLowerCase() === payment.billPoNumber.trim().toLowerCase()) {
          const newPaid = po.amountPaid + payment.amount;
          const newStatus: PurchaseOrder['paymentStatus'] =
            newPaid >= po.totalAmount ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID';
          return {
            ...po,
            amountPaid: newPaid,
            paymentStatus: newStatus,
          };
        }
        return po;
      })
    );

    return { success: true };
  };

  // --- AUTOMATIC ALERTS CALCULATION ---
  const alerts = useMemo<SystemAlert[]>(() => {
    const list: SystemAlert[] = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. Raw material below min stock
    rawMaterials.forEach((rm) => {
      if (rm.currentStock <= rm.minStock) {
        list.push({
          id: `alt-rm-${rm.id}`,
          type: 'LOW_RAW_MATERIAL',
          title: `Low Stock: Raw Material (${rm.name})`,
          description: `Current stock (${rm.currentStock} ${rm.unit}) is below minimum required (${rm.minStock} ${rm.unit}).`,
          severity: rm.currentStock === 0 ? 'CRITICAL' : 'WARNING',
          date: today,
          actionLinkModule: 'rawMaterials',
        });
      }
    });

    // 2. Finished product below min stock
    finishedGoods.forEach((fg) => {
      if (fg.currentStock <= fg.minStock) {
        list.push({
          id: `alt-fg-${fg.id}`,
          type: 'LOW_FINISHED_GOOD',
          title: `Low Stock: Finished Product (${fg.name})`,
          description: `Finished inventory (${fg.currentStock} units) is below safety stock (${fg.minStock} units).`,
          severity: fg.currentStock < fg.minStock / 2 ? 'CRITICAL' : 'WARNING',
          date: today,
          actionLinkModule: 'finishedGoods',
        });
      }
    });

    // 3. Customer payment overdue
    salesOrders.forEach((so) => {
      if (so.paymentStatus === 'OVERDUE' || (so.paymentStatus !== 'PAID' && so.dueDate < today)) {
        list.push({
          id: `alt-so-${so.id}`,
          type: 'CUSTOMER_PAYMENT_OVERDUE',
          title: `Overdue Payment: ${so.customerName}`,
          description: `Order ${so.orderNumber} has an unpaid balance of ₹${(so.grandTotal - so.amountPaid).toLocaleString('en-IN')}. Due date was ${so.dueDate}.`,
          severity: 'CRITICAL',
          date: today,
          actionLinkModule: 'salesOrders',
        });
      }
    });

    // 4. Supplier payment due
    suppliers.forEach((s) => {
      if (s.totalOutstanding > 0) {
        list.push({
          id: `alt-sup-${s.id}`,
          type: 'SUPPLIER_PAYMENT_DUE',
          title: `Supplier Payable Due: ${s.name}`,
          description: `Outstanding payable amount of ₹${s.totalOutstanding.toLocaleString('en-IN')}. Terms: ${s.paymentTerms}.`,
          severity: 'WARNING',
          date: today,
          actionLinkModule: 'suppliers',
        });
      }
    });

    // 5. Pending purchase order
    purchaseOrders.forEach((po) => {
      if (po.status === 'Pending' || po.status === 'Draft' || po.status === 'Approved') {
        list.push({
          id: `alt-po-${po.id}`,
          type: 'PENDING_PO',
          title: `Pending Purchase Order: ${po.poNumber}`,
          description: `Awaiting delivery from ${po.supplierName}. Expected by ${po.expectedDate}.`,
          severity: 'INFO',
          date: today,
          actionLinkModule: 'purchaseOrders',
        });
      }
    });

    // 6. Pending production build
    productionOrders.forEach((prod) => {
      if (prod.status === 'PENDING' || prod.status === 'IN_PROGRESS') {
        list.push({
          id: `alt-prod-${prod.id}`,
          type: 'PENDING_PRODUCTION',
          title: `Active Assembly Build: ${prod.orderNumber}`,
          description: `Production of ${prod.quantityToProduce} units of ${prod.finishedGoodName} is ${prod.status.toLowerCase().replace('_', ' ')}.`,
          severity: 'INFO',
          date: today,
          actionLinkModule: 'production',
        });
      }
    });

    // 7. Customer follow-up due
    customers.forEach((c) => {
      if (c.nextFollowUpDate && c.nextFollowUpDate <= today) {
        list.push({
          id: `alt-cust-${c.id}`,
          type: 'CUSTOMER_FOLLOWUP_DUE',
          title: `Customer Follow-Up Due: ${c.companyName}`,
          description: `Follow-up contact is scheduled for today or overdue (${c.nextFollowUpDate}). Contact: ${c.phone}`,
          severity: 'WARNING',
          date: today,
          actionLinkModule: 'customers',
        });
      }
    });

    // 8. Pending dispatch
    salesOrders.forEach((so) => {
      if (so.dispatchStatus === 'PENDING') {
        list.push({
          id: `alt-disp-${so.id}`,
          type: 'PENDING_DISPATCH',
          title: `Order Pending Dispatch: ${so.orderNumber}`,
          description: `Order for ${so.customerName} is ready for packing & shipment.`,
          severity: 'INFO',
          date: today,
          actionLinkModule: 'salesOrders',
        });
      }
    });

    return list;
  }, [rawMaterials, finishedGoods, salesOrders, suppliers, purchaseOrders, productionOrders, customers]);

  // --- FINANCIAL SUMMARY CALCULATION ---
  const financials = useMemo<FinancialSummary>(() => {
    const today = new Date().toISOString().split('T')[0];

    const todaySales = salesOrders
      .filter((so) => so.orderDate === today)
      .reduce((acc, so) => acc + so.grandTotal, 0);

    const monthlySales = salesOrders.reduce((acc, so) => acc + so.grandTotal, 0);

    const customerOutstanding = customers.reduce((acc, c) => acc + c.totalOutstanding, 0);
    const supplierOutstanding = suppliers.reduce((acc, s) => acc + s.totalOutstanding, 0);

    const rawMaterialStockValue = rawMaterials.reduce(
      (acc, rm) => acc + rm.currentStock * rm.unitCost,
      0
    );

    const finishedGoodsStockValue = finishedGoods.reduce(
      (acc, fg) => acc + fg.currentStock * fg.sellingPrice,
      0
    );

    const totalProfit = salesOrders.reduce((acc, so) => {
      let costOfGoods = 0;
      so.items.forEach((item) => {
        const fg = finishedGoods.find((g) => g.id === item.finishedGoodId);
        costOfGoods += (fg?.manufacturingCost || 0) * item.quantity;
      });
      return acc + (so.totalAmount - costOfGoods);
    }, 0);

    return {
      todaySales,
      monthlySales,
      totalOrdersCount: salesOrders.length,
      customerOutstanding,
      supplierOutstanding,
      rawMaterialStockValue,
      finishedGoodsStockValue,
      totalProfit,
    };
  }, [salesOrders, customers, suppliers, rawMaterials, finishedGoods]);

  // --- PRODUCT MASTER ACTIONS ---
  const addProduct = (prod: Omit<ProductMaster, 'id' | 'createdAt'>) => {
    const codeExists = products.some(
      (p) => p.productCode.trim().toLowerCase() === prod.productCode.trim().toLowerCase()
    );
    if (codeExists) return { success: false, message: `Product Code "${prod.productCode}" already exists!` };
    const skuExists = products.some(
      (p) => p.sku.trim().toLowerCase() === prod.sku.trim().toLowerCase()
    );
    if (skuExists) return { success: false, message: `SKU "${prod.sku}" already exists!` };
    if (prod.minStock > prod.maxStock) {
      return { success: false, message: 'Minimum stock cannot be greater than Maximum stock.' };
    }
    const newId = `prd-${Date.now().toString().slice(-4)}`;
    const newProduct: ProductMaster = {
      ...prod,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProducts((prev) => [newProduct, ...prev]);
    recordEntityCodeCreated('PRODUCT', prod.productCode || prod.sku);

    setFinishedGoods((prev) => [
      ...prev,
      {
        id: `fg-${newId}`,
        sku: prod.sku,
        name: prod.name,
        modelNumber: prod.productCode,
        category: (prod.category as any) || 'OBD Cable',
        currentStock: prod.currentStock,
        minStock: prod.minStock,
        sellingPrice: prod.sellingPrice,
        manufacturingCost: prod.purchaseCost,
        bom: [],
        description: prod.description || '',
      },
    ]);

    // Auto-create active BOM if rawMaterialQuantities specified
    if (prod.rawMaterialQuantities && prod.rawMaterialQuantities.length > 0) {
      const bomItems: BOMItem[] = prod.rawMaterialQuantities.map((rmq) => ({
        rawMaterialId: rmq.rawMaterialId,
        rawMaterialName: rmq.rawMaterialName,
        sku: rmq.sku || '',
        unit: rmq.unit || 'PCS',
        quantity: rmq.quantityUsed,
        wastagePercent: rmq.wastagePercent || 0,
        notes: rmq.notes || '',
      }));
      const newBOM: BOM = {
        id: `bom-${Date.now().toString().slice(-4)}`,
        bomNumber: `BOM-${prod.sku}-v1`,
        productId: newId,
        productName: prod.name,
        version: 1,
        items: bomItems,
        createdDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        createdBy: activeRole === 'ADMIN' ? 'Admin' : 'Product Manager',
      };
      setBoms((prev) => [newBOM, ...prev.map((b) => (b.productId === newId ? { ...b, status: 'Inactive' as const } : b))]);
    }

    // Deduct used raw materials from raw material inventory
    if (prod.currentStock > 0 && prod.rawMaterialQuantities && prod.rawMaterialQuantities.length > 0) {
      setRawMaterials((prev) => {
        let updatedRMs = [...prev];
        prod.rawMaterialQuantities!.forEach((rmq) => {
          const totalUsed = Math.round(
            (Number(rmq.quantityUsed || 1) * (1 + Number(rmq.wastagePercent || 0) / 100)) * prod.currentStock
          );
          updatedRMs = updatedRMs.map((rm) =>
            rm.id === rmq.rawMaterialId || rm.sku === rmq.sku || rm.name === rmq.rawMaterialName
              ? { ...rm, currentStock: Math.max(0, rm.currentStock - totalUsed) }
              : rm
          );
        });
        return updatedRMs;
      });
    }

    if (prod.currentStock > 0) {
      const tx: FinishedGoodsStockTransaction = {
        id: `fgtx-${Date.now()}`,
        productId: newId,
        productName: prod.name,
        date: new Date().toISOString().split('T')[0],
        transactionType: 'Opening Stock',
        reference: `INIT-${prod.sku}`,
        quantityIn: prod.currentStock,
        quantityOut: 0,
        previousBalance: 0,
        newBalance: prod.currentStock,
        user: activeRole === 'ADMIN' ? 'Admin' : 'Product Manager',
      };
      setFgTransactions((prev) => [tx, ...prev]);
    }
    // Persist to Prisma DB API in background
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData?.success && resData.data) {
          setProducts((prev) =>
            prev.map((p) => (p.sku === newProduct.sku ? { ...p, ...resData.data } : p))
          );
        }
        // Refresh raw materials from DB
        fetch('/api/raw-materials')
          .then((r) => r.json())
          .then((rmRes) => {
            if (rmRes?.success && Array.isArray(rmRes.data)) {
              setRawMaterials(rmRes.data);
            }
          })
          .catch(() => null);
      })
      .catch((err) => console.warn('Failed to sync product to DB:', err));

    return { success: true };
  };

  const updateProduct = (id: string, updated: Partial<ProductMaster>) => {
    if (updated.productCode) {
      const codeExists = products.some(
        (p) => p.id !== id && p.productCode.trim().toLowerCase() === updated.productCode?.trim().toLowerCase()
      );
      if (codeExists) return { success: false, message: `Product Code "${updated.productCode}" is in use.` };
    }
    if (updated.sku) {
      const skuExists = products.some(
        (p) => p.id !== id && p.sku.trim().toLowerCase() === updated.sku?.trim().toLowerCase()
      );
      if (skuExists) return { success: false, message: `SKU "${updated.sku}" is in use.` };
    }

    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));

    // Persist changes to DB backend via PUT API
    fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updated }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData?.success && resData.data) {
          setProducts((prev) =>
            prev.map((p) => (p.id === id || p.sku === updated.sku ? { ...p, ...resData.data } : p))
          );
        }
        // Refresh raw materials from DB
        fetch('/api/raw-materials')
          .then((r) => r.json())
          .then((rmRes) => {
            if (rmRes?.success && Array.isArray(rmRes.data)) {
              setRawMaterials(rmRes.data);
            }
          })
          .catch(() => null);
      })
      .catch((err) => console.warn('Failed to sync updated product to DB:', err));

    if (updated.rawMaterialQuantities && updated.rawMaterialQuantities.length > 0) {
      const targetProd = products.find((p) => p.id === id);
      const prodStock = updated.currentStock !== undefined ? Number(updated.currentStock) : (targetProd?.currentStock || 0);
      if (prodStock > 0) {
        setRawMaterials((prev) => {
          let updatedRMs = [...prev];
          updated.rawMaterialQuantities!.forEach((rmq) => {
            const totalUsed = Math.round(
              (Number(rmq.quantityUsed || 1) * (1 + Number(rmq.wastagePercent || 0) / 100)) * prodStock
            );
            updatedRMs = updatedRMs.map((rm) =>
              rm.id === rmq.rawMaterialId || rm.sku === rmq.sku || rm.name === rmq.rawMaterialName
                ? { ...rm, currentStock: Math.max(0, rm.currentStock - totalUsed) }
                : rm
            );
          });
          return updatedRMs;
        });
      }

      const bomItems: BOMItem[] = updated.rawMaterialQuantities.map((rmq) => ({
        rawMaterialId: rmq.rawMaterialId,
        rawMaterialName: rmq.rawMaterialName,
        sku: rmq.sku || '',
        unit: rmq.unit || 'PCS',
        quantity: rmq.quantityUsed,
        wastagePercent: rmq.wastagePercent || 0,
        notes: rmq.notes || '',
      }));
      setBoms((prev) => {
        const existingActiveBOM = prev.find((b) => b.productId === id && b.status === 'Active');
        if (existingActiveBOM) {
          return prev.map((b) => (b.id === existingActiveBOM.id ? { ...b, items: bomItems } : b));
        } else {
          const newBOM: BOM = {
            id: `bom-${Date.now().toString().slice(-4)}`,
            bomNumber: `BOM-${updated.sku || 'PROD'}-v1`,
            productId: id,
            productName: updated.name || 'Product',
            version: 1,
            items: bomItems,
            createdDate: new Date().toISOString().split('T')[0],
            status: 'Active',
            createdBy: activeRole === 'ADMIN' ? 'Admin' : 'Product Manager',
          };
          return [newBOM, ...prev];
        }
      });
    }

    return { success: true };
  };

  const toggleProductStatus = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : p))
    );
    return { success: true };
  };

  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return { success: false, message: 'Product not found.' };

    const hasProduction = productionOrders.some(
      (po: any) => po.productId === id || po.finishedGoodName === prod.name
    );
    const hasSales = salesOrders.some((so) =>
      so.items.some((item) => item.sku === prod.sku || item.finishedGoodName === prod.name)
    );
    if (hasProduction || hasSales) {
      return {
        success: false,
        message: 'Product cannot be deleted because it has existing production or sales history. Change status to Inactive instead.',
      };
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));

    // Delete from PostgreSQL database via API
    fetch(`/api/products?id=${encodeURIComponent(id)}&sku=${encodeURIComponent(prod.sku || '')}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Failed to delete product from database:', err));

    return { success: true };
  };

  const refreshProductsFromDB = async (): Promise<ProductMaster[]> => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        setProducts(data.data);
        return data.data;
      }
    } catch (e) {
      console.warn('Failed to refresh products from DB:', e);
    }
    return [];
  };

  const refreshRawMaterialsFromDB = async (): Promise<RawMaterial[]> => {
    try {
      const res = await fetch('/api/raw-materials');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        setRawMaterials(data.data);
        return data.data;
      }
    } catch (e) {
      console.warn('Failed to refresh raw materials from DB:', e);
    }
    return [];
  };

  // --- BOM ACTIONS ---
  const addBOM = (bom: Omit<BOM, 'id' | 'bomNumber' | 'createdDate'>) => {
    if (!bom.items || bom.items.length === 0) {
      return { success: false, message: 'BOM must contain at least one raw material.' };
    }
    for (const item of bom.items) {
      if (item.quantity <= 0) {
        return { success: false, message: 'Material quantity must be greater than zero.' };
      }
    }
    const newId = `bom-${Date.now().toString().slice(-4)}`;
    const prod = products.find((p) => p.id === bom.productId);
    const bomNumber = `BOM-${prod ? prod.sku : 'PROD'}-v${bom.version || 1}`;

    let updatedBOMs = [...boms];
    if (bom.status === 'Active') {
      updatedBOMs = updatedBOMs.map((b) =>
        b.productId === bom.productId ? { ...b, status: 'Inactive' as const } : b
      );
    }
    const newBOM: BOM = {
      ...bom,
      id: newId,
      bomNumber,
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: activeRole === 'ADMIN' ? 'Admin' : 'Product Manager',
    };
    setBoms([newBOM, ...updatedBOMs]);
    return { success: true };
  };

  const updateBOM = (id: string, updated: Partial<BOM>) => {
    setBoms((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          return { ...b, ...updated };
        }
        if (updated.status === 'Active' && b.productId === updated.productId && b.id !== id) {
          return { ...b, status: 'Inactive' };
        }
        return b;
      })
    );
    return { success: true };
  };

  const createNewBOMVersion = (productId: string, items: BOMItem[]) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return { success: false, message: 'Product not found.' };
    const prodBOMs = boms.filter((b) => b.productId === productId);
    const highestVersion = prodBOMs.reduce((max, b) => Math.max(max, b.version), 0);
    const nextVersion = highestVersion + 1;

    return addBOM({
      productId,
      productName: prod.name,
      version: nextVersion,
      items,
      status: 'Active',
    });
  };

  // --- MATERIAL AVAILABILITY CHECK ---
  const checkMaterialAvailability = (productId: string, quantity: number, bomVersion?: number) => {
    const targetBOM =
      boms.find(
        (b) => b.productId === productId && (bomVersion ? b.version === bomVersion : b.status === 'Active')
      ) || boms.find((b) => b.productId === productId);

    if (!targetBOM) {
      return { isAvailable: false, materials: [] };
    }

    let allAvailable = true;
    const materials = targetBOM.items.map((item) => {
      const reqPerUnit = item.quantity * (1 + (item.wastagePercent || 0) / 100);
      const totalRequired = Math.ceil(reqPerUnit * quantity);

      const rm = rawMaterials.find((r) => r.id === item.rawMaterialId);
      const currentAvailable = rm ? rm.currentStock : 0;
      const shortage = Math.max(0, totalRequired - currentAvailable);
      const isShort = shortage > 0;

      if (isShort) allAvailable = false;

      return {
        rawMaterialId: item.rawMaterialId,
        rawMaterialName: item.rawMaterialName,
        unit: item.unit,
        required: totalRequired,
        available: currentAvailable,
        shortage,
        status: isShort ? ('INSUFFICIENT STOCK' as const) : ('AVAILABLE' as const),
      };
    });

    return {
      isAvailable: allAvailable,
      materials,
    };
  };

  // --- PRODUCTION WORKFLOW ACTIONS ---
  const createProductionOrderFull = (order: {
    productId: string;
    productName: string;
    bomId: string;
    bomVersion: number;
    plannedQuantity: number;
    productionDate: string;
    expectedCompletion: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    notes?: string;
    assignedEngineer?: string;
  }) => {
    if (order.plannedQuantity <= 0) {
      return { success: false, message: 'Production quantity must be greater than zero.' };
    }
    const orderNumber = `MO-BUILD-${Math.floor(100 + Math.random() * 900)}`;
    const newId = `prod-${Date.now().toString().slice(-4)}`;

    const newProdOrder: any = {
      id: newId,
      orderNumber,
      finishedGoodId: order.productId,
      finishedGoodName: order.productName,
      productId: order.productId,
      productName: order.productName,
      bomId: order.bomId,
      bomVersion: order.bomVersion,
      plannedQuantity: order.plannedQuantity,
      producedQuantity: 0,
      quantityToProduce: order.plannedQuantity,
      productionDate: order.productionDate,
      expectedCompletion: order.expectedCompletion,
      startDate: order.productionDate,
      priority: order.priority || 'Medium',
      status: 'Draft',
      assignedEngineer: order.assignedEngineer || 'Production Engineer',
      notes: order.notes || '',
    };

    setProductionOrders((prev) => [newProdOrder, ...prev]);
    return { success: true };
  };

  const updateProductionOrderStatus = (id: string, newStatus: string, allowShortageOverride = false) => {
    const pOrder = productionOrders.find((p) => p.id === id) as any;
    if (!pOrder) return { success: false, message: 'Production order not found.' };

    const today = new Date().toISOString().split('T')[0];
    const targetProdId = pOrder.productId || pOrder.finishedGoodId;
    const targetQty = pOrder.plannedQuantity || pOrder.quantityToProduce || 0;

    // Check target product details
    const targetProductObj = products.find((p) => p.id === targetProdId) || products.find((p) => p.sku === pOrder.sku);
    const targetFGObj = finishedGoods.find((fg) => fg.id === targetProdId) || finishedGoods.find((fg) => fg.sku === pOrder.sku);
    const productName = targetProductObj?.name || targetFGObj?.name || pOrder.productName || pOrder.finishedGoodName || 'Product';

    // 1. Starting Production -> Raw Material Availability Check & Deduction
    if (newStatus === 'In Production' && pOrder.status !== 'In Production' && pOrder.status !== 'IN_PROGRESS' && pOrder.status !== 'COMPLETED' && pOrder.status !== 'Completed') {
      const avail = checkMaterialAvailability(targetProdId, targetQty, pOrder.bomVersion);

      if (!avail.isAvailable && !allowShortageOverride && activeRole !== 'ADMIN') {
        const shortages = avail.materials.filter((m) => m.shortage > 0).map((m) => `${m.rawMaterialName} (Shortage: ${m.shortage} ${m.unit})`).join(', ');
        return {
          success: false,
          message: `Cannot start production order ${pOrder.orderNumber}. Insufficient raw material stock: ${shortages}.`,
        };
      }

      // Deduct raw materials based on BOM items & create consumption stock transactions
      const targetBOM =
        boms.find((b) => b.id === pOrder.bomId) ||
        boms.find((b) => b.productId === targetProdId && b.status === 'Active') ||
        boms.find((b) => b.productId === targetProdId);

      if (targetBOM) {
        setRawMaterials((prev) =>
          prev.map((rm) => {
            const bItem = targetBOM.items.find((bi) => bi.rawMaterialId === rm.id);
            if (bItem) {
              const req = Math.ceil(
                bItem.quantity * (1 + (bItem.wastagePercent || 0) / 100) * targetQty
              );
              const prevBal = rm.currentStock;
              const newBal = prevBal - req;

              // Log Raw Material Stock Transaction (Material Consumption)
              const tx: RawMaterialStockTransaction = {
                id: `tx-${Date.now().toString().slice(-5)}-rm-${rm.id}`,
                materialId: rm.id,
                materialName: rm.name,
                date: today,
                transactionType: 'Material Consumption',
                reference: pOrder.orderNumber,
                quantityIn: 0,
                quantityOut: req,
                previousBalance: prevBal,
                newBalance: newBal,
                user: pOrder.assignedEngineer || activeRole === 'ADMIN' ? 'Admin' : 'Production Engineer',
              };
              setStockTransactions((st) => [tx, ...st]);

              // Also log in MaterialConsumptions table
              const consumptionEntry: MaterialConsumption = {
                id: `cons-${Date.now().toString().slice(-4)}-${rm.id}`,
                consumptionId: `CONS-${pOrder.orderNumber}-${rm.sku || rm.id.slice(-4)}`,
                productionOrderId: pOrder.id,
                rawMaterialId: rm.id,
                rawMaterialName: rm.name,
                sku: rm.sku,
                quantity: req,
                unit: rm.unit,
                date: today,
                user: pOrder.assignedEngineer || 'Production Engineer',
                notes: `Consumed for Production Order ${pOrder.orderNumber} (${productName} x ${targetQty})`,
              };
              setMaterialConsumptions((mc) => [consumptionEntry, ...mc]);

              return { ...rm, currentStock: newBal };
            }
            return rm;
          })
        );

        // Collect all deductions and persist to PostgreSQL database
        const pDeductions = targetBOM.items.map((bi) => ({
          rawMaterialId: bi.rawMaterialId,
          quantity: Math.ceil(bi.quantity * (1 + (bi.wastagePercent || 0) / 100) * targetQty),
        }));
        if (pDeductions.length > 0) {
          fetch('/api/raw-materials', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deductions: pDeductions }),
          }).then(() => refreshRawMaterialsFromDB()).catch(console.warn);
        }
      }
    }

    // 2. Production Completion -> Finished Goods Stock Increases & FG Stock Transaction Created
    if ((newStatus === 'Completed' || newStatus === 'COMPLETED') && pOrder.status !== 'Completed' && pOrder.status !== 'COMPLETED') {
      const producedQty = targetQty;

      // Update ProductMaster stock and create Finished Goods Stock Transaction
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === targetProdId || p.sku === pOrder.sku) {
            const prevBal = p.currentStock;
            const newBal = prevBal + producedQty;

            const fgtx: FinishedGoodsStockTransaction = {
              id: `fgtx-${Date.now().toString().slice(-5)}-${p.id}`,
              productId: p.id,
              productName: p.name,
              date: today,
              transactionType: 'Production',
              reference: pOrder.orderNumber,
              quantityIn: producedQty,
              quantityOut: 0,
              previousBalance: prevBal,
              newBalance: newBal,
              user: pOrder.assignedEngineer || 'Assembly Supervisor',
            };
            setFgTransactions((st) => [fgtx, ...st]);

            return { ...p, currentStock: newBal };
          }
          return p;
        })
      );

      // Also update FinishedGood catalog stock if entry exists
      setFinishedGoods((prev) =>
        prev.map((fg) =>
          fg.id === targetProdId || fg.sku === pOrder.sku
            ? { ...fg, currentStock: fg.currentStock + producedQty }
            : fg
        )
      );
    }

    // Update Production Order Status & Details
    setProductionOrders((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: (newStatus === 'Completed' ? 'COMPLETED' : newStatus === 'In Production' ? 'IN_PROGRESS' : newStatus) as any,
              producedQuantity:
                newStatus === 'Completed' || newStatus === 'COMPLETED'
                  ? targetQty
                  : p.producedQuantity,
              completionDate: newStatus === 'Completed' || newStatus === 'COMPLETED' ? today : p.completionDate,
            }
          : p
      )
    );

    return { success: true };
  };

  // --- RETURNS ACTIONS ---
  const createProductReturn = (ret: Omit<ProductReturn, 'id' | 'returnNumber' | 'date'>) => {
    const returnNumber = `RMA-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newId = `ret-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];

    const newReturn: ProductReturn = {
      ...ret,
      id: newId,
      returnNumber,
      returnedQuantity: ret.returnedQuantity || ret.quantity,
      replacementQuantity: ret.replacementQuantity || 0,
      claimType: ret.claimType || 'Defective',
      repairStatus: ret.repairStatus || 'Not Started',
      date: today,
    };
    setProductReturns((prev) => [newReturn, ...prev]);

    // Also sync entry to Sales Management CRM Returns
    const newSalesReturn: SalesReturn = {
      id: `sret-${Date.now().toString().slice(-4)}`,
      returnNumber: generateEntityCode('RETURN'),
      customerId: (ret as any).customerId || 'cust-1',
      customerName: ret.customerName,
      invoiceNumber: ret.salesInvoice,
      productId: ret.productId,
      productName: ret.productName,
      quantity: ret.quantity,
      returnedQuantity: ret.returnedQuantity || ret.quantity,
      replacementQuantity: ret.replacementQuantity || 0,
      returnReason: ret.returnReason,
      claimType: ret.claimType || 'Defective',
      description: ret.inspectionNotes || ret.defect || ret.returnReason,
      repairStatus: ret.repairStatus || 'Not Started',
      status: ret.status || 'Requested',
      returnDate: today,
      productReturnId: newId,
      createdBy: ret.createdBy || 'Product Desk',
    };
    setSalesReturns((prev) => [newSalesReturn, ...prev]);

    return { success: true };
  };

  const updateProductReturnStatus = (
    id: string,
    status: ProductReturn['status'],
    notes?: string,
    actionTaken?: string,
    defect?: string,
    extraDetails?: Partial<ProductReturn>
  ) => {
    const ret = productReturns.find((r) => r.id === id || r.returnNumber === id);
    if (!ret) return { success: false, message: 'Return request not found.' };

    const today = new Date().toISOString().split('T')[0];
    const isClosing = ['Completed', 'Repaired', 'Replaced', 'Rejected', 'Damaged'].includes(status);

    if (status === 'Replaced' || status === 'Repaired' || status === 'Completed') {
      const prod = products.find((p) => p.id === ret.productId);
      if (prod && (status === 'Replaced' || status === 'Repaired')) {
        const prevBal = prod.currentStock;
        const addQty = extraDetails?.replacementQuantity || ret.replacementQuantity || ret.returnedQuantity || ret.quantity;
        const newBal = prevBal + addQty;
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, currentStock: newBal } : p))
        );
        setFgTransactions((prev) => [
          {
            id: `fgtx-${Date.now()}`,
            productId: prod.id,
            productName: prod.name,
            date: today,
            transactionType: 'Return',
            reference: ret.returnNumber,
            quantityIn: addQty,
            quantityOut: 0,
            previousBalance: prevBal,
            newBalance: newBal,
            user: activeRole === 'ADMIN' ? 'Admin' : 'Product Manager',
          },
          ...prev,
        ]);
      }
    }

    setProductReturns((prev) =>
      prev.map((r) => {
        if (r.id === id || r.returnNumber === id) {
          return {
            ...r,
            ...extraDetails,
            status,
            inspectionNotes: notes || r.inspectionNotes,
            actionTaken: actionTaken || r.actionTaken,
            defect: defect || r.defect,
            closingDate: extraDetails?.closingDate || (isClosing ? (r.closingDate || today) : r.closingDate),
          };
        }
        return r;
      })
    );

    setSalesReturns((prev) =>
      prev.map((sr) => {
        if (sr.productReturnId === id || sr.id === id || sr.returnNumber === ret.returnNumber) {
          return {
            ...sr,
            status,
            description: notes || sr.description,
            claimType: extraDetails?.claimType || sr.claimType,
            returnedQuantity: extraDetails?.returnedQuantity || sr.returnedQuantity,
            replacementQuantity: extraDetails?.replacementQuantity || sr.replacementQuantity,
            repairStatus: extraDetails?.repairStatus || sr.repairStatus,
            finalAction: extraDetails?.finalAction || sr.finalAction,
            closingDate: extraDetails?.closingDate || (isClosing ? (sr.closingDate || today) : sr.closingDate),
          };
        }
        return sr;
      })
    );

    return { success: true };
  };

  // --- STOCK ADJUSTMENT ACTIONS ---
  const applyStockAdjustmentEffect = (adj: StockAdjustment) => {
    const prod = products.find((p) => p.id === adj.productId);
    if (!prod) return;
    const today = new Date().toISOString().split('T')[0];
    const prevBal = prod.currentStock;
    const newBal = adj.physicalStock;
    const diff = adj.difference;

    setProducts((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, currentStock: newBal } : p))
    );

    const fgtx: FinishedGoodsStockTransaction = {
      id: `fgtx-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      date: today,
      transactionType: adj.reason === 'Damage' ? 'Damage' : 'Adjustment',
      reference: adj.adjustmentNumber,
      quantityIn: diff > 0 ? diff : 0,
      quantityOut: diff < 0 ? Math.abs(diff) : 0,
      previousBalance: prevBal,
      newBalance: newBal,
      user: adj.requestedBy || 'Product Manager',
    };
    setFgTransactions((prev) => [fgtx, ...prev]);
  };

  const createStockAdjustment = (adj: Omit<StockAdjustment, 'id' | 'adjustmentNumber' | 'date'>) => {
    const adjustmentNumber = `ADJ-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newId = `adj-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];

    const isAutoApprove = activeRole === 'ADMIN';

    const newAdj: StockAdjustment = {
      ...adj,
      id: newId,
      adjustmentNumber,
      date: today,
      status: isAutoApprove ? 'Approved' : 'Pending',
      approvedBy: isAutoApprove ? 'Admin' : undefined,
    };

    setStockAdjustments((prev) => [newAdj, ...prev]);

    if (isAutoApprove) {
      applyStockAdjustmentEffect(newAdj);
    }
    return { success: true };
  };

  const approveStockAdjustment = (id: string) => {
    const adj = stockAdjustments.find((a) => a.id === id);
    if (!adj || adj.status === 'Approved')
      return { success: false, message: 'Adjustment already approved or not found.' };

    setStockAdjustments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Approved', approvedBy: 'Admin' } : a))
    );
    applyStockAdjustmentEffect(adj);
    return { success: true };
  };

  // --- CENTRALIZED STOCK UPDATE (SINGLE SOURCE OF TRUTH) ---
  const updateStockQuantity = (params: {
    itemId: string;
    stockType: 'Raw Material' | 'Finished Product';
    newQuantity: number;
    reason: string;
    notes?: string;
    updatedBy?: string;
  }): { success: boolean; message?: string } => {
    const { itemId, stockType, newQuantity, reason, notes, updatedBy } = params;
    const qty = Number(newQuantity);

    if (isNaN(qty) || qty < 0) {
      return { success: false, message: 'Stock quantity must be a non-negative number.' };
    }

    // Role-based authorization (checked from activeRole and localStorage crm_user)
    let currentRole = activeRole;
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('crm_user') : null;
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role) currentRole = u.role;
      }
    } catch {}

    const isAuthorized =
      currentRole === 'ADMIN' ||
      currentRole === 'PRODUCT' ||
      currentRole === 'PRODUCTION' ||
      currentRole === 'RAW_MATERIAL' ||
      currentRole === 'STORE';

    if (!isAuthorized) {
      return {
        success: false,
        message: `Unauthorized: ${currentRole} role does not have permission to modify ${stockType} stock.`,
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const adjNum = `ADJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const user =
      updatedBy ||
      (activeRole === 'ADMIN'
        ? 'Admin'
        : activeRole === 'RAW_MATERIAL'
        ? 'Raw Material Manager'
        : activeRole === 'PRODUCT'
        ? 'Product Manager'
        : activeRole === 'STORE'
        ? 'Store Manager'
        : activeRole === 'PRODUCTION'
        ? 'Production Manager'
        : 'User');

    if (stockType === 'Raw Material') {
      const rm = rawMaterials.find((m) => m.id === itemId || m.sku === itemId);
      if (!rm) {
        return { success: false, message: 'Raw material item not found.' };
      }
      const prevQty = rm.currentStock;
      const diff = qty - prevQty;

      // 1. Single source of truth update in state
      setRawMaterials((prev) =>
        prev.map((m) => (m.id === rm.id || (rm.sku && m.sku === rm.sku) ? { ...m, currentStock: qty, lastRestocked: today } : m))
      );

      // 2. Persist to Prisma DB API in background
      fetch('/api/raw-materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rm.id, sku: rm.sku, currentStock: qty }),
      }).catch((err) => console.warn('Failed to sync updated RM stock to DB:', err));

      // 3. Create Stock Adjustment history record (Read-only single history transaction)
      const newAdj: StockAdjustment = {
        id: `adj-${Date.now()}`,
        adjustmentNumber: adjNum,
        productId: rm.id,
        productName: rm.name,
        stockCode: rm.sku,
        stockType: 'Raw Material',
        currentSystemStock: prevQty,
        physicalStock: qty,
        difference: diff,
        adjustmentType: diff >= 0 ? 'Addition' : 'Deduction',
        reason: (reason || 'Physical Stock Correction') as any,
        notes: notes || `Direct centralized stock update: ${prevQty} -> ${qty} ${rm.unit}`,
        date: today,
        status: 'Approved',
        requestedBy: user,
        approvedBy: user,
        unit: rm.unit,
        materialName: rm.name,
        previousStock: prevQty,
        newStock: qty,
        adjustedBy: user,
      };
      setStockAdjustments((prev) => [newAdj, ...prev]);

      // 4. Log Raw Material Stock Transaction
      const tx: RawMaterialStockTransaction = {
        id: `tx-${Date.now().toString().slice(-5)}`,
        materialId: rm.id,
        materialName: rm.name,
        date: today,
        transactionType: 'Adjustment',
        reference: adjNum,
        quantityIn: diff > 0 ? diff : 0,
        quantityOut: diff < 0 ? Math.abs(diff) : 0,
        previousBalance: prevQty,
        newBalance: qty,
        user,
      };
      setStockTransactions((prev) => [tx, ...prev]);

      return { success: true, message: `Successfully updated ${rm.name} stock to ${qty} ${rm.unit}.` };
    } else {
      // Finished Product
      const prod = products.find((p) => p.id === itemId || p.sku === itemId || p.productCode === itemId);
      if (!prod) {
        return { success: false, message: 'Finished product not found.' };
      }
      const prevQty = prod.currentStock;
      const diff = qty - prevQty;

      // 1. Single source of truth update in state for both products and finishedGoods
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id || p.sku === prod.sku ? { ...p, currentStock: qty } : p))
      );
      setFinishedGoods((prev) =>
        prev.map((fg) =>
          fg.id === prod.id || fg.sku === prod.sku || fg.name === prod.name
            ? { ...fg, currentStock: qty }
            : fg
        )
      );

      // 2. Persist to Prisma DB API in background
      fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prod.id,
          sku: prod.sku,
          productCode: prod.productCode,
          currentStock: qty,
        }),
      }).catch((err) => console.warn('Failed to sync updated Product stock to DB:', err));

      // 3. Create Stock Adjustment history record
      const newAdj: StockAdjustment = {
        id: `adj-${Date.now()}`,
        adjustmentNumber: adjNum,
        productId: prod.id,
        productName: prod.name,
        stockCode: prod.productCode || prod.sku,
        stockType: 'Finished Product',
        currentSystemStock: prevQty,
        physicalStock: qty,
        difference: diff,
        adjustmentType: diff >= 0 ? 'Addition' : 'Deduction',
        reason: (reason || 'Physical Stock Correction') as any,
        notes: notes || `Direct centralized stock update: ${prevQty} -> ${qty} PCS`,
        date: today,
        status: 'Approved',
        requestedBy: user,
        approvedBy: user,
        unit: 'PCS',
        materialName: prod.name,
        previousStock: prevQty,
        newStock: qty,
        adjustedBy: user,
      };
      setStockAdjustments((prev) => [newAdj, ...prev]);

      // 4. Log Finished Goods Stock Transaction
      const fgtx: FinishedGoodsStockTransaction = {
        id: `fgtx-${Date.now().toString().slice(-5)}`,
        productId: prod.id,
        productName: prod.name,
        date: today,
        transactionType: 'Adjustment',
        reference: adjNum,
        quantityIn: diff > 0 ? diff : 0,
        quantityOut: diff < 0 ? Math.abs(diff) : 0,
        previousBalance: prevQty,
        newBalance: qty,
        user,
      };
      setFgTransactions((prev) => [fgtx, ...prev]);

      return { success: true, message: `Successfully updated ${prod.name} stock to ${qty} PCS.` };
    }
  };

  const receivePurchaseOrder = (id: string) => {
    const po = purchaseOrders.find((p) => p.id === id);
    if (!po || po.status === 'Received') return;
    setRawMaterials((prev) =>
      prev.map((rm) => {
        const item = po.items.find((i) => i.rawMaterialId === rm.id);
        if (item) {
          return {
            ...rm,
            currentStock: rm.currentStock + item.quantity,
            lastRestocked: new Date().toISOString().split('T')[0],
          };
        }
        return rm;
      })
    );
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Received' } : p))
    );
  };

  // Dynamically calculate live current stock across all products based on opening, production, sales, returns, and adjustments
  const enrichedProducts = useMemo(() => {
    return products.map((p) => {
      const opening = p.openingStock ?? p.currentStock ?? 0;

      const producedCount = (productionOrders || [])
        .filter(
          (po: any) =>
            (po.productId === p.id || po.finishedGoodId === p.id || po.sku === p.sku || po.productName === p.name || po.finishedGoodName === p.name) &&
            ((po.status || '').toUpperCase() === 'COMPLETED')
        )
        .reduce((acc: number, po: any) => acc + (po.producedQuantity || po.quantityToProduce || po.plannedQuantity || 0), 0);

      const soldCount = (salesOrders || [])
        .filter((so: any) => (so.orderStatus || '').toUpperCase() !== 'CANCELLED' && (so.orderStatus || '').toUpperCase() !== 'DRAFT')
        .flatMap((so: any) => so.items || [])
        .filter((i: any) => i.productId === p.id || i.sku === p.sku || i.productName === p.name || i.finishedGoodName === p.name)
        .reduce((acc: number, i: any) => acc + (i.quantity || 0), 0);

      const returnedCount = (productReturns || [])
        .filter(
          (r: any) => (r.productId === p.id || r.sku === p.sku || r.productName === p.name) &&
          ['REPLACED', 'REPAIRED', 'ACCEPTED', 'APPROVED'].includes((r.status || '').toUpperCase())
        )
        .reduce((acc: number, r: any) => acc + (r.quantity || 0), 0) +
        (salesReturns || [])
        .filter(
          (sr: any) => (sr.productId === p.id || sr.sku === p.sku || sr.productName === p.name) &&
          ['APPROVED', 'ACCEPTED', 'COMPLETED'].includes((sr.status || '').toUpperCase())
        )
        .reduce((acc: number, sr: any) => acc + (sr.returnQuantity || sr.quantity || 0), 0);

      const damagedCount = (productReturns || [])
        .filter(
          (r: any) => (r.productId === p.id || r.sku === p.sku || r.productName === p.name) &&
          ['DAMAGED', 'SCRAPPED'].includes((r.status || '').toUpperCase())
        )
        .reduce((acc: number, r: any) => acc + (r.quantity || 0), 0);

      const adjustedVal = (stockAdjustments || [])
        .filter(
          (a: any) =>
            a.stockType !== 'Raw Material' &&
            (a.productId === p.id || a.sku === p.sku || a.stockCode === p.sku || a.stockCode === p.productCode) &&
            ['APPROVED', 'COMPLETED'].includes((a.status || '').toUpperCase())
        )
        .reduce((acc: number, a: any) => acc + (a.difference || 0), 0);

      const calculatedStock = Math.max(0, opening + producedCount + returnedCount - soldCount - damagedCount + adjustedVal);

      return {
        ...p,
        openingStock: opening,
        currentStock: calculatedStock,
      };
    });
  }, [products, productionOrders, salesOrders, productReturns, salesReturns, stockAdjustments]);

  return (
    <ERPContext.Provider
      value={{
        activeRole,
        setActiveRole,
        rawMaterials,
        finishedGoods,
        productionOrders,
        customers,
        salesOrders,
        suppliers,
        purchaseOrders,
        materialReceipts,
        materialConsumptions,
        supplierPayments,
        stockTransactions,

        // Product Management
        products: enrichedProducts,
        boms,
        productReturns,
        stockAdjustments,
        fgTransactions,

        addProduct,
        updateProduct,
        toggleProductStatus,
        deleteProduct,

        addBOM,
        updateBOM,
        createNewBOMVersion,

        checkMaterialAvailability,
        createProductionOrderFull,
        updateProductionOrderStatus,

        createProductReturn,
        updateProductReturnStatus,

        createStockAdjustment,
        approveStockAdjustment,

        // Sales Management
        leads,
        leadImportHistories,
        importLeadsBatch,
        followUps,
        invoices,
        dispatches,
        customerPayments,
        salesReturns,

        addCustomerFull,
        updateCustomerFull,
        toggleCustomerStatus,
        createLeadFull,
        updateLeadFull,
        convertLeadToCustomer,
        createFollowUpFull,
        updateFollowUpStatusFull,
        quotations,
        createQuotation,
        createQuotationFromSalesOrder,
        updateQuotationStatus,
        createInvoiceFromQuotation,
        sendInvoiceToProduction,
        updateInvoiceStatus,
        sendQuotationToProduction,
        sendQuotationToProduct,
        updateQuotation,
        deleteQuotation,
        createSalesOrderFull,
        updateSalesOrderStatusFull,
        sendSalesOrderToProduct,
        updateSalesOrderProcessing,
        createInvoiceFromSO,
        createDispatchFull,
        createCustomerPaymentFull,
        uploadCustomerPaymentProof,
        verifyCustomerPayment,
        completeCustomerPayment,
        rejectCustomerPayment,
        updatePaymentProofFiles,
        createSalesReturnFull,
        clearAllSalesData,
        clearAllSystemData,
        refreshProductsFromDB,
        refreshRawMaterialsFromDB,

        addRawMaterial,
        updateRawMaterial,
        deleteRawMaterial,
        addFinishedGood,
        updateFinishedGood,
        deleteFinishedGood,
        createProductionOrder,
        completeProductionOrder,
        addCustomer,
        updateCustomer,
        createSalesOrder,
        updateSalesOrderStatus,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        createPurchaseOrder,
        updatePurchaseOrderStatus,
        receivePurchaseOrder,
        createMaterialReceipt,
        createMaterialConsumption,
        createSupplierPayment,
        alerts,
        financials,
        hasPermission,
        generateEntityCode,
        purchaseRequests,
        createPurchaseRequest,
        updatePurchaseRequestStatus,
        updateStockQuantity,
        deductRawMaterialsForOrder,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
