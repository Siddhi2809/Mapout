'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RAW_MATERIAL_NAV, PRODUCT_NAV, SALES_NAV } from '@/lib/nav';
import { DemoUser } from '@/lib/auth';
import {
  ClipboardList,
  Calendar,
  User,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface DailyReportItem {
  id: string;
  employeeName: string;
  date: string;
  work: string;
  createdAt: string;
}

export default function DailyReportPage() {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [work, setWork] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [myRecentReports, setMyRecentReports] = useState<DailyReportItem[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  // Load user data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('crm_user');
      if (stored) {
        const u: DemoUser = JSON.parse(stored);
        setCurrentUser(u);
        const name = u.name || u.roleTitle || 'Employee';
        setEmployeeName(name);
        fetchMyReports(name);
      } else {
        setEmployeeName('Employee');
        fetchMyReports('Employee');
      }
    } catch {
      setEmployeeName('Employee');
      fetchMyReports('Employee');
    }
  }, []);

  const fetchMyReports = async (name: string) => {
    try {
      setIsLoadingReports(true);
      const res = await fetch(`/api/daily-reports?employeeName=${encodeURIComponent(name)}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setMyRecentReports(result.data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!work.trim()) {
      setErrorMessage('Please describe the work done before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmittedSuccess(false);

    try {
      const res = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: employeeName.trim(),
          date: date.trim(),
          work: work.trim(),
        }),
      });

      const result = await res.json();
      if (result.success) {
        setSubmittedSuccess(true);
        setWork('');
        // Refresh my reports list
        fetchMyReports(employeeName.trim());
      } else {
        setErrorMessage(result.message || 'Failed to submit report. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while submitting report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine navigation items based on logged-in role
  const getNavItems = () => {
    if (!currentUser) return SALES_NAV;
    if (currentUser.role === 'RAW_MATERIAL') return RAW_MATERIAL_NAV;
    if (currentUser.role === 'PRODUCT') return PRODUCT_NAV;
    return SALES_NAV;
  };

  const getRoleTitle = () => {
    if (!currentUser) return 'Employee Portal';
    return currentUser.roleTitle || 'Employee Management';
  };

  const getRoleBadge = () => {
    if (!currentUser) return 'Employee';
    return currentUser.role || 'Staff';
  };

  return (
    <DashboardLayout
      roleTitle={getRoleTitle()}
      roleBadge={getRoleBadge()}
      navItems={getNavItems()}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Daily Report</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit your daily work report directly to the Administrator.
              </p>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {submittedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-bold">Report Submitted Successfully</div>
              <div className="text-xs text-emerald-700">
                Your daily work report for <span className="font-semibold">{date}</span> has been saved and marked as submitted to the Admin.
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold">{errorMessage}</div>
          </div>
        )}

        {/* Daily Report Form - Exactly 3 Fields */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <form onSubmit={handleSendReport} className="space-y-5">
            {/* Field 1: Employee Name (automatically fetched from logged-in user) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Employee Name
              </label>
              <input
                type="text"
                value={employeeName}
                readOnly
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none cursor-not-allowed select-none"
                placeholder="Logged-in Employee Name"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Automatically fetched from your logged-in user account.
              </span>
            </div>

            {/* Field 2: Date (automatically set / selectable) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
              />
            </div>

            {/* Field 3: Work (text area where employee writes their daily work) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Work
              </label>
              <textarea
                value={work}
                onChange={(e) => setWork(e.target.value)}
                required
                rows={6}
                placeholder="Write your daily work summary here..."
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-slate-400 resize-y"
              />
            </div>

            {/* Send Report Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Sending Report...' : 'Send Report'}
              </button>
            </div>
          </form>
        </div>

        {/* Submitted Reports by this employee */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                My Submitted Reports
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {myRecentReports.length} Submitted
            </span>
          </div>

          {isLoadingReports ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading your reports...</div>
          ) : myRecentReports.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No reports submitted yet. Write your work above and click &quot;Send Report&quot;.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 space-y-3">
              {myRecentReports.map((rep) => (
                <div key={rep.id} className="pt-3 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      {rep.date}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Submitted
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {rep.work}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
