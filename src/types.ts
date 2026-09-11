export type TransactionType = 'income' | 'expense';

export type TransactionBadge = 'জমা' | 'খরচ' | 'দেনা' | 'পাওনা';

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Rocket' | 'Bank Transfer' | 'Credit Card' | 'Other';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  badge?: TransactionBadge;
  personName?: string; // For loan or lending tracking
  notes?: string;
  receiptDocId?: string;
  receiptName?: string;
  syncedToSheets?: boolean;
}

export type ActivePage = 'home' | 'report' | 'loans' | 'lending' | 'vault';

export interface PersonDebtSummary {
  personName: string;
  totalTaken: number;
  totalRepaid: number;
  currentBalance: number; // remaining debt to pay
  transactions: Transaction[];
  lastDate: string;
}

export interface PersonLendingSummary {
  personName: string;
  totalGiven: number;
  totalReceived: number;
  currentBalance: number; // remaining money owed to user
  transactions: Transaction[];
  lastDate: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: 'pcs' | 'kg' | 'liter' | 'box' | 'carton' | 'bag' | 'meter' | 'packet';
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minStockAlert: number;
  supplier?: string;
  location?: string;
  lastUpdated: string; // ISO string
  notes?: string;
  syncedToSheets?: boolean;
}

export type MovementType = 'stock_in' | 'stock_out' | 'sale' | 'adjustment' | 'damage';

export interface InventoryLog {
  id: string;
  date: string; // ISO string
  itemId: string;
  itemName: string;
  sku: string;
  type: MovementType;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reason: string;
  reference?: string; // invoice or order no
  operator?: string;
  syncedToSheets?: boolean;
}

export type DocumentCategory = 
  | 'Receipt' 
  | 'Voucher' 
  | 'Invoice' 
  | 'Memo' 
  | 'Trade License' 
  | 'Bank Statement' 
  | 'Tax/TIN' 
  | 'Contract'
  | 'Other';

export interface CloudDocument {
  id: string;
  title: string;
  docCategory: DocumentCategory;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string; // mime
  uploadDate: string; // ISO string
  driveFileId?: string;
  driveViewLink?: string;
  driveDownloadLink?: string;
  amount?: number; // monetary value associated, if any
  relatedTransactionId?: string;
  notes?: string;
  fileDataUrl?: string; // local cache / offline preview
  syncedToDrive?: boolean;
  syncedToSheets?: boolean;
}

export interface SheetConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetName: string;
  lastSyncTime: string | null;
  autoSync: boolean;
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  count: number;
}

export type Language = 'bn' | 'en';

export interface GoogleUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface DailyExpenseLimit {
  amount: number;
  enabled: boolean;
}

export interface UserProfile {
  name: string;
  businessName?: string;
  phone?: string;
  openingBalance?: number;
  registeredAt: string;
  email?: string;
  isRegistered: boolean;
  dailyExpenseLimit?: DailyExpenseLimit;
}
