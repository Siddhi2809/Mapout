'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { ProductReturn } from '@/types/erp';
import {
  RotateCcw,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  X,
  FileText,
} from 'lucide-react';

export default function AdminSalesReturnsPage() {
  const { productReturns } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);

  const filteredReturns = useMemo(() => {
    return productReturns.filter((r) => {
      const matchSearch =
        r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.returnReason.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter ? r.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [productReturns, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Returns & Replacements</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {productReturns.length} Claims
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized RMA claims: inspect returned automotive components, customer defect reasons, and replacement authorizations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by RMA #, customer, product, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All RMA Statuses</option>
              <option value="Requested">Requested</option>
              <option value="Approved">Approved</option>
              <option value="Inspected">Inspected</option>
              <option value="Replaced">Replaced / Closed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Return #</th>
                <th className="px-4 py-3.5">Customer & Invoice</th>
                <th className="px-4 py-3.5">Product Item</th>
                <th className="px-4 py-3.5 text-center">Claim Quantity</th>
                <th className="px-4 py-3.5">Return Reason</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900 font-mono">
                    {r.returnNumber}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900">{r.customerName}</div>
                    <div className="text-[11px] text-blue-600 font-mono mt-0.5">Inv: {r.salesInvoice}</div>
                  </td>

                  <td className="px-4 py-4 font-semibold text-slate-800">
                    {r.productName}
                  </td>

                  <td className="px-4 py-4 text-center font-bold text-slate-900">
                    {r.quantity} units
                  </td>

                  <td className="px-4 py-4 text-slate-600 max-w-xs truncate">
                    {r.returnReason}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        r.status === 'Approved' || r.status === 'Replaced'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedReturn(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReturns.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No returns or replacement claims found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Return Details */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Claim #{selectedReturn.returnNumber}</h3>
                <div className="text-xs text-slate-500">Customer: {selectedReturn.customerName}</div>
              </div>
              <button onClick={() => setSelectedReturn(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-bold text-slate-900">{selectedReturn.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity Claimed:</span>
                  <span className="font-bold text-slate-900">{selectedReturn.quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-bold text-blue-600">{selectedReturn.salesInvoice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-bold text-slate-900">{selectedReturn.status}</span>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-800 mb-1">Return Reason / Client Complaint:</div>
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-amber-900">
                  {selectedReturn.returnReason}
                </div>
              </div>

              {selectedReturn.inspectionNotes && (
                <div>
                  <div className="font-bold text-slate-800 mb-1">Quality Inspection Notes:</div>
                  <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
                    {selectedReturn.inspectionNotes}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedReturn(null)}
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
