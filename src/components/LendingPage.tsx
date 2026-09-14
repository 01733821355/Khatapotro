import { useState, useMemo, type FormEvent } from 'react';
import type { Transaction, Language } from '../types';
import { formatCurrency } from '../utils/formatters';
import { VoiceInputButton } from './VoiceInputButton';
import { 
  HandCoins, 
  Plus, 
  CheckCircle2, 
  UserCheck, 
  Search, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface LendingPageProps {
  transactions: Transaction[];
  onAddLending: (personName: string, amount: number, notes?: string) => void;
  onReceiveLendingReturn: (personName: string, amount: number, notes?: string) => void;
  language: Language;
}

export const LendingPage = ({
  transactions,
  onAddLending,
  onReceiveLendingReturn,
  language,
}: LendingPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  // Modal for new lending or receiving money back
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'lend' | 'receive'>('lend');
  const [targetPerson, setTargetPerson] = useState('');
  const [amountInput, setAmountInput] = useState<number | ''>('');
  const [notesInput, setNotesInput] = useState('');

  // Extract all lending records
  // 1. Money lent out:
  //    - Expense where category is 'ধার প্রদান', 'ধার', 'পাওনা', or badge is 'পাওনা'
  // 2. Lent money returned:
  //    - Income where category is 'ধার ফেরত' or 'পাওনা আদায়'
  const lendingRecords = useMemo(() => {
    return transactions.filter((tx) => {
      const isLendingGiven =
        tx.type === 'expense' &&
        (tx.category === 'ধার প্রদান' ||
          tx.category === 'ধার' ||
          tx.category === 'পাওনা' ||
          tx.badge === 'পাওনা');

      const isLendingReturned =
        tx.type === 'income' &&
        (tx.category === 'ধার ফেরত' ||
          tx.category === 'পাওনা আদায়' ||
          tx.notes?.includes('ধার ফেরত'));

      return isLendingGiven || isLendingReturned;
    });
  }, [transactions]);

  // Group by Person / Borrower Name
  const personSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        personName: string;
        totalGiven: number;
        totalReceived: number;
        transactions: Transaction[];
        lastDate: string;
      }
    >();

    lendingRecords.forEach((tx) => {
      const name = tx.personName || tx.title;

      if (!map.has(name)) {
        map.set(name, {
          personName: name,
          totalGiven: 0,
          totalReceived: 0,
          transactions: [],
          lastDate: tx.date,
        });
      }

      const item = map.get(name)!;
      item.transactions.push(tx);
      if (tx.date > item.lastDate) item.lastDate = tx.date;

      if (tx.type === 'expense') {
        item.totalGiven += tx.amount;
      } else {
        item.totalReceived += tx.amount;
      }
    });

    const list = Array.from(map.values()).map((p) => ({
      ...p,
      currentBalance: Math.max(0, p.totalGiven - p.totalReceived),
      transactions: p.transactions.sort((a, b) => b.date.localeCompare(a.date)),
    }));

    return list.sort((a, b) => b.currentBalance - a.currentBalance);
  }, [lendingRecords]);

  // Overall statistics
  const overallStats = useMemo(() => {
    let totalGiven = 0;
    let totalReceived = 0;

    personSummaries.forEach((p) => {
      totalGiven += p.totalGiven;
      totalReceived += p.totalReceived;
    });

    return {
      totalGiven,
      totalReceived,
      netReceivable: Math.max(0, totalGiven - totalReceived),
      borrowerCount: personSummaries.length,
    };
  }, [personSummaries]);

  // Filtered person summaries
  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return personSummaries;
    const q = searchQuery.toLowerCase();
    return personSummaries.filter((p) => p.personName.toLowerCase().includes(q));
  }, [personSummaries, searchQuery]);

  // Open modal helper
  const openLendModal = (personName = '') => {
    setModalMode('lend');
    setTargetPerson(personName);
    setAmountInput('');
    setNotesInput('');
    setIsModalOpen(true);
  };

  const openReceiveModal = (personName = '') => {
    setModalMode('receive');
    setTargetPerson(personName);
    setAmountInput('');
    setNotesInput('');
    setIsModalOpen(true);
  };

  const handleSubmitModal = (e: FormEvent) => {
    e.preventDefault();
    if (!targetPerson.trim() || !amountInput || Number(amountInput) <= 0) return;

    if (modalMode === 'lend') {
      onAddLending(targetPerson.trim(), Number(amountInput), notesInput.trim());
    } else {
      onReceiveLendingReturn(targetPerson.trim(), Number(amountInput), notesInput.trim());
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-blue-600" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {language === 'bn' ? 'ধার ও পাওনা হিসাব' : 'Lending & Receivables'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => openLendModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? '+ নতুন ধার দিন' : '+ Lend Money'}</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white border border-blue-200/80 rounded-2xl p-3 shadow-xs text-center">
          <p className="text-[11px] font-semibold text-slate-500 mb-0.5">মোট ধার প্রদান</p>
          <p className="text-xs sm:text-base font-bold text-blue-600 truncate">
            {formatCurrency(overallStats.totalGiven, language)}
          </p>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-3 shadow-xs text-center">
          <p className="text-[11px] font-semibold text-slate-500 mb-0.5">মোট ফেরত আদায়</p>
          <p className="text-xs sm:text-base font-bold text-emerald-600 truncate">
            {formatCurrency(overallStats.totalReceived, language)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl p-3 shadow-xs text-center">
          <p className="text-[11px] font-semibold text-white/90 mb-0.5">বর্তমান পাওনা বাকি</p>
          <p className="text-xs sm:text-base font-bold truncate">
            {formatCurrency(overallStats.netReceivable, language)}
          </p>
        </div>
      </div>

      {/* Info helper */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p>
          {language === 'bn'
            ? 'খরচের সময় "ধার প্রদান" ক্যাটাগরিতে এন্ট্রি দিলে এখানে ব্যক্তির নাম অনুযায়ী জমা হয়। পরবর্তীতে টাকা ফেরত এলে পাওনা কমে যাবে।'
            : 'Expenses recorded under "Lending" category are tracked here by borrower. Returning money reduces the owed balance.'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={language === 'bn' ? 'ব্যক্তির নাম দিয়ে খুঁজুন...' : 'Search by borrower name...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <VoiceInputButton
            inputType="search"
            contextLabel="ধারগ্রহীতা খুঁজুন"
            onTranscript={(val) => setSearchQuery(val)}
            size="xs"
          />
        </div>
      </div>

      {/* List of Borrowers */}
      <div className="space-y-3">
        {filteredSummaries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            {language === 'bn'
              ? 'এখনো কোনো ধার প্রদানের হিসাব নেই। "+ নতুন ধার দিন" বাটন চেপে শুরু করুন।'
              : 'No lending records found. Click "+ Lend Money" to start.'}
          </div>
        ) : (
          filteredSummaries.map((p) => {
            const isExpanded = selectedPerson === p.personName;
            const isCleared = p.currentBalance === 0;

            return (
              <div
                key={p.personName}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs transition-all hover:border-blue-300"
              >
                {/* Person Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isCleared
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {p.personName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">{p.personName}</h3>
                        {isCleared ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            সম্পূর্ণ আদায়
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                            পাওনা বাকি
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
                    <p className="text-[11px] text-slate-500 font-semibold">পাওনা বাকি</p>
                    <p className={`text-sm sm:text-base font-black ${
                      isCleared ? 'text-emerald-600' : 'text-blue-600'
                    }`}>
                      {formatCurrency(p.currentBalance, language)}
                    </p>
                  </div>
                </div>

                {/* Sub Stats */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="text-slate-600">
                    মোট ধার দেওয়া:{' '}
                    <span className="font-bold text-blue-700">
                      {formatCurrency(p.totalGiven, language)}
                    </span>
                  </div>
                  <div className="text-slate-600 text-right">
                    ফেরত আদায়:{' '}
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(p.totalReceived, language)}
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
                      onClick={() => openLendModal(p.personName)}
                      className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 transition-colors"
                      title="আরও ধার দিন"
                    >
                      + আরও ধার
                    </button>
                    <button
                      type="button"
                      onClick={() => openReceiveModal(p.personName)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      title="ধার ফেরত গ্রহণ করুন"
                    >
                      ✓ ফেরত আদায়
                    </button>
                  </div>
                </div>

                {/* Detailed Timeline Table if expanded */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in-50 duration-150">
                    <p className="text-xs font-bold text-slate-700">লেনদেনের ইতিহাস:</p>
                    <div className="bg-slate-50 rounded-xl p-2.5 divide-y divide-slate-200/60 text-xs">
                      {p.transactions.map((tx) => {
                        const isReturn = tx.type === 'income';
                        return (
                          <div key={tx.id} className="py-2 flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-800">{tx.title}</p>
                              <p className="text-[11px] text-slate-400">
                                {tx.date} • {tx.paymentMethod} {tx.notes ? `(${tx.notes})` : ''}
                              </p>
                            </div>
                            <span className={`font-bold ${isReturn ? 'text-emerald-600' : 'text-blue-600'}`}>
                              {isReturn ? '+ ফেরত আদায়: ' : '- ধার প্রদান: '}
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

      {/* Modal for Lend / Receive */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 pb-2 border-b border-slate-100">
              {modalMode === 'lend'
                ? 'নতুন ধার প্রদান (+ পাওনা বৃদ্ধি)'
                : 'ধার ফেরত আদায় (- পাওনা হ্রাস)'}
            </h3>

            <form onSubmit={handleSubmitModal} className="space-y-3 mt-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    কার নাম / বিবরণ *
                  </label>
                  <VoiceInputButton
                    inputType="text"
                    contextLabel="ধারগ্রহীতার নাম"
                    onTranscript={(val) => setTargetPerson(val)}
                    size="xs"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="যেমন: কামাল, করিম, বন্ধু"
                    value={targetPerson}
                    onChange={(e) => setTargetPerson(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <VoiceInputButton
                      inputType="text"
                      contextLabel="নাম"
                      onTranscript={(val) => setTargetPerson(val)}
                      size="xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    টাকার পরিমাণ (৳) *
                  </label>
                  <VoiceInputButton
                    inputType="currency"
                    contextLabel="টাকার পরিমাণ"
                    onTranscript={(val) => {
                      const num = parseFloat(val);
                      if (!isNaN(num) && num > 0) setAmountInput(num);
                    }}
                    size="xs"
                  />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0.00"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full pl-3 pr-9 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <VoiceInputButton
                      inputType="currency"
                      contextLabel="টাকা"
                      onTranscript={(val) => {
                        const num = parseFloat(val);
                        if (!isNaN(num) && num > 0) setAmountInput(num);
                      }}
                      size="xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    নোট (ঐচ্ছিক)
                  </label>
                  <VoiceInputButton
                    inputType="text"
                    contextLabel="নোট বা ফেরতের সময়সীমা"
                    currentValue={notesInput}
                    appendMode={true}
                    onTranscript={(val) => setNotesInput(val)}
                    size="xs"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="উদ্দেশ্য বা ফেরতের সময়সীমা..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <VoiceInputButton
                      inputType="text"
                      contextLabel="নোট"
                      currentValue={notesInput}
                      appendMode={true}
                      onTranscript={(val) => setNotesInput(val)}
                      size="xs"
                    />
                  </div>
                </div>
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
                    modalMode === 'lend'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {modalMode === 'lend' ? 'ধার এন্ট্রি করুন' : 'ফেরত আদায় সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
