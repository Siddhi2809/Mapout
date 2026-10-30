'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  Calendar,
  User,
  RotateCcw,
  Filter,
} from 'lucide-react';

interface DailyReport {
  id: string;
  employeeName: string;
  date: string;
  work: string;
  createdAt: string;
}

export default function AdminDailyReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await fetch('/api/daily-reports');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReports(data.data);
      } else {
        setErrorMessage(data.message || 'Failed to load reports');
      }
    } catch (err: any) {
      console.error('Error fetching daily reports:', err);
      setErrorMessage(err.message || 'Error connecting to database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Unique employee names for quick filter suggestions
  const employeeNames = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.employeeName) set.add(r.employeeName);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Filter reports by Employee Name and Date ONLY
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesEmployee =
        !employeeFilter.trim() ||
        r.employeeName.toLowerCase().includes(employeeFilter.trim().toLowerCase());

      const matchesDate = !dateFilter.trim() || r.date === dateFilter.trim();

      return matchesEmployee && matchesDate;
    });
  }, [reports, employeeFilter, dateFilter]);

  const clearFilters = () => {
    setEmployeeFilter('');
    setDateFilter('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Daily Reports</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {filteredReports.length} Submitted
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review daily work reports submitted by employees across the organization.
            </p>
          </div>
        </div>

        <button
          onClick={fetchReports}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-2 transition shrink-0 cursor-pointer"
          title="Refresh reports from database"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar: Employee Name & Date */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center gap-3">
        {/* Filter 1: Employee Name */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            list="employee-suggestions"
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            placeholder="Filter by Employee Name..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
          <datalist id="employee-suggestions">
            {employeeNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        {/* Filter 2: Date */}
        <div className="relative w-full md:w-56">
          <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        {/* Clear Filters */}
        {(employeeFilter || dateFilter) && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition shrink-0 cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {errorMessage}
        </div>
      )}

      {/* Simple Table/List with ONLY: Employee Name, Date, Work */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4 w-1/4">Employee Name</th>
                <th className="py-3 px-4 w-1/6">Date</th>
                <th className="py-3 px-4">Work</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    Loading submitted daily reports from database...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    {reports.length === 0
                      ? 'No daily reports submitted yet.'
                      : 'No reports match your selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50/70 transition"
                  >
                    {/* Field 1: Employee Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 align-top">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-blue-100">
                          {report.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{report.employeeName}</span>
                      </div>
                    </td>

                    {/* Field 2: Date */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap align-top">
                      {report.date}
                    </td>

                    {/* Field 3: Work */}
                    <td className="py-3.5 px-4 text-slate-700 whitespace-pre-wrap leading-relaxed align-top">
                      {report.work}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
