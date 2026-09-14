import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  Check, 
  ArrowRight, 
  Zap, 
  Activity, 
  Utensils, 
  Wallet, 
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parseVoiceTransaction } from '../utils/voiceTransactionParser';
import { parseSpokenNumber, cleanSpokenText } from '../utils/bengaliSpeechUtils';
import type { Language, Transaction, TransactionType, PaymentMethod, CalorieMealLog, CalorieActivityLog } from '../types';

interface GlobalVoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void> | void;
  onSetDailyLimit: (amount: number) => void;
  onAddMealLog: (meal: Omit<CalorieMealLog, 'id'>) => void;
  onAddActivityLog: (act: Omit<CalorieActivityLog, 'id'>) => void;
  onNavigate: (page: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const GlobalVoiceAssistant: React.FC<GlobalVoiceAssistantProps> = ({
  isOpen,
  onClose,
  language,
  onAddTransaction,
  onSetDailyLimit,
  onAddMealLog,
  onAddActivityLog,
  onNavigate,
  onShowToast,
}) => {
  const [speechLang, setSpeechLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [parsedAction, setParsedAction] = useState<{
    type: 'transaction' | 'limit' | 'meal' | 'activity' | 'navigate' | 'unknown';
    title: string;
    details: string;
    payload?: any;
  } | null>(null);

  const processCommand = (text: string) => {
    const raw = text.trim();
    const lower = raw.toLowerCase();

    // 1. Navigation Commands
    if (/রিপোর্ট|হিসাব বিবরণী|স্টেটমেন্ট|report/i.test(lower)) {
      setParsedAction({
        type: 'navigate',
        title: language === 'bn' ? 'রিপোর্ট পেইজে যান' : 'Navigate to Reports',
        details: language === 'bn' ? 'আয়-ব্যয় ও ক্যাটাগরি বিশ্লেষণ দেখতে প্রস্তুত' : 'Ready to open reports dashboard',
        payload: 'report',
      });
      return;
    }

    if (/ডকুমেন্ট|ভল্ট|ফাইল|রশিদ|মেমো|document|vault/i.test(lower)) {
      setParsedAction({
        type: 'navigate',
        title: language === 'bn' ? 'ডকুমেন্ট ভল্ট ওপেন করুন' : 'Open Document Vault',
        details: language === 'bn' ? 'কাগজপত্র ও রসিদ ব্যবস্থাপনা' : 'Manage receipts and papers',
        payload: 'docs',
      });
      return;
    }

    if (/হোম|প্রধান পাতা|ড্যাশবোর্ড|home/i.test(lower)) {
      setParsedAction({
        type: 'navigate',
        title: language === 'bn' ? 'হোম পেজে যান' : 'Go to Home',
        details: language === 'bn' ? 'প্রধান ড্যাশবোর্ডে ফিরুন' : 'Return to main dashboard',
        payload: 'home',
      });
      return;
    }

    // 2. Daily Expense Limit Command (e.g. "দৈনিক লিমিট ১০০০ টাকা", "খরচের লিমিট ৫০০")
    if (/লিমিট|বাজেট|limit|budget/i.test(lower)) {
      const num = parseSpokenNumber(raw);
      if (num && num > 0) {
        setParsedAction({
          type: 'limit',
          title: language === 'bn' ? `দৈনিক লিমিট ৳${num} সেট করুন` : `Set Daily Limit to ৳${num}`,
          details: language === 'bn' ? `প্রতিদিনের সর্বোচ্চ খরচ ৳${num} নির্ধারণ হবে` : `Daily maximum expense will be ৳${num}`,
          payload: num,
        });
        return;
      }
    }

    // 3. Meal / Food Log Command (e.g. "সকালে ২টা ডিম খেলাম", "দুপুরে ভাত ও মুরগি", "খেয়েছি", "নাস্তা")
    if (/খেয়েছি|খেলাম|নাস্তা|খাবার|ভাত|রুটি|ডিম|বিরিয়ানি|চা|কলা|আপেল|meal|ate|food|breakfast|lunch|dinner/i.test(lower)) {
      let mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner' = 'breakfast';
      if (/দুপুর|লাঞ্চ|lunch/i.test(lower)) mealType = 'lunch';
      else if (/রাত|ডিনার|dinner/i.test(lower)) mealType = 'dinner';
      else if (/বিকাল|সন্ধ্যা|স্ন্যাক|snack|চা/i.test(lower)) mealType = 'snack';

      const cleanedFood = cleanSpokenText(raw).replace(/(খেয়েছি|খেলাম|সকালে|দুপুরে|রাতে|নাস্তায়)/g, '').trim();
      const numPortion = parseSpokenNumber(raw) || 1;

      setParsedAction({
        type: 'meal',
        title: language === 'bn' ? `ডায়েট লগে খাবার যোগ: ${cleanedFood || 'খাবার'}` : `Add Meal Log: ${cleanedFood || 'Food'}`,
        details: `${mealType.toUpperCase()} • পরিমাপ: ${numPortion}x`,
        payload: {
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mealType,
          foodName: cleanedFood || 'খাবারের আইটেম',
          portion: numPortion,
          servingUnit: '১ পরিমাপ',
          calories: Math.round(180 * numPortion),
          protein: Math.round(5 * numPortion),
          carbs: Math.round(25 * numPortion),
          fat: Math.round(4 * numPortion),
          notes: 'ভয়েস কমান্ড থেকে দ্রুত যোগ',
        },
      });
      return;
    }

    // 4. Physical Activity Command (e.g. "৩০ মিনিট হাঁটলাম", "দৌড়ালাম", "জিম করলাম")
    if (/হাঁটলাম|হেঁটেছি|দৌড়ালাম|ব্যায়াম|জিম|ফুটবল|walk|run|exercise|cycling/i.test(lower)) {
      const minutes = parseSpokenNumber(raw) || 30;
      const burned = Math.round(minutes * 4.5);
      setParsedAction({
        type: 'activity',
        title: language === 'bn' ? `শারীরিক কসরত যোগ: ${minutes} মিনিট` : `Add Activity: ${minutes} min`,
        details: language === 'bn' ? `আনুমানিক বার্ন হবে ~${burned} kcal` : `Est. ~${burned} kcal burned`,
        payload: {
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          activityName: language === 'bn' ? 'হাঁটা বা সাধারণ শারীরিক কসরত' : 'Walking / General Exercise',
          durationMinutes: minutes,
          caloriesBurned: burned,
          stepsCount: minutes * 90,
          intensity: 'moderate',
        },
      });
      return;
    }

    // 5. Default to Transaction Parsing (Income / Expense)
    const tx = parseVoiceTransaction(raw);
    if (tx.amount) {
      setParsedAction({
        type: 'transaction',
        title: `${tx.type === 'income' ? '+ জমা' : '- খরচ'}: ৳${tx.amount}`,
        details: `${tx.title} (${tx.category} • ${tx.paymentMethod})`,
        payload: {
          type: tx.type,
          title: tx.title,
          amount: Number(tx.amount),
          category: tx.category,
          paymentMethod: tx.paymentMethod,
          date: new Date().toISOString().slice(0, 10),
          notes: 'ভয়েস AI দিয়ে স্বয়ংক্রিয় এন্ট্রি',
        },
      });
      return;
    }

    setParsedAction({
      type: 'unknown',
      title: language === 'bn' ? 'কমান্ড স্পষ্ট নয়' : 'Command unclear',
      details: language === 'bn' ? `"${raw}" - দয়া করে আরও স্পষ্টভাবে বলুন` : `"${raw}" - Please speak more specifically`,
    });
  };

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: speechLang,
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (text.trim()) {
        processCommand(text);
      }
    },
  });

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setParsedAction(null);
      startListening(speechLang);
    }
  };

  const handleExecute = () => {
    if (!parsedAction) return;

    if (parsedAction.type === 'transaction') {
      onAddTransaction(parsedAction.payload);
      onShowToast(language === 'bn' ? `৳${parsedAction.payload.amount} এর লেনদেন যুক্ত হয়েছে!` : 'Transaction added!');
      onClose();
    } else if (parsedAction.type === 'limit') {
      onSetDailyLimit(parsedAction.payload);
      onShowToast(language === 'bn' ? `দৈনিক লিমিট ৳${parsedAction.payload} করা হয়েছে!` : 'Daily limit updated!');
      onClose();
    } else if (parsedAction.type === 'meal') {
      onAddMealLog(parsedAction.payload);
      onShowToast(language === 'bn' ? 'খাবার ডায়েট চার্টে যুক্ত হয়েছে!' : 'Meal added to diet log!');
      onClose();
    } else if (parsedAction.type === 'activity') {
      onAddActivityLog(parsedAction.payload);
      onShowToast(language === 'bn' ? 'অ্যাক্টিভিটি যুক্ত হয়েছে!' : 'Activity logged!');
      onClose();
    } else if (parsedAction.type === 'navigate') {
      onNavigate(parsedAction.payload);
      onClose();
    }
  };

  if (!isOpen) return null;

  const spokenText = (transcript + ' ' + interimTranscript).trim();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl max-w-md w-full p-6 border border-indigo-500/30 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                {language === 'bn' ? 'ভয়েস AI কন্ট্রোল হাব' : 'Voice AI Control Hub'}
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE AI
                </span>
              </h3>
              <p className="text-[11px] text-indigo-200/80">
                {language === 'bn' ? 'মুখে বললেই হিসাব, খাবার, লিমিট বা অ্যাক্টিভিটি যোগ হবে' : 'Speak to add expense, food, limit or track steps'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-indigo-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Interactive Mic Button */}
        <div className="py-4 flex flex-col items-center justify-center">
          <div className="relative">
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-pulse" />
              </>
            )}
            <button
              type="button"
              onClick={handleToggle}
              className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-xl transition-all ${
                isListening
                  ? 'bg-rose-600 text-white shadow-rose-600/40 scale-105'
                  : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-600/40'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 animate-pulse" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <p className="mt-3 text-xs font-semibold text-indigo-200 text-center">
            {isListening
              ? language === 'bn' ? '🎙️ আপনার কথা শুনছি... কথা বলুন' : '🎙️ Listening... speak clearly'
              : language === 'bn' ? 'মাইক্রোফোনে ট্যাপ করে কথা বলুন' : 'Tap microphone to speak'}
          </p>

          {/* Spoken Text Display */}
          <div className="mt-3 w-full p-3 rounded-2xl bg-black/30 border border-indigo-900/60 min-h-[50px] flex items-center justify-center text-center">
            {spokenText ? (
              <p className="text-sm font-medium text-white italic">"{spokenText}"</p>
            ) : (
              <p className="text-xs text-indigo-300/60">
                {language === 'bn' ? 'যেমন: "৫০ টাকা চা খরচ", "বেতন ২৫০০০ জমা", "আজকে ১ ঘণ্টা হাঁটলাম"' : 'e.g. "Spent 50 on tea", "Received 25000 salary"'}
              </p>
            )}
          </div>
        </div>

        {/* AI Interpretation Preview */}
        {parsedAction && (
          <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-400/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                {language === 'bn' ? 'AI সিদ্ধান্ত ও অ্যাকশন' : 'AI Detected Action'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                parsedAction.type !== 'unknown' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {parsedAction.type.toUpperCase()}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-indigo-900/40">
              <p className="text-sm font-bold text-white">{parsedAction.title}</p>
              <p className="text-xs text-indigo-200 mt-0.5">{parsedAction.details}</p>
            </div>

            {parsedAction.type !== 'unknown' && (
              <button
                type="button"
                onClick={handleExecute}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                {language === 'bn' ? 'নিশ্চিত ও সংরক্ষণ করুন' : 'Confirm & Apply'}
              </button>
            )}
          </div>
        )}

        {/* Hints / Suggestions */}
        <div className="text-[11px] text-indigo-300/80 space-y-1 bg-white/5 p-3 rounded-2xl border border-white/5">
          <p className="font-semibold text-white flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-indigo-400" />
            {language === 'bn' ? 'ভয়েস কমান্ডের উদাহরণ:' : 'Voice Command Examples:'}
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[10px] text-indigo-200/70">
            <li>"বাজার খরচ ১২০০ টাকা ক্যাশ"</li>
            <li>"বাপ্পী থেকে ৫০০০ টাকা ধার নিলাম"</li>
            <li>"দৈনিক খরচের লিমিট ১৫০০ টাকা"</li>
            <li>"সকালে ২টা রুটি আর ১ কাপ চা খেলাম"</li>
            <li>"আজকে ৪৫ মিনিট ফুটবল খেলেছি"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
