import { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, TrendingDown, Sparkles } from 'lucide-react';
import type { DailyExpenseLimit, Language } from '../types';
import { formatCurrency } from '../utils/formatters';
import { VoiceInputButton } from './VoiceInputButton';

interface DailyExpenseLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limit: DailyExpenseLimit;
  todayExpense: number;
  onSaveLimit: (limit: DailyExpenseLimit) => void;
  language: Language;
}

export const DailyExpenseLimitModal = ({
  isOpen,
  onClose,
  limit,
  todayExpense,
  onSaveLimit,
  language,
}: DailyExpenseLimitModalProps) => {
  const [enabled, setEnabled] = useState(limit.enabled);
  const [amount, setAmount] = useState<number | ''>(limit.amount || 1500);

  useEffect(() => {
    if (isOpen) {
      setEnabled(limit.enabled);
      setAmount(limit.amount || 1500);
    }
  }, [isOpen, limit]);

  if (!isOpen) return null;

  const currentLimitVal = Number(amount) || 0;
  const isOverLimit = enabled && currentLimitVal > 0 && todayExpense > currentLimitVal;
  const remainingLimit = Math.max(0, currentLimitVal - todayExpense);
  const percentUsed = currentLimitVal > 0 ? Math.min(100, Math.round((todayExpense / currentLimitVal) * 100)) : 0;

  const handleSave = () => {
    onSaveLimit({
      enabled,
      amount: Number(amount) || 1000,
    });
    onClose();
  };

  const quickPresets = [500, 1000, 1500, 2000, 3000, 5000];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
              enabled ? (isOverLimit ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600') : 'bg-slate-100 text-slate-500'
            }`}>
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {language === 'bn' ? 'দৈনিক খরচের লিমিট (Daily Limit)' : 'Daily Expense Limit'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'bn' ? 'খরচ নিয়ন্ত্রণ ও অতিরিক্ত ব্যয়ে অ্যালার্ট পান' : 'Control budget & get instant warning alerts'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status preview banner */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {language === 'bn' ? 'আজকের মোট খরচ:' : "Today's Total Expense:"}
            </span>
            <span className={`text-sm font-extrabold ${isOverLimit ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatCurrency(todayExpense, language)}
            </span>
          </div>

          {enabled && (
            <>
              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden my-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    percentUsed >= 100
                      ? 'bg-rose-600'
                      : percentUsed >= 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-medium pt-1">
                <span className={percentUsed >= 100 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                  {percentUsed}% {language === 'bn' ? 'ব্যবহৃত' : 'Used'}
                </span>
                <span className={isOverLimit ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {isOverLimit
                    ? (language === 'bn' ? `লিমিট অতিক্রম: ${formatCurrency(todayExpense - currentLimitVal, language)} ৳` : `Over by: ${formatCurrency(todayExpense - currentLimitVal, language)}`)
                    : (language === 'bn' ? `অবশিষ্ট আছে: ${formatCurrency(remainingLimit, language)}` : `Remaining: ${formatCurrency(remainingLimit, language)}`)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Warning if over limit */}
        {isOverLimit && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in-50">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {language === 'bn' ? 'সতর্কতা! আজকের বাজেট লিমিট অতিক্রম করেছে' : 'Warning! Daily expense limit exceeded'}
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                {language === 'bn'
                  ? `আপনি দৈনিক ${formatCurrency(currentLimitVal, language)} লিমিট নির্ধারণ করেছিলেন, কিন্তু আজ খরচ হয়েছে ${formatCurrency(todayExpense, language)}।`
                  : `You set a limit of ${formatCurrency(currentLimitVal, language)}, but you spent ${formatCurrency(todayExpense, language)} today.`}
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mt-4 space-y-4">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div>
              <p className="text-xs font-bold text-slate-800">
                {language === 'bn' ? 'দৈনিক লিমিট সক্রিয় রাখুন' : 'Enable Daily Expense Limit'}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === 'bn' ? 'খরচ করার সময় নোটিফিকেশন ও ওয়ার্নিং দেখাবে' : 'Shows warnings when reaching or crossing limit'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors ${
                enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform" />
            </button>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {language === 'bn' ? 'প্রতিদিনের সর্বোচ্চ খরচের লিমিট (৳) *' : 'Maximum Daily Limit (৳) *'}
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-indigo-600 font-medium hidden sm:inline">ভয়েস ইনপুট:</span>
                <VoiceInputButton
                  inputType="currency"
                  contextLabel="দৈনিক লিমিটের পরিমাণ"
                  onTranscript={(val) => {
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed) && parsed > 0) {
                      setAmount(parsed);
                    }
                  }}
                  size="xs"
                />
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
              <input
                type="number"
                min="50"
                step="50"
                disabled={!enabled}
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="1500"
                className="w-full pl-8 pr-10 py-2.5 text-base font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-100"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <VoiceInputButton
                  inputType="currency"
                  contextLabel="দৈনিক লিমিটের টাকা"
                  onTranscript={(val) => {
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed) && parsed > 0) {
                      setAmount(parsed);
                    }
                  }}
                  size="xs"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
              {language === 'bn' ? 'দ্রুত নির্বাচন করুন:' : 'Quick Presets:'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={!enabled}
                  onClick={() => setAmount(preset)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    amount === preset
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50'
                  }`}
                >
                  {formatCurrency(preset, language)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{language === 'bn' ? 'লিমিট সেট করুন' : 'Save Limit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
