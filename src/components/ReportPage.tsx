import { useState, useMemo } from 'react';
import type { Transaction, Language } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Filter, 
  CheckCircle2, 
  ExternalLink, 
  Printer, 
  ChevronDown,
  Pencil,
  Trash2
} from 'lucide-react';

interface ReportPageProps {
  transactions: Transaction[];
  userName?: string;
  language: Language;
  onViewReceipt?: (docId?: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const ReportPage = ({
  transactions,
  userName = 'Bappy',
  language,
  onViewReceipt,
  onEditTransaction,
  onDeleteTransaction,
}: ReportPageProps) => {
  // Filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('সব');
  const [selectedCategory, setSelectedCategory] = useState<string>('সব');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Extract all available categories from transactions
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.category) cats.add(tx.category);
    });
    return ['সব', 'বেতন', 'ব্যবসা', 'অন্যান্য জমা', 'খাবার', 'বিল', 'যাতায়াত', 'বাজার', 'অন্যান্য খরচ', ...Array.from(cats)].filter((v, i, a) => a.indexOf(v) === i);
  }, [transactions]);

  const typeOptions = ['সব', 'জমা', 'খরচ', 'দেনা', 'পাওনা'];

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Date filter
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      // Type filter
      if (selectedType !== 'সব') {
        const badge = tx.badge || (tx.type === 'income' ? 'জমা' : 'খরচ');
        if (selectedType === 'জমা' && tx.type !== 'income') return false;
        if (selectedType === 'খরচ' && tx.type !== 'expense') return false;
        if (selectedType === 'দেনা' && badge !== 'দেনা') return false;
        if (selectedType === 'পাওনা' && badge !== 'পাওনা') return false;
      }

      // Category filter
      if (selectedCategory !== 'সব') {
        if (tx.category !== selectedCategory) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = tx.title.toLowerCase().includes(q);
        const matchCat = tx.category.toLowerCase().includes(q);
        const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchCat && !matchNotes) return false;
      }

      return true;
    });
  }, [transactions, startDate, endDate, selectedType, selectedCategory, searchQuery]);

  // Totals calculations
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    });

    const balance = income - expense;

    return {
      income,
      expense,
      balance,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Current timestamp formatted for report footer
  const generatedTimestamp = useMemo(() => {
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const timeStr = now.toLocaleTimeString('en-US', { hour12: true });
    return `${dateStr}, ${timeStr}`;
  }, []);

  // Export to Excel / CSV with UTF-8 BOM so Bengali text renders perfectly in Excel
  const handleExportExcel = () => {
    const headers = ['তারিখ', 'বিবরণ', 'ক্যাটাগরি', 'ধরণ', 'জমা (৳)', 'খরচ (৳)', 'পেমেন্ট মাধ্যম', 'নোট'];
    const rows = filteredTransactions.map((tx) => {
      const badge = tx.badge || (tx.type === 'income' ? 'জমা' : 'খরচ');
      const incomeVal = tx.type === 'income' ? tx.amount : '';
      const expenseVal = tx.type === 'expense' ? tx.amount : '';
      return [
        tx.date,
        `"${tx.title.replace(/"/g, '""')}"`,
        `"${tx.category.replace(/"/g, '""')}"`,
        badge,
        incomeVal,
        expenseVal,
        tx.paymentMethod,
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    // Add summary row
    rows.push('');
    rows.push(['মোট', '', '', '', totals.income, totals.expense, '', `অবশিষ্ট: ${totals.balance}`].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khatapotro_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // PDF Print Trigger
  const handlePrintPDF = () => {
    window.print();
  };

  // Get Badge color and text
  const getBadgeStyle = (tx: Transaction) => {
    const badge = tx.badge || (tx.type === 'income' ? 'জমা' : 'খরচ');
    switch (badge) {
      case 'দেনা':
        return 'bg-amber-100 text-amber-700 border border-amber-300';
      case 'পাওনা':
        return 'bg-sky-100 text-sky-700 border border-sky-300';
      case 'জমা':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-300';
      case 'খরচ':
      default:
        return 'bg-rose-100 text-rose-600 border border-rose-300';
    }
  };

  return (
    <div className="space-y-4 pb-20 print:p-0 print:space-y-2">
      {/* Title Header matching user screenshot */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-700" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {language === 'bn' ? 'সার্চ ও রিপোর্ট' : 'Search & Reports'}
          </h2>
        </div>
      </div>

      {/* Main Report Card matching screenshot */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Header of Report Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              {userName} এর প্রতিবেদন
            </h1>
            <p className="text-xs text-slate-500 font-medium">সকল লেনদেন</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 font-medium mt-1 sm:mt-0">
            <span>তারিখ: {startDate || 'সব'} থেকে {endDate || 'সব'}</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
              মোট লেনদেন: {totals.count} টি
            </span>
          </div>
        </div>

        {/* 3 Metric Summary Boxes strictly matching user photo */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 my-4">
          {/* মোট জমা */}
          <div className="bg-[#EFF6FF] border border-blue-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mb-0.5">মোট জমা</p>
            <p className="text-xs sm:text-base font-bold text-emerald-600 truncate">
              {formatCurrency(totals.income, language)}
            </p>
          </div>

          {/* মোট খরচ */}
          <div className="bg-[#FEF2F2] border border-rose-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mb-0.5">মোট খরচ</p>
            <p className="text-xs sm:text-base font-bold text-rose-600 truncate">
              {formatCurrency(totals.expense, language)}
            </p>
          </div>

          {/* অবশিষ্ট */}
          <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mb-0.5">অবশিষ্ট</p>
            <p className="text-xs sm:text-base font-bold text-slate-800 truncate">
              {formatCurrency(totals.balance, language)}
            </p>
          </div>
        </div>

        {/* Filters Section matching photo */}
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 sm:p-4 mb-5 print:hidden space-y-3">
          {/* Start and End Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                শুরু তারিখ
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                শেষ তারিখ
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Type & Category selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ধরণ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ধরণ
              </label>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-28 overflow-y-auto">
                {typeOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setSelectedType(opt)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedType === opt
                        ? 'bg-slate-200 text-slate-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* ক্যাটাগরি */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ক্যাটাগরি
              </label>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-28 overflow-y-auto">
                {availableCategories.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-slate-200 text-slate-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <div>
            <input
              type="text"
              placeholder="বিবরণ বা নোট দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Action Export Buttons strictly matching screenshot (Excel & PDF buttons) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDF}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Detailed Table exactly matching user's photo */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3 whitespace-nowrap">তারিখ</th>
                <th className="py-2.5 px-3 min-w-[120px]">বিবরণ</th>
                <th className="py-2.5 px-3 whitespace-nowrap">ক্যাটাগরি</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">ধরণ</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">জমা</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">খরচ</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">প্রমাণ</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    কোনো লেনদেন পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const badge = tx.badge || (tx.type === 'income' ? 'জমা' : 'খরচ');
                  const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* তারিখ */}
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-medium">
                        {tx.date}
                      </td>

                      {/* বিবরণ */}
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <div>
                          <span>{tx.title}</span>
                          {tx.notes && (
                            <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[140px]">
                              {tx.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ক্যাটাগরি */}
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {tx.category}
                      </td>

                      {/* ধরণ */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${getBadgeStyle(tx)}`}>
                          {badge}
                        </span>
                      </td>

                      {/* জমা */}
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {isIncome ? formatCurrency(tx.amount, language) : '-'}
                      </td>

                      {/* খরচ */}
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600 whitespace-nowrap">
                        {!isIncome ? formatCurrency(tx.amount, language) : '-'}
                      </td>

                      {/* প্রমাণ */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap text-slate-400">
                        {tx.receiptDocId ? (
                          <button
                            type="button"
                            onClick={() => onViewReceipt?.(tx.receiptDocId)}
                            className="text-blue-600 hover:text-blue-800 underline font-semibold text-[11px]"
                          >
                            দেখুন
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* অ্যাকশন (Edit & Delete) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {onEditTransaction && (
                            <button
                              type="button"
                              onClick={() => onEditTransaction(tx)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="এডিট করুন"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteTransaction && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(tx.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Popup */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
              <h4 className="font-bold text-slate-900 text-base mb-2">
                আপনি কি নিশ্চিত এই এন্ট্রি মুছে ফেলতে চান?
              </h4>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                এই লেনদেনটি মুছে ফেললে তা গুগল শিট ও হিসাব থেকে স্থায়ীভাবে সরানো হবে।
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirmId && onDeleteTransaction) {
                      onDeleteTransaction(deleteConfirmId);
                    }
                    setDeleteConfirmId(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
                >
                  মুছুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info strictly matching user photo */}
        <div className="mt-4 pt-3 border-t border-slate-200 text-right space-y-1">
          <p className="text-xs sm:text-sm font-bold text-slate-900">
            মোট: জমা {formatCurrency(totals.income, language)} | খরচ {formatCurrency(totals.expense, language)}
          </p>
          <p className="text-[11px] text-slate-400">
            রিপোর্ট তৈরির সময়: {generatedTimestamp}
          </p>
        </div>
      </div>
    </div>
  );
};
