import React, { useState, useRef, useEffect } from 'react';
import { CalculationItem } from './types';

interface Props {
  lang: 'bn' | 'en';
  mode?: 'light' | 'dark';
}

export const LiftingCalculator: React.FC<Props> = ({ lang, mode }) => {
  const [salesOrders, setSalesOrders] = useState<CalculationItem[]>([]);
  const [cancelOrders, setCancelOrders] = useState<CalculationItem[]>([]);
  const lastSalesInputRef = useRef<HTMLInputElement>(null);
  const lastCancelInputRef = useRef<HTMLInputElement>(null);

  const isDark = mode === 'dark';

  const addSalesOrder = () => {
    const newItem = { id: Math.random().toString(36).substring(2, 11), value: 0 };
    setSalesOrders(prev => [...prev, newItem]);
  };

  const addCancelOrder = () => {
    const newItem = { id: Math.random().toString(36).substring(2, 11), value: 0 };
    setCancelOrders(prev => [...prev, newItem]);
  };

  useEffect(() => {
    if (salesOrders.length > 0) {
      setTimeout(() => lastSalesInputRef.current?.focus(), 50);
    }
  }, [salesOrders.length]);

  useEffect(() => {
    if (cancelOrders.length > 0) {
      setTimeout(() => lastCancelInputRef.current?.focus(), 50);
    }
  }, [cancelOrders.length]);

  const updateItem = (type: 'sales' | 'cancel', id: string, value: string) => {
    const num = parseFloat(value) || 0;
    if (type === 'sales') {
      setSalesOrders(prev => prev.map(it => it.id === id ? { ...it, value: num } : it));
    } else {
      setCancelOrders(prev => prev.map(it => it.id === id ? { ...it, value: num } : it));
    }
  };

  const removeItem = (type: 'sales' | 'cancel', id: string) => {
    if (type === 'sales') {
      setSalesOrders(prev => prev.filter(it => it.id !== id));
    } else {
      setCancelOrders(prev => prev.filter(it => it.id !== id));
    }
  };

  const totalSales = salesOrders.reduce((acc, curr) => acc + curr.value, 0);
  const totalCancel = cancelOrders.reduce((acc, curr) => acc + curr.value, 0);
  const finalTotal = totalSales - totalCancel;

  const refresh = () => {
    setSalesOrders([]);
    setCancelOrders([]);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className={`rounded-3xl p-6 sm:p-8 shadow-xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200/80 backdrop-blur-md'}`}>
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600">
          {lang === 'bn' ? 'লিফটিং ক্যালকুলেশন' : 'Lifting Calculation'}
        </h2>

        {/* Sales Orders */}
        <div className="mb-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'সেলস অর্ডার' : 'Sales Orders'}
            </h3>
            <span className="text-sm font-bold text-emerald-600">+{totalSales}</span>
          </div>
          <div className="space-y-3">
            {salesOrders.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3">
                <input
                  ref={idx === salesOrders.length - 1 ? lastSalesInputRef : null}
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  className={`flex-1 rounded-2xl p-3.5 sm:p-4 focus:ring-2 focus:ring-emerald-400 text-base sm:text-lg border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  value={item.value === 0 ? '' : item.value}
                  onChange={(e) => updateItem('sales', item.id, e.target.value)}
                />
                <button 
                  onClick={() => removeItem('sales', item.id)}
                  className="bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 w-12 h-12 rounded-2xl flex items-center justify-center transition shrink-0"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={addSalesOrder}
            className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold shadow-md hover:bg-emerald-700 transition flex items-center justify-center gap-2"
          >
            <i className="fas fa-plus-circle"></i> {lang === 'bn' ? 'সেলস যোগ করুন' : 'Add Sales'}
          </button>
        </div>

        {/* Cancel Orders */}
        <div className="mb-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'ক্যান্সেল অর্ডার' : 'Cancel Orders'}
            </h3>
            <span className="text-sm font-bold text-rose-500">-{totalCancel}</span>
          </div>
          <div className="space-y-3">
            {cancelOrders.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3">
                <input
                  ref={idx === cancelOrders.length - 1 ? lastCancelInputRef : null}
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  className={`flex-1 rounded-2xl p-3.5 sm:p-4 focus:ring-2 focus:ring-rose-400 text-base sm:text-lg border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  value={item.value === 0 ? '' : item.value}
                  onChange={(e) => updateItem('cancel', item.id, e.target.value)}
                />
                <button 
                  onClick={() => removeItem('cancel', item.id)}
                  className="bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 w-12 h-12 rounded-2xl flex items-center justify-center transition shrink-0"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={addCancelOrder}
            className="w-full py-3.5 bg-rose-500 text-white rounded-2xl font-bold shadow-md hover:bg-rose-600 transition flex items-center justify-center gap-2"
          >
            <i className="fas fa-minus-circle"></i> {lang === 'bn' ? 'ক্যান্সেল যোগ করুন' : 'Add Cancel'}
          </button>
        </div>

        {/* Result */}
        <div className="text-center py-6 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">{lang === 'bn' ? 'নিট লিফটিং' : 'Net Lifting'}</div>
          <div className={`text-5xl sm:text-6xl font-black transition-colors ${finalTotal < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {finalTotal.toLocaleString()}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={refresh}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-purple-700 shadow-md transition text-xs"
          >
            <i className="fas fa-sync"></i> {lang === 'bn' ? 'সব মুছুন' : 'Reset'}
          </button>
          <div className="text-[10px] font-semibold opacity-40">All rights reserved to Md Bappy Hossain</div>
        </div>
      </div>
    </div>
  );
};

export default LiftingCalculator;
