'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RAW_MATERIAL_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { Supplier } from '@/types/erp';
import {
  Truck,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  FileText,
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  Info,
  Package,
  Upload,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

export default function SuppliersPage() {
  const {
    suppliers,
    rawMaterials,
    purchaseOrders,
    materialReceipts,
    supplierPayments,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    generateEntityCode,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');

  // Dynamically extract unique cities from suppliers list
  const availableCities = useMemo(() => {
    const list = suppliers
      .map((s) => s.city)
      .filter((c): c is string => Boolean(c && c.trim()));
    return Array.from(new Set(list)).sort();
  }, [suppliers]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);

  // Import File Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedImportSuppliers, setParsedImportSuppliers] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  const handleDownloadSampleTemplate = () => {
    const sampleHeaders = 'Supplier Code,Supplier Name,Company Name,Contact Person,Email,Mobile,GST Number,Address,City,State,Pincode,Category,Payment Terms,Bank Name,Account Number,IFSC Code,Branch Name,Account Holder Name,Status';
    const sampleRow1 = '"SUP-901","PolyTech Connectors","PolyTech Electrical Components Pvt Ltd","Rajesh Sharma","sales@polytech.com","9840211223","24AAACP1234F1Z5","102 GIDC Industrial Estate","Vadodara","Gujarat","390010","Raw Components","Net 30 Days","HDFC Bank","50200012345678","HDFC0001234","Alkapuri","PolyTech Electrical Components Pvt Ltd","ACTIVE"';
    const sampleRow2 = '"SUP-902","MicroWire Extrusions","MicroWire Cable Solutions India Ltd","Anil Patel","orders@microwire.in","9825099881","24AAACM9988E1Z1","45 Electronic Zone GIDC","Ahmedabad","Gujarat","380015","Cable Extrusion","Net 15 Days","ICICI Bank","001105009988","ICIC0000011","CG Road","MicroWire Cable Solutions India Ltd","ACTIVE"';
    const content = 'data:text/csv;charset=utf-8,' + [sampleHeaders, sampleRow1, sampleRow2].join('\n');
    const encoded = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', 'Supplier_Import_Sample_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSuppliersCSV = () => {
    const headers = [
      'Supplier Code',
      'Supplier Name',
      'Company Name',
      'Contact Person',
      'Email',
      'Mobile',
      'GST Number',
      'City',
      'State',
      'Pincode',
      'Category',
      'Payment Terms',
      'Total Purchase',
      'Total Outstanding',
      'Status',
    ];

    const rows = filteredSuppliers.map((s) => [
      `"${s.supplierCode || ''}"`,
      `"${s.name || ''}"`,
      `"${s.companyName || ''}"`,
      `"${s.contactPerson || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.gstNumber || ''}"`,
      `"${s.city || ''}"`,
      `"${s.state || ''}"`,
      `"${s.pincode || ''}"`,
      `"${s.category || ''}"`,
      `"${s.paymentTerms || ''}"`,
      s.totalPurchase || 0,
      s.totalOutstanding || 0,
      s.status || 'ACTIVE',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `suppliers_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setImportError('File is empty or unreadable.');
          return;
        }

        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
        if (lines.length < 2) {
          setImportError('No valid data rows found in CSV file.');
          return;
        }

        const parseCSVLine = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim().replace(/^"|"$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^"|"$/g, ''));
          return result;
        };

        const parsedItems: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 2) continue;

          const sCode = cols[0] || generateEntityCode('SUPPLIER');
          const sName = cols[1];
          if (!sName) continue;

          parsedItems.push({
            supplierCode: sCode,
            name: sName,
            companyName: cols[2] || sName,
            contactPerson: cols[3] || 'Procurement Contact',
            email: cols[4] || 'vendor@example.com',
            phone: cols[5] || '+91 90000 00000',
            gstNumber: cols[6] || '',
            address: cols[7] || 'Industrial Estate',
            city: cols[8] || 'Vadodara',
            state: cols[9] || 'Gujarat',
            pincode: cols[10] || '390001',
            category: cols[11] || 'Raw Components',
            paymentTerms: cols[12] || 'Net 30 Days',
            bankName: cols[13] || '',
            accountNumber: cols[14] || '',
            ifscCode: cols[15] || '',
            branchName: cols[16] || '',
            accountHolderName: cols[17] || cols[2] || sName,
            status: (cols[18]?.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
            totalPurchase: 0,
            totalOutstanding: 0,
            rawMaterialIds: [],
          });
        }

        if (parsedItems.length === 0) {
          setImportError('Could not parse any valid supplier records from file.');
        } else {
          setParsedImportSuppliers(parsedItems);
        }
      } catch (err: any) {
        setImportError('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (parsedImportSuppliers.length === 0) {
      setImportError('No suppliers available to import.');
      return;
    }

    let addedCount = 0;
    parsedImportSuppliers.forEach((item) => {
      const res = addSupplier(item);
      if (res.success) addedCount++;
    });

    showToast(`Successfully imported ${addedCount} supplier profile(s) into database.`);
    setIsImportModalOpen(false);
    setImportFile(null);
    setParsedImportSuppliers([]);
    setImportError(null);
  };

  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    supplierCode: string;
    name: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    gstNumber: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    category: string;
    paymentTerms: string;
    rawMaterialIds: string[];
    status: 'ACTIVE' | 'INACTIVE';
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    accountHolderName?: string;
  }>({
    supplierCode: '',
    name: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    category: 'Raw Components',
    paymentTerms: 'Net 30 Days',
    rawMaterialIds: [],
    status: 'ACTIVE',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    accountHolderName: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const name = s.name || '';
      const comp = s.companyName || '';
      const code = s.supplierCode || '';
      const city = s.city || '';
      const gst = s.gstNumber || '';

      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gst.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchesCat = categoryFilter === 'ALL' || s.category === categoryFilter;
      const matchesCity = cityFilter === 'ALL' || (city && city.toLowerCase() === cityFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCat && matchesCity;
    });
  }, [suppliers, searchTerm, statusFilter, categoryFilter, cityFilter]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Supplier Name is required.');
      return;
    }
    if (!formData.companyName.trim()) {
      setFormError('Company Name is required.');
      return;
    }
    if (!formData.supplierCode.trim()) {
      setFormError('Supplier Code is required.');
      return;
    }
    if (!formData.contactPerson.trim()) {
      setFormError('Contact Person is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Mobile / Phone is required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email address is required.');
      return;
    }

    if (editingSupplier) {
      const res = updateSupplier(editingSupplier.id, formData);
      if (!res.success) {
        setFormError(res.message || 'Failed to update supplier.');
        return;
      }
      showToast(`Supplier "${formData.name}" updated successfully.`);
      setEditingSupplier(null);
    } else {
      const res = addSupplier({ ...formData, totalOutstanding: 0 });
      if (!res.success) {
        setFormError(res.message || 'Failed to add supplier.');
        return;
      }
      showToast(`Supplier "${formData.name}" added successfully.`);
      setIsAddModalOpen(false);
    }

    setFormData({
      supplierCode: '',
      name: '',
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      gstNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      category: 'Raw Components',
      paymentTerms: 'Net 30 Days',
      rawMaterialIds: [],
      status: 'ACTIVE',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
      accountHolderName: '',
    });
  };

  const handleConfirmDelete = () => {
    if (!deletingSupplierId) return;
    const res = deleteSupplier(deletingSupplierId);
    if (!res.success) {
      alert(res.message);
    } else {
      showToast('Supplier deleted successfully.');
    }
    setDeletingSupplierId(null);
  };

  return (
    <DashboardLayout
      roleTitle="Raw Material Management"
      roleBadge="Raw Material Manager"
      navItems={RAW_MATERIAL_NAV}
    >
      <div className="space-y-6">
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-500/90 text-white shadow-2xl border border-emerald-400 backdrop-blur-md flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-600" /> Supplier Directory Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Maintain preferred component vendor profiles, GST registration numbers, payment terms, and outstanding balances.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportSuppliersCSV}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 border border-slate-200 transition"
              title="Export Suppliers List to CSV"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => {
                setImportFile(null);
                setParsedImportSuppliers([]);
                setImportError(null);
                setIsImportModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Upload className="w-4 h-4" /> Import File
            </button>
            <button
              onClick={() => {
                setEditingSupplier(null);
                setFormData({
                  supplierCode: generateEntityCode('SUPPLIER'),
                  name: '',
                  companyName: '',
                  contactPerson: '',
                  email: '',
                  phone: '',
                  gstNumber: '',
                  address: '',
                  city: '',
                  state: '',
                  pincode: '',
                  category: 'Raw Components',
                  paymentTerms: 'Net 30 Days',
                  rawMaterialIds: [],
                  status: 'ACTIVE',
                  bankName: '',
                  accountNumber: '',
                  ifscCode: '',
                  branchName: '',
                  accountHolderName: '',
                });
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="erp-card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search Supplier Name, Code, Company, GST No, City..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">🌆 All Cities</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Suppliers</option>
                <option value="INACTIVE">Inactive Suppliers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Suppliers Data Table */}
        <div className="erp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Supplier Code</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">GST Number</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Total Purchase</th>
                  <th className="py-3 px-4">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-500">
                      No suppliers found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">{sup.supplierCode}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{sup.name}</td>
                      <td className="py-3 px-4 text-slate-700">{sup.companyName}</td>
                      <td className="py-3 px-4 text-slate-700">{sup.contactPerson}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{sup.phone}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[130px]">{sup.email}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{sup.gstNumber}</td>
                      <td className="py-3 px-4 text-slate-500">{sup.city}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        ₹{(sup.totalPurchase || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-600">
                        ₹{sup.totalOutstanding.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            sup.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {sup.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingSupplier(sup)}
                            title="View Supplier Profile"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingSupplier(sup);
                              setFormData({
                                supplierCode: sup.supplierCode || '',
                                name: sup.name,
                                companyName: sup.companyName || '',
                                contactPerson: sup.contactPerson,
                                email: sup.email,
                                phone: sup.phone,
                                gstNumber: sup.gstNumber || '',
                                address: sup.address,
                                city: sup.city || '',
                                state: sup.state || '',
                                pincode: sup.pincode || '',
                                category: sup.category,
                                paymentTerms: sup.paymentTerms,
                                rawMaterialIds: sup.rawMaterialIds || rawMaterials.filter((m) => m.supplierId === sup.id).map((m) => m.id),
                                status: sup.status || 'ACTIVE',
                                bankName: sup.bankName || '',
                                accountNumber: sup.accountNumber || '',
                                ifscCode: sup.ifscCode || '',
                                branchName: sup.branchName || '',
                                accountHolderName: sup.accountHolderName || '',
                              });
                              setIsAddModalOpen(true);
                            }}
                            title="Edit Supplier"
                            className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingSupplierId(sup.id)}
                            title="Delete Supplier"
                            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: ADD / EDIT SUPPLIER */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  {editingSupplier ? 'Edit Supplier Profile' : 'Add New Supplier'}
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Supplier Code <span className="text-xs font-normal text-slate-500">(Auto-generated)</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.supplierCode}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-blue-600 font-mono focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Supplier Short Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PolyTech Connectors"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Full Registered Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PolyTech Electrical Components Pvt Ltd"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Mobile / Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98402 11223"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="sales@polytechconnect.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      GST Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="24AAACP1234F1Z5"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Terms</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="Immediate">Immediate / Advance</option>
                      <option value="Net 15 Days">Net 15 Days</option>
                      <option value="Net 30 Days">Net 30 Days</option>
                      <option value="Net 45 Days">Net 45 Days</option>
                      <option value="Net 60 Days">Net 60 Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Vadodara"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">State</label>
                    <input
                      type="text"
                      placeholder="e.g. Gujarat"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Pincode</label>
                    <input
                      type="text"
                      placeholder="390010"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Supplier Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="Raw Components">Raw Components</option>
                      <option value="Cable Extrusion">Cable Extrusion</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Packaging">Packaging</option>
                    </select>
                  </div>
                </div>

                {/* Bank Account Details Section */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" /> Bank & Settlement Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank / ICICI Bank"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 50200012345678"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC0001234"
                        value={formData.ifscCode}
                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Branch Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Alkapuri Branch, Vadodara"
                        value={formData.branchName}
                        onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        placeholder="e.g. PolyTech Electrical Components Pvt Ltd"
                        value={formData.accountHolderName}
                        onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Purchased Raw Products (Custom Checkbox Multi-Select UI) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Raw Products Bought Through This Supplier <span className="text-xs font-normal text-slate-500">(Select Multiple)</span>
                    </label>
                    <span className="text-[11px] font-medium text-blue-600">
                      {formData.rawMaterialIds.length} Selected
                    </span>
                  </div>

                  {/* Searchable / Scrollable Checkbox List */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {rawMaterials.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2 text-center">No raw products available in inventory.</p>
                    ) : (
                      rawMaterials.map((material) => {
                        const isChecked = formData.rawMaterialIds.includes(material.id);
                        return (
                          <label
                            key={material.id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                              isChecked
                                ? 'bg-blue-50 border-blue-300 text-blue-900'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      rawMaterialIds: [...formData.rawMaterialIds, material.id],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      rawMaterialIds: formData.rawMaterialIds.filter((id) => id !== material.id),
                                    });
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <div>
                                <span className="font-semibold text-slate-900">{material.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono ml-2">({material.sku})</span>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 border border-slate-300">
                              {material.category}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>

                  {/* Selected Tag Badges */}
                  {formData.rawMaterialIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formData.rawMaterialIds.map((id) => {
                        const mat = rawMaterials.find((m) => m.id === id);
                        if (!mat) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] px-2.5 py-0.5 rounded-full font-medium shadow-2xs"
                          >
                            <span>{mat.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  rawMaterialIds: formData.rawMaterialIds.filter((mId) => mId !== id),
                                })
                              }
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Street Address</label>
                  <textarea
                    rows={2}
                    placeholder="Enter industrial estate, door number, street address..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700">Status:</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
                      }
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm"
                    >
                      {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: VIEW SUPPLIER DETAILS & TRANSACTIONS */}
        {viewingSupplier && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{viewingSupplier.companyName}</h3>
                    <div className="text-xs text-blue-600 font-mono">
                      {viewingSupplier.supplierCode} | GST: {viewingSupplier.gstNumber}
                    </div>
                  </div>
                </div>
                <button onClick={() => setViewingSupplier(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Financial Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-medium">Total Purchase</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    ₹{(viewingSupplier.totalPurchase || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-medium">Total Paid Amount</div>
                  <div className="text-lg font-bold text-emerald-600 mt-1">
                    ₹{Math.max(
                      0,
                      (viewingSupplier.totalPurchase || 0) - viewingSupplier.totalOutstanding
                    ).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-medium">Current Outstanding</div>
                  <div className="text-lg font-bold text-rose-600 mt-1">
                    ₹{viewingSupplier.totalOutstanding.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-slate-500 font-semibold uppercase text-[10px]">Contact Info</div>
                  <div><span className="text-slate-500">Contact Person:</span> <span className="text-slate-900 font-semibold">{viewingSupplier.contactPerson}</span></div>
                  <div><span className="text-slate-500">Phone:</span> <span className="text-slate-800 font-mono">{viewingSupplier.phone}</span></div>
                  <div><span className="text-slate-500">Email:</span> <span className="text-blue-600 font-medium">{viewingSupplier.email}</span></div>
                  <div><span className="text-slate-500">Payment Terms:</span> <span className="text-slate-900 font-bold">{viewingSupplier.paymentTerms}</span></div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-slate-500 font-semibold uppercase text-[10px]">Address & GST</div>
                  <div><span className="text-slate-500">GST Registration:</span> <span className="text-slate-900 font-mono font-semibold">{viewingSupplier.gstNumber}</span></div>
                  <div><span className="text-slate-500">City / State:</span> <span className="text-slate-800">{viewingSupplier.city}, {viewingSupplier.state} ({viewingSupplier.pincode})</span></div>
                  <div><span className="text-slate-500">Address:</span> <span className="text-slate-700 block">{viewingSupplier.address}</span></div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-slate-500 font-semibold uppercase text-[10px] flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-blue-600" /> Bank Details
                  </div>
                  {viewingSupplier.bankName || viewingSupplier.accountNumber ? (
                    <>
                      <div><span className="text-slate-500">Bank:</span> <span className="text-slate-900 font-semibold">{viewingSupplier.bankName || 'N/A'}</span></div>
                      <div><span className="text-slate-500">A/C No:</span> <span className="text-slate-900 font-mono font-bold">{viewingSupplier.accountNumber || 'N/A'}</span></div>
                      <div><span className="text-slate-500">IFSC:</span> <span className="text-blue-600 font-mono font-semibold">{viewingSupplier.ifscCode || 'N/A'}</span></div>
                      <div><span className="text-slate-500">Branch:</span> <span className="text-slate-700">{viewingSupplier.branchName || 'N/A'}</span></div>
                      <div><span className="text-slate-500">Holder:</span> <span className="text-slate-800">{viewingSupplier.accountHolderName || viewingSupplier.name}</span></div>
                    </>
                  ) : (
                    <div className="text-slate-400 italic py-2">No bank account details provided for this vendor.</div>
                  )}
                </div>
              </div>

              {/* Raw Materials Supplied */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" /> Materials Supplied by this Vendor
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Material Code</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Current Stock</th>
                        <th className="py-2 px-3">Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rawMaterials.filter(
                        (m) =>
                          m.supplierId === viewingSupplier.id ||
                          (viewingSupplier.rawMaterialIds && viewingSupplier.rawMaterialIds.includes(m.id))
                      ).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-500">
                            No materials currently linked to this supplier.
                          </td>
                        </tr>
                      ) : (
                        rawMaterials
                          .filter(
                            (m) =>
                              m.supplierId === viewingSupplier.id ||
                              (viewingSupplier.rawMaterialIds && viewingSupplier.rawMaterialIds.includes(m.id))
                          )
                          .map((rm) => (
                            <tr key={rm.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-semibold text-blue-600">{rm.sku}</td>
                              <td className="py-2 px-3 text-slate-900 font-medium">{rm.name}</td>
                              <td className="py-2 px-3 text-slate-500">{rm.category}</td>
                              <td className="py-2 px-3 font-bold text-emerald-600">{rm.currentStock} {rm.unit}</td>
                              <td className="py-2 px-3 text-slate-800 font-medium">₹{rm.unitCost}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Related Purchase Orders */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Purchase Orders History
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-48">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">PO Number</th>
                        <th className="py-2 px-3">Order Date</th>
                        <th className="py-2 px-3">Total Amount</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchaseOrders.filter((po) => po.supplierId === viewingSupplier.id).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-500">
                            No purchase orders issued to this supplier yet.
                          </td>
                        </tr>
                      ) : (
                        purchaseOrders
                          .filter((po) => po.supplierId === viewingSupplier.id)
                          .map((po) => (
                            <tr key={po.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono text-blue-600 font-bold">{po.poNumber}</td>
                              <td className="py-2 px-3 text-slate-500 font-mono">{po.orderDate}</td>
                              <td className="py-2 px-3 font-semibold text-slate-800">
                                ₹{po.totalAmount.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 font-bold text-emerald-700">{po.status}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: DELETE CONFIRMATION */}
        {deletingSupplierId && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-slate-900">Delete Supplier?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Notice: System business rule prevents deleting a supplier if purchase transactions exist. In such cases, mark the supplier status as Inactive instead.
              </p>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setDeletingSupplierId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
        {/* MODAL 4: IMPORT SUPPLIERS FROM CSV FILE */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Import Suppliers File</h3>
                    <p className="text-xs text-slate-500">
                      Bulk upload supplier vendor profiles, GST numbers, contact details, and bank settlement details via CSV.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sample Template & Download Action */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">Need a pre-formatted CSV template?</div>
                    <div className="text-slate-600 mt-0.5">
                      Download our sample CSV file with required columns (Supplier Code, Company Name, Contact Person, GST, Bank A/C, etc.).
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleTemplate}
                  className="px-3.5 py-2 rounded-lg bg-white border border-blue-300 text-blue-700 font-bold hover:bg-blue-100/50 shrink-0 flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Sample Template
                </button>
              </div>

              {/* File Upload Box */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">Select CSV File to Upload</label>
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    {importFile ? importFile.name : 'Click or drag & drop CSV file here'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Supports UTF-8 formatted CSV files up to 5MB</p>
                </div>
              </div>

              {/* Error Message */}
              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedImportSuppliers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Parsed Supplier Records Preview ({parsedImportSuppliers.length} found)
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">✓ Ready to import</span>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-48">
                    <table className="w-full text-left text-[11px] text-slate-700">
                      <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Code</th>
                          <th className="py-2 px-3">Supplier Name</th>
                          <th className="py-2 px-3">Company</th>
                          <th className="py-2 px-3">Contact</th>
                          <th className="py-2 px-3">GST No</th>
                          <th className="py-2 px-3">City</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedImportSuppliers.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono text-blue-600 font-bold">{item.supplierCode}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{item.name}</td>
                            <td className="py-2 px-3 text-slate-700">{item.companyName}</td>
                            <td className="py-2 px-3 text-slate-600">{item.contactPerson} ({item.phone})</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{item.gstNumber || 'N/A'}</td>
                            <td className="py-2 px-3 text-slate-600">{item.city}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={parsedImportSuppliers.length === 0}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm transition"
                >
                  Import {parsedImportSuppliers.length} Supplier(s)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
