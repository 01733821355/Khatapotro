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
  DailyExpenseLimit
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
import { FloatingNav } from './components/FloatingNav';
import { FirstTimeRegistrationModal } from './components/FirstTimeRegistrationModal';
import { DeleteAllDataModal } from './components/DeleteAllDataModal';
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
  HandCoins
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

  // UI States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [addTxDefaultType, setAddTxDefaultType] = useState<TransactionType>('expense');
  const [isDailyLimitModalOpen, setIsDailyLimitModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAllTxModalOpen, setIsAllTxModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState<boolean>(() => {
    return !storageService.getUserProfile() && !storageService.isInitialized();
  });
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [searchTxQuery, setSearchTxQuery] = useState('');

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

  // Real-Time Background Sync (synchronizes active state seamlessly with Google Sheets)
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
          documents
        );
        setSheetConfig((prev) => ({
          ...prev,
          lastSyncTime: new Date().toISOString(),
        }));
      } catch (err) {
        console.debug('Real-time sync background tick notice:', err);
      }
    }, 45000);

    return () => clearInterval(intervalId);
  }, [token, sheetConfig.spreadsheetId, sheetConfig.autoSync, transactions, inventory, inventoryLogs, documents]);

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
        documents
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
        documents
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
          documents
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
      syncAllToSheet(token, sheetConfig.spreadsheetId, transactions, inventory, inventoryLogs, updated)
        .catch(console.warn);
    }
  };

  // Filtered transactions for the All Transactions modal
  const filteredAllTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchCategory = !selectedCategoryFilter || tx.category === selectedCategoryFilter;
      const matchSearch =
        !searchTxQuery.trim() ||
        tx.title.toLowerCase().includes(searchTxQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchTxQuery.toLowerCase()) ||
        (tx.notes && tx.notes.toLowerCase().includes(searchTxQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [transactions, selectedCategoryFilter, searchTxQuery]);

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
              userName={userProfile?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Bappy'}
              language={language}
            />

            {/* 2. 5 Quick Action Buttons (Exact match with photo: জমা, খরচ, রিপোর্ট, ক্যাটাগরি, সেটিংস) */}
            <QuickActions
              onAddIncome={() => {
                setAddTxDefaultType('income');
                setIsAddTxOpen(true);
              }}
              onAddExpense={() => {
                setAddTxDefaultType('expense');
                setIsAddTxOpen(true);
              }}
              onOpenReports={() => setActivePage('report')}
              onOpenCategories={() => setIsAllTxModalOpen(true)}
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

            {/* 4. সর্বশেষ লেনদেন (Recent Transactions with "সব দেখুন") */}
            <RecentTransactions
              transactions={recentTransactionsList}
              onDeleteTransaction={handleDeleteTransaction}
              onViewReceipt={(docId) => setActivePage('vault')}
              onViewAll={() => setActivePage('report')}
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
      </main>

      {/* Floating Speed-Dial Navigation Button (Always visible on all pages) */}
      <FloatingNav
        activePage={activePage}
        onNavigate={(p) => setActivePage(p)}
        onOpenAddIncome={() => {
          setAddTxDefaultType('income');
          setIsAddTxOpen(true);
        }}
        onOpenAddExpense={() => {
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

      {/* Add Transaction Modal (+ জমা / - খরচ) */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        defaultType={addTxDefaultType}
        documents={documents}
        onAddTransaction={handleAddTransaction}
        language={language}
        dailyExpenseLimit={dailyExpenseLimit}
        todayExpense={todayExpense}
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

      {/* All Transactions Modal (সব লেনদেন দেখুন) */}
      {isAllTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  {language === 'bn' ? 'সকল লেনদেন ও ক্যাটাগরি' : 'All Transactions & Categories'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'bn'
                    ? `মোট ${transactions.length} টি রেকর্ড সংরক্ষিত আছে`
                    : `${transactions.length} total records logged`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAllTxModalOpen(false);
                  setSelectedCategoryFilter(null);
                  setSearchTxQuery('');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter / Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'লেনদেন খুঁজুন (নাম, ক্যাটাগরি বা নোট)...' : 'Search records...'}
                  value={searchTxQuery}
                  onChange={(e) => setSearchTxQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter(null)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                    !selectedCategoryFilter
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {language === 'bn' ? 'সব' : 'All'}
                </button>
                {['বিল', 'অন্যান্য খরচ', 'যাতায়াত', 'খাবার', 'বাজার', 'অন্যান্য জমা'].map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() =>
                      setSelectedCategoryFilter(selectedCategoryFilter === cat ? null : cat)
                    }
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                      selectedCategoryFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {filteredAllTransactions.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs sm:text-sm">
                  {language === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No records found'}
                </div>
              ) : (
                filteredAllTransactions.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  return (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-2xl transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isExpense
                              ? 'bg-rose-100 text-rose-500'
                              : 'bg-amber-100 text-amber-600'
                          }`}
                        >
                          {isExpense ? (
                            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <Coins className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{tx.title}</p>
                          <p className="text-xs text-slate-400">
                            {tx.date} | {tx.category} • {tx.paymentMethod}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-bold text-sm ${
                            isExpense ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isExpense ? '-' : '+'}
                          {formatCurrency(tx.amount, language)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

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
