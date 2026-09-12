export interface Preset {
  nameBn: string;
  nameEn: string;
  itemsBn: string[];
  itemsEn: string[];
}

export type WhatsAppTargetApp = 
  | 'ask' 
  | 'standard' 
  | 'business' 
  | 'business_clone' 
  | 'clone' 
  | 'chooser' 
  | 'share' 
  | 'web';

export interface AppSettings {
  fontPercent: number;
  fontFamily: string;
  lang: 'bn' | 'en';
  mode: 'light' | 'dark';
  headerBn: string;
  footerBn: string;
  headerEn: string;
  footerEn: string;
  preferredApp: WhatsAppTargetApp;
}

export interface HistoryItem {
  id: string;
  phone: string;
  title: string;
  message: string;
  timestamp: string;
}

export interface AppState {
  presets: Preset[];
  numbers: string[];
  settings: AppSettings;
  history: HistoryItem[];
}

export interface ChecklistItem {
  text: string;
  checked: boolean;
}

export interface CalculationItem {
  id: string;
  value: number;
}
