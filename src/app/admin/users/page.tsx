'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Plus,
  UserCheck,
  CheckCircle2,
  XCircle,
  Key,
  Mail,
  Lock,
  Edit2,
  Trash2,
  X,
  Sliders,
} from 'lucide-react';
import { DEMO_CREDENTIALS, DemoUser } from '@/lib/auth';

interface ERPUser extends DemoUser {
  id: string;
  status: 'ACTIVE' | 'INACTIVE';
  permissions: {
    crm: boolean;
    sales: boolean;
    products: boolean;
    rawMaterials: boolean;
    inventory: boolean;
    reports: boolean;
    adminSettings: boolean;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ERPUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ERPUser | null>(null);

  // Form State
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES' as any,
    roleTitle: 'Sales Executive',
    redirectRoute: '/sales',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    permissions: {
      crm: true,
      sales: true,
      products: false,
      rawMaterials: false,
      inventory: false,
      reports: true,
      adminSettings: false,
    },
  });

  // Load initial demo credentials into user management state
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_managed_users_v1');
      if (stored) {
        setUsers(JSON.parse(stored));
      } else {
        const initial: ERPUser[] = DEMO_CREDENTIALS.map((u, idx) => ({
          ...u,
          id: `usr_${idx + 1}`,
          status: 'ACTIVE',
          permissions: {
            crm: u.role === 'ADMIN' || u.role === 'SALES',
            sales: u.role === 'ADMIN' || u.role === 'SALES',
            products: u.role === 'ADMIN' || u.role === 'PRODUCT',
            rawMaterials: u.role === 'ADMIN' || u.role === 'RAW_MATERIAL',
            inventory: true,
            reports: true,
            adminSettings: u.role === 'ADMIN',
          },
        }));
        setUsers(initial);
        localStorage.setItem('admin_managed_users_v1', JSON.stringify(initial));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveUsersState = (updated: ERPUser[]) => {
    setUsers(updated);
    try {
      localStorage.setItem('admin_managed_users_v1', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleToggleStatus = (id: string) => {
    const updated = users.map((u) => {
      if (u.id === id) {
        return {
          ...u,
          status: (u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE') as any,
        };
      }
      return u;
    });
    saveUsersState(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email) return;

    if (editingUser) {
      const updated = users.map((u) =>
        u.id === editingUser.id ? { ...u, ...formState } : u
      );
      saveUsersState(updated);
    } else {
      const newUser: ERPUser = {
        id: `usr_${Date.now()}`,
        ...formState,
      };
      saveUsersState([newUser, ...users]);
    }

    setShowAddModal(false);
    setEditingUser(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    saveUsersState(users.filter((u) => u.id !== id));
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roleTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchRole = roleFilter ? u.role === roleFilter : true;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Users & Role Permissions</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {users.length} Active Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Access control governance: manage credentials, assign role-based authorization, and toggle departmental permissions.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setFormState({
              name: '',
              email: '',
              password: 'User@123',
              role: 'SALES',
              roleTitle: 'Sales Executive',
              redirectRoute: '/sales',
              status: 'ACTIVE',
              permissions: {
                crm: true,
                sales: true,
                products: false,
                rawMaterials: false,
                inventory: false,
                reports: true,
                adminSettings: false,
              },
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Create User Account
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search user by name, email, or role title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SALES">SALES</option>
              <option value="PRODUCT">PRODUCT</option>
              <option value="RAW_MATERIAL">RAW_MATERIAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">User & Email</th>
                <th className="px-4 py-3.5">Role Designation</th>
                <th className="px-4 py-3.5">Assigned Login Route</th>
                <th className="px-4 py-3.5">Module Permissions</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{u.email}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        u.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-800'
                          : u.role === 'SALES'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.role === 'PRODUCT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {u.roleTitle || u.role}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-mono font-bold text-slate-700">
                    {u.redirectRoute}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {u.permissions.crm && (
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                          CRM
                        </span>
                      )}
                      {u.permissions.sales && (
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                          Sales
                        </span>
                      )}
                      {u.permissions.products && (
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                          Products
                        </span>
                      )}
                      {u.permissions.rawMaterials && (
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                          Materials
                        </span>
                      )}
                      {u.permissions.adminSettings && (
                        <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">
                          Full Admin
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      {u.status}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setFormState({
                            name: u.name,
                            email: u.email,
                            password: u.password,
                            role: u.role as any,
                            roleTitle: u.roleTitle,
                            redirectRoute: u.redirectRoute,
                            status: u.status,
                            permissions: u.permissions,
                          });
                          setShowAddModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingUser ? 'Edit User Credentials & Access' : 'Create New Authorized User'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Sharma"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@crm.com"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="••••••••"
                    value={formState.password}
                    onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Role Type</label>
                  <select
                    value={formState.role}
                    onChange={(e) => {
                      const r = e.target.value;
                      const roleMap: Record<string, { title: string; route: string }> = {
                        ADMIN: { title: 'Administrator', route: '/admin' },
                        SALES: { title: 'Sales Manager', route: '/sales' },
                        PRODUCT: { title: 'Product Manager', route: '/product' },
                        RAW_MATERIAL: { title: 'Raw Material Store Head', route: '/raw-material' },
                      };
                      const mapped = roleMap[r] || { title: 'User', route: '/' };
                      setFormState({
                        ...formState,
                        role: r as any,
                        roleTitle: mapped.title,
                        redirectRoute: mapped.route,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="SALES">SALES</option>
                    <option value="PRODUCT">PRODUCT</option>
                    <option value="RAW_MATERIAL">RAW_MATERIAL</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={formState.roleTitle}
                    onChange={(e) => setFormState({ ...formState, roleTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Module Permissions Checkboxes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-2">Module Access Permissions</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.permissions.crm}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          permissions: { ...formState.permissions, crm: e.target.checked },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Customer CRM</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.permissions.sales}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          permissions: { ...formState.permissions, sales: e.target.checked },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Sales Orders & Dispatch</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.permissions.products}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          permissions: { ...formState.permissions, products: e.target.checked },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Products & BOM</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.permissions.rawMaterials}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          permissions: { ...formState.permissions, rawMaterials: e.target.checked },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Raw Materials</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.permissions.inventory}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          permissions: { ...formState.permissions, inventory: e.target.checked },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Inventory Controls</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.permissions.reports}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          permissions: { ...formState.permissions, reports: e.target.checked },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Financial Reports</span>
                  </label>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
