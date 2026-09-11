import { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  FileCheck, 
  Trash2, 
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  Coins,
  Pencil
} from 'lucide-react';
import type { Transaction, Language } from '../types';
import { formatCurrency } from '../utils/formatters';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onViewReceipt?: (docId: string) => void;
  onViewAll?: () => void;
  language: Language;
}

export const RecentTransactions = ({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  onViewReceipt,
  onViewAll,
  language,
}: RecentTransactionsProps) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const t = {
    title: language === 'bn' ? 'সর্বশেষ লেনদেন' : 'Recent Transactions',
    viewAll: language === 'bn' ? 'সব দেখুন ও এডিট' : 'View All & Edit',
    confirmDelete: language === 'bn' ? 'আপনি কি নিশ্চিত এই এন্ট্রি মুছে ফেলতে চান?' : 'Are you sure you want to delete this entry?',
    delete: language === 'bn' ? 'মুছুন' : 'Delete',
    edit: language === 'bn' ? 'এডিট' : 'Edit',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    receipt: language === 'bn' ? 'রসিদ' : 'Receipt',
    empty: language === 'bn' ? 'কোন লেনদেন পাওয়া যায়নি' : 'No transactions recorded yet',
  };

  return (
    <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs mb-6">
      {/* Header matching screenshot */}
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

      {/* List items matching screenshot */}
      <div className="divide-y divide-slate-100">
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">
            {t.empty}
          </div>
        ) : (
          transactions.map((tx) => {
            const isExpense = tx.type === 'expense';
            return (
              <div
                key={tx.id}
                className="py-3 sm:py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/80 px-2 rounded-2xl transition-colors"
              >
                {/* Left: Icon & Title & Subtitle */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isExpense
                        ? 'bg-rose-100/70 text-rose-500'
                        : 'bg-amber-100/70 text-amber-600'
                    }`}
                  >
                    {isExpense ? (
                      <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Coins className="w-5 h-5 stroke-[2]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm sm:text-base text-slate-900 truncate">
                        {tx.title}
                      </p>
                      {tx.receiptDocId && (
                        <button
                          type="button"
                          onClick={() => onViewReceipt && onViewReceipt(tx.receiptDocId!)}
                          className="text-[10px] inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                          title="Attached Voucher / Receipt"
                        >
                          <FileCheck className="w-3 h-3 text-blue-600" />
                          <span>{t.receipt}</span>
                        </button>
                      )}
                    </div>
                    {/* Subtitle: e.g. "2026-09-05 | অন্যান্য খরচ" matching photo */}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {tx.date} | {tx.category}
                    </p>
                  </div>
                </div>

                {/* Right: Amount and Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <span
                    className={`font-bold text-sm sm:text-base ${
                      isExpense ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {isExpense ? '-' : '+'}
                    {formatCurrency(tx.amount, language)}
                  </span>

                  {/* Edit Button */}
                  {onEditTransaction && (
                    <button
                      type="button"
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                      title={t.edit}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(tx.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                    title={t.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Dialog before deleting transaction */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <h4 className="font-bold text-slate-900 text-base mb-2">
              {t.confirmDelete}
            </h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {language === 'bn'
                ? 'এই লেনদেন মুছে ফেললে গুগল শিট থেকেও সরানো হবে।'
                : 'Deleting this entry will remove it and update your Google Sheet.'}
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
    </section>
  );
};
