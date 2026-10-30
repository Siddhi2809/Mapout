'use client';

import React from 'react';
import Link from 'next/link';
import {
  Boxes,
  Layers,
  Factory,
  ShoppingCart,
  Users,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const featureCards = [
    {
      title: 'Inventory Management',
      description: 'Track stock levels, raw material buffers, finished goods, and location bins.',
      icon: Boxes,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Product Management',
      description: 'Manage product catalog, SKUs, model numbers, pricing, and gross margins.',
      icon: Layers,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Production Management',
      description: 'BOM assembly builder, stage tracking, engineer assignment, and restock sync.',
      icon: Factory,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Sales Management',
      description: 'Generate invoices, manage B2B client orders, and track dispatch status.',
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Customer Management',
      description: 'Maintain customer profiles, credit limits, outstanding balances, and logs.',
      icon: Users,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Reports & Analytics',
      description: 'Real-time gross margins, financial analytics, sales totals, and alerts.',
      icon: BarChart3,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Header / Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="MapOut Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#home" className="hover:text-blue-600 transition">
              Home
            </a>
            <a href="#overview" className="hover:text-blue-600 transition">
              About / Overview
            </a>
            <a href="#features" className="hover:text-blue-600 transition">
              Features
            </a>
          </nav>

          <div>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition"
            >
              <ShieldCheck className="w-4 h-4" /> Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative py-20 md:py-28 px-4 md:px-6 overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-blue-600" /> Enterprise Inventory & Production Solution
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Inventory, Production & Sales Management
          </h1>

          <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Manage your products, raw materials, production, customers and sales from one centralized CRM.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5"
            >
              Go to Login <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-2xs"
            >
              Explore Modules
            </a>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section id="overview" className="py-12 px-4 md:px-6 border-t border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto erp-card p-8 md:p-12 space-y-4 text-center">
          <h2 className="text-xl font-bold text-slate-900">Centralized Operational CRM</h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Our platform connects raw material stocking, BOM engineering, shopfloor assembly production, and customer sales pipelines into a unified real-time portal.
          </p>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 px-4 md:px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">CRM Core Features</h2>
          <p className="text-xs md:text-sm text-slate-600 max-w-md mx-auto">
            Tailored modules for end-to-end manufacturing and sales operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="erp-card p-6 space-y-4 erp-card-interactive">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{card.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 md:px-6 bg-white text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© 2026 Sunyash MapOut CRM. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a href="#home" className="hover:text-slate-800">
              Home
            </a>
            <a href="#features" className="hover:text-slate-800">
              Features
            </a>
            <Link href="/login" className="hover:text-slate-800">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
