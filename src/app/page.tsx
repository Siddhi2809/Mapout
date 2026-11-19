'use client';

import React from 'react';
import Link from 'next/link';
import {
  Boxes,
  Users,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  PhoneCall,
  FileText,
  CreditCard,
  Settings,
  Package,
  Truck,
  BarChart2,
  BarChart3,
  Layers,
  Zap,
  ShieldCheck,
} from 'lucide-react';

export default function HomePage() {
  const workflowSteps = [
    {
      title: 'Create\nCustomer / Lead',
      icon: Users,
      cardBg: 'bg-[#eaf4ff]',
      border: 'border-[#d4e7fd]',
      iconColor: 'text-[#1e75ff]',
    },
    {
      title: 'Create\nQuotation',
      icon: FileText,
      cardBg: 'bg-[#f5efff]',
      border: 'border-[#e8dbfc]',
      iconColor: 'text-[#9333ea]',
    },
    {
      title: 'Follow-up\nwith Client',
      icon: PhoneCall,
      cardBg: 'bg-[#e6faf2]',
      border: 'border-[#cbf5e4]',
      iconColor: 'text-[#10b981]',
    },
    {
      title: 'Send\nInvoice',
      icon: FileText,
      cardBg: 'bg-[#fff5e8]',
      border: 'border-[#fde4c3]',
      iconColor: 'text-[#f59e0b]',
    },
    {
      title: 'Receive\nPayment',
      icon: CreditCard,
      cardBg: 'bg-[#f7edff]',
      border: 'border-[#eed3fd]',
      iconColor: 'text-[#a855f7]',
    },
    {
      title: 'Send to\nProduction',
      icon: Settings,
      cardBg: 'bg-[#eef6ff]',
      border: 'border-[#d6e8fd]',
      iconColor: 'text-[#3b82f6]',
    },
    {
      title: 'Packing &\nUpdate Status',
      icon: Package,
      cardBg: 'bg-[#fff3e6]',
      border: 'border-[#fedec2]',
      iconColor: 'text-[#f97316]',
    },
    {
      title: 'Dispatch\n& Delivery',
      icon: Truck,
      cardBg: 'bg-[#eafff4]',
      border: 'border-[#cef8e3]',
      iconColor: 'text-[#22c55e]',
    },
  ];

  const keyModules = [
    {
      title: 'Lead & Customer Management',
      icon: Users,
      iconColor: 'text-[#2563eb]',
      href: '/sales/customers',
    },
    {
      title: 'Quotation & Follow-ups',
      icon: FileText,
      iconColor: 'text-[#9333ea]',
      href: '/sales/quotations',
    },
    {
      title: 'Invoice & Payment Tracking',
      icon: FileText,
      iconColor: 'text-[#10b981]',
      href: '/sales/invoices',
    },
    {
      title: 'Production Management',
      icon: Settings,
      iconColor: 'text-[#8b5cf6]',
      href: '/product/orders',
    },
    {
      title: 'Inventory & Stock Control',
      icon: Boxes,
      iconColor: 'text-[#d97706]',
      href: '/product/products',
    },
    {
      title: 'Packing & Dispatch',
      icon: Truck,
      iconColor: 'text-[#0284c7]',
      href: '/sales/dispatch',
    },
    {
      title: 'Reports & Analytics',
      icon: BarChart2,
      iconColor: 'text-[#16a34a]',
      href: '/admin',
    },
  ];

  return (
    <div className="w-full overflow-x-hidden bg-gradient-to-b from-[#d5eafd] via-[#edf3fe] to-[#f4f8fd] text-slate-900 selection:bg-blue-600 selection:text-white m-0 p-0">
      {/* 1. Navbar */}
      <header className="w-full bg-[#d5eafd]/90 backdrop-blur-md border-b border-[#b9d9fb] sticky top-0 z-50 m-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="MapOut CRM Logo"
              className="h-9 w-auto object-contain"
            />
            <div>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight block leading-tight">
                Sales & Production CRM
              </span>
              <span className="text-[10px] text-slate-600 font-medium block">
                Sales • Production • Inventory • Dispatch
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-700">
            <a href="#home" className="text-blue-700 font-bold border-b-2 border-blue-600 pb-0.5">
              Home
            </a>
            <a href="#workflow" className="hover:text-blue-700 transition">
              Workflow
            </a>
            <a href="#modules" className="hover:text-blue-700 transition">
              Modules
            </a>
            <Link href="/product/products" className="hover:text-blue-700 transition">
              Products
            </Link>
            <Link href="/sales" className="hover:text-blue-700 transition">
              Sales
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl border border-blue-200/90 hover:border-blue-300 bg-white/90 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-white transition"
            >
              <Users className="w-3.5 h-3.5 text-slate-600" /> Login
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950/20 transition"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Exactly 100% width, 50vh height, min-height 400px */}
      <section
        id="home"
        className="hero-section"
        style={{
          width: '100%',
          height: '50vh',
          minHeight: '400px',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#d5eafd',
          backgroundImage: "url('/images/hero-bg.png')",
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Left Side Content Container */}
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 h-full flex items-center relative z-10 pointer-events-none">
          <div className="w-full md:w-1/2 lg:w-5/12 space-y-3 pointer-events-auto">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/90 border border-blue-200 text-blue-700 text-[11px] font-bold shadow-2xs">
              <span>All-in-One Business Management</span>
            </div>

            {/* Hero Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Sales & Production CRM
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Manage your Customers, Quotations, Invoices, Payments, Production, Inventory and Dispatch — all in one connected platform.
            </p>

            {/* Checkpoints */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-bold text-slate-700">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Streamline Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Track Production</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Real-time Inventory</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>End-to-End Orders</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950/20 transition transform hover:-translate-y-0.5"
              >
                Login to CRM <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/login"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold transition shadow-2xs"
              >
                Request a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Workflow Section */}
      <section id="workflow" className="w-full pt-6 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1380px] mx-auto">
          {/* Section Heading */}
          <h2 className="text-center text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-5">
            Complete Business Workflow
          </h2>

          {/* Workflow Cards Row */}
          <div className="flex items-center justify-between overflow-x-auto pb-2 pt-1 scrollbar-none gap-1 sm:gap-1.5 md:gap-2">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={idx}>
                  <div
                    className={`flex-1 min-w-[100px] sm:min-w-[115px] lg:min-w-0 h-[105px] sm:h-[112px] rounded-2xl ${step.cardBg} border ${step.border} p-2 flex flex-col items-center justify-center text-center shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5`}
                  >
                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${step.iconColor} stroke-[2.2] mb-1.5`} />
                    <span className="text-[11px] sm:text-[12px] font-bold text-slate-800 leading-tight whitespace-pre-line">
                      {step.title}
                    </span>
                  </div>

                  {/* Connecting Arrow between cards */}
                  {idx < workflowSteps.length - 1 && (
                    <div className="shrink-0 flex items-center justify-center text-[#2563eb] px-0.5">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Key Modules Section */}
      <section id="modules" className="w-full pt-4 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1380px] mx-auto">
          {/* Section Heading */}
          <h2 className="text-center text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-5">
            Key Modules & Features
          </h2>

          {/* Key Modules Row (7 cards in a single row on desktop, scroll/grid on mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
            {keyModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={idx}
                  href={mod.href}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 h-[115px] sm:h-[125px] p-2.5 flex flex-col items-center justify-center text-center shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 group"
                >
                  <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${mod.iconColor} stroke-[2] mb-2 group-hover:scale-110 transition-transform`} />
                  <span className="text-[11px] sm:text-[12px] font-bold text-[#0f172a] group-hover:text-blue-600 transition-colors leading-tight px-1">
                    {mod.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Value Proposition Bar */}
      <section className="bg-gradient-to-r from-[#0d1e3a] via-[#122b52] to-[#0a182e] text-white py-6 px-4 md:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Increase Sales</div>
              <div className="text-[10px] text-slate-400">with better follow-ups</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Improve Production</div>
              <div className="text-[10px] text-slate-400">with real-time planning</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Control Inventory</div>
              <div className="text-[10px] text-slate-400">with accurate stock</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Get Business Insights</div>
              <div className="text-[10px] text-slate-400">with powerful reports</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-[#c5defa] py-4 px-6 bg-[#dbebfc]/70 backdrop-blur-md text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full">
        <div>© 2026 Sales & Production CRM. All rights reserved.</div>
        <div className="flex items-center gap-6 mt-2 sm:mt-0 font-medium">
          <Link href="/login" className="hover:text-blue-700 transition">
            Login
          </Link>
          <Link href="/admin" className="hover:text-blue-700 transition">
            Admin Portal
          </Link>
          <Link href="/sales" className="hover:text-blue-700 transition">
            Sales
          </Link>
          <Link href="/product" className="hover:text-blue-700 transition">
            Production & Inventory
          </Link>
        </div>
      </footer>
    </div>
  );
}
