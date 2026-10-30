import {
  LayoutDashboard,
  Boxes,
  Truck,
  ShoppingCart,
  FileCheck,
  Factory,
  CreditCard,
  BarChart3,
  Layers,
  RotateCcw,
  Sliders,
  Users,
  UserCheck,
  FileText,
  PackageCheck,
  Bell,
  Calendar,
  HandCoins,
  ClipboardList,
} from 'lucide-react';
import { NavItem } from '@/components/DashboardLayout';

export const RAW_MATERIAL_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/raw-material', icon: LayoutDashboard },
  { label: 'Stock', href: '/raw-material/stock', icon: Boxes },
  { label: 'Raw Materials', href: '/raw-material/materials', icon: Boxes },
  { label: 'Suppliers', href: '/raw-material/suppliers', icon: Truck },
  { label: 'Purchase', href: '/raw-material/purchase', icon: ShoppingCart },
  { label: 'Material Receipts', href: '/raw-material/receipts', icon: FileCheck },
  { label: 'Material Consumption', href: '/raw-material/consumption', icon: Factory },
  { label: 'Payments', href: '/raw-material/payments', icon: CreditCard },
  { label: 'Reports', href: '/raw-material/reports', icon: BarChart3 },
  { label: 'Daily Report', href: '/daily-report', icon: ClipboardList },
];

export const PRODUCT_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/product', icon: LayoutDashboard },
  { label: 'Stock', href: '/product/stock', icon: Boxes },
  { label: 'Products', href: '/product/products', icon: Boxes },
  { label: 'Production / Sales Orders', href: '/product/orders', icon: ShoppingCart },
  { label: 'BOM', href: '/product/bom', icon: Layers },
  { label: 'Finished Goods', href: '/product/finished-goods', icon: PackageCheck },
  { label: 'Returns / Replacement', href: '/product/returns', icon: RotateCcw },
  { label: 'Reports', href: '/product/reports', icon: BarChart3 },
  { label: 'Daily Report', href: '/daily-report', icon: ClipboardList },
];

export const SALES_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/sales', icon: LayoutDashboard },
  { label: 'Customers', href: '/sales/customers', icon: Users },
  { label: 'Quotations', href: '/sales/quotations', icon: FileCheck },
  { label: 'Invoices', href: '/sales/invoices', icon: FileText },
  { label: 'Sales Orders', href: '/sales/orders', icon: ShoppingCart },
  { label: 'COD Orders', href: '/sales/cod', icon: HandCoins },
  { label: 'Leads', href: '/sales/leads', icon: UserCheck },
  { label: 'Follow-ups', href: '/sales/follow-ups', icon: Calendar },
  { label: 'Payments', href: '/sales/payments', icon: CreditCard },
  { label: 'Dispatch', href: '/sales/dispatch', icon: Truck },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Executive Overview', href: '/admin#overview', icon: LayoutDashboard },
  { label: 'Stock (Centralized)', href: '/stock', icon: Boxes },
  { label: 'Sales Analytics', href: '/admin#analytics', icon: BarChart3 },
  { label: 'Salesperson Performance', href: '/admin#salespersons', icon: UserCheck },
  { label: 'Customer 360 View', href: '/admin#customer360', icon: Users },
  { label: 'Product Warranty Tracking', href: '/admin#warranty', icon: FileCheck },
  { label: 'Follow-up & Lead Alerts', href: '/admin#followups', icon: Bell },
  { label: 'Notification Center', href: '/admin#notifications', icon: Bell },
  { label: 'Admin Reports (10)', href: '/admin#reports', icon: FileText },
  { label: 'Module Control & Authority', href: '/admin#authority', icon: Factory },
];

