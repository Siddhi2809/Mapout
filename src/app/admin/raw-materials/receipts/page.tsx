'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { MaterialReceipt } from '@/types/erp';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Building2,
} from 'lucide-react';

export default function AdminMaterialReceiptsPage() {
  const { materialReceipts } = useERP();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredReceipts = useMemo(() => {
    return materialReceipts.filter((r) => {
      return (
        r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.rawMaterialName && r.rawMaterialName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [materialReceipts, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Material Receipts (GRN)</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {materialReceipts.length} Goods Receipts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Goods Receipt Notes: warehouse intake logs, supplier delivery notes, quality inspections, and PO reconciliation.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by GRN #, supplier, PO #, material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">GRN / Receipt #</th>
                <th className="px-4 py-3.5">Vendor & PO Ref</th>
                <th className="px-4 py-3.5">Material Received</th>
                <th className="px-4 py-3.5 text-center font-bold text-emerald-700">Received Qty</th>
                <th className="px-4 py-3.5 text-center">Receipt Date</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900 font-mono">
                    {r.receiptNumber}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900">{r.supplierName}</div>
                    <div className="text-[11px] text-blue-600 font-mono mt-0.5">PO: {r.poNumber}</div>
                  </td>

                  <td className="px-4 py-4 font-semibold text-slate-800">
                    {r.rawMaterialName}
                  </td>

                  <td className="px-4 py-4 text-center font-black text-emerald-700 text-sm">
                    +{r.receivedQuantity} units
                  </td>

                  <td className="px-4 py-4 text-center text-slate-600 font-medium">
                    {r.receiptDate}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      {r.status || 'Received'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredReceipts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    No material receipt records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
