'use client';

import React from 'react';
import { useERP } from '../../context/ERPContext';
import { CreditCard, IndianRupee, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet, Receipt } from 'lucide-react';

export const AccountsView: React.FC = () => {
  const { financials, customers, suppliers, salesOrders, purchaseOrders } = useERP();

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 erp-card p-5 bg-white border border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-600" /> Accounts Ledger & Financial Overview
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Accounts receivable, payable balances, gross manufacturing profit margins, and cash flow summary.
          </p>
        </div>
      </div>

      {/* Financial Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-600 font-medium">Customer Receivables</span>
          <div className="mt-2 text-2xl font-extrabold text-rose-700">
            ₹{financials.customerOutstanding.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Total pending from B2B clients</p>
        </div>

        <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-600 font-medium">Supplier Payables</span>
          <div className="mt-2 text-2xl font-extrabold text-amber-700">
            ₹{financials.supplierOutstanding.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Total pending vendor invoices</p>
        </div>

        <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-600 font-medium">Monthly Gross Sales</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            ₹{financials.monthlySales.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Total Sales Revenue
          </p>
        </div>

        <div className="erp-card p-4 bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-600 font-medium">Estimated Gross Margin</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">
            ₹{financials.totalProfit.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-700 font-bold mt-1">Sales minus manufacturing cost</p>
        </div>
      </div>

      {/* Outstanding Tables Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Receivables Breakdown */}
        <div className="erp-card p-5 space-y-4 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-600" /> Customer Outstanding Receivables
            </h3>
            <span className="text-xs font-mono font-bold text-rose-700">
              ₹{financials.customerOutstanding.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-2">
            {customers
              .filter((c) => c.totalOutstanding > 0)
              .map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{c.companyName}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Contact: {c.mobile || c.phone}</div>
                  </div>
                  <div className="text-right font-mono font-extrabold text-rose-700">
                    ₹{c.totalOutstanding.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Supplier Payables Breakdown */}
        <div className="erp-card p-5 space-y-4 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-600" /> Supplier Accounts Payable
            </h3>
            <span className="text-xs font-mono font-bold text-amber-700">
              ₹{financials.supplierOutstanding.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-2">
            {suppliers
              .filter((s) => s.totalOutstanding > 0)
              .map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{s.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Terms: {s.paymentTerms}</div>
                  </div>
                  <div className="text-right font-mono font-extrabold text-amber-700">
                    ₹{s.totalOutstanding.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
