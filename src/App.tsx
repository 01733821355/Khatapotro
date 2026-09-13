import { useState, useEffect, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout 
} from './lib/firebase';
import { 
  signInWithGoogle, 
  getStoredAuth, 
  signOutGoogle 
} from './services/googleAuthService';
import { storageService } from './services/storageService';
import { 
  createKhataPotroSpreadsheet, 
  syncAllToSheet,
  extractSpreadsheetId,
  ensureRequiredSheetsExist
} from './services/googleSheetsService';
import { uploadDocumentToDrive } from './services/googleDriveService';

import type { 
  Transaction, 
  InventoryItem, 
  InventoryLog, 
  CloudDocument, 
  SheetConfig, 
  Language, 
  DocumentCategory,
  TransactionType,
  UserProfile,
  GoogleUser,
  DailyExpenseLimit,
  CalorieMealLog,
  CalorieActivityLog,
  CalorieUserProfile,
  CalorieReminder
} from './types';

// Components
import { Navbar } from './components/Navbar';
import { BalanceCard } from './components/BalanceCard';
import { QuickActions } from './components/QuickActions';
import { RecentTransactions } from './components/RecentTransactions';
import { CategoryExpenseReport } from './components/CategoryExpenseReport';
import { DocumentManager } from './components/DocumentManager';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { DailyExpenseLimitModal } from './components/DailyExpenseLimitModal';
import { ReportPage } from './components/ReportPage';
import { LoanPage } from './components/LoanPage';
import { LendingPage } from './components/LendingPage';
import { CalorieMeterPage } from './components/CalorieMeterPage';
import { WhatsAppSenderPage } from './components/WhatsAppSenderPage';
import { LiveSyncIndicator } from './components/LiveSyncIndicator';
import { FloatingNav } from './components/FloatingNav';
import { FirstTimeRegistrationModal } from './components/FirstTimeRegistrationModal';
import { DeleteAllDataModal } from './components/DeleteAllDataModal';
import { TransactionsLedgerModal } from './components/TransactionsLedgerModal';
import type { ActivePage } from './types';

import { 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  X, 
  Filter,
  ArrowUp,
  Coins,
  FileCheck,
  Trash2,
  CreditCard,
  HandCoins,
  Flame,
  MessageSquare
} from 'lucide-react';
import { formatCurrency } from './utils/formatters';

export default function App() {
  // Global App State - check stored Google OAuth auth first
  const [user, setUser] = useState<User | GoogleUser | null>(() => getStoredAuth().user);
  const [token, setToken] = useState<string | null>(() => getStoredAuth().token);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => storageService.getUserProfile());
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());
  const [activePage, setActivePage] = useState<ActivePage>('home');

  // Data Collections
  const [transactions, setTransactions] = useState<Transaction[]>(() => storageService.getTransactions());
  const [inventory] = useState<InventoryItem[]>(() => storageService.getInventory());
  const [inventoryLogs] = useState<InventoryLog[]>(() => storageService.getInventoryLogs());
  const [documents, setDocuments] = useState<CloudDocument[]>(() => storageService.getDocuments());
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => storageService.getSheetConfig());
  const [dailyExpenseLimit, setDailyExpenseLimit] = useState<DailyExpenseLimit>(() => storageService.getDailyExpenseLimit());

  // Calorie & Diet State
  const [calorieMeals, setCalorieMeals] = useState<CalorieMealLog[]>(() => storageService.getCalorieMealLogs());
  const [calorieActivities, setCalorieActivities] = useState<CalorieActivityLog[]>(() => storageService.getCalorieActivityLogs());
  const [calorieProfile, setCalorieProfile] = useState<CalorieUserProfile>(() => storageService.getCalorieProfile());
  const [calorieReminders, setCalorieReminders] = useState<CalorieReminder[]>(() => storageService.getCalorieReminders());
  const [selectedCalorieDate, setSelectedCalorieDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [calorieWater, setCalorieWater] = useState<number>(() => storageService.getWaterGlasses(new Date().toISOString().slice(0, 10)));

  // UI States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddTxVoiceMode, setIsAddTxVoiceMode] = useState(false);
  const [addTxDefaultType, setAddTxDefaultType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [ledgerInitialFilter, setLedgerInitialFilter] = useState<'all' | 'income' | 'expense' | 'debt' | 'lending'>('all');
  const [isDailyLimitModalOpen, setIsDailyLimitModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAllTxModalOpen, setIsAllTxModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState<boolean>(() => {
    return !storageService.getUserProfile() && !storageService.isInitialized();
  });
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  // Show auto-dismissing toast
  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  }, []);

  // Listen to Firebase Auth state if configured
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        // Only clear if no stored Google User
        if (!getStoredAuth().user) {
          setUser(null);
          setToken(null);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Save collections when modified
  useEffect(() => {
    storageService.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    storageService.saveDocuments(documents);
  }, [documents]);

  useEffect(() => {
    storageService.saveSheetConfig(sheetConfig);
  }, [sheetConfig]);

  // Calorie local persistence
  useEffect(() => {
    storageService.saveCalorieMealLogs(calorieMeals);
  }, [calorieMeals]);

  useEffect(() => {
    storageService.saveCalorieActivityLogs(calorieActivities);
  }, [calorieActivities]);

  useEffect(() => {
    storageService.saveCalorieProfile(calorieProfile);
  }, [calorieProfile]);

  useEffect(() => {
    storageService.saveCalorieReminders(calorieReminders);
  }, [calorieReminders]);

  useEffect(() => {
    setCalorieWater(storageService.getWaterGlasses(selectedCalorieDate));
  }, [selectedCalorieDate]);

  // LIVE DATA AUTO-SYNC (No button tap needed):
  // Automatically triggers 2 seconds after any changes in transactions, documents, or calorie logs
  useEffect(() => {
    if (!token || !sheetConfig.spreadsheetId || !sheetConfig.autoSync) return;

    const timer = setTimeout(async () => {
      try {
        setIsSyncing(true);
        await syncAllToSheet(
          token,
          sheetConfig.spreadsheetId,
          transactions,
          inventory,
          inventoryLogs,
          documents,
          calorieMeals,
          calorieActivities
        );
        setSheetConfig((prev) => ({
          ...prev,
          lastSyncTime: new Date().toISOString(),
        }));
      } catch (err) {
        console.debug('Live Auto-sync notice:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [
    token, 
    sheetConfig.spreadsheetId, 
    sheetConfig.autoSync, 
    transactions, 
    inventory, 
    inventoryLogs, 
    documents,
    calorieMeals,
    calorieActivities
  ]);

  // Periodic fallback sync every 60 seconds
  useEffect(() => {
    if (!token || !sheetConfig.spreadsheetId || !sheetConfig.autoSync) return;

    const intervalId = setInterval(async () => {
      try {
        await syncAllToSheet(
          token,
          sheetConfig.spreadsheetId,
          transactions,
          inventory,
          inventoryLogs,
          documents,
          calorieMeals,
          calorieActivities
        );
        setSheetConfig((prev) => ({
          ...prev,
          lastSyncTime: new Date().toISOString(),
        }));
      } catch (err) {
        console.debug('Periodic sync notice:', err);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [token, sheetConfig.spreadsheetId, sheetConfig.autoSync, transactions, inventory, inventoryLogs, documents, calorieMeals, calorieActivities]);

  const toggleLanguage = () => {
    const nextLang = language === 'bn' ? 'en' : 'bn';
    setLanguage(nextLang);
    storageService.saveLanguage(nextLang);
  };

  // Calculations for Balance Card matching user photo
  const { totalBalance, monthIncome, monthExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const currentMonthPrefix = '2026-09'; // September 2026

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        if (tx.date.startsWith(currentMonthPrefix)) income += tx.amount;
      } else {
        if (tx.date.startsWith(currentMonthPrefix)) expense += tx.amount;
      }
    });

    // Opening baseline balance
    let opening = 0;
    if (userProfile && typeof userProfile.openingBalance === 'number') {
      opening = userProfile.openingBalance;
    } else if (transactions.length > 0) {
      opening = 19743; // baseline for initial demo records
    }
    const allIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const allExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const currentBalance = opening + allIncome - allExpense;

    return {
      totalBalance: currentBalance,
      monthIncome: income,
      monthExpense: expense,
    };
  }, [transactions, userProfile]);

  // Today's expense calculation for Daily Limit Tracker
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense' && t.date === todayStr)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, todayStr]);

  // Save Daily Expense Limit
  const handleSaveDailyLimit = (newLimit: DailyExpenseLimit) => {
    setDailyExpenseLimit(newLimit);
    storageService.saveDailyExpenseLimit(newLimit);
    showToast(
      language === 'bn'
        ? `দৈনিক খরচের লিমিট ${newLimit.enabled ? formatCurrency(newLimit.amount, language) + ' সেট করা হয়েছে' : 'বন্ধ করা হয়েছে'}`
        : `Daily limit ${newLimit.enabled ? 'set to ' + formatCurrency(newLimit.amount, language) : 'disabled'}`,
      'success'
    );
  };

  // Handle User Profile Registration / Update
  const handleRegisterProfile = (profile: UserProfile, initialBalance: number) => {
    storageService.saveUserProfile(profile);
    setUserProfile(profile);
    if (initialBalance > 0) {
      const hasOpening = transactions.some(t => t.category === 'প্রারম্ভিক ক্যাশ' || t.title.includes('প্রারম্ভিক'));
      if (!hasOpening) {
        const openingTx: Transaction = {
          id: 'tx_opening_' + Date.now(),
          title: 'প্রারম্ভিক ক্যাশ ব্যালেন্স',
          amount: initialBalance,
          type: 'income',
          category: 'প্রারম্ভিক ক্যাশ',
          badge: 'জমা',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'Cash',
          notes: 'খাতা শুরুর প্রারম্ভিক নগদ জমা',
          syncedToSheets: false,
        };
        setTransactions(prev => [openingTx, ...prev]);
      }
    }
    showToast(
      language === 'bn' 
        ? `স্বাগতম ${profile.name}! আপনার খাতা সফলভাবে সংরক্ষিত হয়েছে।` 
        : `Welcome ${profile.name}! Your ledger has been configured.`,
      'success'
    );
  };

  // Factory Reset / Delete All Data
  const handleDeleteAllData = () => {
    storageService.clearAllData();
    setTransactions([]);
    setDocuments([]);
    setUserProfile(null);
    setSheetConfig(storageService.getSheetConfig());
    setIsDeleteAllModalOpen(false);
    showToast(
      language === 'bn' 
        ? 'সকল ডেটা স্থায়ীভাবে মুছে ফেলা হয়েছে।' 
        : 'All records have been deleted permanently.',
      'success'
    );
    // Trigger clean registration modal for fresh setup
    setTimeout(() => {
      setIsRegistrationModalOpen(true);
    }, 300);
  };

  // Handle Google / Gmail Sign-in with direct user interaction
  const handleLogin = async () => {
    try {
      const res = await signInWithGoogle();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showToast(
          language === 'bn'
            ? `স্বাগতম, ${res.user.displayName || res.user.email}!`
            : `Welcome, ${res.user.displayName || res.user.email}!`
        );
      }
    } catch (gsiErr: any) {
      if (gsiErr?.isCancelled || gsiErr?.code === 'auth/popup-closed') {
        showToast(
          language === 'bn' ? 'গুগল সাইন-ইন বাতিল করা হয়েছে।' : 'Sign-in was cancelled.',
          'error'
        );
        return;
      }
      if (gsiErr?.code === 'auth/popup-blocked') {
        showToast(
          language === 'bn'
            ? 'ব্রাউজারে পপ-আপ ব্লক করা আছে। ব্রাউজারের অ্যাড্রেস বার থেকে পপ-আপ এলাউ করুন।'
            : 'Popup blocked by browser. Please allow popups for this site.',
          'error'
        );
        return;
      }
      console.warn('Google sign-in notice:', gsiErr);
      showToast(gsiErr?.message || 'Google Sign-in failed', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    signOutGoogle();
    setUser(null);
    setToken(null);
    showToast(language === 'bn' ? 'লগআউট সফল হয়েছে' : 'Signed out successfully');
  };

  // Helper to ensure a fresh, valid token with Google Sheets & Drive scopes
  const ensureValidToken = async (): Promise<string | null> => {
    if (token) return token;

    // First check stored authentication in localStorage
    const stored = getStoredAuth();
    if (stored.token) {
      setToken(stored.token);
      if (stored.user) setUser(stored.user);
      return stored.token;
    }

    try {
      const res = await signInWithGoogle();
      if (res?.accessToken) {
        setUser(res.user);
        setToken(res.accessToken);
        return res.accessToken;
      }
    } catch (gsiErr: any) {
      if (gsiErr?.isCancelled || gsiErr?.code === 'auth/popup-closed') {
        console.info('Sign-in cancelled or popup closed by user.');
        return null;
      }
      if (gsiErr?.code === 'auth/popup-blocked') {
        throw new Error(
          language === 'bn'
            ? 'ব্রাউজারে পপ-আপ ব্লক করা আছে। ব্রাউজারের অ্যাড্রেস বার থেকে পপ-আপ এলাউ করুন।'
            : 'Popup blocked by browser. Please allow popups for this site in your browser bar.'
        );
      }
      console.warn('Sign-in notice:', gsiErr);
      throw gsiErr;
    }
    return null;
  };

  // Perform Full Google Sheets Sync
  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const currentToken = await ensureValidToken();
      if (!currentToken) {
        showToast(
          language === 'bn'
            ? 'গুগল শিটে ডেটা পাঠাতে প্রথমে গুগল অ্যাকাউন্ট দিয়ে সাইন ইন করুন।'
            : 'Please sign in with Google to push records to Google Sheets.',
          'error'
        );
        return;
      }

      let targetSheetId = sheetConfig.spreadsheetId;

      // Auto-create spreadsheet if none exists yet
      if (!targetSheetId) {
        const created = await createKhataPotroSpreadsheet(
          currentToken,
          'KhataPotro - আয় ও ব্যয় হিসাব এবং ডকুমেন্ট ভল্ট'
        );
        targetSheetId = created.spreadsheetId;
        const newCfg: SheetConfig = {
          spreadsheetId: created.spreadsheetId,
          spreadsheetUrl: created.spreadsheetUrl,
          spreadsheetName: 'KhataPotro - আয় ও ব্যয় হিসাব এবং ডকুমেন্ট ভল্ট',
          lastSyncTime: new Date().toISOString(),
          autoSync: true,
        };
        setSheetConfig(newCfg);
        storageService.saveSheetConfig(newCfg);
      } else {
        // Ensure the 4 tabs exist in this sheet
        await ensureRequiredSheetsExist(currentToken, targetSheetId);
      }

      // Sync data to Google Sheets
      await syncAllToSheet(
        currentToken,
        targetSheetId,
        transactions,
        inventory,
        inventoryLogs,
        documents,
        calorieMeals,
        calorieActivities
      );

      const updatedCfg: SheetConfig = {
        ...sheetConfig,
        spreadsheetId: targetSheetId,
        lastSyncTime: new Date().toISOString(),
      };
      setSheetConfig(updatedCfg);
      storageService.saveSheetConfig(updatedCfg);

      // Mark all as synced
      setTransactions((prev) => prev.map((t) => ({ ...t, syncedToSheets: true })));
      setDocuments((prev) => prev.map((d) => ({ ...d, syncedToSheets: true })));

      showToast(
        language === 'bn'
          ? 'গুগল শিট ও ক্লাউডে সকল তথ্য সফলভাবে সংরক্ষিত হয়েছে!'
          : 'All records synced to Google Sheets successfully!'
      );
    } catch (err: any) {
      console.error('Sync failed:', err);
      showToast(err?.message || 'Sync failed. Check permissions.', 'error');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Create New Sheet
  const handleCreateNewSheet = async () => {
    setIsSyncing(true);
    try {
      const currentToken = await ensureValidToken();
      if (!currentToken) {
        showToast(
          language === 'bn'
            ? 'নতুন শিট তৈরি করতে অনুগ্রহ করে প্রথমে গুগল অ্যাকাউন্ট দিয়ে সাইন ইন করুন।'
            : 'Please sign in with Google to create a new spreadsheet.',
          'error'
        );
        return;
      }

      const result = await createKhataPotroSpreadsheet(
        currentToken,
        'KhataPotro - আয় ও ব্যয় হিসাব এবং ডকুমেন্ট ভল্ট'
      );
      const newCfg: SheetConfig = {
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        spreadsheetName: 'KhataPotro - আয় ও ব্যয় হিসাব এবং ডকুমেন্ট ভল্ট',
        lastSyncTime: new Date().toISOString(),
        autoSync: true,
      };
      setSheetConfig(newCfg);
      storageService.saveSheetConfig(newCfg);

      // Sync all existing data immediately
      await syncAllToSheet(
        currentToken,
        result.spreadsheetId,
        transactions,
        inventory,
        inventoryLogs,
        documents,
        calorieMeals,
        calorieActivities
      );

      setTransactions((prev) => prev.map((t) => ({ ...t, syncedToSheets: true })));
      setDocuments((prev) => prev.map((d) => ({ ...d, syncedToSheets: true })));

      showToast(
        language === 'bn'
          ? 'নতুন গুগল স্প্রেডশিট সফলভাবে তৈরি ও সিঙ্ক হয়েছে!'
          : 'New Google Spreadsheet created and synced successfully!'
      );
    } catch (err: any) {
      console.error('Create sheet failed:', err);
      showToast(err?.message || 'Failed to create spreadsheet', 'error');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Save Existing Sheet ID / Link and Sync Data Immediately
  const handleSaveExistingSheetId = async (input: string) => {
    const cleanId = extractSpreadsheetId(input);
    if (!cleanId) {
      showToast(
        language === 'bn' ? 'সঠিক গুগল স্প্রেডশিট আইডি বা লিংক দিন' : 'Please provide a valid Google Sheet link or ID',
        'error'
      );
      return;
    }

    const url = `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;
    const newConfig: SheetConfig = {
      ...sheetConfig,
      spreadsheetId: cleanId,
      spreadsheetUrl: url,
      spreadsheetName: 'KhataPotro Linked Sheet',
      autoSync: true,
    };
    setSheetConfig(newConfig);
    storageService.saveSheetConfig(newConfig);

    showToast(
      language === 'bn'
        ? 'গুগল শিট লিংক সফলভাবে সংযুক্ত হয়েছে! ডেটা সিঙ্ক হচ্ছে...'
        : 'Google Sheet linked! Synchronizing data...',
      'success'
    );

    // Sync all data immediately into this linked spreadsheet
    try {
      const currentToken = await ensureValidToken();
      if (currentToken) {
        setIsSyncing(true);
        // Automatically create missing tabs (Ledger_Transactions, RealTime_Inventory, Inventory_Logs, Document_Vault)
        await ensureRequiredSheetsExist(currentToken, cleanId);
        await syncAllToSheet(
          currentToken,
          cleanId,
          transactions,
          inventory,
          inventoryLogs,
          documents,
          calorieMeals,
          calorieActivities
        );
        const finalConfig: SheetConfig = {
          ...newConfig,
          lastSyncTime: new Date().toISOString(),
        };
        setSheetConfig(finalConfig);
        storageService.saveSheetConfig(finalConfig);

        setTransactions((prev) => prev.map((t) => ({ ...t, syncedToSheets: true })));
        setDocuments((prev) => prev.map((d) => ({ ...d, syncedToSheets: true })));

        showToast(
          language === 'bn'
            ? 'লিংক করা গুগল শিটে সকল তথ্য সফলভাবে সিঙ্ক হয়েছে!'
            : 'All data synced to linked Google Sheet successfully!',
          'success'
        );
      } else {
        showToast(
          language === 'bn'
            ? 'শিট লিংক সংরক্ষিত হয়েছে! তথ্য শিটে পাঠাতে গুগল সাইন-ইন সম্পন্ন করুন।'
            : 'Sheet link saved! Sign in with Google to push records to the sheet.',
          'success'
        );
      }
    } catch (err: any) {
      console.error('Sync to linked sheet failed:', err);
      showToast(err?.message || 'Failed to sync with linked sheet. Check permissions.', 'error');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Add Transaction
  const handleAddTransaction = async (
    newTx: Omit<Transaction, 'id' | 'syncedToSheets'>,
    newFileToUpload?: { file: File; title: string; category: DocumentCategory }
  ) => {
    let receiptDocId: string | undefined = newTx.receiptDocId;

    if (newFileToUpload) {
      try {
        let fileDataUrl: string | undefined = undefined;
        try {
          fileDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(newFileToUpload.file);
          });
        } catch {
          // data url generation fallback
        }

        let driveResult: { fileId: string; webViewLink?: string; webContentLink?: string } | null = null;
        if (token) {
          driveResult = await uploadDocumentToDrive(
            token,
            newFileToUpload.file,
            newFileToUpload.file.name,
            newFileToUpload.category,
            newTx.amount
          );
        }

        const newDoc: CloudDocument = {
          id: `doc_${Date.now()}`,
          title: newFileToUpload.title || newFileToUpload.file.name,
          docCategory: newFileToUpload.category,
          fileName: newFileToUpload.file.name,
          fileSize: newFileToUpload.file.size,
          fileType: newFileToUpload.file.type,
          uploadDate: new Date().toISOString(),
          driveFileId: driveResult?.fileId,
          driveViewLink: driveResult?.webViewLink,
          driveDownloadLink: driveResult?.webContentLink,
          fileDataUrl,
          amount: newTx.amount,
          syncedToDrive: Boolean(driveResult?.fileId),
          syncedToSheets: false,
        };

        setDocuments((prev) => [newDoc, ...prev]);
        receiptDocId = newDoc.id;
      } catch (err) {
        console.warn('Voucher upload failed, proceeding with transaction:', err);
      }
    }

    const created: Transaction = {
      ...newTx,
      id: `tx_${Date.now()}`,
      receiptDocId,
      syncedToSheets: false,
    };

    const updated = [created, ...transactions];
    setTransactions(updated);

    showToast(
      language === 'bn'
        ? `${created.type === 'income' ? 'জমা' : 'খরচ'} সফলভাবে যুক্ত হয়েছে!`
        : `${created.type === 'income' ? 'Income' : 'Expense'} added successfully!`
    );

    // Auto-sync in background if configured and token available
    if (token && sheetConfig.spreadsheetId && sheetConfig.autoSync) {
      syncAllToSheet(token, sheetConfig.spreadsheetId, updated, inventory, inventoryLogs, documents)
        .catch(console.warn);
    }
  };

  // Update Existing Transaction
  const handleUpdateTransaction = async (
    updatedTx: Transaction,
    newFileToUpload?: { file: File; title: string; category: DocumentCategory }
  ) => {
    let receiptDocId: string | undefined = updatedTx.receiptDocId;

    if (newFileToUpload) {
      try {
        let fileDataUrl: string | undefined = undefined;
        try {
          fileDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(newFileToUpload.file);
          });
        } catch {
          // fallback
        }

        let driveResult: { fileId: string; webViewLink?: string; webContentLink?: string } | null = null;
        if (token) {
          driveResult = await uploadDocumentToDrive(
            token,
            newFileToUpload.file,
            newFileToUpload.file.name,
            newFileToUpload.category,
            updatedTx.amount
          );
        }

        const newDoc: CloudDocument = {
          id: `doc_${Date.now()}`,
          title: newFileToUpload.title || newFileToUpload.file.name,
          docCategory: newFileToUpload.category,
          fileName: newFileToUpload.file.name,
          fileSize: newFileToUpload.file.size,
          fileType: newFileToUpload.file.type,
          uploadDate: new Date().toISOString(),
          driveFileId: driveResult?.fileId,
          driveViewLink: driveResult?.webViewLink,
          driveDownloadLink: driveResult?.webContentLink,
          fileDataUrl,
          amount: updatedTx.amount,
          syncedToDrive: Boolean(driveResult?.fileId),
          syncedToSheets: false,
        };

        setDocuments((prev) => [newDoc, ...prev]);
        receiptDocId = newDoc.id;
      } catch (err) {
        console.warn('Voucher upload failed, proceeding with update:', err);
      }
    }

    const modified: Transaction = {
      ...updatedTx,
      receiptDocId,
      syncedToSheets: false,
    };

    const updatedList = transactions.map((t) => (t.id === modified.id ? modified : t));
    setTransactions(updatedList);
    setEditingTransaction(null);

    showToast(
      language === 'bn'
        ? 'লেনদেনের তথ্য সফলভাবে আপডেট করা হয়েছে!'
        : 'Transaction updated successfully!'
    );

    if (token && sheetConfig.spreadsheetId && sheetConfig.autoSync) {
      syncAllToSheet(token, sheetConfig.spreadsheetId, updatedList, inventory, inventoryLogs, documents)
        .catch(console.warn);
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    showToast(language === 'bn' ? 'লেনদেন মুছে ফেলা হয়েছে' : 'Transaction deleted');

    if (token && sheetConfig.spreadsheetId && sheetConfig.autoSync) {
      syncAllToSheet(token, sheetConfig.spreadsheetId, updated, inventory, inventoryLogs, documents)
        .catch(console.warn);
    }
  };

  // Helper for taking new Loan (Income + দেনা)
  const handleAddLoan = async (personName: string, amount: number, notes?: string) => {
    await handleAddTransaction({
      title: personName,
      amount,
      type: 'income',
      category: 'ঋণ গ্রহণ',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      badge: 'দেনা',
      personName,
      notes: notes || 'ঋণ গ্রহণ (দেনা বৃদ্ধি)',
    });
  };

  // Helper for repaying Loan (Expense + দেনা পরিশোধ)
  const handleRepayLoan = async (personName: string, amount: number, notes?: string) => {
    await handleAddTransaction({
      title: `${personName} (ঋণ পরিশোধ)`,
      amount,
      type: 'expense',
      category: 'ঋণ পরিশোধ',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      badge: 'খরচ',
      personName,
      notes: notes || 'ঋণ পরিশোধ (দেনা হ্রাস)',
    });
  };

  // Helper for lending money out (Expense + পাওনা)
  const handleAddLending = async (personName: string, amount: number, notes?: string) => {
    await handleAddTransaction({
      title: personName,
      amount,
      type: 'expense',
      category: 'ধার প্রদান',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      badge: 'পাওনা',
      personName,
      notes: notes || 'ধার প্রদান (পাওনা বৃদ্ধি)',
    });
  };

  // Helper for receiving lent money back (Income + ধার ফেরত)
  const handleReceiveLendingReturn = async (personName: string, amount: number, notes?: string) => {
    await handleAddTransaction({
      title: `${personName} (ধার ফেরত)`,
      amount,
      type: 'income',
      category: 'ধার ফেরত',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      badge: 'জমা',
      personName,
      notes: notes || 'ধার ফেরত আদায় (পাওনা হ্রাস)',
    });
  };

  // Upload Document
  const handleUploadDocument = async (
    file: File,
    title: string,
    category: DocumentCategory,
    amount?: number,
    notes?: string
  ) => {
    setIsUploading(true);
    try {
      let fileDataUrl: string | undefined = undefined;
      try {
        fileDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      } catch {
        // fallback
      }

      let driveResult: { fileId: string; webViewLink?: string; webContentLink?: string } | null = null;

      if (token) {
        try {
          driveResult = await uploadDocumentToDrive(
            token,
            file,
            file.name,
            category,
            amount
          );
        } catch (driveErr) {
          console.warn('Google Drive upload error, saving locally:', driveErr);
        }
      }

      const newDoc: CloudDocument = {
        id: `doc_${Date.now()}`,
        title: title || file.name,
        docCategory: category,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        driveFileId: driveResult?.fileId,
        driveViewLink: driveResult?.webViewLink,
        driveDownloadLink: driveResult?.webContentLink,
        fileDataUrl,
        amount,
        notes,
        syncedToDrive: Boolean(driveResult?.fileId),
        syncedToSheets: false,
      };

      const updatedDocs = [newDoc, ...documents];
      setDocuments(updatedDocs);

      showToast(
        language === 'bn'
          ? driveResult
            ? 'ডকুমেন্ট গুগল ড্রাইভ ও ভল্টে সফলভাবে সংরক্ষিত হয়েছে!'
            : 'ডকুমেন্ট ভল্টে সংরক্ষিত হয়েছে!'
          : driveResult
          ? 'Document uploaded to Google Drive and logged!'
          : 'Document saved to Vault!'
      );

      if (token && sheetConfig.spreadsheetId) {
        syncAllToSheet(token, sheetConfig.spreadsheetId, transactions, inventory, inventoryLogs, updatedDocs)
          .catch(console.warn);
      }
    } catch (err: any) {
      showToast(err?.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = (docId: string) => {
    const updated = documents.filter((d) => d.id !== docId);
    setDocuments(updated);
    showToast(language === 'bn' ? 'ডকুমেন্ট মুছে ফেলা হয়েছে' : 'Document deleted');

    if (token && sheetConfig.spreadsheetId) {
      syncAllToSheet(token, sheetConfig.spreadsheetId, transactions, inventory, inventoryLogs, updated, calorieMeals, calorieActivities)
        .catch(console.warn);
    }
  };

  // Calorie & Diet Handlers
  const handleAddMealLog = (newMeal: Omit<CalorieMealLog, 'id' | 'syncedToSheets'>) => {
    const mealWithId: CalorieMealLog = {
      ...newMeal,
      id: 'meal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      syncedToSheets: false,
    };
    setCalorieMeals((prev) => [mealWithId, ...prev]);
    showToast(
      language === 'bn'
        ? `"${newMeal.foodName}" (+${newMeal.calories} kcal) সফলভাবে এন্ট্রি হয়েছে!`
        : `"${newMeal.foodName}" logged (+${newMeal.calories} kcal)!`
    );
  };

  const handleDeleteMealLog = (id: string) => {
    setCalorieMeals((prev) => prev.filter((m) => m.id !== id));
    showToast(language === 'bn' ? 'খাবার এন্ট্রি মুছে ফেলা হয়েছে' : 'Meal entry deleted');
  };

  const handleAddActivityLog = (newAct: Omit<CalorieActivityLog, 'id' | 'syncedToSheets'>) => {
    const actWithId: CalorieActivityLog = {
      ...newAct,
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      syncedToSheets: false,
    };
    setCalorieActivities((prev) => [actWithId, ...prev]);
    showToast(
      language === 'bn'
        ? `কাজের হিসাব যোগ হয়েছে: -${newAct.caloriesBurned} kcal বার্ন!`
        : `Activity logged: -${newAct.caloriesBurned} kcal burned!`
    );
  };

  const handleDeleteActivityLog = (id: string) => {
    setCalorieActivities((prev) => prev.filter((a) => a.id !== id));
    showToast(language === 'bn' ? 'কাজের রেকর্ড মুছে ফেলা হয়েছে' : 'Activity record deleted');
  };

  const handleUpdateCalorieProfile = (updatedProfile: CalorieUserProfile) => {
    setCalorieProfile(updatedProfile);
    storageService.saveCalorieProfile(updatedProfile);
    showToast(
      language === 'bn' ? 'শারীরিক লক্ষ্য ও ডায়েট প্রোফাইল সংরক্ষিত হয়েছে' : 'Profile updated'
    );
  };

  const handleToggleCalorieReminder = (id: string) => {
    setCalorieReminders((prev) =>
      prev.map((rem) => (rem.id === id ? { ...rem, enabled: !rem.enabled } : rem))
    );
  };

  const handleUpdateWaterGlasses = (count: number) => {
    setCalorieWater(count);
    storageService.saveWaterGlasses(selectedCalorieDate, count);
  };

  // Recent 5 transactions matching user's photo
  const recentTransactionsList = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const scrollToReports = () => {
    const el = document.getElementById('reports-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased selection:bg-blue-100">
      {/* Top Navigation */}
      <Navbar
        user={user}
        sheetConfig={sheetConfig}
        isSyncing={isSyncing}
        onSync={handleSyncAll}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenDailyLimitModal={() => setIsDailyLimitModalOpen(true)}
        onLogin={handleLogin}
        onLogout={handleLogout}
        language={language}
        onToggleLanguage={toggleLanguage}
        activePage={activePage}
        onNavigate={(p) => setActivePage(p)}
        userProfile={userProfile}
        onOpenRegistration={() => setIsRegistrationModalOpen(true)}
        onOpenDeleteAllData={() => setIsDeleteAllModalOpen(true)}
      />

      {/* Main Container dynamically sized for tables and dashboard */}
      <main className={`flex-1 w-full mx-auto px-4 py-5 sm:py-6 ${
        activePage === 'home' ? 'max-w-xl' : 'max-w-4xl'
      }`}>
        {/* Toast Alert Banner */}
        {toastMessage && (
          <div
            className={`mb-4 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-lg transition-all animate-in slide-in-from-top-2 duration-200 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. HOME VIEW */}
        {activePage === 'home' && (
          <>
            {/* 1. Greeting & Gradient Balance Card (Exact match with photo) */}
            <BalanceCard
              totalBalance={totalBalance}
              monthIncome={monthIncome}
              monthExpense={monthExpense}
              todayExpense={todayExpense}
              dailyExpenseLimit={dailyExpenseLimit}
              onOpenDailyLimitModal={() => setIsDailyLimitModalOpen(true)}
              onOpenAllTransactions={() => {
                setLedgerInitialFilter('all');
                setIsAllTxModalOpen(true);
              }}
              onOpenIncomeList={() => {
                setLedgerInitialFilter('income');
                setIsAllTxModalOpen(true);
              }}
              onOpenExpenseList={() => {
                setLedgerInitialFilter('expense');
                setIsAllTxModalOpen(true);
              }}
              userName={userProfile?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Bappy'}
              language={language}
            />

            {/* 2. 5 Quick Action Buttons (Exact match with photo: জমা, খরচ, রিপোর্ট, ক্যাটাগরি, সেটিংস) */}
            <QuickActions
              onAddIncome={() => {
                setEditingTransaction(null);
                setAddTxDefaultType('income');
                setIsAddTxVoiceMode(false);
                setIsAddTxOpen(true);
              }}
              onAddExpense={() => {
                setEditingTransaction(null);
                setAddTxDefaultType('expense');
                setIsAddTxVoiceMode(false);
                setIsAddTxOpen(true);
              }}
              onAddVoiceExpense={() => {
                setEditingTransaction(null);
                setAddTxDefaultType('expense');
                setIsAddTxVoiceMode(true);
                setIsAddTxOpen(true);
              }}
              onOpenReports={() => setActivePage('report')}
              onOpenCategories={() => {
                setLedgerInitialFilter('all');
                setIsAllTxModalOpen(true);
              }}
              onOpenSettings={() => setIsSyncModalOpen(true)}
              language={language}
            />

            {/* 3. Quick Navigation Hub to Report, Loans, Lending */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              <button
                type="button"
                onClick={() => setActivePage('report')}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl shadow-xs transition-all flex flex-col items-center text-center group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Search className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800">
                  {language === 'bn' ? 'সার্চ ও রিপোর্ট' : 'Reports'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'bn' ? 'Excel / PDF' : 'Excel / PDF'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActivePage('loans')}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl shadow-xs transition-all flex flex-col items-center text-center group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800">
                  {language === 'bn' ? 'ঋণ হিসাব (দেনা)' : 'Loans Ledger'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'bn' ? 'দেনা বৃদ্ধি/হ্রাস' : 'Debt balance'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActivePage('lending')}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl shadow-xs transition-all flex flex-col items-center text-center group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <HandCoins className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800">
                  {language === 'bn' ? 'ধার হিসাব (পাওনা)' : 'Lending Ledger'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'bn' ? 'পাওনা বৃদ্ধি/কমবে' : 'Receivables'}
                </span>
              </button>
            </div>

            {/* Quick Calorie Meter Summary Banner on Home */}
            <div className="mb-6 p-3.5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-rose-500/10 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {language === 'bn' ? 'দৈনিক ক্যালরি মিটার ও স্বাস্থ্য সহায়িকা' : 'Daily Calorie Meter'}
                    </span>
                    <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      Live
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                    {language === 'bn'
                      ? 'সারাদিনের খাবার ও কাজের ক্যালরি, ডায়েট প্লান ও রিমাইন্ডার'
                      : 'Track meals, calories burned, diet plans & reminders'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('calorie')}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
              >
                {language === 'bn' ? 'মিটার দেখুন →' : 'View Meter →'}
              </button>
            </div>

            {/* WA Sender+ Checklist & Dual WhatsApp Quick Hub */}
            <div className="mb-6 p-3.5 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-emerald-500/10 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {language === 'bn' ? 'WA Sender+ (হোয়াটসঅ্যাপ চেকলিস্ট ও বিজনেস ক্লোন)' : 'WA Sender+ (WhatsApp Checklist & Clone)'}
                    </span>
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      Plus
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                    {language === 'bn'
                      ? 'কাস্টম ক্যাটাগরি চেকলিস্ট, মেসেজ হিস্ট্রি, ডুয়াল/ক্লোন হোয়াটসঅ্যাপ সাপোর্ট, বয়স ও লিফটিং ক্যালকুলেটর'
                      : 'Custom presets, message history, dual/cloned WhatsApp intent, age & lifting calculators'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('whatsapp')}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
              >
                {language === 'bn' ? 'টুলকিট খুলুন →' : 'Open Toolkit →'}
              </button>
            </div>

            {/* 4. সর্বশেষ লেনদেন (Recent Transactions with "সব দেখুন ও এডিট") */}
            <RecentTransactions
              transactions={recentTransactionsList}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsAddTxOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onViewReceipt={(docId) => setActivePage('vault')}
              onViewAll={() => {
                setLedgerInitialFilter('all');
                setIsAllTxModalOpen(true);
              }}
              language={language}
            />

            {/* 5. ক্যাটাগরি অনুযায়ী খরচ & ক্যাটাগরি ওয়াইজ খরচ Donut Chart */}
            <div id="reports-section">
              <CategoryExpenseReport
                transactions={transactions}
                onViewAll={() => setActivePage('report')}
                language={language}
              />
            </div>

            {/* Bottom Link for Document Vault */}
            <div className="mt-2 mb-8 text-center">
              <button
                type="button"
                onClick={() => setActivePage('vault')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
              >
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>
                  {language === 'bn'
                    ? `ডকুমেন্ট ও ভাউচার ভল্ট (${documents.length})`
                    : `Document & Voucher Vault (${documents.length})`}
                </span>
              </button>
            </div>
          </>
        )}

        {/* 2. REPORT PAGE VIEW (Matches user's screenshot exactly) */}
        {activePage === 'report' && (
          <ReportPage
            transactions={transactions}
            userName={user?.displayName?.split(' ')[0] || 'Bappy'}
            language={language}
            onViewReceipt={(docId) => setActivePage('vault')}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsAddTxOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* 3. LOAN & DEBT PAGE VIEW (ঋণ পেজ - দেনা বাড়ে বা কমে) */}
        {activePage === 'loans' && (
          <LoanPage
            transactions={transactions}
            onAddLoan={handleAddLoan}
            onRepayLoan={handleRepayLoan}
            language={language}
          />
        )}

        {/* 4. LENDING PAGE VIEW (ধার পেজ - পাওনা বাড়ে বা কমে) */}
        {activePage === 'lending' && (
          <LendingPage
            transactions={transactions}
            onAddLending={handleAddLending}
            onReceiveLendingReturn={handleReceiveLendingReturn}
            language={language}
          />
        )}

        {/* 5. DOCUMENT VAULT VIEW */}
        {activePage === 'vault' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {language === 'bn' ? 'ডকুমেন্ট ও ভাউচার ভল্ট' : 'Document & Voucher Vault'}
              </h2>
              <button
                type="button"
                onClick={() => setActivePage('home')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                {language === 'bn' ? '← হোমে ফিরুন' : '← Back to Home'}
              </button>
            </div>
            <DocumentManager
              documents={documents}
              onUploadDocument={handleUploadDocument}
              onDeleteDocument={handleDeleteDocument}
              isUploading={isUploading}
              language={language}
            />
          </div>
        )}

        {/* 6. DAILY CALORIE METER & HEALTH PAGE VIEW */}
        {activePage === 'calorie' && (
          <CalorieMeterPage
            mealLogs={calorieMeals}
            activityLogs={calorieActivities}
            calorieProfile={calorieProfile}
            profile={calorieProfile}
            reminders={calorieReminders}
            selectedDate={selectedCalorieDate}
            waterGlasses={calorieWater}
            onSelectDate={(d) => setSelectedCalorieDate(d)}
            onDateChange={(d) => setSelectedCalorieDate(d)}
            onAddMealLog={handleAddMealLog}
            onDeleteMealLog={handleDeleteMealLog}
            onAddActivityLog={handleAddActivityLog}
            onDeleteActivityLog={handleDeleteActivityLog}
            onUpdateProfile={handleUpdateCalorieProfile}
            onToggleReminder={handleToggleCalorieReminder}
            onUpdateWaterGlasses={handleUpdateWaterGlasses}
            language={language}
          />
        )}

        {/* 7. WHATSAPP SENDER PLUS & B2B VOUCHER PAGE */}
        {activePage === 'whatsapp' && (
          <WhatsAppSenderPage
            transactions={transactions}
            language={language}
            userProfile={userProfile}
            onNavigateHome={() => setActivePage('home')}
          />
        )}
      </main>

      {/* Floating Speed-Dial Navigation Button (Always visible on all pages) */}
      <FloatingNav
        activePage={activePage}
        onNavigate={(p) => setActivePage(p)}
        onOpenAddIncome={() => {
          setEditingTransaction(null);
          setAddTxDefaultType('income');
          setIsAddTxOpen(true);
        }}
        onOpenAddExpense={() => {
          setEditingTransaction(null);
          setAddTxDefaultType('expense');
          setIsAddTxOpen(true);
        }}
        language={language}
      />

      {/* Footer */}
      <footer className="mt-auto py-5 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p>
          {language === 'bn' ? 'খাতাপত্র' : 'KhataPotro'} •{' '}
          {language === 'bn' ? 'গুগল শিট ও ড্রাইভ ক্লাউড সিঙ্ক' : 'Google Sheets & Drive Cloud Sync for'}{' '}
          <strong className="text-slate-700 font-semibold">mdbappyhossain018@gmail.com</strong>
        </p>
      </footer>

      {/* Add / Edit Transaction Modal (+ জমা / - খরচ / এডিট) */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => {
          setIsAddTxOpen(false);
          setIsAddTxVoiceMode(false);
          setEditingTransaction(null);
        }}
        defaultType={addTxDefaultType}
        initialTransaction={editingTransaction}
        documents={documents}
        onAddTransaction={handleAddTransaction}
        onUpdateTransaction={handleUpdateTransaction}
        language={language}
        dailyExpenseLimit={dailyExpenseLimit}
        todayExpense={todayExpense}
        initialVoiceMode={isAddTxVoiceMode}
      />

      {/* Daily Expense Limit Settings Modal */}
      <DailyExpenseLimitModal
        isOpen={isDailyLimitModalOpen}
        onClose={() => setIsDailyLimitModalOpen(false)}
        limit={dailyExpenseLimit}
        todayExpense={todayExpense}
        onSaveLimit={handleSaveDailyLimit}
        language={language}
      />

      {/* Google Sheets Sync & Account Modal (সেটিংস) */}
      <GoogleSheetSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        user={user}
        sheetConfig={sheetConfig}
        isSyncing={isSyncing}
        onSyncAll={handleSyncAll}
        onCreateNewSheet={handleCreateNewSheet}
        onSaveExistingSheetId={handleSaveExistingSheetId}
        onLogin={handleLogin}
        onLogout={handleLogout}
        language={language}
        userProfile={userProfile}
        onOpenEditProfile={() => {
          setIsSyncModalOpen(false);
          setIsRegistrationModalOpen(true);
        }}
        onOpenDeleteAllData={() => {
          setIsSyncModalOpen(false);
          setIsDeleteAllModalOpen(true);
        }}
        transactionCount={transactions.length}
        documentCount={documents.length}
      />

      {/* All Transactions & Total Deposit/Expense Ledger Modal */}
      <TransactionsLedgerModal
        isOpen={isAllTxModalOpen}
        onClose={() => setIsAllTxModalOpen(false)}
        transactions={transactions}
        documents={documents}
        onEditTransaction={(tx) => {
          setEditingTransaction(tx);
          setIsAddTxOpen(true);
        }}
        onDeleteTransaction={handleDeleteTransaction}
        onAddNewTransaction={(type) => {
          setEditingTransaction(null);
          setAddTxDefaultType(type);
          setIsAddTxOpen(true);
        }}
        onViewReceipt={(docId) => {
          setIsAllTxModalOpen(false);
          setActivePage('vault');
        }}
        initialFilter={ledgerInitialFilter}
        language={language}
      />

      {/* Cloud Document Vault Modal (ডকুমেন্ট ও রসিদ) */}
      {isDocsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  {language === 'bn' ? 'ক্লাউড ডকুমেন্ট ও ভাউচার ভল্ট' : 'Cloud Document & Voucher Vault'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'bn'
                    ? 'গুগল ড্রাইভে সরাসরি আপলোড ও গুগল শিটে লিঙ্ক সংরক্ষণ'
                    : 'Direct Google Drive upload & Google Sheets cataloging'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDocsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <DocumentManager
                documents={documents}
                onUploadDocument={handleUploadDocument}
                onDeleteDocument={handleDeleteDocument}
                isUploading={isUploading}
                language={language}
              />
            </div>
          </div>
        </div>
      )}

      {/* First Time Registration Modal */}
      <FirstTimeRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        initialProfile={userProfile}
        firebaseUser={user}
        onGoogleSignIn={handleLogin}
        onRegister={handleRegisterProfile}
        language={language}
        isFirstTime={!userProfile}
      />

      {/* Factory Reset / Delete All Data Modal */}
      <DeleteAllDataModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirmDelete={handleDeleteAllData}
        transactionCount={transactions.length}
        documentCount={documents.length}
        language={language}
      />
    </div>
  );
}
