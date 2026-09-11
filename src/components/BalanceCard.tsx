import { formatCurrency } from '../utils/formatters';
import type { Language, DailyExpenseLimit } from '../types';
import { Sliders, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BalanceCardProps {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  todayExpense: number;
  dailyExpenseLimit?: DailyExpenseLimit;
  onOpenDailyLimitModal?: () => void;
  userName?: string;
  language: Language;
}

export const BalanceCard = ({
  totalBalance,
  monthIncome,
  monthExpense,
  todayExpense,
  dailyExpenseLimit,
  onOpenDailyLimitModal,
  userName = 'Bappy',
  language,
}: BalanceCardProps) => {
  // Get dynamic greeting based on time of day matching the photo
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'bn') {
      if (hour >= 5 && hour < 12) return { text: `শুভ সকাল, ${userName}`, icon: '☀️' };
      if (hour >= 12 && hour < 16) return { text: `শুভ দুপুর, ${userName}`, icon: '☀️' };
      if (hour >= 16 && hour < 19) return { text: `শুভ বিকেল, ${userName}`, icon: '🌇' };
      return { text: `শুভ রাত্রি, ${userName}`, icon: '🌙' };
    }
    if (hour >= 5 && hour < 12) return { text: `Good Morning, ${userName}`, icon: '☀️' };
    if (hour >= 12 && hour < 16) return { text: `Good Afternoon, ${userName}`, icon: '☀️' };
    if (hour >= 16 && hour < 19) return { text: `Good Evening, ${userName}`, icon: '🌇' };
    return { text: `Good Night, ${userName}`, icon: '🌙' };
  };

  const greeting = getGreeting();

  const labels = {
    subtitle: language === 'bn' ? 'আপনার অর্থের হিসাব রাখুন' : 'Keep track of your finances',
    totalBalance: language === 'bn' ? 'মোট ব্যালেন্স' : 'Total Balance',
    monthIncome: language === 'bn' ? 'চলতি মাসের আয়' : 'This month income',
    monthExpense: language === 'bn' ? 'চলতি মাসের খরচ' : 'This month expense',
  };

  const isLimitActive = dailyExpenseLimit?.enabled && (dailyExpenseLimit?.amount || 0) > 0;
  const limitAmount = dailyExpenseLimit?.amount || 0;
  const isOverLimit = isLimitActive && todayExpense > limitAmount;
  const percentUsed = isLimitActive ? Math.min(100, Math.round((todayExpense / limitAmount) * 100)) : 0;

  return (
    <section className="mb-5">
      {/* Header Greeting matching screenshot */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-1.5">
            <span>{greeting.text}</span>
            <span className="text-2xl">{greeting.icon}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {labels.subtitle}
          </p>
        </div>

        {/* Daily Limit quick trigger button */}
        {onOpenDailyLimitModal && (
          <button
            type="button"
            onClick={onOpenDailyLimitModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
              isOverLimit
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : isLimitActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'দৈনিক লিমিট' : 'Daily Limit'}</span>
            {isLimitActive && (
              <span className="font-mono ml-0.5">
                ({formatCurrency(limitAmount, language)})
              </span>
            )}
          </button>
        )}
      </div>

      {/* Main Gradient Card matching screenshot with #3B50DF to #5C32E6 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3B50DF] to-[#5C32E6] text-white p-6 sm:p-7 shadow-xl shadow-indigo-600/20">
        <div className="relative z-10">
          {/* Top: Total Balance */}
          <div>
            <p className="text-xs sm:text-sm font-medium text-white/80">
              {labels.totalBalance}
            </p>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 text-white">
              {formatCurrency(totalBalance, language)}
            </h3>
          </div>

          {/* Thin separator */}
          <div className="my-5 border-t border-white/20" />

          {/* Bottom row: Month Income (left) and Month Expense (right) */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
            <div className="text-emerald-300">
              <span>{labels.monthIncome} </span>
              <span className="font-bold">{formatCurrency(monthIncome, language)}</span>
            </div>

            <div className="text-rose-200">
              <span>{labels.monthExpense} </span>
              <span className="font-bold">{formatCurrency(monthExpense, language)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Expense Tracker Bar if Limit is enabled */}
      {isLimitActive && (
        <div
          onClick={onOpenDailyLimitModal}
          className={`mt-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
            isOverLimit
              ? 'bg-rose-50/90 border-rose-200 text-rose-900 shadow-xs'
              : 'bg-white border-slate-200/80 text-slate-700 shadow-2xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <div className="flex items-center gap-1.5">
              {isOverLimit ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="font-bold">
                {language === 'bn' ? 'আজকের খরচের হিসাব:' : "Today's Expense:"}
              </span>
              <span className={isOverLimit ? 'text-rose-600 font-extrabold' : 'text-slate-900 font-bold'}>
                {formatCurrency(todayExpense, language)} / {formatCurrency(limitAmount, language)}
              </span>
            </div>

            <span className={`text-[11px] font-bold ${isOverLimit ? 'text-rose-600' : 'text-slate-500'}`}>
              {isOverLimit
                ? (language === 'bn' ? '⚠️ লিমিট অতিক্রম!' : '⚠️ Exceeded!')
                : `${percentUsed}% ${language === 'bn' ? 'ব্যবহৃত' : 'Used'}`}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverLimit
                  ? 'bg-rose-600'
                  : percentUsed >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
};

