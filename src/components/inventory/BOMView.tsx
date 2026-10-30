'use client';

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { BOMComponent } from '../../types/erp';
import { Cpu, Plus, Save, Trash2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export const BOMView: React.FC = () => {
  const { finishedGoods, rawMaterials, updateFinishedGood } = useERP();

  const [selectedGoodId, setSelectedGoodId] = useState<string>(finishedGoods[0]?.id || '');
  const selectedGood = finishedGoods.find((g) => g.id === selectedGoodId);

  const [bomList, setBomList] = useState<BOMComponent[]>(selectedGood ? selectedGood.bom : []);

  const handleSelectGood = (id: string) => {
    setSelectedGoodId(id);
    const g = finishedGoods.find((good) => good.id === id);
    if (g) setBomList(g.bom);
  };

  const handleAddComponent = () => {
    const availableRaw = rawMaterials.find((r) => !bomList.some((b) => b.rawMaterialId === r.id));
    if (!availableRaw) {
      alert('All raw materials are already added to this BOM recipe!');
      return;
    }
    setBomList([...bomList, { rawMaterialId: availableRaw.id, quantityRequired: 1 }]);
  };

  const handleUpdateComponent = (index: number, rawMaterialId: string, quantityRequired: number) => {
    const updated = [...bomList];
    updated[index] = { rawMaterialId, quantityRequired };
    setBomList(updated);
  };

  const handleRemoveComponent = (index: number) => {
    setBomList(bomList.filter((_, i) => i !== index));
  };

  const handleSaveBOM = () => {
    if (!selectedGood) return;

    // Recalculate estimated mfg cost from BOM items
    let calculatedMfgCost = 0;
    bomList.forEach((b) => {
      const rm = rawMaterials.find((r) => r.id === b.rawMaterialId);
      if (rm) {
        calculatedMfgCost += rm.unitCost * b.quantityRequired;
      }
    });

    updateFinishedGood(selectedGood.id, {
      bom: bomList,
      manufacturingCost: Math.round(calculatedMfgCost),
    });

    alert(`BOM Recipe saved for ${selectedGood.name}! Updated Mfg Cost: ₹${Math.round(calculatedMfgCost)}`);
  };

  // Calculate live assembly material cost sum
  const totalBOMCost = bomList.reduce((acc, b) => {
    const rm = rawMaterials.find((r) => r.id === b.rawMaterialId);
    return acc + (rm ? rm.unitCost * b.quantityRequired : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 erp-card p-5 bg-white border border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" /> Bill of Materials (BOM) Recipe Designer
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Define raw material recipes and assembly proportions per unit of finished OBD product.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selector Panel */}
        <div className="erp-card p-4 space-y-3 bg-white border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Finished Good Product
          </h3>
          <div className="space-y-2">
            {finishedGoods.map((good) => (
              <div
                key={good.id}
                onClick={() => handleSelectGood(good.id)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                  selectedGoodId === good.id
                    ? 'bg-blue-50 border-blue-300 text-blue-950 font-semibold shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">{good.name}</div>
                  <div className="text-[10px] text-blue-700 font-mono font-semibold">{good.sku}</div>
                </div>
                <ArrowRight className="w-4 h-4 opacity-60" />
              </div>
            ))}
          </div>
        </div>

        {/* BOM Recipe Editor Panel */}
        {selectedGood && (
          <div className="lg:col-span-2 erp-card p-5 flex flex-col justify-between space-y-4 bg-white border border-slate-200 shadow-sm">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-2">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                    {selectedGood.sku}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1">{selectedGood.name}</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-600 block font-medium">Calculated Recipe Cost</span>
                  <span className="text-lg font-extrabold text-emerald-700">₹{totalBOMCost.toLocaleString('en-IN')} / unit</span>
                </div>
              </div>

              {/* Recipe Components List */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">Raw Material Components</h3>
                  <button
                    onClick={handleAddComponent}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" /> Add Ingredient
                  </button>
                </div>

                {bomList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                    No BOM components added yet. Click "+ Add Ingredient" to specify recipe.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bomList.map((item, idx) => {
                      const raw = rawMaterials.find((r) => r.id === item.rawMaterialId);
                      const lineCost = raw ? raw.unitCost * item.quantityRequired : 0;

                      return (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                          {/* Raw Material Select */}
                          <div className="flex-1">
                            <select
                              value={item.rawMaterialId}
                              onChange={(e) => handleUpdateComponent(idx, e.target.value, item.quantityRequired)}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                            >
                              {rawMaterials.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name} ({r.sku}) - ₹{r.unitCost}/{r.unit}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity Required */}
                          <div className="w-28 flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={item.quantityRequired}
                              onChange={(e) => handleUpdateComponent(idx, item.rawMaterialId, Number(e.target.value))}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 text-center font-bold focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-600 font-mono font-semibold">{raw?.unit}</span>
                          </div>

                          {/* Line Item Cost */}
                          <div className="w-24 text-right font-mono font-bold text-emerald-700">
                            ₹{lineCost.toFixed(2)}
                          </div>

                          {/* Delete Item */}
                          <button
                            onClick={() => handleRemoveComponent(idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-slate-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Save BOM Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-600 font-medium">
                Selling Price: <strong className="text-slate-900 font-bold">₹{selectedGood.sellingPrice}</strong> | Profit Margin: <strong className="text-emerald-700 font-bold">₹{selectedGood.sellingPrice - totalBOMCost}</strong>
              </div>
              <button
                onClick={handleSaveBOM}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/10 transition"
              >
                <Save className="w-4 h-4 text-white" /> Save BOM Recipe & Recalculate Costs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
