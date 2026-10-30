export type UserRole = 'ADMIN' | 'SALES' | 'STORE' | 'PRODUCTION' | 'ACCOUNTS' | 'RAW_MATERIAL' | 'PRODUCT';

export interface UserPermissions {
  dashboard: boolean;
  rawMaterials: boolean;
  finishedGoods: boolean;
  bom: boolean;
  production: boolean;
  customers: boolean;
  salesOrders: boolean;
  suppliers: boolean;
  purchaseOrders: boolean;
  materialReceipts: boolean;
  materialConsumption: boolean;
  supplierPayments: boolean;
  accounts: boolean;
  reports: boolean;
  settings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  ADMIN: {
    dashboard: true,
    rawMaterials: true,
    finishedGoods: true,
    bom: true,
    production: true,
    customers: true,
    salesOrders: true,
    suppliers: true,
    purchaseOrders: true,
    materialReceipts: true,
    materialConsumption: true,
    supplierPayments: true,
    accounts: true,
    reports: true,
    settings: true,
  },
  PRODUCT: {
    dashboard: true,
    rawMaterials: true, // Read-only access to raw material info for BOM and production
    finishedGoods: true,
    bom: true,
    production: true,
    customers: false,
    salesOrders: false,
    suppliers: false,
    purchaseOrders: false,
    materialReceipts: false,
    materialConsumption: true,
    supplierPayments: false,
    accounts: false,
    reports: true,
    settings: false,
  },
  RAW_MATERIAL: {
    dashboard: true,
    rawMaterials: true,
    finishedGoods: false,
    bom: false,
    production: false,
    customers: false,
    salesOrders: false,
    suppliers: true,
    purchaseOrders: true,
    materialReceipts: true,
    materialConsumption: true,
    supplierPayments: true,
    accounts: false,
    reports: true,
    settings: false,
  },

  SALES: {
    dashboard: true,
    rawMaterials: false,
    finishedGoods: true,
    bom: false,
    production: false,
    customers: true,
    salesOrders: true,
    suppliers: false,
    purchaseOrders: false,
    materialReceipts: false,
    materialConsumption: false,
    supplierPayments: false,
    accounts: false,
    reports: false,
    settings: false,
  },
  STORE: {
    dashboard: true,
    rawMaterials: true,
    finishedGoods: true,
    bom: true,
    production: true,
    customers: false,
    salesOrders: false,
    suppliers: true,
    purchaseOrders: true,
    materialReceipts: true,
    materialConsumption: true,
    supplierPayments: false,
    accounts: false,
    reports: false,
    settings: false,
  },
  PRODUCTION: {
    dashboard: true,
    rawMaterials: true,
    finishedGoods: true,
    bom: true,
    production: true,
    customers: false,
    salesOrders: false,
    suppliers: false,
    purchaseOrders: false,
    materialReceipts: false,
    materialConsumption: true,
    supplierPayments: false,
    accounts: false,
    reports: false,
    settings: false,
  },
  ACCOUNTS: {
    dashboard: true,
    rawMaterials: false,
    finishedGoods: false,
    bom: false,
    production: false,
    customers: true,
    salesOrders: true,
    suppliers: true,
    purchaseOrders: true,
    materialReceipts: false,
    materialConsumption: false,
    supplierPayments: true,
    accounts: true,
    reports: true,
    settings: false,
  },
};

export interface RawMaterial {
  id: string;
  sku: string; // Material Code
  materialCode?: string;
  name: string;
  category: 'Connectors' | 'Wires & Cables' | 'Enclosures' | 'Chips & PCB' | 'Passive Components' | 'Packaging' | string;
  unit: 'PCS' | 'METERS' | 'BOXES' | 'SETS' | 'KG' | string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unitCost: number; // Purchase Price in INR
  supplierId?: string;
  supplierName?: string;
  location: string; // Storage Location
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  lastRestocked?: string;
}

export type StockTransactionType =
  | 'Opening Stock'
  | 'Purchase'
  | 'Material Receipt'
  | 'Material Consumption'
  | 'Damage'
  | 'Adjustment'
  | 'RAW_MATERIAL_SALE'
  | 'Raw Material Sale';

export interface RawMaterialStockTransaction {
  id: string;
  materialId: string;
  materialName: string;
  date: string;
  transactionType: StockTransactionType;
  reference: string; // e.g. PO-2026-001, REC-101, CONS-45
  quantityIn: number;
  quantityOut: number;
  previousBalance: number;
  newBalance: number;
  user: string;
}

export type PurchaseRequestStatus =
  | 'Pending'
  | 'Sent'
  | 'Supplier Confirmed'
  | 'Partially Received'
  | 'Received'
  | 'Cancelled';

export interface PurchaseRequest {
  id: string;
  requestId: string;
  rawMaterialId: string;
  rawMaterialName: string;
  sku: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  requestedQuantity: number;
  unit: string;
  notes?: string;
  date: string;
  createdBy: string;
  status: PurchaseRequestStatus;
}

export interface Supplier {
  id: string;
  supplierCode?: string;
  name: string; // Supplier Name
  companyName?: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstNumber?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  category: 'Raw Components' | 'Cable Extrusion' | 'Electronics' | 'Packaging' | string;
  totalPurchase?: number;
  totalOutstanding: number;
  paymentTerms: string;
  rawMaterialIds?: string[];
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  accountHolderName?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface PurchaseOrderItem {
  rawMaterialId: string;
  rawMaterialName: string;
  sku: string; 
  quantity: number;
  receivedQuantity?: number;
  unit?: string;
  unitCost: number;
  discountPercent?: number; 
  gstPercent?: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  invoiceNumber?: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string; 
  paymentDueDate?: string;
  items: PurchaseOrderItem[];
  subtotal?: number;
  discountAmount?: number;   
  gstAmount?: number;
  freight?: number;
  totalAmount: number;
  amountPaid: number;
  receivedQuantity?: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  status: 'Draft' | 'Pending' | 'Approved' | 'Partially Received' | 'Received' | 'Cancelled' | 'SENT' | string;
  notes?: string;
  createdBy?: string;
}

export interface MaterialReceiptItem {
  rawMaterialId: string;
  rawMaterialName: string;
  sku: string;
  orderedQuantity: number;
  previouslyReceived: number;
  remainingQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  reasonForRejection?: string;
}

export interface MaterialReceipt {
  id: string;
  receiptNumber: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  receiptDate: string;
  items: MaterialReceiptItem[];
  totalItems: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  status: 'Completed' | 'Partially Received' | 'Rejected' | 'Accepted';
  remarks?: string;
  createdBy?: string;
}

export interface MaterialConsumption {
  id: string;
  consumptionId: string;
  productionOrderId?: string;
  productionOrderNumber?: string;
  rawMaterialId: string;
  rawMaterialName: string;
  sku: string;
  quantity: number;
  unit: string;
  date: string;
  user: string;
  createdBy?: string;
  notes?: string;
}

export interface SupplierPayment {
  id: string;
  paymentId: string;
  supplierId: string;
  supplierName: string;
  billPoNumber: string;
  amount: number;
  paymentDate: string;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';
  referenceNumber: string;
  referenceNo?: string;
  notes?: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  createdBy?: string;
}

export interface BOMComponent {
  rawMaterialId: string;
  quantityRequired: number;
}

export interface FinishedGood {
  id: string;
  sku: string;
  name: string;
  modelNumber: string;
  category: 'OBD Cable' | 'OBD Splitter' | 'GPS Tracker Harness' | 'Diagnostic Adapter' | 'Custom Harness';
  currentStock: number;
  minStock: number;
  sellingPrice: number;
  manufacturingCost: number;
  bom: BOMComponent[];
  description: string;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  finishedGoodId: string;
  finishedGoodName: string;
  productId?: string;
  productName?: string;
  bomId?: string;
  bomVersion?: number;
  plannedQuantity?: number;
  producedQuantity?: number;
  quantityToProduce: number;
  status:
    | 'Draft'
    | 'Material Check'
    | 'Ready'
    | 'In Production'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'Completed'
    | 'CANCELLED'
    | 'PENDING'
    | string;
  startDate: string;
  productionDate?: string;
  expectedCompletion?: string;
  completionDate?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedEngineer: string;
  notes?: string;
}

export interface Customer {
  id: string;
  customerCode?: string;
  customerNumber?: string;
  name: string;
  companyName: string;
  customerType?: 'Distributor' | 'Fleet Owner' | 'OEM Manufacturer' | 'Retailer' | string;
  contactPerson: string;
  mobile: string;
  phone?: string;
  alternateMobile?: string;
  email: string;
  gstNumber?: string;
  gstin?: string;
  panNumber?: string;
  gstType?: 'Regular' | 'Composition' | 'Unregistered' | 'SEZ' | string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  category?: 'Distributor' | 'Fleet Owner' | 'OEM Manufacturer' | 'Retailer' | string;
  paymentTerms?: string;
  creditLimit: number;
  shippingAddress?: string;
  billingAddress?: string;
  customerSource?: 'Website' | 'Amazon' | 'IndiaMART' | 'WhatsApp' | 'Referral' | 'Dealer' | 'Distributor' | 'Other' | string;
  assignedSalesUser?: string;
  totalOrders?: number;
  totalSales?: number;
  totalPaid?: number;
  totalOutstanding: number;
  status: 'ACTIVE' | 'INACTIVE';
  lastFollowUp?: string;
  nextFollowUpDate?: string;
  lastOrderDate?: string;
  notes?: string;
  convertedFromLeadId?: string;
  createdAt?: string;
}

export type LeadSource =
  | 'Website'
  | 'Referral'
  | 'Social Media'
  | 'Advertisement'
  | 'Phone'
  | 'Email'
  | 'Walk-in'
  | 'Other';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Follow-up'
  | 'Send Quotation'
  | 'Quotation Sent'
  | 'Converted'
  | 'Lost';

export interface Lead {
  id: string;
  leadNumber: string;
  leadName?: string;
  companyName?: string;
  contactPerson?: string;
  mobile?: string;
  alternateMobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  industry?: string;
  source: LeadSource;
  salesperson?: string;
  website?: string;
  requirement?: string;
  interestedProductId?: string;
  interestedProductName?: string;
  expectedValue?: number;
  assignedUser?: string;
  status: LeadStatus;
  nextFollowUpDate?: string;
  notes?: string;
  importId?: string;
  convertedCustomerId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LeadImportHistory {
  id: string;
  fileName: string;
  importedBy: string;
  importDate: string;
  totalRows: number;
  newLeads: number;
  updatedLeads: number;
  duplicateLeads: number;
  failedRows: number;
  status: 'Completed' | 'Partially Failed' | 'Failed' | 'Success' | 'Partial';
  errorReport?: string;
  createdAt: string;
}

export type FollowUpStatus = 'Pending' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'Overdue';
export type FollowUpType = 'Call' | 'WhatsApp' | 'Email' | 'Meeting' | 'Other';

export interface FollowUp {
  id: string;
  followUpNumber: string;
  leadOrCustomerId: string;
  leadOrCustomerName: string;
  customerName?: string;
  customerNumber?: string;
  companyName?: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  quotationId?: string;
  quotationNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  type: 'Lead' | 'Customer';
  followUpDate: string;
  followUpTime: string;
  followUpType?: FollowUpType;
  purpose: string;
  notes: string;
  nextFollowUpDate?: string;
  status: FollowUpStatus;
  assignedUser: string;
  salesperson?: string;
  convertedCustomerId?: string;
  createdAt: string;
}

export type SaleType = 'PRODUCT' | 'RAW_MATERIAL' | 'Finished Product' | 'Raw Material';

export interface OrderStatusHistoryItem {
  status: string;
  updatedBy: string;
  timestamp: string;
  remarks?: string;
}

export interface SalesOrderItem {
  itemType?: 'PRODUCT' | 'RAW_MATERIAL';
  rawMaterialId?: string;
  finishedGoodId?: string;
  finishedGoodName?: string;
  productId: string;
  productName: string;
  sku: string;
  unit?: string;
  availableStock?: number;
  quantity: number;
  unitPrice: number;
  sellingPrice?: number;
  discountPercent?: number;
  discount?: number;
  gstPercent?: number;
  totalPrice: number;
  // Product Team Processing fields per item
  packingStatus?: 'Pending' | 'Processing' | 'Packed' | 'Ready for Dispatch';
  productImage?: string;
  serialNumber?: string;
  batchNumber?: string;
  productRemarks?: string;
  warrantyPeriod?: string;
}

export type SalesOrderStatus =
  | 'Draft'
  | 'Confirmed'
  | 'Sent to Product'
  | 'Sent to Production'
  | 'In Production'
  | 'Production Completed'
  | 'Packing'
  | 'Processing'
  | 'Packed'
  | 'Ready for Dispatch'
  | 'Dispatched'
  | 'Completed'
  | 'Delivered'
  | 'Cancelled';

export type SalesPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
export type SalesDispatchStatus = 'PENDING' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'Pending' | 'Ready to Dispatch' | 'Dispatched' | 'Delivered';

export type QuotationStatus =
  | 'Draft'
  | 'Sent to Customer'
  | 'Sent to Client'
  | 'Follow-up Required'
  | 'Customer Approved'
  | 'Customer Rejected'
  | 'Approved'
  | 'Confirmed'
  | 'Rejected'
  | 'Expired'
  | 'Invoice Generated'
  | 'Payment Pending'
  | 'Payment Completed'
  | 'Sent to Production'
  | 'Sent to Product'
  | 'In Production'
  | 'Production Completed'
  | 'Packing'
  | 'Packed'
  | 'Ready for Dispatch'
  | 'Dispatched'
  | 'Completed';

export type ProductionStatus =
  | 'Sent to Production'
  | 'In Production'
  | 'Production Completed'
  | 'Packing'
  | 'Packed'
  | 'Ready for Dispatch';

export interface QuotationItem {
  id?: string;
  itemType?: 'PRODUCT' | 'RAW_MATERIAL';
  productId: string;
  productName: string;
  sku: string;
  unit?: string;
  quantity: number;
  rate: number;
  discount?: number;
  gstPercent?: number;
  subtotal?: number;
  totalAmount: number;
  description?: string;
  unitPrice?: number;
  sellingPrice?: number;
  total?: number;
  warrantyPeriod?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerNumber?: string;
  quotationDate: string;
  validUntil: string;
  status: QuotationStatus;
  items: QuotationItem[];
  subtotal: number;
  discountAmount: number;
  discount?: number;
  taxAmount: number;
  totalAmount: number;
  warrantyPeriod?: string;
  termsAndConditions?: string;
  paymentMode?: 'COD' | 'Prepaid';
  notes?: string;
  salesperson?: string;
  salesOrderId?: string;
  orderNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  freightCharges?: number;
  adjustment?: number;
  contactPerson?: string;
  shippingAddress?: string;
  billingAddress?: string;
  customerGst?: string;
  customerPhone?: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  signatory?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  saleType?: SaleType;
  customerId: string;
  customerName: string;
  customerNumber?: string;
  orderDate: string;
  expectedDelivery?: string;
  dueDate: string;
  items: SalesOrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  gstAmount?: number;
  totalAmount: number;
  grandTotal: number;
  amountPaid: number;
  amountOutstanding?: number;
  paymentStatus: SalesPaymentStatus;
  dispatchStatus: SalesDispatchStatus;
  orderStatus: SalesOrderStatus;
  invoiceId?: string;
  invoiceNumber?: string;
  salesChannel?: 'Website' | 'Amazon' | 'IndiaMART' | 'Dealer' | 'Distributor' | 'WhatsApp' | 'Offline' | string;
  salesperson?: string;
  paymentMode?: 'COD' | 'Prepaid';
  shippingDetails?: string;
  pendingAmount?: number;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  // Quotation linkage
  quotationId?: string;
  quotationNumber?: string;
  // Product & Production Team Processing Fields (automatically shared with Sales)
  productionStatus?: string;
  packingStatus?: 'Pending' | 'Processing' | 'Packing' | 'Packed' | 'Ready for Dispatch' | string;
  productionNotes?: string;
  packingNotes?: string;
  productionDate?: string;
  packingDate?: string;
  productionImages?: string[];
  packedImages?: string[];
  sentToProductDate?: string;
  productTeamRemarks?: string;
  packedImage?: string;
  serialNumber?: string;
  batchNumber?: string;
  trackingNumber?: string;
  warrantyTerms?: string;
  warrantyPeriod?: string;
  rawMaterialsDeducted?: boolean;
  rawMaterialsUsed?: Array<{
    rawMaterialId: string;
    rawMaterialName: string;
    sku?: string;
    quantity: number;
    unit?: string;
    previousStock: number;
    updatedStock: number;
  }>;
  statusHistory?: OrderStatusHistoryItem[];
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  sku: string;
  unit?: string;
  quantity: number;
  rate: number;
  discount: number;
  gstPercent: number;
  subtotal: number;
  total: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  salesOrderId: string;
  salesOrderNumber: string;
  quotationId?: string;
  quotationNumber?: string;
  customerId: string;
  customerName: string;
  customerNumber?: string;
  gstNumber?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus:
    | 'Unpaid'
    | 'Partially Paid'
    | 'Paid'
    | 'PAID'
    | 'Overdue'
    | 'Payment Pending'
    | 'Payment Proof Uploaded'
    | 'Payment Verified'
    | 'Payment Completed'
    | 'Payment Rejected';
  paymentMode?: 'COD' | 'Prepaid';
  invoiceStatus?: 'Generated' | 'Sent to Customer' | 'Payment Pending' | 'Partially Paid' | 'Payment Completed' | string;
  productionStatus?: 'Sent to Production' | 'In Production' | 'Production Completed' | 'Packing' | 'Packed' | 'Ready for Dispatch' | 'Dispatched' | 'Completed' | string;
  packedImages?: string[];
  packedImage?: string;
  packingNotes?: string;
  productTeamRemarks?: string;
  productionNotes?: string;
  serialNumber?: string;
  batchNumber?: string;
  warrantyPeriod?: string;
  paymentProofFiles?: string[];
  paymentProofUploadedBy?: string;
  paymentProofUploadedDate?: string;
  paymentVerificationNotes?: string;
  paymentRejectionReason?: string;
  status: 'Active' | 'Cancelled' | 'Void';
  termsAndConditions?: string;
  notes?: string;
  billingAddress?: string;
  shippingAddress?: string;
  dueDate?: string;
  salesperson?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface DispatchItem {
  itemType?: 'PRODUCT' | 'RAW_MATERIAL';
  rawMaterialId?: string;
  productId: string;
  productName: string;
  sku: string;
  unit?: string;
  orderedQuantity: number;
  previouslyDispatched: number;
  remainingQuantity: number;
  dispatchQuantity: number;
}

export interface SalesDispatch {
  id: string;
  dispatchNumber: string;
  salesOrderId: string;
  salesOrderNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerId: string;
  customerName: string;
  dispatchDate: string;
  items: DispatchItem[];
  totalQuantity: number;
  transporter: string;
  vehicleNumber?: string;
  trackingNumber: string;
  deliveryStatus: 'Pending' | 'Ready' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Cancelled';
  remarks?: string;
  createdBy?: string;
}

export type PaymentWorkflowStatus =
  | 'Payment Pending'
  | 'Payment Proof Uploaded'
  | 'Payment Verified'
  | 'Payment Completed'
  | 'Payment Rejected'
  | 'Completed'
  | 'Pending'
  | 'Cancelled'
  | 'Paid';

export interface CustomerPayment {
  id: string;
  paymentNumber: string;
  customerId: string;
  customerName: string;
  customerNumber?: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  paymentDate: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';
  referenceNumber: string;
  notes?: string;
  proofFiles?: string[];
  uploadedBy?: string;
  uploadedDate?: string;
  status: PaymentWorkflowStatus;
  verificationNotes?: string;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  createdBy?: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  productId: string;
  productName: string;
  quantity: number;
  returnedQuantity?: number;
  replacementQuantity?: number;
  returnReason: 'Defective' | 'Wrong Product' | 'Warranty' | 'Damaged' | 'Quantity Issue' | 'Customer Requirement' | 'Other' | string;
  claimType?: 'Defective' | 'Wrong Product' | 'Warranty' | 'Transit Damage' | 'Other' | string;
  description: string;
  repairStatus?: 'Not Started' | 'Under Bench Inspection' | 'In Repair' | 'Repaired & Tested' | 'Beyond Repair (Scrapped)' | 'Completed' | string;
  finalAction?: string;
  closingDate?: string;
  returnDate: string;
  status:
    | 'Requested'
    | 'Approved'
    | 'Received'
    | 'Under Inspection'
    | 'Repair Required'
    | 'Replacement Required'
    | 'Repaired'
    | 'Replaced'
    | 'Damaged'
    | 'Refund'
    | 'Rejected'
    | 'Completed';
  productReturnId?: string;
  createdBy?: string;
}

export interface BOMItem {
  rawMaterialId: string;
  rawMaterialName: string;
  sku: string;
  unit: string;
  quantity: number;
  wastagePercent: number;
  notes?: string;
}

export interface BOM {
  id: string;
  bomNumber: string;
  productId: string;
  productName: string;
  version: number;
  items: BOMItem[];
  createdDate: string;
  status: 'Draft' | 'Active' | 'Inactive';
  createdBy?: string;
}

export interface CompatibilityItem {
  compatibleItem: string;
  notes?: string;
}

export interface ProductRawMaterialQuantity {
  rawMaterialId: string;
  rawMaterialName: string;
  sku?: string;
  unit?: string;
  quantityUsed: number;
  wastagePercent?: number;
  notes?: string;
}

export interface ProductMaster {
  id: string;
  productCode: string; // Product code, e.g., SMPL001, SMPL027
  sku: string; // Unique SKU
  name: string; // Product name
  category: string; // Category
  brand?: string; // Brand, e.g., Sunyash, MapOut24
  connectorType?: string; // Connector type, e.g., OBD-II 16-Pin Male, Deutsch 9-Pin
  cableLengthWireSpec?: string; // Cable length and wire/core specification, e.g., 1.5M 16-Core Shielded OFC Wire
  vehicleScannerCompatibility?: string; // Vehicle / scanner compatibility
  subcategory?: string;
  description?: string;
  purchaseCost: number;
  sellingPrice: number;
  discount?: number;
  gstPercent: number;
  hsnSac?: string;
  openingStock: number;
  currentStock: number; // Current stock
  minStock: number; // Minimum stock level
  maxStock: number;
  status: 'ACTIVE' | 'INACTIVE';
  imageUrl?: string; // Product image
  compatibility?: CompatibilityItem[];
  rawMaterialQuantities?: ProductRawMaterialQuantity[]; // Quantity size of raw materials used for making this product
  createdAt?: string;
}

export interface ProductReturn {
  id: string;
  returnNumber: string;
  customerName: string;
  salesInvoice: string;
  productId: string;
  productName: string;
  quantity: number;
  returnedQuantity?: number;
  replacementQuantity?: number;
  returnReason: string;
  claimType?: 'Defective' | 'Wrong Product' | 'Warranty' | 'Transit Damage' | 'Other' | string;
  defect?: string;
  inspectionNotes?: string;
  actionTaken?: string;
  repairStatus?: 'Not Started' | 'Under Bench Inspection' | 'In Repair' | 'Repaired & Tested' | 'Beyond Repair (Scrapped)' | 'Completed' | string;
  finalAction?: string;
  closingDate?: string;
  status:
    | 'Requested'
    | 'Received'
    | 'Under Inspection'
    | 'Repair Required'
    | 'Replacement Required'
    | 'Repaired'
    | 'Replaced'
    | 'Damaged'
    | 'Rejected'
    | 'Completed';
  date: string;
  createdBy?: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  productId: string;
  productName: string;
  stockCode?: string;
  stockType?: 'Raw Material' | 'Finished Product';
  currentSystemStock: number;
  physicalStock: number;
  difference: number;
  adjustmentType: 'Addition' | 'Deduction';
  reason: 'Damage' | 'Missing' | 'Counting Error' | 'Correction' | 'Other' | string;
  notes?: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedBy: string;
  approvedBy?: string;
  unit?: string;
  // Backward compatibility aliases
  materialName?: string;
  previousStock?: number;
  newStock?: number;
  adjustedBy?: string;
}

export interface FinishedGoodsStockTransaction {
  id: string;
  productId: string;
  productName: string;
  date: string;
  transactionType: 'Production' | 'Sale' | 'Return' | 'Damage' | 'Adjustment' | 'Opening Stock';
  reference: string;
  quantityIn: number;
  quantityOut: number;
  previousBalance: number;
  newBalance: number;
  user: string;
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface SystemAlert {
  id: string;
  type: 
    | 'LOW_RAW_MATERIAL'
    | 'LOW_FINISHED_GOOD'
    | 'CUSTOMER_PAYMENT_OVERDUE'
    | 'SUPPLIER_PAYMENT_DUE'
    | 'PENDING_PO'
    | 'PENDING_PRODUCTION'
    | 'CUSTOMER_FOLLOWUP_DUE'
    | 'PENDING_DISPATCH';
  title: string;
  description: string;
  severity: AlertSeverity;
  date: string;
  actionLinkModule?: string;
}

export interface FinancialSummary {
  todaySales: number;
  monthlySales: number;
  totalOrdersCount: number;
  customerOutstanding: number;
  supplierOutstanding: number;
  rawMaterialStockValue: number;
  finishedGoodsStockValue: number;
  totalProfit: number;
}



