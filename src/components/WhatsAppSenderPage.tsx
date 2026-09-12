import React, { useState, useEffect, useCallback } from 'react';
import type { Language, UserProfile, Transaction } from '../types';
import { AppState, AppSettings } from './whatsapp/types';
import { DEFAULT_STATE, STORAGE_KEY } from './whatsapp/constants';
import { WhatsAppSender } from './whatsapp/WhatsAppSender';
import { HistoryView } from './whatsapp/HistoryView';
import { AgeCalculator } from './whatsapp/AgeCalculator';
import { LiftingCalculator } from './whatsapp/LiftingCalculator';
import { SettingsModal } from './whatsapp/SettingsModal';
import {
  MessageSquare,
  History,
  Calendar,
  Calculator,
  Settings,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface WhatsAppSenderPageProps {
  transactions?: Transaction[];
  language: Language;
  userProfile?: UserProfile | null;
  onNavigateHome?: () => void;
}

type NavTab = 'sender' | 'history' | 'age' | 'lifting';

export const WhatsAppSenderPage: React.FC<WhatsAppSenderPageProps> = ({
  language: appLanguage,
  userProfile,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<NavTab>('sender');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load and sync AppState from localStorage
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : DEFAULT_STATE;
      if (!parsed.history) parsed.history = [];
      if (!parsed.presets || parsed.presets.length === 0) {
        parsed.presets = DEFAULT_STATE.presets;
      }
      if (!parsed.settings) parsed.settings = DEFAULT_STATE.settings;
      return parsed;
    } catch {
      return DEFAULT_STATE;
    }
  });

  // Sync state changes to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }, [state]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  }, []);

  const toggleLanguage = useCallback(() => {
    const nextLang = state.settings.lang === 'bn' ? 'en' : 'bn';
    updateSettings({ lang: nextLang });
  }, [state.settings.lang, updateSettings]);

  const isBn = state.settings.lang === 'bn';
  const isDark = state.settings.mode === 'dark';

  return (
    <div 
      className={`min-h-[85vh] rounded-3xl transition-colors duration-300 pb-16 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-transparent text-slate-900'
      }`}
      style={{ fontSize: `${state.settings.fontPercent || 100}%` }}
    >
      {/* Top Bar / Navigation Header */}
      <div className={`rounded-3xl p-4 sm:p-5 border mb-6 shadow-xs ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200/90 backdrop-blur-md'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Brand & Title */}
          <div className="flex items-center gap-3.5">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                title={isBn ? 'হোমে ফিরে যান' : 'Back to Home'}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <i className="fab fa-whatsapp text-2xl animate-pulse"></i>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500">
                  WA Sender+
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider">
                  Checklist Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isBn
                  ? 'হোয়াটসঅ্যাপ ও বিজনেস ক্লোন অ্যাপের জন্য স্মার্ট চেকলিস্ট সেন্ডার'
                  : 'Smart Checklist Sender for WhatsApp & Business Dual Apps'}
              </p>
            </div>
          </div>

          {/* Quick Actions (Language & Settings) */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              {state.settings.lang === 'bn' ? '🇺🇸 EN' : '🇧🇩 বাংলা'}
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title={isBn ? 'সেটিংস' : 'Settings'}
            >
              <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">{isBn ? 'সেটিংস' : 'Settings'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('sender')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'sender'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isBn ? 'চেকলিস্ট সেন্ডার' : 'Checklist Sender'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{isBn ? 'মেসেজ ইতিহাস' : 'History'}</span>
            {state.history.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {state.history.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('age')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'age'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{isBn ? 'বয়স ক্যালকুলেটর' : 'Age Calculator'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lifting')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'lifting'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{isBn ? 'লিফটিং ক্যালকুলেশন' : 'Lifting Calculation'}</span>
          </button>
        </div>
      </div>

      {/* Content Area according to active tab */}
      <div className="relative">
        {activeTab === 'sender' && (
          <WhatsAppSender state={state} setState={setState} />
        )}

        {activeTab === 'history' && (
          <HistoryView state={state} setState={setState} />
        )}

        {activeTab === 'age' && (
          <AgeCalculator lang={state.settings.lang} mode={state.settings.mode} />
        )}

        {activeTab === 'lifting' && (
          <LiftingCalculator lang={state.settings.lang} mode={state.settings.mode} />
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        updateSettings={updateSettings}
        onReset={() => setState(DEFAULT_STATE)}
      />

      {/* Footer Signature */}
      <div className="mt-12 text-center text-xs opacity-50 font-semibold tracking-wide border-t border-slate-200 dark:border-slate-800 pt-6">
        All copyright reserved to Md Bappy Hossain • WhatsApp Sender Plus
      </div>
    </div>
  );
};

export default WhatsAppSenderPage;
