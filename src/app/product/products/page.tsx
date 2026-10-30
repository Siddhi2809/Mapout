'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PRODUCT_NAV } from '@/lib/nav';
import { useERP } from '@/context/ERPContext';
import { ProductMaster, ProductRawMaterialQuantity } from '@/types/erp';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  X,
  AlertCircle,
  Image as ImageIcon,
  Layers,
  Upload,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

export default function ProductsPage() {
  const {
    products,
    rawMaterials,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    boms,
    productionOrders,
    salesOrders,
    productReturns,
    fgTransactions,
    generateEntityCode,
    refreshProductsFromDB,
    refreshRawMaterialsFromDB,
  } = useERP();

  // Refresh latest products and raw materials from database on load
  React.useEffect(() => {
    refreshProductsFromDB();
    refreshRawMaterialsFromDB();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('name');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedImportItems, setParsedImportItems] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<ProductMaster | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'specs' | 'materials' | 'pricing' | 'gst' | 'stock' | 'compatibility' | 'bom' | 'production' | 'history'>('basic');

  // Form State
  const [formData, setFormData] = useState({
    productCode: '',
    sku: '',
    name: '',
    category: 'OBD Cable',
    brand: 'MapOut24',
    connectorType: 'OBD-II 16-Pin Male Plug',
    cableLengthWireSpec: '1.5M 16-Core Shielded OFC Wire',
    vehicleScannerCompatibility: 'Automotive OBD-II Scanners & GPS Trackers',
    subcategory: '',
    description: '',
    purchaseCost: '',
    sellingPrice: '',
    discount: '0',
    gstPercent: '18',
    hsnSac: '85444290',
    openingStock: '0',
    currentStock: '0',
    minStock: '10',
    maxStock: '500',
    imageUrl: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    compatibilityItems: [{ compatibleItem: '', notes: '' }],
    rawMaterialQuantities: [] as {
      rawMaterialId: string;
      rawMaterialName: string;
      sku: string;
      unit: string;
      quantityUsed: number;
      wastagePercent: number;
      notes: string;
    }[],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter & Search Logic
  const categories = Array.from(new Set(products.map((p) => p.category)));
  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[];

  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.connectorType || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchBrand = selectedBrand === 'ALL' || p.brand === selectedBrand;
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      return matchSearch && matchCat && matchBrand && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'code') return a.productCode.localeCompare(b.productCode);
      if (sortBy === 'stock') return b.currentStock - a.currentStock;
      if (sortBy === 'price') return b.sellingPrice - a.sellingPrice;
      return 0;
    });

  const handleOpenAddModal = () => {
    refreshRawMaterialsFromDB();
    const defaultBrand = 'MapOut24';
    const autoProductCode = generateEntityCode('PRODUCT');
    const firstRM = rawMaterials[0];
    setFormData({
      productCode: autoProductCode,
      sku: autoProductCode,
      name: '',
      category: 'OBD Cable',
      brand: defaultBrand,
      connectorType: 'OBD-II 16-Pin Male Connector',
      cableLengthWireSpec: '1.5M 16-Core Shielded OFC Copper Cable',
      vehicleScannerCompatibility: '12V/24V Standard OBD-II Vehicles & Diagnostic Scanners',
      subcategory: '',
      description: '',
      purchaseCost: '',
      sellingPrice: '',
      discount: '0',
      gstPercent: '18',
      hsnSac: '85444290',
      openingStock: '0',
      currentStock: '0',
      minStock: '20',
      maxStock: '1000',
      imageUrl: '',
      status: 'ACTIVE',
      compatibilityItems: [{ compatibleItem: '', notes: '' }],
      rawMaterialQuantities: firstRM
        ? [
            {
              rawMaterialId: firstRM.id,
              rawMaterialName: firstRM.name,
              sku: firstRM.sku,
              unit: firstRM.unit,
              quantityUsed: 1,
              wastagePercent: 2,
              notes: '',
            },
          ]
        : [],
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: ProductMaster) => {
    refreshRawMaterialsFromDB();
    setSelectedProduct(p);

    // Check if BOM exists for this product to pre-populate material quantities
    const activeBOM = boms.find((b) => b.productId === p.id && b.status === 'Active') || boms.find((b) => b.productId === p.id);
    const initialRMQuantities = p.rawMaterialQuantities && p.rawMaterialQuantities.length > 0
      ? p.rawMaterialQuantities.map((rmq) => ({
          rawMaterialId: rmq.rawMaterialId,
          rawMaterialName: rmq.rawMaterialName,
          sku: rmq.sku || '',
          unit: rmq.unit || 'PCS',
          quantityUsed: rmq.quantityUsed,
          wastagePercent: rmq.wastagePercent || 0,
          notes: rmq.notes || '',
        }))
      : activeBOM
      ? activeBOM.items.map((i) => ({
          rawMaterialId: i.rawMaterialId,
          rawMaterialName: i.rawMaterialName,
          sku: i.sku,
          unit: i.unit,
          quantityUsed: i.quantity,
          wastagePercent: i.wastagePercent,
          notes: i.notes || '',
        }))
      : rawMaterials[0]
      ? [
          {
            rawMaterialId: rawMaterials[0].id,
            rawMaterialName: rawMaterials[0].name,
            sku: rawMaterials[0].sku,
            unit: rawMaterials[0].unit,
            quantityUsed: 1,
            wastagePercent: 0,
            notes: '',
          },
        ]
      : [];

    setFormData({
      productCode: p.productCode,
      sku: p.sku,
      name: p.name,
      category: p.category,
      brand: p.brand || 'MapOut24',
      connectorType: p.connectorType || '',
      cableLengthWireSpec: p.cableLengthWireSpec || '',
      vehicleScannerCompatibility: p.vehicleScannerCompatibility || '',
      subcategory: p.subcategory || '',
      description: p.description || '',
      purchaseCost: String(p.purchaseCost),
      sellingPrice: String(p.sellingPrice),
      discount: String(p.discount || 0),
      gstPercent: String(p.gstPercent),
      hsnSac: p.hsnSac || '',
      openingStock: String(p.openingStock),
      currentStock: String(p.currentStock),
      minStock: String(p.minStock),
      maxStock: String(p.maxStock),
      imageUrl: p.imageUrl || '',
      status: p.status,
      compatibilityItems:
        p.compatibility && p.compatibility.length > 0
          ? p.compatibility.map((c) => ({ compatibleItem: c.compatibleItem, notes: c.notes || '' }))
          : [{ compatibleItem: '', notes: '' }],
      rawMaterialQuantities: initialRMQuantities,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDetails = (p: ProductMaster) => {
    setSelectedProduct(p);
    setActiveTab('basic');
    setIsDetailsDrawerOpen(true);
  };

  const handleAddRMRow = () => {
    const firstRM = rawMaterials[0];
    if (!firstRM) return;
    setFormData({
      ...formData,
      rawMaterialQuantities: [
        ...formData.rawMaterialQuantities,
        {
          rawMaterialId: firstRM.id,
          rawMaterialName: firstRM.name,
          sku: firstRM.sku,
          unit: firstRM.unit,
          quantityUsed: 1,
          wastagePercent: 0,
          notes: '',
        },
      ],
    });
  };

  const handleRemoveRMRow = (idx: number) => {
    setFormData({
      ...formData,
      rawMaterialQuantities: formData.rawMaterialQuantities.filter((_, i) => i !== idx),
    });
  };

  const handleRMSelectChange = (idx: number, rmId: string) => {
    const rm = rawMaterials.find((r) => r.id === rmId);
    if (!rm) return;
    const updated = [...formData.rawMaterialQuantities];
    updated[idx] = {
      ...updated[idx],
      rawMaterialId: rm.id,
      rawMaterialName: rm.name,
      sku: rm.sku,
      unit: rm.unit,
    };
    setFormData({ ...formData, rawMaterialQuantities: updated });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) return setFormError('Product Name is required.');
    if (!formData.productCode.trim()) return setFormError('Product Code is required.');
    if (!formData.sku.trim()) return setFormError('Unique SKU is required.');

    const pCost = formData.purchaseCost !== '' && !isNaN(parseFloat(formData.purchaseCost)) ? parseFloat(formData.purchaseCost) : 0;
    const sPrice = formData.sellingPrice !== '' && !isNaN(parseFloat(formData.sellingPrice)) ? parseFloat(formData.sellingPrice) : 0;
    const gst = formData.gstPercent !== '' && !isNaN(parseFloat(formData.gstPercent)) ? parseFloat(formData.gstPercent) : 18;
    const minS = parseInt(formData.minStock, 10);
    const maxS = parseInt(formData.maxStock, 10);
    const openS = parseInt(formData.openingStock, 10);
    const currS = parseInt(formData.currentStock, 10);

    if (pCost < 0) return setFormError('Please enter a valid Purchase Cost (≥ 0).');
    if (sPrice < 0) return setFormError('Please enter a valid Selling Price (≥ 0).');
    if (isNaN(gst) || gst < 0 || gst > 100) return setFormError('Please enter a valid GST % (0 - 100).');
    if (isNaN(minS) || isNaN(maxS) || minS > maxS) {
      return setFormError('Minimum Stock Level cannot be greater than Maximum Stock Limit.');
    }

    const payload = {
      productCode: formData.productCode.trim(),
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      category: formData.category,
      brand: formData.brand.trim(),
      connectorType: formData.connectorType.trim(),
      cableLengthWireSpec: formData.cableLengthWireSpec.trim(),
      vehicleScannerCompatibility: formData.vehicleScannerCompatibility.trim(),
      subcategory: formData.subcategory.trim(),
      description: formData.description.trim(),
      purchaseCost: pCost,
      sellingPrice: sPrice,
      discount: parseFloat(formData.discount || '0'),
      gstPercent: gst,
      hsnSac: formData.hsnSac.trim(),
      openingStock: !isNaN(openS) && openS > 0 ? openS : (!isNaN(currS) ? currS : 0),
      currentStock: !isNaN(currS) ? currS : (!isNaN(openS) ? openS : 0),
      minStock: minS,
      maxStock: maxS,
      imageUrl: formData.imageUrl.trim(),
      status: formData.status,
      compatibility: formData.compatibilityItems.filter((c) => c.compatibleItem.trim() !== ''),
      rawMaterialQuantities: formData.rawMaterialQuantities.map((rmq) => ({
        rawMaterialId: rmq.rawMaterialId,
        rawMaterialName: rmq.rawMaterialName,
        sku: rmq.sku,
        unit: rmq.unit,
        quantityUsed: Number(rmq.quantityUsed) || 1,
        wastagePercent: Number(rmq.wastagePercent) || 0,
        notes: rmq.notes || '',
      })),
    };

    if (isEditModalOpen && selectedProduct) {
      const res = updateProduct(selectedProduct.id, payload);
      if (!res.success) {
        setFormError(res.message || 'Failed to update product');
        return;
      }
      refreshProductsFromDB();
      refreshRawMaterialsFromDB();
      showToast(`Product "${payload.name}" updated successfully.`);
      setIsEditModalOpen(false);
    } else {
      const res = addProduct(payload);
      if (!res.success) {
        setFormError(res.message || 'Failed to add product');
        return;
      }
      refreshProductsFromDB();
      refreshRawMaterialsFromDB();
      showToast(`Product "${payload.name}" created successfully.`);
      setIsAddModalOpen(false);
    }
  };

  const handleDelete = (p: ProductMaster) => {
    if (confirm(`Are you sure you want to delete product "${p.name}"?`)) {
      const res = deleteProduct(p.id);
      if (!res.success) {
        alert(res.message);
      } else {
        showToast(`Product "${p.name}" deleted.`);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Product Code,SKU,Product Name,Category,Brand,Connector Type,Cable & Wire Spec,Vehicle / Scanner Compatibility,Selling Price,Purchase Cost,GST %,HSN,Current Stock,Min Stock Level,Max Stock,Status',
    ];
    const rows = filteredProducts.map(
      (p) =>
        `"${p.productCode}","${p.sku}","${p.name.replace(/"/g, '""')}","${p.category}","${p.brand || ''}","${p.connectorType || ''}","${p.cableLengthWireSpec || ''}","${p.vehicleScannerCompatibility || ''}",${p.sellingPrice},${p.purchaseCost},${p.gstPercent},"${p.hsnSac || ''}",${p.currentStock},${p.minStock},${p.maxStock},"${p.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Product_Master_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleTemplate = () => {
    const sampleHeaders = 'Product Code,SKU,Product Name,Category,Brand,Connector Type,Cable & Wire Spec,Vehicle / Scanner Compatibility,Selling Price,Purchase Cost,GST %,HSN,Current Stock,Min Stock Level,Max Stock,Status';
    const sampleRow1 = '"PRD-EXP-001","SKU-EXP-001","OBD2 Male 16Pin Splitter Y Cable","OBD Cable","MapOut24","OBD-II 16-Pin Male","1.5M Shielded Copper","All 12V OBD Scanner Tools",1250,450,18,"85444290",150,20,500,"ACTIVE"';
    const sampleRow2 = '"PRD-EXP-002","SKU-EXP-002","OBD2 Female Socket Diagnostic Extension","Diagnostic Cable","MapOut24","OBD-II 16-Pin Female","0.5M OFC Wire","Heavy Duty Diagnostic Tools",890,320,18,"85444290",80,15,300,"ACTIVE"';
    const content = 'data:text/csv;charset=utf-8,' + [sampleHeaders, sampleRow1, sampleRow2].join('\n');
    const encoded = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', 'Product_Master_Import_Sample_Template.csv');
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
          setImportError('No valid data rows found in file.');
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
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 3) continue;

          const pCode = cols[0] || generateEntityCode('PRODUCT');
          const pSku = cols[1] || pCode;
          const pName = cols[2];
          if (!pName) continue;

          parsedItems.push({
            productCode: pCode,
            sku: pSku,
            name: pName,
            category: cols[3] || 'OBD Cable',
            brand: cols[4] || 'MapOut24',
            connectorType: cols[5] || 'OBD-II 16-Pin Male Plug',
            cableLengthWireSpec: cols[6] || '1.5M 16-Core Shielded Cable',
            vehicleScannerCompatibility: cols[7] || 'Standard Diagnostic Scanners',
            sellingPrice: parseFloat(cols[8]) || 0,
            purchaseCost: parseFloat(cols[9]) || 0,
            gstPercent: parseFloat(cols[10]) || 18,
            hsnSac: cols[11] || '85444290',
            openingStock: parseInt(cols[12]) || 0,
            currentStock: parseInt(cols[12]) || 0,
            minStock: parseInt(cols[13]) || 10,
            maxStock: parseInt(cols[14]) || 500,
            status: (cols[15]?.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
            imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
            compatibility: [{ id: 'COMP-1', compatibleItem: cols[7] || 'Universal Diagnostic Tools' }],
            rawMaterialQuantities: rawMaterials[0]
              ? [
                  {
                    rawMaterialId: rawMaterials[0].id,
                    rawMaterialName: rawMaterials[0].name,
                    sku: rawMaterials[0].sku,
                    unit: rawMaterials[0].unit,
                    quantityUsed: 1,
                    wastagePercent: 0,
                  },
                ]
              : [],
          });
        }

        if (parsedItems.length === 0) {
          setImportError('Could not parse any valid product items from file.');
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
      const res = addProduct(item);
      if (res.success) addedCount++;
    });

    showToast(`Successfully imported ${addedCount} product(s) into Master Catalog.`);
    setIsImportModalOpen(false);
    setImportFile(null);
    setParsedImportItems([]);
    setImportError(null);
  };

  return (
    <DashboardLayout
      roleTitle="Product Management"
      roleBadge="Product Manager"
      navItems={PRODUCT_NAV}
    >
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" /> {toastMessage}
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Master</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage product catalogs, raw material component usage quantities per unit, hardware specs, brand, and safety stock levels.
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
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 transition shadow-sm"
            >
              <Upload className="w-4 h-4 text-emerald-600" /> Import Data
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Add Product Master
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="erp-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-200 shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name, Code (SMPL001), SKU, Brand..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Filters:
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {brands.length > 0 && (
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="ALL">All Brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="name">Sort by Name</option>
              <option value="code">Sort by Code (e.g. SMPL001)</option>
              <option value="stock">Sort by Stock</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>
        </div>

        {/* Product Master Table */}
        <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
                  <th className="p-3.5">Img</th>
                  <th className="p-3.5">Code / SKU</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Category & Brand</th>
                  <th className="p-3.5">Raw Material Component Quantities</th>
                  <th className="p-3.5 text-right">Current Stock</th>
                  <th className="p-3.5 text-right">Min Stock</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minStock;
                  const activeBOM = boms.find((b) => b.productId === p.id && b.status === 'Active') || boms.find((b) => b.productId === p.id);
                  const rmQuantities = p.rawMaterialQuantities && p.rawMaterialQuantities.length > 0
                    ? p.rawMaterialQuantities
                    : activeBOM
                    ? activeBOM.items.map((i) => ({ rawMaterialName: i.rawMaterialName, quantityUsed: i.quantity, unit: i.unit }))
                    : [];

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono">
                        <div className="text-blue-600 font-bold">{p.productCode}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{p.sku}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900 max-w-[200px]">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">₹{p.sellingPrice.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="p-3.5 text-slate-700">
                        <div className="font-medium text-slate-900">{p.category}</div>
                        <div className="text-[10px] text-blue-600 font-bold">{p.brand || 'MapOut24'}</div>
                      </td>
                      <td className="p-3.5 max-w-[220px]">
                        {rmQuantities.length > 0 ? (
                          <div className="space-y-0.5">
                            {rmQuantities.slice(0, 2).map((rm, idx) => (
                              <div key={idx} className="text-[11px] text-slate-700 flex items-center justify-between">
                                <span className="truncate max-w-[130px] font-medium">{rm.rawMaterialName}</span>
                                <span className="font-bold text-emerald-700 shrink-0 ml-1">
                                  {rm.quantityUsed} {rm.unit || 'PCS'}
                                </span>
                              </div>
                            ))}
                            {rmQuantities.length > 2 && (
                              <div className="text-[9px] text-slate-500 font-mono">+{rmQuantities.length - 2} more materials</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">No component specs set</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 text-sm">
                        <span className={isLow ? 'text-amber-700 font-extrabold' : 'text-slate-900'}>{p.currentStock}</span>
                      </td>
                      <td className="p-3.5 text-right text-slate-600 font-medium">{p.minStock}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleProductStatus(p.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                          }`}
                        >
                          {p.status}
                        </button>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(p)}
                            title="View Full Specs & Component Quantities"
                            className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Product Master"
                            className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-slate-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-slate-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500 text-xs">
                      No product master records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD / EDIT PRODUCT MASTER MODAL */}
        {(isAddModalOpen || isEditModalOpen) && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }
            }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 lg:p-6 overflow-y-auto"
          >
            <div className="erp-card w-full max-w-5xl max-h-[90vh] flex flex-col bg-white border border-slate-200 my-auto shadow-2xl rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80 shrink-0">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                    <Boxes className="w-5 h-5" />
                  </div>
                  {isEditModalOpen ? 'Edit Product Master Record' : 'Create New Product Master Record'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  title="Close Form"
                  aria-label="Close Form"
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition flex items-center justify-center shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="space-y-6">
                {/* 1. Product Identity & Codes */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-blue-600 tracking-wide uppercase">1. Product Identity & Codes</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. MapOut24 OBD-II Y-Splitter Cable (Male to Dual Female 30cm)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Company / Brand Name</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="e.g. MapOut24, Sunyash"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Product Code (Auto-Generated)</label>
                      <input
                        type="text"
                        readOnly
                        value={formData.productCode}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Unique SKU Code (Auto-Generated)</label>
                      <input
                        type="text"
                        readOnly
                        value={formData.sku}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 cursor-not-allowed font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. DYNAMIC RAW MATERIAL QUANTITIES SECTION */}
                <div className="space-y-3 pt-2 border-t border-slate-200 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 tracking-wide uppercase flex items-center gap-2">
                        <Layers className="w-4 h-4" /> 2. Raw Material Quantities Required to Make 1 Unit of Product
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Specify the exact size/quantity of each raw material used for manufacturing 1 product unit.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddRMRow}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Raw Material Component
                    </button>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {formData.rawMaterialQuantities.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center shadow-sm"
                      >
                        <div className="sm:col-span-6">
                          <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Raw Material Component</label>
                          <select
                            value={item.rawMaterialId}
                            onChange={(e) => handleRMSelectChange(idx, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                          >
                            {rawMaterials.filter((rm) => (rm.status || 'ACTIVE') === 'ACTIVE' || rm.id === item.rawMaterialId).length === 0 ? (
                              <option value="">No Active Raw Materials Found</option>
                            ) : (
                              rawMaterials
                                .filter((rm) => (rm.status || 'ACTIVE') === 'ACTIVE' || rm.id === item.rawMaterialId)
                                .map((rm) => (
                                  <option key={rm.id} value={rm.id}>
                                    {rm.name} ({rm.sku}) — [{rm.category || 'Component'}] | Stock: {rm.currentStock} {rm.unit} | Cost: ₹{rm.unitCost}
                                  </option>
                                ))
                            )}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Quantity Size / Used</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              placeholder="0"
                              value={item.quantityUsed === 0 ? '' : item.quantityUsed}
                              onKeyDown={(e) => {
                                if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                const updated = [...formData.rawMaterialQuantities];
                                updated[idx].quantityUsed = raw === '' ? 0 : parseInt(raw, 10);
                                setFormData({ ...formData, rawMaterialQuantities: updated });
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[11px] font-mono text-emerald-700 shrink-0 font-bold">{item.unit}</span>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Wastage %</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="0"
                            value={item.wastagePercent === 0 ? '' : item.wastagePercent}
                            onKeyDown={(e) => {
                              if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              const updated = [...formData.rawMaterialQuantities];
                              updated[idx].wastagePercent = raw === '' ? 0 : parseInt(raw, 10);
                              setFormData({ ...formData, rawMaterialQuantities: updated });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>

                        <div className="sm:col-span-1 text-right pt-4 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveRMRow(idx)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                            title="Remove raw material component"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {formData.rawMaterialQuantities.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl bg-white">
                        No raw material components added. Click "+ Add Raw Material Component" above to specify raw material quantity required for making this product.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Hardware & Vehicle Specifications */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-blue-700 tracking-wide uppercase">3. Hardware & Vehicle Specifications</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      >
                        <option value="OBD Cable">OBD Cable</option>
                        <option value="OBD Splitter">OBD Splitter</option>
                        <option value="GPS Tracker Harness">GPS Tracker Harness</option>
                        <option value="Diagnostic Adapter">Diagnostic Adapter</option>
                        <option value="Custom Harness">Custom Harness</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Connector Type</label>
                      <input
                        type="text"
                        value={formData.connectorType}
                        onChange={(e) => setFormData({ ...formData, connectorType: e.target.value })}
                        placeholder="e.g. OBD-II 16-Pin Male Plug Connector to Dual Female"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Cable Length & Wire/Core Spec</label>
                      <input
                        type="text"
                        value={formData.cableLengthWireSpec}
                        onChange={(e) => setFormData({ ...formData, cableLengthWireSpec: e.target.value })}
                        placeholder="e.g. 1.5M 16-Core Shielded OFC Wire"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Vehicle / Scanner Compatibility</label>
                      <input
                        type="text"
                        value={formData.vehicleScannerCompatibility}
                        onChange={(e) => setFormData({ ...formData, vehicleScannerCompatibility: e.target.value })}
                        placeholder="e.g. 12V/24V OBD-II Vehicles & Launch Diagnostics Scanners"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Stock Controls */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-blue-700 tracking-wide uppercase">4. Stock Control Levels</span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Opening Stock *</label>
                      <input
                        type="number"
                        required
                        value={formData.openingStock}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, openingStock: val, currentStock: val });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Current Stock *</label>
                      <input
                        type="number"
                        required
                        value={formData.currentStock}
                        onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Minimum Stock Level *</label>
                      <input
                        type="number"
                        required
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Maximum Stock Limit *</label>
                      <input
                        type="number"
                        required
                        value={formData.maxStock}
                        onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Pricing & Image URL */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-emerald-700 tracking-wide uppercase">5. Pricing, Tax & Media</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Purchase Cost (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.purchaseCost}
                        onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Selling Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1 font-semibold">Product Image URL</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Raw Material Component Quantities */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-purple-700 tracking-wide uppercase flex items-center gap-1.5">
                        <Boxes className="w-4 h-4 text-purple-600" />
                        6. Raw Material Component Quantities (Stored in DB)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Select raw material components required for 1 unit of this finished product. Quantities must be whole numbers only without spinner arrows.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddRMRow}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Component
                    </button>
                  </div>

                  {formData.rawMaterialQuantities.length === 0 ? (
                    <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-center text-xs text-purple-700">
                      No raw material components linked yet. Click &quot;Add Component&quot; to configure database raw materials used for manufacturing.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formData.rawMaterialQuantities.map((row, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                        >
                          {/* Raw material select */}
                          <div className="sm:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Raw Material Component *
                            </label>
                            <select
                              value={row.rawMaterialId}
                              onChange={(e) => handleRMSelectChange(idx, e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-purple-500"
                            >
                              {rawMaterials.map((rm) => (
                                <option key={rm.id} value={rm.id}>
                                  {rm.name} ({rm.sku}) - Stock: {rm.currentStock} {rm.unit}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity used (whole number, no spinner) */}
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Quantity Used (Whole Number) *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                required
                                placeholder="1"
                                value={row.quantityUsed}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  const num = val === '' ? 0 : parseInt(val, 10);
                                  const updated = [...formData.rawMaterialQuantities];
                                  updated[idx] = { ...updated[idx], quantityUsed: num };
                                  setFormData({ ...formData, rawMaterialQuantities: updated });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="absolute right-2.5 top-1.5 text-[11px] font-bold text-slate-400">
                                {row.unit || 'PCS'}
                              </span>
                            </div>
                          </div>

                          {/* Wastage % */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Wastage %
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="0"
                              value={row.wastagePercent}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                const num = val === '' ? 0 : parseInt(val, 10);
                                const updated = [...formData.rawMaterialQuantities];
                                updated[idx] = { ...updated[idx], wastagePercent: num };
                                setFormData({ ...formData, rawMaterialQuantities: updated });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>

                          {/* Notes */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Notes
                            </label>
                            <input
                              type="text"
                              placeholder="Notes..."
                              value={row.notes}
                              onChange={(e) => {
                                const updated = [...formData.rawMaterialQuantities];
                                updated[idx] = { ...updated[idx], notes: e.target.value };
                                setFormData({ ...formData, rawMaterialQuantities: updated });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          {/* Remove button */}
                          <div className="sm:col-span-1 flex justify-center pt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveRMRow(idx)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Remove component"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 bg-slate-50/80 px-6 py-4 -mx-6 -mb-6 mt-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
                  >
                    {isEditModalOpen ? 'Save Product Master Changes' : 'Create Product Master Record'}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}

        {/* DETAILS DRAWER */}
        {isDetailsDrawerOpen && selectedProduct && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsDetailsDrawerOpen(false);
              }
            }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end"
          >
            <div className="erp-card w-full max-w-3xl h-full bg-white border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-4">
                    {selectedProduct.imageUrl && (
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{selectedProduct.name}</h2>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Product Code: <span className="text-blue-600 font-bold">{selectedProduct.productCode}</span> | SKU:{' '}
                        <span className="text-emerald-700 font-semibold">{selectedProduct.sku}</span> | Brand:{' '}
                        <span className="text-blue-600 font-semibold">{selectedProduct.brand || 'MapOut24'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDetailsDrawerOpen(false)}
                    title="Close / Minimize Details Drawer"
                    aria-label="Close / Minimize Details Drawer"
                    className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition flex items-center justify-center shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Details Tab Bar */}
                <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
                  {[
                    { id: 'basic', label: 'Basic Info' },
                    { id: 'materials', label: 'Raw Material Quantities' },
                    { id: 'specs', label: 'Hardware Specs' },
                    { id: 'pricing', label: 'Pricing & GST' },
                    { id: 'stock', label: 'Stock Levels' },
                    { id: 'bom', label: 'Active BOM' },
                    { id: 'production', label: 'Production History' },
                    { id: 'history', label: 'Stock Transactions' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content Panels */}
                <div className="space-y-4 text-xs">
                  {activeTab === 'basic' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-500 font-medium">Category:</span>
                          <div className="font-semibold text-slate-900 mt-0.5">{selectedProduct.category}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Brand:</span>
                          <div className="font-semibold text-blue-700 mt-0.5">{selectedProduct.brand || 'MapOut24'}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Status:</span>
                          <div className="font-semibold text-emerald-700 mt-0.5">{selectedProduct.status}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Date Added:</span>
                          <div className="font-semibold text-slate-700 mt-0.5">{selectedProduct.createdAt || 'N/A'}</div>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Description:</span>
                        <p className="text-slate-700 mt-1 leading-relaxed">{selectedProduct.description || 'No description added.'}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'materials' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900">Raw Material Quantities Used to Make 1 Unit</h4>
                      {(() => {
                        const activeBOM = boms.find((b) => b.productId === selectedProduct.id && b.status === 'Active') || boms.find((b) => b.productId === selectedProduct.id);
                        const items = selectedProduct.rawMaterialQuantities && selectedProduct.rawMaterialQuantities.length > 0
                          ? selectedProduct.rawMaterialQuantities
                          : activeBOM
                          ? activeBOM.items.map((i) => ({ rawMaterialName: i.rawMaterialName, quantityUsed: i.quantity, unit: i.unit, wastagePercent: i.wastagePercent, notes: i.notes }))
                          : [];

                        if (items.length === 0) {
                          return <div className="text-slate-500 py-4 text-center">No raw material quantities recorded.</div>;
                        }

                        return (
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-700 font-semibold">
                                <th className="py-2">Raw Material Component</th>
                                <th className="py-2 text-right">Quantity Size Used / Unit</th>
                                <th className="py-2 text-right">Wastage %</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {items.map((i, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 text-slate-900 font-medium">{i.rawMaterialName}</td>
                                  <td className="py-2 text-right font-bold text-emerald-700 text-sm">
                                    {i.quantityUsed} {i.unit || 'PCS'}
                                  </td>
                                  <td className="py-2 text-right text-slate-600 font-medium">{i.wastagePercent || 0}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  )}

                  {activeTab === 'specs' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-500 font-medium">Connector Type:</span>
                        <div className="font-semibold text-slate-900 mt-0.5">{selectedProduct.connectorType || 'Standard OBD-II'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Cable Length & Wire Specification:</span>
                        <div className="font-semibold text-slate-800 mt-0.5">{selectedProduct.cableLengthWireSpec || 'Standard Shielded Harness'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Vehicle / Scanner Compatibility:</span>
                        <div className="font-semibold text-slate-800 mt-0.5">{selectedProduct.vehicleScannerCompatibility || 'All OBD-II Standard Vehicles'}</div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'pricing' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <span className="text-slate-500 font-medium">Purchase Cost:</span>
                          <div className="font-bold text-slate-900 text-sm mt-0.5">₹{selectedProduct.purchaseCost}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Selling Price:</span>
                          <div className="font-bold text-emerald-700 text-sm mt-0.5">₹{selectedProduct.sellingPrice}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">GST %:</span>
                          <div className="font-bold text-blue-600 text-sm mt-0.5">{selectedProduct.gstPercent}%</div>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">HSN Code:</span>
                          <div className="font-mono text-slate-700 mt-0.5">{selectedProduct.hsnSac || '-'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'stock' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-slate-500 font-medium">Opening Stock:</span>
                          <div className="font-bold text-slate-700 text-base mt-0.5">{selectedProduct.openingStock}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Current Stock:</span>
                          <div className="font-bold text-slate-900 text-base mt-0.5">{selectedProduct.currentStock}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Minimum Stock Level:</span>
                          <div className="font-bold text-amber-700 text-base mt-0.5">{selectedProduct.minStock} Units</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'bom' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900">Active Bill of Materials (BOM)</h4>
                      {(() => {
                        const activeBOM = boms.find((b) => b.productId === selectedProduct.id && b.status === 'Active');
                        if (!activeBOM) return <div className="text-slate-500 py-4 text-center">No active BOM defined for this product.</div>;
                        return (
                          <div className="space-y-2">
                            <div className="text-xs text-blue-600 font-mono font-semibold">BOM #: {activeBOM.bomNumber} (Version {activeBOM.version})</div>
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-700 font-semibold">
                                  <th className="py-1.5">Raw Material</th>
                                  <th className="py-1.5 text-right">Qty / Product</th>
                                  <th className="py-1.5 text-right">Wastage %</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {activeBOM.items.map((i, idx) => (
                                  <tr key={idx}>
                                    <td className="py-1.5 text-slate-900 font-medium">{i.rawMaterialName}</td>
                                    <td className="py-1.5 text-right font-bold text-slate-900">{i.quantity} {i.unit}</td>
                                    <td className="py-1.5 text-right text-slate-600 font-medium">{i.wastagePercent}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {activeTab === 'production' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900">Production History</h4>
                      {(() => {
                        const prodList = productionOrders.filter(
                          (po: any) => po.productId === selectedProduct.id || po.finishedGoodName === selectedProduct.name
                        );
                        if (prodList.length === 0) return <div className="text-slate-500 py-4 text-center">No production runs recorded for this product.</div>;
                        return (
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-700 font-semibold">
                                <th className="py-1.5">Order #</th>
                                <th className="py-1.5 text-right">Qty</th>
                                <th className="py-1.5">Date</th>
                                <th className="py-1.5 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {prodList.map((po: any) => (
                                <tr key={po.id}>
                                  <td className="py-1.5 font-mono text-blue-600 font-bold">{po.orderNumber}</td>
                                  <td className="py-1.5 text-right font-bold text-slate-900">{po.plannedQuantity || po.quantityToProduce}</td>
                                  <td className="py-1.5 text-slate-600 font-mono">{po.startDate || po.productionDate}</td>
                                  <td className="py-1.5 text-right text-emerald-700 font-bold">{po.status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900">Stock Ledger Transactions</h4>
                      {(() => {
                        const txList = fgTransactions.filter((t) => t.productId === selectedProduct.id);
                        if (txList.length === 0) return <div className="text-slate-500 py-4 text-center">No stock transactions logged yet.</div>;
                        return (
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-700 font-semibold">
                                <th className="py-1.5">Date</th>
                                <th className="py-1.5">Type</th>
                                <th className="py-1.5">Ref #</th>
                                <th className="py-1.5 text-right">In</th>
                                <th className="py-1.5 text-right">Out</th>
                                <th className="py-1.5 text-right">Balance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {txList.map((tx) => (
                                <tr key={tx.id}>
                                  <td className="py-1.5 text-slate-600 font-mono">{tx.date}</td>
                                  <td className="py-1.5 font-medium text-slate-800">{tx.transactionType}</td>
                                  <td className="py-1.5 font-mono text-blue-600 font-bold">{tx.reference}</td>
                                  <td className="py-1.5 text-right text-emerald-700 font-bold">{tx.quantityIn > 0 ? `+${tx.quantityIn}` : '-'}</td>
                                  <td className="py-1.5 text-right text-rose-700 font-bold">{tx.quantityOut > 0 ? `-${tx.quantityOut}` : '-'}</td>
                                  <td className="py-1.5 text-right text-slate-900 font-bold">{tx.newBalance}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsDetailsDrawerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Data Import Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Bulk Import Products</h3>
                    <p className="text-xs text-slate-500">Upload Excel / CSV or extracted PDF product list to import multiple records at once.</p>
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
                  <p className="text-[11px] text-slate-500 mt-0.5">Download our pre-formatted CSV sample template with required product fields.</p>
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
                          <th className="p-2">Product Name</th>
                          <th className="p-2">Category</th>
                          <th className="p-2 text-right">Price (₹)</th>
                          <th className="p-2 text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                        {parsedImportItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-blue-600 font-bold">{item.productCode}</td>
                            <td className="p-2 font-semibold text-slate-900">{item.name}</td>
                            <td className="p-2 text-slate-600">{item.category}</td>
                            <td className="p-2 text-right font-bold text-slate-900">₹{item.sellingPrice}</td>
                            <td className="p-2 text-right font-bold text-slate-900">{item.currentStock}</td>
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
                  <CheckCircle2 className="w-4 h-4" /> Import {parsedImportItems.length > 0 ? `${parsedImportItems.length} Products` : 'Data'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
