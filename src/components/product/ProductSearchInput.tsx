'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ProductMaster } from '@/types/erp';
import { Search, X } from 'lucide-react';

interface ProductSearchInputProps {
  products: ProductMaster[];
  value: string;
  onChange: (productId: string) => void;
  placeholder?: string;
}

export function ProductSearchInput({
  products,
  value,
  onChange,
  placeholder = 'Search product by name, code, or SKU...',
}: ProductSearchInputProps) {
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === value) || null,
    [products, value]
  );

  const [query, setQuery] = useState(selectedProduct ? selectedProduct.name : '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProduct) {
      setQuery(selectedProduct.name);
    } else if (!value) {
      setQuery('');
    }
  }, [selectedProduct, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.productCode?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [products, query]);

  const handleSelect = (prod: ProductMaster) => {
    setQuery(prod.name);
    setIsOpen(false);
    onChange(prod.id);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (value) onChange('');
          }}
          placeholder={placeholder}
          className="w-full pl-8 pr-7 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100">
          {filteredProducts.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500">No matching products found.</div>
          ) : (
            filteredProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-900 truncate">{p.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {p.productCode || p.sku}
                  </div>
                </div>
                <span className="text-[11px] font-medium text-slate-600 shrink-0">
                  Stock: {p.currentStock}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
