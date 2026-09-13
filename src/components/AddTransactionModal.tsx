import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { 
  PlusCircle, 
  MinusCircle, 
  X, 
  Paperclip, 
  User, 
  AlertTriangle, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Check, 
  Pencil,
  Trash2,
  Mic,
  MicOff,
  Sparkles
} from 'lucide-react';
import type { 
  Transaction, 
  TransactionType, 
  PaymentMethod, 
  CloudDocument, 
  Language, 
  TransactionBadge, 
  DailyExpenseLimit,
  DocumentCategory 
} from '../types';
import { formatCurrency } from '../utils/formatters';
import { VoiceTransactionAssistant } from './VoiceTransactionAssistant';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { normalizeBengaliNumbers, type ParsedVoiceTransaction } from '../utils/voiceTransactionParser';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  initialTransaction?: Transaction | null;
  documents: CloudDocument[];
  onAddTransaction: (
    tx: Omit<Transaction, 'id' | 'syncedToSheets'>,
    newFileToUpload?: { file: File; title: string; category: DocumentCategory }
  ) => Promise<void>;
  onUpdateTransaction?: (
    tx: Transaction,
    newFileToUpload?: { file: File; title: string; category: DocumentCategory }
  ) => Promise<void>;
  language: Language;
  dailyExpenseLimit?: DailyExpenseLimit;
  todayExpense?: number;
  initialVoiceMode?: boolean;
}

const EXPENSE_CATEGORIES = ['খাবার', 'বিল', 'যাতায়াত', 'বাজার', 'অন্যান্য খরচ', 'ধার প্রদান', 'ঋণ পরিশোধ', 'দোকান ভাড়া', 'বেতন'];
const INCOME_CATEGORIES = ['বেতন', 'অন্যান্য জমা', 'ঋণ গ্রহণ', 'ধার ফেরত', 'ব্যবসা', 'পণ্য বিক্রয়', 'ক্রেডিট কার্ড ক্যাশব্যাক'];
const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'Credit Card', 'Other'];

export const AddTransactionModal = ({
  isOpen,
  onClose,
  defaultType = 'expense',
  initialTransaction,
  documents,
  onAddTransaction,
  onUpdateTransaction,
  language,
  dailyExpenseLimit,
  todayExpense = 0,
  initialVoiceMode = false,
}: AddTransactionModalProps) => {
  const isEditing = Boolean(initialTransaction);

  const [type, setType] = useState<TransactionType>(initialTransaction?.type || defaultType);
  const [title, setTitle] = useState(initialTransaction?.title || '');
  const [personName, setPersonName] = useState(initialTransaction?.personName || '');
  const [amount, setAmount] = useState<number | ''>(initialTransaction ? initialTransaction.amount : '');
  const [category, setCategory] = useState(
    initialTransaction?.category || (defaultType === 'income' ? 'অন্যান্য জমা' : 'অন্যান্য খরচ')
  );
  const [date, setDate] = useState(initialTransaction?.date || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialTransaction?.paymentMethod || 'Cash');
  const [notes, setNotes] = useState(initialTransaction?.notes || '');
  const [selectedDocId, setSelectedDocId] = useState<string>(initialTransaction?.receiptDocId || '');
  
  // Voice control state
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(initialVoiceMode);
  const [activeFieldMic, setActiveFieldMic] = useState<'title' | 'amount' | null>(null);

  // Field speech recognition for Title & Amount
  const { isListening: isFieldListening, startListening: startFieldListening, stopListening: stopFieldListening } =
    useSpeechRecognition({
      lang: 'bn-BD',
      onResult: (text, isFinal) => {
        if (activeFieldMic === 'title') {
          setTitle(text);
        } else if (activeFieldMic === 'amount') {
          const norm = normalizeBengaliNumbers(text);
          const numMatch = norm.match(/\d+(?:\.\d+)?/);
          if (numMatch) {
            setAmount(parseFloat(numMatch[0]));
          }
        }
        if (isFinal) {
          setActiveFieldMic(null);
        }
      },
      onError: () => {
        setActiveFieldMic(null);
      },
    });

  const toggleFieldMic = (field: 'title' | 'amount') => {
    if (activeFieldMic === field && isFieldListening) {
      stopFieldListening();
      setActiveFieldMic(null);
    } else {
      setActiveFieldMic(field);
      startFieldListening('bn-BD');
    }
  };

  const handleApplyVoiceTransaction = (parsed: ParsedVoiceTransaction) => {
    setType(parsed.type);
    if (parsed.title) setTitle(parsed.title);
    if (parsed.amount) setAmount(parsed.amount);
    if (parsed.category) setCategory(parsed.category);
    if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
  };

  // Document upload state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [docCategory, setDocCategory] = useState<DocumentCategory>('memo');
  const [removeExistingDoc, setRemoveExistingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever modal is opened or initialTransaction / defaultType changes
  useEffect(() => {
    if (isOpen) {
      setShowVoiceAssistant(initialVoiceMode || false);
      if (initialTransaction) {
        setType(initialTransaction.type);
        setTitle(initialTransaction.title);
        setPersonName(initialTransaction.personName || '');
        setAmount(initialTransaction.amount);
        setCategory(initialTransaction.category);
        setDate(initialTransaction.date);
        setPaymentMethod(initialTransaction.paymentMethod || 'Cash');
        setNotes(initialTransaction.notes || '');
        setSelectedDocId(initialTransaction.receiptDocId || '');
        setRemoveExistingDoc(false);
      } else {
        setType(defaultType);
        setCategory(defaultType === 'income' ? 'অন্যান্য জমা' : 'অন্যান্য খরচ');
        setTitle('');
        setPersonName('');
        setAmount('');
        setNotes('');
        setSelectedDocId('');
        setDate(new Date().toISOString().split('T')[0]);
        setRemoveExistingDoc(false);
      }
      setAttachedFile(null);
      setFilePreviewUrl(null);
    }
  }, [isOpen, initialTransaction, defaultType]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  if (!isOpen) return null;

  const isLoanOrDharCategory = 
    category === 'ঋণ গ্রহণ' || 
    category === 'ঋণ' || 
    category === 'ধার প্রদান' || 
    category === 'ধার ফেরত' || 
    category === 'ঋণ পরিশোধ';

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Handle file selection from camera/disk
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFile(file);
    setSelectedDocId(''); // Clear dropdown if uploading new file
    setRemoveExistingDoc(false);

    // Auto-detect doc category
    if (type === 'income') {
      setDocCategory('invoice');
    } else {
      setDocCategory('voucher');
    }

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleClearFile = () => {
    setAttachedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      const selectedDoc = documents.find((d) => d.id === selectedDocId);

      // Determine badge
      let badge: TransactionBadge = type === 'income' ? 'জমা' : 'খরচ';
      if (category === 'ঋণ গ্রহণ' || category === 'ঋণ' || title.includes('ক্রেডিট কার্ড') || (title.includes('আব্বু') && type === 'income')) {
        badge = 'দেনা';
      } else if (category === 'ধার প্রদান' || category === 'ধার') {
        badge = 'পাওনা';
      }

      let newFilePayload: { file: File; title: string; category: DocumentCategory } | undefined = undefined;
      if (attachedFile) {
        newFilePayload = {
          file: attachedFile,
          title: title.trim() + ' (' + (type === 'income' ? 'জমা রসিদ' : 'খরচ ভাউচার') + ')',
          category: docCategory,
        };
      }

      if (isEditing && initialTransaction && onUpdateTransaction) {
        await onUpdateTransaction(
          {
            ...initialTransaction,
            title: title.trim(),
            amount: Number(amount),
            type,
            category,
            date,
            paymentMethod,
            badge,
            personName: personName.trim() || undefined,
            notes: notes.trim() || undefined,
            receiptDocId: removeExistingDoc ? undefined : selectedDocId || initialTransaction.receiptDocId,
            receiptName: removeExistingDoc ? undefined : (selectedDoc?.title || initialTransaction.receiptName),
          },
          newFilePayload
        );
      } else {
        await onAddTransaction(
          {
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
          },
          newFilePayload
        );
      }

      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingLinkedDoc = documents.find(d => d.id === (initialTransaction?.receiptDocId || selectedDocId));

  const t = {
    editTitle: language === 'bn' ? 'এন্ট্রি এডিট / পরিবর্তন করুন' : 'Edit Transaction Entry',
    addIncome: language === 'bn' ? 'নতুন জমা (Income) যোগ করুন' : 'Record New Income',
    addExpense: language === 'bn' ? 'নতুন খরচ (Expense) যোগ করুন' : 'Record New Expense',
    titleLabel: language === 'bn' ? 'বিবরণ / নাম *' : 'Description / Title *',
    titlePlaceholder: language === 'bn' ? 'যেমন: আম্মু, খাবার, বিদ্যুৎ বিল' : 'e.g. Lunch, Electric Bill, Counter Sale',
    amountLabel: language === 'bn' ? 'টাকার পরিমাণ (৳) *' : 'Amount (৳) *',
    categoryLabel: language === 'bn' ? 'ক্যাটাগরি' : 'Category',
    dateLabel: language === 'bn' ? 'তারিখ' : 'Date',
    paymentLabel: language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method',
    notesLabel: language === 'bn' ? 'নোট (ঐচ্ছিক)' : 'Notes (Optional)',
    attachDocLabel: language === 'bn' ? 'রসিদ / মেমো / চালান সংযুক্ত করুন (ছবি বা PDF)' : 'Attach Receipt / Voucher / Memo (Image or PDF)',
    uploadDocPrompt: language === 'bn' ? 'ক্যামেরা বা ফাইল থেকে ছবি / PDF নির্বাচন করুন' : 'Choose photo from Camera or File (Image / PDF)',
    noDocSelect: language === 'bn' ? '-- পূর্বে আপলোড করা ডকুমেন্ট থেকে বেছে নিন --' : '-- Choose from existing documents --',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    save: isEditing 
      ? (language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Update Entry')
      : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Entry'),
    saving: language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Pencil className="w-5 h-5 text-blue-600" />
            ) : type === 'income' ? (
              <PlusCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <MinusCircle className="w-5 h-5 text-rose-600" />
            )}
            <h3 className="font-bold text-base sm:text-lg text-slate-900">
              {isEditing ? t.editTitle : type === 'income' ? t.addIncome : t.addExpense}
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

        {/* Voice Input Assistant Toggle Button */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowVoiceAssistant(!showVoiceAssistant)}
            className={`w-full py-2 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              showVoiceAssistant
                ? 'bg-indigo-900 text-white border-indigo-700 shadow-md'
                : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 hover:from-indigo-100 hover:to-pink-100 text-indigo-900 border-indigo-200/80 shadow-2xs'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Mic className="w-3 h-3" />
            </div>
            <span>
              {language === 'bn'
                ? (showVoiceAssistant ? 'ভয়েস ইনপুট প্যানেল বন্ধ করুন' : '🎤 মুখে বলে সহজে হিসাব যোগ করুন (AI Voice Input)')
                : (showVoiceAssistant ? 'Close Voice Assistant' : '🎤 Speak to Add Transaction (AI Voice)')}
            </span>
          </button>
        </div>

        {/* Embedded Voice Assistant */}
        {showVoiceAssistant && (
          <div className="mt-3 animate-in fade-in zoom-in-95 duration-150">
            <VoiceTransactionAssistant
              onApply={handleApplyVoiceTransaction}
              language={language}
              onClose={() => setShowVoiceAssistant(false)}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {t.titleLabel}
              </label>
              <button
                type="button"
                onClick={() => toggleFieldMic('title')}
                className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  activeFieldMic === 'title' && isFieldListening
                    ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
                title="মুখে বলে বিবরণ লিখুন"
              >
                <Mic className="w-3 h-3" />
                <span>{activeFieldMic === 'title' && isFieldListening ? 'শুনছি...' : (language === 'bn' ? 'মুখে বলুন' : 'Voice')}</span>
              </button>
            </div>
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleFieldMic('amount')}
                  className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    activeFieldMic === 'amount' && isFieldListening
                      ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title="মুখে বলে টাকা লিখুন"
                >
                  <Mic className="w-3 h-3" />
                  <span>{activeFieldMic === 'amount' && isFieldListening ? 'শুনছি...' : (language === 'bn' ? 'টাকা বলুন' : 'Voice')}</span>
                </button>
                {type === 'expense' && dailyExpenseLimit?.enabled && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    {language === 'bn' ? 'দৈনিক লিমিট:' : 'Daily Limit:'}{' '}
                    <strong className="text-slate-700 font-mono">
                      {formatCurrency(dailyExpenseLimit.amount, language)}
                    </strong>
                  </span>
                )}
              </div>
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

            {/* Warning if adding this expense exceeds daily limit */}
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
                        ? `আজকের মোট খরচ দাঁড়াবে ${formatCurrency(todayExpense + Number(amount), language)}, যা আপনার দৈনিক লিমিট (${formatCurrency(dailyExpenseLimit.amount, language)}) থেকে বেশি।`
                        : `Total today will be ${formatCurrency(todayExpense + Number(amount), language)}, which exceeds your daily limit.`}
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

          {/* Direct Document / Voucher / Memo Attachment */}
          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.attachDocLabel}</span>
              </label>
              {attachedFile && (
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="text-[11px] text-rose-600 hover:underline font-bold flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>সরান</span>
                </button>
              )}
            </div>

            {/* Existing linked document indicator when editing */}
            {existingLinkedDoc && !removeExistingDoc && !attachedFile && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-blue-900 truncate">
                      {existingLinkedDoc.title || existingLinkedDoc.fileName}
                    </p>
                    <p className="text-[10px] text-blue-600">
                      সংযুক্ত রসিদ/ডকুমেন্ট ভল্টে সংরক্ষিত আছে
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRemoveExistingDoc(true);
                    setSelectedDocId('');
                  }}
                  className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"
                  title="রসিদ সংযোগ বিচ্ছিন্ন করুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Direct File Picker (Camera / Files) */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="tx-file-input"
            />

            {!attachedFile ? (
              <label
                htmlFor="tx-file-input"
                className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer bg-white hover:bg-blue-50/40 transition-colors text-center"
              >
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-blue-600">
                  {t.uploadDocPrompt}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  ক্যামেরার ছবি, ভাউচার, মেমো, ইনভয়েস বা PDF (সর্বোচ্চ 10MB)
                </span>
              </label>
            ) : (
              <div className="p-2.5 bg-white border border-emerald-200 rounded-xl flex items-center gap-3">
                {filePreviewUrl ? (
                  <img
                    src={filePreviewUrl}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {attachedFile.name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {(attachedFile.size / 1024).toFixed(1)} KB •{' '}
                    <span className="text-emerald-600 font-bold">আপলোডের জন্য প্রস্তুত ✓</span>
                  </p>
                </div>
              </div>
            )}

            {/* Option to choose from existing uploaded documents in the vault */}
            {documents.length > 0 && !attachedFile && (
              <div className="pt-1">
                <select
                  value={selectedDocId}
                  onChange={(e) => {
                    setSelectedDocId(e.target.value);
                    setRemoveExistingDoc(false);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700"
                >
                  <option value="">{t.noDocSelect}</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      [{doc.docCategory}] {doc.title} ({doc.fileName})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.notesLabel}
            </label>
            <input
              type="text"
              placeholder="অতিরিক্ত কোনো তথ্য বা মন্তব্য..."
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
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 ${
                isEditing
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
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
