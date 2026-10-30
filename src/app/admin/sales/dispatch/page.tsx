'use client';

import React, { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { SalesDispatch } from '@/types/erp';
import {
  Truck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  ExternalLink,
  X,
  Eye,
  Calendar,
} from 'lucide-react';

export default function AdminDispatchPage() {
  const { dispatches, salesOrders, updateSalesOrderStatusFull } = useERP();

  const [activeTab, setActiveTab] = useState<'all' | 'ready' | 'dispatched' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDispatch, setSelectedDispatch] = useState<SalesDispatch | null>(null);

  const filteredDispatches = useMemo(() => {
    return dispatches.filter((d) => {
      const matchSearch =
        d.dispatchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.transporter.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === 'all'
          ? true
          : activeTab === 'ready'
          ? d.deliveryStatus === 'Ready' || d.deliveryStatus === 'READY_FOR_DISPATCH'
          : activeTab === 'dispatched'
          ? d.deliveryStatus === 'Dispatched'
          : d.deliveryStatus === 'Delivered';

      return matchSearch && matchTab;
    });
  }, [dispatches, searchQuery, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dispatch & Logistics</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {dispatches.length} Shipments
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track transporter consignments, delivery tracking codes, vehicle logs, and fulfillment status.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Shipments ({dispatches.length})
        </button>

        <button
          onClick={() => setActiveTab('dispatched')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'dispatched'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          In Transit / Dispatched
        </button>

        <button
          onClick={() => setActiveTab('delivered')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'delivered'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Delivered
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by dispatch #, customer, transporter, tracking #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Dispatches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Dispatch #</th>
                <th className="px-4 py-3.5">Customer & Order</th>
                <th className="px-4 py-3.5">Transporter</th>
                <th className="px-4 py-3.5">Tracking Number</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5 text-center">Delivery Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDispatches.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900 font-mono">
                    {d.dispatchNumber}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900">{d.customerName}</div>
                    <div className="text-[11px] text-blue-600 font-mono mt-0.5">Order: {d.salesOrderNumber}</div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-800">{d.transporter}</div>
                    {d.vehicleNumber && (
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Vehicle: {d.vehicleNumber}</div>
                    )}
                  </td>

                  <td className="px-4 py-4 font-mono font-bold text-slate-800">
                    {d.trackingNumber || 'PENDING'}
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {d.dispatchDate}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        d.deliveryStatus.toLowerCase() === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {d.deliveryStatus}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedDispatch(d)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDispatches.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No dispatch records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Dispatch Details */}
      {selectedDispatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Shipment #{selectedDispatch.dispatchNumber}</h3>
                <div className="text-xs text-slate-500">Order: {selectedDispatch.salesOrderNumber}</div>
              </div>
              <button onClick={() => setSelectedDispatch(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient:</span>
                  <span className="font-bold text-slate-900">{selectedDispatch.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Logistics Partner:</span>
                  <span className="font-bold text-slate-900">{selectedDispatch.transporter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consignment / Tracking:</span>
                  <span className="font-mono font-bold text-blue-600">{selectedDispatch.trackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipment Status:</span>
                  <span className="font-bold text-slate-900">{selectedDispatch.deliveryStatus}</span>
                </div>
              </div>

              {selectedDispatch.items && selectedDispatch.items.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-900">Consignment Items:</div>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                    {selectedDispatch.items.map((i) => (
                      <div key={i.id} className="p-2.5 flex justify-between bg-slate-50/40">
                        <span className="font-semibold text-slate-800">{i.productName}</span>
                        <span className="font-bold text-slate-900">{i.dispatchQuantity} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedDispatch(null)}
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
