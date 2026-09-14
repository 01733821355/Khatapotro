import { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowUp, 
  Coins, 
  FileCheck, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight,
  CreditCard,
  HandCoins,
  Calendar
} from 'lucide-react';
import type { Transaction, TransactionType, Language } from '../types';
import { formatCurrency } from '../utils/formatters';
import { VoiceInputButton } from './VoiceInputButton';

interface TransactionsLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  documents?: any[];
  initialFilter?: 'all' | 'income' | 'expense' | 'debt' | 'lending';
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddNewTransaction: (type: TransactionType) => void;
  onViewReceipt: (docId: string) => void;
  language: Language;
}

export const TransactionsLedgerModal = ({
  isOpen,
  onClose,
  transactions,
  initialFilter = 'all',
  onEditTransaction,
  onDeleteTransaction,
  onAddNewTransaction,
  onViewReceipt,
  language,
}: TransactionsLedgerModalProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense' | 'debt' | 'lending'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Available months extracted from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        months.add(tx.date.substring(0, 7)); // e.g. "2026-09"
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (activeTab === 'income' && tx.type !== 'income') return;
      if (activeTab === 'expense' && tx.type !== 'expense') return;
      if (tx.category) set.add(tx.category);
    });
    return Array.from(set);
  }, [transactions, activeTab]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Tab filter
      if (activeTab === 'income' && tx.type !== 'income') return false;
      if (activeTab === 'expense' && tx.type !== 'expense') return false;
      if (activeTab === 'debt' && tx.badge !== 'দেনা' && tx.category !== 'ঋণ গ্রহণ' && tx.category !== 'ঋণ পরিশোধ') return false;
      if (activeTab === 'lending' && tx.badge !== 'পাওনা' && tx.category !== 'ধার প্রদান' && tx.category !== 'ধার ফেরত') return false;

      // Month filter
      if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) return false;

      // Category filter
      if (selectedCategory && tx.category !== selectedCategory) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = tx.title.toLowerCase().includes(q);
        const matchCategory = tx.category.toLowerCase().includes(q);
        const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
        const matchPerson = tx.personName ? tx.personName.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchCategory && !matchNotes && !matchPerson) return false;
      }

      return true;
    });
  }, [transactions, activeTab, selectedMonth, selectedCategory, searchQuery]);

  // Tab totals
  const { totalIncome, totalExpense, filteredSum } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    });

    const sum = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
    return {
      totalIncome: inc,
      totalExpense: exp,
      filteredSum: sum,
    };
  }, [transactions, filteredTransactions]);

  if (!isOpen) return null;

  const t = {
    title: language === 'bn' ? 'আয় ও ব্যয়ের পূর্ণাঙ্গ লেজার' : 'Full Income & Expense Ledger',
    subtitle: language === 'bn' ? 'যেকোনো এন্ট্রি সহজেই এডিট ও ডিলিট করুন' : 'Edit or delete any transaction easily',
    allTab: language === 'bn' ? 'সব লেনদেন' : 'All',
    incomeTab: language === 'bn' ? 'মোট জমা (Income)' : 'Total Income',
    expenseTab: language === 'bn' ? 'মোট খরচ (Expense)' : 'Total Expense',
    debtTab: language === 'bn' ? 'দেনা (ঋণ)' : 'Debt',
    lendingTab: language === 'bn' ? 'পাওনা (ধার)' : 'Lending',
    searchPlaceholder: language === 'bn' ? 'বিবরণ, ক্যাটাগরি, ব্যক্তি বা নোট খুঁজুন...' : 'Search title, category, person...',
    allCategories: language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories',
    allMonths: language === 'bn' ? 'সকল মাস' : 'All Months',
    edit: language === 'bn' ? 'এডিট' : 'Edit',
    delete: language === 'bn' ? 'মুছুন' : 'Delete',
    receipt: language === 'bn' ? 'রসিদ' : 'Receipt',
    noRecords: language === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No transactions found',
    confirmDeleteTitle: language === 'bn' ? 'আপনি কি নিশ্চিত এই এন্ট্রি মুছে ফেলতে চান?' : 'Confirm Deletion',
    confirmDeleteDesc: language === 'bn' 
      ? 'এটি স্থানীয় ডিভাইস ও গুগল শিট থেকে স্থায়ীভাবে মুছে ফেলা হবে।' 
      : 'This entry will be permanently deleted and removed from Google Sheets.',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    addIncome: language === 'bn' ? '+ নতুন জমা' : '+ New Income',
    addExpense: language === 'bn' ? '- নতুন খরচ' : '- New Expense',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900">
              {t.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="px-4 py-3 bg-indigo-50/60 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-medium">মোট জমা:</span>
              <strong className="text-emerald-700 font-bold">{formatCurrency(totalIncome, language)}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-medium">মোট খরচ:</span>
              <strong className="text-rose-700 font-bold">{formatCurrency(totalExpense, language)}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-medium">অবশিষ্ট ব্যালেন্স:</span>
              <strong className={totalIncome - totalExpense >= 0 ? 'text-indigo-700 font-bold' : 'text-rose-700 font-bold'}>
                {formatCurrency(totalIncome - totalExpense, language)}
              </strong>
            </div>
          </div>

          {/* Quick Add buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAddNewTransaction('income')}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addIncome}</span>
            </button>
            <button
              type="button"
              onClick={() => onAddNewTransaction('expense')}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addExpense}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSelectedCategory(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.allTab} ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('income');
              setSelectedCategory(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>{t.incomeTab}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('expense');
              setSelectedCategory(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-800 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{t.expenseTab}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('debt');
              setSelectedCategory(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'debt'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t.debtTab}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('lending');
              setSelectedCategory(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'lending'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-800 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>{t.lendingTab}</span>
          </button>
        </div>

        {/* Filter Controls (Search + Month + Category) */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-16 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <VoiceInputButton
                  inputType="search"
                  contextLabel="লেনদেন খুঁজুন"
                  onTranscript={(val) => setSearchQuery(val)}
                  size="xs"
                />
              </div>
            </div>

            {/* Month select */}
            {availableMonths.length > 0 && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                <option value="all">{t.allMonths}</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  !selectedCategory
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.allCategories}
              </button>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Rows with explicit Edit & Delete buttons */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
              <p>{t.noRecords}</p>
              {(searchQuery || selectedCategory || selectedMonth !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                    setSelectedMonth('all');
                  }}
                  className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                >
                  ফিল্টার রিসেট করুন
                </button>
              )}
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isExpense = tx.type === 'expense';
              return (
                <div
                  key={tx.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 px-2.5 rounded-2xl transition-colors group"
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                        isExpense
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {isExpense ? (
                        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Coins className="w-5 h-5 stroke-[2]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {tx.title}
                        </h4>
                        {tx.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              tx.badge === 'জমা'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : tx.badge === 'খরচ'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : tx.badge === 'দেনা'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {tx.badge}
                          </span>
                        )}
                        {tx.receiptDocId && (
                          <button
                            type="button"
                            onClick={() => onViewReceipt(tx.receiptDocId!)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                            title={tx.receiptName || 'সংযুক্ত রসিদ দেখুন'}
                          >
                            <FileCheck className="w-3 h-3 text-indigo-600" />
                            <span>{t.receipt}</span>
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-600">{tx.category}</span>
                        <span>•</span>
                        <span>{tx.paymentMethod}</span>
                        {tx.personName && (
                          <>
                            <span>•</span>
                            <span className="text-amber-700 font-semibold">{tx.personName}</span>
                          </>
                        )}
                      </p>

                      {tx.notes && (
                        <p className="text-[11px] text-slate-500 mt-0.5 italic truncate max-w-sm">
                          {tx.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount and Edit/Delete Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-13 sm:pl-0">
                    <span
                      className={`font-extrabold text-base sm:text-lg ${
                        isExpense ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatCurrency(tx.amount, language)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => onEditTransaction(tx)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1 border border-slate-200/80"
                        title={t.edit}
                      >
                        <Pencil className="w-3.5 h-3.5 text-blue-600" />
                        <span>{t.edit}</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(tx.id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1 border border-slate-200/80"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>{t.delete}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            {filteredTransactions.length} টি লেনদেন প্রদর্শিত (মোট: {formatCurrency(filteredSum, language)})
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <h4 className="font-bold text-slate-900 text-base mb-2">
              {t.confirmDeleteTitle}
            </h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {t.confirmDeleteDesc}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTransaction(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
