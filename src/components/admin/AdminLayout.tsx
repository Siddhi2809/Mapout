'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  Clock,
  ShoppingCart,
  FileText,
  Truck,
  CreditCard,
  RotateCcw,
  BarChart3,
  Boxes,
  Layers,
  Factory,
  PackageCheck,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  Bell,
  ClipboardList,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Search,
  LogOut,
  User,
  SlidersHorizontal,
  Building2,
  DollarSign,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
} from 'lucide-react';
import { DemoUser } from '@/lib/auth';
import { useERP } from '@/context/ERPContext';

interface SidebarSection {
  title: string;
  icon: React.ElementType;
  baseHref: string;
  badge?: number | string;
  badgeColor?: string;
  subItems?: {
    label: string;
    href: string;
    badge?: number | string;
    badgeColor?: string;
  }[];
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');

  // Sidebar Collapse & Auto-hide states
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [autoCollapseOnNavigate, setAutoCollapseOnNavigate] = useState<boolean>(false);

  // Load preferences from localStorage & setup keyboard shortcut
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('crm_admin_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(savedCollapsed === 'true');
      }
      const savedAuto = localStorage.getItem('crm_admin_sidebar_auto_collapse');
      if (savedAuto !== null) {
        setAutoCollapseOnNavigate(savedAuto === 'true');
      }
    } catch {
      // Ignore
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsCollapsed((prev) => {
          const next = !prev;
          localStorage.setItem('crm_admin_sidebar_collapsed', String(next));
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      localStorage.setItem('crm_admin_sidebar_collapsed', String(collapsed));
    } catch {}
  };

  const handleModuleClick = () => {
    setIsMobileOpen(false);
    if (autoCollapseOnNavigate) {
      toggleSidebar(true);
    }
  };

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    CRM: true,
    Sales: true,
    Products: false,
    'Raw Materials': false,
    Inventory: false,
    Warranty: false,
    Payments: false,
  });
  const {
    salesOrders,
    rawMaterials,
    products,
    leads,
    followUps,
    customerPayments,
    productReturns,
  } = useERP();

  // Authentication & Authorization check
  useEffect(() => {
    try {
      const stored = localStorage.getItem('crm_user');
      if (stored) {
        const u: DemoUser = JSON.parse(stored);
        setUser(u);
        if (u.role !== 'ADMIN') {
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
        }
      } else {
        // If not logged in, default demo admin for smooth navigation or prompt
        const defaultAdmin: DemoUser = {
          name: 'Administrator',
          email: 'admin@crm.com',
          role: 'ADMIN',
          roleTitle: 'Chief Executive Administrator',
          password: 'Admin@123',
          redirectRoute: '/admin',
        };
        setUser(defaultAdmin);
        localStorage.setItem('crm_user', JSON.stringify(defaultAdmin));
        setIsAuthorized(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, [pathname]);

  // Dynamic Badge Calculations from real DB data
  const badges = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const pendingOrders = salesOrders.filter(
      (o) => o.dispatchStatus === 'PENDING' || o.dispatchStatus === 'Pending' || o.orderStatus === 'Confirmed'
    ).length;

    const lowStockMaterials = rawMaterials.filter(
      (m) => m.currentStock <= m.minStock
    ).length;

    const lowStockProducts = products.filter(
      (p) => p.currentStock <= p.minStock
    ).length;

    const todayFollowUps = followUps.filter(
      (f) => f.followUpDate === todayStr && f.status !== 'Completed'
    ).length;

    const overdueFollowUps = followUps.filter(
      (f) => f.followUpDate < todayStr && f.status !== 'Completed'
    ).length;

    const expiringWarranties = salesOrders.filter((o) => {
      if (o.dispatchStatus !== 'DELIVERED' && o.dispatchStatus !== 'DISPATCHED') return false;
      const dateStr = o.orderDate || o.createdAt;
      if (!dateStr) return false;
      const orderDate = new Date(dateStr);
      const daysPassed = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysPassed >= 335 && daysPassed <= 365;
    }).length;

    const overduePayments = salesOrders.filter(
      (o) => o.paymentStatus !== 'PAID' && o.dueDate && o.dueDate < todayStr
    ).length;

    const pendingReturns = productReturns.filter((r) => r.status === 'Requested').length;

    return {
      pendingOrders,
      lowStockMaterials,
      lowStockProducts,
      totalLowStock: lowStockMaterials + lowStockProducts,
      todayFollowUps,
      overdueFollowUps,
      expiringWarranties,
      overduePayments,
      pendingReturns,
      totalAlerts:
        pendingOrders +
        lowStockMaterials +
        lowStockProducts +
        overdueFollowUps +
        expiringWarranties +
        overduePayments,
    };
  }, [salesOrders, rawMaterials, products, followUps, productReturns]);

  // Keep section open if user is currently inside one of its sub-items
  useEffect(() => {
    const sections: Record<string, string> = {
      '/admin/crm': 'CRM',
      '/admin/sales': 'Sales',
      '/admin/products': 'Products',
      '/admin/raw-materials': 'Raw Materials',
      '/admin/inventory': 'Inventory',
      '/admin/warranty': 'Warranty',
      '/admin/payments': 'Payments',
    };

    for (const [prefix, sectionName] of Object.entries(sections)) {
      if (pathname.startsWith(prefix)) {
        setOpenSections((prev) => ({ ...prev, [sectionName]: true }));
      }
    }
  }, [pathname]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('crm_user');
    router.push('/login');
  };

  // Sidebar Menu Tree
  const sidebarMenu: SidebarSection[] = [
    {
      title: 'CRM',
      icon: Users,
      baseHref: '/admin/crm',
      badge: badges.overdueFollowUps > 0 ? `${badges.overdueFollowUps} Due` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
      subItems: [
        { label: 'Customers', href: '/admin/crm/customers' },
        { label: 'Leads', href: '/admin/crm/leads', badge: leads.length > 0 ? leads.length : undefined },
        {
          label: 'Follow-ups',
          href: '/admin/crm/follow-ups',
          badge: badges.todayFollowUps > 0 ? badges.todayFollowUps : undefined,
          badgeColor: 'bg-blue-100 text-blue-700',
        },
        { label: 'Meetings & Calendar', href: '/admin/crm/meetings' },
      ],
    },
    
    {
      title: 'Sales',
      icon: ShoppingCart,
      baseHref: '/admin/sales',
      badge: badges.pendingOrders > 0 ? badges.pendingOrders : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
      subItems: [
        {
          label: 'Sales Orders',
          href: '/admin/sales/orders',
          badge: badges.pendingOrders > 0 ? badges.pendingOrders : undefined,
          badgeColor: 'bg-blue-100 text-blue-700',
        },
        { label: 'Invoices', href: '/admin/sales/invoices' },
        { label: 'Dispatch', href: '/admin/sales/dispatch' },
        { label: 'Payments', href: '/admin/sales/payments' },
        {
          label: 'Returns / Replacement',
          href: '/admin/sales/returns',
          badge: badges.pendingReturns > 0 ? badges.pendingReturns : undefined,
          badgeColor: 'bg-amber-100 text-amber-700',
        },
        { label: 'Salesperson Performance', href: '/admin/sales/performance' },
      ],
    },
    {
      title: 'Products',
      icon: Boxes,
      baseHref: '/admin/products',
      subItems: [
        { label: 'Products', href: '/admin/products' },
        { label: 'BOM', href: '/admin/products/bom' },
        { label: 'Production', href: '/admin/products/production' },
        { label: 'Finished Goods', href: '/admin/products/finished-goods' },
      ],
    },
    {
      title: 'Raw Materials',
      icon: Layers,
      baseHref: '/admin/raw-materials',
      badge: badges.lowStockMaterials > 0 ? `${badges.lowStockMaterials} Low` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
      subItems: [
        { label: 'Raw Materials', href: '/admin/raw-materials' },
        { label: 'Suppliers', href: '/admin/raw-materials/suppliers' },
        { label: 'Purchase Orders', href: '/admin/raw-materials/purchase-orders' },
        { label: 'Material Receipts', href: '/admin/raw-materials/receipts' },
        { label: 'Material Consumption', href: '/admin/raw-materials/consumption' },
        { label: 'Supplier Payments', href: '/admin/raw-materials/payments' },
      ],
    },
    {
      title: 'Inventory',
      icon: PackageCheck,
      baseHref: '/admin/inventory',
      badge: badges.totalLowStock > 0 ? badges.totalLowStock : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
      subItems: [
        { label: 'Centralized Stock', href: '/stock' },
        { label: 'Raw Material Stock', href: '/admin/inventory/raw-materials' },
        { label: 'Finished Goods Stock', href: '/admin/inventory/finished-goods' },
        { label: 'Stock Movements', href: '/admin/inventory/movements' },
        {
          label: 'Low Stock',
          href: '/admin/inventory/low-stock',
          badge: badges.totalLowStock > 0 ? badges.totalLowStock : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        { label: 'Stock Adjustments', href: '/admin/inventory/adjustments' },
      ],
    },
    {
      title: 'Warranty',
      icon: FileCheck,
      baseHref: '/admin/warranty',
      badge: badges.expiringWarranties > 0 ? `${badges.expiringWarranties} Expiring` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
      subItems: [
        { label: 'Active Warranty', href: '/admin/warranty/active' },
        {
          label: 'Expiring Warranty',
          href: '/admin/warranty/expiring',
          badge: badges.expiringWarranties > 0 ? badges.expiringWarranties : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        { label: 'Expired Warranty', href: '/admin/warranty/expired' },
        { label: 'Warranty Claims', href: '/admin/warranty/claims' },
      ],
    },
    {
      title: 'Payments',
      icon: CreditCard,
      baseHref: '/admin/payments',
      badge: badges.overduePayments > 0 ? `${badges.overduePayments} Overdue` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
      subItems: [
        { label: 'Customer Payments', href: '/admin/payments/customers' },
        { label: 'Supplier Payments', href: '/admin/payments/suppliers' },
        { label: 'Pending Payments', href: '/admin/payments/pending' },
        {
          label: 'Overdue Payments',
          href: '/admin/payments/overdue',
          badge: badges.overduePayments > 0 ? badges.overduePayments : undefined,
          badgeColor: 'bg-rose-600 text-white',
        },
      ],
    },
   
  ];

  // Breadcrumbs calculation
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, idx) => {
    const href = '/' + pathSegments.slice(0, idx + 1).join('/');
    const label = segment
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { label, href };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* ======================================================== */}
      {/* ADMIN CENTRALIZED SIDEBAR */}
      {/* ======================================================== */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 shadow-sm ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-72'}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo & Portal Branding */}
          <div className="h-20 px-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            {!isCollapsed ? (
              <div className="flex items-center justify-between w-full">
                <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="MapOut Logo"
                    className="h-8 w-auto object-contain"
                  />
                  <div className="truncate">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        Admin ERP / CRM
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">Central Control Layer</div>
                  </div>
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleSidebar(true)}
                    className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="Hide / Collapse sidebar (Ctrl+B)"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden text-slate-400 hover:text-slate-700 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full gap-2">
                <Link href="/admin" title="Admin Dashboard">
                  <img
                    src="/logo.png"
                    alt="MapOut Logo"
                    className="h-7 w-auto object-contain"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => toggleSidebar(false)}
                  className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                  title="Expand sidebar (Ctrl+B)"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links Scrollable Tree */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin">
            {/* Quick Option to Hide Sidebar & Auto-hide Toggle inside Sidebar */}
            {!isCollapsed ? (
              <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <button
                  type="button"
                  onClick={() => toggleSidebar(true)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 shadow-2xs transition group"
                  title="Hide sidebar to give full width to charts and data tables"
                >
                  <span className="flex items-center gap-1.5">
                    <PanelLeftClose className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                    <span>Hide Sidebar</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                    Ctrl+B
                  </span>
                </button>

                <label className="flex items-center justify-between px-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                  <span className="flex items-center gap-1.5 text-[10.5px]">
                    <Maximize2 className="w-3 h-3 text-slate-400" />
                    Auto-hide on module click
                  </span>
                  <input
                    type="checkbox"
                    checked={autoCollapseOnNavigate}
                    onChange={(e) => {
                      setAutoCollapseOnNavigate(e.target.checked);
                      localStorage.setItem('crm_admin_sidebar_auto_collapse', String(e.target.checked));
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                </label>
              </div>
            ) : (
              <div className="mb-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => toggleSidebar(false)}
                  className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-2xs"
                  title="Show full sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Dashboard Direct Link */}
            <Link
              href="/admin"
              onClick={handleModuleClick}
              className={`group relative flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
              } rounded-xl text-xs font-bold transition mb-1 ${
                pathname === '/admin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={isCollapsed ? 'Dashboard' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 shrink-0 ${pathname === '/admin' ? 'text-white' : 'text-blue-600'}`} />
                {!isCollapsed && <span>Dashboard</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-slate-200">
                  Live
                </span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none hidden group-hover:flex items-center">
                  Dashboard
                </div>
              )}
            </Link>

            {/* Hierarchical Sidebar Sections */}
            {sidebarMenu.map((section) => {
              const Icon = section.icon;
              const isOpen = openSections[section.title] ?? false;
              const isSectionActive = pathname.startsWith(section.baseHref);

              if (isCollapsed) {
                // Collapsed Icon-only view with flyout menu
                return (
                  <div key={section.title} className="group relative py-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        toggleSidebar(false);
                        toggleSection(section.title);
                      }}
                      className={`p-2.5 rounded-xl transition ${
                        isSectionActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      title={section.title}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </button>

                    {/* Collapsed Flyout Submenu */}
                    <div className="absolute left-full ml-3 top-0 py-2 px-1 bg-slate-900 text-white rounded-xl shadow-2xl z-50 min-w-48 hidden group-hover:block border border-slate-800 animate-in fade-in duration-150">
                      <div className="px-3 py-1 font-bold text-xs text-blue-400 border-b border-slate-800 flex items-center justify-between">
                        <span>{section.title}</span>
                        {section.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-blue-600 text-white rounded-full">
                            {section.badge}
                          </span>
                        )}
                      </div>
                      <div className="pt-1 space-y-0.5">
                        {section.subItems?.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={handleModuleClick}
                            className={`block px-3 py-1.5 text-xs rounded-lg transition hover:bg-slate-800 ${
                              pathname === sub.href ? 'text-blue-400 font-bold bg-slate-800/80' : 'text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{sub.label}</span>
                              {sub.badge !== undefined && (
                                <span className="text-[9px] px-1 py-0.2 bg-slate-700 rounded text-slate-300">
                                  {sub.badge}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={section.title} className="space-y-0.5 pt-1">
                  {/* Section Accordion Trigger */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                      isSectionActive
                        ? 'bg-slate-100 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isSectionActive ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span>{section.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {section.badge && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                            section.badgeColor || 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {section.badge}
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Sub-menu items */}
                  {isOpen && section.subItems && (
                    <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l-2 border-slate-100 ml-4">
                      {section.subItems.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={handleModuleClick}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                              isSubActive
                                ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{sub.label}</span>
                            {sub.badge !== undefined && (
                              <span
                                className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                                  sub.badgeColor || 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Standalone Management Routes: Daily Reports, Users & Permissions, Settings */}
            <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
              {/* Daily Reports */}
              <Link
                href="/admin/daily-reports"
                onClick={handleModuleClick}
                className={`group relative flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-xl text-xs font-bold transition ${
                  pathname === '/admin/daily-reports' || pathname.startsWith('/admin/daily-reports')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={isCollapsed ? 'Daily Reports' : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList
                    className={`w-4 h-4 shrink-0 ${
                      pathname === '/admin/daily-reports' || pathname.startsWith('/admin/daily-reports')
                        ? 'text-white'
                        : 'text-blue-600'
                    }`}
                  />
                  {!isCollapsed && <span>Daily Reports</span>}
                </div>
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none hidden group-hover:block">
                    Daily Reports
                  </div>
                )}
              </Link>

              {/* Users & Permissions */}
              <Link
                href="/admin/users"
                onClick={handleModuleClick}
                className={`group relative flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-xl text-xs font-bold transition ${
                  pathname === '/admin/users' || pathname.startsWith('/admin/users')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={isCollapsed ? 'Users & Permissions' : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 ${
                      pathname === '/admin/users' || pathname.startsWith('/admin/users')
                        ? 'text-white'
                        : 'text-emerald-600'
                    }`}
                  />
                  {!isCollapsed && <span>Users & Permissions</span>}
                </div>
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none hidden group-hover:block">
                    Users & Permissions
                  </div>
                )}
              </Link>

              {/* Settings */}
              <Link
                href="/admin/settings"
                onClick={handleModuleClick}
                className={`group relative flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-xl text-xs font-bold transition ${
                  pathname === '/admin/settings' || pathname.startsWith('/admin/settings')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={isCollapsed ? 'Settings' : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <Settings
                    className={`w-4 h-4 shrink-0 ${
                      pathname === '/admin/settings' || pathname.startsWith('/admin/settings')
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}
                  />
                  {!isCollapsed && <span>Settings</span>}
                </div>
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none hidden group-hover:block">
                    Settings
                  </div>
                )}
              </Link>
            </div>
          </nav>

          {/* User Profile Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
            {!isCollapsed ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                    AD
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {user?.name || 'Administrator'}
                    </div>
                    <div className="text-[10px] text-blue-600 font-semibold truncate">
                      Central Admin
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0"
                  title={`${user?.name || 'Administrator'} (Central Admin)`}
                >
                  AD
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN ADMIN WORKSPACE AREA */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 px-4 md:px-8 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Show / Hide Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => toggleSidebar(!isCollapsed)}
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 text-xs font-bold shadow-2xs transition"
              title={isCollapsed ? 'Show Sidebar (Ctrl+B)' : 'Hide Sidebar for Wide Clean Charts (Ctrl+B)'}
            >
              {isCollapsed ? (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">Show Sidebar</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-slate-400" />
                  <span>Hide Sidebar</span>
                </>
              )}
            </button>

            {isCollapsed && (
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Full-Width Screen
              </span>
            )}

            {/* Breadcrumb Path */}
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Link href="/admin" className="text-blue-700 font-bold hover:underline">
                Admin
              </Link>
              {breadcrumbs.slice(1).map((b, idx) => (
                <React.Fragment key={b.href}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <Link
                    href={b.href}
                    className={
                      idx === breadcrumbs.length - 2
                        ? 'text-slate-900 font-bold'
                        : 'hover:text-slate-900'
                    }
                  >
                    {b.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Global Admin Search (Orders, Customers, SKUs)..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            {/* Notifications Trigger */}
            <Link
              href="/admin/notifications"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 relative transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {badges.totalAlerts > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 absolute top-1.5 right-1.5 ring-2 ring-white" />
              )}
            </Link>

            {/* Quick module indicators */}
            <div className="hidden lg:flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                DB Connected
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {!isAuthorized ? (
            <div className="erp-card p-12 text-center space-y-4 border border-rose-200 bg-rose-50 rounded-2xl max-w-lg mx-auto mt-12 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">Admin Authorization Required</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You are not currently logged in with Administrator privileges. Please sign in as an Admin user to view and manage this centralized interface.
                </p>
                <div className="pt-4">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    Login as Administrator
                  </button>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
