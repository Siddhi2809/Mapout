'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { MaterialConsumption } from '@/types/erp';
import {
  Factory,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

export default function AdminMaterialConsumptionPage() {
  const { materialConsumptions } = useERP();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredConsumptions = useMemo(() => {
    return materialConsumptions.filter((c) => {
      return (
        c.consumptionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.rawMaterialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.productionOrderNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [materialConsumptions, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Material Consumption Log</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {materialConsumptions.length} Consumption Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Production line material usage: copper harness draw, connectors consumed, and factory batch reconciliation.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search consumption ID, material name, production order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Consumption ID</th>
                <th className="px-4 py-3.5">Production Order Ref</th>
                <th className="px-4 py-3.5">Raw Material Consumed</th>
                <th className="px-4 py-3.5 text-center font-bold text-rose-700">Quantity Consumed</th>
                <th className="px-4 py-3.5 text-center">Date</th>
                <th className="px-5 py-3.5">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsumptions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900 font-mono">
                    {c.consumptionId}
                  </td>

                  <td className="px-4 py-4 text-blue-600 font-mono font-bold">
                    {c.productionOrderNumber}
                  </td>

                  <td className="px-4 py-4 font-semibold text-slate-800">
                    {c.rawMaterialName}
                  </td>

                  <td className="px-4 py-4 text-center font-black text-rose-700 text-sm">
                    -{c.quantity} units
                  </td>

                  <td className="px-4 py-4 text-center text-slate-600 font-medium">
                    {c.date}
                  </td>

                  <td className="px-5 py-4 text-slate-500">
                    {c.createdBy || 'Production Engineer'}
                  </td>
                </tr>
              ))}
              {filteredConsumptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    No consumption logs found.
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
