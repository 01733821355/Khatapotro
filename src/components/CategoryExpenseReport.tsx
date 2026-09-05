import { useMemo, useState } from 'react';
import type { Transaction, Language } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface CategoryExpenseReportProps {
  transactions: Transaction[];
  onViewAll?: () => void;
  language: Language;
}

// Colors matching the photo precisely
const CATEGORY_COLORS: Record<string, string> = {
  'বিল': '#2563EB', // Blue
  'অন্যান্য খরচ': '#10B981', // Green
  'যাতায়াত': '#DC2626', // Red
  'খাবার': '#F97316', // Orange
  'বাজার': '#9333EA', // Purple
  'Bill': '#2563EB',
  'Other Expense': '#10B981',
  'Transport': '#DC2626',
  'Food': '#F97316',
  'Groceries': '#9333EA',
};

const DEFAULT_PALETTE = ['#2563EB', '#10B981', '#DC2626', '#F97316', '#9333EA', '#0284C7', '#CA8A04'];

export const CategoryExpenseReport = ({
  transactions,
  onViewAll,
  language,
}: CategoryExpenseReportProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const t = {
    title: language === 'bn' ? 'ক্যাটাগরি অনুযায়ী খরচ (এই মাস)' : 'Expense by Category (This Month)',
    donutTitle: language === 'bn' ? 'ক্যাটাগরি ওয়াইজ খরচ' : 'Category-wise Expense',
    viewAll: language === 'bn' ? 'সব দেখুন' : 'View All',
    noExpenses: language === 'bn' ? 'এই মাসে কোনো খরচ পাওয়া যায়নি' : 'No expenses logged this month',
  };

  // Group only expenses for current month
  const categoryStats = useMemo(() => {
    const expenseTx = transactions.filter((t) => t.type === 'expense');
    const totals: Record<string, number> = {};
    let totalExpense = 0;

    expenseTx.forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
      totalExpense += tx.amount;
    });

    const entries = Object.entries(totals)
      .map(([cat, amount], idx) => {
        const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
        const color = CATEGORY_COLORS[cat] || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
        return {
          category: cat,
          amount,
          percentage,
          color,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { entries, totalExpense };
  }, [transactions]);

  // Donut chart slices calculation
  const donutSlices = useMemo(() => {
    let cumulativePercent = 0;
    return categoryStats.entries.map((slice) => {
      const startPercent = cumulativePercent;
      cumulativePercent += slice.percentage;
      return {
        ...slice,
        startPercent,
        endPercent: cumulativePercent,
      };
    });
  }, [categoryStats]);

  return (
    <section className="space-y-6 mb-6">
      {/* 1. Category Breakdown List Card matching screenshot */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-base sm:text-lg text-slate-900">
            {t.title}
          </h3>
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {t.viewAll}
          </button>
        </div>

        {categoryStats.entries.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">{t.noExpenses}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {categoryStats.entries.map((item) => (
              <div
                key={item.category}
                onMouseEnter={() => setActiveCategory(item.category)}
                onMouseLeave={() => setActiveCategory(null)}
                className={`flex items-center justify-between py-3 px-2 rounded-2xl transition-colors cursor-pointer ${
                  activeCategory === item.category ? 'bg-slate-50' : ''
                }`}
              >
                {/* Left: colored dot & category name */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-bold text-sm text-slate-900 truncate">
                    {item.category}
                  </span>
                </div>

                {/* Right: amount & percentage */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-sm text-slate-900">
                    {formatCurrency(item.amount, language)}
                  </span>
                  <span className="text-xs font-medium text-slate-400 w-12 text-right">
                    {formatNumber(Number(item.percentage.toFixed(1)), language)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Donut Chart Card matching screenshot */}
      {categoryStats.entries.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs text-center">
          <h4 className="font-bold text-base sm:text-lg text-slate-900 mb-6">
            {t.donutTitle}
          </h4>

          {/* SVG Donut Chart */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 transform">
              {donutSlices.map((slice) => {
                const sweep = (slice.percentage / 100) * 360;
                if (sweep <= 0) return null;

                const radius = 68;
                const circumference = 2 * Math.PI * radius;
                const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((slice.startPercent / 100) * circumference);

                return (
                  <circle
                    key={slice.category}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={activeCategory === slice.category ? '32' : '26'}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setActiveCategory(slice.category)}
                    onMouseLeave={() => setActiveCategory(null)}
                  />
                );
              })}
            </svg>

            {/* Inner Center Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                {activeCategory || (language === 'bn' ? 'মোট খরচ' : 'Total Expense')}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                {formatCurrency(
                  activeCategory
                    ? categoryStats.entries.find((c) => c.category === activeCategory)?.amount || 0
                    : categoryStats.totalExpense,
                  language
                )}
              </span>
            </div>
          </div>

          {/* Legend matching photo below chart */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-6 pt-5 border-t border-slate-100">
            {categoryStats.entries.map((slice) => (
              <button
                type="button"
                key={slice.category}
                onClick={() =>
                  setActiveCategory(activeCategory === slice.category ? null : slice.category)
                }
                className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-all ${
                  activeCategory === slice.category
                    ? 'text-slate-900 scale-105'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span>{slice.category}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
