import { useState } from 'react';
import type { ActivePage, Language } from '../types';
import { 
  Plus, 
  Minus, 
  Compass, 
  Home, 
  FileText, 
  CreditCard, 
  HandCoins, 
  X,
  Search,
  FolderOpen
} from 'lucide-react';

interface FloatingNavProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onOpenAddIncome: () => void;
  onOpenAddExpense: () => void;
  language: Language;
}

export const FloatingNav = ({
  activePage,
  onNavigate,
  onOpenAddIncome,
  onOpenAddExpense,
  language,
}: FloatingNavProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      id: 'home' as ActivePage,
      labelBn: 'হোম ড্যাশবোর্ড',
      labelEn: 'Home',
      icon: Home,
      color: 'bg-slate-800 text-white hover:bg-slate-900',
    },
    {
      id: 'report' as ActivePage,
      labelBn: 'সার্চ ও রিপোর্ট',
      labelEn: 'Report',
      icon: Search,
      color: 'bg-indigo-600 text-white hover:bg-indigo-700',
    },
    {
      id: 'loans' as ActivePage,
      labelBn: 'ঋণ হিসাব (দেনা)',
      labelEn: 'Loans (Debt)',
      icon: CreditCard,
      color: 'bg-amber-600 text-white hover:bg-amber-700',
    },
    {
      id: 'lending' as ActivePage,
      labelBn: 'ধার হিসাব (পাওনা)',
      labelEn: 'Lending (Receivable)',
      icon: HandCoins,
      color: 'bg-blue-600 text-white hover:bg-blue-700',
    },
    {
      id: 'vault' as ActivePage,
      labelBn: 'রসিদ ও ভল্ট',
      labelEn: 'Receipt Vault',
      icon: FolderOpen,
      color: 'bg-purple-600 text-white hover:bg-purple-700',
    },
  ];

  return (
    <>
      {/* Backdrop when menu is expanded */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Floating Speed Dial Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2.5 print:hidden">
        {/* Expanded Navigation & Action Menu */}
        {isOpen && (
          <div className="flex flex-col items-end gap-2 mb-1 animate-in slide-in-from-bottom-5 fade-in duration-200">
            {/* Quick Action: Add Income */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAddIncome();
              }}
              className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-2xl shadow-lg font-bold text-xs transition-transform hover:scale-105"
            >
              <span>+ নতুন জমা যোগ</span>
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </button>

            {/* Quick Action: Add Expense */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAddExpense();
              }}
              className="flex items-center gap-2.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-2xl shadow-lg font-bold text-xs transition-transform hover:scale-105"
            >
              <span>- নতুন খরচ যোগ</span>
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                <Minus className="w-4 h-4 text-white" />
              </div>
            </button>

            <div className="w-full h-px bg-slate-200 my-1" />

            {/* Page Navigation Links */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate(item.id);
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl shadow-md font-semibold text-xs transition-all ${
                    isActive
                      ? `${item.color} ring-2 ring-offset-2 ring-blue-500 font-bold scale-105`
                      : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Floating Action Cluster: Quick +জমা, -খরচ & Primary FAB Toggle */}
        <div className="flex items-center gap-2">
          {!isOpen && (
            <>
              {/* Quick Income Button */}
              <button
                type="button"
                onClick={onOpenAddIncome}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-2.5 rounded-2xl shadow-lg text-xs font-bold transition-transform"
                title="নতুন জমা"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">জমা</span>
              </button>

              {/* Quick Expense Button */}
              <button
                type="button"
                onClick={onOpenAddExpense}
                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-3 py-2.5 rounded-2xl shadow-lg text-xs font-bold transition-transform"
                title="নতুন খরচ"
              >
                <Minus className="w-4 h-4" />
                <span className="hidden sm:inline">খরচ</span>
              </button>
            </>
          )}

          {/* Master Floating Navigation Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95 ${
              isOpen
                ? 'bg-slate-900 text-white rotate-90'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25'
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Compass className="w-6 h-6 animate-pulse" />}
          </button>
        </div>
      </div>
    </>
  );
};
