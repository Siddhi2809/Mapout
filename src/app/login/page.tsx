'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, ArrowLeft, Lock, Mail, AlertCircle, UserCheck, Shield } from 'lucide-react';
import { DEMO_CREDENTIALS, findUserForLogin, DemoUser } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'sales' | 'admin'>('sales');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const authResult = findUserForLogin(email, password);

    if (authResult.user) {
      const matchedUser = authResult.user;
      // Save user session
      localStorage.setItem('crm_user', JSON.stringify(matchedUser));
      // Redirect to user's assigned route
      router.push(matchedUser.redirectRoute);
    } else {
      setError(authResult.error || 'Invalid email or password');
    }
  };

  const salesUsers = DEMO_CREDENTIALS.filter((u) => u.role === 'SALES');
  const adminAndPortals = DEMO_CREDENTIALS.filter((u) => u.role !== 'SALES');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background ambient gradient blur */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Enterprise Access Control
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-lg bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xl relative z-10 rounded-2xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <img
              src="/logo.png"
              alt="MapOut Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Authentication</h1>
          <p className="text-xs text-slate-500 font-medium">
            Sign in to access your designated role portal and personalized sales workspace.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="rajesh@crm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition transform active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Sign In to Portal
          </button>
        </form>

        {/* Quick Fill One-Click Logins */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Quick-Fill Demo Logins:
            </span>
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className={`px-2.5 py-1 rounded-md transition ${activeTab === 'sales' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'}`}
              >
                Sales Persons (4)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-2.5 py-1 rounded-md transition ${activeTab === 'admin' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'}`}
              >
                Admin & Portals
              </button>
            </div>
          </div>

          {activeTab === 'sales' && (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {salesUsers.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => {
                    setEmail(cred.email);
                    setPassword(cred.password);
                    setError('');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    email === cred.email
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm ring-1 ring-blue-400'
                      : 'bg-slate-50 border-slate-200 hover:border-blue-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="truncate">{cred.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 shrink-0">
                      Sales
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">{cred.email}</div>
                  <div className="text-[9px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>{cred.roleTitle}</span>
                    <span className="font-mono text-slate-600">{cred.password}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {adminAndPortals.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => {
                    setEmail(cred.email);
                    setPassword(cred.password);
                    setError('');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    email === cred.email
                      ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-sm ring-1 ring-purple-400'
                      : 'bg-slate-50 border-slate-200 hover:border-purple-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="truncate">{cred.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700 shrink-0">
                      {cred.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">{cred.email}</div>
                  <div className="text-[9px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>{cred.roleTitle}</span>
                    <span className="font-mono text-slate-600">{cred.password}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800 flex items-start gap-2">
            <Shield className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong>Salesperson Individual Access:</strong> Logging in as an individual sales person limits visibility to records created by or assigned to that person. Log in as <strong>Administrator</strong> for full company-wide visibility.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
