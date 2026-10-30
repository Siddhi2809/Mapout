'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useERP } from '@/context/ERPContext';
import {
  Bell,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ShoppingCart,
  Boxes,
  Layers,
  CreditCard,
  FileCheck,
  Calendar,
  Eye,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  category: 'Order' | 'Stock' | 'Payment' | 'Warranty' | 'Follow-up' | 'Meeting' | 'Production';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  timestamp: string;
  linkHref: string;
  isRead: boolean;
}

export default function AdminNotificationsPage() {
  const {
    salesOrders,
    rawMaterials,
    products,
    followUps,
    productionOrders,
  } = useERP();

  const [filterType, setFilterType] = useState<'all' | 'unread' | 'critical'>('all');
  const [readIds, setReadIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Load read status from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_read_notifications_v1');
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem('admin_read_notifications_v1', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const markAsUnread = (id: string) => {
    setReadIds((prev) => {
      const next = prev.filter((i) => i !== id);
      try {
        localStorage.setItem('admin_read_notifications_v1', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const markAllAsRead = (allIds: string[]) => {
    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem('admin_read_notifications_v1', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Generate real dynamic notifications from database conditions
  const notifications = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. New Orders & Orders Ready for Dispatch
    salesOrders.forEach((o) => {
      if (o.dispatchStatus === 'READY_FOR_DISPATCH') {
        list.push({
          id: `notif_ready_${o.id}`,
          category: 'Order',
          title: `Order Ready for Dispatch: #${o.orderNumber}`,
          description: `${o.customerName} - Total: ₹${(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}. Factory packaging is verified.`,
          severity: 'INFO',
          timestamp: o.orderDate,
          linkHref: '/admin/sales/orders',
          isRead: readIds.includes(`notif_ready_${o.id}`),
        });
      }

      if (o.orderStatus === 'Confirmed' && (o.dispatchStatus === 'PENDING' || o.dispatchStatus === 'Pending')) {
        list.push({
          id: `notif_pending_${o.id}`,
          category: 'Order',
          title: `Pending Product Processing: #${o.orderNumber}`,
          description: `Order from ${o.customerName} awaiting factory assembly / fulfillment allocation.`,
          severity: 'WARNING',
          timestamp: o.orderDate,
          linkHref: '/admin/sales/orders',
          isRead: readIds.includes(`notif_pending_${o.id}`),
        });
      }

      // Overdue payments
      if (o.paymentStatus !== 'PAID' && o.dueDate && o.dueDate < todayStr) {
        list.push({
          id: `notif_overdue_${o.id}`,
          category: 'Payment',
          title: `Payment Overdue: #${o.orderNumber}`,
          description: `${o.customerName} has an overdue outstanding balance of ₹${(o.amountOutstanding || o.pendingAmount || o.grandTotal || 0).toLocaleString('en-IN')}. Due date was ${o.dueDate}.`,
          severity: 'CRITICAL',
          timestamp: o.dueDate,
          linkHref: '/admin/payments/overdue',
          isRead: readIds.includes(`notif_overdue_${o.id}`),
        });
      }

      // Expiring warranty check
      const orderDate = new Date(o.orderDate || o.createdAt);
      const daysPassed = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPassed >= 335 && daysPassed <= 365) {
        list.push({
          id: `notif_warr_exp_${o.id}`,
          category: 'Warranty',
          title: `Warranty Expiring Soon: #${o.orderNumber}`,
          description: `${o.customerName} purchased diagnostic components with warranty expiring in ${365 - daysPassed} days.`,
          severity: 'WARNING',
          timestamp: todayStr,
          linkHref: '/admin/warranty/expiring',
          isRead: readIds.includes(`notif_warr_exp_${o.id}`),
        });
      } else if (daysPassed > 365 && daysPassed <= 395) {
        list.push({
          id: `notif_warr_done_${o.id}`,
          category: 'Warranty',
          title: `Warranty Expired: #${o.orderNumber}`,
          description: `Component warranty for ${o.customerName} has reached 1-year lifecycle completion. Offer renewal AMC contract.`,
          severity: 'INFO',
          timestamp: todayStr,
          linkHref: '/admin/warranty/expired',
          isRead: readIds.includes(`notif_warr_done_${o.id}`),
        });
      }
    });

    // 2. Low Raw Material Stock
    rawMaterials.forEach((m) => {
      if (m.currentStock <= m.minStock) {
        list.push({
          id: `notif_rm_low_${m.id}`,
          category: 'Stock',
          title: `Low Raw Material Stock: ${m.name}`,
          description: `Current stock: ${m.currentStock} ${m.unit} (Threshold: ${m.minStock} ${m.unit}). Reorder from ${m.supplierName || 'primary supplier'}.`,
          severity: 'CRITICAL',
          timestamp: todayStr,
          linkHref: '/admin/raw-materials',
          isRead: readIds.includes(`notif_rm_low_${m.id}`),
        });
      }
    });

    // 3. Low Finished Goods Stock
    products.forEach((p) => {
      if (p.currentStock <= p.minStock) {
        list.push({
          id: `notif_fg_low_${p.id}`,
          category: 'Stock',
          title: `Low Finished Product Buffer: ${p.name}`,
          description: `On-hand stock is ${p.currentStock} units (Buffer minimum: ${p.minStock} units). Production batch required.`,
          severity: 'CRITICAL',
          timestamp: todayStr,
          linkHref: '/admin/inventory/low-stock',
          isRead: readIds.includes(`notif_fg_low_${p.id}`),
        });
      }
    });

    // 4. Follow-up Due / Overdue
    followUps.forEach((f) => {
      if (f.status !== 'Completed') {
        if (f.followUpDate < todayStr) {
          list.push({
            id: `notif_fu_overdue_${f.id}`,
            category: 'Follow-up',
            title: `Follow-up Overdue: ${f.customerName}`,
            description: `Scheduled outreach "${f.purpose}" assigned to ${f.assignedUser || 'Sales Team'} was due on ${f.followUpDate}.`,
            severity: 'CRITICAL',
            timestamp: f.followUpDate,
            linkHref: '/admin/crm/follow-ups',
            isRead: readIds.includes(`notif_fu_overdue_${f.id}`),
          });
        } else if (f.followUpDate === todayStr) {
          list.push({
            id: `notif_fu_today_${f.id}`,
            category: 'Follow-up',
            title: `Follow-up Due Today: ${f.customerName}`,
            description: `Check-in "${f.purpose}" scheduled for today at ${f.followUpTime || '11:00 AM'}.`,
            severity: 'WARNING',
            timestamp: f.followUpDate,
            linkHref: '/admin/crm/follow-ups',
            isRead: readIds.includes(`notif_fu_today_${f.id}`),
          });
        }
      }
    });

    return list;
  }, [salesOrders, rawMaterials, products, followUps, todayStr, readIds]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        filterType === 'all'
          ? true
          : filterType === 'unread'
          ? !n.isRead
          : n.severity === 'CRITICAL';

      return matchSearch && matchTab;
    });
  }, [notifications, searchQuery, filterType]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Notification Center</h1>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time automated alerts generated directly from database conditions: stock shortages, overdue debts, and follow-ups.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead(notifications.map((n) => n.id))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition border border-slate-200"
          >
            <Check className="w-4 h-4" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            filterType === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Alerts ({notifications.length})
        </button>

        <button
          onClick={() => setFilterType('unread')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            filterType === 'unread'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Unread ({unreadCount})
        </button>

        <button
          onClick={() => setFilterType('critical')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            filterType === 'critical'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
          }`}
        >
          Critical Only ({notifications.filter((n) => n.severity === 'CRITICAL').length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {filteredNotifications.map((n) => {
          const isCritical = n.severity === 'CRITICAL';
          const isWarning = n.severity === 'WARNING';

          return (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                !n.isRead
                  ? isCritical
                    ? 'bg-rose-50/40'
                    : 'bg-blue-50/30'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div
                  className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                    isCritical
                      ? 'bg-rose-100 text-rose-700'
                      : isWarning
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {isCritical ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : isWarning ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs font-bold ${!n.isRead ? 'text-slate-900 font-black' : 'text-slate-800'}`}>
                      {n.title}
                    </h3>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {n.category}
                    </span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{n.description}</p>

                  <div className="text-[11px] text-slate-400 font-medium">Logged: {n.timestamp}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 sm:self-center">
                <Link
                  href={n.linkHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition border border-blue-200"
                >
                  <Eye className="w-3.5 h-3.5" /> View Record
                </Link>

                <button
                  onClick={() => (n.isRead ? markAsUnread(n.id) : markAsRead(n.id))}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition"
                  title={n.isRead ? 'Mark as Unread' : 'Mark as Read'}
                >
                  {n.isRead ? 'Mark Unread' : 'Mark Read'}
                </button>
              </div>
            </div>
          );
        })}
        {filteredNotifications.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-xs">
            No notifications matching the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
