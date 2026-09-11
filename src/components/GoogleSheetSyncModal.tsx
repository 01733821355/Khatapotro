import { useState, type FormEvent } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  FileSpreadsheet, 
  Plus, 
  X, 
  Check, 
  AlertCircle,
  ShieldCheck,
  Table,
  User,
  Store,
  Phone,
  Calendar,
  Trash2,
  AlertTriangle,
  Settings,
  Edit3
} from 'lucide-react';
import type { SheetConfig, Language, UserProfile, GoogleUser } from '../types';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: GoogleUser | null;
  sheetConfig: SheetConfig;
  isSyncing: boolean;
  onSyncAll: () => Promise<void>;
  onCreateNewSheet: () => Promise<void>;
  onSaveExistingSheetId: (sheetId: string) => Promise<void>;
  onLogin: () => void;
  language: Language;
  userProfile?: UserProfile | null;
  onOpenEditProfile?: () => void;
  onOpenDeleteAllData?: () => void;
  transactionCount?: number;
  documentCount?: number;
}

export const GoogleSheetSyncModal = ({
  isOpen,
  onClose,
  user,
  sheetConfig,
  isSyncing,
  onSyncAll,
  onCreateNewSheet,
  onSaveExistingSheetId,
  onLogin,
  language,
  userProfile,
  onOpenEditProfile,
  onOpenDeleteAllData,
  transactionCount = 0,
  documentCount = 0,
}: GoogleSheetSyncModalProps) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'profile' | 'danger'>('sheets');
  const [customSheetId, setCustomSheetId] = useState(sheetConfig.spreadsheetId || '');
  const [showConfirmSyncDialog, setShowConfirmSyncDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = {
    title: language === 'bn' ? 'সেটিংস ও গুগল ক্লাউড সিঙ্ক' : 'Settings & Google Cloud Sync',
    tabSheets: language === 'bn' ? 'গুগল শিট সিঙ্ক' : 'Google Sheets',
    tabProfile: language === 'bn' ? 'প্রোফাইল ও খাতা' : 'Profile & Khata',
    tabDanger: language === 'bn' ? 'ডেটা ডিলিট' : 'Danger Zone',
    connectedAccount: language === 'bn' ? 'সংযুক্ত গুগল অ্যাকাউন্ট' : 'Connected Google Account',
    sheetStatus: language === 'bn' ? 'স্প্রেডশিট অবস্থা' : 'Spreadsheet Status',
    linked: language === 'bn' ? 'সংযুক্ত আছে' : 'Linked',
    notLinked: language === 'bn' ? 'এখনো কোনো শিট তৈরি করা হয়নি' : 'No Spreadsheet Linked Yet',
    createNew: language === 'bn' ? 'নতুন খাতাপত্র গুগল শিট তৈরি করুন' : 'Create New KhataPotro Sheet',
    syncAll: language === 'bn' ? 'সকল ডেটা গুগল শিটে সিঙ্ক করুন' : 'Push All Data to Google Sheets',
    openSheet: language === 'bn' ? 'গুগল শিট খুলুন ↗' : 'Open in Google Sheets ↗',
    orUseExisting: language === 'bn' ? 'অথবা পূর্বের শিট আইডি ব্যবহার করুন:' : 'Or connect an existing Spreadsheet ID:',
    saveSheetId: language === 'bn' ? 'শিট লিংক করুন' : 'Link Sheet',
    lastSync: language === 'bn' ? 'সর্বশেষ সিঙ্ক সময়' : 'Last Synced At',
    confirmSyncTitle: language === 'bn' ? 'গুগল শিটে ডেটা সিঙ্ক নিশ্চিতকরণ' : 'Confirm Google Sheets Data Sync',
    confirmSyncBody: language === 'bn'
      ? 'এটি আপনার খাতাপত্রের সকল লেনদেন, রিয়েল-টাইম ইনভেন্টরি, স্টক লগ এবং ডকুমেন্ট ভল্টের রেকর্ড গুগল স্প্রেডশিটে হালনাগাদ (আপডেট) করবে।'
      : 'This will update your Google Spreadsheet with all current transactions, real-time stock levels, logs, and document records.',
    confirmButton: language === 'bn' ? 'হ্যাঁ, সিঙ্ক শুরু করুন' : 'Yes, Proceed with Sync',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    tabsIncluded: language === 'bn' ? 'সিঙ্ককৃত ৪টি শিট ট্যাব:' : '4 Synced Sheet Tabs:',
  };

  const handleConfirmSync = async () => {
    setShowConfirmSyncDialog(false);
    setErrorMessage(null);
    try {
      await onSyncAll();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Sync failed');
    }
  };

  const handleCreateSheet = async () => {
    setErrorMessage(null);
    try {
      await onCreateNewSheet();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Creation failed');
    }
  };

  const handleSaveId = async (e: FormEvent) => {
    e.preventDefault();
    if (!customSheetId.trim()) return;
    setErrorMessage(null);
    try {
      await onSaveExistingSheetId(customSheetId.trim());
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to link sheet ID');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                {t.title}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'bn' ? 'খাতা কনফিগারেশন, ক্লাউড ও ডেটা অপশন' : 'Khata configuration, cloud & data'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl my-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`flex-1 py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'sheets'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t.tabSheets}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t.tabProfile}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`flex-1 py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'danger'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.tabDanger}</span>
          </button>
        </div>

        {/* TAB 1: GOOGLE SHEETS SYNC */}
        {activeTab === 'sheets' && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            {/* User Account Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                  {user?.email?.charAt(0).toUpperCase() || 'G'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {user?.displayName || 'Google Account'}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    {user?.email || 'mdbappyhossain018@gmail.com'}
                  </p>
                </div>
              </div>

              {!user && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Error notification if any */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Sheet Status Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-emerald-800 block">
                    {t.sheetStatus}
                  </span>
                  <p className="font-bold text-sm text-slate-900 mt-0.5">
                    {sheetConfig.spreadsheetId ? sheetConfig.spreadsheetName : t.notLinked}
                  </p>
                  {sheetConfig.lastSyncTime && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {t.lastSync}: {new Date(sheetConfig.lastSyncTime).toLocaleString()}
                    </p>
                  )}
                </div>

                {sheetConfig.spreadsheetId && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Check className="w-3 h-3" />
                    {t.linked}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {!sheetConfig.spreadsheetId ? (
                  <button
                    type="button"
                    onClick={handleCreateSheet}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSyncing ? 'তৈরি হচ্ছে...' : t.createNew}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowConfirmSyncDialog(true)}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : t.syncAll}</span>
                    </button>

                    <a
                      href={sheetConfig.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetConfig.spreadsheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      <span>{t.openSheet}</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Overview of the 4 Synced Tabs */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-600">
              <p className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.tabsIncluded}</span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                  <strong className="text-slate-800 block">1. Transactions</strong>
                  <span>সকল আয়, ব্যয়, ঋণ ও ধার</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                  <strong className="text-slate-800 block">2. RealTime_Inventory</strong>
                  <span>বর্তমান স্টক ও মান</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                  <strong className="text-slate-800 block">3. Inventory_Logs</strong>
                  <span>ক্রয় ও বিক্রয় মুভমেন্ট</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                  <strong className="text-slate-800 block">4. Document_Vault</strong>
                  <span>ভাউচার ও রসিদ ড্রাইভ লিংক</span>
                </div>
              </div>
            </div>

            {/* Existing Sheet ID Option */}
            <form onSubmit={handleSaveId} className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.orUseExisting}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={customSheetId}
                  onChange={(e) => setCustomSheetId(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors"
                >
                  {t.saveSheetId}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: PROFILE & KHATA DETAILS */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {userProfile?.name?.charAt(0) || 'B'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {userProfile?.name || user?.displayName || 'Bappy Hossain'}
                    </h4>
                    <p className="text-[11px] text-blue-700 font-medium">
                      {userProfile?.businessName || 'ব্যক্তিগত আয়-ব্যয় খাতা'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenEditProfile) onOpenEditProfile();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-xs transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'এডিট করুন' : 'Edit'}</span>
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>স্বত্বাধিকারী:</span>
                  </span>
                  <span className="font-bold text-slate-900">
                    {userProfile?.name || 'Bappy'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    <span>খাতার নাম:</span>
                  </span>
                  <span className="font-bold text-slate-900">
                    {userProfile?.businessName || 'ব্যক্তিগত খাতা'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>মোবাইল নম্বর:</span>
                  </span>
                  <span className="font-mono text-slate-900">
                    {userProfile?.phone || 'যুক্ত নেই'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>রেজিস্ট্রেশন তারিখ:</span>
                  </span>
                  <span className="text-slate-700 text-[11px]">
                    {userProfile?.registeredAt 
                      ? new Date(userProfile.registeredAt).toLocaleDateString() 
                      : 'পূর্বের সেশন'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenEditProfile) onOpenEditProfile();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>
                  {language === 'bn' 
                    ? 'নাম ও খাতার তথ্য পরিবর্তন করুন' 
                    : 'Edit Profile & Business Info'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DANGER ZONE / ALL DATA DELETE */}
        {activeTab === 'danger' && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm mb-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>
                  {language === 'bn' ? 'ফ্যাক্টরি রিসেট ও সমস্ত ডেটা মুছুন' : 'Factory Reset & Delete All Data'}
                </span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed mb-4">
                {language === 'bn' 
                  ? 'আপনি কি খাতা সম্পূর্ণ নতুনভাবে শুরু করতে চান? এটি আপনার সমস্ত আয়, ব্যয়, ঋণ, ধার ও ডকুমেন্ট রেকর্ড মুছে ফেলবে এবং আপনাকে পুনরায় নতুন করে খাতা সেটআপ করার সুযোগ দিবে।' 
                  : 'Start fresh with a clean slate? This will wipe all recorded transactions, loans, lending ledger, and uploaded documents.'}
              </p>

              <div className="p-3 bg-white rounded-xl border border-rose-200/80 mb-4 text-xs space-y-1 text-slate-600">
                <p>• বর্তমান সংরক্ষিত লেনদেন: <strong className="text-rose-600 font-bold">{transactionCount} টি</strong></p>
                <p>• আপলোডকৃত ভাউচার/ডকুমেন্ট: <strong className="text-rose-600 font-bold">{documentCount} টি</strong></p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenDeleteAllData) onOpenDeleteAllData();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {language === 'bn' ? 'সমস্ত ডেটা মুছে ফেলুন (Delete All Data)' : 'Delete All Data Permanently'}
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {t.cancel}
          </button>
        </div>
      </div>

      {/* CONFIRMATION MODAL BEFORE MUTATING GOOGLE SHEETS */}
      {showConfirmSyncDialog && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-bold text-slate-900 text-base">
                {t.confirmSyncTitle}
              </h4>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {t.confirmSyncBody}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmSyncDialog(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmSync}
                className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
              >
                {t.confirmButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
