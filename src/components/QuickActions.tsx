import { 
  Plus, 
  Minus, 
  BarChart2, 
  Tag, 
  Settings 
} from 'lucide-react';
import type { Language } from '../types';

interface QuickActionsProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onOpenReports: () => void;
  onOpenCategories: () => void;
  onOpenSettings: () => void;
  language: Language;
}

export const QuickActions = ({
  onAddIncome,
  onAddExpense,
  onOpenReports,
  onOpenCategories,
  onOpenSettings,
  language,
}: QuickActionsProps) => {
  const t = {
    income: language === 'bn' ? 'জমা' : 'Income',
    expense: language === 'bn' ? 'খরচ' : 'Expense',
    reports: language === 'bn' ? 'রিপোর্ট' : 'Reports',
    categories: language === 'bn' ? 'ক্যাটাগরি' : 'Category',
    settings: language === 'bn' ? 'সেটিংস' : 'Settings',
  };

  return (
    <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-6">
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {/* 1. জমা (+) */}
        <button
          type="button"
          onClick={onAddIncome}
          className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all group active:scale-95"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-xs">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700">{t.income}</span>
        </button>

        {/* 2. খরচ (-) */}
        <button
          type="button"
          onClick={onAddExpense}
          className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all group active:scale-95"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-rose-100/80 text-rose-500 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-xs">
            <Minus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700">{t.expense}</span>
        </button>

        {/* 3. রিপোর্ট (BarChart) */}
        <button
          type="button"
          onClick={onOpenReports}
          className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all group active:scale-95"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-purple-100/80 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-xs">
            <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700">{t.reports}</span>
        </button>

        {/* 4. ক্যাটাগরি (Tag) */}
        <button
          type="button"
          onClick={onOpenCategories}
          className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all group active:scale-95"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-amber-100/80 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-xs">
            <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700">{t.categories}</span>
        </button>

        {/* 5. সেটিংস (Settings & Cloud Sync) */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all group active:scale-95"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-xs">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700">{t.settings}</span>
        </button>
      </div>
    </section>
  );
};
