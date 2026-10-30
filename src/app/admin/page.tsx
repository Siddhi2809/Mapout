'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { NavItem } from '@/components/DashboardLayout';
import { ADMIN_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { INDIAN_STATES } from '@/lib/indiaGeo';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Truck,
  CreditCard,
  Wallet,
  Users,
  UserCheck,
  RotateCcw,
  ArrowRight,
  PlusCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Boxes,
  FileText,
  PackageCheck,
  Layers,
  Factory,
  Bell,
  Search,
  Filter,
  Calendar,
  Download,
  Printer,
  Eye,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  ShieldCheck,
  Award,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  MapPin,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  FileSpreadsheet,
  AlertCircle,
  ArrowUpRight,
  CheckCheck,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart2,
  Activity,
  UserPlus,
} from 'lucide-react';
import { SalesOrder, Customer, FollowUp, ProductMaster, RawMaterial } from '@/types/erp';

// Type definitions for warranty and alerts
interface WarrantyRecord {
  id: string;
  orderNumber: string;
  productId: string;
  productName: string;
  sku: string;
  serialNumber: string;
  batchNumber: string;
  customerId: string;
  customerName: string;
  customerState?: string;
  customerCity?: string;
  purchaseDate: string;
  warrantyPeriod: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  daysRemaining: number;
  status: 'Active' | 'Expiring Soon' | 'Expired';
}

interface AdminAlertItem {
  id: string;
  category: 'Warranty' | 'Follow-up' | 'Payment' | 'Stock' | 'Order';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  timestamp: string;
  actionType: 'customer' | 'order' | 'stock' | 'followup' | 'payment';
  targetId?: string;
  targetCustomerName?: string;
}

export default function CentralizedAdminDashboard() {
  const {
    customers,
    salesOrders,
    products,
    rawMaterials,
    leads,
    followUps,
    invoices,
    dispatches,
    customerPayments,
    productReturns,
    purchaseOrders,
    suppliers,
    updateSalesOrderStatusFull,
    sendSalesOrderToProduct,
    createFollowUpFull,
    updateFollowUpStatusFull,
    refreshProductsFromDB,
    refreshRawMaterialsFromDB,
  } = useERP();

  // Refresh products & raw materials from database on load
  useEffect(() => {
    refreshProductsFromDB();
    refreshRawMaterialsFromDB();
  }, []);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'analytics' | 'salespersons' | 'customer360' | 'warranty' | 'followups' | 'notifications' | 'reports' | 'authority'
  >('overview');

  // ==========================================
  // GLOBAL FILTERS STATE
  // ==========================================
  const [filterState, setFilterState] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterCustomerId, setFilterCustomerId] = useState<string>('');
  const [filterSalesperson, setFilterSalesperson] = useState<string>('');
  const [filterProductId, setFilterProductId] = useState<string>('');
  const [filterSaleType, setFilterSaleType] = useState<string>('');
  const [filterChannel, setFilterChannel] = useState<string>('');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showFilterBar, setShowFilterBar] = useState<boolean>(true);

  // Active Reports Tab
  const [activeReportId, setActiveReportId] = useState<string>('sales');
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');

  // Modals & Drilldown State
  const [selectedSalespersonForHistory, setSelectedSalespersonForHistory] = useState<string | null>(null);
  const [selectedCustomerFor360, setSelectedCustomerFor360] = useState<Customer | null>(null);
  const [followUpModalCustomer, setFollowUpModalCustomer] = useState<{ id: string; name: string; type: 'Customer' | 'Lead' } | null>(null);
  const [followUpFormPurpose, setFollowUpFormPurpose] = useState('');
  const [followUpFormDate, setFollowUpFormDate] = useState(todayStr);
  const [followUpFormTime, setFollowUpFormTime] = useState('10:00 AM');
  const [followUpFormNotes, setFollowUpFormNotes] = useState('');
  const [followUpFormUser, setFollowUpFormUser] = useState('Admin');

  // Notification Acknowledgment State (persisted in localStorage)
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<string[]>([]);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('unread');
  const [toastAlert, setToastAlert] = useState<AdminAlertItem | null>(null);

  // Load Acknowledged alerts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_acknowledged_alerts_v2');
      if (stored) {
        setAcknowledgedAlertIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const acknowledgeAlert = (id: string) => {
    setAcknowledgedAlertIds((prev) => {
      const updated = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem('admin_acknowledged_alerts_v2', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const acknowledgeAllAlerts = (ids: string[]) => {
    setAcknowledgedAlertIds((prev) => {
      const updated = Array.from(new Set([...prev, ...ids]));
      try {
        localStorage.setItem('admin_acknowledged_alerts_v2', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Reset all filters
  const resetAllFilters = () => {
    setFilterState('');
    setFilterCity('');
    setFilterCustomerId('');
    setFilterSalesperson('');
    setFilterProductId('');
    setFilterSaleType('');
    setFilterChannel('');
    setFilterDateRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const activeFilterCount = [
    filterState,
    filterCity,
    filterCustomerId,
    filterSalesperson,
    filterProductId,
    filterSaleType,
    filterChannel,
    filterDateRange !== 'all' ? filterDateRange : '',
  ].filter(Boolean).length;

  // Available Cities based on selected State
  const availableCities = useMemo(() => {
    if (!filterState) {
      // Aggregate all cities from existing customers
      const set = new Set<string>();
      customers.forEach((c) => {
        if (c.city) set.add(c.city);
      });
      return Array.from(set).sort();
    }
    const foundState = INDIAN_STATES.find((s) => s.name.toLowerCase() === filterState.toLowerCase());
    const geoCities = foundState ? foundState.cities : [];
    // Also include any customer city recorded under this state
    const customerCitiesInState = customers
      .filter((c) => c.state?.toLowerCase() === filterState.toLowerCase() && c.city)
      .map((c) => c.city);
    return Array.from(new Set([...geoCities, ...customerCitiesInState])).sort();
  }, [filterState, customers]);

  // Unique Salespersons from Orders & Leads
  const availableSalespersons = useMemo(() => {
    const set = new Set<string>();
    salesOrders.forEach((o) => {
      if (o.salesperson) set.add(o.salesperson);
      if (o.createdBy) set.add(o.createdBy);
    });
    customers.forEach((c) => {
      if (c.assignedSalesUser) set.add(c.assignedSalesUser);
    });
    leads.forEach((l) => {
      if (l.assignedUser) set.add(l.assignedUser);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [salesOrders, customers, leads]);

  // Customer map for rapid lookup
  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach((c) => {
      map.set(c.id, c);
      if (c.customerCode) map.set(c.customerCode, c);
    });
    return map;
  }, [customers]);

  // ==========================================
  // FILTERED DATA ENGINE
  // ==========================================
  const filteredSalesOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      const cust = customerMap.get(order.customerId);

      // State Filter
      if (filterState) {
        const orderState = cust?.state || '';
        if (orderState.toLowerCase() !== filterState.toLowerCase()) return false;
      }

      // City Filter
      if (filterCity) {
        const orderCity = cust?.city || '';
        if (orderCity.toLowerCase() !== filterCity.toLowerCase()) return false;
      }

      // Customer Filter
      if (filterCustomerId) {
        if (order.customerId !== filterCustomerId && order.customerName !== filterCustomerId) return false;
      }

      // Salesperson Filter
      if (filterSalesperson) {
        const sp = (order.salesperson || order.createdBy || '').toLowerCase();
        if (!sp.includes(filterSalesperson.toLowerCase())) return false;
      }

      // Product / Raw Material Filter
      if (filterProductId) {
        const hasItem = order.items.some(
          (i) => i.productId === filterProductId || i.rawMaterialId === filterProductId || i.sku === filterProductId
        );
        if (!hasItem) return false;
      }

      // Sale Type Filter
      if (filterSaleType) {
        if (filterSaleType === 'RAW_MATERIAL') {
          const isRM =
            order.saleType === 'RAW_MATERIAL' ||
            order.saleType === 'Raw Material' ||
            order.items.some((i) => i.itemType === 'RAW_MATERIAL' || i.rawMaterialId);
          if (!isRM) return false;
        } else if (filterSaleType === 'PRODUCT') {
          const isFG =
            order.saleType === 'PRODUCT' ||
            order.saleType === 'Finished Product' ||
            order.items.some((i) => i.itemType === 'PRODUCT' || !i.rawMaterialId);
          if (!isFG) return false;
        }
      }

      // Sales Channel Filter
      if (filterChannel) {
        if ((order.salesChannel || 'Website').toLowerCase() !== filterChannel.toLowerCase()) return false;
      }

      // Date Range Filter
      if (filterDateRange !== 'all') {
        const oDate = order.orderDate;
        if (filterDateRange === 'today') {
          if (oDate !== todayStr) return false;
        } else if (filterDateRange === 'week') {
          const orderTime = new Date(oDate).getTime();
          const sevenDaysAgo = today.getTime() - 7 * 24 * 60 * 60 * 1000;
          if (orderTime < sevenDaysAgo) return false;
        } else if (filterDateRange === 'month') {
          if (!oDate.startsWith(currentMonthStr)) return false;
        } else if (filterDateRange === 'year') {
          if (!oDate.startsWith(todayStr.substring(0, 4))) return false;
        } else if (filterDateRange === 'custom') {
          if (customStartDate && oDate < customStartDate) return false;
          if (customEndDate && oDate > customEndDate) return false;
        }
      }

      return true;
    });
  }, [
    salesOrders,
    customerMap,
    filterState,
    filterCity,
    filterCustomerId,
    filterSalesperson,
    filterProductId,
    filterSaleType,
    filterChannel,
    filterDateRange,
    customStartDate,
    customEndDate,
    todayStr,
    currentMonthStr,
  ]);

  // Filtered Customers based on State/City/Salesperson
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (filterState && (c.state || '').toLowerCase() !== filterState.toLowerCase()) return false;
      if (filterCity && (c.city || '').toLowerCase() !== filterCity.toLowerCase()) return false;
      if (filterSalesperson && (c.assignedSalesUser || '').toLowerCase() !== filterSalesperson.toLowerCase()) return false;
      return true;
    });
  }, [customers, filterState, filterCity, filterSalesperson]);

  // ==========================================
  // REAL-TIME KPI VALUES (Derived directly from DB)
  // ==========================================
  const totalSalesAmount = useMemo(() => {
    return filteredSalesOrders
      .filter((o) => o.orderStatus !== 'Cancelled')
      .reduce((acc, o) => acc + (o.grandTotal || o.totalAmount || 0), 0);
  }, [filteredSalesOrders]);

  const todaySalesAmount = useMemo(() => {
    return filteredSalesOrders
      .filter((o) => o.orderDate === todayStr && o.orderStatus !== 'Cancelled')
      .reduce((acc, o) => acc + (o.grandTotal || o.totalAmount || 0), 0);
  }, [filteredSalesOrders, todayStr]);

  const monthlySalesAmount = useMemo(() => {
    return filteredSalesOrders
      .filter((o) => o.orderDate.startsWith(currentMonthStr) && o.orderStatus !== 'Cancelled')
      .reduce((acc, o) => acc + (o.grandTotal || o.totalAmount || 0), 0);
  }, [filteredSalesOrders, currentMonthStr]);

  const pendingPaymentsAmount = useMemo(() => {
    return filteredSalesOrders
      .filter((o) => o.orderStatus !== 'Cancelled')
      .reduce((acc, o) => {
        const remaining = (o.grandTotal || o.totalAmount || 0) - (o.amountPaid || 0);
        return acc + (remaining > 0 ? remaining : 0);
      }, 0);
  }, [filteredSalesOrders]);

  const totalCustomersCount = filteredCustomers.length;

  const newCustomersCount = useMemo(() => {
    return filteredCustomers.filter((c) => {
      if (!c.createdAt) return false;
      const createdDate = c.createdAt.substring(0, 10);
      return createdDate.startsWith(currentMonthStr);
    }).length;
  }, [filteredCustomers, currentMonthStr]);

  const totalProductsCount = products.length;

  const lowStockRawMaterialsCount = useMemo(() => {
    return rawMaterials.filter((rm) => rm.currentStock <= rm.minStock).length;
  }, [rawMaterials]);

  const lowStockFinishedGoodsCount = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minStock).length;
  }, [products]);

  const pendingSalesOrdersCount = useMemo(() => {
    return filteredSalesOrders.filter((o) =>
      ['Draft', 'Confirmed', 'Processing', 'CONFIRMED'].includes(o.orderStatus)
    ).length;
  }, [filteredSalesOrders]);

  const ordersPendingFromProductTeamCount = useMemo(() => {
    return filteredSalesOrders.filter(
      (o) => o.orderStatus === 'Sent to Product' || o.orderStatus === 'Processing'
    ).length;
  }, [filteredSalesOrders]);

  const readyForDispatchOrdersCount = useMemo(() => {
    return filteredSalesOrders.filter(
      (o) =>
        o.orderStatus === 'Ready for Dispatch' ||
        o.dispatchStatus === 'Ready to Dispatch' ||
        o.dispatchStatus === 'PACKED'
    ).length;
  }, [filteredSalesOrders]);

  // ==========================================
  // WARRANTY ENGINE (Real-time Calculation)
  // ==========================================
  const warrantyRecords: WarrantyRecord[] = useMemo(() => {
    const list: WarrantyRecord[] = [];

    filteredSalesOrders.forEach((order) => {
      if (order.orderStatus === 'Cancelled') return;
      const cust = customerMap.get(order.customerId);

      order.items.forEach((item, index) => {
        // Only finished products have warranty (standard 12 months)
        if (item.rawMaterialId || item.itemType === 'RAW_MATERIAL') return;

        const pDate = new Date(order.orderDate);
        const wStartDate = order.orderDate;

        const wEndDate = new Date(pDate);
        wEndDate.setFullYear(wEndDate.getFullYear() + 1);
        const wEndDateStr = wEndDate.toISOString().split('T')[0];

        const diffTime = wEndDate.getTime() - new Date(todayStr).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status: 'Active' | 'Expiring Soon' | 'Expired';
        if (diffDays < 0) {
          status = 'Expired';
        } else if (diffDays <= 30) {
          status = 'Expiring Soon';
        } else {
          status = 'Active';
        }

        const serialNumber =
          item.serialNumber ||
          order.serialNumber ||
          `SN-${order.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}-${index + 1}`;

        const batchNumber =
          item.batchNumber ||
          order.batchNumber ||
          `BAT-${order.orderDate.replace(/-/g, '')}`;

        list.push({
          id: `${order.id}-${item.productId || item.sku}-${index}`,
          orderNumber: order.orderNumber,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          serialNumber,
          batchNumber,
          customerId: order.customerId,
          customerName: order.customerName,
          customerState: cust?.state,
          customerCity: cust?.city,
          purchaseDate: order.orderDate,
          warrantyPeriod: '12 Months',
          warrantyStartDate: wStartDate,
          warrantyEndDate: wEndDateStr,
          daysRemaining: diffDays,
          status,
        });
      });
    });

    return list;
  }, [filteredSalesOrders, customerMap, todayStr]);

  const expiringWarrantiesCount = useMemo(() => {
    return warrantyRecords.filter((w) => w.status === 'Expiring Soon').length;
  }, [warrantyRecords]);

  const expiredWarrantiesCount = useMemo(() => {
    return warrantyRecords.filter((w) => w.status === 'Expired').length;
  }, [warrantyRecords]);

  // ==========================================
  // FOLLOW-UPS & LEADS ENGINE
  // ==========================================
  const todayFollowUpsList = useMemo(() => {
    return followUps.filter((f) => f.followUpDate === todayStr && f.status === 'Pending');
  }, [followUps, todayStr]);

  const overdueFollowUpsList = useMemo(() => {
    return followUps.filter((f) => f.followUpDate < todayStr && f.status === 'Pending');
  }, [followUps, todayStr]);

  const upcomingFollowUpsList = useMemo(() => {
    return followUps.filter((f) => f.followUpDate > todayStr && f.status === 'Pending');
  }, [followUps, todayStr]);

  const customersWithNoFollowUpList = useMemo(() => {
    return filteredCustomers.filter((c) => !c.lastFollowUp && !c.nextFollowUpDate);
  }, [filteredCustomers]);

  const leadsRequiringFollowUpList = useMemo(() => {
    return leads.filter((l) => ['New', 'Contacted', 'Interested', 'Follow-up'].includes(l.status));
  }, [leads]);

  // ==========================================
  // NOTIFICATION CENTER ENGINE
  // ==========================================
  const allGeneratedAlerts: AdminAlertItem[] = useMemo(() => {
    const alerts: AdminAlertItem[] = [];

    // 1. Warranty Alerts
    warrantyRecords.forEach((w) => {
      if (w.status === 'Expiring Soon') {
        alerts.push({
          id: `w-expiring-${w.id}`,
          category: 'Warranty',
          title: `Warranty Expiring Soon`,
          description: `Warranty Expiring Soon: ${w.productName} for ${w.customerName} – ${w.daysRemaining} days remaining.`,
          severity: 'WARNING',
          timestamp: w.warrantyEndDate,
          actionType: 'customer',
          targetId: w.customerId,
          targetCustomerName: w.customerName,
        });
      } else if (w.status === 'Expired') {
        alerts.push({
          id: `w-expired-${w.id}`,
          category: 'Warranty',
          title: `Warranty Expired`,
          description: `Warranty Expired: ${w.productName} for ${w.customerName} – Contact Customer.`,
          severity: 'CRITICAL',
          timestamp: w.warrantyEndDate,
          actionType: 'customer',
          targetId: w.customerId,
          targetCustomerName: w.customerName,
        });
      }
    });

    // 2. Follow-up Alerts
    overdueFollowUpsList.forEach((f) => {
      alerts.push({
        id: `f-overdue-${f.id}`,
        category: 'Follow-up',
        title: `Overdue Follow-up`,
        description: `Overdue follow-up with ${f.leadOrCustomerName} (Due: ${f.followUpDate}): "${f.purpose}"`,
        severity: 'CRITICAL',
        timestamp: f.followUpDate,
        actionType: 'followup',
        targetId: f.leadOrCustomerId,
        targetCustomerName: f.leadOrCustomerName,
      });
    });

    todayFollowUpsList.forEach((f) => {
      alerts.push({
        id: `f-today-${f.id}`,
        category: 'Follow-up',
        title: `Follow-up Due Today`,
        description: `Follow-up scheduled today at ${f.followUpTime} with ${f.leadOrCustomerName} – ${f.purpose}`,
        severity: 'WARNING',
        timestamp: f.followUpDate,
        actionType: 'followup',
        targetId: f.leadOrCustomerId,
        targetCustomerName: f.leadOrCustomerName,
      });
    });

    // 3. Payment Overdue Alerts
    invoices.forEach((inv) => {
      if (inv.paymentStatus === 'Overdue' || (inv.outstandingAmount > 0 && inv.status === 'Active')) {
        alerts.push({
          id: `inv-overdue-${inv.id}`,
          category: 'Payment',
          title: `Payment Overdue`,
          description: `Invoice ${inv.invoiceNumber} for ${inv.customerName} has pending amount of ₹${inv.outstandingAmount.toLocaleString('en-IN')}.`,
          severity: 'CRITICAL',
          timestamp: inv.invoiceDate,
          actionType: 'payment',
          targetId: inv.customerId,
          targetCustomerName: inv.customerName,
        });
      }
    });

    // 4. Low Stock Alerts
    rawMaterials.forEach((rm) => {
      if (rm.currentStock <= rm.minStock) {
        alerts.push({
          id: `stock-rm-${rm.id}`,
          category: 'Stock',
          title: `Low Raw Material Stock`,
          description: `Raw Material ${rm.name} (${rm.sku}) is below minimum stock level (${rm.currentStock} / ${rm.minStock} ${rm.unit}).`,
          severity: 'CRITICAL',
          timestamp: todayStr,
          actionType: 'stock',
          targetId: rm.id,
        });
      }
    });

    products.forEach((p) => {
      if (p.currentStock <= p.minStock) {
        alerts.push({
          id: `stock-fg-${p.id}`,
          category: 'Stock',
          title: `Low Finished Goods Stock`,
          description: `Finished Good ${p.name} (${p.sku}) stock (${p.currentStock}) is at or below minimum threshold (${p.minStock}).`,
          severity: 'WARNING',
          timestamp: todayStr,
          actionType: 'stock',
          targetId: p.id,
        });
      }
    });

    // 5. Order Alerts
    filteredSalesOrders.forEach((o) => {
      if (o.orderStatus === 'Sent to Product' || o.orderStatus === 'Processing') {
        alerts.push({
          id: `order-prod-${o.id}`,
          category: 'Order',
          title: `Product Team Pending Order`,
          description: `Sales Order ${o.orderNumber} for ${o.customerName} is pending with Product Team.`,
          severity: 'INFO',
          timestamp: o.orderDate,
          actionType: 'order',
          targetId: o.id,
        });
      } else if (o.orderStatus === 'Ready for Dispatch' || o.dispatchStatus === 'Ready to Dispatch') {
        alerts.push({
          id: `order-ready-${o.id}`,
          category: 'Order',
          title: `Ready for Dispatch`,
          description: `Order ${o.orderNumber} for ${o.customerName} is packed & ready for dispatch.`,
          severity: 'INFO',
          timestamp: o.orderDate,
          actionType: 'order',
          targetId: o.id,
        });
      }
    });

    return alerts;
  }, [
    warrantyRecords,
    overdueFollowUpsList,
    todayFollowUpsList,
    invoices,
    rawMaterials,
    products,
    filteredSalesOrders,
    todayStr,
  ]);

  // Unread alerts count
  const unacknowledgedAlerts = useMemo(() => {
    return allGeneratedAlerts.filter((a) => !acknowledgedAlertIds.includes(a.id));
  }, [allGeneratedAlerts, acknowledgedAlertIds]);

  // Trigger Toast on top if unread critical alerts exist
  useEffect(() => {
    if (unacknowledgedAlerts.length > 0 && !toastAlert) {
      const firstCritical = unacknowledgedAlerts.find((a) => a.severity === 'CRITICAL') || unacknowledgedAlerts[0];
      setToastAlert(firstCritical);
    }
  }, [unacknowledgedAlerts, toastAlert]);

  // ==========================================
  // SALESPERSON PERFORMANCE ENGINE
  // ==========================================
  const salespersonPerformanceData = useMemo(() => {
    const spMap = new Map<
      string,
      {
        name: string;
        totalOrders: number;
        todayOrders: number;
        totalSalesAmount: number;
        todaySalesAmount: number;
        monthlySalesAmount: number;
        pendingOrders: number;
        pendingFollowUps: number;
      }
    >();

    availableSalespersons.forEach((name) => {
      spMap.set(name, {
        name,
        totalOrders: 0,
        todayOrders: 0,
        totalSalesAmount: 0,
        todaySalesAmount: 0,
        monthlySalesAmount: 0,
        pendingOrders: 0,
        pendingFollowUps: 0,
      });
    });

    filteredSalesOrders.forEach((order) => {
      const spName = order.salesperson || order.createdBy || 'Direct Sales';
      if (!spMap.has(spName)) {
        spMap.set(spName, {
          name: spName,
          totalOrders: 0,
          todayOrders: 0,
          totalSalesAmount: 0,
          todaySalesAmount: 0,
          monthlySalesAmount: 0,
          pendingOrders: 0,
          pendingFollowUps: 0,
        });
      }
      const data = spMap.get(spName)!;
      data.totalOrders += 1;
      const orderAmount = order.grandTotal || order.totalAmount || 0;
      data.totalSalesAmount += orderAmount;

      if (order.orderDate === todayStr) {
        data.todayOrders += 1;
        data.todaySalesAmount += orderAmount;
      }

      if (order.orderDate.startsWith(currentMonthStr)) {
        data.monthlySalesAmount += orderAmount;
      }

      if (['Draft', 'Confirmed', 'Processing', 'Sent to Product'].includes(order.orderStatus)) {
        data.pendingOrders += 1;
      }
    });

    followUps.forEach((f) => {
      if (f.status === 'Pending' && f.assignedUser && spMap.has(f.assignedUser)) {
        spMap.get(f.assignedUser)!.pendingFollowUps += 1;
      }
    });

    return Array.from(spMap.values()).sort((a, b) => b.totalSalesAmount - a.totalSalesAmount);
  }, [availableSalespersons, filteredSalesOrders, followUps, todayStr, currentMonthStr]);

  // Complete sales history for selected salesperson in drilldown modal
  const selectedSalespersonOrders = useMemo(() => {
    if (!selectedSalespersonForHistory) return [];
    return salesOrders.filter(
      (o) =>
        (o.salesperson || '').toLowerCase() === selectedSalespersonForHistory.toLowerCase() ||
        (o.createdBy || '').toLowerCase() === selectedSalespersonForHistory.toLowerCase()
    );
  }, [salesOrders, selectedSalespersonForHistory]);

  // ==========================================
  // SALES ANALYTICS ENGINE
  // ==========================================
  // Raw Material vs Finished Good breakdown
  const salesByType = useMemo(() => {
    let finishedGoodAmount = 0;
    let finishedGoodCount = 0;
    let rawMaterialAmount = 0;
    let rawMaterialCount = 0;

    filteredSalesOrders.forEach((o) => {
      if (o.orderStatus === 'Cancelled') return;
      o.items.forEach((item) => {
        if (item.rawMaterialId || item.itemType === 'RAW_MATERIAL') {
          rawMaterialAmount += item.totalPrice;
          rawMaterialCount += item.quantity;
        } else {
          finishedGoodAmount += item.totalPrice;
          finishedGoodCount += item.quantity;
        }
      });
    });

    const total = finishedGoodAmount + rawMaterialAmount || 1;
    return {
      finishedGoodAmount,
      finishedGoodCount,
      finishedGoodPercent: Math.round((finishedGoodAmount / total) * 100),
      rawMaterialAmount,
      rawMaterialCount,
      rawMaterialPercent: Math.round((rawMaterialAmount / total) * 100),
    };
  }, [filteredSalesOrders]);

  // Channel-wise sales
  const channelWiseSales = useMemo(() => {
    const map = new Map<string, { channel: string; amount: number; count: number }>();
    filteredSalesOrders.forEach((o) => {
      if (o.orderStatus === 'Cancelled') return;
      const ch = o.salesChannel || 'Website';
      if (!map.has(ch)) map.set(ch, { channel: ch, amount: 0, count: 0 });
      const record = map.get(ch)!;
      record.amount += o.grandTotal || o.totalAmount || 0;
      record.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredSalesOrders]);

  // Product-wise sales ranking
  const productWiseSales = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sku: string; units: number; amount: number }>();
    filteredSalesOrders.forEach((o) => {
      if (o.orderStatus === 'Cancelled') return;
      o.items.forEach((item) => {
        const key = item.productId || item.rawMaterialId || item.sku;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            name: item.productName,
            sku: item.sku,
            units: 0,
            amount: 0,
          });
        }
        const record = map.get(key)!;
        record.units += item.quantity;
        record.amount += item.totalPrice;
      });
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredSalesOrders]);

  // State-wise sales ranking
  const stateWiseSales = useMemo(() => {
    const map = new Map<string, { state: string; amount: number; orderCount: number; customerCount: Set<string> }>();
    filteredSalesOrders.forEach((o) => {
      if (o.orderStatus === 'Cancelled') return;
      const cust = customerMap.get(o.customerId);
      const st = cust?.state || 'Other States';
      if (!map.has(st)) {
        map.set(st, { state: st, amount: 0, orderCount: 0, customerCount: new Set() });
      }
      const record = map.get(st)!;
      record.amount += o.grandTotal || o.totalAmount || 0;
      record.orderCount += 1;
      if (o.customerId) record.customerCount.add(o.customerId);
    });
    return Array.from(map.values()).map((v) => ({
      state: v.state,
      amount: v.amount,
      orderCount: v.orderCount,
      uniqueCustomers: v.customerCount.size,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredSalesOrders, customerMap]);

  // Customer-wise sales ranking
  const customerWiseSales = useMemo(() => {
    const map = new Map<string, { id: string; name: string; city: string; state: string; amount: number; orderCount: number }>();
    filteredSalesOrders.forEach((o) => {
      if (o.orderStatus === 'Cancelled') return;
      const cust = customerMap.get(o.customerId);
      const key = o.customerId || o.customerName;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: o.customerName,
          city: cust?.city || '',
          state: cust?.state || '',
          amount: 0,
          orderCount: 0,
        });
      }
      const record = map.get(key)!;
      record.amount += o.grandTotal || o.totalAmount || 0;
      record.orderCount += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredSalesOrders, customerMap]);

  // ==========================================
  // CUSTOMER 360 AGGREGATE CALCULATOR
  // ==========================================
  const customer360Data = useMemo(() => {
    if (!selectedCustomerFor360) return null;
    const cust = selectedCustomerFor360;

    const orders = salesOrders.filter((o) => o.customerId === cust.id || o.customerName === cust.name);
    const invoicesList = invoices.filter((i) => i.customerId === cust.id || i.customerName === cust.name);
    const paymentsList = customerPayments.filter((p) => p.customerId === cust.id || p.customerName === cust.name);
    const followUpsList = followUps.filter((f) => f.leadOrCustomerId === cust.id || f.leadOrCustomerName === cust.name);
    const returnsList = productReturns.filter((r) => r.customerName === cust.name);
    const warrantiesList = warrantyRecords.filter((w) => w.customerId === cust.id || w.customerName === cust.name);

    // Collect all purchased items (Products & Raw Materials)
    const purchasedProducts: { name: string; sku: string; qty: number; amount: number; date: string; invoiceNo?: string }[] = [];
    const purchasedRawMaterials: { name: string; sku: string; qty: number; amount: number; date: string; invoiceNo?: string }[] = [];

    orders.forEach((o) => {
      o.items.forEach((item) => {
        const itemObj = {
          name: item.productName,
          sku: item.sku,
          qty: item.quantity,
          amount: item.totalPrice,
          date: o.orderDate,
          invoiceNo: o.invoiceNumber,
        };
        if (item.rawMaterialId || item.itemType === 'RAW_MATERIAL') {
          purchasedRawMaterials.push(itemObj);
        } else {
          purchasedProducts.push(itemObj);
        }
      });
    });

    return {
      customer: cust,
      orders,
      invoicesList,
      paymentsList,
      followUpsList,
      returnsList,
      warrantiesList,
      purchasedProducts,
      purchasedRawMaterials,
    };
  }, [selectedCustomerFor360, salesOrders, invoices, customerPayments, followUps, productReturns, warrantyRecords]);

  // ==========================================
  // CSV EXPORT GENERATOR
  // ==========================================
  const handleExportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Submit Add Follow-up
  const handleSaveFollowUp = () => {
    if (!followUpModalCustomer) return;
    createFollowUpFull({
      leadOrCustomerId: followUpModalCustomer.id,
      leadOrCustomerName: followUpModalCustomer.name,
      type: followUpModalCustomer.type,
      followUpDate: followUpFormDate,
      followUpTime: followUpFormTime,
      purpose: followUpFormPurpose || 'Admin Follow-up',
      notes: followUpFormNotes,
      status: 'Pending',
      assignedUser: followUpFormUser,
    });
    setFollowUpModalCustomer(null);
    setFollowUpFormPurpose('');
    setFollowUpFormNotes('');
  };

  const adminNavItems: NavItem[] = [
    {
      label: 'Executive Overview',
      icon: LayoutDashboard,
      isActive: activeTab === 'overview',
      onClick: () => setActiveTab('overview'),
    },
    {
      label: 'Sales Analytics',
      icon: BarChart2,
      isActive: activeTab === 'analytics',
      onClick: () => setActiveTab('analytics'),
    },
    {
      label: 'Salesperson Performance',
      icon: Award,
      isActive: activeTab === 'salespersons',
      onClick: () => setActiveTab('salespersons'),
    },
    {
      label: 'Customer 360 View',
      icon: Users,
      isActive: activeTab === 'customer360',
      onClick: () => setActiveTab('customer360'),
    },
    {
      label: 'Product Warranty Tracking',
      icon: ShieldCheck,
      badge: expiringWarrantiesCount > 0 ? expiringWarrantiesCount : undefined,
      isActive: activeTab === 'warranty',
      onClick: () => setActiveTab('warranty'),
    },
    {
      label: 'Follow-up & Lead Alerts',
      icon: UserCheck,
      badge: overdueFollowUpsList.length > 0 ? overdueFollowUpsList.length : undefined,
      isActive: activeTab === 'followups',
      onClick: () => setActiveTab('followups'),
    },
    {
      label: 'Notification Center',
      icon: Bell,
      badge: unacknowledgedAlerts.length > 0 ? unacknowledgedAlerts.length : undefined,
      isActive: activeTab === 'notifications',
      onClick: () => setActiveTab('notifications'),
    },
    {
      label: 'Admin Reports (10)',
      icon: FileSpreadsheet,
      isActive: activeTab === 'reports',
      onClick: () => setActiveTab('reports'),
    },
    {
      label: 'Module Control & Authority',
      icon: ShieldAlert,
      isActive: activeTab === 'authority',
      onClick: () => setActiveTab('authority'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert for Critical Unacknowledged Notifications */}
      {toastAlert && (
        <div className="fixed top-20 right-6 z-50 max-w-md w-full bg-slate-900 border border-amber-500/50 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3.5 animate-in fade-in slide-in-from-top-4">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">{toastAlert.category} Alert</span>
              <button
                onClick={() => setToastAlert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-100 mt-0.5">{toastAlert.title}</p>
            <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{toastAlert.description}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  acknowledgeAlert(toastAlert.id);
                  setToastAlert(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
              >
                <Check className="w-3 h-3" /> Acknowledge
              </button>
              {toastAlert.targetCustomerName && (
                <button
                  onClick={() => {
                    const cust = customers.find(
                      (c) => c.id === toastAlert.targetId || c.name === toastAlert.targetCustomerName
                    );
                    if (cust) setSelectedCustomerFor360(cust);
                    setToastAlert(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition"
                >
                  Open Customer 360
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page Title & Quick Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">Admin Central Dashboard</h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wider">
                  {adminNavItems.find((item) => item.isActive)?.label || 'Overview'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Unified live control over Raw Materials, Products, and Sales Management modules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 shadow-sm ${
              activeFilterCount > 0
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Global Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-blue-700 text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className="relative px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition flex items-center gap-2 shadow-sm"
          >
            <Bell className="w-4 h-4 text-slate-500" />
            <span>Alerts</span>
            {unacknowledgedAlerts.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                {unacknowledgedAlerts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Reports</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. STATE-WISE & MULTI-DIMENSIONAL GLOBAL FILTER BAR */}
      {/* ======================================================== */}
      {showFilterBar && (
        <div className="erp-card p-4 md:p-5 bg-white border border-slate-200 shadow-sm space-y-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Multi-Dimensional Global Filter
              </span>
              <span className="text-[11px] text-slate-400">
                (Cascades live to all KPIs, charts, tables, and reports)
              </span>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline"
              >
                <X className="w-3.5 h-3.5" /> Clear All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* 1. Indian State */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">State</label>
              <select
                value={filterState}
                onChange={(e) => {
                  setFilterState(e.target.value);
                  setFilterCity(''); // Reset cascading city
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">All States</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. City (Cascading) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">City</label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">All Cities</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Customer */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Customer</label>
              <select
                value={filterCustomerId}
                onChange={(e) => setFilterCustomerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">All Customers</option>
                {filteredCustomers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Salesperson */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Salesperson</label>
              <select
                value={filterSalesperson}
                onChange={(e) => setFilterSalesperson(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">All Salespersons</option>
                {availableSalespersons.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Product / Item */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Product</label>
              <select
                value={filterProductId}
                onChange={(e) => setFilterProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">All Products</option>
                <optgroup label="Finished Goods">
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Raw Materials">
                  {rawMaterials.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* 6. Sale Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Sale Type</label>
              <select
                value={filterSaleType}
                onChange={(e) => setFilterSaleType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">All Types</option>
                <option value="PRODUCT">Finished Product</option>
                <option value="RAW_MATERIAL">Raw Material</option>
              </select>
            </div>

            {/* 7. Sales Channel */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Channel</label>
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">All Channels</option>
                <option value="Website">Website</option>
                <option value="Amazon">Amazon</option>
                <option value="IndiaMART">IndiaMART</option>
                <option value="Dealer">Dealer</option>
                <option value="Distributor">Distributor</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            {/* 8. Date Range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Date Range</label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          {filterDateRange === 'custom' && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">Custom Dates:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
              />
            </div>
          )}

          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="text-slate-400 font-semibold">Applied Filters:</span>
              {filterState && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                  State: {filterState}
                  <button onClick={() => setFilterState('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterCity && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                  City: {filterCity}
                  <button onClick={() => setFilterCity('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterSalesperson && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                  Salesperson: {filterSalesperson}
                  <button onClick={() => setFilterSalesperson('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterSaleType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  Type: {filterSaleType}
                  <button onClick={() => setFilterSaleType('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterDateRange !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  Range: {filterDateRange}
                  <button onClick={() => setFilterDateRange('all')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. REAL-TIME 15 KPI CARDS GRID (Shown only on Dashboard) */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {/* Total Sales */}
        <div className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Total Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-slate-900">₹{totalSalesAmount.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">{filteredSalesOrders.length} orders total</div>
        </div>

        {/* Today's Sales */}
        <div className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Today's Sales</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-black text-blue-700">₹{todaySalesAmount.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Recorded on {todayStr}</div>
        </div>

        {/* This Month's Sales */}
        <div className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Month's Sales</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-black text-blue-700">₹{monthlySalesAmount.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Month: {currentMonthStr}</div>
        </div>

        {/* Pending Payments */}
        <div className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Pending Payments</span>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg font-black text-rose-700">₹{pendingPaymentsAmount.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">Outstanding collection</div>
        </div>

        {/* Total Customers */}
        <div className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Total Customers</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-black text-slate-900">{totalCustomersCount}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Clients in directory</div>
        </div>

        {/* New Customers */}
        <div className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>New Customers</span>
            <UserPlus className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-700">{newCustomersCount}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Added this month</div>
        </div>

        {/* Total Products */}
        <div className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Total Products</span>
            <Boxes className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-black text-slate-900">{totalProductsCount}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Active catalog SKUs</div>
        </div>

        {/* Low Stock Raw Materials */}
        <div
          onClick={() => setActiveTab('notifications')}
          className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Low Stock RM</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className={`text-lg font-black ${lowStockRawMaterialsCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {lowStockRawMaterialsCount}
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">Below reorder point</div>
        </div>

        {/* Low Stock Finished Goods */}
        <div
          onClick={() => setActiveTab('notifications')}
          className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Low Stock FG</span>
            <PackageCheck className="w-4 h-4 text-rose-600" />
          </div>
          <div className={`text-lg font-black ${lowStockFinishedGoodsCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {lowStockFinishedGoodsCount}
          </div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">Finished goods low</div>
        </div>

        {/* Pending Sales Orders */}
        <div
          onClick={() => setActiveTab('authority')}
          className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Pending Orders</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-black text-blue-700">{pendingSalesOrdersCount}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Awaiting processing</div>
        </div>

        {/* Orders Pending from Product Team */}
        <div
          onClick={() => setActiveTab('authority')}
          className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Product Team Pend.</span>
            <Factory className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-black text-amber-700">{ordersPendingFromProductTeamCount}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">Packing in production</div>
        </div>

        {/* Ready for Dispatch Orders */}
        <div
          onClick={() => setActiveTab('authority')}
          className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Ready for Dispatch</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-700">{readyForDispatchOrdersCount}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Packed & verified</div>
        </div>

        {/* Expiring / Expired Warranties */}
        <div
          onClick={() => setActiveTab('warranty')}
          className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Expiring Warranty</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-black text-amber-700">
            {expiringWarrantiesCount + expiredWarrantiesCount}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            {expiringWarrantiesCount} expiring soon, {expiredWarrantiesCount} expired
          </div>
        </div>

        {/* Today's Follow-ups */}
        <div
          onClick={() => setActiveTab('followups')}
          className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Today's Follow-ups</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-black text-blue-700">{todayFollowUpsList.length}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Scheduled today</div>
        </div>

        {/* Overdue Follow-ups */}
        <div
          onClick={() => setActiveTab('followups')}
          className="erp-card p-3.5 bg-white border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Overdue Follow-ups</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg font-black text-rose-700">{overdueFollowUpsList.length}</div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">Immediate attention</div>
        </div>
      </div>
    )}

      {/* ======================================================== */}
      {/* ACTIVE SECTION CONTENT */}
      {/* ======================================================== */}

      {/* ======================================================== */}
      {/* TAB CONTENT: 1. OVERVIEW (EXECUTIVE DASHBOARD) */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Authority Modules Switcher Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Raw Material Management Card */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Factory className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Module 1
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Raw Material Management</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Material inventory, low stock triggers, suppliers, purchase orders & receipt inspections.
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-700">
                  <div>Stock SKUs: <span className="font-bold text-slate-900">{rawMaterials.length}</span></div>
                  <div>Suppliers: <span className="font-bold text-slate-900">{suppliers.length}</span></div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <Link
                  href="/raw-material"
                  className="flex-1 text-center py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  Open Module
                </Link>
                <Link
                  href="/raw-material/materials"
                  className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition"
                >
                  Materials Stock
                </Link>
              </div>
            </div>

            {/* Product Management Card */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Module 2
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Product Management</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Product catalog, Bill of Materials (BOM), finished goods stock, order packing & returns.
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-700">
                  <div>Products: <span className="font-bold text-slate-900">{products.length}</span></div>
                  <div>In Packing: <span className="font-bold text-slate-900">{ordersPendingFromProductTeamCount}</span></div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <Link
                  href="/product"
                  className="flex-1 text-center py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  Open Module
                </Link>
                <Link
                  href="/product/orders"
                  className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition"
                >
                  Sales Orders
                </Link>
              </div>
            </div>

            {/* Sales Management Card */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Module 3
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Sales Management</h3>
                <p className="text-xs text-slate-500 mt-1">
                  CRM Customers, leads & follow-ups, sales orders, tax invoices, dispatches & customer payments.
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-700">
                  <div>Customers: <span className="font-bold text-slate-900">{customers.length}</span></div>
                  <div>Sales Orders: <span className="font-bold text-slate-900">{salesOrders.length}</span></div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <Link
                  href="/sales"
                  className="flex-1 text-center py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  Open Module
                </Link>
                <Link
                  href="/sales/customers"
                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition"
                >
                  CRM Clients
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Analytics & Performance Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Channel Breakdown Card */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Sales Channel Distribution</h3>
                </div>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  Full Analytics <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {channelWiseSales.map((item) => {
                  const percent = Math.round((item.amount / (totalSalesAmount || 1)) * 100);
                  return (
                    <div key={item.channel} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{item.channel}</span>
                        <span className="font-semibold text-slate-600">
                          ₹{item.amount.toLocaleString('en-IN')} ({percent}%) · {item.count} orders
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Finished Goods vs Raw Materials Ratio */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Sale Type Breakdown</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">Finished Goods vs Raw Materials</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Finished Products
                    </div>
                    <div className="text-xl font-black text-blue-900 mt-1">
                      ₹{salesByType.finishedGoodAmount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs font-bold text-blue-700 mt-1">
                      {salesByType.finishedGoodPercent}% of Total Sales
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {salesByType.finishedGoodCount} units dispatched
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                      Raw Materials Sale
                    </div>
                    <div className="text-xl font-black text-amber-900 mt-1">
                      ₹{salesByType.rawMaterialAmount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs font-bold text-amber-700 mt-1">
                      {salesByType.rawMaterialPercent}% of Total Sales
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {salesByType.rawMaterialCount} units dispatched
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Both Finished Products & Raw Materials share real stock transactions.</span>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="font-bold text-blue-600 hover:underline"
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>

          {/* Urgent Attention Grid (Warranties Expiring & Overdue Follow-ups) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expiring Soon Warranties Preview */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">Warranty Alerts (Expiring & Expired)</h3>
                </div>
                <button
                  onClick={() => setActiveTab('warranty')}
                  className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                >
                  View All ({warrantyRecords.filter((w) => w.status !== 'Active').length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {warrantyRecords
                  .filter((w) => w.status !== 'Active')
                  .slice(0, 4)
                  .map((w) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{w.productName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Customer: <span className="font-semibold text-slate-700">{w.customerName}</span> · SN:{' '}
                          <span className="font-mono text-slate-600">{w.serialNumber}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === 'Expiring Soon'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {w.status === 'Expiring Soon' ? `${w.daysRemaining} days left` : 'Expired'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">End: {w.warrantyEndDate}</div>
                      </div>
                    </div>
                  ))}

                {warrantyRecords.filter((w) => w.status !== 'Active').length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No expiring or expired warranties right now. All products are in active warranty.
                  </div>
                )}
              </div>
            </div>

            {/* Overdue Follow-ups Preview */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">Overdue & Urgent Follow-ups</h3>
                </div>
                <button
                  onClick={() => setActiveTab('followups')}
                  className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                >
                  View All ({overdueFollowUpsList.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {overdueFollowUpsList.slice(0, 4).map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{f.leadOrCustomerName}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{f.purpose}</div>
                      <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                        Overdue since: {f.followUpDate} · Assigned: {f.assignedUser || 'Sales'}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const cust = customers.find((c) => c.id === f.leadOrCustomerId || c.name === f.leadOrCustomerName);
                          if (cust) setSelectedCustomerFor360(cust);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold shadow-2xs"
                      >
                        360 View
                      </button>
                      <button
                        onClick={() => updateFollowUpStatusFull(f.id, 'Completed')}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-2xs"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ))}

                {overdueFollowUpsList.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No overdue follow-ups! All client communications are currently up to date.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 2. SALES ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Comprehensive Sales Analytics</h2>
              <p className="text-xs text-slate-500">
                Detailed breakdowns across Salespersons, Products, Materials, Sales Channels, and Indian States.
              </p>
            </div>
            <button
              onClick={() =>
                handleExportCSV(
                  'Sales_Analytics_Summary',
                  ['Metric', 'Value'],
                  [
                    ['Total Sales', totalSalesAmount],
                    ['Today Sales', todaySalesAmount],
                    ['Monthly Sales', monthlySalesAmount],
                    ['Finished Goods Sales', salesByType.finishedGoodAmount],
                    ['Raw Materials Sales', salesByType.rawMaterialAmount],
                    ['Total Orders', filteredSalesOrders.length],
                  ]
                )
              }
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" /> Export Summary CSV
            </button>
          </div>

          {/* Top Level Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Filtered Total Sales</div>
              <div className="text-2xl font-black text-slate-900 mt-1">₹{totalSalesAmount.toLocaleString('en-IN')}</div>
              <div className="text-xs text-slate-500 mt-1">{filteredSalesOrders.length} orders analyzed</div>
            </div>
            <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-blue-600 uppercase">Today's Sales Revenue</div>
              <div className="text-2xl font-black text-blue-700 mt-1">₹{todaySalesAmount.toLocaleString('en-IN')}</div>
              <div className="text-xs text-slate-500 mt-1">Live from {todayStr}</div>
            </div>
            <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-emerald-600 uppercase">Finished Goods Revenue</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">₹{salesByType.finishedGoodAmount.toLocaleString('en-IN')}</div>
              <div className="text-xs text-slate-500 mt-1">{salesByType.finishedGoodPercent}% of volume</div>
            </div>
            <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-amber-600 uppercase">Raw Materials Revenue</div>
              <div className="text-2xl font-black text-amber-700 mt-1">₹{salesByType.rawMaterialAmount.toLocaleString('en-IN')}</div>
              <div className="text-xs text-slate-500 mt-1">{salesByType.rawMaterialPercent}% of volume</div>
            </div>
          </div>

          {/* Salesperson-Wise Sales Breakdown */}
          <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Salesperson-Wise Sales Amount & Order Count</h3>
              </div>
              <span className="text-xs text-slate-400">Click any salesperson to drill down</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-3">Salesperson</th>
                    <th className="py-2.5 px-3 text-right">Total Orders</th>
                    <th className="py-2.5 px-3 text-right">Today's Orders</th>
                    <th className="py-2.5 px-3 text-right">Total Sales (₹)</th>
                    <th className="py-2.5 px-3 text-right">Today's Sales (₹)</th>
                    <th className="py-2.5 px-3 text-right">Monthly Sales (₹)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salespersonPerformanceData.map((sp) => (
                    <tr key={sp.name} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {sp.name.charAt(0)}
                        </div>
                        {sp.name}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{sp.totalOrders}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{sp.todayOrders}</td>
                      <td className="py-2.5 px-3 text-right font-black text-blue-700">
                        ₹{sp.totalSalesAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                        ₹{sp.todaySalesAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                        ₹{sp.monthlySalesAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedSalespersonForHistory(sp.name)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition"
                        >
                          View Sales History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product-Wise & State-Wise Analysis Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product-Wise Sales Table */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-blue-600" />
                  Product & Raw Material-Wise Sales
                </h3>
                <span className="text-xs text-slate-400">Ranked by revenue</span>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2 px-3">Item / SKU</th>
                      <th className="py-2 px-3 text-right">Units Sold</th>
                      <th className="py-2 px-3 text-right">Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productWiseSales.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.sku}</div>
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-800">{p.units}</td>
                        <td className="py-2 px-3 text-right font-black text-blue-700">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* State-Wise Sales Breakdown */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  State-Wise Sales Distribution
                </h3>
                <span className="text-xs text-slate-400">Indian States</span>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2 px-3">State</th>
                      <th className="py-2 px-3 text-right">Orders</th>
                      <th className="py-2 px-3 text-right">Clients</th>
                      <th className="py-2 px-3 text-right">Total Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stateWiseSales.map((st) => (
                      <tr key={st.state} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {st.state}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-800">{st.orderCount}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-800">{st.uniqueCustomers}</td>
                        <td className="py-2 px-3 text-right font-black text-emerald-700">
                          ₹{st.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Customer-Wise Sales Ranking */}
          <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Customer-Wise Sales Contribution
              </h3>
              <span className="text-xs text-slate-400">Top revenue generating clients</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-2 px-3">Customer Name</th>
                    <th className="py-2 px-3">Location</th>
                    <th className="py-2 px-3 text-right">Order Count</th>
                    <th className="py-2 px-3 text-right">Total Amount (₹)</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerWiseSales.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{c.name}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {c.city ? `${c.city}, ${c.state}` : c.state || 'India'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800">{c.orderCount}</td>
                      <td className="py-2 px-3 text-right font-black text-blue-700">
                        ₹{c.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => {
                            const found = customers.find((cust) => cust.id === c.id || cust.name === c.name);
                            if (found) setSelectedCustomerFor360(found);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition"
                        >
                          Open 360 View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 3. SALESPERSON PERFORMANCE */}
      {/* ======================================================== */}
      {activeTab === 'salespersons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Salesperson Performance Tracking</h2>
              <p className="text-xs text-slate-500">
                Track orders, revenue metrics, pending deliveries, and follow-ups per sales executive.
              </p>
            </div>
            <button
              onClick={() =>
                handleExportCSV(
                  'Salesperson_Performance_Report',
                  [
                    'Salesperson',
                    'Total Orders',
                    'Today Orders',
                    'Total Sales',
                    'Today Sales',
                    'Monthly Sales',
                    'Pending Orders',
                    'Pending Follow-ups',
                  ],
                  salespersonPerformanceData.map((s) => [
                    s.name,
                    s.totalOrders,
                    s.todayOrders,
                    s.totalSalesAmount,
                    s.todaySalesAmount,
                    s.monthlySalesAmount,
                    s.pendingOrders,
                    s.pendingFollowUps,
                  ])
                )
              }
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" /> Export Performance CSV
            </button>
          </div>

          <div className="erp-card bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4">Salesperson</th>
                    <th className="py-3 px-3 text-right">Total Orders</th>
                    <th className="py-3 px-3 text-right">Today's Orders</th>
                    <th className="py-3 px-3 text-right">Total Sales (₹)</th>
                    <th className="py-3 px-3 text-right">Today's Sales (₹)</th>
                    <th className="py-3 px-3 text-right">Month's Sales (₹)</th>
                    <th className="py-3 px-3 text-right">Pending Orders</th>
                    <th className="py-3 px-3 text-right">Pending Follow-ups</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salespersonPerformanceData.map((sp) => (
                    <tr key={sp.name} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                          {sp.name.charAt(0)}
                        </div>
                        <div>
                          <div>{sp.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Active Executive</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-800">{sp.totalOrders}</td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-800">{sp.todayOrders}</td>
                      <td className="py-3.5 px-3 text-right font-black text-blue-700">
                        ₹{sp.totalSalesAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-slate-800">
                        ₹{sp.todaySalesAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-slate-800">
                        ₹{sp.monthlySalesAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            sp.pendingOrders > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sp.pendingOrders}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            sp.pendingFollowUps > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sp.pendingFollowUps}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedSalespersonForHistory(sp.name)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
                        >
                          View Sales History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 4. CUSTOMER 360 VIEW */}
      {/* ======================================================== */}
      {activeTab === 'customer360' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Customer 360 Unified Profile Directory</h2>
              <p className="text-xs text-slate-500">
                Full 360° view of customer orders, purchased items, invoices, warranty status, follow-up history & returns.
              </p>
            </div>
          </div>

          {/* Customer Selection Table */}
          <div className="erp-card bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">All Customers ({filteredCustomers.length})</span>
              <span className="text-[11px] text-slate-400">Click &quot;Open 360 View&quot; on any customer</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-3">Customer Code</th>
                    <th className="py-2.5 px-3">Name & Company</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">State & City</th>
                    <th className="py-2.5 px-3 text-right">Total Orders</th>
                    <th className="py-2.5 px-3 text-right">Total Sales (₹)</th>
                    <th className="py-2.5 px-3 text-right">Outstanding (₹)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                        {cust.customerCode || cust.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{cust.name}</div>
                        <div className="text-[10px] text-slate-500">{cust.companyName}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800 font-medium">{cust.mobile}</div>
                        <div className="text-[10px] text-slate-400">{cust.email}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{cust.city || 'Pune'}</div>
                        <div className="text-[10px] text-slate-500">{cust.state || 'Maharashtra'}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">{cust.totalOrders || 0}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        ₹{(cust.totalSales || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                        ₹{(cust.totalOutstanding || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedCustomerFor360(cust)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" /> Open 360 View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 5. PRODUCT WARRANTY TRACKING */}
      {/* ======================================================== */}
      {activeTab === 'warranty' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Product Warranty Lifecycle Tracking</h2>
              <p className="text-xs text-slate-500">
                Automated warranty tracking for every sold product with serial number, batch number, active/expiring/expired calculation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleExportCSV(
                    'Warranty_Registry',
                    [
                      'Product',
                      'SKU',
                      'Serial Number',
                      'Batch Number',
                      'Customer',
                      'State',
                      'Purchase Date',
                      'Warranty End Date',
                      'Days Remaining',
                      'Status',
                    ],
                    warrantyRecords.map((w) => [
                      w.productName,
                      w.sku,
                      w.serialNumber,
                      w.batchNumber,
                      w.customerName,
                      w.customerState || '',
                      w.purchaseDate,
                      w.warrantyEndDate,
                      w.daysRemaining,
                      w.status,
                    ])
                  )
                }
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" /> Export Warranty CSV
              </button>
            </div>
          </div>

          {/* Warranty Status Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Active Warranties</span>
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {warrantyRecords.filter((w) => w.status === 'Active').length}
              </div>
              <div className="text-xs text-slate-500 mt-1">&gt; 30 days coverage remaining</div>
            </div>

            <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-600 uppercase">Expiring Soon (Alert)</span>
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              </div>
              <div className="text-2xl font-black text-amber-700 mt-1">{expiringWarrantiesCount}</div>
              <div className="text-xs text-amber-700 font-semibold mt-1">≤ 30 days left (Admin action required)</div>
            </div>

            <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Expired Warranties</span>
                <span className="w-3 h-3 rounded-full bg-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-700 mt-1">{expiredWarrantiesCount}</div>
              <div className="text-xs text-rose-700 font-semibold mt-1">Contact customer for renewal/AMC</div>
            </div>
          </div>

          {/* Warranty Table */}
          <div className="erp-card bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">Serial / Batch Number</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Purchase Date</th>
                    <th className="py-3 px-3">Warranty Period</th>
                    <th className="py-3 px-3">Warranty End Date</th>
                    <th className="py-3 px-3 text-center">Remaining Days</th>
                    <th className="py-3 px-3 text-center">Warranty Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {warrantyRecords.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{w.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {w.sku}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-800 font-bold">{w.serialNumber}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Batch: {w.batchNumber}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{w.customerName}</td>
                      <td className="py-3 px-3 text-slate-600">{w.purchaseDate}</td>
                      <td className="py-3 px-3 text-slate-600">{w.warrantyPeriod}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{w.warrantyEndDate}</td>
                      <td className="py-3 px-3 text-center font-bold">
                        {w.daysRemaining >= 0 ? `${w.daysRemaining} days` : `Expired ${Math.abs(w.daysRemaining)}d ago`}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            w.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : w.status === 'Expiring Soon'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            const found = customers.find((c) => c.id === w.customerId || c.name === w.customerName);
                            if (found) setSelectedCustomerFor360(found);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition"
                        >
                          Customer 360
                        </button>
                      </td>
                    </tr>
                  ))}
                  {warrantyRecords.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                        No product warranty records found matching the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 6. FOLLOW-UP & LEAD ALERTS */}
      {/* ======================================================== */}
      {activeTab === 'followups' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Follow-up & CRM Lead Alerts</h2>
              <p className="text-xs text-slate-500">
                Action-oriented dashboard for follow-ups due today, overdue alerts, and uncontacted leads.
              </p>
            </div>
            <button
              onClick={() => {
                if (filteredCustomers.length > 0) {
                  setFollowUpModalCustomer({ id: filteredCustomers[0].id, name: filteredCustomers[0].name, type: 'Customer' });
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Add New Follow-up
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Follow-up Due Today */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Follow-up Due Today ({todayFollowUpsList.length})</h3>
                </div>
                <span className="text-[11px] font-semibold text-blue-600">{todayStr}</span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {todayFollowUpsList.map((f) => (
                  <div key={f.id} className="p-3 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs">{f.leadOrCustomerName}</div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        {f.followUpTime}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">{f.purpose}</div>
                    {f.notes && <div className="text-[11px] text-slate-400 italic">Notes: {f.notes}</div>}
                    <div className="flex items-center justify-between pt-1 border-t border-blue-100 text-[11px]">
                      <span className="text-slate-500">Assigned: {f.assignedUser || 'Sales'}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const found = customers.find((c) => c.id === f.leadOrCustomerId || c.name === f.leadOrCustomerName);
                            if (found) setSelectedCustomerFor360(found);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          Open 360
                        </button>
                        <button
                          onClick={() => updateFollowUpStatusFull(f.id, 'Completed')}
                          className="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                        >
                          Mark Done
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {todayFollowUpsList.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">No follow-ups due today.</div>
                )}
              </div>
            </div>

            {/* Overdue Follow-ups */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">Overdue Follow-ups ({overdueFollowUpsList.length})</h3>
                </div>
                <span className="text-[11px] font-semibold text-rose-600">Needs Attention</span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {overdueFollowUpsList.map((f) => (
                  <div key={f.id} className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs">{f.leadOrCustomerName}</div>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        Due: {f.followUpDate}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">{f.purpose}</div>
                    <div className="flex items-center justify-between pt-1 border-t border-rose-100 text-[11px]">
                      <span className="text-slate-500">Assigned: {f.assignedUser || 'Sales'}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const found = customers.find((c) => c.id === f.leadOrCustomerId || c.name === f.leadOrCustomerName);
                            if (found) setSelectedCustomerFor360(found);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          Open 360
                        </button>
                        <button
                          onClick={() => updateFollowUpStatusFull(f.id, 'Completed')}
                          className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-xs font-semibold"
                        >
                          Mark Done
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {overdueFollowUpsList.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">No overdue follow-ups!</div>
                )}
              </div>
            </div>
          </div>

          {/* Customers with No Follow-up & Leads Requiring Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customers with No Follow-up */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  Customers with No Follow-up Scheduled
                </h3>
                <span className="text-xs text-slate-400">{customersWithNoFollowUpList.length} clients</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customersWithNoFollowUpList.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                      <div className="text-[11px] text-slate-500">{c.city ? `${c.city}, ${c.state}` : c.state}</div>
                    </div>
                    <button
                      onClick={() => setFollowUpModalCustomer({ id: c.id, name: c.name, type: 'Customer' })}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-bold"
                    >
                      + Schedule Follow-up
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Leads Requiring Follow-up */}
            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Leads Requiring Follow-up
                </h3>
                <span className="text-xs text-slate-400">{leadsRequiringFollowUpList.length} active leads</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {leadsRequiringFollowUpList.map((l) => (
                  <div
                    key={l.id}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{l.leadName || l.companyName}</div>
                      <div className="text-[11px] text-slate-500">
                        Status: <span className="font-semibold text-blue-700">{l.status}</span> · Mobile: {l.mobile}
                      </div>
                    </div>
                    <button
                      onClick={() => setFollowUpModalCustomer({ id: l.id, name: l.leadName || l.companyName, type: 'Lead' })}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold"
                    >
                      + Follow-up Lead
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 7. NOTIFICATION CENTER */}
      {/* ======================================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Admin Notification Center</h2>
              <p className="text-xs text-slate-500">
                Persistent alert registry for Warranties, Follow-ups, Overdue Payments, Low Stock, and Order Processing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setNotificationFilter('unread')}
                  className={`px-3 py-1 rounded-lg transition ${
                    notificationFilter === 'unread' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Unacknowledged ({unacknowledgedAlerts.length})
                </button>
                <button
                  onClick={() => setNotificationFilter('all')}
                  className={`px-3 py-1 rounded-lg transition ${
                    notificationFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All Alerts ({allGeneratedAlerts.length})
                </button>
              </div>

              {unacknowledgedAlerts.length > 0 && (
                <button
                  onClick={() => acknowledgeAllAlerts(unacknowledgedAlerts.map((a) => a.id))}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Acknowledge All
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {(notificationFilter === 'unread' ? unacknowledgedAlerts : allGeneratedAlerts).map((alert) => {
              const isAcknowledged = acknowledgedAlertIds.includes(alert.id);
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-rose-50/50 border-rose-200'
                      : alert.severity === 'WARNING'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-blue-50/40 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {alert.category === 'Warranty' && <ShieldAlert className="w-4 h-4" />}
                      {alert.category === 'Follow-up' && <Clock className="w-4 h-4" />}
                      {alert.category === 'Payment' && <CreditCard className="w-4 h-4" />}
                      {alert.category === 'Stock' && <Boxes className="w-4 h-4" />}
                      {alert.category === 'Order' && <ShoppingCart className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {alert.category}
                        </span>
                        <span className="text-xs font-black text-slate-900">{alert.title}</span>
                        {isAcknowledged && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                            Acknowledged
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{alert.description}</p>
                      <div className="text-[10px] text-slate-400 mt-1">Date: {alert.timestamp}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {alert.targetCustomerName && (
                      <button
                        onClick={() => {
                          const cust = customers.find(
                            (c) => c.id === alert.targetId || c.name === alert.targetCustomerName
                          );
                          if (cust) setSelectedCustomerFor360(cust);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold shadow-2xs"
                      >
                        Open 360
                      </button>
                    )}
                    {!isAcknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3 h-3" /> Acknowledge
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {(notificationFilter === 'unread' ? unacknowledgedAlerts : allGeneratedAlerts).length === 0 && (
              <div className="p-12 text-center border border-slate-200 bg-white rounded-2xl text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No unacknowledged alerts found. All notifications have been reviewed and acknowledged!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 8. ADMIN REPORTS (10 COMPREHENSIVE REPORTS) */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Admin Central Reports & Analytics</h2>
              <p className="text-xs text-slate-500">
                Generate, filter, search, print, and export 10 comprehensive business reports.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" /> Print Report
              </button>
            </div>
          </div>

          {/* Report Sub-Tabs (10 Reports) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            {[
              { id: 'sales', label: '1. Sales Report' },
              { id: 'salesperson', label: '2. Salesperson Report' },
              { id: 'customer', label: '3. Customer Report' },
              { id: 'product', label: '4. Product Sales Report' },
              { id: 'raw_material', label: '5. Raw Material Sales' },
              { id: 'warranty', label: '6. Warranty Report' },
              { id: 'followup', label: '7. Follow-up Report' },
              { id: 'payment', label: '8. Payment / Pending Report' },
              { id: 'state_wise', label: '9. State-wise Sales' },
              { id: 'stock', label: '10. Stock Report' },
            ].map((rep) => (
              <button
                key={rep.id}
                onClick={() => setActiveReportId(rep.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  activeReportId === rep.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {rep.label}
              </button>
            ))}
          </div>

          {/* Report Filter & Live Search */}
          <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search report entries..."
                value={reportSearchQuery}
                onChange={(e) => setReportSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <button
              onClick={() => {
                if (activeReportId === 'sales') {
                  handleExportCSV(
                    'Admin_Sales_Report',
                    ['Order #', 'Customer', 'Date', 'Salesperson', 'Channel', 'Grand Total', 'Status', 'Payment'],
                    filteredSalesOrders.map((o) => [
                      o.orderNumber,
                      o.customerName,
                      o.orderDate,
                      o.salesperson || o.createdBy || 'Sales',
                      o.salesChannel || 'Website',
                      o.grandTotal || o.totalAmount,
                      o.orderStatus,
                      o.paymentStatus,
                    ])
                  );
                } else if (activeReportId === 'salesperson') {
                  handleExportCSV(
                    'Admin_Salesperson_Report',
                    ['Salesperson', 'Total Orders', 'Today Orders', 'Total Sales', 'Month Sales'],
                    salespersonPerformanceData.map((s) => [
                      s.name,
                      s.totalOrders,
                      s.todayOrders,
                      s.totalSalesAmount,
                      s.monthlySalesAmount,
                    ])
                  );
                } else if (activeReportId === 'customer') {
                  handleExportCSV(
                    'Admin_Customer_Report',
                    ['Code', 'Name', 'City', 'State', 'Orders', 'Total Sales', 'Outstanding'],
                    filteredCustomers.map((c) => [
                      c.customerCode || c.id,
                      c.name,
                      c.city,
                      c.state,
                      c.totalOrders || 0,
                      c.totalSales || 0,
                      c.totalOutstanding || 0,
                    ])
                  );
                } else if (activeReportId === 'warranty') {
                  handleExportCSV(
                    'Admin_Warranty_Report',
                    ['Product', 'Serial Number', 'Customer', 'Purchase Date', 'End Date', 'Days Left', 'Status'],
                    warrantyRecords.map((w) => [
                      w.productName,
                      w.serialNumber,
                      w.customerName,
                      w.purchaseDate,
                      w.warrantyEndDate,
                      w.daysRemaining,
                      w.status,
                    ])
                  );
                } else {
                  handleExportCSV(
                    'Admin_Report',
                    ['Report', 'Generated Date'],
                    [[activeReportId, todayStr]]
                  );
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Export This Report to CSV
            </button>
          </div>

          {/* Report Display Container */}
          <div className="erp-card bg-white border border-slate-200 shadow-sm overflow-hidden">
            {/* 1. Sales Report */}
            {activeReportId === 'sales' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Order Number</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Salesperson</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3 text-right">Grand Total (₹)</th>
                      <th className="py-2.5 px-3 text-center">Order Status</th>
                      <th className="py-2.5 px-3 text-center">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSalesOrders
                      .filter((o) =>
                        !reportSearchQuery ||
                        o.orderNumber.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                        o.customerName.toLowerCase().includes(reportSearchQuery.toLowerCase())
                      )
                      .map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{o.orderNumber}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{o.customerName}</td>
                          <td className="py-2.5 px-3 text-slate-600">{o.orderDate}</td>
                          <td className="py-2.5 px-3 text-slate-700">{o.salesperson || o.createdBy || 'Sales'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{o.salesChannel || 'Website'}</td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900">
                            ₹{(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">{o.orderStatus}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-700">{o.paymentStatus}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Salesperson Report */}
            {activeReportId === 'salesperson' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Salesperson Name</th>
                      <th className="py-2.5 px-3 text-right">Total Orders</th>
                      <th className="py-2.5 px-3 text-right">Today Orders</th>
                      <th className="py-2.5 px-3 text-right">Total Sales Amount (₹)</th>
                      <th className="py-2.5 px-3 text-right">Monthly Sales (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salespersonPerformanceData.map((s) => (
                      <tr key={s.name} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">{s.totalOrders}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">{s.todayOrders}</td>
                        <td className="py-2.5 px-3 text-right font-black text-blue-700">
                          ₹{s.totalSalesAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                          ₹{s.monthlySalesAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Customer Report */}
            {activeReportId === 'customer' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3">City & State</th>
                      <th className="py-2.5 px-3 text-right">Orders</th>
                      <th className="py-2.5 px-3 text-right">Total Sales (₹)</th>
                      <th className="py-2.5 px-3 text-right">Outstanding (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{c.customerCode || c.id}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{c.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{c.companyName}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {c.city ? `${c.city}, ${c.state}` : c.state}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">{c.totalOrders || 0}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          ₹{(c.totalSales || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                          ₹{(c.totalOutstanding || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Product Sales Report */}
            {activeReportId === 'product' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Units Sold</th>
                      <th className="py-2.5 px-3 text-right">Total Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productWiseSales.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.sku}</td>
                        <td className="py-2.5 px-3 text-right font-bold">{p.units}</td>
                        <td className="py-2.5 px-3 text-right font-black text-blue-700">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. Raw Material Sales Report */}
            {activeReportId === 'raw_material' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Raw Material</th>
                      <th className="py-2.5 px-3">SKU Code</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3 text-right">Current Stock</th>
                      <th className="py-2.5 px-3 text-right">Unit Purchase Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rawMaterials.map((rm) => (
                      <tr key={rm.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{rm.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{rm.sku}</td>
                        <td className="py-2.5 px-3 text-slate-600">{rm.unit}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">{rm.currentStock}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          ₹{rm.unitCost.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Warranty Report */}
            {activeReportId === 'warranty' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Serial / Batch #</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Purchase Date</th>
                      <th className="py-2.5 px-3">End Date</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {warrantyRecords.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{w.productName}</td>
                        <td className="py-2.5 px-3 font-mono">{w.serialNumber}</td>
                        <td className="py-2.5 px-3 text-slate-800 font-semibold">{w.customerName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{w.purchaseDate}</td>
                        <td className="py-2.5 px-3 text-slate-600">{w.warrantyEndDate}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{w.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 7. Follow-up Report */}
            {activeReportId === 'followup' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Client / Lead</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Purpose</th>
                      <th className="py-2.5 px-3">Assigned User</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {followUps.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{f.leadOrCustomerName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{f.type}</td>
                        <td className="py-2.5 px-3 text-slate-600">{f.followUpDate} {f.followUpTime}</td>
                        <td className="py-2.5 px-3 text-slate-700">{f.purpose}</td>
                        <td className="py-2.5 px-3 text-slate-700">{f.assignedUser}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{f.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 8. Payment Report */}
            {activeReportId === 'payment' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Invoice Number</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Grand Total (₹)</th>
                      <th className="py-2.5 px-3 text-right">Paid (₹)</th>
                      <th className="py-2.5 px-3 text-right">Outstanding (₹)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{inv.customerName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{inv.invoiceDate}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ₹{inv.grandTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          ₹{inv.paidAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                          ₹{inv.outstandingAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-700">{inv.paymentStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 9. State-wise Sales Report */}
            {activeReportId === 'state_wise' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Indian State</th>
                      <th className="py-2.5 px-3 text-right">Total Orders</th>
                      <th className="py-2.5 px-3 text-right">Unique Clients</th>
                      <th className="py-2.5 px-3 text-right">Total Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stateWiseSales.map((st) => (
                      <tr key={st.state} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{st.state}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">{st.orderCount}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">{st.uniqueCustomers}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                          ₹{st.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 10. Combined Stock Report */}
            {activeReportId === 'stock' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Item Type</th>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Current Stock</th>
                      <th className="py-2.5 px-3 text-right">Min Threshold</th>
                      <th className="py-2.5 px-3 text-center">Stock Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={`p-${p.id}`} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-blue-700">Finished Good</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{p.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{p.sku}</td>
                        <td className="py-2 px-3 text-right font-black text-slate-900">{p.currentStock}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-500">{p.minStock}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.currentStock <= p.minStock
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.currentStock <= p.minStock ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {rawMaterials.map((rm) => (
                      <tr key={`rm-${rm.id}`} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-amber-700">Raw Material</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{rm.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{rm.sku}</td>
                        <td className="py-2 px-3 text-right font-black text-slate-900">
                          {rm.currentStock} {rm.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-500">
                          {rm.minStock} {rm.unit}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rm.currentStock <= rm.minStock
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {rm.currentStock <= rm.minStock ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 9. ADMIN AUTHORITY & MODULE CONTROL */}
      {/* ======================================================== */}
      {activeTab === 'authority' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Admin Authority & Centralized Control</h2>
              <p className="text-xs text-slate-500">
                Full authority layer over all 3 modules. Directly approve orders, dispatch products, or manage user roles.
              </p>
            </div>
          </div>

          {/* Pending Order Quick Approval Matrix */}
          <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Order Approvals & Dispatch Queue</h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {filteredSalesOrders.filter((o) => ['Confirmed', 'Sent to Product', 'Ready for Dispatch'].includes(o.orderStatus)).length} orders awaiting action
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-3">Order Number</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Grand Total (₹)</th>
                    <th className="py-2.5 px-3 text-center">Order Status</th>
                    <th className="py-2.5 px-3 text-center">Dispatch Status</th>
                    <th className="py-2.5 px-3 text-center">Admin 1-Click Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSalesOrders
                    .filter((o) =>
                      ['Draft', 'Confirmed', 'CONFIRMED', 'Sent to Product', 'Processing', 'Packed', 'Ready for Dispatch'].includes(o.orderStatus)
                    )
                    .map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{o.orderNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{o.customerName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{o.orderDate}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          ₹{(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-800">
                            {o.orderStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{o.dispatchStatus}</td>
                        <td className="py-2.5 px-3 text-center">
                          {o.orderStatus === 'Confirmed' || o.orderStatus === 'Draft' ? (
                            <button
                              onClick={() => sendSalesOrderToProduct(o.id, 'Administrator')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-2xs"
                            >
                              Approve & Send to Product Team
                            </button>
                          ) : o.orderStatus === 'Sent to Product' || o.orderStatus === 'Processing' ? (
                            <button
                              onClick={() => updateSalesOrderStatusFull(o.id, 'Ready for Dispatch', 'Ready to Dispatch')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xs"
                            >
                              Mark Ready for Dispatch
                            </button>
                          ) : (
                            <button
                              onClick={() => updateSalesOrderStatusFull(o.id, 'Dispatched', 'DISPATCHED')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-2xs"
                            >
                              Confirm & Dispatch Order
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Access & Roles Overview */}
          <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Role-Based Access Control (RBAC) Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Admin has full authority across all three modules. Individual team accounts maintain scoped permissions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="text-xs font-bold text-blue-900">Administrator</div>
                <div className="text-[11px] text-blue-700 mt-0.5">Role: ADMIN (Full Authority)</div>
                <div className="mt-2 text-[10px] text-slate-600 space-y-1">
                  <div>✓ Raw Material Module (Full)</div>
                  <div>✓ Product Module (Full)</div>
                  <div>✓ Sales & CRM Module (Full)</div>
                  <div>✓ Executive Dashboard & Reports</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-xs font-bold text-amber-900">Raw Material Manager</div>
                <div className="text-[11px] text-amber-700 mt-0.5">Role: RAW_MATERIAL</div>
                <div className="mt-2 text-[10px] text-slate-600 space-y-1">
                  <div>✓ Raw Materials & Suppliers</div>
                  <div>✓ Purchase Orders & Receipts</div>
                  <div>✓ Material Consumption</div>
                  <div>✗ Restricted from Product/Sales write</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                <div className="text-xs font-bold text-slate-900">Product Manager</div>
                <div className="text-[11px] text-slate-700 mt-0.5">Role: PRODUCT</div>
                <div className="mt-2 text-[10px] text-slate-600 space-y-1">
                  <div>✓ Products & BOM Assembly</div>
                  <div>✓ Sales Order Packing & Serial #</div>
                  <div>✓ Finished Goods Inventory</div>
                  <div>✗ Restricted from Suppliers/CRM</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-xs font-bold text-emerald-900">Sales Manager</div>
                <div className="text-[11px] text-emerald-700 mt-0.5">Role: SALES</div>
                <div className="mt-2 text-[10px] text-slate-600 space-y-1">
                  <div>✓ Customer CRM & Leads</div>
                  <div>✓ Sales Orders & Invoices</div>
                  <div>✓ Dispatch & Payment Collection</div>
                  <div>✗ Restricted from Raw Materials/BOM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SALESPERSON COMPLETE SALES HISTORY */}
      {/* ======================================================== */}
      {selectedSalespersonForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base border border-blue-200">
                  {selectedSalespersonForHistory.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Complete Sales History – {selectedSalespersonForHistory}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedSalespersonOrders.length} total orders taken by this executive
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSalespersonForHistory(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      <th className="py-2.5 px-3">Order Number</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3 text-right">Items</th>
                      <th className="py-2.5 px-3 text-right">Total (₹)</th>
                      <th className="py-2.5 px-3 text-center">Order Status</th>
                      <th className="py-2.5 px-3 text-center">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSalespersonOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{o.orderNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{o.customerName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{o.orderDate}</td>
                        <td className="py-2.5 px-3 text-slate-600">{o.salesChannel || 'Website'}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                          {o.items.reduce((acc, i) => acc + i.quantity, 0)} units
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-blue-700">
                          ₹{(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{o.orderStatus}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{o.paymentStatus}</td>
                      </tr>
                    ))}
                    {selectedSalespersonOrders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                          No sales orders recorded for this salesperson.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Total Revenue Generated: ₹
                {selectedSalespersonOrders
                  .reduce((acc, o) => acc + (o.grandTotal || o.totalAmount || 0), 0)
                  .toLocaleString('en-IN')}
              </span>
              <button
                onClick={() => setSelectedSalespersonForHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CUSTOMER 360 FULL DRILLDOWN VIEW */}
      {/* ======================================================== */}
      {selectedCustomerFor360 && customer360Data && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base border border-blue-200">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{customer360Data.customer.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {customer360Data.customer.customerCode || customer360Data.customer.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {customer360Data.customer.companyName} · {customer360Data.customer.city || 'Pune'},{' '}
                    {customer360Data.customer.state || 'Maharashtra'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerFor360(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Profile Details & Contact Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Contact Person</span>
                  <div className="font-bold text-slate-900 mt-0.5">{customer360Data.customer.contactPerson || customer360Data.customer.name}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Phone & Mobile</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{customer360Data.customer.mobile}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">GST Number</span>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{customer360Data.customer.gstNumber || 'Unregistered'}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Outstanding</span>
                  <div className="font-black text-rose-600 mt-0.5">₹{(customer360Data.customer.totalOutstanding || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Purchased Products & Raw Materials Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-blue-600" />
                  All Purchased Products & Raw Materials
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                      <tr>
                        <th className="py-2 px-3">Item / Description</th>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3 text-right">Quantity</th>
                        <th className="py-2 px-3 text-right">Total Amount (₹)</th>
                        <th className="py-2 px-3 text-center">Purchase Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...customer360Data.purchasedProducts, ...customer360Data.purchasedRawMaterials].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900">{item.name}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{item.sku}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {customer360Data.purchasedProducts.includes(item) ? 'Finished Good' : 'Raw Material'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-800">{item.qty}</td>
                          <td className="py-2 px-3 text-right font-black text-blue-700">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-600">{item.date}</td>
                        </tr>
                      ))}
                      {[...customer360Data.purchasedProducts, ...customer360Data.purchasedRawMaterials].length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400 text-xs">
                            No purchases recorded yet for this client.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warranties Registered */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Product Warranties Registered
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                      <tr>
                        <th className="py-2 px-3">Product</th>
                        <th className="py-2 px-3">Serial Number</th>
                        <th className="py-2 px-3">Start Date</th>
                        <th className="py-2 px-3">End Date</th>
                        <th className="py-2 px-3 text-center">Days Remaining</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customer360Data.warrantiesList.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900">{w.productName}</td>
                          <td className="py-2 px-3 font-mono">{w.serialNumber}</td>
                          <td className="py-2 px-3 text-slate-600">{w.warrantyStartDate}</td>
                          <td className="py-2 px-3 text-slate-600">{w.warrantyEndDate}</td>
                          <td className="py-2 px-3 text-center font-bold">
                            {w.daysRemaining >= 0 ? `${w.daysRemaining} days` : `Expired`}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                w.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : w.status === 'Expiring Soon'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {customer360Data.warrantiesList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400 text-xs">
                            No active warranties found for this client.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Follow-up History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Follow-up & Communication History
                  </h4>
                  <button
                    onClick={() => {
                      setFollowUpModalCustomer({
                        id: customer360Data.customer.id,
                        name: customer360Data.customer.name,
                        type: 'Customer',
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> + Add Follow-up
                  </button>
                </div>
                <div className="space-y-2">
                  {customer360Data.followUpsList.map((f) => (
                    <div key={f.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{f.purpose}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Date: {f.followUpDate} at {f.followUpTime} · Assigned: {f.assignedUser || 'Sales'}
                        </div>
                        {f.notes && <div className="text-[11px] text-slate-600 italic mt-1">&quot;{f.notes}&quot;</div>}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          f.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>
                  ))}
                  {customer360Data.followUpsList.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No follow-ups recorded yet for this client.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedCustomerFor360(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Close 360 View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / UPDATE FOLLOW-UP DIALOG */}
      {/* ======================================================== */}
      {followUpModalCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Schedule Follow-up with {followUpModalCustomer.name}
              </h3>
              <button
                onClick={() => setFollowUpModalCustomer(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Follow-up Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Discuss bulk order pricing / warranty renewal"
                  value={followUpFormPurpose}
                  onChange={(e) => setFollowUpFormPurpose(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={followUpFormDate}
                    onChange={(e) => setFollowUpFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={followUpFormTime}
                    onChange={(e) => setFollowUpFormTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Assigned Salesperson</label>
                <select
                  value={followUpFormUser}
                  onChange={(e) => setFollowUpFormUser(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Admin">Administrator</option>
                  {availableSalespersons.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Additional context or notes..."
                  value={followUpFormNotes}
                  onChange={(e) => setFollowUpFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setFollowUpModalCustomer(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFollowUp}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
              >
                Save Follow-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
