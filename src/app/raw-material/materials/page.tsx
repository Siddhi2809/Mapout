'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RAW_MATERIAL_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { RawMaterial, StockTransactionType, PurchaseRequestStatus } from '@/types/erp';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  History,
  Info,
  PackageCheck,
  ShoppingCart,
  Mail,
  MessageSquare,
  Send,
  Clock,
  ExternalLink,
  ShieldAlert,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Truck,
} from 'lucide-react';

export default function RawMaterialsPage() {
  const {
    rawMaterials,
    suppliers,
    stockTransactions,
    purchaseRequests,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    addSupplier,
    generateEntityCode,
    createPurchaseRequest,
    updatePurchaseRequestStatus,
    refreshRawMaterialsFromDB,
  } = useERP();

  useEffect(() => {
    refreshRawMaterialsFromDB();
  }, []);

  // Controls for Search, Filter, Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'sku' | 'name' | 'stock' | 'cost'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<RawMaterial | null>(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'details' | 'history' | 'requests'>('details');

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedImportItems, setParsedImportItems] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  // Request Stock Modal State
  const [requestStockMaterial, setRequestStockMaterial] = useState<RawMaterial | null>(null);
  const [requestQty, setRequestQty] = useState<number>(0);
  const [requestSupplierIds, setRequestSupplierIds] = useState<string[]>([]);
  const [requestNotes, setRequestNotes] = useState<string>('');
  const [requestModalError, setRequestModalError] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<{
    sku: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    unitCost: number;
    supplierId: string;
    location: string;
    description: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    sku: '',
    name: '',
    category: 'Connectors',
    unit: 'PCS',
    currentStock: 0,
    minStock: 100,
    maxStock: 1000,
    unitCost: 0,
    supplierId: '',
    location: 'Rack A-01',
    description: '',
    status: 'ACTIVE',
  });

  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');

  // Quick Inline Supplier Creation Modal
  const [isQuickSupplierModalOpen, setIsQuickSupplierModalOpen] = useState(false);
  const [quickSupplierError, setQuickSupplierError] = useState('');
  const [quickSupplierData, setQuickSupplierData] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstNumber: '',
    city: '',
    state: '',
    category: 'Raw Components',
    paymentTerms: 'Net 30 Days',
  });

  const handleOpenQuickSupplierModal = () => {
    setQuickSupplierError('');
    setQuickSupplierData({
      name: '',
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      gstNumber: '',
      city: '',
      state: '',
      category: 'Raw Components',
      paymentTerms: 'Net 30 Days',
    });
    setIsQuickSupplierModalOpen(true);
  };

  const handleSaveQuickSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickSupplierError('');

    if (!quickSupplierData.name.trim()) {
      setQuickSupplierError('Supplier Name is required.');
      return;
    }
    if (!quickSupplierData.companyName.trim()) {
      setQuickSupplierError('Company Name is required.');
      return;
    }
    if (!quickSupplierData.phone.trim()) {
      setQuickSupplierError('Mobile / Phone number is required.');
      return;
    }

    const newCode = generateEntityCode('SUPPLIER');
    const res = addSupplier({
      supplierCode: newCode,
      name: quickSupplierData.name.trim(),
      companyName: quickSupplierData.companyName.trim(),
      contactPerson: quickSupplierData.contactPerson.trim() || quickSupplierData.name.trim(),
      email: quickSupplierData.email.trim() || 'info@supplier.com',
      phone: quickSupplierData.phone.trim(),
      gstNumber: quickSupplierData.gstNumber.trim(),
      address: quickSupplierData.city ? `${quickSupplierData.city}, ${quickSupplierData.state || 'India'}` : 'Headquarters',
      city: quickSupplierData.city.trim() || 'Vadodara',
      state: quickSupplierData.state.trim() || 'Gujarat',
      pincode: '390001',
      category: quickSupplierData.category || 'Raw Components',
      paymentTerms: quickSupplierData.paymentTerms || 'Net 30 Days',
      status: 'ACTIVE',
      totalPurchase: 0,
      totalOutstanding: 0,
      rawMaterialIds: [],
    });

    if (!res.success) {
      setQuickSupplierError(res.message || 'Failed to create supplier.');
      return;
    }

    const createdSupplierId = res.id;
    if (createdSupplierId) {
      setFormData((prev) => ({
        ...prev,
        supplierId: createdSupplierId,
      }));
    }

    showToast(`Supplier "${quickSupplierData.companyName || quickSupplierData.name}" created and selected!`);
    setIsQuickSupplierModalOpen(false);
  };

  const availableSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const isActive = (s.status ?? 'ACTIVE') === 'ACTIVE';
      const isCurrentlyLinked = editingMaterial && s.id === formData.supplierId;
      return isActive || isCurrentlyLinked;
    });
  }, [suppliers, editingMaterial, formData.supplierId]);

  const filteredSuppliersForForm = useMemo(() => {
    if (!supplierSearchQuery.trim()) return availableSuppliers;
    const q = supplierSearchQuery.toLowerCase();
    return availableSuppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.companyName || '').toLowerCase().includes(q) ||
        (s.supplierCode || '').toLowerCase().includes(q)
    );
  }, [availableSuppliers, supplierSearchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getActiveRequestForMaterial = (materialId: string) => {
    return purchaseRequests.find(
      (pr) =>
        pr.rawMaterialId === materialId &&
        ['Pending', 'Sent', 'Supplier Confirmed'].includes(pr.status)
    );
  };

  const activeRequestInModal = useMemo(() => {
    if (!requestStockMaterial) return null;
    return getActiveRequestForMaterial(requestStockMaterial.id);
  }, [purchaseRequests, requestStockMaterial]);

  const openRequestStockModal = (rm: RawMaterial) => {
    setRequestStockMaterial(rm);
    const initialSuppliers = rm.supplierId ? [rm.supplierId] : (suppliers[0] ? [suppliers[0].id] : []);
    setRequestSupplierIds(initialSuppliers);
    const suggestedQty =
      rm.maxStock && rm.maxStock > rm.currentStock
        ? rm.maxStock - rm.currentStock
        : Math.max(1, rm.minStock * 2 - rm.currentStock);
    setRequestQty(suggestedQty);
    setRequestNotes(`Stock replenishment request for ${rm.name} (${rm.sku}).`);
    setRequestModalError('');
  };

  const executeCreatePurchaseRequest = (initialStatus: PurchaseRequestStatus = 'Pending'): string[] => {
    if (!requestStockMaterial) return [];
    setRequestModalError('');

    if (requestQty <= 0 || isNaN(requestQty)) {
      setRequestModalError('Please enter a valid request quantity greater than 0.');
      return [];
    }

    if (requestSupplierIds.length === 0) {
      setRequestModalError('Please select at least one supplier to send the request to.');
      return [];
    }

    const createdIds: string[] = [];

    for (const supId of requestSupplierIds) {
      const selectedSup = suppliers.find((s) => s.id === supId);
      const result = createPurchaseRequest({
        rawMaterialId: requestStockMaterial.id,
        rawMaterialName: requestStockMaterial.name,
        sku: requestStockMaterial.sku,
        supplierId: selectedSup?.id || requestStockMaterial.supplierId || '',
        supplierName: selectedSup ? (selectedSup.companyName || selectedSup.name) : (requestStockMaterial.supplierName || 'Unassigned'),
        supplierPhone: selectedSup?.phone || '',
        supplierEmail: selectedSup?.email || '',
        requestedQuantity: requestQty,
        unit: requestStockMaterial.unit,
        notes: requestNotes,
        createdBy: 'Raw Material Manager',
        status: initialStatus,
      });

      if (result.success && result.requestId) {
        createdIds.push(result.requestId);
      }
    }

    if (createdIds.length === 0) {
      setRequestModalError('Failed to create Purchase Request.');
      return [];
    }

    showToast(`Purchase Request(s) ${createdIds.join(', ')} created for ${createdIds.length} supplier(s) (Status: ${initialStatus}).`);
    return createdIds;
  };

  const handleSendEmail = () => {
    if (!requestStockMaterial) return;
    if (requestSupplierIds.length === 0) {
      setRequestModalError('Please select at least one supplier.');
      return;
    }

    const selectedSups = suppliers.filter((s) => requestSupplierIds.includes(s.id));
    const emails = selectedSups.map((s) => s.email).filter(Boolean).join(',');

    let reqIdStr = activeRequestInModal?.requestId;
    if (!activeRequestInModal) {
      const createdIds = executeCreatePurchaseRequest('Sent');
      if (createdIds.length === 0) return;
      reqIdStr = createdIds.join(', ');
    } else {
      updatePurchaseRequestStatus(activeRequestInModal.id, 'Sent');
      showToast(`Purchase Request ${activeRequestInModal.requestId} status updated to "Sent".`);
    }

    const subject = encodeURIComponent(`Urgent Purchase Request [${reqIdStr || ''}]: ${requestStockMaterial.name} (${requestStockMaterial.sku})`);
    const body = encodeURIComponent(
      `Dear Vendor Partners,\n\n` +
      `Please supply the following raw material urgently:\n\n` +
      `Material Name: ${requestStockMaterial.name}\n` +
      `Material Code (SKU): ${requestStockMaterial.sku}\n` +
      `Current Stock: ${requestStockMaterial.currentStock} ${requestStockMaterial.unit}\n` +
      `Minimum Stock Threshold: ${requestStockMaterial.minStock} ${requestStockMaterial.unit}\n` +
      `Requested Quantity: ${requestQty} ${requestStockMaterial.unit}\n\n` +
      `Notes / Instructions:\n${requestNotes}\n\n` +
      `Thank you,\n` +
      `Procurement Team`
    );

    window.open(`mailto:${emails}?subject=${subject}&body=${body}`, '_blank');
    setRequestStockMaterial(null);
  };

  const handleSendWhatsApp = () => {
    if (!requestStockMaterial) return;
    if (requestSupplierIds.length === 0) {
      setRequestModalError('Please select at least one supplier.');
      return;
    }

    const selectedSups = suppliers.filter((s) => requestSupplierIds.includes(s.id));

    let reqIdStr = activeRequestInModal?.requestId;
    if (!activeRequestInModal) {
      const createdIds = executeCreatePurchaseRequest('Sent');
      if (createdIds.length === 0) return;
      reqIdStr = createdIds.join(', ');
    } else {
      updatePurchaseRequestStatus(activeRequestInModal.id, 'Sent');
      showToast(`Purchase Request ${activeRequestInModal.requestId} status updated to "Sent".`);
    }

    const messageText = encodeURIComponent(
      `🚨 *RAW MATERIAL STOCK REQUEST (${reqIdStr || 'PR'})*\n\n` +
      `*Material:* ${requestStockMaterial.name}\n` +
      `*Code:* ${requestStockMaterial.sku}\n` +
      `*Current Stock:* ${requestStockMaterial.currentStock} ${requestStockMaterial.unit}\n` +
      `*Requested Qty:* ${requestQty} ${requestStockMaterial.unit}\n` +
      `*Notes:* ${requestNotes}`
    );

    // Open WhatsApp link for the first selected supplier or share message
    const firstPhone = (selectedSups[0]?.phone || '').replace(/[^0-9]/g, '');
    const waUrl = firstPhone ? `https://wa.me/${firstPhone}?text=${messageText}` : `https://api.whatsapp.com/send?text=${messageText}`;
    window.open(waUrl, '_blank');
    setRequestStockMaterial(null);
  };

  const handleCreatePRAction = () => {
    if (activeRequestInModal) {
      setRequestModalError(`Active Purchase Request ${activeRequestInModal.requestId} already exists for this item.`);
      return;
    }
    const createdId = executeCreatePurchaseRequest('Pending');
    if (createdId) {
      setRequestStockMaterial(null);
    }
  };

  // Filter & Sort Materials
  const filteredMaterials = useMemo(() => {
    return rawMaterials
      .filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
        const matchesSup = supplierFilter === 'ALL' || item.supplierId === supplierFilter;

        let matchesStatus = true;
        if (statusFilter === 'LOW_STOCK') {
          matchesStatus = item.currentStock <= item.minStock;
        } else if (statusFilter !== 'ALL') {
          matchesStatus = item.status === statusFilter;
        }

        return matchesSearch && matchesCat && matchesSup && matchesStatus;
      })
      .sort((a, b) => {
        let valA: string | number = a.name;
        let valB: string | number = b.name;

        if (sortBy === 'sku') {
          valA = a.sku;
          valB = b.sku;
        } else if (sortBy === 'name') {
          valA = a.name;
          valB = b.name;
        } else if (sortBy === 'stock') {
          valA = a.currentStock;
          valB = b.currentStock;
        } else if (sortBy === 'cost') {
          valA = a.unitCost;
          valB = b.unitCost;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [rawMaterials, searchTerm, categoryFilter, statusFilter, supplierFilter, sortBy, sortOrder]);

  // Handle Form Submission (Add or Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Material Name is required.');
      return;
    }
    if (!formData.sku.trim()) {
      setFormError('Material Code (SKU) is required.');
      return;
    }
    if (!formData.unit.trim()) {
      setFormError('Unit of Measurement is required.');
      return;
    }
    if (formData.minStock < 0 || formData.maxStock < 0) {
      setFormError('Minimum and Maximum Stock values must be >= 0.');
      return;
    }
    if (formData.maxStock < formData.minStock) {
      setFormError('Maximum stock must be greater than or equal to minimum stock.');
      return;
    }
    if (formData.unitCost < 0 || isNaN(formData.unitCost)) {
      setFormError('Purchase Price must be a valid non-negative number.');
      return;
    }

    const selectedSupplier = suppliers.find((s) => s.id === formData.supplierId);
    const supplierName = selectedSupplier ? (selectedSupplier.companyName || selectedSupplier.name) : 'Unassigned';

    if (editingMaterial) {
      const result = updateRawMaterial(editingMaterial.id, {
        ...formData,
        supplierName,
      });
      if (!result.success) {
        setFormError(result.message || 'Failed to update material.');
        return;
      }
      showToast(`Material "${formData.name}" updated successfully.`);
      setEditingMaterial(null);
    } else {
      const result = addRawMaterial({
        ...formData,
        supplierName,
      });
      if (!result.success) {
        setFormError(result.message || 'Failed to add material.');
        return;
      }
      showToast(`Material "${formData.name}" added successfully.`);
      setIsAddModalOpen(false);
    }

    // Reset Form
    setFormData({
      sku: '',
      name: '',
      category: 'Connectors',
      unit: 'PCS',
      currentStock: 0,
      minStock: 100,
      maxStock: 1000,
      unitCost: 0,
      supplierId: '',
      location: 'Rack A-01',
      description: '',
      status: 'ACTIVE',
    });
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingMaterialId) return;
    const result = deleteRawMaterial(deletingMaterialId);
    if (!result.success) {
      alert(result.message);
    } else {
      showToast('Raw Material deleted successfully.');
    }
    setDeletingMaterialId(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Material Code',
      'Material Name',
      'Category',
      'Unit',
      'Current Stock',
      'Minimum Stock',
      'Maximum Stock',
      'Purchase Price (INR)',
      'Supplier',
      'Location',
      'Status',
    ];

    const rows = filteredMaterials.map((m) => [
      `"${m.sku}"`,
      `"${m.name}"`,
      `"${m.category}"`,
      `"${m.unit}"`,
      m.currentStock,
      m.minStock,
      m.maxStock,
      m.unitCost,
      `"${m.supplierName}"`,
      `"${m.location}"`,
      m.currentStock <= m.minStock ? 'Low Stock' : m.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `raw_materials_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleTemplate = () => {
    const sampleHeaders = 'Material Code,Material Name,Category,Unit,Current Stock,Minimum Stock,Maximum Stock,Purchase Price (INR),Supplier,Location,Status';
    const sampleRow1 = '"RM-EXP-001","16-Core Shielded Copper Cable Wire","Cables","METERS",500,100,2000,45,"Unitech Electronics","Bin A-04","ACTIVE"';
    const sampleRow2 = '"RM-EXP-002","OBD-II 16-Pin Male Plug Shell","Connectors","PCS",1200,250,5000,18,"Global Connectors Ltd","Bin C-12","ACTIVE"';
    const content = 'data:text/csv;charset=utf-8,' + [sampleHeaders, sampleRow1, sampleRow2].join('\n');
    const encoded = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', 'Raw_Material_Import_Sample_Template.csv');
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
        if (!text || text.trim() === '') {
          setImportError('File is empty or unreadable.');
          return;
        }

        // Check if the uploaded file contains binary or non-text content (e.g. raw PDF, DOCX, binary XLSX without parser)
        const isBinary = /[\x00-\x08\x0E-\x1F]/.test(text.slice(0, 4096));
        if (isBinary) {
          setImportError('Uploaded file appears to be a binary file (.xlsx or .pdf binary) rather than plain text CSV. Please save/export the file as a CSV (.csv) or download our sample template.');
          return;
        }

        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
        if (lines.length < 2) {
          setImportError('No valid data rows found in file. Ensure the file has a header row and at least one data row.');
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

        const cleanCell = (val: string = '', fallback: string = '') => {
          const cleaned = val.replace(/[\x00-\x1F\x7F]/g, '').trim();
          return cleaned || fallback;
        };

        const parsedItems: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 2) continue;

          const mSku = cleanCell(cols[0]) || generateEntityCode('RAW_MATERIAL');
          const mName = cleanCell(cols[1]);
          if (!mName) continue;

          const matchedSup = suppliers.find((s) => s.name.toLowerCase().includes((cols[8] || '').toLowerCase())) || suppliers[0];

          parsedItems.push({
            sku: mSku,
            name: mName,
            category: cleanCell(cols[2], 'Connectors'),
            unit: cleanCell(cols[3], 'PCS'),
            currentStock: parseFloat(cols[4]) || 0,
            minStock: parseFloat(cols[5]) || 50,
            maxStock: parseFloat(cols[6]) || 1000,
            unitCost: parseFloat(cols[7]) || 0,
            supplierId: matchedSup?.id || suppliers[0]?.id || '',
            supplierName: matchedSup?.name || cleanCell(cols[8], 'Primary Vendor'),
            location: cleanCell(cols[9], 'Rack A-01'),
            description: `Raw Material Component ${mName}`,
            status: (cleanCell(cols[10]).toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
          });
        }

        if (parsedItems.length === 0) {
          setImportError('Could not parse any valid raw material items from file.');
        } else {
          setParsedImportItems(parsedItems);
        }
      } catch (err: any) {
        setImportError('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (parsedImportItems.length === 0) {
      setImportError('No items to import.');
      return;
    }

    let addedCount = 0;
    parsedImportItems.forEach((item) => {
      const res = addRawMaterial(item);
      if (res.success) addedCount++;
    });

    showToast(`Successfully imported ${addedCount} raw material SKU(s).`);
    setIsImportModalOpen(false);
    setImportFile(null);
    setParsedImportItems([]);
    setImportError(null);
  };

  return (
    <DashboardLayout
      roleTitle="Raw Material Management"
      roleBadge="Raw Material Manager"
      navItems={RAW_MATERIAL_NAV}
    >
      <div className="space-y-6">
        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-500/90 text-white shadow-2xl border border-emerald-400 backdrop-blur-md flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Boxes className="w-6 h-6 text-blue-600" /> Raw Materials Master Catalog
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage component SKUs, safety stock levels, storage bins, unit pricing, and stock transactions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setImportFile(null);
                setParsedImportItems([]);
                setImportError(null);
                setIsImportModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs flex items-center gap-2 transition shadow-sm"
            >
              <Upload className="w-4 h-4 text-emerald-600" /> Import Data
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
            <button
              onClick={() => {
                setEditingMaterial(null);
                setFormData({
                  sku: generateEntityCode('RAW_MATERIAL'),
                  name: '',
                  category: 'Connectors',
                  unit: 'PCS',
                  currentStock: 100,
                  minStock: 50,
                  maxStock: 1000,
                  unitCost: 25,
                  supplierId: '',
                  location: 'Rack A-01',
                  description: '',
                  status: 'ACTIVE',
                });
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Material
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Sorting */}
        <div className="erp-card p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search Material Name, Code (SKU), Location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Categories</option>
                <option value="Connectors">Connectors</option>
                <option value="Wires & Cables">Wires & Cables</option>
                <option value="Enclosures">Enclosures</option>
                <option value="Chips & PCB">Chips & PCB</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Status</option>
                <option value="LOW_STOCK">⚠️ Low Stock Warning</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>

            {/* Supplier Filter */}
            <div>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Raw Materials Data Table */}
        <div className="erp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition"
                    onClick={() => {
                      setSortBy('sku');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Material Code <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition"
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Material Name <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition"
                    onClick={() => {
                      setSortBy('stock');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Current Stock <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Min Stock</th>
                  <th className="py-3 px-4">Max Stock</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition"
                    onClick={() => {
                      setSortBy('cost');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Purchase Price <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-500">
                      No raw materials found matching your search or filters.
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((rm) => {
                    const isLowStock = rm.currentStock <= rm.minStock;
                    const activeReq = getActiveRequestForMaterial(rm.id);
                    return (
                      <tr key={rm.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-semibold text-blue-600">{rm.sku}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{rm.name}</td>
                        <td className="py-3 px-4 text-slate-600">{rm.category}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{rm.unit}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-bold ${
                              isLowStock ? 'text-amber-600 font-mono text-sm' : 'text-emerald-600'
                            }`}
                          >
                            {rm.currentStock.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{rm.minStock}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{rm.maxStock}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          ₹{rm.unitCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-[140px] truncate">
                          {rm.supplierName}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{rm.location}</td>
                        <td className="py-3 px-4">
                          {isLowStock ? (
                            <div className="flex flex-col gap-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 inline-flex items-center gap-1 w-max">
                                <AlertTriangle className="w-3 h-3" /> LOW STOCK
                              </span>
                              {activeReq && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1 w-max">
                                  <Clock className="w-2.5 h-2.5 text-blue-600" /> {activeReq.requestId}: {activeReq.status}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                rm.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {rm.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isLowStock && (
                              <button
                                onClick={() => openRequestStockModal(rm)}
                                title="Request Stock replenishment from supplier"
                                className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-semibold text-[11px] flex items-center gap-1 transition"
                              >
                                <ShoppingCart className="w-3 h-3 text-amber-600" /> Request Stock
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setViewingMaterial(rm);
                                setActiveDetailTab('details');
                              }}
                              title="View Details"
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingMaterial(rm);
                                setFormData({
                                  sku: rm.sku,
                                  name: rm.name,
                                  category: rm.category,
                                  unit: rm.unit,
                                  currentStock: rm.currentStock,
                                  minStock: rm.minStock,
                                  maxStock: rm.maxStock ?? 1000,
                                  unitCost: rm.unitCost,
                                  supplierId: rm.supplierId || '',
                                  location: rm.location,
                                  description: rm.description || '',
                                  status: rm.status ?? 'ACTIVE',
                                });
                                setIsAddModalOpen(true);
                              }}
                              title="Edit Material"
                              className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingMaterialId(rm.id)}
                              title="Delete Material"
                              className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: ADD / EDIT RAW MATERIAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl max-h-[90vh] w-full flex flex-col my-auto shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80 shrink-0">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                    <Boxes className="w-5 h-5" />
                  </div>
                  {editingMaterial ? 'Edit Raw Material' : 'Add New Raw Material'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition flex items-center justify-center shadow-sm"
                  title="Close Form"
                  aria-label="Close Form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">

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
                      Material Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 16-Pin Male Plug Connector"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Material Code (SKU) <span className="text-xs font-normal text-slate-500">(Auto-generated)</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.sku}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-blue-600 font-mono focus:outline-none cursor-not-allowed font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="Connectors">Connectors</option>
                      <option value="Wires & Cables">Wires & Cables</option>
                      <option value="Enclosures">Enclosures</option>
                      <option value="Chips & PCB">Chips & PCB</option>
                      <option value="Packaging">Packaging</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Unit of Measure <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="PCS">PCS (Pieces)</option>
                      <option value="METERS">METERS</option>
                      <option value="BOXES">BOXES</option>
                      <option value="SETS">SETS</option>
                      <option value="KG">KG (Kilograms)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Current Initial Stock
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Minimum Stock (Safety Threshold)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Maximum Stock Capacity
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.maxStock}
                      onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Purchase Price / Unit Cost (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Preferred Supplier <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleOpenQuickSupplierModal}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add New Supplier
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {availableSuppliers.length > 2 && (
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search supplier name or code..."
                            value={supplierSearchQuery}
                            onChange={(e) => setSupplierSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                          />
                        </div>
                      )}
                      <select
                        value={formData.supplierId}
                        onChange={(e) => {
                          if (e.target.value === '__ADD_NEW__') {
                            handleOpenQuickSupplierModal();
                          } else {
                            setFormData({ ...formData, supplierId: e.target.value });
                          }
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition font-medium"
                      >
                        <option value="">-- No Preferred Supplier (Optional) --</option>
                        <option value="__ADD_NEW__" className="font-bold text-blue-600 bg-blue-50">
                          + Add New Supplier...
                        </option>
                        {filteredSuppliersForForm.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.supplierCode ? `[${s.supplierCode}] ` : ''}{s.companyName || s.name} {s.status === 'INACTIVE' ? '(INACTIVE)' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500">
                        Supplier and Raw Material are independent master records. You can link or change this anytime.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Storage Bin / Rack Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rack A-12"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Material Specification / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter specs, pin dimensions, or notes..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-slate-50/80 px-6 py-4 -mx-6 -mb-6 mt-6 shrink-0">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700">Status:</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
                      }
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
                    >
                      {editingMaterial ? 'Save Changes' : 'Create Material'}
                    </button>
                  </div>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: QUICK INLINE ADD SUPPLIER */}
        {isQuickSupplierModalOpen && (
          <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-600">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Add New Supplier Master</h3>
                    <p className="text-[11px] text-slate-500">Create independent supplier record and auto-select here</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickSupplierModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {quickSupplierError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{quickSupplierError}</span>
                </div>
              )}

              <form onSubmit={handleSaveQuickSupplier} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Supplier Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PolyTech"
                      value={quickSupplierData.name}
                      onChange={(e) => setQuickSupplierData({ ...quickSupplierData, name: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Company / Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PolyTech Industries Pvt Ltd"
                      value={quickSupplierData.companyName}
                      onChange={(e) => setQuickSupplierData({ ...quickSupplierData, companyName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Mobile / WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      value={quickSupplierData.phone}
                      onChange={(e) => setQuickSupplierData({ ...quickSupplierData, phone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="sales@supplier.com"
                      value={quickSupplierData.email}
                      onChange={(e) => setQuickSupplierData({ ...quickSupplierData, email: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      placeholder="24AAACP1234F1Z5"
                      value={quickSupplierData.gstNumber}
                      onChange={(e) => setQuickSupplierData({ ...quickSupplierData, gstNumber: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Category
                    </label>
                    <select
                      value={quickSupplierData.category}
                      onChange={(e) => setQuickSupplierData({ ...quickSupplierData, category: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Raw Components">Raw Components</option>
                      <option value="Cable Extrusion">Cable Extrusion</option>
                      <option value="Hardware / Fasteners">Hardware / Fasteners</option>
                      <option value="Packaging & Labels">Packaging & Labels</option>
                      <option value="Electronics / PCB">Electronics / PCB</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      City & State
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Vadodara"
                        value={quickSupplierData.city}
                        onChange={(e) => setQuickSupplierData({ ...quickSupplierData, city: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Gujarat"
                        value={quickSupplierData.state}
                        onChange={(e) => setQuickSupplierData({ ...quickSupplierData, state: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={quickSupplierData.paymentTerms}
                      onChange={(e) => setQuickSupplierData({ ...quickSupplierData, paymentTerms: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Advance 100%">Advance 100%</option>
                      <option value="Net 15 Days">Net 15 Days</option>
                      <option value="Net 30 Days">Net 30 Days</option>
                      <option value="Net 45 Days">Net 45 Days</option>
                      <option value="Against Delivery">Against Delivery</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsQuickSupplierModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    Save & Select Supplier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: REQUEST STOCK FORM / MODAL */}
        {requestStockMaterial && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Request Stock Replenishment</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {requestStockMaterial.name} ({requestStockMaterial.sku})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRequestStockMaterial(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Low Stock Warning Header Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                    ⚠️ LOW STOCK ALERT TRIGGERED
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    Current stock ({requestStockMaterial.currentStock} {requestStockMaterial.unit}) is at or below the safety minimum threshold ({requestStockMaterial.minStock} {requestStockMaterial.unit}).
                  </p>
                </div>
              </div>

              {/* Active Request Duplicate Guard Banner */}
              {activeRequestInModal && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-blue-900">
                      ACTIVE REQUEST IN PROGRESS: {activeRequestInModal.requestId}
                    </div>
                    <p className="text-slate-700 text-[11px]">
                      Status: <span className="font-bold text-blue-600">{activeRequestInModal.status}</span> | Requested Qty: {activeRequestInModal.requestedQuantity} {activeRequestInModal.unit} on {activeRequestInModal.date}.
                      Sending another email/WhatsApp will update or attach to this existing active request.
                    </p>
                  </div>
                </div>
              )}

              {requestModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{requestModalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Material Name</div>
                  <div className="text-slate-900 font-bold truncate mt-0.5" title={requestStockMaterial.name}>
                    {requestStockMaterial.name}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Material Code</div>
                  <div className="text-blue-600 font-mono font-bold mt-0.5">{requestStockMaterial.sku}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Current Stock</div>
                  <div className="text-rose-600 font-mono font-bold mt-0.5">
                    {requestStockMaterial.currentStock} {requestStockMaterial.unit}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Minimum Stock</div>
                  <div className="text-amber-600 font-mono font-bold mt-0.5">
                    {requestStockMaterial.minStock} {requestStockMaterial.unit}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {/* Multi-supplier selection field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Send Request To Suppliers <span className="text-xs font-normal text-slate-500">(Select Multiple Suppliers)</span>
                    </label>
                    <span className="text-[11px] font-medium text-blue-600">
                      {requestSupplierIds.length} Supplier(s) Selected
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-44 overflow-y-auto space-y-1.5">
                    {suppliers
                      .filter((s) => (s.status ?? 'ACTIVE') === 'ACTIVE' || requestSupplierIds.includes(s.id))
                      .map((sup) => {
                        const isChecked = requestSupplierIds.includes(sup.id);
                        const isPrimary = sup.id === requestStockMaterial.supplierId;
                        return (
                          <label
                            key={sup.id}
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
                                    setRequestSupplierIds([...requestSupplierIds, sup.id]);
                                  } else {
                                    setRequestSupplierIds(requestSupplierIds.filter((id) => id !== sup.id));
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <div>
                                <span className="font-semibold text-slate-900">{sup.companyName || sup.name}</span>
                                {sup.supplierCode && (
                                  <span className="text-[10px] text-blue-600 font-mono ml-2">[{sup.supplierCode}]</span>
                                )}
                                {isPrimary && (
                                  <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                    Default Vendor
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {sup.email || sup.phone || sup.city}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Request Quantity <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        value={requestQty}
                        onChange={(e) => setRequestQty(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
                        {requestStockMaterial.unit}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Suggested: Maximum Stock ({requestStockMaterial.maxStock || 1000}) - Current Stock ({requestStockMaterial.currentStock})
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Created By</label>
                    <input
                      type="text"
                      readOnly
                      value="Raw Material Manager"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Message / Notes for Supplier
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter message details, delivery urgency, or instructions..."
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons: 1. Send Email, 2. Send WhatsApp, 3. Create Purchase Request */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Select Action to Process Request:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Mail className="w-4 h-4" /> Send Email
                  </button>

                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-100" /> Send WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={handleCreatePRAction}
                    disabled={!!activeRequestInModal}
                    className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition ${
                      activeRequestInModal
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                    }`}
                  >
                    <Plus className="w-4 h-4" /> Create Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: VIEW MATERIAL DETAILS & STOCK HISTORY */}
        {viewingMaterial && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{viewingMaterial.name}</h3>
                    <div className="text-xs text-blue-600 font-mono">{viewingMaterial.sku}</div>
                  </div>
                </div>
                <button
                  onClick={() => setViewingMaterial(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Detail Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
                <button
                  onClick={() => setActiveDetailTab('details')}
                  className={`pb-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                    activeDetailTab === 'details'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Info className="w-4 h-4" /> Material Info & Stock
                </button>
                <button
                  onClick={() => setActiveDetailTab('requests')}
                  className={`pb-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                    activeDetailTab === 'requests'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" /> Purchase Requests ({purchaseRequests.filter((pr) => pr.rawMaterialId === viewingMaterial.id).length})
                </button>
                <button
                  onClick={() => setActiveDetailTab('history')}
                  className={`pb-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                    activeDetailTab === 'history'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-4 h-4" /> Stock Transaction History
                </button>
              </div>

              {activeDetailTab === 'details' ? (
                <div className="space-y-4 text-xs">
                  {/* Low Stock Alert Header inside details view */}
                  {viewingMaterial.currentStock <= viewingMaterial.minStock && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-amber-800">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                        <div>
                          <div className="font-bold text-xs uppercase tracking-wider text-amber-900">
                            LOW STOCK WARNING ALERT
                          </div>
                          <div className="text-[11px] text-slate-700">
                            Current Stock ({viewingMaterial.currentStock} {viewingMaterial.unit}) is below minimum required level ({viewingMaterial.minStock} {viewingMaterial.unit}).
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => openRequestStockModal(viewingMaterial)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 flex items-center gap-1.5 shrink-0 shadow-sm transition"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Request Stock
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-slate-500 font-semibold uppercase text-[10px]">Basic Information</div>
                      <div>
                        <span className="text-slate-500">Category:</span>{' '}
                        <span className="text-slate-900 font-medium">{viewingMaterial.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Unit of Measure:</span>{' '}
                        <span className="text-slate-900 font-mono">{viewingMaterial.unit}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Description:</span>{' '}
                        <span className="text-slate-700 block mt-0.5">{viewingMaterial.description || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-slate-500 font-semibold uppercase text-[10px]">Stock & Status</div>
                      <div>
                        <span className="text-slate-500">Current Stock:</span>{' '}
                        <span className="text-emerald-600 font-bold text-sm">
                          {viewingMaterial.currentStock} {viewingMaterial.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Safety Min Stock:</span>{' '}
                        <span className="text-amber-600 font-medium">{viewingMaterial.minStock}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Max Capacity:</span>{' '}
                        <span className="text-slate-800 font-medium">{viewingMaterial.maxStock}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Stock Status:</span>{' '}
                        {viewingMaterial.currentStock <= viewingMaterial.minStock ? (
                          <span className="text-amber-600 font-bold">⚠️ LOW STOCK WARNING</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">OPTIMAL</span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 sm:col-span-2">
                      <div className="text-slate-500 font-semibold uppercase text-[10px]">Supplier & Storage</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-500">Preferred Supplier:</span>{' '}
                          <span className="text-slate-900 font-bold block">{viewingMaterial.supplierName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Purchase Cost / Unit:</span>{' '}
                          <span className="text-slate-900 font-bold block">
                            ₹{viewingMaterial.unitCost.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Storage Location:</span>{' '}
                          <span className="text-blue-600 font-mono block">{viewingMaterial.location}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Last Restocked:</span>{' '}
                          <span className="text-slate-700 font-mono block">
                            {viewingMaterial.lastRestocked || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeDetailTab === 'requests' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500">
                      Purchase Requests history and status tracking for this raw material
                    </div>
                    <button
                      onClick={() => openRequestStockModal(viewingMaterial)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-amber-600" /> New Stock Request
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Request ID</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Supplier</th>
                          <th className="py-2.5 px-3">Req Qty</th>
                          <th className="py-2.5 px-3">Created By</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Update Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {purchaseRequests.filter((pr) => pr.rawMaterialId === viewingMaterial.id).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-500">
                              No purchase requests raised for this material yet.
                            </td>
                          </tr>
                        ) : (
                          purchaseRequests
                            .filter((pr) => pr.rawMaterialId === viewingMaterial.id)
                            .map((pr) => (
                              <tr key={pr.id} className="hover:bg-slate-50 transition">
                                <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{pr.requestId}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-500">{pr.date}</td>
                                <td className="py-2.5 px-3 text-slate-900 font-medium">{pr.supplierName}</td>
                                <td className="py-2.5 px-3 font-bold text-emerald-600 font-mono">
                                  {pr.requestedQuantity} {pr.unit}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 text-[11px]">{pr.createdBy}</td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      pr.status === 'Pending'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : pr.status === 'Sent'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : pr.status === 'Supplier Confirmed'
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : pr.status === 'Partially Received'
                                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                                        : pr.status === 'Received'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    {pr.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <select
                                    value={pr.status}
                                    onChange={(e) => {
                                      updatePurchaseRequestStatus(pr.id, e.target.value as PurchaseRequestStatus);
                                      showToast(`Request ${pr.requestId} updated to ${e.target.value}`);
                                    }}
                                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] text-slate-800 focus:outline-none focus:border-blue-500"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Sent">Sent</option>
                                    <option value="Supplier Confirmed">Supplier Confirmed</option>
                                    <option value="Partially Received">Partially Received</option>
                                    <option value="Received">Received</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500">
                    Audit log of stock movements (Inward Receipts, Outward Consumptions, Adjustments)
                  </div>
                  <div className="overflow-x-auto max-h-64 border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Transaction Type</th>
                          <th className="py-2 px-3">Reference</th>
                          <th className="py-2 px-3 text-emerald-600">Qty In</th>
                          <th className="py-2 px-3 text-rose-600">Qty Out</th>
                          <th className="py-2 px-3">New Balance</th>
                          <th className="py-2 px-3">User</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stockTransactions.filter((tx) => tx.materialId === viewingMaterial.id).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-500">
                              No transaction history recorded yet for this material.
                            </td>
                          </tr>
                        ) : (
                          stockTransactions
                            .filter((tx) => tx.materialId === viewingMaterial.id)
                            .map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-mono text-slate-500">{tx.date}</td>
                                <td className="py-2 px-3 font-semibold text-slate-900">{tx.transactionType}</td>
                                <td className="py-2 px-3 font-mono text-blue-600">{tx.reference}</td>
                                <td className="py-2 px-3 font-bold text-emerald-600">
                                  {tx.quantityIn > 0 ? `+${tx.quantityIn}` : '-'}
                                </td>
                                <td className="py-2 px-3 font-bold text-rose-600">
                                  {tx.quantityOut > 0 ? `-${tx.quantityOut}` : '-'}
                                </td>
                                <td className="py-2 px-3 font-bold text-slate-900 font-mono">{tx.newBalance}</td>
                                <td className="py-2 px-3 text-slate-500">{tx.user}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 3: DELETE CONFIRMATION */}
        {deletingMaterialId && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-slate-900">Delete Raw Material?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete this raw material item? This action will remove the item from the catalog. Materials with recorded purchase transactions cannot be deleted.
              </p>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setDeletingMaterialId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: BULK DATA IMPORT */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Bulk Import Raw Materials</h3>
                    <p className="text-xs text-slate-500">Upload Excel / CSV or extracted PDF component list to import multiple records at once.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sample Template Callout */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" /> Need standard format?
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Download our pre-formatted CSV sample template with required raw material fields.</p>
                </div>
                <button
                  onClick={handleDownloadSampleTemplate}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" /> Download Template
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition group cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-600 mb-2 transition" />
                <h4 className="text-xs font-bold text-slate-800">
                  {importFile ? importFile.name : 'Click or Drag & Drop Excel/CSV/PDF file here'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">Supports CSV, XLSX, XLS, PDF data tables (Max 10MB)</p>
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {importError}
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedImportItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Parsed Items Preview ({parsedImportItems.length} Records)
                    </h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2">Code</th>
                          <th className="p-2">Material Name</th>
                          <th className="p-2">Category</th>
                          <th className="p-2 text-right">Cost (₹)</th>
                          <th className="p-2 text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                        {parsedImportItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-blue-600 font-bold">{item.sku}</td>
                            <td className="p-2 font-semibold text-slate-900">{item.name}</td>
                            <td className="p-2 text-slate-600">{item.category}</td>
                            <td className="p-2 text-right font-bold text-slate-900">₹{item.unitCost}</td>
                            <td className="p-2 text-right font-bold text-slate-900">{item.currentStock} {item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  disabled={parsedImportItems.length === 0}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Import {parsedImportItems.length > 0 ? `${parsedImportItems.length} Materials` : 'Data'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
