import type { 
  Transaction, 
  InventoryItem, 
  InventoryLog, 
  CloudDocument, 
  SheetConfig, 
  UserProfile, 
  DailyExpenseLimit,
  CalorieMealLog,
  CalorieActivityLog,
  CalorieUserProfile,
  CalorieReminder
} from '../types';
import { DEFAULT_CALORIE_REMINDERS } from '../data/bangladeshiFoods';

const TRANSACTIONS_KEY = 'khatapotro_transactions_v4';
const INVENTORY_KEY = 'khatapotro_inventory_v4';
const INVENTORY_LOGS_KEY = 'khatapotro_inventory_logs_v4';
const DOCUMENTS_KEY = 'khatapotro_documents_v4';
const SHEET_CONFIG_KEY = 'khatapotro_sheet_config_v4';
const LANG_KEY = 'khatapotro_language_v4';
const PROFILE_KEY = 'khatapotro_user_profile_v4';
const IS_INITIALIZED_KEY = 'khatapotro_initialized_v4';
const DAILY_LIMIT_KEY = 'khatapotro_daily_expense_limit_v1';
const CALORIE_MEAL_LOGS_KEY = 'khatapotro_calorie_meals_v1';
const CALORIE_ACTIVITY_LOGS_KEY = 'khatapotro_calorie_activities_v1';
const CALORIE_PROFILE_KEY = 'khatapotro_calorie_profile_v1';
const CALORIE_REMINDERS_KEY = 'khatapotro_calorie_reminders_v1';
const CALORIE_WATER_KEY = 'khatapotro_calorie_water_v1';

// Initial transactions matching user screenshot (23 records, 33,690 income, 24,807 expense, 8,883 balance)
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_01',
    title: 'আম্মু',
    amount: 3060,
    type: 'expense',
    category: 'অন্যান্য খরচ',
    badge: 'খরচ',
    date: '2026-09-05',
    paymentMethod: 'bKash',
    notes: 'পারিবারিক প্রয়োজন',
    syncedToSheets: false,
  },
  {
    id: 'tx_02',
    title: 'খাবার',
    amount: 80,
    type: 'expense',
    category: 'খাবার',
    badge: 'খরচ',
    date: '2026-09-03',
    paymentMethod: 'Cash',
    notes: 'দুপুরের নাস্তা',
    syncedToSheets: false,
  },
  {
    id: 'tx_03',
    title: 'খাবার',
    amount: 60,
    type: 'expense',
    category: 'খাবার',
    badge: 'খরচ',
    date: '2026-09-02',
    paymentMethod: 'Cash',
    notes: 'বিকেলের নাস্তা',
    syncedToSheets: false,
  },
  {
    id: 'tx_04',
    title: 'তেল',
    amount: 520,
    type: 'expense',
    category: 'যাতায়াত',
    badge: 'খরচ',
    date: '2026-09-02',
    paymentMethod: 'Cash',
    notes: 'মোটরবাইক পেট্রোল',
    syncedToSheets: false,
  },
  {
    id: 'tx_05',
    title: 'ক্রেডিট কার্ড',
    amount: 520,
    type: 'income',
    category: 'অন্যান্য জমা',
    badge: 'দেনা',
    personName: 'ক্রেডিট কার্ড',
    date: '2026-09-02',
    paymentMethod: 'Credit Card',
    notes: 'কার্ড লোন উত্তোলন',
    syncedToSheets: false,
  },
  {
    id: 'tx_06',
    title: 'বিকাশ লোন জমা',
    amount: 7490,
    type: 'expense',
    category: 'বিল',
    badge: 'খরচ',
    date: '2026-09-02',
    paymentMethod: 'bKash',
    notes: 'বিকাশ লোন কিস্তি পরিশোধ',
    syncedToSheets: false,
  },
  {
    id: 'tx_07',
    title: 'কলম',
    amount: 10,
    type: 'expense',
    category: 'বাজার',
    badge: 'খরচ',
    date: '2026-09-02',
    paymentMethod: 'Cash',
    notes: 'দোকান হিসাবের খাতা কলম',
    syncedToSheets: false,
  },
  {
    id: 'tx_08',
    title: 'কলা',
    amount: 15,
    type: 'expense',
    category: 'খাবার',
    badge: 'খরচ',
    date: '2026-09-02',
    paymentMethod: 'Cash',
    notes: 'নাস্তা',
    syncedToSheets: false,
  },
  {
    id: 'tx_09',
    title: 'গুরা সাবান',
    amount: 140,
    type: 'expense',
    category: 'বাজার',
    badge: 'খরচ',
    date: '2026-09-01',
    paymentMethod: 'Cash',
    notes: 'হুইল ডিটারজেন্ট পাউডার',
    syncedToSheets: false,
  },
  {
    id: 'tx_10',
    title: 'ক্রেডিট কার্ড দিয়ে গুরা সাবান',
    amount: 140,
    type: 'income',
    category: 'অন্যান্য জমা',
    badge: 'দেনা',
    personName: 'ক্রেডিট কার্ড',
    date: '2026-09-01',
    paymentMethod: 'Credit Card',
    notes: 'কার্ড ট্রানজেকশন দেনা',
    syncedToSheets: false,
  },
  {
    id: 'tx_11',
    title: 'পেটিস',
    amount: 60,
    type: 'expense',
    category: 'খাবার',
    badge: 'খরচ',
    date: '2026-09-01',
    paymentMethod: 'Cash',
    notes: 'হালকা নাস্তা',
    syncedToSheets: false,
  },
  {
    id: 'tx_12',
    title: 'কলা',
    amount: 15,
    type: 'expense',
    category: 'খাবার',
    badge: 'খরচ',
    date: '2026-09-01',
    paymentMethod: 'Cash',
    notes: 'কলা নাস্তা',
    syncedToSheets: false,
  },
  {
    id: 'tx_13',
    title: 'সকালের খাবার',
    amount: 70,
    type: 'expense',
    category: 'খাবার',
    badge: 'খরচ',
    date: '2026-09-01',
    paymentMethod: 'Cash',
    notes: 'সকালের পরোটা ও চা',
    syncedToSheets: false,
  },
  {
    id: 'tx_14',
    title: 'আব্বু',
    amount: 900,
    type: 'income',
    category: 'অন্যান্য জমা',
    badge: 'দেনা',
    personName: 'আব্বু',
    date: '2026-08-30',
    paymentMethod: 'Cash',
    notes: 'আব্বুর কাছ থেকে ধার নেওয়া',
    syncedToSheets: false,
  },
  {
    id: 'tx_15',
    title: 'বেল্ট',
    amount: 200,
    type: 'expense',
    category: 'বাজার',
    badge: 'খরচ',
    date: '2026-08-30',
    paymentMethod: 'Cash',
    notes: 'ব্যক্তিগত বেল্ট ক্রয়',
    syncedToSheets: false,
  },
  {
    id: 'tx_16',
    title: 'বিকাশ কিস্তি',
    amount: 2500,
    type: 'expense',
    category: 'বিল',
    badge: 'খরচ',
    date: '2026-08-28',
    paymentMethod: 'bKash',
    notes: 'কিস্তির টাকা প্রদান',
    syncedToSheets: false,
  },
  {
    id: 'tx_17',
    title: 'খাবার',
    amount: 100,
    type: 'expense',
    category: 'খাবার',
    badge: 'খরচ',
    date: '2026-08-26',
    paymentMethod: 'Cash',
    notes: 'দুপুরের খাবার',
    syncedToSheets: false,
  },
  {
    id: 'tx_18',
    title: 'তেল',
    amount: 520,
    type: 'expense',
    category: 'যাতায়াত',
    badge: 'খরচ',
    date: '2026-08-26',
    paymentMethod: 'Cash',
    notes: 'বাইক অকটেন',
    syncedToSheets: false,
  },
  {
    id: 'tx_19',
    title: 'ফেরি টিকিট',
    amount: 140,
    type: 'expense',
    category: 'যাতায়াত',
    badge: 'খরচ',
    date: '2026-08-26',
    paymentMethod: 'Cash',
    notes: 'ঘাট পারাপার ফেরি টিকিট',
    syncedToSheets: false,
  },
  {
    id: 'tx_20',
    title: 'ভাইয়া মোবাইল',
    amount: 140,
    type: 'expense',
    category: 'অন্যান্য খরচ',
    badge: 'খরচ',
    date: '2026-08-26',
    paymentMethod: 'bKash',
    notes: 'মোবাইল রিচার্জ ও সেবা',
    syncedToSheets: false,
  },
  {
    id: 'tx_21',
    title: 'গাড়ি সারাই',
    amount: 1100,
    type: 'expense',
    category: 'যাতায়াত',
    badge: 'খরচ',
    date: '2026-08-26',
    paymentMethod: 'Cash',
    notes: 'গ্যারেজে কাজ ও পার্টস',
    syncedToSheets: false,
  },
  {
    id: 'tx_22',
    title: 'কিস্তি মোবাইল',
    amount: 8587,
    type: 'expense',
    category: 'বিল',
    badge: 'খরচ',
    date: '2026-08-26',
    paymentMethod: 'Bank Transfer',
    notes: 'স্মার্টফোন ইএমআই কিস্তি',
    syncedToSheets: false,
  },
  {
    id: 'tx_23',
    title: 'বেতন',
    amount: 32130,
    type: 'income',
    category: 'বেতন',
    badge: 'জমা',
    date: '2026-08-25',
    paymentMethod: 'Bank Transfer',
    notes: 'আগস্ট মাসের বেতন ডিপোজিট',
    syncedToSheets: false,
  },
];

// Initial Real-time Inventory Items
const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'item_01',
    sku: 'OIL-SOY-5L',
    name: 'তীর সয়াবিন তেল ৫ লি.',
    category: 'রান্নার তেল',
    unit: 'liter',
    costPrice: 820,
    sellingPrice: 890,
    quantity: 18,
    minStockAlert: 5,
    supplier: 'সিটি গ্রুপ ডিস্ট্রিবিউটর',
    location: 'Aisle 1-A',
    lastUpdated: '2026-09-05T08:30:00Z',
    notes: 'সর্বোচ্চ বিক্রিত আইটেম',
    syncedToSheets: false,
  },
  {
    id: 'item_02',
    sku: 'RIC-MIN-25KG',
    name: 'মিনিকেট চাল প্রিমিয়াম ২৫ কেজি',
    category: 'চাল ও খাদ্যশস্য',
    unit: 'bag',
    costPrice: 1650,
    sellingPrice: 1800,
    quantity: 12,
    minStockAlert: 4,
    supplier: 'কুষ্টিয়া অটো রাইস মিল',
    location: 'Warehouse Floor 1',
    lastUpdated: '2026-09-04T11:15:00Z',
    syncedToSheets: false,
  },
  {
    id: 'item_03',
    sku: 'SUG-WHT-1KG',
    name: 'ফ্রেশ পরিশোধিত চিনি ১ কেজি',
    category: 'মুদি পণ্য',
    unit: 'kg',
    costPrice: 125,
    sellingPrice: 138,
    quantity: 35,
    minStockAlert: 10,
    supplier: 'মেঘনা গ্রুপ',
    location: 'Shelf 2',
    lastUpdated: '2026-09-03T14:20:00Z',
    syncedToSheets: false,
  },
  {
    id: 'item_04',
    sku: 'DAL-MOS-1KG',
    name: 'দেশি মসুর ডাল ১ কেজি',
    category: 'মুদি পণ্য',
    unit: 'kg',
    costPrice: 130,
    sellingPrice: 145,
    quantity: 22,
    minStockAlert: 8,
    supplier: 'মৌলভীবাজার আড়ৎ',
    location: 'Shelf 3',
    lastUpdated: '2026-09-02T10:00:00Z',
    syncedToSheets: false,
  },
  {
    id: 'item_05',
    sku: 'SLT-ACI-1KG',
    name: 'এসিআই পিওর আয়োডিনযুক্ত লবণ ১ কেজি',
    category: 'মুদি পণ্য',
    unit: 'kg',
    costPrice: 38,
    sellingPrice: 45,
    quantity: 4, // LOW STOCK ALERT
    minStockAlert: 10,
    supplier: 'এসিআই লিমিটেড',
    location: 'Shelf 1',
    lastUpdated: '2026-09-05T09:00:00Z',
    notes: 'দ্রুত অর্ডার করতে হবে',
    syncedToSheets: false,
  },
  {
    id: 'item_06',
    sku: 'MLK-DANO-500G',
    name: 'ডানো গুঁড়ো দুধ ৫০০ গ্রাম',
    category: 'দুগ্ধজাত সামগ্রী',
    unit: 'box',
    costPrice: 430,
    sellingPrice: 480,
    quantity: 0, // OUT OF STOCK
    minStockAlert: 5,
    supplier: 'আর্লা ফুডস বাংলাদেশ',
    location: 'Cabinet 2',
    lastUpdated: '2026-09-01T16:00:00Z',
    notes: 'আউট অব স্টক - সাপ্লায়ারকে অবহিত করা হয়েছে',
    syncedToSheets: false,
  },
  {
    id: 'item_07',
    sku: 'SOP-WHL-130G',
    name: 'হুইল টু ইন ওয়ান ধোয়ার সাবান ১৩০ গ্রাম',
    category: 'পরিষ্কার সামগ্রী',
    unit: 'pcs',
    costPrice: 32,
    sellingPrice: 38,
    quantity: 45,
    minStockAlert: 15,
    supplier: 'ইউনিলিভার বাংলাদেশ',
    location: 'Aisle 3',
    lastUpdated: '2026-09-03T09:30:00Z',
    syncedToSheets: false,
  },
];

// Initial stock logs
const INITIAL_LOGS: InventoryLog[] = [
  {
    id: 'log_01',
    date: '2026-09-05T08:30:00Z',
    itemId: 'item_01',
    itemName: 'তীর সয়াবিন তেল ৫ লি.',
    sku: 'OIL-SOY-5L',
    type: 'sale',
    quantity: 2,
    unitPrice: 890,
    totalAmount: 1780,
    reason: 'কাউন্টার বিক্রয়',
    reference: 'INV-2026-091',
    syncedToSheets: false,
  },
  {
    id: 'log_02',
    date: '2026-09-04T11:15:00Z',
    itemId: 'item_02',
    itemName: 'মিনিকেট চাল প্রিমিয়াম ২৫ কেজি',
    sku: 'RIC-MIN-25KG',
    type: 'stock_in',
    quantity: 15,
    unitPrice: 1650,
    totalAmount: 24750,
    reason: 'নতুন স্টক ক্রয় ইনভেন্টরি এন্ট্রি',
    reference: 'PO-8831',
    syncedToSheets: false,
  },
  {
    id: 'log_03',
    date: '2026-09-03T14:20:00Z',
    itemId: 'item_05',
    itemName: 'এসিআই পিওর আয়োডিনযুক্ত লবণ ১ কেজি',
    sku: 'SLT-ACI-1KG',
    type: 'sale',
    quantity: 6,
    unitPrice: 45,
    totalAmount: 270,
    reason: 'খুচরা গ্রাহক বিক্রয়',
    syncedToSheets: false,
  },
];

// Initial Cloud Documents
const INITIAL_DOCS: CloudDocument[] = [
  {
    id: 'doc_01',
    title: 'ব্যবসা ট্রেড লাইসেন্স ২০২৬-২৭',
    docCategory: 'Trade License',
    fileName: 'trade_license_2026_dcc.pdf',
    fileSize: 485000,
    fileType: 'application/pdf',
    uploadDate: '2026-08-15T10:00:00Z',
    notes: 'ঢাকা সিটি কর্পোরেশন ট্রেড লাইসেন্স নবায়নকৃত কপি',
    syncedToSheets: false,
  },
  {
    id: 'doc_02',
    title: 'মেঘনা গ্রুপ চালান ও পাইকারি ভাউচার',
    docCategory: 'Invoice',
    fileName: 'meghna_wholesaler_memo_sep2026.pdf',
    fileSize: 312000,
    fileType: 'application/pdf',
    uploadDate: '2026-09-01T12:30:00Z',
    amount: 34500,
    notes: 'তেল ও চিনির মাসিক বাল্ক সাপ্লাই চালান',
    syncedToSheets: false,
  },
  {
    id: 'doc_03',
    title: 'দোকান বিদ্যুৎ বিল সেপ্টেম্বর রসিদ',
    docCategory: 'Voucher',
    fileName: 'dpidc_electricity_sep2026.pdf',
    fileSize: 184000,
    fileType: 'application/pdf',
    uploadDate: '2026-09-01T15:00:00Z',
    amount: 7410,
    relatedTransactionId: 'tx_106',
    notes: 'অনলাইন ব্যাংক ট্রান্সফার পেইড কপি',
    syncedToSheets: false,
  },
];

export const storageService = {
  getTransactions(): Transaction[] {
    try {
      const isInit = localStorage.getItem(IS_INITIALIZED_KEY);
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      if (isInit === 'false' && data) {
        return JSON.parse(data);
      }
      if (!data) {
        if (isInit === 'false') return [];
        this.saveTransactions(INITIAL_TRANSACTIONS);
        return INITIAL_TRANSACTIONS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  saveTransactions(transactions: Transaction[]) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  },

  getInventory(): InventoryItem[] {
    try {
      const data = localStorage.getItem(INVENTORY_KEY);
      if (!data) {
        this.saveInventory(INITIAL_INVENTORY);
        return INITIAL_INVENTORY;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_INVENTORY;
    }
  },

  saveInventory(items: InventoryItem[]) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  },

  getInventoryLogs(): InventoryLog[] {
    try {
      const data = localStorage.getItem(INVENTORY_LOGS_KEY);
      if (!data) {
        this.saveInventoryLogs(INITIAL_LOGS);
        return INITIAL_LOGS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_LOGS;
    }
  },

  saveInventoryLogs(logs: InventoryLog[]) {
    localStorage.setItem(INVENTORY_LOGS_KEY, JSON.stringify(logs));
  },

  getDocuments(): CloudDocument[] {
    try {
      const isInit = localStorage.getItem(IS_INITIALIZED_KEY);
      const data = localStorage.getItem(DOCUMENTS_KEY);
      if (isInit === 'false' && data) {
        return JSON.parse(data);
      }
      if (!data) {
        if (isInit === 'false') return [];
        this.saveDocuments(INITIAL_DOCS);
        return INITIAL_DOCS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_DOCS;
    }
  },

  saveDocuments(docs: CloudDocument[]) {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
  },

  getSheetConfig(): SheetConfig {
    try {
      const data = localStorage.getItem(SHEET_CONFIG_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return {
      spreadsheetId: null,
      spreadsheetUrl: null,
      spreadsheetName: 'KhataPotro - Cloud Ledger & Real-Time Inventory',
      lastSyncTime: null,
      autoSync: true,
    };
  },

  saveSheetConfig(config: SheetConfig) {
    localStorage.setItem(SHEET_CONFIG_KEY, JSON.stringify(config));
  },

  getUserProfile(): UserProfile | null {
    try {
      const data = localStorage.getItem(PROFILE_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return null;
  },

  saveUserProfile(profile: UserProfile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(IS_INITIALIZED_KEY, 'true');
  },

  clearUserProfile() {
    localStorage.removeItem(PROFILE_KEY);
  },

  isInitialized(): boolean {
    return localStorage.getItem(IS_INITIALIZED_KEY) === 'true';
  },

  clearAllData() {
    // Overwrite all data with empty states and clear profile
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify([]));
    localStorage.setItem(INVENTORY_KEY, JSON.stringify([]));
    localStorage.setItem(INVENTORY_LOGS_KEY, JSON.stringify([]));
    localStorage.removeItem(PROFILE_KEY);
    localStorage.setItem(IS_INITIALIZED_KEY, 'false');

    // Reset Google Sheet Config
    const resetConfig: SheetConfig = {
      spreadsheetId: null,
      spreadsheetUrl: null,
      spreadsheetName: 'KhataPotro - Cloud Ledger & Real-Time Inventory',
      lastSyncTime: null,
      autoSync: true,
    };
    localStorage.setItem(SHEET_CONFIG_KEY, JSON.stringify(resetConfig));
  },

  getLanguage(): 'bn' | 'en' {
    return (localStorage.getItem(LANG_KEY) as 'bn' | 'en') || 'bn';
  },

  saveLanguage(lang: 'bn' | 'en') {
    localStorage.setItem(LANG_KEY, lang);
  },

  getDailyExpenseLimit(): DailyExpenseLimit {
    try {
      const data = localStorage.getItem(DAILY_LIMIT_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return {
      amount: 1500, // Default sensible limit in BDT
      enabled: false,
    };
  },

  saveDailyExpenseLimit(limit: DailyExpenseLimit) {
    localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(limit));
  },

  // Calorie Meal Logs
  getCalorieMealLogs(): CalorieMealLog[] {
    try {
      const data = localStorage.getItem(CALORIE_MEAL_LOGS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load calorie meal logs', e);
    }
    return [];
  },

  saveCalorieMealLogs(logs: CalorieMealLog[]) {
    localStorage.setItem(CALORIE_MEAL_LOGS_KEY, JSON.stringify(logs));
  },

  // Calorie Activity Logs
  getCalorieActivityLogs(): CalorieActivityLog[] {
    try {
      const data = localStorage.getItem(CALORIE_ACTIVITY_LOGS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load calorie activity logs', e);
    }
    return [];
  },

  saveCalorieActivityLogs(logs: CalorieActivityLog[]) {
    localStorage.setItem(CALORIE_ACTIVITY_LOGS_KEY, JSON.stringify(logs));
  },

  // Calorie Profile & Goals
  getCalorieProfile(): CalorieUserProfile {
    const defaultProfile: CalorieUserProfile = {
      age: 28,
      gender: 'male',
      weightKg: 68,
      heightFeet: 5,
      heightInches: 7,
      activityLevel: 'moderate',
      goal: 'maintain',
      targetDailyCalories: 2100,
      targetDailyBurn: 350,
      waterGlassesTarget: 8,
    };
    try {
      const data = localStorage.getItem(CALORIE_PROFILE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          return { ...defaultProfile, ...parsed };
        }
      }
    } catch (e) {
      console.error('Failed to load calorie profile', e);
    }
    return defaultProfile;
  },

  saveCalorieProfile(profile: CalorieUserProfile) {
    localStorage.setItem(CALORIE_PROFILE_KEY, JSON.stringify(profile));
  },

  // Calorie Reminders
  getCalorieReminders(): CalorieReminder[] {
    try {
      const data = localStorage.getItem(CALORIE_REMINDERS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load calorie reminders', e);
    }
    return DEFAULT_CALORIE_REMINDERS;
  },

  saveCalorieReminders(reminders: CalorieReminder[]) {
    localStorage.setItem(CALORIE_REMINDERS_KEY, JSON.stringify(reminders));
  },

  // Water Intake (glasses count per date)
  getWaterGlasses(date: string): number {
    try {
      const data = localStorage.getItem(CALORIE_WATER_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return typeof parsed[date] === 'number' ? parsed[date] : 0;
      }
    } catch {
      // fallback
    }
    return 0;
  },

  saveWaterGlasses(date: string, count: number) {
    try {
      const data = localStorage.getItem(CALORIE_WATER_KEY);
      const parsed = data ? JSON.parse(data) : {};
      parsed[date] = Math.max(0, count);
      localStorage.setItem(CALORIE_WATER_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error('Failed to save water intake', e);
    }
  },
};
