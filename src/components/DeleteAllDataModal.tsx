import { useState, type FormEvent } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  ShieldAlert, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import type { Language } from '../types';

interface DeleteAllDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void> | void;
  transactionCount: number;
  documentCount: number;
  language: Language;
}

export const DeleteAllDataModal = ({
  isOpen,
  onClose,
  onConfirmDelete,
  transactionCount,
  documentCount,
  language,
}: DeleteAllDataModalProps) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const t = {
    title: language === 'bn' ? 'সমস্ত ডেটা মুছে ফেলা (Factory Reset)' : 'Delete All Data (Factory Reset)',
    warning: language === 'bn' 
      ? 'সতর্কতা: এটি একটি অপরিবর্তনযোগ্য (Permanent) অ্যাকশন! একবার ডিলিট করার পর কোনো তথ্য পুনরুদ্ধার করা যাবে না।' 
      : 'Warning: This action is permanent and cannot be undone! Once deleted, your data cannot be recovered.',
    willDeleteList: language === 'bn' ? 'নিম্নলিখিত সমস্ত তথ্য স্থায়ীভাবে মুছে যাবে:' : 'The following will be permanently erased:',
    item1: language === 'bn' 
      ? `সকল আয়-ব্যয়, ঋণ ও ধার লেনদেন (${transactionCount} টি রেকর্ড)` 
      : `All income, expense, loan & lending records (${transactionCount} entries)`,
    item2: language === 'bn' 
      ? `আপলোডকৃত সকল ভাউচার, ক্যাশ মেমো ও রসিদ (${documentCount} টি ফাইল)` 
      : `All uploaded vouchers, receipts and memos (${documentCount} files)`,
    item3: language === 'bn' 
      ? 'আপনার প্রোফাইল, খাতার নাম ও প্রারম্ভিক ব্যালেন্স' 
      : 'Your personal profile, ledger name and opening balance',
    item4: language === 'bn' 
      ? 'গুগল স্প্রেডশিট লিঙ্ক কনফিগারেশন' 
      : 'Google Spreadsheet linked configurations',
    typeConfirmPrompt: language === 'bn' 
      ? 'নিশ্চিত করতে নিচে "DELETE" বা "মুছুন" লিখুন:' 
      : 'Type "DELETE" below to confirm:',
    cancel: language === 'bn' ? 'না, বাতিল করুন' : 'Cancel, Keep Data',
    confirmBtn: language === 'bn' ? 'হ্যাঁ, সমস্ত ডেটা মুছে ফেলুন' : 'Yes, Delete All Data Permanently',
  };

  const isConfirmed = confirmInput.trim().toUpperCase() === 'DELETE' || confirmInput.trim() === 'মুছুন';

  const handleDelete = async (e: FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      await onConfirmDelete();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-rose-200 shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header with Red Warning Icon */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span>বিপজ্জনক অ্যাকশন</span>
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                {t.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-3.5 mb-4 text-xs text-rose-800 leading-relaxed">
          <p className="font-semibold">{t.warning}</p>
        </div>

        {/* List of affected items */}
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-700 mb-2">
            {t.willDeleteList}
          </p>
          <ul className="space-y-1.5 text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>{t.item1}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>{t.item2}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>{t.item3}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>{t.item4}</span>
            </li>
          </ul>
        </div>

        {/* Confirmation Form */}
        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.typeConfirmPrompt}
            </label>
            <input
              type="text"
              placeholder="DELETE"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-white border-2 border-slate-300 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-center tracking-widest uppercase"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isDeleting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{isDeleting ? 'মুছে ফেলা হচ্ছে...' : t.confirmBtn}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
