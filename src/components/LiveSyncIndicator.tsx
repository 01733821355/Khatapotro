import React from 'react';
import { RefreshCw, Cloud } from 'lucide-react';
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
}) => {
  const isConnected = !!user && !!sheetConfig.spreadsheetId;

  // Format relative last sync time for tooltip
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

  const title = !isConnected
    ? (language === 'bn' ? 'লাইভ ক্লাউড সিঙ্ক বন্ধ (কানেক্ট করতে ক্লিক করুন)' : 'Live sync disconnected (Click to setup Google Sheets)')
    : isSyncing
    ? (language === 'bn' ? 'গুগল শিটে লাইভ সিঙ্ক হচ্ছে...' : 'Syncing to Google Sheets...')
    : (language === 'bn' ? `লাইভ ক্লাউড সিঙ্ক সক্রিয় (${getFormattedTime()}) - সেটিংস দেখতে ক্লিক করুন` : `Live Cloud Sync Active (${getFormattedTime()}) - Click to manage`);

  return (
    <button
      type="button"
      onClick={onOpenSyncModal}
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full border transition-all cursor-pointer transform active:scale-90 hover:scale-105 shadow-2xs focus:outline-hidden ${
        !isConnected
          ? 'bg-amber-50 hover:bg-amber-100/80 border-amber-200/80 text-amber-600'
          : isSyncing
          ? 'bg-blue-50 hover:bg-blue-100/80 border-blue-200/80 text-blue-600'
          : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200/80 text-emerald-600'
      }`}
      title={title}
      aria-label={title}
    >
      {!isConnected ? (
        <span className="relative flex items-center justify-center">
          <Cloud className="w-3.5 h-3.5 text-amber-500" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
          </span>
        </span>
      ) : isSyncing ? (
        <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
      ) : (
        /* Pure Beeping Pulse Radar Button */
        <span className="relative flex items-center justify-center h-4 w-4">
          <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-80"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white"></span>
        </span>
      )}
    </button>
  );
};
