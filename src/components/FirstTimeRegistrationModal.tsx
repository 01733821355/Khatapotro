import { useState, useEffect, type FormEvent } from 'react';
import { 
  BookOpen, 
  User, 
  Store, 
  Phone, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  X,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile, Language } from '../types';

interface FirstTimeRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (profile: UserProfile, initialBalance: number) => Promise<void> | void;
  initialProfile?: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  onGoogleSignIn: () => Promise<void>;
  language: Language;
  isFirstTime?: boolean;
}

export const FirstTimeRegistrationModal = ({
  isOpen,
  onClose,
  onRegister,
  initialProfile,
  firebaseUser,
  onGoogleSignIn,
  language,
  isFirstTime = false,
}: FirstTimeRegistrationModalProps) => {
  const [name, setName] = useState(initialProfile?.name || firebaseUser?.displayName || '');
  const [businessName, setBusinessName] = useState(initialProfile?.businessName || 'ব্যক্তিগত আয়-ব্যয় খাতা');
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [openingBalance, setOpeningBalance] = useState<string>(
    initialProfile?.openingBalance ? String(initialProfile.openingBalance) : '0'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync when firebase user logs in or initial profile updates
  useEffect(() => {
    if (firebaseUser?.displayName && !name) {
      setName(firebaseUser.displayName);
    }
  }, [firebaseUser, name]);

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name || '');
      setBusinessName(initialProfile.businessName || 'ব্যক্তিগত আয়-ব্যয় খাতা');
      setPhone(initialProfile.phone || '');
      setOpeningBalance(String(initialProfile.openingBalance || 0));
    }
  }, [initialProfile]);

  if (!isOpen) return null;

  const t = {
    modalTitle: isFirstTime 
      ? (language === 'bn' ? 'স্বাগতম! আপনার খাতা রেজিস্ট্রেশন করুন' : 'Welcome! Register Your Ledger')
      : (language === 'bn' ? 'প্রোফাইল ও খাতা বিবরণ এডিট' : 'Edit Profile & Ledger Info'),
    modalSub: isFirstTime
      ? (language === 'bn' 
          ? 'প্রথমবার খাতাপত্র ব্যবহারে স্বাগতম! আপনার ও খাতার প্রাথমিক তথ্য প্রদান করুন।' 
          : 'Welcome to KhataPotro! Please enter your profile and ledger details to start.')
      : (language === 'bn' 
          ? 'আপনার নাম ও খাতার শিরোনাম আপডেট করুন।' 
          : 'Update your personal name and ledger business title.'),
    nameLabel: language === 'bn' ? 'আপনার নাম / স্বত্বাধিকারী *' : 'Your Name / Owner *',
    namePlaceholder: language === 'bn' ? 'যেমন: বাপ্পী হোসেন' : 'e.g. Md Bappy Hossain',
    bizLabel: language === 'bn' ? 'খাতা / প্রতিষ্ঠানের নাম' : 'Ledger / Business Title',
    bizPlaceholder: language === 'bn' ? 'যেমন: বাপ্পীর ক্যাশ খাতা / মেসার্স ট্রেডার্স' : 'e.g. Bappy Cash Khata / Personal Ledger',
    phoneLabel: language === 'bn' ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Mobile Phone (Optional)',
    phonePlaceholder: language === 'bn' ? 'যেমন: 018XXXXXXXX' : 'e.g. 018XXXXXXXX',
    balanceLabel: language === 'bn' ? 'প্রারম্ভিক ক্যাশ ব্যালেন্স (৳)' : 'Opening Cash Balance (৳)',
    balanceHelp: language === 'bn' ? 'খাতা শুরুর পূর্বে হাতে থাকা নগদ ক্যাশ' : 'Cash in hand before ledger start',
    googleBtn: language === 'bn' ? 'গুগল অ্যাকাউন্ট দিয়ে স্বয়ংক্রিয় পূরণ' : 'Autofill with Google Account',
    submitBtn: isFirstTime 
      ? (language === 'bn' ? 'খাতা চালু করুন ও শুরু করুন' : 'Complete Setup & Open Khata')
      : (language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'),
    skipOrClose: language === 'bn' ? 'পরে করব' : 'Skip / Close',
    nameRequiredError: language === 'bn' ? 'দয়া করে আপনার নাম লিখুন।' : 'Please enter your name.',
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.nameRequiredError);
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const balanceNum = parseFloat(openingBalance) || 0;
      const profile: UserProfile = {
        name: name.trim(),
        businessName: businessName.trim() || 'ব্যক্তিগত আয়-ব্যয় খাতা',
        phone: phone.trim(),
        openingBalance: balanceNum,
        registeredAt: initialProfile?.registeredAt || new Date().toISOString(),
        email: firebaseUser?.email || undefined,
        isRegistered: true,
      };

      await onRegister(profile, balanceNum);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Header with Icon */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mb-1">
                <Sparkles className="w-3 h-3" />
                <span>{isFirstTime ? 'প্রথমবার রেজিস্ট্রেশন' : 'প্রোফাইল সেটআপ'}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                {t.modalTitle}
              </h3>
            </div>
          </div>
          {!isFirstTime && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/70">
          {t.modalSub}
        </p>

        {/* Google Quick Autofill Button if not connected */}
        {!firebaseUser && (
          <div className="mb-5">
            <button
              type="button"
              onClick={async () => {
                try {
                  await onGoogleSignIn();
                } catch {
                  // Handled in handler
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t.googleBtn}</span>
            </button>
            <div className="flex items-center my-3 text-[11px] text-slate-400">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="px-2">{language === 'bn' ? 'অথবা তথ্য লিখুন' : 'or enter details'}</span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.nameLabel}</span>
            </label>
            <input
              type="text"
              required
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white font-medium"
            />
          </div>

          {/* Ledger / Business Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.bizLabel}</span>
            </label>
            <input
              type="text"
              placeholder={t.bizPlaceholder}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white font-medium"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.phoneLabel}</span>
            </label>
            <input
              type="tel"
              placeholder={t.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white font-medium"
            />
          </div>

          {/* Opening Balance (Only shown on first-time setup or if explicitly editing) */}
          {isFirstTime && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t.balanceLabel}</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {t.balanceHelp}
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white font-mono font-bold"
              />
            </div>
          )}

          {/* Privacy badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {language === 'bn' 
                ? 'আপনার তথ্য লোকাল স্টোরেজ ও গুগল ক্লাউডে ১০০% সুরক্ষিত।' 
                : 'Your data is 100% secured on local storage & Google Cloud.'}
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center gap-2">
            {isFirstTime ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {t.skipOrClose}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-60"
            >
              <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : t.submitBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
