'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Boxes,
  Bell,
  Search,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Check,
} from 'lucide-react';
import { DemoUser } from '@/lib/auth';

export interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  badge?: number | string;
  isActive?: boolean;
  onClick?: () => void;
}

interface DashboardLayoutProps {
  roleTitle: string;
  roleBadge: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

export function DashboardLayout({
  roleTitle,
  roleBadge,
  navItems,
  children,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);

  // Sidebar Collapse & Auto-hide states
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [autoCollapseOnNavigate, setAutoCollapseOnNavigate] = useState<boolean>(false);

  // Load preferences from localStorage & setup keyboard shortcut
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('crm_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(savedCollapsed === 'true');
      }
      const savedAuto = localStorage.getItem('crm_sidebar_auto_collapse');
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
          localStorage.setItem('crm_sidebar_collapsed', String(next));
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
      localStorage.setItem('crm_sidebar_collapsed', String(collapsed));
    } catch {}
  };

  const handleModuleClick = () => {
    setIsMobileOpen(false);
    if (autoCollapseOnNavigate) {
      toggleSidebar(true);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('crm_user');
      if (stored) {
        const u: DemoUser = JSON.parse(stored);
        setUser(u);

        // Access control check for routes
        if (pathname.startsWith('/admin')) {
          const allowedRoles = ['ADMIN'];
          if (!allowedRoles.includes(u.role)) {
            setIsAuthorized(false);
          } else {
            setIsAuthorized(true);
          }
        } else if (pathname.startsWith('/raw-material')) {
          const allowedRoles = ['ADMIN', 'RAW_MATERIAL', 'STORE', 'PRODUCTION'];
          if (!allowedRoles.includes(u.role)) {
            setIsAuthorized(false);
          } else {
            setIsAuthorized(true);
          }
        } else if (pathname.startsWith('/product')) {
          const allowedRoles = ['ADMIN', 'PRODUCT', 'PRODUCTION', 'STORE'];
          if (!allowedRoles.includes(u.role)) {
            setIsAuthorized(false);
          } else {
            setIsAuthorized(true);
          }
        } else if (pathname.startsWith('/sales')) {
          const allowedRoles = ['ADMIN', 'SALES'];
          if (!allowedRoles.includes(u.role)) {
            setIsAuthorized(false);
          } else {
            setIsAuthorized(true);
          }
        } else {
          setIsAuthorized(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('crm_user');
    router.push('/login');
  };

  const userName = user?.name || roleTitle;

  // Breadcrumbs calculation
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, idx) => {
    const href = '/' + pathSegments.slice(0, idx + 1).join('/');
    const formatted = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return { label: formatted, href };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-blue-600 selection:text-white">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 shadow-sm ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Header */}
          <div className="h-20 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            {!isCollapsed ? (
              <div className="flex items-center justify-between w-full">
                <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="MapOut Logo"
                    className="h-8 w-auto object-contain"
                  />
                  <div className="truncate">
                    <span className="block text-[10px] text-blue-600 font-bold uppercase tracking-wider">{roleBadge}</span>
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
                    className="md:hidden text-slate-400 hover:text-slate-700 p-1.5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full gap-2">
                <Link href="/" title="Home">
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

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto scrollbar-thin">
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
                      localStorage.setItem('crm_sidebar_auto_collapse', String(e.target.checked));
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

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.isActive !== undefined ? item.isActive : pathname === item.href;

              const innerContent = (
                <div
                  className={`group relative flex items-center ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-semibold transition w-full ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge !== undefined && Number(item.badge) > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        isActive ? 'bg-white text-blue-700' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Flyout Tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none hidden group-hover:flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge !== undefined && Number(item.badge) > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );

              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      handleModuleClick();
                      item.onClick?.();
                    }}
                    className="w-full text-left"
                  >
                    {innerContent}
                  </button>
                );
              }

              return (
                <Link
                  key={item.href || item.label}
                  href={item.href || '#'}
                  onClick={handleModuleClick}
                  className="block w-full"
                >
                  {innerContent}
                </Link>
              );
            })}
          </nav>

          {/* User Footer Profile */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/60 shrink-0">
            {!isCollapsed ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">{userName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{roleTitle}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0"
                  title={`${userName} (${roleTitle})`}
                >
                  <User className="w-4 h-4" />
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 px-4 md:px-8 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700"
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

            {/* Breadcrumb Navigation */}
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Link href="/" className="hover:text-slate-900">
                Home
              </Link>
              {breadcrumbItems.map((b, idx) => (
                <React.Fragment key={b.href}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <Link
                    href={b.href}
                    className={
                      idx === breadcrumbItems.length - 1
                        ? 'text-blue-600 font-semibold'
                        : 'hover:text-slate-900'
                    }
                  >
                    {b.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Search & Header Tools */}
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search module..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <Link
              href="/daily-report"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition shadow-2xs"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Daily Report</span>
            </Link>

            <button
              title="Notifications"
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 relative"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-2 right-2 ring-2 ring-white" />
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {!isAuthorized ? (
            <div className="erp-card p-12 text-center space-y-4 border border-rose-200 bg-rose-50 rounded-2xl max-w-lg mx-auto mt-12 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your current account role ({user?.roleTitle || user?.role || 'Guest'}) does not have permission to view or manage this module. Please log in with an authorized account or Administrator.
                </p>
                <div className="pt-4">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    Switch Account / Login
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

export function ModulePlaceholder({
  moduleName,
  description,
}: {
  moduleName: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{moduleName}</h1>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>

      <div className="erp-card p-12 text-center space-y-4 border border-dashed border-slate-300 bg-white rounded-2xl shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">{moduleName} Module Placeholder</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            The user interface layout and route navigation structure for this module are configured. Detailed data tables, workflows, and CRUD operations will be integrated in the next implementation phase.
          </p>
        </div>
      </div>
    </div>
  );
}
