import { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  CloudOff, 
  RefreshCw, 
  Globe, 
  ExternalLink, 
  User as UserIcon,
  LogOut,
  Sparkles,
  Settings,
  Trash2,
  Edit3,
  Sliders
} from 'lucide-react';
import type { SheetConfig, ActivePage, Language, UserProfile, GoogleUser } from '../types';

interface NavbarProps {
  user: GoogleUser | null;
  sheetConfig: SheetConfig;
  isSyncing: boolean;
  onSync: () => void;
  onOpenSyncModal: () => void;
  onOpenDailyLimitModal?: () => void;
  onLogin: () => void;
  onLogout: () => void;
  language: Language;
  onToggleLanguage: () => void;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  userProfile?: UserProfile | null;
  onOpenRegistration?: () => void;
  onOpenDeleteAllData?: () => void;
}

export const Navbar = ({
  user,
  sheetConfig,
  isSyncing,
  onSync,
  onOpenSyncModal,
  onOpenDailyLimitModal,
  onLogin,
  onLogout,
  language,
  onToggleLanguage,
  activePage,
  onNavigate,
  userProfile,
  onOpenRegistration,
  onOpenDeleteAllData,
}: NavbarProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const t = {
    appName: language === 'bn' ? 'খাতাপত্র ক্লাউড' : 'KhataPotro Cloud',
    subTitle: userProfile?.businessName || (language === 'bn' ? 'স্মার্ট হিসাব ও ইনভেন্টরি' : 'Smart Ledger & Inventory'),
    syncSheet: language === 'bn' ? 'শিট সিঙ্ক' : 'Sync Sheets',
    openSheet: language === 'bn' ? 'গুগল শিট খুলুন' : 'Open Sheet',
    connected: language === 'bn' ? 'গুগল শিট সংযুক্ত' : 'Sheets Connected',
    notConnected: language === 'bn' ? 'শিট সংযোগ করুন' : 'Connect Sheet',
    signIn: language === 'bn' ? 'গুগল সাইন ইন' : 'Sign in with Google',
    signOut: language === 'bn' ? 'লগআউট' : 'Sign Out',
    editProfile: language === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings',
    dangerZone: language === 'bn' ? 'সমস্ত ডেটা মুছুন' : 'Delete All Data',
  };

  const navLinks: { id: ActivePage; labelBn: string; labelEn: string }[] = [
    { id: 'home', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard' },
    { id: 'report', labelBn: 'সার্চ ও রিপোর্ট', labelEn: 'Reports' },
    { id: 'loans', labelBn: 'ঋণ হিসাব (দেনা)', labelEn: 'Loans' },
    { id: 'lending', labelBn: 'ধার হিসাব (পাওনা)', labelEn: 'Lending' },
    { id: 'vault', labelBn: 'ডকুমেন্ট ভল্ট', labelEn: 'Docs' },
  ];

  const displayName = userProfile?.name || user?.displayName || 'Bappy';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo & Branding */}
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                  {t.appName}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-none mt-1 truncate max-w-[140px] sm:max-w-xs">
                {t.subTitle}
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
            {navLinks.map((link) => {
              const isActive = activePage === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => onNavigate(link.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'bn' ? link.labelBn : link.labelEn}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Google Sheets Status Pill */}
            {sheetConfig.spreadsheetId ? (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.connected}</span>
                <a
                  href={sheetConfig.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetConfig.spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-emerald-600 hover:text-emerald-900 transition-colors inline-flex items-center"
                  title={t.openSheet}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenSyncModal}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium hover:bg-amber-100 transition-colors"
              >
                <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.notConnected}</span>
              </button>
            )}

            {/* Quick Sync Button */}
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all disabled:opacity-60 shadow-xs"
              title={t.syncSheet}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'সিঙ্ক হচ্ছে...' : t.syncSheet}</span>
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={onToggleLanguage}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'bn' ? 'EN' : 'বাং'}</span>
            </button>

            {/* User Profile / Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 rounded-full sm:rounded-xl sm:px-2.5 sm:py-1 border border-slate-200 bg-white hover:bg-slate-50 hover:ring-2 hover:ring-blue-400 transition-all text-xs font-bold text-slate-700"
                title={user?.email || displayName}
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    className="w-7 h-7 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[80px] truncate">{displayName}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="pb-2.5 border-b border-slate-100 mb-2">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-blue-600 font-medium truncate">
                      {userProfile?.businessName || 'ব্যক্তিগত খাতা'}
                    </p>
                    {user?.email && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                        {user.email}
                      </p>
                    )}
                  </div>

                  {/* Profile Edit / Settings */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onOpenRegistration) onOpenRegistration();
                    }}
                    className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span>{t.editProfile}</span>
                  </button>

                  {/* Daily Expense Limit Modal */}
                  {onOpenDailyLimitModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenDailyLimitModal();
                      }}
                      className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <Sliders className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'bn' ? 'দৈনিক খরচের লিমিট' : 'Daily Expense Limit'}</span>
                    </button>
                  )}

                  {/* Google Sheets Modal */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSyncModal();
                    }}
                    className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>{language === 'bn' ? 'সেটিংস ও শিট সিঙ্ক' : 'Settings & Sheets'}</span>
                  </button>

                  {/* Sign In with Google if not logged in */}
                  {!user && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogin();
                      }}
                      className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-xl transition-colors mt-1 font-semibold"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>{t.signIn}</span>
                    </button>
                  )}

                  {/* Danger Zone: Delete All Data */}
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onOpenDeleteAllData) onOpenDeleteAllData();
                      }}
                      className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>{t.dangerZone}</span>
                    </button>

                    {user && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-xl transition-colors mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t.signOut}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
