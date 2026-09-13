import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Volume2, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parseVoiceTransaction, type ParsedVoiceTransaction } from '../utils/voiceTransactionParser';
import type { Language } from '../types';

interface VoiceTransactionAssistantProps {
  onApply: (parsed: ParsedVoiceTransaction) => void;
  language: Language;
  autoApply?: boolean;
  onClose?: () => void;
}

export const VoiceTransactionAssistant: React.FC<VoiceTransactionAssistantProps> = ({
  onApply,
  language,
  autoApply = false,
  onClose,
}) => {
  const [speechLang, setSpeechLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [lastParsed, setLastParsed] = useState<ParsedVoiceTransaction | null>(null);
  const [appliedToast, setAppliedToast] = useState(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: speechLang,
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (text.trim()) {
        const parsed = parseVoiceTransaction(text);
        setLastParsed(parsed);

        if (isFinal && autoApply && parsed.amount) {
          onApply(parsed);
          setAppliedToast(true);
          setTimeout(() => setAppliedToast(false), 2000);
        }
      }
    },
  });

  // Re-parse if transcript changes
  useEffect(() => {
    const fullText = (transcript + ' ' + interimTranscript).trim();
    if (fullText) {
      const parsed = parseVoiceTransaction(fullText);
      setLastParsed(parsed);
    }
  }, [transcript, interimTranscript]);

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setLastParsed(null);
      startListening(speechLang);
    }
  };

  const handleApplyClick = () => {
    if (lastParsed) {
      onApply(lastParsed);
      setAppliedToast(true);
      setTimeout(() => {
        setAppliedToast(false);
        if (onClose) onClose();
      }, 1000);
    }
  };

  const currentDisplay = interimTranscript ? `${transcript} ${interimTranscript}` : transcript;

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-4 sm:p-5 border border-indigo-700/50 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-indigo-800/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>{language === 'bn' ? 'ভয়েস ইনপুট দিয়ে খরচ বা জমা যোগ' : 'Voice Expense & Income Assistant'}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                AI Voice
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              {language === 'bn' ? 'মুখে বাংলায় বলুন, স্বয়ংক্রিয়ভাবে ফর্ম পূরণ হবে' : 'Speak in Bengali or English to auto-fill entry'}
            </p>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setSpeechLang('bn-BD')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              speechLang === 'bn-BD' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            বাংলা
          </button>
          <button
            type="button"
            onClick={() => setSpeechLang('en-US')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              speechLang === 'en-US' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Main Mic Button & Visual Waveform */}
      <div className="flex flex-col items-center justify-center py-2 text-center space-y-3">
        <div className="relative flex items-center justify-center">
          {/* Animated pulsing wave rings when listening */}
          {isListening && (
            <>
              <div className="absolute w-24 h-24 rounded-full bg-rose-500/20 animate-ping" />
              <div className="absolute w-20 h-20 rounded-full bg-rose-500/30 animate-pulse" />
            </>
          )}

          <button
            type="button"
            onClick={handleToggleMic}
            className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all transform active:scale-95 cursor-pointer ${
              isListening
                ? 'bg-gradient-to-tr from-rose-600 to-pink-500 text-white shadow-rose-500/40 ring-4 ring-rose-400/30'
                : 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-indigo-500/40 hover:scale-105'
            }`}
            title={isListening ? 'Stop Listening' : 'Start Speaking'}
          >
            {isListening ? (
              <MicOff className="w-7 h-7 animate-bounce" />
            ) : (
              <Mic className="w-7 h-7" />
            )}
          </button>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-200">
            {isListening
              ? (language === 'bn' ? 'শুনছি... এখন মুখে বলুন' : 'Listening... Speak now')
              : (language === 'bn' ? 'মাইক্রোফোনে ট্যাপ করে মুখে বলুন' : 'Tap mic and speak')}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {language === 'bn' 
              ? 'যেমন: "আজকে বাজারে খরচ ৮৫০ টাকা" বা "বেতন পেয়েছি ৩৫০০০ টাকা"' 
              : 'e.g. "Lunch cost 250 taka bkash" or "Salary 35000 income"'}
          </p>
        </div>
      </div>

      {/* Spoken Text Display */}
      {currentDisplay && (
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1 animate-in fade-in duration-100">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-indigo-400" />
              <span>{language === 'bn' ? 'আপনার কথা:' : 'Heard speech:'}</span>
            </span>
            <button
              type="button"
              onClick={resetTranscript}
              className="text-slate-400 hover:text-slate-200"
              title="Clear"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs sm:text-sm font-medium text-indigo-200 italic">
            "{currentDisplay}"
          </p>
        </div>
      )}

      {/* Parsed Result Card */}
      {lastParsed && (
        <div className="p-3.5 bg-indigo-950/70 rounded-2xl border border-indigo-700/60 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'bn' ? 'শনাক্তকৃত হিসাবের তথ্য:' : 'Parsed Entry Preview:'}</span>
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
              lastParsed.type === 'income' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {lastParsed.type === 'income' ? 'জমা (Income)' : 'খরচ (Expense)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">{language === 'bn' ? 'টাকা' : 'Amount'}</span>
              <span className="font-extrabold text-amber-300 text-sm">
                ৳ {lastParsed.amount ? lastParsed.amount.toLocaleString() : '---'}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">{language === 'bn' ? 'বিবরণ' : 'Title'}</span>
              <span className="font-bold text-white truncate block">
                {lastParsed.title || '---'}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</span>
              <span className="font-bold text-slate-200 truncate block">
                {lastParsed.category}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">{language === 'bn' ? 'মাধ্যম' : 'Payment'}</span>
              <span className="font-bold text-slate-200 truncate block">
                {lastParsed.paymentMethod}
              </span>
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleApplyClick}
              className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {appliedToast ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>{language === 'bn' ? 'ফর্মে সফলভাবে পূরণ হয়েছে!' : 'Applied to Form!'}</span>
                </>
              ) : (
                <>
                  <span>{language === 'bn' ? 'এই তথ্যে এন্ট্রি ফর্ম পূরণ করুন' : 'Apply to Transaction Form'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error or unsupported alert */}
      {(!isSupported || error) && (
        <div className="p-3 bg-amber-950/60 border border-amber-800/60 text-amber-200 rounded-2xl text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{error || 'স্পিচ রিকগনিশন ব্রাউজারে সক্রিয় নেই'}</p>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              {language === 'bn'
                ? 'ব্রাউজার সেটিংসে মাইক্রোফোন অনুমতি দিন। মোবাইল Chrome বা Safari ব্রাউজারে এটি সরাসরি কাজ করে।'
                : 'Please allow microphone permissions in your browser address bar.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
