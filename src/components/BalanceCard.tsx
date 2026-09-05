import { formatCurrency } from '../utils/formatters';
import type { Language } from '../types';

interface BalanceCardProps {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  userName?: string;
  language: Language;
}

export const BalanceCard = ({
  totalBalance,
  monthIncome,
  monthExpense,
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

  return (
    <section className="mb-5">
      {/* Header Greeting matching screenshot:
          শুভ দুপুর, Bappy ☀️
          আপনার অর্থের হিসাব রাখুন */}
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-1.5">
          <span>{greeting.text}</span>
          <span className="text-2xl">{greeting.icon}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {labels.subtitle}
        </p>
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
    </section>
  );
};
