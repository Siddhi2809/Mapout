'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { ProductionOrder } from '@/types/erp';
import {
  Factory,
  Search,
  Filter,
  Eye,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  X,
  Layers,
} from 'lucide-react';

import Link from 'next/link';

export default function AdminProductionPage() {
  const { productionOrders, completeProductionOrder, products, salesOrders, quotations } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  const allProductionOrders = useMemo(() => {
    const list: any[] = [...productionOrders];
    const existingIds = new Set(productionOrders.map((p: any) => p.quotationId || p.orderNumber));

    // Also include orders sent to production from sales
    salesOrders.forEach((so) => {
      const isSent =
        so.productionStatus === 'Sent to Production' ||
        so.orderStatus === 'Sent to Production' ||
        so.orderStatus === 'Sent to Product' ||
        so.productionStatus === 'In Production';

      if (isSent && !existingIds.has(so.quotationNumber || so.orderNumber)) {
        (so.items || []).forEach((item, idx) => {
          list.unshift({
            id: `so_po_${so.id}_${idx}`,
            orderNumber: `${so.orderNumber}-${idx + 1}`,
            productName: item.productName,
            plannedQuantity: item.quantity,
            producedQuantity: so.productionStatus === 'Production Completed' ? item.quantity : 0,
            productionDate: so.productionDate || so.sentToProductDate || so.orderDate,
            expectedCompletion: so.dueDate || so.orderDate,
            status: so.productionStatus || 'Sent to Production',
            notes: `Customer Order for ${so.customerName} (Ref: ${so.orderNumber}${so.quotationNumber ? ' | Quote ' + so.quotationNumber : ''})`,
            bomVersion: 1,
            quotationNumber: so.quotationNumber,
            salesOrderId: so.id,
          });
        });
      }
    });

    return list;
  }, [productionOrders, salesOrders, quotations]);

  const filteredOrders = useMemo(() => {
    return allProductionOrders.filter((po) => {
      const matchSearch =
        po.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter ? po.status.toLowerCase() === statusFilter.toLowerCase() : true;
      return matchSearch && matchStatus;
    });
  }, [allProductionOrders, searchQuery, statusFilter]);

  const handleComplete = (id: string) => {
    if (confirm('Complete this production batch? This will credit Finished Goods stock and consume BOM materials.')) {
      completeProductionOrder(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Factory Production Orders</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {allProductionOrders.length} Orders / Batches
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manufacturing workflow monitoring: assembly orders, BOM raw material draw, work-in-progress, and final QA completion.
          </p>
        </div>

        <Link
          href="/product/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm"
        >
          <Factory className="w-4 h-4" />
          <span>Open Production & Packing Workflow</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by production order #, product name, customer..."
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
              <option value="">All Production Statuses</option>
              <option value="Sent to Production">Sent to Production</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Production Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Batch / Order #</th>
                <th className="px-4 py-3.5">Product to Manufacture</th>
                <th className="px-4 py-3.5 text-center">Planned Quantity</th>
                <th className="px-4 py-3.5 text-center">Produced Quantity</th>
                <th className="px-4 py-3.5">Schedule Dates</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900 font-mono">
                    {po.orderNumber}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900">{po.productName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">BOM Version: {po.bomVersion || 1}</div>
                  </td>

                  <td className="px-4 py-4 text-center font-bold text-slate-900">
                    {po.plannedQuantity} units
                  </td>

                  <td className="px-4 py-4 text-center font-bold text-emerald-700">
                    {po.producedQuantity} units
                  </td>

                  <td className="px-4 py-4">
                    <div className="text-slate-700">Start: {po.productionDate}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Est. End: {po.expectedCompletion}</div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        po.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : po.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : po.status === 'Sent to Production'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    {po.status !== 'Completed' ? (
                      <button
                        onClick={() => handleComplete(po.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete Batch
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Stock Credited
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No production orders found.
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
