'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  UserCheck,
  Layers,
  ArrowRight,
  Eye,
  X,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  user: string;
  role: string;
  action: string;
  module: string;
  recordId?: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);
      } else {
        // Fallback demo audit entries
        setLogs([
          {
            id: 'log_01',
            user: 'Administrator',
            role: 'ADMIN',
            action: 'Sales Order Status Updated',
            module: 'Sales',
            recordId: 'SO-2026-001',
            previousValue: 'dispatchStatus: PENDING',
            newValue: 'dispatchStatus: READY_FOR_DISPATCH',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'log_02',
            user: 'Product Manager',
            role: 'PRODUCT',
            action: 'Production Batch Completed',
            module: 'Production',
            recordId: 'PRD-ORD-101',
            previousValue: 'status: In Progress (produced: 0)',
            newValue: 'status: Completed (produced: 50 units credited)',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'log_03',
            user: 'Raw Material Store Head',
            role: 'RAW_MATERIAL',
            action: 'Stock Count Adjusted',
            module: 'Inventory',
            recordId: 'RM-COP-001',
            previousValue: 'currentStock: 480 meters',
            newValue: 'currentStock: 500 meters (Reconciled with physical count)',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            id: 'log_04',
            user: 'Sales Manager',
            role: 'SALES',
            action: 'Inward Payment Recorded',
            module: 'Payments',
            recordId: 'PAY-2026-089',
            previousValue: 'amountOutstanding: ₹1,50,000',
            newValue: 'amountOutstanding: ₹75,000 (Received ₹75,000 NEFT)',
            createdAt: new Date(Date.now() - 14400000).toISOString(),
          },
          {
            id: 'log_05',
            user: 'Administrator',
            role: 'ADMIN',
            action: 'Customer Credit Limit Modified',
            module: 'CRM',
            recordId: 'CUST-002',
            previousValue: 'creditLimit: ₹1,00,000',
            newValue: 'creditLimit: ₹2,50,000 (Approved for annual contract)',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const modules = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch =
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.recordId && l.recordId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.newValue && l.newValue.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchModule = moduleFilter ? l.module === moduleFilter : true;
      return matchSearch && matchModule;
    });
  }, [logs, searchQuery, moduleFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit Trail</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {logs.length} Logged Events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable administrative audit trail: tracking user actions, state transitions, security events, and database mutations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by action, user, record ID, or mutation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">User & Role</th>
                <th className="px-4 py-3.5">Action Executed</th>
                <th className="px-4 py-3.5">Module & Record</th>
                <th className="px-4 py-3.5">Mutation (Before → After)</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">
                    {new Date(l.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900">{l.user}</div>
                    <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 mt-0.5 inline-block">
                      {l.role}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-800">
                    {l.action}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-700">{l.module}</div>
                    {l.recordId && (
                      <div className="font-mono text-[10px] text-blue-600 font-bold mt-0.5">
                        #{l.recordId}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 max-w-xs truncate text-[11px]">
                    {l.previousValue && (
                      <span className="text-rose-600 line-through mr-1.5">{l.previousValue}</span>
                    )}
                    <span className="text-emerald-700 font-semibold">{l.newValue || 'Updated'}</span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedLog(l)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs transition text-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    No audit records match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log Detail */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedLog.action}</h3>
                <div className="text-xs text-slate-500 font-mono">
                  Module: {selectedLog.module} · Record: {selectedLog.recordId || 'N/A'}
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Initiator:</span>
                  <span className="font-bold text-slate-900">
                    {selectedLog.user} ({selectedLog.role})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="font-mono text-slate-700">{selectedLog.createdAt}</span>
                </div>
              </div>

              {selectedLog.previousValue && (
                <div>
                  <div className="font-bold text-slate-700 mb-1">Previous State Value:</div>
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-800 font-mono text-[11px] border border-rose-200">
                    {selectedLog.previousValue}
                  </div>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <div className="font-bold text-slate-700 mb-1">Mutated / New State Value:</div>
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-mono text-[11px] border border-emerald-200">
                    {selectedLog.newValue}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
