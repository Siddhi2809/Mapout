'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, ArrowLeft, Lock, Mail, AlertCircle } from 'lucide-react';
import { DEMO_CREDENTIALS } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const matchedUser = DEMO_CREDENTIALS.find(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password
    );

    if (matchedUser) {
      // Save temporary login state
      localStorage.setItem('crm_user', JSON.stringify(matchedUser));
      // Redirect to role route
      router.push(matchedUser.redirectRoute);
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient gradient blur */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Sales Portal v2.0
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 space-y-6 shadow-2xl relative z-10 rounded-2xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <img
              src="/logo.png"
              alt="MapOut Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Login</h1>
          <p className="text-xs text-slate-500 font-medium">
            Sign in to access your role-based CRM dashboard & sales portal
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
                placeholder="sales@crm.com"
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
            <ShieldCheck className="w-4 h-4" /> Login to Portal
          </button>
        </form>

        {/* Quick Fill Demo Credentials */}
        <div className="pt-5 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Quick Fill Demo Accounts:
            </span>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Click to Auto-fill
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.role}
                type="button"
                onClick={() => {
                  setEmail(cred.email);
                  setPassword(cred.password);
                  setError('');
                }}
                className={`p-2.5 rounded-xl border text-left transition ${
                  email === cred.email
                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:border-blue-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>{cred.name}</span>
                  {cred.role === 'SALES' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{cred.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
