'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Shield, Layers, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { DemoUser } from '@/lib/auth';

interface DashboardPlaceholderProps {
  expectedRole: string;
}

export function DashboardPlaceholder({ expectedRole }: DashboardPlaceholderProps) {
  const router = useRouter();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('crm_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('crm_user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentUser = user || {
    name: expectedRole === 'ADMIN' ? 'Admin' : expectedRole === 'RAW_MATERIAL' ? 'Raw Material Manager' : expectedRole === 'PRODUCT' ? 'Product Manager' : 'Sales Manager',
    roleTitle: expectedRole === 'ADMIN' ? 'Administrator' : expectedRole === 'RAW_MATERIAL' ? 'Raw Material Management' : expectedRole === 'PRODUCT' ? 'Product Management' : 'Sales Management',
    role: expectedRole,
    email: '',
    password: '',
    redirectRoute: '',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex flex-col justify-between relative overflow-hidden">
      {/* Background glow ambient effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">CRM Dashboard</h2>
            <p className="text-xs text-slate-400">Phase 1 Placeholder View</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-500/10 hover:border-rose-500/30 border border-slate-800 text-slate-300 hover:text-rose-400 text-xs font-semibold flex items-center gap-2 transition"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Main Content Box */}
      <div className="max-w-4xl w-full mx-auto my-auto py-12">
        <div className="erp-card p-8 md:p-12 space-y-6 text-center border border-slate-800 bg-slate-900/80 rounded-2xl relative shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome, {currentUser.name}
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" /> Role: {currentUser.roleTitle}
            </div>
          </div>

          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            You have successfully logged in to the testing environment. Detailed CRM modules will be connected in subsequent phases.
          </p>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-4xl w-full mx-auto pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
        Inventory, Production & Sales Management CRM • Phase 1 Prototype
      </div>
    </div>
  );
}
