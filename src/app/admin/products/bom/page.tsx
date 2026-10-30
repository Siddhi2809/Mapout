'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { BOM } from '@/types/erp';
import {
  Layers,
  Search,
  Filter,
  Eye,
  Plus,
  Boxes,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';

export default function AdminBOMPage() {
  const { boms } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);

  const filteredBoms = useMemo(() => {
    return boms.filter((b) => {
      return (
        b.bomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [boms, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bill of Materials (BOM)</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {boms.length} Recipes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Component recipes, raw material consumption rates, version history, and assembly specifications.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search BOM by number, finished product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* BOM Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBoms.map((bom) => (
          <div
            key={bom.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {bom.bomNumber}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Version {bom.version}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{bom.productName}</h3>

              <div className="text-xs text-slate-500">
                Created: <strong>{bom.createdDate}</strong> by {bom.createdBy || 'Engineering Team'}
              </div>

              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-700 mb-1">
                  Components ({bom.items?.length || 0}):
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {bom.items?.slice(0, 3).map((item) => (
                    <div key={item.id} className="p-2 flex justify-between bg-slate-50/30">
                      <span className="font-medium text-slate-800 truncate max-w-[170px]">
                        {item.rawMaterialName}
                      </span>
                      <span className="font-bold text-slate-700">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                  {bom.items && bom.items.length > 3 && (
                    <div className="p-1.5 text-center text-[10px] text-blue-600 font-bold bg-slate-50">
                      +{bom.items.length - 3} more raw materials
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedBOM(bom)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-200"
            >
              <Eye className="w-3.5 h-3.5" /> View Full Recipe Specification
            </button>
          </div>
        ))}
        {filteredBoms.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-300">
            No Bill of Materials recipes found.
          </div>
        )}
      </div>

      {/* Modal: BOM Details */}
      {selectedBOM && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedBOM.productName}</h3>
                <div className="text-xs text-slate-500 font-mono">
                  {selectedBOM.bomNumber} · Version {selectedBOM.version}
                </div>
              </div>
              <button onClick={() => setSelectedBOM(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="font-bold text-slate-800">Required Raw Materials per Unit:</div>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-64 overflow-y-auto">
                {selectedBOM.items?.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between items-center bg-slate-50/40">
                    <div>
                      <div className="font-bold text-slate-800">{item.rawMaterialName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">
                        {item.quantity} {item.unit}
                      </div>
                      {item.wastagePercent > 0 && (
                        <div className="text-[10px] text-amber-600 font-semibold">
                          +{item.wastagePercent}% wastage buffer
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedBOM(null)}
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
