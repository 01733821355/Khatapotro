import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  Check, 
  Utensils, 
  AlertCircle, 
  RotateCcw,
  Flame,
  Info,
  Scale,
  Plus,
  Trash2,
  Edit3,
  CheckCheck,
  ListPlus,
  SlidersHorizontal,
  Layers,
  Save
} from 'lucide-react';
import { scanFoodImage, type ScannedMealResult, type ScannedFoodItem } from '../services/aiCalorieService';
import type { Language, MealType, CalorieMealLog } from '../types';

interface CameraFoodScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMealLog: (log: Omit<CalorieMealLog, 'id' | 'syncedToSheets'>) => void;
  selectedDate: string;
  language: Language;
}

// Editable internal state for each item on the plate
interface EditablePlateItem {
  id: string;
  name: string;
  portion: string; // e.g., "১ কাপ (১৫০ গ্রাম)"
  quantity: number; // multiplier, e.g. 1, 1.5, 2
  baseCalories: number; // base calories for 1.0 quantity
  calories: number;
  baseProtein: number;
  protein: number;
  baseCarbs: number;
  carbs: number;
  baseFat: number;
  fat: number;
  isEditingDetails: boolean;
}

export const CameraFoodScannerModal: React.FC<CameraFoodScannerModalProps> = ({
  isOpen,
  onClose,
  onAddMealLog,
  selectedDate,
  language,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedMealResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [targetMealType, setTargetMealType] = useState<MealType>('lunch');

  // Interactive Editable Plate Items
  const [plateItems, setPlateItems] = useState<EditablePlateItem[]>([]);
  const [mealTitle, setMealTitle] = useState<string>('');
  const [isEditingMealTitle, setIsEditingMealTitle] = useState(false);

  // New Item Addition Form State
  const [showAddNewItemForm, setShowAddNewItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPortion, setNewItemPortion] = useState('১ পরিবেশন (১০০ গ্রাম)');
  const [newItemCalories, setNewItemCalories] = useState<string>('120');
  const [newItemProtein, setNewItemProtein] = useState<string>('4');
  const [newItemCarbs, setNewItemCarbs] = useState<string>('18');
  const [newItemFat, setNewItemFat] = useState<string>('3');

  // Save mode: 'combined' (একক প্লেট হিসেবে) vs 'individual' (প্রতিটি পদ আলাদা আলাদাভাবে)
  const [saveMode, setSaveMode] = useState<'combined' | 'individual'>('combined');
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedImage(null);
      setScanResult(null);
      setErrorMessage(null);
      setIsScanning(false);
      setPlateItems([]);
      setShowAddNewItemForm(false);
      setSaveSuccessToast(false);
    }
  }, [isOpen]);

  // When a new scan result arrives, populate editable plate items
  useEffect(() => {
    if (scanResult) {
      setMealTitle(scanResult.mealTitle || (language === 'bn' ? 'স্ক্যান করা খাবার' : 'Scanned Meal'));
      
      const initialItems: EditablePlateItem[] = (scanResult.items || []).map((item, idx) => {
        const baseCal = Math.max(10, Math.round(Number(item.calories) || 100));
        const baseProt = Math.max(0, Math.round((Number(item.protein) || 0) * 10) / 10);
        const baseCarb = Math.max(0, Math.round((Number(item.carbs) || 0) * 10) / 10);
        const baseF = Math.max(0, Math.round((Number(item.fat) || 0) * 10) / 10);

        return {
          id: `item-${Date.now()}-${idx}`,
          name: item.name || (language === 'bn' ? `খাবার আইটেম ${idx + 1}` : `Item ${idx + 1}`),
          portion: item.portion || (language === 'bn' ? '১ পরিবেশন' : '1 serving'),
          quantity: 1.0,
          baseCalories: baseCal,
          calories: baseCal,
          baseProtein: baseProt,
          protein: baseProt,
          baseCarbs: baseCarb,
          carbs: baseCarb,
          baseFat: baseF,
          fat: baseF,
          isEditingDetails: false,
        };
      });

      // If AI didn't return distinct items, build one default item from the whole meal
      if (initialItems.length === 0) {
        initialItems.push({
          id: `item-${Date.now()}-0`,
          name: scanResult.mealTitle || (language === 'bn' ? 'স্ক্যান করা খাবার' : 'Scanned Meal'),
          portion: scanResult.servingDescription || (language === 'bn' ? '১ প্লেট' : '1 plate'),
          quantity: 1.0,
          baseCalories: scanResult.totalCalories || 450,
          calories: scanResult.totalCalories || 450,
          baseProtein: scanResult.totalProtein || 20,
          protein: scanResult.totalProtein || 20,
          baseCarbs: scanResult.totalCarbs || 55,
          carbs: scanResult.totalCarbs || 55,
          baseFat: scanResult.totalFat || 14,
          fat: scanResult.totalFat || 14,
          isEditingDetails: false,
        });
      }

      setPlateItems(initialItems);
    }
  }, [scanResult, language]);

  // Live dynamic aggregate totals calculated from plateItems
  const currentTotalCalories = useMemo(() => {
    return plateItems.reduce((sum, it) => sum + (Number(it.calories) || 0), 0);
  }, [plateItems]);

  const currentTotalProtein = useMemo(() => {
    return Math.round(plateItems.reduce((sum, it) => sum + (Number(it.protein) || 0), 0) * 10) / 10;
  }, [plateItems]);

  const currentTotalCarbs = useMemo(() => {
    return Math.round(plateItems.reduce((sum, it) => sum + (Number(it.carbs) || 0), 0) * 10) / 10;
  }, [plateItems]);

  const currentTotalFat = useMemo(() => {
    return Math.round(plateItems.reduce((sum, it) => sum + (Number(it.fat) || 0), 0) * 10) / 10;
  }, [plateItems]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(language === 'bn' ? 'অনুগ্রহ করে একটি ছবির ফাইল নির্বাচন করুন।' : 'Please select an image file.');
      return;
    }

    setImageMimeType(file.type);
    setErrorMessage(null);
    setScanResult(null);
    setPlateItems([]);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      // Auto analyze immediately after selecting picture
      handleAnalyze(base64, file.type);
    };
    reader.onerror = () => {
      setErrorMessage(language === 'bn' ? 'ছবি পড়তে সমস্যা হয়েছে।' : 'Failed to read image.');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (base64Data?: string, mime?: string) => {
    const dataToSend = base64Data || selectedImage;
    if (!dataToSend) return;

    setIsScanning(true);
    setErrorMessage(null);

    try {
      const result = await scanFoodImage(
        dataToSend,
        mime || imageMimeType,
        targetMealType,
        language
      );
      setScanResult(result);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || (language === 'bn' ? 'ছবি বিশ্লেষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : 'Failed to analyze image. Please retry.'));
    } finally {
      setIsScanning(false);
    }
  };

  // --- Handlers to Edit Items and Quantities ---

  // 1. Update Quantity Multiplier (+ / - or direct change)
  const handleUpdateItemQuantity = (itemId: string, newQuantity: number) => {
    const safeQty = Math.max(0.1, Math.round(newQuantity * 100) / 100);
    setPlateItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          quantity: safeQty,
          calories: Math.round(item.baseCalories * safeQty),
          protein: Math.round(item.baseProtein * safeQty * 10) / 10,
          carbs: Math.round(item.baseCarbs * safeQty * 10) / 10,
          fat: Math.round(item.baseFat * safeQty * 10) / 10,
        };
      })
    );
  };

  // 2. Update Item Name
  const handleUpdateItemName = (itemId: string, newName: string) => {
    setPlateItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, name: newName } : item))
    );
  };

  // 3. Update Item Portion Description
  const handleUpdateItemPortion = (itemId: string, newPortion: string) => {
    setPlateItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, portion: newPortion } : item))
    );
  };

  // 4. Update Base Calories manually
  const handleUpdateItemBaseCalories = (itemId: string, newBaseCal: number) => {
    const safeBase = Math.max(0, newBaseCal);
    setPlateItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          baseCalories: safeBase,
          calories: Math.round(safeBase * item.quantity),
        };
      })
    );
  };

  // 5. Toggle Item Details Edit Mode
  const handleToggleEditDetails = (itemId: string) => {
    setPlateItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isEditingDetails: !item.isEditingDetails } : item
      )
    );
  };

  // 6. Delete Item from Plate
  const handleDeleteItem = (itemId: string) => {
    setPlateItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // 7. Add New Item to Plate
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const baseCal = Number(newItemCalories) || 100;
    const baseProt = Number(newItemProtein) || 2;
    const baseCarb = Number(newItemCarbs) || 15;
    const baseF = Number(newItemFat) || 2;

    const newItem: EditablePlateItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      portion: newItemPortion.trim() || (language === 'bn' ? '১ পরিবেশন' : '1 serving'),
      quantity: 1.0,
      baseCalories: baseCal,
      calories: baseCal,
      baseProtein: baseProt,
      protein: baseProt,
      baseCarbs: baseCarb,
      carbs: baseCarb,
      baseFat: baseF,
      fat: baseF,
      isEditingDetails: false,
    };

    setPlateItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemPortion('১ পরিবেশন (১০০ গ্রাম)');
    setNewItemCalories('120');
    setNewItemProtein('4');
    setNewItemCarbs('18');
    setNewItemFat('3');
    setShowAddNewItemForm(false);
  };

  // 8. Save Result to Daily Meal Log
  const handleSaveToMealLog = () => {
    if (plateItems.length === 0) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (saveMode === 'individual') {
      // Log each item as an individual food entry in the daily meal log
      plateItems.forEach((item) => {
        onAddMealLog({
          date: selectedDate,
          mealType: targetMealType,
          foodName: item.name,
          portion: item.quantity,
          servingUnit: item.portion,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          isCustom: true,
          time: currentTime,
          notes: language === 'bn' ? `AI প্লেট স্ক্যানার থেকে (${item.quantity}x)` : `From AI Plate Scanner (${item.quantity}x)`,
        });
      });
    } else {
      // Log as a single combined meal entry
      const itemsSummary = plateItems
        .map((it) => `${it.name} (${it.quantity !== 1 ? `${it.quantity}x ` : ''}${it.portion})`)
        .join(' + ');

      onAddMealLog({
        date: selectedDate,
        mealType: targetMealType,
        foodName: mealTitle.trim() || (language === 'bn' ? 'স্ক্যান করা প্লেটের খাবার' : 'Scanned Meal Plate'),
        portion: 1,
        servingUnit: `${plateItems.length}টি পদ (${language === 'bn' ? 'সুষম প্লেট' : 'Plate'})`,
        calories: currentTotalCalories,
        protein: currentTotalProtein,
        carbs: currentTotalCarbs,
        fat: currentTotalFat,
        isCustom: true,
        time: currentTime,
        notes: itemsSummary,
      });
    }

    setSaveSuccessToast(true);
    setTimeout(() => {
      setSaveSuccessToast(false);
      onClose();
    }, 900);
  };

  const mealTypeLabels: { id: MealType; bn: string; en: string }[] = [
    { id: 'breakfast', bn: 'সকালের নাস্তা', en: 'Breakfast' },
    { id: 'lunch', bn: 'দুপুরের খাবার', en: 'Lunch' },
    { id: 'dinner', bn: 'রাতের খাবার', en: 'Dinner' },
    { id: 'snack', bn: 'বিকেলের স্ন্যাক্স', en: 'Snacks' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Hidden inputs for camera capture & gallery upload */}
        <input 
          ref={cameraInputRef}
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleFileSelect} 
          className="hidden" 
        />
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          onChange={handleFileSelect} 
          className="hidden" 
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight flex items-center gap-1.5">
                <span>{language === 'bn' ? 'AI প্লেট ফটো ও ক্যালরি স্ক্যানার' : 'AI Plate Photo & Calorie Scanner'}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Multimodal
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {language === 'bn' ? 'প্লেটের প্রতিটি খাবারের পদ, পরিমাপ শনাক্তকরণ ও এডিট' : 'Detect, customize items & portions seen on your plate'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* Success Toast */}
          {saveSuccessToast && (
            <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg animate-in zoom-in-95">
              <Check className="w-4 h-4" />
              <span>{language === 'bn' ? 'খাবার সফলভাবে আজকের ক্যালরি ডায়েরিতে যুক্ত হয়েছে!' : 'Meal logged successfully to today\'s diary!'}</span>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SCREEN 1: Photo Capture & Upload (When no image selected) */}
          {!selectedImage ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 sm:p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  {language === 'bn' ? 'প্লেট বা খাবারের ছবি তুলুন বা নির্বাচন করুন' : 'Snap or upload your meal plate'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
                  {language === 'bn'
                    ? 'AI প্লেটের সবগুলো পদ (যেমন: ভাত, ডাল, মাছ, মাংস, রুটি, সালাদ) আলাদা আলাদাভাবে শনাক্ত করবে এবং আপনি প্রয়োজনমতো প্রতিটি আইটেম ও পরিমাণ এডিট করতে পারবেন।'
                    : 'Gemini AI will identify every distinct dish on your plate with portion estimates. You can edit each item and quantity easily.'}
                </p>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{language === 'bn' ? 'ছবি তুলুন' : 'Take Photo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>{language === 'bn' ? 'গ্যালারি' : 'Gallery'}</span>
                  </button>
                </div>
              </div>

              {/* Helpful Tips Card */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">
                    {language === 'bn' ? 'সঠিক বিশ্লেষণের পরামর্শ:' : 'Tips for optimal accuracy:'}
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    {language === 'bn'
                      ? 'প্লেটের উপর থেকে স্বাভাবিক আলোতে পরিষ্কার ছবি তুলুন। স্ক্যান করার পর কোনো আইটেম মিস হলে নিজে যোগ করতে পারবেন বা পরিমাণ পরিবর্তন করতে পারবেন।'
                      : 'Take a clear top-down photo in good lighting. You can customize portions, edit dish names, or add missing items after scan.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* SCREEN 2: Image Preview & Interactive Scanned Breakdown */
            <div className="space-y-4">
              
              {/* Photo Thumbnail Header */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-[21/9] max-h-44 flex items-center justify-center">
                <img 
                  src={selectedImage} 
                  alt="Scanned Food Plate" 
                  className="w-full h-full object-cover opacity-90"
                />

                {/* Scanning Laser Animation overlay when analyzing */}
                {isScanning && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                    <div className="w-11 h-11 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center animate-pulse mb-2">
                      <Sparkles className="w-5 h-5 text-emerald-300 animate-spin" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-100">
                      {language === 'bn' ? 'AI প্লেটের খাবার ও পরিমাপ বিশ্লেষণ করছে...' : 'Gemini AI is analyzing plate items...'}
                    </span>
                    <span className="text-[11px] text-emerald-200/80 mt-0.5">
                      {language === 'bn' ? 'USDA ও INFS মানদণ্ডে হিসাব হচ্ছে' : 'Calibrated with USDA & INFS standards'}
                    </span>
                  </div>
                )}

                {/* Retake / Re-scan button */}
                {!isScanning && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAnalyze()}
                      className="px-2.5 py-1.5 rounded-xl bg-black/65 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1 transition-all cursor-pointer"
                      title="Re-analyze"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'পুনর্বিশ্লেষণ' : 'Re-scan'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setScanResult(null);
                        setPlateItems([]);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-black/65 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'নতুন ছবি' : 'New'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Analysis Result & Interactive Plate Breakdown */}
              {!isScanning && scanResult && (
                <div className="space-y-4">
                  
                  {/* Total Calorie & Macro Banner (Dynamically updates with edits) */}
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50/60 to-slate-50 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-emerald-700" />
                            {language === 'bn' ? 'প্লেটের খাবারের সারসংক্ষেপ' : 'Plate Overview'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            ({plateItems.length} {language === 'bn' ? 'টি পদ প্রস্তুত' : 'items ready'})
                          </span>
                          {scanResult.source === 'fallback' && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              {language === 'bn' ? 'স্ট্যান্ডার্ড INFS মান' : 'Standard INFS Estimate'}
                            </span>
                          )}
                        </div>

                        {/* Editable Meal Title */}
                        {isEditingMealTitle ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="text"
                              value={mealTitle}
                              onChange={(e) => setMealTitle(e.target.value)}
                              className="px-2.5 py-1 text-sm font-bold bg-white border border-emerald-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setIsEditingMealTitle(false)}
                              className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-0.5">
                            <h3 className="text-base sm:text-lg font-black text-slate-900">
                              {mealTitle}
                            </h3>
                            <button
                              type="button"
                              onClick={() => setIsEditingMealTitle(true)}
                              className="text-slate-400 hover:text-emerald-700 p-0.5"
                              title="Edit meal name"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Live Total Calories Badge */}
                      <div className="flex items-center sm:justify-end gap-2 bg-white px-3.5 py-2 rounded-2xl border border-emerald-200/80 shadow-2xs">
                        <Flame className="w-6 h-6 text-rose-500 fill-rose-500" />
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900">{currentTotalCalories}</span>
                            <span className="text-xs font-bold text-slate-500">kcal</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">
                            {language === 'bn' ? 'লাইভ মোট ক্যালরি' : 'Live Total Calories'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Macronutrient Distribution Bar */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-white/90 p-2 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          {language === 'bn' ? 'প্রোটিন' : 'Protein'}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-indigo-600">
                          {currentTotalProtein}g
                        </span>
                      </div>
                      <div className="bg-white/90 p-2 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          {language === 'bn' ? 'কার্বোহাইড্রেট' : 'Carbs'}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-amber-600">
                          {currentTotalCarbs}g
                        </span>
                      </div>
                      <div className="bg-white/90 p-2 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          {language === 'bn' ? 'ফ্যাট' : 'Fat'}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-rose-600">
                          {currentTotalFat}g
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION: Plate Items & Quantity Editor */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Utensils className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">
                          {language === 'bn' ? 'প্লেটে শনাক্তকৃত পদ ও পরিমাপ (এডিট করুন)' : 'Items & Portions on Plate (Customizable)'}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAddNewItemForm(!showAddNewItemForm)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'নতুন আইটেম যোগ' : 'Add Item'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      {language === 'bn'
                        ? 'প্লেটে থাকা প্রতিটি খাবারের নাম বা পরিমাণ পরিবর্তন করতে পারেন। পরিমাণ বাড়ালে বা কমালে ক্যালরি ও পুষ্টিমান স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।'
                        : 'Adjust quantity multipliers (0.5x, 1x, 2x) or edit item names directly. Calories recalculate automatically.'}
                    </p>

                    {/* New Item Form (Toggleable) */}
                    {showAddNewItemForm && (
                      <form onSubmit={handleAddNewItem} className="p-3 bg-slate-50 border border-emerald-200 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span>{language === 'bn' ? 'প্লেটে বাদ পড়া আইটেম যুক্ত করুন' : 'Add Missed Item to Plate'}</span>
                          <button
                            type="button"
                            onClick={() => setShowAddNewItemForm(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              {language === 'bn' ? 'খাবারের নাম' : 'Food Name'}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={language === 'bn' ? 'যেমন: ১ গ্লাস দুধ, সালাদ' : 'e.g. 1 glass milk'}
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              {language === 'bn' ? 'পরিমাপ / ওজন' : 'Portion / Grams'}
                            </label>
                            <input
                              type="text"
                              placeholder={language === 'bn' ? 'যেমন: ১ বাটি (১০০ গ্রাম)' : 'e.g. 1 cup (150g)'}
                              value={newItemPortion}
                              onChange={(e) => setNewItemPortion(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              {language === 'bn' ? 'ক্যালরি (kcal)' : 'Calories (kcal)'}
                            </label>
                            <input
                              type="number"
                              required
                              value={newItemCalories}
                              onChange={(e) => setNewItemCalories(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddNewItemForm(false)}
                            className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                          >
                            {language === 'bn' ? 'বাতিল' : 'Cancel'}
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                          >
                            {language === 'bn' ? 'তালিকায় যুক্ত করুন' : 'Add to List'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Items List */}
                    <div className="space-y-2.5">
                      {plateItems.map((item, index) => (
                        <div 
                          key={item.id} 
                          className="p-3 bg-slate-50 hover:bg-slate-50/80 rounded-2xl border border-slate-200/90 transition-all space-y-2"
                        >
                          {/* Top Row: Item Name, Portion, and Actions */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center justify-center shrink-0">
                                  {index + 1}
                                </span>

                                {/* Editable Food Name */}
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleUpdateItemName(item.id, e.target.value)}
                                  className="font-bold text-slate-900 text-xs sm:text-sm bg-transparent hover:bg-white focus:bg-white px-1.5 py-0.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-hidden transition-all max-w-[220px] sm:max-w-xs"
                                  title="Click to edit name"
                                />

                                <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shrink-0">
                                  {item.portion}
                                </span>
                              </div>
                            </div>

                            {/* Item Calories & Delete */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="text-right">
                                <div className="text-xs sm:text-sm font-black text-rose-600 flex items-center justify-end gap-1">
                                  <Flame className="w-3.5 h-3.5 fill-rose-500" />
                                  <span>{item.calories} kcal</span>
                                </div>
                                <span className="text-[10px] text-slate-400 block -mt-0.5">
                                  P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleEditDetails(item.id)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  item.isEditingDetails 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                                }`}
                                title="Edit details"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Detail Editor (When toggle details is active) */}
                          {item.isEditingDetails && (
                            <div className="p-2.5 bg-white rounded-xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs animate-in fade-in duration-100">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                  {language === 'bn' ? 'পরিমাপ বর্ণনা (যেমন: ১ বাটি)' : 'Portion Description'}
                                </label>
                                <input
                                  type="text"
                                  value={item.portion}
                                  onChange={(e) => handleUpdateItemPortion(item.id, e.target.value)}
                                  className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                  {language === 'bn' ? 'স্বাভাবিক ক্যালরি (১ গুণ পরিমাণের জন্য)' : 'Base Calories (for 1.0x)'}
                                </label>
                                <input
                                  type="number"
                                  value={item.baseCalories}
                                  onChange={(e) => handleUpdateItemBaseCalories(item.id, Number(e.target.value))}
                                  className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                                />
                              </div>
                            </div>
                          )}

                          {/* Bottom Row: Quantity Stepper & Quick Presets */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 flex-wrap">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                              <Scale className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{language === 'bn' ? 'পরিমাণ (Quantity):' : 'Quantity:'}</span>
                            </div>

                            {/* Quantity Stepper & Presets */}
                            <div className="flex items-center gap-1.5">
                              {/* Quick Multiplier Presets */}
                              <div className="hidden xs:flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                                {[0.5, 1, 1.5, 2].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handleUpdateItemQuantity(item.id, preset)}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                      item.quantity === preset
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                  >
                                    {preset}x
                                  </button>
                                ))}
                              </div>

                              {/* Manual Stepper */}
                              <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(item.id, Math.max(0.25, item.quantity - 0.25))}
                                  className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Decrease quantity"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  step="0.25"
                                  min="0.1"
                                  max="10"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItemQuantity(item.id, Number(e.target.value))}
                                  className="w-10 text-center text-xs font-black text-slate-800 focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 0.25)}
                                  className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {plateItems.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                          <Utensils className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                          <p>{language === 'bn' ? 'কোনো খাবার পদ অবশিষ্ট নেই।' : 'No items remaining.'}</p>
                          <button
                            type="button"
                            onClick={() => setShowAddNewItemForm(true)}
                            className="mt-2 text-emerald-600 font-bold hover:underline"
                          >
                            {language === 'bn' ? '+ নতুন আইটেম যুক্ত করুন' : '+ Add an item'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dietary Advice Insight */}
                  {scanResult.dietaryAdvice && (
                    <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 text-xs text-emerald-950 flex items-start gap-2">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-emerald-900 mb-0.5">
                          {language === 'bn' ? 'পুষ্টিবিদের পর্যবেক্ষণ ও পরামর্শ:' : 'Dietitian Advice:'}
                        </span>
                        <p className="text-emerald-800 leading-relaxed">{scanResult.dietaryAdvice}</p>
                      </div>
                    </div>
                  )}

                  {/* Target Meal Type & Save Strategy */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {language === 'bn' ? 'কোন সময়ের খাবারে যুক্ত করবেন?' : 'Add to which meal?'}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {mealTypeLabels.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setTargetMealType(m.id)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              targetMealType === m.id
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {language === 'bn' ? m.bn : m.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Save Mode Selector: Combined Meal vs Individual Items */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {language === 'bn' ? 'সংরক্ষণ পদ্ধতি:' : 'Logging Method:'}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setSaveMode('combined')}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                            saveMode === 'combined'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Layers className={`w-4 h-4 shrink-0 mt-0.5 ${saveMode === 'combined' ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <div>
                            <span className="font-bold block">
                              {language === 'bn' ? 'একটি একক প্লেট হিসেবে (Combined)' : 'Single Combined Plate'}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {language === 'bn' ? 'সবগুলো পদ মিলে একটি মিল হিসেবে সংরক্ষণ হবে' : 'Logs one entry with all dishes in summary'}
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSaveMode('individual')}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                            saveMode === 'individual'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <ListPlus className={`w-4 h-4 shrink-0 mt-0.5 ${saveMode === 'individual' ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <div>
                            <span className="font-bold block">
                              {language === 'bn' ? 'আলাদা আলাদা আইটেম হিসেবে (Detailed)' : 'Individual Items Entry'}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {language === 'bn' ? `প্রতিটি পদ পৃথকভাবে ${plateItems.length}টি লাইনে সেভ হবে` : `Logs each of the ${plateItems.length} items separately`}
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>

          {scanResult && !isScanning && plateItems.length > 0 && (
            <button
              type="button"
              onClick={handleSaveToMealLog}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer transform active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>
                {language === 'bn'
                  ? `${currentTotalCalories} kcal ডায়েরিতে যুক্ত করুন`
                  : `Save ${currentTotalCalories} kcal to Log`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
