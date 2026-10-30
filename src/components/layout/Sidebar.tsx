'use client';

import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  LayoutDashboard,
  Boxes,
  PackageCheck,
  Cpu,
  Hammer,
  Users,
  ShoppingCart,
  Truck,
  Building,
  CreditCard,
  BarChart3,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { hasPermission, alerts } = useERP();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      permissionKey: 'dashboard' as const,
      badge: null,
    },
    {
      id: 'rawMaterials',
      label: 'Raw Materials CRUD',
      icon: Boxes,
      permissionKey: 'rawMaterials' as const,
      badge: alerts.filter((a) => a.type === 'LOW_RAW_MATERIAL').length,
    },
    {
      id: 'finishedGoods',
      label: 'Finished Goods Stock',
      icon: PackageCheck,
      permissionKey: 'finishedGoods' as const,
      badge: alerts.filter((a) => a.type === 'LOW_FINISHED_GOOD').length,
    },
    {
      id: 'bom',
      label: 'BOM Recipes',
      icon: Cpu,
      permissionKey: 'bom' as const,
      badge: null,
    },
    {
      id: 'production',
      label: 'Production Assembly',
      icon: Hammer,
      permissionKey: 'production' as const,
      badge: alerts.filter((a) => a.type === 'PENDING_PRODUCTION').length,
    },
    {
      id: 'salesOrders',
      label: 'Sales Orders & Dispatch',
      icon: ShoppingCart,
      permissionKey: 'salesOrders' as const,
      badge: alerts.filter((a) => a.type === 'PENDING_DISPATCH' || a.type === 'CUSTOMER_PAYMENT_OVERDUE').length,
    },
    {
      id: 'customers',
      label: 'Customers & CRM',
      icon: Users,
      permissionKey: 'customers' as const,
      badge: alerts.filter((a) => a.type === 'CUSTOMER_FOLLOWUP_DUE').length,
    },
    {
      id: 'purchaseOrders',
      label: 'Purchase Orders',
      icon: Truck,
      permissionKey: 'purchaseOrders' as const,
      badge: alerts.filter((a) => a.type === 'PENDING_PO').length,
    },
    {
      id: 'suppliers',
      label: 'Suppliers Directory',
      icon: Building,
      permissionKey: 'suppliers' as const,
      badge: alerts.filter((a) => a.type === 'SUPPLIER_PAYMENT_DUE').length,
    },
    {
      id: 'accounts',
      label: 'Accounts & Ledger',
      icon: CreditCard,
      permissionKey: 'accounts' as const,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 p-3 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-57px)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Core ERP Modules
        </div>
        {menuItems.map((item) => {
          const isAllowed = hasPermission(item.permissionKey);
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (!isAllowed) {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 opacity-60 cursor-not-allowed select-none"
                title="Restricted for current user role"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-semibold">Locked</span>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/10'
                  : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 space-y-1 shadow-sm">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <BarChart3 className="w-3.5 h-3.5 text-blue-600" /> System Operational
        </div>
        <p className="text-[10px] text-slate-500 leading-tight font-medium">
          Sunyash Multi Trading & MapOut24 ERP Infrastructure
        </p>
      </div>
    </aside>
  );
};
