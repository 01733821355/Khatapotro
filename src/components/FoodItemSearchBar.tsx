import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  Plus, 
  Sparkles, 
  Check, 
  Utensils, 
  Flame, 
  Mic, 
  MicOff,
  ChevronDown
} from 'lucide-react';
import { 
  BANGLADESHI_FOODS, 
  FOOD_CATEGORIES 
} from '../data/bangladeshiFoods';
import { estimateFoodCalories } from '../services/aiCalorieService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { 
  CalorieFoodItem, 
  CalorieMealLog, 
  MealType, 
  Language, 
  FoodCategory 
} from '../types';

interface FoodItemSearchBarProps {
  onAddMealLog: (log: Omit<CalorieMealLog, 'id' | 'syncedToSheets'>) => void;
  selectedDate: string;
  language: Language;
}

export const FoodItemSearchBar: React.FC<FoodItemSearchBarProps> = ({
  onAddMealLog,
  selectedDate,
  language,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1);
  const [isAiCalculating, setIsAiCalculating] = useState(false);
  const [addedItemToast, setAddedItemToast] = useState<string | null>(null);

  // Speech recognition for food search
  const { isListening, startListening, stopListening } = useSpeechRecognition({
    lang: 'bn-BD',
    onResult: (transcript, isFinal) => {
      setSearchQuery(transcript);
      if (isFinal) {
        stopListening();
      }
    },
  });

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening('bn-BD');
    }
  };

  // Filtered food items based on query and category
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q && selectedCategory === 'all') {
      // Return popular items if no search term
      return BANGLADESHI_FOODS.filter((f) => f.popular).slice(0, 8);
    }

    return BANGLADESHI_FOODS.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchCat) return false;

      if (!q) return true;

      return (
        item.nameBn.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.categoryBn.toLowerCase().includes(q)
      );
    }).slice(0, 16);
  }, [searchQuery, selectedCategory]);

  // Handle adding food to log
  const handleAddFood = (food: CalorieFoodItem) => {
    const portion = portionMultiplier;
    const calcCalories = Math.round(food.calories * portion);
    const calcProtein = Math.round((food.protein || 0) * portion * 10) / 10;
    const calcCarbs = Math.round((food.carbs || 0) * portion * 10) / 10;
    const calcFat = Math.round((food.fat || 0) * portion * 10) / 10;

    onAddMealLog({
      date: selectedDate,
      mealType: selectedMeal,
      foodId: food.id,
      foodName: food.nameBn,
      portion: portion,
      servingUnit: food.defaultServing,
      calories: calcCalories,
      protein: calcProtein,
      carbs: calcCarbs,
      fat: calcFat,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: `${food.nameEn} (${portion}x)`,
    });

    setAddedItemToast(`${food.nameBn} (${calcCalories} kcal) যোগ হয়েছে!`);
    setTimeout(() => setAddedItemToast(null), 2500);
  };

  // Handle AI estimate for foods not in library
  const handleAiEstimate = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    setIsAiCalculating(true);
    try {
      const result = await estimateFoodCalories(q, language);
      const estCalories = Math.round(result.calories * portionMultiplier);
      const estProtein = Math.round(result.protein * portionMultiplier * 10) / 10;
      const estCarbs = Math.round(result.carbs * portionMultiplier * 10) / 10;
      const estFat = Math.round(result.fat * portionMultiplier * 10) / 10;

      onAddMealLog({
        date: selectedDate,
        mealType: selectedMeal,
        foodName: result.foodName || q,
        portion: portionMultiplier,
        servingUnit: result.servingUnit || '১ পরিমাপ',
        calories: estCalories,
        protein: estProtein,
        carbs: estCarbs,
        fat: estFat,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: `AI ক্যালকুলেশন: ${result.explanation || 'পুষ্টিমান যোগ হয়েছে'}`,
      });

      setAddedItemToast(`${result.foodName || q} (${estCalories} kcal) যোগ হয়েছে!`);
      setTimeout(() => setAddedItemToast(null), 2500);
    } catch (err) {
      console.warn('AI estimate error:', err);
    } finally {
      setIsAiCalculating(false);
    }
  };

  const mealOptions: { id: MealType; labelBn: string; labelEn: string; icon: string }[] = [
    { id: 'breakfast', labelBn: 'সকালের নাস্তা', labelEn: 'Breakfast', icon: '🍳' },
    { id: 'lunch', labelBn: 'দুপুরের খাবার', labelEn: 'Lunch', icon: '🍛' },
    { id: 'snack', labelBn: 'বিকালের নাস্তা', labelEn: 'Snacks', icon: '☕' },
    { id: 'dinner', labelBn: 'রাতের খাবার', labelEn: 'Dinner', icon: '🌙' },
  ];

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight flex items-center gap-1.5">
              <span>{language === 'bn' ? 'খাবার আইটেম সার্চ বার' : 'Food Item Search & Quick Log'}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {language === 'bn' ? '১০০+ খাবার' : '100+ Foods'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'bn' ? 'খাবারের নাম লিখে বা মুখে বলে ক্যালরি বের করুন এবং এক ক্লিকে খাবারে যোগ করুন' : 'Search or speak food name to view calories and log in one click'}
            </p>
          </div>
        </div>

        {/* Meal Target Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
          {mealOptions.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMeal(m.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedMeal === m.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{m.icon}</span>
              <span>{language === 'bn' ? m.labelBn : m.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Search Input & Portion Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={
              language === 'bn'
                ? 'খাবারের নাম লিখুন (যেমন: সাদা ভাত, রুটি, পাতলা ডাল, ইলিশ মাছ, ডিম ভাজি, বিরিয়ানি, কলা, আপেল)...'
                : 'Search food (e.g. Rice, Roti, Dal, Beef, Chicken, Egg, Biryani, Apple)...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:outline-hidden"
          />

          <div className="absolute right-2 top-1.5 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={toggleMic}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
              }`}
              title={isListening ? 'ভয়েস ইনপুট বন্ধ করুন' : 'মুখে বলে খাবার খুঁজুন (Voice Search)'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Portion Multiplier Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-1 bg-slate-50 border border-slate-200 p-1 rounded-2xl shrink-0">
          <span className="text-[11px] font-bold text-slate-500 px-1.5">
            {language === 'bn' ? 'পরিমাণ:' : 'Portion:'}
          </span>
          {[
            { mult: 0.5, label: '0.5x' },
            { mult: 1.0, label: '1.0x' },
            { mult: 1.5, label: '1.5x' },
            { mult: 2.0, label: '2.0x' },
          ].map((p) => (
            <button
              key={p.mult}
              type="button"
              onClick={() => setPortionMultiplier(p.mult)}
              className={`px-2 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                portionMultiplier === p.mult
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Chips Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
          }`}
        >
          {language === 'bn' ? 'সব খাবার' : 'All Foods'}
        </button>
        {FOOD_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-white shadow-2xs font-bold'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{language === 'bn' ? cat.nameBn : cat.nameEn}</span>
          </button>
        ))}
      </div>

      {/* Success Toast */}
      {addedItemToast && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-100">
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{addedItemToast}</span>
          </div>
        </div>
      )}

      {/* Food Results List */}
      <div className="space-y-2">
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {searchResults.map((food) => {
              const displayCalories = Math.round(food.calories * portionMultiplier);
              const displayProtein = Math.round((food.protein || 0) * portionMultiplier * 10) / 10;
              const displayCarbs = Math.round((food.carbs || 0) * portionMultiplier * 10) / 10;
              const displayFat = Math.round((food.fat || 0) * portionMultiplier * 10) / 10;

              return (
                <div
                  key={food.id}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/40 border border-slate-200/80 hover:border-amber-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                        {language === 'bn' ? food.nameBn : food.nameEn}
                      </h4>
                      <div className="flex items-center gap-0.5 text-rose-600 font-black text-xs shrink-0">
                        <Flame className="w-3 h-3 fill-rose-500" />
                        <span>{displayCalories}</span>
                        <span className="text-[10px] text-slate-400 font-normal">kcal</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {food.defaultServing} {portionMultiplier !== 1 && `(${portionMultiplier}x)`}
                    </p>

                    {/* Macro pill summary */}
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-medium mt-1.5">
                      <span className="text-emerald-700 bg-emerald-50 px-1 rounded-sm border border-emerald-100">
                        P: {displayProtein}g
                      </span>
                      <span className="text-amber-700 bg-amber-50 px-1 rounded-sm border border-amber-100">
                        C: {displayCarbs}g
                      </span>
                      <span className="text-rose-700 bg-rose-50 px-1 rounded-sm border border-rose-100">
                        F: {displayFat}g
                      </span>
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={() => handleAddFood(food)}
                    className="mt-2.5 w-full py-1.5 px-2 bg-white hover:bg-amber-500 text-slate-700 hover:text-white border border-slate-200 hover:border-amber-500 rounded-xl text-[11px] font-bold shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {language === 'bn' 
                        ? `${mealOptions.find(m => m.id === selectedMeal)?.labelBn || 'খাবারে'} যোগ করুন` 
                        : `Add to ${selectedMeal}`}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-600">
              {language === 'bn'
                ? `লাইব্রেরিতে "${searchQuery}" সরাসরি পাওয়া যায়নি।`
                : `No food found for "${searchQuery}".`}
            </p>
            <button
              type="button"
              disabled={isAiCalculating}
              onClick={() => handleAiEstimate(searchQuery)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isAiCalculating
                  ? (language === 'bn' ? 'AI হিসাব করছে...' : 'Calculating...')
                  : (language === 'bn' ? `AI দিয়ে "${searchQuery}" এর ক্যালরি বের ও যোগ করুন` : `Calculate "${searchQuery}" with AI`)}
              </span>
            </button>
          </div>
        )}

        {/* AI calculation prompt if searching */}
        {searchQuery.trim().length > 0 && searchResults.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {language === 'bn' 
                  ? `খুঁজছেন "${searchQuery}"? AI দিয়ে আরো নিখুঁত ক্যালরি ও পুষ্টি বের করতে পারেন:` 
                  : `Need custom recipe breakdown for "${searchQuery}"?`}
              </span>
            </div>
            <button
              type="button"
              disabled={isAiCalculating}
              onClick={() => handleAiEstimate(searchQuery)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isAiCalculating ? '...' : (language === 'bn' ? 'AI দিয়ে বের করুন' : 'AI Calculate')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
