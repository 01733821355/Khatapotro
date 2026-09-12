import React from 'react';
import { RefreshCw, CheckCircle2, Cloud, AlertCircle } from 'lucide-react';
import type { Language, GoogleUser, SheetConfig } from '../types';

interface LiveSyncIndicatorProps {
  isSyncing: boolean;
  user: GoogleUser | null;
  sheetConfig: SheetConfig;
  lastSyncTime?: string | null;
  language: Language;
  onOpenSyncModal: () => void;
  compact?: boolean;
}

export const LiveSyncIndicator: React.FC<LiveSyncIndicatorProps> = ({
  isSyncing,
  user,
  sheetConfig,
  lastSyncTime,
  language,
  onOpenSyncModal,
  compact = false,
}) => {
  const isConnected = !!user && !!sheetConfig.spreadsheetId;

  // Format relative last sync time
  const getFormattedTime = () => {
    if (!lastSyncTime) {
      return language === 'bn' ? 'এখনই' : 'Just now';
    }
    try {
      const date = new Date(lastSyncTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return language === 'bn' ? 'সম্প্রতি' : 'Recently';
    }
  };

  if (compact) {
    if (!isConnected) {
      return (
        <button
          type="button"
          onClick={onOpenSyncModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
          title={language === 'bn' ? 'লাইভ সিঙ্ক অন করতে গুগল কানেক্ট করুন' : 'Connect Google for live sync'}
        >
          <Cloud className="w-3.5 h-3.5 text-amber-500" />
          <span className="truncate max-w-[80px] sm:max-w-none">
            {language === 'bn' ? 'সিঙ্ক অফ' : 'Sync Off'}
          </span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={onOpenSyncModal}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
          isSyncing
            ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
        }`}
        title={
          language === 'bn'
            ? 'লাইভ অটো-সিঙ্ক চালু: কোনো বাটন চাপতে হবে না, প্রতিটি পরিবর্তন সরাসরি শিটে সংরক্ষিত হচ্ছে'
            : 'Live auto-sync active: zero clicks needed, every change updates sheets automatically'
        }
      >
        {isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
        ) : (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
        <span className="hidden xs:inline">
          {isSyncing
            ? language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...'
            : language === 'bn' ? 'লাইভ সিঙ্ক চালু' : 'Live Synced'}
        </span>
      </button>
    );
  }

  // Full detailed banner/pill for headers
  return (
    <div
      onClick={onOpenSyncModal}
      className={`cursor-pointer inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
        !isConnected
          ? 'bg-amber-50/90 border-amber-200 text-amber-800 hover:bg-amber-100'
          : isSyncing
          ? 'bg-blue-50/90 border-blue-200 text-blue-800 shadow-xs animate-pulse'
          : 'bg-emerald-50/90 border-emerald-200 text-emerald-800 shadow-xs hover:border-emerald-300'
      }`}
      title={
        language === 'bn'
          ? 'স্বয়ংক্রিয় রিয়েল-টাইম সিঙ্ক সক্রিয়। প্রতি এন্ট্রি সাথে সাথে গুগল ড্রাইভে ও শিটে সংরক্ষণ হয়।'
          : 'Real-time live sync enabled. Each record is backed up automatically.'
      }
    >
      {!isConnected ? (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            {language === 'bn'
              ? 'ক্লাউড সিঙ্ক সেটআপ করুন'
              : 'Setup Cloud Sync'}
          </span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-blue-700">
              {language === 'bn' ? 'লাইভ সিঙ্ক হচ্ছে...' : 'Live Syncing...'}
            </span>
            <span className="text-[10px] text-blue-500 bg-blue-100/60 px-1.5 py-0.5 rounded-md">
              Google Sheets
            </span>
          </div>
        </>
      ) : (
        <>
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-emerald-800">
              {language === 'bn' ? 'লাইভ ক্লাউড সিঙ্ক চালু' : 'Live Cloud Synced'}
            </span>
            <span className="text-[10px] text-emerald-600 bg-emerald-100/70 px-1.5 py-0.5 rounded-md font-medium">
              {getFormattedTime()}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
