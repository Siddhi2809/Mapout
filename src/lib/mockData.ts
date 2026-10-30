import {
  RawMaterial,
  FinishedGood,
  ProductionOrder,
  Customer,
  SalesOrder,
  Supplier,
  PurchaseOrder,
  MaterialReceipt,
  MaterialConsumption,
  SupplierPayment,
  RawMaterialStockTransaction,
  ProductMaster,
  BOM,
  ProductReturn,
  StockAdjustment,
  FinishedGoodsStockTransaction,
  Lead,
  FollowUp,
  SalesInvoice,
  SalesDispatch,
  CustomerPayment,
  SalesReturn,
  Quotation,
} from '../types/erp';

// Clean initial empty datasets ready for fresh user-added data across all login roles
export const INITIAL_RAW_MATERIALS: RawMaterial[] = [];
export const INITIAL_FINISHED_GOODS: FinishedGood[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_SALES_ORDERS: SalesOrder[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const INITIAL_PRODUCTION_ORDERS: ProductionOrder[] = [];
export const INITIAL_MATERIAL_RECEIPTS: MaterialReceipt[] = [];
export const INITIAL_MATERIAL_CONSUMPTIONS: MaterialConsumption[] = [];
export const INITIAL_SUPPLIER_PAYMENTS: SupplierPayment[] = [];
export const INITIAL_STOCK_TRANSACTIONS: RawMaterialStockTransaction[] = [];
export const INITIAL_PRODUCTS: ProductMaster[] = [];
export const INITIAL_BOMS: BOM[] = [];
export const INITIAL_PRODUCT_RETURNS: ProductReturn[] = [];
export const INITIAL_STOCK_ADJUSTMENTS: StockAdjustment[] = [];
export const INITIAL_FG_TRANSACTIONS: FinishedGoodsStockTransaction[] = [];
export const INITIAL_LEADS: Lead[] = [];
export const INITIAL_FOLLOWUPS: FollowUp[] = [];
export const INITIAL_INVOICES: SalesInvoice[] = [];
export const INITIAL_DISPATCHES: SalesDispatch[] = [];
export const INITIAL_CUSTOMER_PAYMENTS: CustomerPayment[] = [];
export const INITIAL_SALES_RETURNS: SalesReturn[] = [];
export const INITIAL_QUOTATIONS: Quotation[] = [];
