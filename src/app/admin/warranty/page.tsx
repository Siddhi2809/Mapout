'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import {
  FileCheck,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Building2,
  XCircle,
  Eye,
  Plus,
} from 'lucide-react';

interface WarrantyItem {
  id: string;
  orderNumber: string;
  productName: string;
  sku: string;
  serialNumber: string;
  batchNumber: string;
  customerName: string;
  purchaseDate: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  daysRemaining: number;
  status: 'Active' | 'Expiring Soon' | 'Expired';
}

export default function AdminWarrantyPage({
  initialTab = 'active',
}: {
  initialTab?: 'active' | 'expiring' | 'expired' | 'claims';
}) {
  const { salesOrders, productReturns } = useERP();

  const [activeTab, setActiveTab] = useState<'active' | 'expiring' | 'expired' | 'claims'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate warranty records from real dispatched/delivered orders
  const warranties = useMemo(() => {
    const list: WarrantyItem[] = [];
    const now = Date.now();

    salesOrders.forEach((o) => {
      const pDate = (o.orderDate || o.createdAt || new Date().toISOString()).split('T')[0];
      const pDateTime = new Date(pDate).getTime();
      const warrantyPeriodYears = 1; // 1 year warranty standard
      const endDateTime = pDateTime + warrantyPeriodYears * 365 * 24 * 60 * 60 * 1000;
      const endDateStr = new Date(endDateTime).toISOString().split('T')[0];
      const daysRemaining = Math.ceil((endDateTime - now) / (1000 * 60 * 60 * 24));

      let status: 'Active' | 'Expiring Soon' | 'Expired' = 'Active';
      if (daysRemaining < 0) {
        status = 'Expired';
      } else if (daysRemaining <= 30) {
        status = 'Expiring Soon';
      }

      o.items?.forEach((item, idx) => {
        list.push({
          id: `${o.id}_${item.productId || idx}`,
          orderNumber: o.orderNumber,
          productName: item.productName,
          sku: item.sku,
          serialNumber: item.serialNumber || o.serialNumber || `SN-${o.orderNumber.slice(-4)}-${idx + 1}`,
          batchNumber: item.batchNumber || o.batchNumber || 'BAT-2026-Q1',
          customerName: o.customerName,
          purchaseDate: pDate,
          warrantyStartDate: pDate,
          warrantyEndDate: endDateStr,
          daysRemaining,
          status,
        });
      });
    });

    return list;
  }, [salesOrders]);

  const categorized = useMemo(() => {
    const activeList = warranties.filter((w) => w.status === 'Active');
    const expiringList = warranties.filter((w) => w.status === 'Expiring Soon');
    const expiredList = warranties.filter((w) => w.status === 'Expired');

    return { activeList, expiringList, expiredList };
  }, [warranties]);

  const currentDisplayList = useMemo(() => {
    let base: WarrantyItem[] = [];
    if (activeTab === 'active') base = categorized.activeList;
    else if (activeTab === 'expiring') base = categorized.expiringList;
    else if (activeTab === 'expired') base = categorized.expiredList;

    return base.filter((w) => {
      return (
        w.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [activeTab, categorized, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Warranty Tracking & Claims</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {warranties.length} Warranties
            </span>
            {categorized.expiringList.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {categorized.expiringList.length} Expiring Soon
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Component serial warranty lifecycle: auto-expiry tracking, claims processing, and customer replacements.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'active'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Active Warranty ({categorized.activeList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expiring')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'expiring'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Expiring Soon ({categorized.expiringList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expired')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'expired'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Expired Warranty ({categorized.expiredList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'claims'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Warranty Claims ({productReturns.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, serial number, product, order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* WARRANTY TABLES */}
      {activeTab !== 'claims' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Product & Serial #</th>
                  <th className="px-4 py-3.5">Customer & Order</th>
                  <th className="px-4 py-3.5">Batch #</th>
                  <th className="px-4 py-3.5">Purchase Date</th>
                  <th className="px-4 py-3.5">Warranty End Date</th>
                  <th className="px-4 py-3.5 text-center">Remaining Days</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentDisplayList.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{w.productName}</div>
                      <div className="text-[11px] text-blue-600 font-mono font-bold mt-0.5">
                        SN: {w.serialNumber}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{w.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">Order: {w.orderNumber}</div>
                    </td>

                    <td className="px-4 py-4 font-mono text-slate-600">
                      {w.batchNumber}
                    </td>

                    <td className="px-4 py-4 text-slate-600 font-medium">
                      {w.purchaseDate}
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-900">
                      {w.warrantyEndDate}
                    </td>

                    <td className="px-4 py-4 text-center font-bold">
                      <span className={w.daysRemaining < 30 ? 'text-amber-600' : 'text-emerald-600'}>
                        {w.daysRemaining > 0 ? `${w.daysRemaining} days` : 'Expired'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          w.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'Expiring Soon'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {currentDisplayList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      No warranty items in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CLAIMS TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Claim / Return #</th>
                  <th className="px-4 py-3.5">Customer & Invoice</th>
                  <th className="px-4 py-3.5">Defective Product</th>
                  <th className="px-4 py-3.5 text-center">Claim Units</th>
                  <th className="px-4 py-3.5">Reported Defect</th>
                  <th className="px-5 py-3.5 text-center">Claim Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{r.returnNumber}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{r.customerName}</div>
                      <div className="text-[11px] text-blue-600 font-mono mt-0.5">{r.salesInvoice}</div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800">{r.productName}</td>
                    <td className="px-4 py-4 text-center font-black text-slate-900">{r.quantity}</td>
                    <td className="px-4 py-4 text-slate-600 max-w-xs truncate">{r.returnReason}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {productReturns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      No warranty claims filed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
