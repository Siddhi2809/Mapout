'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useERP } from '../../context/ERPContext';
import { UserRole } from '../../types/erp';
import {
  Bell,
  ShieldCheck,
  Building2,
  AlertTriangle,
  X,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { activeRole, setActiveRole, alerts } = useERP();
  const [showAlertDrawer, setShowAlertDrawer] = useState(false);

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;

  const rolesList: { role: UserRole; label: string; bg: string }[] = [
    { role: 'ADMIN', label: 'Owner / Admin', bg: 'bg-slate-800 text-slate-200 border-slate-600' },
    { role: 'SALES', label: 'Sales Manager', bg: 'bg-blue-600/30 text-blue-300 border-blue-500/40' },
    { role: 'STORE', label: 'Store & Inventory', bg: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40' },
    { role: 'PRODUCTION', label: 'Production Line', bg: 'bg-amber-600/30 text-amber-300 border-amber-500/40' },
    { role: 'ACCOUNTS', label: 'Accounts Lead', bg: 'bg-rose-600/30 text-rose-300 border-rose-500/40' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-2.5">
      <div className="flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="relative h-10 w-44 bg-white/95 rounded-lg p-1.5 flex items-center justify-center shadow-inner">
            <Image
              src="/logo.png"
              alt="Sunyash MapOut24 Logo"
              width={160}
              height={36}
              priority
              className="object-contain max-h-8"
            />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-1.5">
              SUNYASH ERP <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">v2.4</span>
            </span>
            <span className="text-xs text-slate-400">MapOut24 OBD Cable Manufacturing</span>
          </div>
        </div>

        {/* Role Switcher & Alerts Drawer Button */}
        <div className="flex items-center space-x-3">
          {/* Active Role Switcher Pill */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <div className="hidden sm:flex items-center gap-1 px-2 text-xs font-semibold text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Role:
            </div>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as UserRole)}
              className="bg-slate-900 text-xs text-slate-100 font-medium px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {rolesList.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertDrawer(!showAlertDrawer)}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center"
              title="View ERP Live Alerts"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown / Panel */}
            {showAlertDrawer && (
              <div className="absolute right-0 mt-3 w-80 md:w-96 rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-xl z-50 overflow-hidden">
                <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-slate-100">Live System Alerts</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                      {alerts.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAlertDrawer(false)}
                    className="text-slate-400 hover:text-slate-200 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No active alerts. All operations running smoothly!
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          if (alert.actionLinkModule) setActiveTab(alert.actionLinkModule);
                          setShowAlertDrawer(false);
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition hover:scale-[1.01] ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                            : alert.severity === 'WARNING'
                            ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                            : 'bg-blue-950/30 border-blue-800/50 text-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span className="flex items-center gap-1.5">
                            {alert.severity === 'CRITICAL' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                            {alert.title}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </div>
                        <p className="text-[11px] opacity-80 leading-relaxed">{alert.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
