import React, { useState } from 'react';
import { AppState, HistoryItem, WhatsAppTargetApp } from './types';

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const HistoryView: React.FC<Props> = ({ state, setState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemForResend, setSelectedItemForResend] = useState<HistoryItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const lang = state.settings.lang;
  const isBn = lang === 'bn';
  const isDark = state.settings.mode === 'dark';

  const history = state.history || [];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredHistory = history.filter(item => 
    item.phone.includes(searchTerm) || 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteItem = (id: string) => {
    if (confirm(isBn ? 'আপনি কি এই রেকর্ডটি মুছতে চান?' : 'Do you want to delete this record?')) {
      setState(prev => ({
        ...prev,
        history: prev.history.filter(it => it.id !== id)
      }));
      showToast(isBn ? 'রেকর্ড মুছে ফেলা হয়েছে' : 'Item deleted');
    }
  };

  const clearAll = () => {
    if (confirm(isBn ? 'সব ইতিহাস মুছতে চান?' : 'Clear all message history?')) {
      setState(prev => ({ ...prev, history: [] }));
      showToast(isBn ? 'সব ইতিহাস মোছা হয়েছে' : 'All history cleared');
    }
  };

  const copyMessage = async (msg: string) => {
    try {
      await navigator.clipboard.writeText(msg);
      showToast(isBn ? 'বার্তাটি ক্লিপবোর্ডে কপি করা হয়েছে!' : 'Message copied to clipboard!');
    } catch (err) {
      showToast(isBn ? 'কপি করতে সমস্যা হয়েছে' : 'Failed to copy');
    }
  };

  const handleResendClick = (item: HistoryItem) => {
    if (state.settings.preferredApp === 'ask') {
      setSelectedItemForResend(item);
    } else {
      executeResend(item.phone, item.message, state.settings.preferredApp);
    }
  };

  const executeResend = (phone: string, msg: string, appType: WhatsAppTargetApp) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const encoded = encodeURIComponent(msg);
    const isAndroid = /Android/i.test(navigator.userAgent);
    let url = '';

    if (appType === 'business') {
      if (isAndroid) {
        url = `intent://send?phone=${cleanPhone}&text=${encoded}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`;
      } else {
        url = `whatsapp-business://send?phone=${cleanPhone}&text=${encoded}`;
      }
      setTimeout(() => window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank'), 1000);
    } else if (appType === 'business_clone') {
      if (isAndroid) {
        url = `intent://send?phone=${cleanPhone}&text=${encoded}#Intent;action=android.intent.action.VIEW;scheme=whatsapp-business;end`;
      } else {
        url = `whatsapp-business://send?phone=${cleanPhone}&text=${encoded}`;
      }
      setTimeout(() => window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank'), 1000);
    } else if (appType === 'clone') {
      if (isAndroid) {
        url = `intent://send?phone=${cleanPhone}&text=${encoded}#Intent;action=android.intent.action.VIEW;scheme=whatsapp;end`;
      } else {
        url = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
      }
      setTimeout(() => window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank'), 1000);
    } else if (appType === 'chooser') {
      if (isAndroid) {
        url = `intent://send?phone=${cleanPhone}&text=${encoded}#Intent;action=android.intent.action.VIEW;scheme=whatsapp;end`;
      } else {
        url = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
      }
      setTimeout(() => window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank'), 1000);
    } else {
      url = `https://wa.me/${cleanPhone}?text=${encoded}`;
      window.open(url, '_blank');
      setSelectedItemForResend(null);
      return;
    }

    try {
      window.location.href = url;
    } catch (e) {
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    }
    setSelectedItemForResend(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[300] bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in text-sm font-semibold">
          <i className="fas fa-check-circle text-emerald-400 dark:text-emerald-600"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      <div className={`rounded-3xl p-6 shadow-xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200/80 backdrop-blur-md'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
              <i className="fas fa-history"></i>
              <span>{isBn ? 'মেসেজ পাঠানোর ইতিহাস' : 'Message History'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {isBn ? `মোট ${history.length}টি বার্তা সংরক্ষিত রয়েছে` : `${history.length} messages recorded`}
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder={isBn ? "নম্বর বা বিষয়ে খুঁজুন..." : "Search phone or title..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`flex-1 md:w-64 border rounded-xl p-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-purple-500 ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            />
            {history.length > 0 && (
              <button 
                onClick={clearAll}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
              >
                <i className="fas fa-trash-alt"></i>
                <span>{isBn ? 'ক্লিয়ার' : 'Clear All'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div 
                key={item.id} 
                className={`rounded-2xl p-4 border transition hover:shadow-md ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/90 border-slate-200'}`}
              >
                <div className="flex justify-between items-start mb-2 gap-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {item.title}
                    </div>
                    <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                      {item.phone}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(item.timestamp).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => handleResendClick(item)} 
                      title={isBn ? 'পুনরায় পাঠান (বিজনেস / ক্লোন সহ)' : 'Resend (With Business / Clone support)'}
                      className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1.5 text-xs font-bold transition"
                    >
                      <i className="fab fa-whatsapp"></i>
                      <span>{isBn ? 'রি-সেন্ড' : 'Resend'}</span>
                    </button>
                    <button 
                      onClick={() => copyMessage(item.message)} 
                      title={isBn ? 'কপি বার্তা' : 'Copy'} 
                      className="w-8 h-8 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center transition"
                    >
                      <i className="fas fa-copy text-xs"></i>
                    </button>
                    <button 
                      onClick={() => deleteItem(item.id)} 
                      title={isBn ? 'মুছুন' : 'Delete'} 
                      className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 dark:bg-rose-950/60 dark:text-rose-300 flex items-center justify-center transition"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </div>

                <div className={`mt-2 p-3 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-24 overflow-y-auto border ${isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  {item.message}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 opacity-40 italic">
              <i className="fas fa-history text-5xl mb-3 block"></i>
              <p className="text-sm font-semibold">
                {isBn ? 'কোনো মেসেজের ইতিহাস পাওয়া যায়নি' : 'No message history found'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resend App Selector Modal */}
      {selectedItemForResend && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-base font-bold text-center mb-2">
              {isBn ? 'পুনরায় পাঠানোর অ্যাপ বেছে নিন' : 'Select App to Resend'}
            </h4>
            <button 
              onClick={() => executeResend(selectedItemForResend.phone, selectedItemForResend.message, 'business')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
            >
              <i className="fas fa-briefcase"></i> WhatsApp Business (Main)
            </button>
            <button 
              onClick={() => executeResend(selectedItemForResend.phone, selectedItemForResend.message, 'business_clone')}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
            >
              <i className="fas fa-clone"></i> WhatsApp Business (Clone / Dual)
            </button>
            <button 
              onClick={() => executeResend(selectedItemForResend.phone, selectedItemForResend.message, 'chooser')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
            >
              <i className="fas fa-mobile-alt"></i> System App Chooser
            </button>
            <button 
              onClick={() => executeResend(selectedItemForResend.phone, selectedItemForResend.message, 'standard')}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
            >
              <i className="fab fa-whatsapp"></i> WhatsApp Standard
            </button>
            <button 
              onClick={() => setSelectedItemForResend(null)} 
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 text-center"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default HistoryView;
