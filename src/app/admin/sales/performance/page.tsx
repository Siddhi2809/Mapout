'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import {
  UserCheck,
  Search,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';

export default function AdminSalesPerformancePage() {
  const { salesOrders, customers, followUps, customerPayments } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRep, setSelectedRep] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Aggregated Salesperson Performance Metrics
  const repMetrics = useMemo(() => {
    const repMap = new Map<
      string,
      {
        name: string;
        totalOrders: number;
        totalSales: number;
        todaySales: number;
        monthlySales: number;
        customerCount: number;
        pendingFollowUps: number;
        completedFollowUps: number;
        pendingPayments: number;
        ordersList: typeof salesOrders;
      }
    >();

    // 1. Process Orders
    salesOrders.forEach((o) => {
      const rep = o.salesperson || o.createdBy || 'Direct Sales';
      const existing = repMap.get(rep) || {
        name: rep,
        totalOrders: 0,
        totalSales: 0,
        todaySales: 0,
        monthlySales: 0,
        customerCount: 0,
        pendingFollowUps: 0,
        completedFollowUps: 0,
        pendingPayments: 0,
        ordersList: [],
      };

      const amount = o.grandTotal || o.totalAmount || 0;
      existing.totalOrders += 1;
      existing.totalSales += amount;
      existing.ordersList.push(o);

      if (o.orderDate === todayStr) {
        existing.todaySales += amount;
      }
      if (o.orderDate && o.orderDate.startsWith(currentMonthStr)) {
        existing.monthlySales += amount;
      }
      if (o.paymentStatus !== 'PAID') {
        existing.pendingPayments += o.amountOutstanding || o.pendingAmount || 0;
      }

      repMap.set(rep, existing);
    });

    // 2. Process Customers assigned
    customers.forEach((c) => {
      const rep = c.assignedSalesUser || 'Direct Sales';
      if (repMap.has(rep)) {
        repMap.get(rep)!.customerCount += 1;
      }
    });

    // 3. Process Follow-ups
    followUps.forEach((f) => {
      const rep = f.assignedUser || 'Direct Sales';
      if (repMap.has(rep)) {
        if (f.status === 'Completed') {
          repMap.get(rep)!.completedFollowUps += 1;
        } else {
          repMap.get(rep)!.pendingFollowUps += 1;
        }
      }
    });

    return Array.from(repMap.values()).sort((a, b) => b.totalSales - a.totalSales);
  }, [salesOrders, customers, followUps, todayStr, currentMonthStr]);

  const filteredReps = useMemo(() => {
    return repMetrics.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [repMetrics, searchQuery]);

  const selectedRepData = useMemo(() => {
    if (!selectedRep) return null;
    return repMetrics.find((r) => r.name === selectedRep);
  }, [selectedRep, repMetrics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Salesperson Performance</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {repMetrics.length} Executives
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time individual accountability: revenue realized, customer accounts, pending follow-ups, and collection aging.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search salesperson / representative name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReps.map((rep, idx) => (
          <div
            key={rep.name}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{rep.name}</h3>
                    <div className="text-[11px] text-slate-500">Accounts Managed: {rep.customerCount}</div>
                  </div>
                </div>
                {idx === 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                    <Award className="w-3 h-3 text-amber-600" /> Top Performer
                  </span>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Revenue</div>
                  <div className="font-black text-slate-900 mt-0.5 text-sm">
                    ₹{rep.totalSales.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{rep.totalOrders} Orders</div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="text-[10px] text-blue-600 font-bold uppercase">This Month</div>
                  <div className="font-black text-blue-800 mt-0.5 text-sm">
                    ₹{rep.monthlySales.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-blue-600 mt-0.5">Today: ₹{rep.todaySales.toLocaleString('en-IN')}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Follow-ups</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-emerald-700 font-bold">{rep.completedFollowUps} Done</span>
                    <span>•</span>
                    <span className="text-amber-700 font-bold">{rep.pendingFollowUps} Due</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100">
                  <div className="text-[10px] text-rose-600 font-bold uppercase">Pending Payments</div>
                  <div className="font-black text-rose-700 mt-0.5 text-xs">
                    ₹{rep.pendingPayments.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedRep(rep.name)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-200"
            >
              <Eye className="w-3.5 h-3.5" /> View Executive Orders ({rep.ordersList.length})
            </button>
          </div>
        ))}
      </div>

      {/* Drilldown Modal: Salesperson Orders */}
      {selectedRepData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedRepData.name} - Orders Breakdown</h3>
                <div className="text-xs text-slate-500">
                  Total Realized: ₹{selectedRepData.totalSales.toLocaleString('en-IN')} across {selectedRepData.totalOrders} orders
                </div>
              </div>
              <button onClick={() => setSelectedRep(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto flex-1 text-xs">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedRepData.ordersList.map((o) => (
                  <div key={o.id} className="p-3.5 flex justify-between items-center bg-slate-50/40 hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">{o.orderNumber}</div>
                      <div className="text-[11px] text-slate-500">{o.customerName} · Date: {o.orderDate}</div>
                      <div className="flex gap-2 text-[10px] mt-1">
                        <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                          {o.dispatchStatus}
                        </span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                          {o.paymentStatus}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-black text-slate-900 text-sm">
                      ₹{(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
              <button
                onClick={() => setSelectedRep(null)}
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
