import React from 'react';
import { AppState, AppSettings, WhatsAppTargetApp } from './types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  onReset: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, state, updateSettings, onReset }) => {
  if (!isOpen) return null;
  const s = state.settings;
  const isBn = s.lang === 'bn';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="p-5 border-b dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <i className="fas fa-cog text-xl"></i>
            <h3 className="text-xl font-bold">{isBn ? 'সেটিংস' : 'Settings'}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-lg transition"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-100">
          
          {/* Preferred WhatsApp App */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2">
              <i className="fab fa-whatsapp text-emerald-500 text-lg"></i>
              <h5 className="font-bold text-sm">
                {isBn ? 'ডিফল্ট হোয়াটসঅ্যাপ অ্যাপ (ক্লোন/ডুয়াল সাপোর্ট)' : 'Default WhatsApp App (Clone/Dual Support)'}
              </h5>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isBn 
                ? 'আপনার মোবাইলে যদি মূল বা ক্লোন হোয়াটসঅ্যাপ বিজনেস থাকে, তাহলে পছন্দমতো নির্বাচন করুন।'
                : 'Select your preferred target app if you use Dual Messenger, App Cloner, or Work Profile.'}
            </p>
            <select 
              value={s.preferredApp}
              onChange={(e) => updateSettings({ preferredApp: e.target.value as WhatsAppTargetApp })}
              className="w-full mt-2 p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none transition text-sm"
            >
              <option value="ask">
                {isBn ? '💬 প্রতিবার জিজ্ঞাসা করুন (Ask Every Time)' : '💬 Ask every time'}
              </option>
              <option value="business">
                {isBn ? '🏢 হোয়াটসঅ্যাপ বিজনেস - মূল (WhatsApp Business Main)' : '🏢 WhatsApp Business (Main)'}
              </option>
              <option value="business_clone">
                {isBn ? '👥 হোয়াটসঅ্যাপ বিজনেস - ক্লোন (WhatsApp Business Clone / Dual App)' : '👥 WhatsApp Business Clone (Dual / Colon App)'}
              </option>
              <option value="standard">
                {isBn ? '🟢 সাধারণ হোয়াটসঅ্যাপ - মূল (WhatsApp Standard Main)' : '🟢 WhatsApp Standard (Main)'}
              </option>
              <option value="clone">
                {isBn ? '🔄 সাধারণ হোয়াটসঅ্যাপ - ক্লোন (WhatsApp Standard Clone)' : '🔄 WhatsApp Standard Clone (Dual App)'}
              </option>
              <option value="chooser">
                {isBn ? '📱 সিস্টেম অ্যাপ পিকার (সব ক্লোন ও ডুয়াল অ্যাপ তালিকা)' : '📱 System App Chooser (Best for all cloned apps)'}
              </option>
              <option value="web">
                {isBn ? '🌐 সরাসরি ওয়েব লিংক (Direct wa.me Link)' : '🌐 Direct Browser Link (wa.me)'}
              </option>
            </select>
          </div>

          {/* Theme & Display */}
          <div className="space-y-3">
            <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isBn ? 'থিম ও প্রদর্শন' : 'Theme & Display'}
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => updateSettings({ mode: 'light' })} 
                className={`py-3.5 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition ${
                  s.mode === 'light' 
                    ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' 
                    : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'
                }`}
              >
                ☀️ {isBn ? 'লাইট থিম' : 'Light Mode'}
              </button>
              <button 
                type="button"
                onClick={() => updateSettings({ mode: 'dark' })} 
                className={`py-3.5 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition ${
                  s.mode === 'dark' 
                    ? 'border-purple-600 bg-purple-900/30 text-purple-400' 
                    : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'
                }`}
              >
                🌙 {isBn ? 'ডার্ক থিম' : 'Dark Mode'}
              </button>
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-bold">
              <span>{isBn ? 'ফন্ট সাইজ' : 'Font Size'}</span>
              <span className="text-purple-600 font-mono">{s.fontPercent || 100}%</span>
            </div>
            <input 
              type="range" 
              min="85" 
              max="125" 
              step="5"
              value={s.fontPercent || 100}
              onChange={(e) => updateSettings({ fontPercent: Number(e.target.value) })}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Message Header & Footer Customization */}
          <div className="space-y-3 pt-2">
            <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isBn ? 'বার্তা হেডার ও ফুটার টেমপ্লেট' : 'Message Header & Footer Templates'}
            </h5>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 opacity-70">
                  {isBn ? 'হেডার (বাংলা) — _____ দিয়ে ক্যাটাগরি নাম বোঝাবে' : 'Header (Bangla) — _____ is category placeholder'}
                </label>
                <input 
                  type="text" 
                  value={s.headerBn} 
                  onChange={(e) => updateSettings({ headerBn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 opacity-70">
                  {isBn ? 'ফুটার (বাংলা)' : 'Footer (Bangla)'}
                </label>
                <textarea 
                  rows={2}
                  value={s.footerBn} 
                  onChange={(e) => updateSettings({ footerBn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 opacity-70">
                  {isBn ? 'হেডার (ইংরেজি)' : 'Header (English)'}
                </label>
                <input 
                  type="text" 
                  value={s.headerEn} 
                  onChange={(e) => updateSettings({ headerEn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 opacity-70">
                  {isBn ? 'ফুটার (ইংরেজি)' : 'Footer (English)'}
                </label>
                <textarea 
                  rows={2}
                  value={s.footerEn} 
                  onChange={(e) => updateSettings({ footerEn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t dark:border-slate-800 flex flex-col gap-3">
             <button 
               type="button"
               onClick={() => { 
                 if (confirm(isBn ? 'আপনি কি সব ডাটা মুছে ডিফল্টে ফিরতে চান?' : 'Are you sure you want to reset all data?')) {
                   onReset(); 
                   onClose();
                 }
               }} 
               className="w-full py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 rounded-xl font-bold transition text-sm"
             >
               <i className="fas fa-trash-alt mr-2"></i>
               {isBn ? 'সব ডাটা রিসেট করুন' : 'Reset All Data'}
             </button>
             <button 
               type="button"
               onClick={onClose} 
               className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition"
             >
               {isBn ? 'সেভ ও বন্ধ করুন' : 'Save & Close'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
