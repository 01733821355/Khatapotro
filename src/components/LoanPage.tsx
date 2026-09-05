import { useState, useMemo, type FormEvent } from 'react';
import type { Transaction, Language } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  CreditCard, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Clock, 
  ArrowDownLeft, 
  ArrowUpRight, 
  User, 
  Search,
  ChevronRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';

interface LoanPageProps {
  transactions: Transaction[];
  onAddLoan: (personName: string, amount: number, notes?: string) => void;
  onRepayLoan: (personName: string, amount: number, notes?: string) => void;
  language: Language;
}

export const LoanPage = ({
  transactions,
  onAddLoan,
  onRepayLoan,
  language,
}: LoanPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  // Modal for new loan or repayment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'take' | 'repay'>('take');
  const [targetPerson, setTargetPerson] = useState('');
  const [amountInput, setAmountInput] = useState<number | ''>('');
  const [notesInput, setNotesInput] = useState('');

  // Extract all loan and loan repayment transactions
  // 1. Loans taken:
  //    - Income where category is 'ঋণ', 'ঋণ গ্রহণ', 'দেনা' or badge is 'দেনা'
  // 2. Loans repaid:
  //    - Expense where category is 'ঋণ পরিশোধ' or 'দেনা পরিশোধ'
  const loanRecords = useMemo(() => {
    return transactions.filter((tx) => {
      const isLoanTaken =
        tx.type === 'income' &&
        (tx.category === 'ঋণ' ||
          tx.category === 'ঋণ গ্রহণ' ||
          tx.category === 'দেনা' ||
          tx.badge === 'দেনা' ||
          tx.title === 'ক্রেডিট কার্ড' ||
          tx.title === 'আব্বু');

      const isLoanRepayment =
        tx.type === 'expense' &&
        (tx.category === 'ঋণ পরিশোধ' ||
          tx.category === 'দেনা পরিশোধ' ||
          tx.title.includes('লোন জমা') ||
          tx.title.includes('কিস্তি'));

      return isLoanTaken || isLoanRepayment;
    });
  }, [transactions]);

  // Group by Person / Creditor Name
  const personSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        personName: string;
        totalTaken: number;
        totalRepaid: number;
        transactions: Transaction[];
        lastDate: string;
      }
    >();

    loanRecords.forEach((tx) => {
      // Determine person/creditor name: use personName or extract from title
      let name = tx.personName || tx.title;
      if (name.includes('দিয়ে')) {
        name = 'ক্রেডিট কার্ড';
      } else if (name.includes('বিকাশ লোন')) {
        name = 'বিকাশ লোন';
      } else if (name.includes('কিস্তি')) {
        name = 'মোবাইল কিস্তি';
      }

      if (!map.has(name)) {
        map.set(name, {
          personName: name,
          totalTaken: 0,
          totalRepaid: 0,
          transactions: [],
          lastDate: tx.date,
        });
      }

      const item = map.get(name)!;
      item.transactions.push(tx);
      if (tx.date > item.lastDate) item.lastDate = tx.date;

      if (tx.type === 'income') {
        item.totalTaken += tx.amount;
      } else {
        item.totalRepaid += tx.amount;
      }
    });

    const list = Array.from(map.values()).map((p) => ({
      ...p,
      currentBalance: Math.max(0, p.totalTaken - p.totalRepaid),
      // sort transactions latest first
      transactions: p.transactions.sort((a, b) => b.date.localeCompare(a.date)),
    }));

    // Sort by current outstanding balance descending
    return list.sort((a, b) => b.currentBalance - a.currentBalance);
  }, [loanRecords]);

  // Overall statistics
  const overallStats = useMemo(() => {
    let totalTaken = 0;
    let totalRepaid = 0;

    personSummaries.forEach((p) => {
      totalTaken += p.totalTaken;
      totalRepaid += p.totalRepaid;
    });

    return {
      totalTaken,
      totalRepaid,
      netDebt: Math.max(0, totalTaken - totalRepaid),
      creditorCount: personSummaries.length,
    };
  }, [personSummaries]);

  // Filtered person summaries
  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return personSummaries;
    const q = searchQuery.toLowerCase();
    return personSummaries.filter((p) => p.personName.toLowerCase().includes(q));
  }, [personSummaries, searchQuery]);

  // Open modal helper
  const openTakeLoanModal = (personName = '') => {
    setModalMode('take');
    setTargetPerson(personName);
    setAmountInput('');
    setNotesInput('');
    setIsModalOpen(true);
  };

  const openRepayLoanModal = (personName = '') => {
    setModalMode('repay');
    setTargetPerson(personName);
    setAmountInput('');
    setNotesInput('');
    setIsModalOpen(true);
  };

  const handleSubmitModal = (e: FormEvent) => {
    e.preventDefault();
    if (!targetPerson.trim() || !amountInput || Number(amountInput) <= 0) return;

    if (modalMode === 'take') {
      onAddLoan(targetPerson.trim(), Number(amountInput), notesInput.trim());
    } else {
      onRepayLoan(targetPerson.trim(), Number(amountInput), notesInput.trim());
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-600" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {language === 'bn' ? 'ঋণ ও দেনা ব্যবস্থাপনা' : 'Loans & Debt Ledger'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => openTakeLoanModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? '+ নতুন ঋণ নিন' : '+ Take Loan'}</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white border border-amber-200/80 rounded-2xl p-3 shadow-xs text-center">
          <p className="text-[11px] font-semibold text-slate-500 mb-0.5">মোট গৃহীত ঋণ</p>
          <p className="text-xs sm:text-base font-bold text-amber-600 truncate">
            {formatCurrency(overallStats.totalTaken, language)}
          </p>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-3 shadow-xs text-center">
          <p className="text-[11px] font-semibold text-slate-500 mb-0.5">মোট পরিশোধিত</p>
          <p className="text-xs sm:text-base font-bold text-emerald-600 truncate">
            {formatCurrency(overallStats.totalRepaid, language)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-3 shadow-xs text-center">
          <p className="text-[11px] font-semibold text-white/90 mb-0.5">বর্তমান দেনা বাকি</p>
          <p className="text-xs sm:text-base font-bold truncate">
            {formatCurrency(overallStats.netDebt, language)}
          </p>
        </div>
      </div>

      {/* Info helper */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          {language === 'bn'
            ? 'জমার ক্যাটাগরি "ঋণ" বা "দেনা" হলে এখানে যুক্ত হয়। নতুন ঋণ নিলে দেনা বাড়বে, এবং ঋণ পরিশোধ করলে দেনা কমবে।'
            : 'Income with category "Loan/Debt" is tracked here. Taking new loans increases debt; repayments reduce debt.'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={language === 'bn' ? 'ব্যক্তি বা প্রতিষ্ঠানের নাম দিয়ে খুঁজুন...' : 'Search by person name...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      {/* List of Creditors / Persons */}
      <div className="space-y-3">
        {filteredSummaries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            {language === 'bn' ? 'কোনো ঋণের হিসাব পাওয়া যায়নি' : 'No loan records found'}
          </div>
        ) : (
          filteredSummaries.map((p) => {
            const isExpanded = selectedPerson === p.personName;
            const isCleared = p.currentBalance === 0;

            return (
              <div
                key={p.personName}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs transition-all hover:border-amber-300"
              >
                {/* Person Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isCleared
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.personName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">{p.personName}</h3>
                        {isCleared ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            পরিশোধিত
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                            দেনা বাকি
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        সর্বশেষ তারিখ: {p.lastDate} • মোট লেনদেন: {p.transactions.length} টি
                      </p>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-500 font-semibold">বকেয়া ঋণ</p>
                    <p className={`text-sm sm:text-base font-black ${
                      isCleared ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {formatCurrency(p.currentBalance, language)}
                    </p>
                  </div>
                </div>

                {/* Sub Stats */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="text-slate-600">
                    মোট ঋণ নেওয়া:{' '}
                    <span className="font-bold text-amber-700">
                      {formatCurrency(p.totalTaken, language)}
                    </span>
                  </div>
                  <div className="text-slate-600 text-right">
                    পরিশোধ:{' '}
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(p.totalRepaid, language)}
                    </span>
                  </div>
                </div>

                {/* Quick Actions Row */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPerson(isExpanded ? null : p.personName)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>{isExpanded ? 'বিবরণ লুকান' : 'লেনদেনের বিবরণ দেখুন'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openTakeLoanModal(p.personName)}
                      className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors"
                      title="আরও ঋণ নিন"
                    >
                      + ঋণ বৃদ্ধি
                    </button>
                    <button
                      type="button"
                      onClick={() => openRepayLoanModal(p.personName)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      title="ঋণ পরিশোধ করুন"
                    >
                      ✓ পরিশোধ
                    </button>
                  </div>
                </div>

                {/* Detailed Timeline Table if expanded */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in-50 duration-150">
                    <p className="text-xs font-bold text-slate-700">লেনদেনের ইতিহাস:</p>
                    <div className="bg-slate-50 rounded-xl p-2.5 divide-y divide-slate-200/60 text-xs">
                      {p.transactions.map((tx) => {
                        const isRepay = tx.type === 'expense';
                        return (
                          <div key={tx.id} className="py-2 flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-800">{tx.title}</p>
                              <p className="text-[11px] text-slate-400">
                                {tx.date} • {tx.paymentMethod} {tx.notes ? `(${tx.notes})` : ''}
                              </p>
                            </div>
                            <span className={`font-bold ${isRepay ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {isRepay ? '- পরিশোধ: ' : '+ ঋণ: '}
                              {formatCurrency(tx.amount, language)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Take / Repay Loan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 pb-2 border-b border-slate-100">
              {modalMode === 'take'
                ? 'নতুন ঋণ গ্রহণ (+ দেনা বৃদ্ধি)'
                : 'ঋণ পরিশোধ (- দেনা হ্রাস)'}
            </h3>

            <form onSubmit={handleSubmitModal} className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  কার কাছ থেকে / বিবরণ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আব্বু, ক্রেডিট কার্ড, বন্ধু"
                  value={targetPerson}
                  onChange={(e) => setTargetPerson(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  টাকার পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নোট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="উদ্দেশ্য বা ফেরত দেওয়ার সময়সীমা..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs ${
                    modalMode === 'take'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {modalMode === 'take' ? 'ঋণ যুক্ত করুন' : 'পরিশোধ সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
