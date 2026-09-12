import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppState, ChecklistItem, Preset, HistoryItem, WhatsAppTargetApp } from './types';

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const WhatsAppSender: React.FC<Props> = ({ state, setState }) => {
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const [activeItems, setActiveItems] = useState<ChecklistItem[]>([]);
  const [phone, setPhone] = useState('+880');
  const [title, setTitle] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [includeUnchecked, setIncludeUnchecked] = useState(false);
  const [includeDateTime, setIncludeDateTime] = useState(true);
  const [previewText, setPreviewText] = useState('');
  
  // Modals & UI States
  const [isNewPresetModalOpen, setIsNewPresetModalOpen] = useState(false);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [newItemInput, setNewItemInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Preset Form
  const [presetFormNameBn, setPresetFormNameBn] = useState('');
  const [presetFormNameEn, setPresetFormNameEn] = useState('');
  const [presetFormItemsBn, setPresetFormItemsBn] = useState('');
  const [presetFormItemsEn, setPresetFormItemsEn] = useState('');

  const itemInputRef = useRef<HTMLInputElement>(null);
  const lang = state.settings.lang;
  const isBn = lang === 'bn';
  const isDark = state.settings.mode === 'dark';

  // Helper toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Active preset reference
  const activePreset: Preset | null = useMemo(() => {
    if (activePresetIndex >= 0 && activePresetIndex < state.presets.length) {
      return state.presets[activePresetIndex];
    }
    return null;
  }, [activePresetIndex, state.presets]);

  // Load preset checklist items when preset or language changes
  useEffect(() => {
    if (activePreset) {
      const items = isBn ? (activePreset.itemsBn || []) : (activePreset.itemsEn || []);
      setActiveItems(items.map(text => ({ text, checked: false })));
    } else if (state.presets.length > 0 && activePresetIndex === -1) {
      setActivePresetIndex(0);
    }
  }, [lang, activePresetIndex, activePreset, state.presets.length]);

  const headerText = useMemo(() => {
    const template = isBn ? state.settings.headerBn : state.settings.headerEn;
    const name = activePreset ? (isBn ? (activePreset.nameBn || activePreset.nameEn) : (activePreset.nameEn || activePreset.nameBn)) : '';
    return template.replace(/_____/g, name || '');
  }, [isBn, state.settings, activePreset]);

  const footerText = useMemo(() => {
    return isBn ? state.settings.footerBn : state.settings.footerEn;
  }, [isBn, state.settings]);

  // Message builder
  const buildMessage = () => {
    const lines: string[] = [];
    if (headerText) lines.push(headerText);
    if (title.trim()) lines.push('\n*' + title.trim() + '*');

    const itemsToDisplay = activeItems.filter(it => it.checked || includeUnchecked);
    if (itemsToDisplay.length > 0) {
      lines.push('\n');
      itemsToDisplay.forEach(it => {
        lines.push((it.checked ? '✅ ' : '▫️ ') + it.text);
      });
    }

    if (extraNote.trim()) lines.push('\n' + extraNote.trim());
    
    if (includeDateTime) {
      const now = new Date();
      const dateStr = now.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      lines.push('\n\n🕒 ' + dateStr);
    }

    if (footerText) lines.push('\n\n' + footerText);

    return lines.join('\n').trim();
  };

  useEffect(() => {
    setPreviewText(buildMessage());
  }, [activeItems, title, extraNote, includeUnchecked, includeDateTime, headerText, footerText, lang]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    val = val.replace(/[^\d+-\s]/g, '');
    setPhone(val);
  };

  const selectFromContacts = async () => {
    try {
      if ('contacts' in navigator && 'ContactsManager' in window) {
        // @ts-ignore
        const contacts = await navigator.contacts.select(['tel', 'name'], { multiple: false });
        if (contacts && contacts.length > 0 && contacts[0].tel && contacts[0].tel.length > 0) {
          let selectedPhone = contacts[0].tel[0].replace(/[\s-]/g, '');
          if (selectedPhone.startsWith('01')) {
            selectedPhone = '+88' + selectedPhone;
          } else if (!selectedPhone.startsWith('+')) {
            selectedPhone = '+' + selectedPhone;
          }
          setPhone(selectedPhone);
          if (contacts[0].name && contacts[0].name.length > 0) {
            setTitle(prev => prev || contacts[0].name[0]);
          }
          showToast(isBn ? 'কন্টাক্ট নম্বর লোড হয়েছে' : 'Contact selected');
        }
      } else {
        showToast(isBn ? 'এই ব্রাউজারে কন্টাক্ট পিকার সাপোর্ট নেই' : 'Contact picker not supported in this browser');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAction = () => {
    if (state.settings.preferredApp === 'ask') {
      setIsAppModalOpen(true);
    } else {
      executeSend(state.settings.preferredApp);
    }
  };

  // Launching WhatsApp (Regular, Business, Clone, Android Intent Chooser)
  const executeSend = async (appType: WhatsAppTargetApp) => {
    const msg = buildMessage();
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const encoded = encodeURIComponent(msg);

    // Save to history
    setState(prev => ({
      ...prev,
      history: [{
        id: Math.random().toString(36).substring(2, 10),
        phone,
        title: title || (activePreset ? (isBn ? activePreset.nameBn : activePreset.nameEn) : 'Message'),
        message: msg,
        timestamp: new Date().toISOString()
      }, ...(prev.history || [])].slice(0, 150)
    }));

    // Auto copy message to clipboard for convenience
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(msg);
      }
    } catch (e) {
      // ignore clipboard error
    }

    setIsAppModalOpen(false);

    // Native Web Share API option
    if (appType === 'share') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: title || 'WhatsApp Message',
            text: msg
          });
          showToast(isBn ? 'শেয়ার মেনু খোলা হয়েছে' : 'Share sheet opened');
          return;
        } catch (err) {
          // Fall back to chooser
        }
      }
    }

    let url = '';
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (appType === 'business') {
      // WhatsApp Business Main
      if (isAndroid) {
        url = `intent://send?phone=${cleanPhone}&text=${encoded}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`;
      } else if (isIOS) {
        url = `whatsapp-business://send?phone=${cleanPhone}&text=${encoded}`;
      } else {
        url = `whatsapp-business://send?phone=${cleanPhone}&text=${encoded}`;
      }
      showToast(isBn ? 'হোয়াটসঅ্যাপ বিজনেস চালু হচ্ছে...' : 'Opening WhatsApp Business...');

      setTimeout(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
      }, 1000);

    } else if (appType === 'business_clone') {
      if (isAndroid) {
        url = `intent://send?phone=${cleanPhone}&text=${encoded}#Intent;action=android.intent.action.VIEW;scheme=whatsapp-business;end`;
      } else {
        url = `whatsapp-business://send?phone=${cleanPhone}&text=${encoded}`;
      }
      showToast(isBn ? 'ক্লোন হোয়াটসঅ্যাপ বিজনেস চালু হচ্ছে...' : 'Opening Clone WhatsApp Business...');

      setTimeout(() => {
        window.location.href = `whatsapp-business://send?phone=${cleanPhone}&text=${encoded}`;
      }, 300);

      setTimeout(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
      }, 1100);

    } else if (appType === 'clone') {
      if (isAndroid) {
        url = `intent://send?phone=${cleanPhone}&text=${encoded}#Intent;action=android.intent.action.VIEW;scheme=whatsapp;end`;
      } else {
        url = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
      }
      showToast(isBn ? 'ক্লোন হোয়াটসঅ্যাপ চালু হচ্ছে...' : 'Opening Clone WhatsApp...');

      setTimeout(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
      }, 1000);

    } else if (appType === 'chooser') {
      if (isAndroid) {
        url = `intent://send?phone=${cleanPhone}&text=${encoded}#Intent;action=android.intent.action.VIEW;scheme=whatsapp;end`;
      } else {
        url = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
      }
      showToast(isBn ? 'অ্যাপ সিলেক্টর খোলা হচ্ছে...' : 'Opening App Chooser...');

      setTimeout(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
      }, 1000);

    } else if (appType === 'web') {
      url = `https://wa.me/${cleanPhone}?text=${encoded}`;
      window.open(url, '_blank');
      showToast(isBn ? 'ওয়েব লিঙ্ক খোলা হয়েছে' : 'Opened wa.me link');
      return;

    } else {
      // Standard WhatsApp
      if (isAndroid) {
        url = `intent://send?phone=${cleanPhone}&text=${encoded}#Intent;package=com.whatsapp;scheme=whatsapp;end`;
      } else {
        url = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
      }
      showToast(isBn ? 'হোয়াটসঅ্যাপ চালু হচ্ছে...' : 'Opening WhatsApp...');

      setTimeout(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
      }, 1000);
    }

    try {
      window.location.href = url;
    } catch (e) {
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    }
  };

  const copyFullMessage = async () => {
    const msg = buildMessage();
    try {
      await navigator.clipboard.writeText(msg);
      showToast(isBn ? 'পুরো বার্তাটি কপি করা হয়েছে!' : 'Full message copied to clipboard!');
    } catch (err) {
      showToast(isBn ? 'কপি করতে সমস্যা হয়েছে' : 'Failed to copy');
    }
  };

  const copyPhone = async () => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    try {
      await navigator.clipboard.writeText(cleanPhone);
      showToast(isBn ? 'ফোন নম্বর কপি করা হয়েছে!' : 'Phone number copied!');
    } catch (err) {
      showToast(isBn ? 'কপি করতে সমস্যা হয়েছে' : 'Failed to copy');
    }
  };

  const toggleItem = (idx: number) => {
    setActiveItems(prev => prev.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it));
  };

  const deleteItem = (idx: number) => {
    setActiveItems(prev => prev.filter((_, i) => i !== idx));
  };

  const addNewItemToList = () => {
    if (!newItemInput.trim()) return;
    setActiveItems(prev => [...prev, { text: newItemInput.trim(), checked: false }]);
    setNewItemInput('');
    setTimeout(() => itemInputRef.current?.focus(), 20);
  };

  const saveNewPreset = () => {
    if (!presetFormNameBn.trim() && !presetFormNameEn.trim()) {
      showToast(isBn ? 'ক্যাটাগরির নাম লিখুন' : 'Please provide category name');
      return;
    }
    const itemsBn = presetFormItemsBn.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    const itemsEn = presetFormItemsEn.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    const newPreset: Preset = {
      nameBn: presetFormNameBn.trim() || presetFormNameEn.trim(),
      nameEn: presetFormNameEn.trim() || presetFormNameBn.trim(),
      itemsBn: itemsBn.length > 0 ? itemsBn : (itemsEn.length > 0 ? itemsEn : ['আইটেম ১', 'আইটেম ২']),
      itemsEn: itemsEn.length > 0 ? itemsEn : (itemsBn.length > 0 ? itemsBn : ['Item 1', 'Item 2'])
    };

    setState(prev => ({
      ...prev,
      presets: [...prev.presets, newPreset]
    }));
    setActivePresetIndex(state.presets.length);
    setIsNewPresetModalOpen(false);
    setPresetFormNameBn('');
    setPresetFormNameEn('');
    setPresetFormItemsBn('');
    setPresetFormItemsEn('');
    showToast(isBn ? 'নতুন ক্যাটাগরি সংরক্ষিত হয়েছে' : 'New category created');
  };

  const deleteActivePreset = () => {
    if (activePresetIndex < 0 || activePresetIndex >= state.presets.length) return;
    if (confirm(isBn ? 'আপনি কি এই ক্যাটাগরি মুছে ফেলতে চান?' : 'Delete this category?')) {
      setState(prev => ({
        ...prev,
        presets: prev.presets.filter((_, i) => i !== activePresetIndex)
      }));
      setActivePresetIndex(0);
      showToast(isBn ? 'ক্যাটাগরি মোছা হয়েছে' : 'Category deleted');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 text-sm font-semibold">
          <i className="fas fa-check-circle text-emerald-400 dark:text-emerald-600 text-base"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Grid: Left = Presets & Checklist; Right = Recipient & Sender */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* Preset Categories Card */}
          <div className={`rounded-3xl p-6 shadow-sm border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200/80 backdrop-blur-md'}`}>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center font-bold">
                  <i className="fas fa-layer-group text-sm"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isBn ? 'ক্যাটাগরি ও প্রি-সেট' : 'Categories & Presets'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'আপনার প্রয়োজন অনুযায়ী প্রি-সেট বেছে নিন' : 'Select a pre-configured template'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {state.presets.length > 0 && (
                  <button 
                    onClick={deleteActivePreset}
                    title={isBn ? 'বর্তমান ক্যাটাগরি মুছুন' : 'Delete current category'}
                    className="p-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-500 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                )}
                <button 
                  onClick={() => setIsNewPresetModalOpen(true)} 
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fas fa-plus"></i>
                  <span>{isBn ? 'নতুন ক্যাটাগরি' : 'New Preset'}</span>
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {state.presets.map((p, idx) => {
                const isSelected = activePresetIndex === idx;
                const displayName = isBn ? (p.nameBn || p.nameEn) : (p.nameEn || p.nameBn);
                const itemCount = (isBn ? p.itemsBn : p.itemsEn)?.length || 0;

                return (
                  <div 
                    key={idx} 
                    onClick={() => setActivePresetIndex(idx)} 
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/30 shadow-md ring-2 ring-purple-400/30' 
                        : isDark ? 'border-slate-700 bg-slate-800/50 hover:border-purple-400' : 'border-slate-200 bg-white/70 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className={`font-bold text-sm truncate ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {displayName}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono font-bold">
                        {itemCount}
                      </span>
                    </div>
                  </div>
                );
              })}
              {state.presets.length === 0 && (
                <div className="col-span-full text-center py-6 text-slate-400 text-xs">
                  {isBn ? 'কোনো ক্যাটাগরি তৈরি করা নেই। "নতুন ক্যাটাগরি" বাটনে চাপ দিন।' : 'No categories available. Click "New Preset" to add one.'}
                </div>
              )}
            </div>
          </div>

          {/* Checklist Items Card */}
          <div className={`rounded-3xl p-6 shadow-sm border min-h-[380px] flex flex-col justify-between ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200/80 backdrop-blur-md'}`}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                    <i className="fas fa-tasks text-xs"></i>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isBn ? 'চেকলিস্টের আইটেমসমূহ' : 'Checklist Items'}
                  </h3>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  {activeItems.filter(i => i.checked).length} / {activeItems.length} {isBn ? 'সম্পন্ন' : 'checked'}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {activeItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition ${
                      item.checked 
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40' 
                        : isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800' : 'bg-white/80 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      id={`chk-${idx}`}
                      checked={item.checked} 
                      onChange={() => toggleItem(idx)} 
                      className="w-5 h-5 rounded-lg text-purple-600 accent-purple-600 cursor-pointer"
                    />
                    <label 
                      htmlFor={`chk-${idx}`}
                      className={`flex-1 text-sm font-medium cursor-pointer select-none ${
                        item.checked 
                          ? 'line-through text-slate-400 dark:text-slate-500 font-normal' 
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.text}
                    </label>
                    <button 
                      onClick={() => deleteItem(idx)} 
                      title={isBn ? 'মুছুন' : 'Delete'}
                      className="text-slate-400 hover:text-rose-500 p-1.5 transition cursor-pointer"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                ))}
                {activeItems.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    <i className="fas fa-clipboard-list text-3xl mb-2 opacity-30 block"></i>
                    {isBn ? 'এই ক্যাটাগরিতে কোনো আইটেম নেই। নিচে যোগ করুন।' : 'No items in this category. Add one below.'}
                  </div>
                )}
              </div>
            </div>

            {/* Add New Item Input */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <input 
                ref={itemInputRef} 
                type="text" 
                value={newItemInput} 
                onChange={e => setNewItemInput(e.target.value)} 
                placeholder={isBn ? 'নতুন আইটেম লিখুন এবং যোগ করুন...' : 'Type a new checklist item...'} 
                className="flex-1 border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500" 
                onKeyDown={e => e.key === 'Enter' && addNewItemToList()} 
              />
              <button 
                onClick={addNewItemToList} 
                className="px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <i className="fas fa-plus"></i>
                <span className="hidden sm:inline">{isBn ? 'যোগ' : 'Add'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (4-5 cols): Recipient, Message Config, WhatsApp Sender */}
        <aside className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className={`rounded-3xl p-6 shadow-xl border sticky top-28 space-y-4 ${isDark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-slate-200/80 backdrop-blur-md'}`}>
            
            {/* Header / Status */}
            <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <i className="fab fa-whatsapp text-2xl text-emerald-500"></i>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                    {isBn ? 'হোয়াটসঅ্যাপ সেন্ডার' : 'WhatsApp Sender'}
                  </h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {isBn ? '✓ বিজনেস ও ক্লোন অ্যাপ সাপোর্টেড' : '✓ Business & Clone App Supported'}
                  </p>
                </div>
              </div>
              <button 
                onClick={selectFromContacts} 
                className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                title={isBn ? 'মোবাইল কন্টাক্ট থেকে নম্বর নিন' : 'Select from phone contacts'}
              >
                <i className="fas fa-address-book"></i>
                <span>Contacts</span>
              </button>
            </div>

            {/* Recipient Phone */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex justify-between">
                <span>{isBn ? 'প্রাপকের ফোন নম্বর' : 'Phone Number'}</span>
                <span className="text-purple-600 lowercase">{isBn ? 'দেশ কোডসহ (+880)' : 'with country code'}</span>
              </label>
              <div className="relative">
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={handlePhoneChange} 
                  placeholder="+8801700000000"
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-base font-bold outline-none focus:ring-2 focus:ring-purple-500" 
                />
                {phone.length > 4 && (
                  <button 
                    onClick={() => setPhone('+880')}
                    className="absolute right-3 top-3.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={isBn ? 'মুছুন' : 'Clear'}
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Subject / Title */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isBn ? 'বার্তার বিষয় / সাবজেক্ট (ঐচ্ছিক)' : 'Subject / Title (Optional)'}
              </label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder={isBn ? 'যেমন: ডেলিভারি কনফার্মেশন' : 'e.g. Order #1043 Confirmation'}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500" 
              />
            </div>

            {/* Extra Note */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isBn ? 'অতিরিক্ত মন্তব্য বা নোট (ঐচ্ছিক)' : 'Additional Note (Optional)'}
              </label>
              <textarea 
                rows={2}
                value={extraNote} 
                onChange={e => setExtraNote(e.target.value)} 
                placeholder={isBn ? 'যেমন: আগামীকালের মধ্যে ডেলিভারি দেওয়া হবে।' : 'e.g. Expected delivery by 4 PM tomorrow.'}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-500 resize-none" 
              />
            </div>

            {/* Options Toggles */}
            <div className="space-y-2 py-2 border-t border-b dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={includeUnchecked} 
                  onChange={e => setIncludeUnchecked(e.target.checked)} 
                  className="rounded text-purple-600 accent-purple-600"
                /> 
                <span>{isBn ? 'অসম্পূর্ণ আইটেমও বার্তায় অন্তর্ভুক্ত করুন' : 'Include unchecked items'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={includeDateTime} 
                  onChange={e => setIncludeDateTime(e.target.checked)} 
                  className="rounded text-purple-600 accent-purple-600"
                /> 
                <span>{isBn ? 'বার্তার সময় ও তারিখ যোগ করুন' : 'Include Date & Time'}</span>
              </label>
            </div>

            {/* Live Message Preview Accordion */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>{isBn ? 'বার্তার লাইভ প্রিভিউ' : 'Live Preview'}</span>
                <button onClick={copyFullMessage} className="text-purple-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer">
                  <i className="fas fa-copy"></i>
                  <span>{isBn ? 'কপি' : 'Copy'}</span>
                </button>
              </div>
              <div className={`p-3 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto border ${isDark ? 'bg-slate-900/90 border-slate-700 text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-700'}`}>
                {previewText || (isBn ? '(বার্তা তৈরি হচ্ছে...)' : '(Message preview empty...)')}
              </div>
            </div>

            {/* Main Action Button */}
            <div className="space-y-2 pt-1">
              <button 
                onClick={handleSendAction} 
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 text-base active:scale-[0.98] cursor-pointer"
              >
                <i className="fab fa-whatsapp text-2xl"></i> 
                <span>{isBn ? 'হোয়াটসঅ্যাপে পাঠান' : 'SEND VIA WHATSAPP'}</span>
              </button>

              {/* Quick Action Secondary Row */}
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                <button 
                  onClick={() => setIsAppModalOpen(true)}
                  className="py-2.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 transition cursor-pointer"
                  title={isBn ? 'অন্য অ্যাপ বেছে নিন' : 'Choose App'}
                >
                  <i className="fas fa-clone text-purple-500"></i>
                  <span>{isBn ? 'ক্লোন/অ্যাপ' : 'Choose App'}</span>
                </button>
                <button 
                  onClick={copyFullMessage}
                  className="py-2.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 transition cursor-pointer"
                  title={isBn ? 'বার্তা কপি করুন' : 'Copy Message'}
                >
                  <i className="fas fa-copy text-blue-500"></i>
                  <span>{isBn ? 'কপি বার্তা' : 'Copy Msg'}</span>
                </button>
                <button 
                  onClick={copyPhone}
                  className="py-2.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 transition cursor-pointer"
                  title={isBn ? 'ফোন নম্বর কপি করুন' : 'Copy Phone'}
                >
                  <i className="fas fa-phone text-emerald-500"></i>
                  <span>{isBn ? 'কপি নম্বর' : 'Copy Tel'}</span>
                </button>
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* WHATSAPP APP SELECTOR MODAL (Clone, Business, Standard, System Chooser) */}
      {isAppModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <i className="fab fa-whatsapp text-emerald-500 text-xl"></i>
                  <span>{isBn ? 'কোন হোয়াটসঅ্যাপে পাঠাবেন?' : 'Choose WhatsApp App'}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isBn ? 'মূল অথবা ক্লোন অ্যাপ নির্বাচন করুন' : 'Select standard, business, or dual/cloned profile'}
                </p>
              </div>
              <button 
                onClick={() => setIsAppModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5">
              
              {/* Option 1: WhatsApp Business (Main) */}
              <button 
                onClick={() => executeSend('business')} 
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-left font-bold flex items-center justify-between shadow-md transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                    <i className="fas fa-briefcase"></i>
                  </div>
                  <div>
                    <div className="text-sm font-bold">{isBn ? 'হোয়াটসঅ্যাপ বিজনেস (Main)' : 'WhatsApp Business (Main)'}</div>
                    <div className="text-[11px] opacity-80 font-normal">com.whatsapp.w4b</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-xs opacity-60 group-hover:translate-x-1 transition-transform"></i>
              </button>

              {/* Option 2: WhatsApp Business Clone / Dual App */}
              <button 
                onClick={() => executeSend('business_clone')} 
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-left font-bold flex items-center justify-between shadow-md transition group ring-2 ring-purple-400/40 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                    <i className="fas fa-clone"></i>
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <span>{isBn ? 'হোয়াটসঅ্যাপ বিজনেস (ক্লোন / ডুয়াল)' : 'WhatsApp Business (Clone / Dual)'}</span>
                      <span className="text-[9px] bg-amber-400 text-slate-900 font-black px-1.5 py-0.5 rounded">CLONE</span>
                    </div>
                    <div className="text-[11px] opacity-80 font-normal">
                      {isBn ? 'ডুয়াল মেসেঞ্জার / ক্লোন অ্যাপ প্রোফাইল' : 'Dual Messenger / Parallel Space / Island'}
                    </div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-xs opacity-60 group-hover:translate-x-1 transition-transform"></i>
              </button>

              {/* Option 3: System App Chooser */}
              <button 
                onClick={() => executeSend('chooser')} 
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white text-left font-bold flex items-center justify-between shadow-md transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                    <i className="fas fa-mobile-alt"></i>
                  </div>
                  <div>
                    <div className="text-sm font-bold">{isBn ? 'সিস্টেম অ্যাপ সিলেক্টর (সব অ্যাপ)' : 'System App Chooser'}</div>
                    <div className="text-[11px] opacity-80 font-normal">
                      {isBn ? 'অ্যান্ড্রয়েড থেকে নিজের ক্লোন বেছে নিন' : 'Shows Android OS dialog with all clones'}
                    </div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-xs opacity-60 group-hover:translate-x-1 transition-transform"></i>
              </button>

              {/* Option 4: Standard WhatsApp */}
              <button 
                onClick={() => executeSend('standard')} 
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-left font-bold flex items-center justify-between shadow-md transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                    <i className="fab fa-whatsapp"></i>
                  </div>
                  <div>
                    <div className="text-sm font-bold">{isBn ? 'সাধারণ হোয়াটসঅ্যাপ (Main)' : 'WhatsApp Standard (Main)'}</div>
                    <div className="text-[11px] opacity-80 font-normal">com.whatsapp</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-xs opacity-60 group-hover:translate-x-1 transition-transform"></i>
              </button>

              {/* Option 5: Standard WhatsApp Clone */}
              <button 
                onClick={() => executeSend('clone')} 
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-left font-semibold flex items-center justify-between transition text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <i className="fas fa-copy text-purple-600"></i>
                  <span>{isBn ? 'সাধারণ হোয়াটসঅ্যাপ ক্লোন (Dual Standard)' : 'WhatsApp Standard Clone'}</span>
                </div>
                <i className="fas fa-arrow-right text-[10px] opacity-40"></i>
              </button>

              {/* Option 6: Direct Web Browser Link */}
              <button 
                onClick={() => executeSend('web')} 
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-left font-semibold flex items-center justify-between transition text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <i className="fas fa-globe text-cyan-500"></i>
                  <span>{isBn ? 'সরাসরি ওয়েব ব্রাউজারে খুলুন (wa.me)' : 'Direct Web Link (wa.me)'}</span>
                </div>
                <i className="fas fa-external-link-alt text-[10px] opacity-40"></i>
              </button>

            </div>

            <div className="pt-2 text-center">
              <button 
                onClick={() => setIsAppModalOpen(false)} 
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                {isBn ? 'বাতিল করুন' : 'Cancel'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* NEW PRESET CATEGORY MODAL */}
      {isNewPresetModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-purple-600 flex items-center gap-2">
                <i className="fas fa-plus-circle"></i>
                <span>{isBn ? 'নতুন ক্যাটাগরি যোগ করুন' : 'Create New Category'}</span>
              </h3>
              <button 
                onClick={() => setIsNewPresetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'ক্যাটাগরি নাম (বাংলা)' : 'Category Name (Bangla)'}
                </label>
                <input 
                  type="text" 
                  value={presetFormNameBn} 
                  onChange={e => setPresetFormNameBn(e.target.value)} 
                  placeholder={isBn ? 'যেমন: পার্সেল বুকিং' : 'e.g. Parcel Booking'}
                  className="w-full p-3 border rounded-xl dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'ক্যাটাগরি নাম (ইংরেজি)' : 'Category Name (English)'}
                </label>
                <input 
                  type="text" 
                  value={presetFormNameEn} 
                  onChange={e => setPresetFormNameEn(e.target.value)} 
                  placeholder="e.g. Parcel Booking"
                  className="w-full p-3 border rounded-xl dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'আইটেমসমূহ (বাংলায়, প্রতি লাইনে একটি)' : 'Items (Bangla, one per line)'}
                </label>
                <textarea 
                  rows={3}
                  value={presetFormItemsBn} 
                  onChange={e => setPresetFormItemsBn(e.target.value)} 
                  placeholder="প্যাকেজ ওজন যাচাই&#10;চালান তৈরি সম্পন্ন&#10;কুরিয়ার রিসিপ্ট প্রদান"
                  className="w-full p-3 border rounded-xl dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'আইটেমসমূহ (ইংরেজিতে, প্রতি লাইনে একটি)' : 'Items (English, one per line)'}
                </label>
                <textarea 
                  rows={3}
                  value={presetFormItemsEn} 
                  onChange={e => setPresetFormItemsEn(e.target.value)} 
                  placeholder="Package weight verified&#10;Invoice created&#10;Courier receipt provided"
                  className="w-full p-3 border rounded-xl dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsNewPresetModalOpen(false)} 
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button 
                  onClick={saveNewPreset} 
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition cursor-pointer"
                >
                  {isBn ? 'সংরক্ষণ করুন' : 'Save Category'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default WhatsAppSender;
