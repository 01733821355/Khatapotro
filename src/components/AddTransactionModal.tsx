import { useState, useEffect, type FormEvent } from 'react';
import { PlusCircle, MinusCircle, X, Paperclip, User, AlertTriangle } from 'lucide-react';
import type { Transaction, TransactionType, PaymentMethod, CloudDocument, Language, TransactionBadge, DailyExpenseLimit } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType: TransactionType;
  documents: CloudDocument[];
  onAddTransaction: (
    tx: Omit<Transaction, 'id' | 'syncedToSheets'>,
    newFileToUpload?: { file: File; title: string; category: any }
  ) => Promise<void>;
  language: Language;
  dailyExpenseLimit?: DailyExpenseLimit;
  todayExpense?: number;
}

const EXPENSE_CATEGORIES = ['খাবার', 'বিল', 'যাতায়াত', 'বাজার', 'অন্যান্য খরচ', 'ধার প্রদান', 'ঋণ পরিশোধ', 'দোকান ভাড়া', 'বেতন'];
const INCOME_CATEGORIES = ['বেতন', 'অন্যান্য জমা', 'ঋণ গ্রহণ', 'ধার ফেরত', 'ব্যবসা', 'পণ্য বিক্রয়', 'ক্রেডিট কার্ড ক্যাশব্যাক'];
const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'Credit Card', 'Other'];

export const AddTransactionModal = ({
  isOpen,
  onClose,
  defaultType,
  documents,
  onAddTransaction,
  language,
  dailyExpenseLimit,
  todayExpense = 0,
}: AddTransactionModalProps) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [title, setTitle] = useState('');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState(defaultType === 'income' ? 'বেতন' : 'অন্যান্য খরচ');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever modal is opened or defaultType changes
  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setCategory(defaultType === 'income' ? 'অন্যান্য জমা' : 'অন্যান্য খরচ');
      setTitle('');
      setPersonName('');
      setAmount('');
      setNotes('');
      setSelectedDocId('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, defaultType]);

  if (!isOpen) return null;

  const isLoanOrDharCategory = 
    category === 'ঋণ গ্রহণ' || 
    category === 'ঋণ' || 
    category === 'ধার প্রদান' || 
    category === 'ধার ফেরত' || 
    category === 'ঋণ পরিশোধ';

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      const selectedDoc = documents.find((d) => d.id === selectedDocId);

      // Determine badge
      let badge: TransactionBadge = type === 'income' ? 'জমা' : 'খরচ';
      if (category === 'ঋণ গ্রহণ' || category === 'ঋণ' || title.includes('ক্রেডিট কার্ড') || title.includes('আব্বু') && type === 'income') {
        badge = 'দেনা';
      } else if (category === 'ধার প্রদান' || category === 'ধার') {
        badge = 'পাওনা';
      }

      await onAddTransaction({
        title: title.trim(),
        amount: Number(amount),
        type,
        category,
        date,
        paymentMethod,
        badge,
        personName: personName.trim() || title.trim(),
        notes: notes.trim() || undefined,
        receiptDocId: selectedDocId || undefined,
        receiptName: selectedDoc?.title || undefined,
      });

      onClose();
    } catch (err) {
      console.error('Failed to add transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };


  const t = {
    addIncome: language === 'bn' ? 'নতুন জমা (Income) যোগ করুন' : 'Record New Income',
    addExpense: language === 'bn' ? 'নতুন খরচ (Expense) যোগ করুন' : 'Record New Expense',
    titleLabel: language === 'bn' ? 'বিবরণ / নাম *' : 'Description / Title *',
    titlePlaceholder: language === 'bn' ? 'যেমন: আম্মু, খাবার, বিদ্যুৎ বিল' : 'e.g. Lunch, Electric Bill, Counter Sale',
    amountLabel: language === 'bn' ? 'টাকার পরিমাণ (৳) *' : 'Amount (৳) *',
    categoryLabel: language === 'bn' ? 'ক্যাটাগরি' : 'Category',
    dateLabel: language === 'bn' ? 'তারিখ' : 'Date',
    paymentLabel: language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method',
    notesLabel: language === 'bn' ? 'নোট (ঐচ্ছিক)' : 'Notes (Optional)',
    attachDocLabel: language === 'bn' ? 'ক্লাউড ডকুমেন্ট / রসিদ সংযুক্ত করুন' : 'Attach Cloud Document / Voucher',
    noDocSelect: language === 'bn' ? '-- কোনো রসিদ সংযুক্ত নয় --' : '-- No document attached --',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    save: language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Entry',
    saving: language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {type === 'income' ? (
              <PlusCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <MinusCircle className="w-5 h-5 text-rose-600" />
            )}
            <h3 className="font-bold text-base sm:text-lg text-slate-900">
              {type === 'income' ? t.addIncome : t.addExpense}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategory('অন্যান্য খরচ');
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            - খরচ (Expense)
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategory('অন্যান্য জমা');
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + জমা (Income)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.titleLabel}
            </label>
            <input
              type="text"
              required
              placeholder={t.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {t.amountLabel}
              </label>
              {type === 'expense' && dailyExpenseLimit?.enabled && (
                <span className="text-[11px] text-slate-500 font-medium">
                  {language === 'bn' ? 'দৈনিক লিমিট:' : 'Daily Limit:'}{' '}
                  <strong className="text-slate-700 font-mono">
                    {formatCurrency(dailyExpenseLimit.amount, language)}
                  </strong>
                </span>
              )}
            </div>
            <input
              type="number"
              required
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />

            {/* Proactive warning if adding this expense exceeds daily limit */}
            {type === 'expense' &&
              dailyExpenseLimit?.enabled &&
              Number(amount) > 0 &&
              todayExpense + Number(amount) > dailyExpenseLimit.amount && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800 animate-in fade-in-50">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">
                      {language === 'bn'
                        ? 'সতর্কতা: এটি যোগ করলে দৈনিক লিমিট অতিক্রম করবে!'
                        : 'Alert: Exceeds daily budget limit!'}
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      {language === 'bn'
                        ? `আজকের খরচ দাঁড়াবে ${formatCurrency(todayExpense + Number(amount), language)}, যা আপনার দৈনিক লিমিট (${formatCurrency(dailyExpenseLimit.amount, language)}) থেকে ${formatCurrency(todayExpense + Number(amount) - dailyExpenseLimit.amount, language)} বেশি।`
                        : `Total today will be ${formatCurrency(todayExpense + Number(amount), language)}, which exceeds your limit by ${formatCurrency(todayExpense + Number(amount) - dailyExpenseLimit.amount, language)}.`}
                    </p>
                  </div>
                </div>
              )}
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.categoryLabel}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.dateLabel}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* If Loan or Dhar category, ask for Person/Creditor name */}
          {isLoanOrDharCategory && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 animate-in fade-in-50">
              <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span>ব্যক্তি / ঋণদাতার নাম (লেজার ট্র্যাকিং এর জন্য)</span>
              </label>
              <input
                type="text"
                placeholder="যেমন: আব্বু, ক্রেডিট কার্ড, কামাল"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.paymentLabel}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  type="button"
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    paymentMethod === pm
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Link Document */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.attachDocLabel}</span>
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">{t.noDocSelect}</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  [{doc.docCategory}] {doc.title} ({doc.fileName})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.notesLabel}
            </label>
            <input
              type="text"
              placeholder="অতিরিক্ত কোনো তথ্য..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || !title}
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 ${
                type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? t.saving : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
