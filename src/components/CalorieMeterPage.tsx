import React, { useState, useMemo } from 'react';
import {
  Flame,
  Utensils,
  Activity,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Bell,
  Sparkles,
  Droplets,
  TrendingDown,
  TrendingUp,
  Target,
  Clock,
  ChevronRight,
  Heart,
  Scale,
  Calendar,
  Zap,
  Info,
  Apple,
  Dumbbell,
  Loader2,
  Wand2,
  Camera,
  Footprints
} from 'lucide-react';
import { estimateFoodCalories } from '../services/aiCalorieService';
import { CameraFoodScannerModal } from './CameraFoodScannerModal';
import { LiveActivityTracker } from './LiveActivityTracker';
import type { 
  Language, 
  CalorieMealLog, 
  CalorieActivityLog, 
  CalorieUserProfile, 
  CalorieReminder, 
  CalorieFoodItem, 
  ActivityItem, 
  MealType,
  FoodCategory
} from '../types';
import { 
  BANGLADESHI_FOODS, 
  FOOD_CATEGORIES, 
  DAILY_ACTIVITIES 
} from '../data/bangladeshiFoods';

const DEFAULT_CALORIE_PROFILE: CalorieUserProfile = {
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

interface CalorieMeterPageProps {
  mealLogs: CalorieMealLog[];
  activityLogs: CalorieActivityLog[];
  calorieProfile?: CalorieUserProfile;
  profile?: CalorieUserProfile;
  reminders: CalorieReminder[];
  waterGlasses: number;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate?: (date: string) => void;
  onDateChange?: (date: string) => void;
  onAddMealLog: (log: Omit<CalorieMealLog, 'id' | 'syncedToSheets'>) => void;
  onDeleteMealLog: (id: string) => void;
  onAddActivityLog: (log: Omit<CalorieActivityLog, 'id' | 'syncedToSheets'>) => void;
  onDeleteActivityLog: (id: string) => void;
  onUpdateProfile: (profile: CalorieUserProfile) => void;
  onToggleReminder: (id: string) => void;
  onUpdateWaterGlasses: (count: number) => void;
  language: Language;
}

export const CalorieMeterPage: React.FC<CalorieMeterPageProps> = ({
  mealLogs = [],
  activityLogs = [],
  calorieProfile,
  profile,
  reminders = [],
  waterGlasses = 0,
  selectedDate = new Date().toISOString().slice(0, 10),
  onSelectDate,
  onDateChange,
  onAddMealLog,
  onDeleteMealLog,
  onAddActivityLog,
  onDeleteActivityLog,
  onUpdateProfile,
  onToggleReminder,
  onUpdateWaterGlasses,
  language,
}) => {
  const currentProfile: CalorieUserProfile = useMemo(() => {
    return {
      ...DEFAULT_CALORIE_PROFILE,
      ...(calorieProfile || profile || {}),
    };
  }, [calorieProfile, profile]);

  const handleDateSelect = (date: string) => {
    if (onSelectDate) onSelectDate(date);
    if (onDateChange) onDateChange(date);
  };

  // Tabs for the page: 'meter' (ক্যালরি মিটার), 'diet_plan' (ডায়েট প্লান ও স্বাস্থ্য বার্তা), 'reminders' (রুটিন ও রিমাইন্ডার)
  const [activeTab, setActiveTab] = useState<'meter' | 'diet_plan' | 'reminders'>('meter');

  // Food logging state
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<FoodCategory | 'all'>('all');
  const [customFoodMode, setCustomFoodMode] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodCal, setCustomFoodCal] = useState('');
  const [customFoodPortion, setCustomFoodPortion] = useState('1');
  const [selectedServingPortion, setSelectedServingPortion] = useState<number>(1);
  const [activeFoodToLog, setActiveFoodToLog] = useState<CalorieFoodItem | null>(null);

  // AI Calorie Auto-Calculation States
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isAiCalculating, setIsAiCalculating] = useState(false);
  const [aiProtein, setAiProtein] = useState<number>(0);
  const [aiCarbs, setAiCarbs] = useState<number>(0);
  const [aiFat, setAiFat] = useState<number>(0);
  const [aiServingUnit, setAiServingUnit] = useState<string>('পরিমাণমতো');
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [aiCalculatedFor, setAiCalculatedFor] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Activity logging state
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem>(DAILY_ACTIVITIES[0]);
  const [activityDuration, setActivityDuration] = useState<number>(30);
  const [customActivityName, setCustomActivityName] = useState('');
  const [customActivityBurn, setCustomActivityBurn] = useState('');
  const [activityIntensity, setActivityIntensity] = useState<'light' | 'moderate' | 'vigorous'>('moderate');

  // Profile modal / settings
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editAge, setEditAge] = useState(currentProfile.age);
  const [editGender, setEditGender] = useState(currentProfile.gender);
  const [editWeight, setEditWeight] = useState(currentProfile.weightKg);
  const [editHeightFeet, setEditHeightFeet] = useState(currentProfile.heightFeet);
  const [editHeightInches, setEditHeightInches] = useState(currentProfile.heightInches);
  const [editActivityLevel, setEditActivityLevel] = useState(currentProfile.activityLevel);
  const [editGoal, setEditGoal] = useState(currentProfile.goal);
  const [editTargetCal, setEditTargetCal] = useState(currentProfile.targetDailyCalories);

  // Sync edit states when currentProfile updates
  React.useEffect(() => {
    setEditAge(currentProfile.age);
    setEditGender(currentProfile.gender);
    setEditWeight(currentProfile.weightKg);
    setEditHeightFeet(currentProfile.heightFeet);
    setEditHeightInches(currentProfile.heightInches);
    setEditActivityLevel(currentProfile.activityLevel);
    setEditGoal(currentProfile.goal);
    setEditTargetCal(currentProfile.targetDailyCalories);
  }, [currentProfile]);

  // Today's meal logs
  const todayMeals = useMemo(() => {
    return mealLogs.filter((m) => m.date === selectedDate);
  }, [mealLogs, selectedDate]);

  // Today's activity logs
  const todayActivities = useMemo(() => {
    return activityLogs.filter((a) => a.date === selectedDate);
  }, [activityLogs, selectedDate]);

  // Totals calculations
  const totalIntake = useMemo(() => {
    return todayMeals.reduce((sum, m) => sum + m.calories, 0);
  }, [todayMeals]);

  const totalBurned = useMemo(() => {
    return todayActivities.reduce((sum, a) => sum + a.caloriesBurned, 0);
  }, [todayActivities]);

  const totalProtein = useMemo(() => {
    return todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
  }, [todayMeals]);

  const totalCarbs = useMemo(() => {
    return todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0);
  }, [todayMeals]);

  const totalFat = useMemo(() => {
    return todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0);
  }, [todayMeals]);

  // Net Calories = Intake - Burned
  const netCalories = totalIntake - totalBurned;
  const targetCalories = currentProfile.targetDailyCalories || 2000;
  const remainingCalories = targetCalories - totalIntake;
  const caloriePercent = Math.min(100, Math.round((totalIntake / targetCalories) * 100));

  // Filtered Food Library search
  const filteredFoods = useMemo(() => {
    return BANGLADESHI_FOODS.filter((item) => {
      const matchCat = selectedFoodCategory === 'all' || item.category === selectedFoodCategory;
      const q = foodSearchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.nameBn.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.categoryBn.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [selectedFoodCategory, foodSearchQuery]);

  // Meal type breakdown groups
  const mealGroups = useMemo(() => {
    const groups: Record<MealType, { titleBn: string; titleEn: string; icon: string; items: CalorieMealLog[]; totalCal: number }> = {
      breakfast: { titleBn: 'সকালের নাস্তা', titleEn: 'Breakfast', icon: '🍳', items: [], totalCal: 0 },
      lunch: { titleBn: 'দুপুরের খাবার', titleEn: 'Lunch', icon: '🍲', items: [], totalCal: 0 },
      snack: { titleBn: 'বিকালের নাস্তা', titleEn: 'Evening Snack', icon: '☕', items: [], totalCal: 0 },
      dinner: { titleBn: 'রাতের খাবার', titleEn: 'Dinner', icon: '🌙', items: [], totalCal: 0 },
      extra: { titleBn: 'অতিরিক্ত / অন্যান্য', titleEn: 'Extra / Snack', icon: '🍎', items: [], totalCal: 0 },
    };

    todayMeals.forEach((meal) => {
      if (groups[meal.mealType]) {
        groups[meal.mealType].items.push(meal);
        groups[meal.mealType].totalCal += meal.calories;
      }
    });

    return groups;
  }, [todayMeals]);

  // Handle Quick Food Log
  const handleQuickAddFood = (food: CalorieFoodItem, portion: number = 1) => {
    const calcCalories = Math.round(food.calories * portion);
    const calcProtein = Math.round((food.protein || 0) * portion * 10) / 10;
    const calcCarbs = Math.round((food.carbs || 0) * portion * 10) / 10;
    const calcFat = Math.round((food.fat || 0) * portion * 10) / 10;

    const currentTime = new Date().toTimeString().slice(0, 5);

    onAddMealLog({
      date: selectedDate,
      time: currentTime,
      mealType: selectedMealType,
      foodId: food.id,
      foodName: food.nameBn,
      portion: portion,
      servingUnit: food.defaultServing,
      calories: calcCalories,
      protein: calcProtein,
      carbs: calcCarbs,
      fat: calcFat,
      notes: `${food.nameEn} (${portion}x)`,
    });

    setActiveFoodToLog(null);
    setIsAddFoodOpen(false);
  };

  // AI Triggered Calorie and Nutrition Calculation
  const handleCalculateWithAi = async (overrideFoodName?: string) => {
    const query = (overrideFoodName !== undefined ? overrideFoodName : customFoodName).trim();
    if (!query) return;

    setIsAiCalculating(true);
    setAiError(null);
    try {
      const mult = parseFloat(customFoodPortion) || 1;
      const res = await estimateFoodCalories(query, mult, language);
      setCustomFoodCal(String(res.calories));
      setAiProtein(res.protein);
      setAiCarbs(res.carbs);
      setAiFat(res.fat);
      setAiServingUnit(res.servingUnit);
      setAiExplanation(res.explanation || '');
      setAiCalculatedFor(query);
    } catch (err: any) {
      console.error('AI calculation failed', err);
      setAiError(err.message || (language === 'bn' ? 'ক্যালরি বের করা সম্ভব হয়নি' : 'Could not calculate calories'));
    } finally {
      setIsAiCalculating(false);
    }
  };

  // Handle Custom Food Log
  const handleAddCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFoodName.trim() || !customFoodCal) return;

    const baseCal = parseFloat(customFoodCal) || 0;
    const portion = parseFloat(customFoodPortion) || 1;
    const total = Math.round(baseCal * portion);
    const currentTime = new Date().toTimeString().slice(0, 5);

    const isAiPowered = aiCalculatedFor.trim().toLowerCase() === customFoodName.trim().toLowerCase();

    onAddMealLog({
      date: selectedDate,
      time: currentTime,
      mealType: selectedMealType,
      foodName: customFoodName.trim(),
      portion: portion,
      servingUnit: aiServingUnit || 'পরিমাণমতো',
      calories: total,
      protein: isAiPowered ? Math.round(aiProtein * portion * 10) / 10 : 0,
      carbs: isAiPowered ? Math.round(aiCarbs * portion * 10) / 10 : 0,
      fat: isAiPowered ? Math.round(aiFat * portion * 10) / 10 : 0,
      notes: isAiPowered 
        ? `✨ AI হিসাব: ${aiServingUnit || 'পরিমাণমতো'}${aiExplanation ? ` (${aiExplanation.slice(0, 40)}...)` : ''}` 
        : 'কাস্টম এন্ট্রি',
    });

    setCustomFoodName('');
    setCustomFoodCal('');
    setAiProtein(0);
    setAiCarbs(0);
    setAiFat(0);
    setAiServingUnit('পরিমাণমতো');
    setAiExplanation('');
    setAiCalculatedFor('');
    setAiError(null);
    setCustomFoodMode(false);
    setIsAddFoodOpen(false);
  };

  // Handle Activity Log
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = activityDuration || 30;
    let burned = 0;
    let actName = selectedActivity.nameBn;

    if (customActivityName.trim() && customActivityBurn) {
      actName = customActivityName.trim();
      burned = parseFloat(customActivityBurn) || 0;
    } else {
      // Scale by duration and intensity
      const base30 = selectedActivity.calPer30Min;
      const intensityMultiplier = activityIntensity === 'vigorous' ? 1.25 : activityIntensity === 'light' ? 0.8 : 1.0;
      burned = Math.round((base30 * (duration / 30)) * intensityMultiplier);
    }

    const currentTime = new Date().toTimeString().slice(0, 5);

    onAddActivityLog({
      date: selectedDate,
      time: currentTime,
      activityId: selectedActivity.id,
      activityName: actName,
      durationMinutes: duration,
      caloriesBurned: burned,
      intensity: activityIntensity,
      notes: `${duration} মিনিট (${activityIntensity})`,
    });

    setIsAddActivityOpen(false);
    setCustomActivityName('');
    setCustomActivityBurn('');
  };

  // Save updated profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CalorieUserProfile = {
      ...currentProfile,
      age: Number(editAge) || 28,
      gender: editGender,
      weightKg: Number(editWeight) || 68,
      heightFeet: Number(editHeightFeet) || 5,
      heightInches: Number(editHeightInches) || 7,
      activityLevel: editActivityLevel,
      goal: editGoal,
      targetDailyCalories: Number(editTargetCal) || 2100,
    };
    onUpdateProfile(updated);
    setIsProfileModalOpen(false);
  };

  // Smart Health & Diet Messages Generator
  const smartHealthAdvice = useMemo(() => {
    const messages: { title: string; desc: string; type: 'tip' | 'warning' | 'cheer' | 'nutrition' }[] = [];

    // Calorie status check
    if (totalIntake === 0) {
      messages.push({
        title: 'দিনের শুরুতেই পুষ্টিকর নাস্তা দিয়ে শুরু করুন',
        desc: 'সকালে লাল আটার রুটি, সেদ্ধ ডিম ও শাকসবজি বা ফল খেলে সারা দিন মেটাবলিজম চাঙ্গা থাকে এবং ক্লান্তি আসে না।',
        type: 'tip',
      });
    } else if (remainingCalories < 0) {
      messages.push({
        title: 'দৈনিক ক্যালরি সীমা অতিক্রম করেছে',
        desc: `আজ লক্ষ্যমাত্রার চেয়ে ${Math.abs(remainingCalories)} ক্যালরি বেশি গ্রহণ করা হয়েছে। সন্ধ্যায় ৩০-৪০ মিনিট দ্রুত হেঁটে অথবা হালকা রাতের খাবার খেয়ে ব্যালেন্স করুন।`,
        type: 'warning',
      });
    } else if (remainingCalories < 350) {
      messages.push({
        title: 'ক্যালরি লক্ষ্যমাত্রার খুব কাছাকাছি আছেন',
        desc: `আজ আর মাত্র ${remainingCalories} ক্যালরি বাকি আছে। রাতের খাবারের জন্য হালকা সবজি বা সালাদ বেছে নিন, ভাজা-পোড়া ও মিষ্টি এড়িয়ে চলুন।`,
        type: 'tip',
      });
    } else {
      messages.push({
        title: 'দারুণ! আপনার ক্যালরি গ্রহণ নিয়ন্ত্রণে রয়েছে',
        desc: `আজ এখনও ${remainingCalories} ক্যালরি গ্রহণ করার সুযোগ আছে। পুষ্টিকর ও প্রোটিনসমৃদ্ধ খাবারের দিকে মনোযোগ দিন।`,
        type: 'cheer',
      });
    }

    // Activity burn check
    if (totalBurned >= currentProfile.targetDailyBurn) {
      messages.push({
        title: 'অভিনন্দন! আজকের শরীরচর্চা ও বার্ন সম্পন্ন',
        desc: `আজ মোট ${totalBurned} ক্যালরি বার্ন করেছেন, যা আপনার দৈনিক লক্ষ্যের (${currentProfile.targetDailyBurn} kcal) সমান বা বেশি! এটি চর্বি কমাতে দারুণ সহায়ক।`,
        type: 'cheer',
      });
    } else {
      const needBurn = currentProfile.targetDailyBurn - totalBurned;
      messages.push({
        title: `আর মাত্র ${needBurn} ক্যালরি বার্ন করুন`,
        desc: 'মাত্র ২০-২৫ মিনিট দ্রুত হাঁটলে বা সিঁড়ি বেয়ে উঠলে সহজেই আপনার কাঙ্ক্ষিত ক্যালরি বার্ন পূরণ হয়ে যাবে।',
        type: 'nutrition',
      });
    }

    // Water intake check
    if (waterGlasses < 4) {
      messages.push({
        title: 'পানি কম পান করা হচ্ছে! হাইড্রেশন বাড়ান',
        desc: 'পর্যাপ্ত পানি না খেলে ক্লান্তি বাড়ে ও ক্যালরি বার্ন ধীর হয়ে যায়। সারাদিনে অন্তত ৮-১০ গ্লাস পানি নিশ্চিত করুন।',
        type: 'warning',
      });
    } else if (waterGlasses >= 8) {
      messages.push({
        title: 'চমৎকার! পর্যাপ্ত পানি পান করা হয়েছে',
        desc: 'আজকের ৮+ গ্লাস পানি আপনার হজমশক্তি, ত্বক এবং শরীরের মেটাবলিজমকে কার্যকর রাখতে সহায়তা করবে।',
        type: 'cheer',
      });
    }

    // Goal specific messages
    if (currentProfile.goal === 'lose') {
      messages.push({
        title: 'ওজন কমানোর মূল পরামর্শ (Fat Loss Formula)',
        desc: 'ভাত ও মিষ্টি খাবারের পরিমাণ নিয়ন্ত্রণ করুন। প্লেটের অর্ধেকটা রাখুন তাজা শাকসবজি ও সালাদ দিয়ে, এক চতুর্থাংশ প্রোটিন (মাছ/ডিম/চিকেন) এবং বাকিটা ভাত বা রুটি।',
        type: 'nutrition',
      });
    } else if (currentProfile.goal === 'gain') {
      messages.push({
        title: 'স্বাস্থ্যকর ওজন বৃদ্ধির পরামর্শ (Muscle Gain)',
        desc: 'প্রতি বেলায় ডিম, দুধ, বাদাম, কলা, মুরগির মাংস ও ডাল যোগ করুন। খালি পেটে না থেকে প্রতি ২-৩ ঘণ্টা পর পর পুষ্টিকর খাবার খান।',
        type: 'nutrition',
      });
    } else {
      messages.push({
        title: 'ফিটনেস ও সুস্বাস্থ্যের ভারসাম্য',
        desc: 'তৈলাক্ত ও রিফাইন্ড সুগার পরিহার করুন। প্রতিদিন অন্তত ৩০ মিনিট ঘাম ঝরানো মুভমেন্ট বজায় রাখুন।',
        type: 'nutrition',
      });
    }

    return messages;
  }, [totalIntake, totalBurned, remainingCalories, waterGlasses, currentProfile]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Navigation Tabs */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  {language === 'bn' ? 'দৈনিক ক্যালরি মিটার ও স্বাস্থ্য সহায়িকা' : 'Daily Calorie Meter & Health'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    {language === 'bn' ? 'বাংলাদেশি ডাটাবেজ' : 'BD Foods'}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'bn'
                    ? 'সারাদিনে কি খাচ্ছেন ও কি কাজ করছেন তা সহজেই এন্ট্রি দিয়ে ক্যালরি ও ডায়েট ব্যালেন্স রাখুন'
                    : 'Track your meals, calories burned, diet plan, and health reminders automatically'}
                </p>
              </div>
            </div>
          </div>

          {/* Date Picker & Profile Button */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                className="bg-transparent border-none p-0 focus:outline-hidden text-xs font-semibold cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'bn' ? 'লক্ষ্য ও ডায়েট' : 'Goals & BMI'}</span>
            </button>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-100 pt-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('meter')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'meter'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{language === 'bn' ? 'আজকের ক্যালরি মিটার' : 'Calorie Tracker'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diet_plan')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'diet_plan'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'bn' ? 'ডাইট প্লান ও স্বাস্থ্য বার্তা' : 'Diet Plan & Advice'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'reminders'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{language === 'bn' ? 'রুটিন ও রিমাইন্ডার' : 'Reminders & Routine'}</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: CALORIE METER & ACTIVITY TRACKER ================= */}
      {activeTab === 'meter' && (
        <div className="space-y-6">
          {/* Main Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Intake */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {language === 'bn' ? 'মোট খাবার ক্যালরি (ইনটেক)' : 'Food Intake'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{totalIntake}</span>
                <span className="text-xs text-slate-400 font-semibold">kcal</span>
              </div>
              {/* Progress Bar towards Target */}
              <div className="mt-3">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                  <span>{language === 'bn' ? 'টার্গেট' : 'Target'}: {targetCalories} kcal</span>
                  <span>{caloriePercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      caloriePercent > 100 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, caloriePercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Total Burned */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {language === 'bn' ? 'কাজের হিসাবে বার্ন' : 'Calories Burned'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-rose-500" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-rose-600">-{totalBurned}</span>
                <span className="text-xs text-slate-400 font-semibold">kcal</span>
              </div>
              <div className="mt-3 text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                <span>
                  {language === 'bn'
                    ? `${todayActivities.length} টি এক্টিভিটি / ব্যায়াম সম্পন্ন`
                    : `${todayActivities.length} activities logged`}
                </span>
              </div>
            </div>

            {/* Card 3: Net Calories */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {language === 'bn' ? 'নেট ক্যালরি (খাদ্য - বার্ন)' : 'Net Calories'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{netCalories}</span>
                <span className="text-xs text-slate-400 font-semibold">kcal</span>
              </div>
              <div className="mt-3 text-xs font-semibold flex items-center gap-1.5">
                {remainingCalories >= 0 ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {language === 'bn'
                      ? `আর ${remainingCalories} kcal বাকি`
                      : `${remainingCalories} kcal remaining`}
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {language === 'bn'
                      ? `${Math.abs(remainingCalories)} kcal অতিরিক্ত`
                      : `${Math.abs(remainingCalories)} kcal over limit`}
                  </span>
                )}
              </div>
            </div>

            {/* Card 4: Water & Macros */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    {language === 'bn' ? 'পানি পান (হাইড্রেশন)' : 'Water Tracker'}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
                    <Droplets className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-cyan-700">{waterGlasses}</span>
                  <span className="text-xs text-slate-400 font-semibold">
                    / {currentProfile.waterGlassesTarget || 8} {language === 'bn' ? 'গ্লাস' : 'glasses'}
                  </span>
                </div>
              </div>

              {/* Quick Water +/- buttons */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateWaterGlasses(Math.max(0, waterGlasses - 1))}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  -১ গ্লাস
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateWaterGlasses(waterGlasses + 1)}
                  className="flex-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  +১ গ্লাস পান করেছি
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons: Camera AI Scan vs Food Library vs AI Calorie vs Activity */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer text-xs sm:text-sm"
            >
              <Camera className="w-4 h-4 text-emerald-200" />
              <span>{language === 'bn' ? '📸 AI ক্যামেরা স্ক্যান' : '📸 AI Camera Scan'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomFoodMode(true);
                setIsAddFoodOpen(true);
                setFoodSearchQuery('');
              }}
              className="py-3 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer text-xs sm:text-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{language === 'bn' ? '✨ AI দিয়ে ক্যালরি' : '✨ AI Calorie'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomFoodMode(false);
                setIsAddFoodOpen(true);
                setFoodSearchQuery('');
              }}
              className="py-3 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold rounded-2xl shadow-2xs flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer text-xs sm:text-sm"
            >
              <Utensils className="w-4 h-4 text-amber-600" />
              <span>{language === 'bn' ? 'খাবার মেনু' : 'Food Library'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddActivityOpen(true)}
              className="py-3 px-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold rounded-2xl shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer text-xs sm:text-sm"
            >
              <Activity className="w-4 h-4" />
              <span>{language === 'bn' ? 'ক্যালরি বার্ন যোগ' : 'Burn & Activity'}</span>
            </button>
          </div>

          {/* Live Mobile Step & Smartwatch Activity Tracker */}
          <LiveActivityTracker
            calorieProfile={currentProfile}
            onAddActivityLog={onAddActivityLog}
            selectedDate={selectedDate}
            language={language}
          />

          {/* Meals Categorized Section (সকাল, দুপুর, বিকাল, রাত) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-500" />
                <span>{language === 'bn' ? 'আজকের খাবারের তালিকা ও ক্যালরি' : "Today's Logged Meals"}</span>
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {language === 'bn' ? `মোট: ${totalIntake} kcal` : `Total: ${totalIntake} kcal`}
              </span>
            </div>

            {/* Meal Groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['breakfast', 'lunch', 'snack', 'dinner', 'extra'] as MealType[]).map((mType) => {
                const grp = mealGroups[mType];
                return (
                  <div
                    key={mType}
                    className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{grp.icon}</span>
                          <div>
                            <h3 className="font-bold text-sm text-slate-800">
                              {language === 'bn' ? grp.titleBn : grp.titleEn}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              {grp.items.length} {language === 'bn' ? 'টি আইটেম' : 'items'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                            {grp.totalCal} kcal
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMealType(mType);
                              setIsAddFoodOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title={language === 'bn' ? 'খাবার যোগ করুন' : 'Add food'}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Items list */}
                      {grp.items.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center italic">
                          {language === 'bn' ? 'কোনো খাবার এন্ট্রি দেওয়া হয়নি' : 'No items logged yet'}
                        </p>
                      ) : (
                        <div className="space-y-2 divide-y divide-slate-100">
                          {grp.items.map((item) => (
                            <div
                              key={item.id}
                              className="pt-2 first:pt-0 flex items-center justify-between gap-2 group"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {item.foodName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {item.time} • {item.portion}x {item.servingUnit}
                                  {item.protein ? ` • P: ${item.protein}g` : ''}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-bold text-amber-600">
                                  +{item.calories} kcal
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onDeleteMealLog(item.id)}
                                  className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activities / Work Logged Section */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                <span>
                  {language === 'bn' ? 'কাজের হিসাব ও ক্যালরি বার্ন রেকর্ড' : 'Work & Activities Log'}
                </span>
              </h2>
              <span className="text-xs font-bold text-rose-600">
                {language === 'bn' ? `মোট বার্ন: -${totalBurned} kcal` : `Total: -${totalBurned} kcal`}
              </span>
            </div>

            {todayActivities.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <p>{language === 'bn' ? 'আজকের কোনো কাজ বা ব্যায়াম এখনও রেকর্ড করা হয়নি।' : 'No activity logged yet today.'}</p>
                <button
                  type="button"
                  onClick={() => setIsAddActivityOpen(true)}
                  className="mt-2 text-rose-600 font-bold hover:underline"
                >
                  {language === 'bn' ? '+ হাঁটা, সাইক্লিং বা কাজ যোগ করুন' : '+ Log walking or work'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {todayActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <Flame className="w-4 h-4 fill-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{act.activityName}</p>
                        <p className="text-[11px] text-slate-400">
                          {act.time} • {act.durationMinutes} মিনিট ({act.intensity})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-rose-600">
                        -{act.caloriesBurned} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteActivityLog(act.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 2: DIET PLAN & SMART HEALTH MESSAGES ================= */}
      {activeTab === 'diet_plan' && (
        <div className="space-y-6">
          {/* Smart Coach Advice Cards */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'bn' ? 'স্মার্ট স্বাস্থ্য বার্তা ও আজকের ডায়েট পরামর্শ' : 'Smart Health Coach & Daily Advice'}
                </h2>
                <p className="text-xs text-slate-400">
                  {language === 'bn'
                    ? 'আপনার আজকের ক্যালরি গ্রহণ ও কাজের হিসাব অনুযায়ী তৈরি করা স্বয়ংক্রিয় গাইড'
                    : 'Personalized guidance based on your intake and calories burned'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {smartHealthAdvice.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    msg.type === 'warning'
                      ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                      : msg.type === 'cheer'
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : msg.type === 'nutrition'
                      ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                      : 'bg-amber-50/60 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {msg.type === 'warning' && <Info className="w-4 h-4 text-rose-600 shrink-0" />}
                    {msg.type === 'cheer' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {msg.type === 'nutrition' && <Apple className="w-4 h-4 text-blue-600 shrink-0" />}
                    {msg.type === 'tip' && <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />}
                    <h3 className="font-bold text-xs sm:text-sm">{msg.title}</h3>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed pl-6">{msg.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Structured Diet Chart for Bangladeshis */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-600" />
              <span>{language === 'bn' ? 'বাংলাদেশি আদর্শ ডায়েট প্লান (সুষম মেনু)' : 'Standard BD Balanced Diet Plan'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Morning */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌅</span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">সকাল ৮:০০ (নাস্তা)</h4>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                      ~৩০০-৩৫০ kcal
                    </span>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>১-২টি লাল আটার রুটি</li>
                  <li>১টি সেদ্ধ ডিম</li>
                  <li>মিক্সড সবজি বা ডাল</li>
                  <li>১ কাপ গ্রিন টি বা লাল চা</li>
                </ul>
              </div>

              {/* Midday */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">☀️</span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">দুপুর ১:৩০ (লাঞ্চ)</h4>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                      ~৬০০-৭০০ kcal
                    </span>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>১ প্লেট ভাত (পরিমিত)</li>
                  <li>১ বাটি পাতলা মসুর ডাল</li>
                  <li>১ টুকরো রুই/ইলিশ বা মুরগি</li>
                  <li>প্রচুর তাজা সালাদ ও শাক</li>
                </ul>
              </div>

              {/* Afternoon */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">☕</span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">বিকাল ৫:৩০ (স্ন্যাক্স)</h4>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                      ~১৫০-২০০ kcal
                    </span>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>১টি দেশি ফল (পেয়ারা/কলা/আপেল)</li>
                  <li>১ মুঠি ছোলা বা কাঠবাদাম</li>
                  <li>মুড়ি বা রঙ চা (চিনি ছাড়া)</li>
                  <li>১৫ মিনিট সান্ধ্য হাঁটা</li>
                </ul>
              </div>

              {/* Dinner */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌙</span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">রাত ৮:৩০ (ডিনার)</h4>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                      ~৪০০-৫০০ kcal
                    </span>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>১-২টি হালকা রুটি বা আধা কাপ ভাত</li>
                  <li>মাছের হালকা ঝোল বা সবজি</li>
                  <li>ঘুমানোর ২ ঘণ্টা আগে খাওয়া শেষ</li>
                  <li>ঘুমানোর আগে ১ গ্লাস পানি</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: REMINDERS & ROUTINE ================= */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'bn' ? 'দৈনিক স্বাস্থ্য ও খাবার রিমাইন্ডার' : 'Daily Routine & Reminders'}
                </h2>
                <p className="text-xs text-slate-400">
                  {language === 'bn'
                    ? 'কখন কি খাবার খাবেন ও কি কাজ করবেন তার সময়সূচি ও অ্যালার্ট'
                    : 'Get notified for meals, water intake, and evening workout walks'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 transition-all ${
                  rem.enabled
                    ? 'bg-blue-50/40 border-blue-200'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                      rem.enabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        {language === 'bn' ? rem.titleBn : rem.titleEn}
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-700">
                        {rem.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {rem.descriptionBn}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleReminder(rem.id)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    rem.enabled ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      rem.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: ADD FOOD (BANGLADESHI FOOD DATABASE) ================= */}
      {isAddFoodOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-500" />
                  <span>{language === 'bn' ? 'খাবার এন্ট্রি ও ক্যালরি অনুসন্ধান' : 'Log Food Intake'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'bn'
                    ? 'বাংলাদেশের যে কোনো খাবার, শাকসবজি ও ফলমূল সার্চ করে ১ ক্লিকে ক্যালরি হিসাব করুন'
                    : 'Search any Bangladeshi food or fruit for instant calories'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddFoodOpen(false);
                  setActiveFoodToLog(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Meal Type Selection */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 shrink-0">
                {language === 'bn' ? 'কখন খেলেন:' : 'Meal:'}
              </span>
              {(['breakfast', 'lunch', 'snack', 'dinner', 'extra'] as MealType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedMealType(type)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                    selectedMealType === type
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type === 'breakfast' && 'সকালের নাস্তা'}
                  {type === 'lunch' && 'দুপুরের খাবার'}
                  {type === 'snack' && 'বিকালের নাস্তা'}
                  {type === 'dinner' && 'রাতের খাবার'}
                  {type === 'extra' && 'অন্যান্য'}
                </button>
              ))}
            </div>

            {/* Search Bar & Category Filters */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={
                      language === 'bn'
                        ? 'খাবারের নাম লিখে খুঁজুন (যেমন: ভাত, ডাল, ইলিশ, ডিম, আম, সিঙাড়া)...'
                        : 'Search Bangladeshi food items...'
                    }
                    value={foodSearchQuery}
                    onChange={(e) => setFoodSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCustomFoodMode(!customFoodMode)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0 ${
                    customFoodMode
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {customFoodMode ? 'খাবার লাইব্রেরি' : '+ কাস্টম খাবার'}
                </button>
              </div>

              {/* Category Filter Pills */}
              {!customFoodMode && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedFoodCategory('all')}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                      selectedFoodCategory === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    সব ({BANGLADESHI_FOODS.length})
                  </button>
                  {FOOD_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedFoodCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors flex items-center gap-1 ${
                        selectedFoodCategory === cat.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{language === 'bn' ? cat.nameBn : cat.nameEn}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {customFoodMode ? (
                /* Custom Food Form with Gemini AI Integration */
                <form onSubmit={handleAddCustomFood} className="space-y-4 max-w-md mx-auto py-2">
                  {/* AI Feature Header Banner */}
                  <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200/80 rounded-2xl">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                        <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span>{language === 'bn' ? 'AI অটো ক্যালরি ক্যালকুলেটর' : 'AI Smart Calorie Estimator'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddFoodOpen(false);
                          setIsCameraScannerOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? '📸 ক্যামেরা স্ক্যান' : '📸 Camera Scan'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
                      {language === 'bn'
                        ? 'খাবারের নাম লিখে "AI হিসাব করুন" বাটনে চাপ দিন। Gemini AI খাবারটির সঠিক ক্যালরি, প্রোটিন, কার্বস ও ফ্যাট স্বয়ংক্রিয়ভাবে বের করে দেবে।'
                        : 'Type any custom meal or food name. Gemini AI will automatically calculate the calories and nutrition breakdown.'}
                    </p>

                    {/* Quick Suggestion Chips */}
                    <div className="mt-2.5 pt-2 border-t border-amber-200/60">
                      <span className="text-[10px] font-bold text-amber-700 block mb-1.5">
                        {language === 'bn' ? '⚡ দ্রুত ট্রাই করতে যেকোনো একটিতে ট্যাপ করুন:' : '⚡ Tap any common meal to auto-calculate:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '১ প্লেট কাচ্চি বিরিয়ানি',
                          '২টি পরোটা ও ভাজি',
                          '১ বাটি হালিম',
                          '১ কাপ দুধ চা',
                          'ভুনা খিচুড়ি ও ডিম',
                          '৬টি ফুচকা',
                          '১টি চকলেট কেক স্লাইস',
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              setCustomFoodName(suggestion);
                              handleCalculateWithAi(suggestion);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-white/90 border border-amber-300/80 text-[10px] font-semibold text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition-colors cursor-pointer"
                          >
                            + {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Food Name Field + AI Action Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {language === 'bn' ? 'খাবারের নাম বা বিবরণ *' : 'Food Name or Description *'}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleCalculateWithAi()}
                        disabled={isAiCalculating || !customFoodName.trim()}
                        className={`text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          isAiCalculating || !customFoodName.trim()
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs'
                        }`}
                      >
                        {isAiCalculating ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>{language === 'bn' ? 'হিসাব হচ্ছে...' : 'Analyzing...'}</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3 h-3" />
                            <span>{language === 'bn' ? '✨ AI দিয়ে ক্যালরি বের করুন' : '✨ Auto Calculate AI'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder={
                          language === 'bn'
                            ? 'যেমন: ১ প্লেট কাচ্চি বিরিয়ানি বা ২ পরোটা ডিম ভাজি'
                            : 'e.g. 1 plate chicken biryani or 2 parathas with fried egg'
                        }
                        value={customFoodName}
                        onChange={(e) => setCustomFoodName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!customFoodCal && customFoodName.trim()) {
                              handleCalculateWithAi();
                            }
                          }
                        }}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* AI Loading State Banner */}
                  {isAiCalculating && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-3 animate-pulse">
                      <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                      <div className="text-xs text-amber-900 font-medium">
                        <span>
                          {language === 'bn'
                            ? `Gemini AI দিয়ে "${customFoodName}" এর ক্যালরি ও পুষ্টি তথ্য হিসাব করা হচ্ছে...`
                            : `Calculating calories & nutrition for "${customFoodName}" via Gemini AI...`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* AI Error Banner */}
                  {aiError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
                      <span>{aiError}</span>
                      <button
                        type="button"
                        onClick={() => setAiError(null)}
                        className="text-rose-500 hover:text-rose-700 font-bold ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* AI Calculated Result Card */}
                  {aiCalculatedFor && customFoodCal && !isAiCalculating && (
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{language === 'bn' ? 'AI ক্যালকুলেশন সম্পন্ন' : 'AI Calculated Successfully'}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          {aiServingUnit}
                        </span>
                      </div>

                      {/* Macronutrients Grid */}
                      <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                        <div className="p-1.5 bg-white/80 rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-slate-500 block">ক্যালরি</span>
                          <span className="text-xs font-black text-emerald-700">{customFoodCal} kcal</span>
                        </div>
                        <div className="p-1.5 bg-white/80 rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-slate-500 block">প্রোটিন</span>
                          <span className="text-xs font-bold text-slate-800">{aiProtein}g</span>
                        </div>
                        <div className="p-1.5 bg-white/80 rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-slate-500 block">কার্বস</span>
                          <span className="text-xs font-bold text-slate-800">{aiCarbs}g</span>
                        </div>
                        <div className="p-1.5 bg-white/80 rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-slate-500 block">ফ্যাট</span>
                          <span className="text-xs font-bold text-slate-800">{aiFat}g</span>
                        </div>
                      </div>

                      {aiExplanation && (
                        <p className="text-[11px] text-slate-600 italic bg-white/60 p-2 rounded-lg leading-relaxed">
                          💡 {aiExplanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Manual / AI Calories & Portion Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {language === 'bn' ? 'ক্যালরি (প্রতি সার্ভিং) *' : 'Calories (kcal) *'}
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="যেমন: 250"
                        value={customFoodCal}
                        onChange={(e) => setCustomFoodCal(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {language === 'bn' ? 'কতটুকু খেয়েছেন (Portion)' : 'Portion Multiplier'}
                      </label>
                      <select
                        value={customFoodPortion}
                        onChange={(e) => setCustomFoodPortion(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white text-slate-800"
                      >
                        <option value="0.5">অর্ধেক (০.৫x)</option>
                        <option value="1">স্বাভাবিক (১x)</option>
                        <option value="1.5">দেড়গুণ (১.৫x)</option>
                        <option value="2">দ্বিগুণ (২x)</option>
                        <option value="3">তিনগুণ (৩x)</option>
                      </select>
                    </div>
                  </div>

                  {/* Calculated Total Display */}
                  {customFoodCal && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{language === 'bn' ? 'মোট ক্যালরি ট্র্যাকিংয়ে যাবে:' : 'Total calories to log:'}</span>
                      <span className="text-amber-600 font-black text-sm">
                        +{Math.round((parseFloat(customFoodCal) || 0) * (parseFloat(customFoodPortion) || 1))} kcal
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!customFoodName.trim() || !customFoodCal}
                    className={`w-full py-3 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      !customFoodName.trim() || !customFoodCal
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 active:scale-98'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{language === 'bn' ? 'ক্যালরি ট্র্যাকিংয়ে যোগ করুন' : 'Add to Tracker'}</span>
                  </button>
                </form>
              ) : (
                /* Food Items Grid */
                <div className="space-y-3">
                  {/* Quick AI Search Integration Banner */}
                  {foodSearchQuery.trim().length > 0 && (
                    <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          {language === 'bn'
                            ? `"${foodSearchQuery}" এর ক্যালরি সরাসরি AI দিয়ে বের করতে চান?`
                            : `Want to calculate calories for "${foodSearchQuery}" with AI?`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const q = foodSearchQuery.trim();
                          setCustomFoodName(q);
                          setCustomFoodMode(true);
                          handleCalculateWithAi(q);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? '✨ AI দিয়ে হিসাব করুন' : '✨ Calculate with AI'}</span>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredFoods.length === 0 ? (
                      <div className="col-span-2 text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-6">
                        <p className="text-slate-500 text-xs sm:text-sm font-medium">
                          {language === 'bn'
                            ? `লাইব্রেরিতে "${foodSearchQuery}" সরাসরি পাওয়া যায়নি।`
                            : `No item found matching "${foodSearchQuery}".`}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const q = foodSearchQuery.trim();
                            setCustomFoodName(q);
                            setCustomFoodMode(true);
                            if (q) handleCalculateWithAi(q);
                          }}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow-md hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {language === 'bn'
                              ? `AI দিয়ে "${foodSearchQuery || 'কাস্টম খাবার'}" এর ক্যালরি বের করুন`
                              : `Calculate with AI`}
                          </span>
                        </button>
                      </div>
                    ) : (
                      filteredFoods.map((food) => (
                      <div
                        key={food.id}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/20 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                                {food.nameBn}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">{food.nameEn}</p>
                            </div>
                            <span className="text-xs font-black text-amber-600 bg-amber-100/70 px-2 py-0.5 rounded-lg shrink-0">
                              {food.calories} kcal
                            </span>
                          </div>

                          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                            <span className="text-slate-600 font-medium">{food.defaultServing}</span>
                            <span className="text-[10px] text-slate-400">
                              P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                            </span>
                          </div>
                        </div>

                        {/* Portion Buttons */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400">পরিমাণ:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickAddFood(food, 0.5)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 transition-colors"
                              title="হাফ বা আধা প্লেট"
                            >
                              ০.৫x
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAddFood(food, 1)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
                              title="১ প্লেট বা স্বাভাবিক"
                            >
                              +১x যোগ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAddFood(food, 1.5)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 transition-colors"
                              title="দেড়গুণ"
                            >
                              ১.৫x
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAddFood(food, 2)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 transition-colors"
                              title="ডাবল বা দ্বিগুণ"
                            >
                              ২x
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: LOG ACTIVITY / WORK (CALORIES BURNED) ================= */}
      {isAddActivityOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-500" />
                  <span>{language === 'bn' ? 'কাজের হিসাব ও ক্যালরি বার্ন যোগ' : 'Log Physical Activity & Burn'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'bn'
                    ? 'হাঁটা, সাইক্লিং, ঘরের কাজ বা ব্যায়াম নির্বাচন করুন - স্বয়ংক্রিয় ক্যালরি হিসাব হবে'
                    : 'Track your daily activity and calculate calories burned'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddActivityOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="p-5 space-y-4 overflow-y-auto">
              {/* Activity Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'bn' ? 'কাজের বা শরীরচর্চার ধরন নির্বাচন করুন *' : 'Select Activity *'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-2xl bg-slate-50/50">
                  {DAILY_ACTIVITIES.map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        setSelectedActivity(act);
                        setCustomActivityName('');
                      }}
                      className={`p-2.5 rounded-xl text-left text-xs font-semibold transition-all border ${
                        selectedActivity.id === act.id && !customActivityName
                          ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-bold text-slate-900 truncate">{act.nameBn}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        ~{act.calPer30Min} kcal / ৩০ মিনিট
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration in Minutes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'কতো সময় ধরে করেছেন (মিনিট) *' : 'Duration (Minutes) *'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="480"
                    required
                    value={activityDuration}
                    onChange={(e) => setActivityDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex items-center gap-1">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setActivityDuration(mins)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          activityDuration === mins
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mins}মি.
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Intensity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'bn' ? 'পরিশ্রমের মাত্রা (Intensity)' : 'Intensity Level'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light', label: 'হালকা (Light)' },
                    { id: 'moderate', label: 'মাঝারি (Moderate)' },
                    { id: 'vigorous', label: 'ভারী / দ্রুত (Hard)' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setActivityIntensity(lvl.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-colors ${
                        activityIntensity === lvl.id
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant Calculated Burn Banner */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-800">
                    {language === 'bn' ? 'আনুমানিক ক্যালরি বার্ন:' : 'Estimated Burn:'}
                  </span>
                  <p className="text-[11px] text-rose-600">
                    {selectedActivity.nameBn} ({activityDuration} মিনিট)
                  </p>
                </div>
                <span className="text-xl font-black text-rose-600">
                  -{Math.round(
                    (selectedActivity.calPer30Min * (activityDuration / 30)) *
                      (activityIntensity === 'vigorous' ? 1.25 : activityIntensity === 'light' ? 0.8 : 1.0)
                  )}{' '}
                  kcal
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                {language === 'bn' ? 'বার্ন সম্পন্ন ও সংরক্ষণ করুন' : 'Log & Save Burn'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: PROFILE & DIET GOAL SETTINGS ================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? 'শারীরিক লক্ষ্য ও ডায়েট ক্যালকুলেটর' : 'Health Profile & Targets'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'bn'
                    ? 'আপনার বয়স, ওজন ও লক্ষ্যের উপর ভিত্তি করে দৈনিক ক্যালরি নির্ধারণ করুন'
                    : 'Personalize daily calorie target according to your goal'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4 overflow-y-auto">
              {/* Goal Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'bn' ? 'আপনার বর্তমান লক্ষ্য কী? *' : 'Your Goal *'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'lose', label: 'ওজন কমানো', desc: 'Fat Loss (-500 kcal)' },
                    { id: 'maintain', label: 'ফিট থাকা', desc: 'Maintain Weight' },
                    { id: 'gain', label: 'ওজন বাড়ানো', desc: 'Muscle Gain (+400 kcal)' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setEditGoal(g.id as any);
                        if (g.id === 'lose') setEditTargetCal(1750);
                        if (g.id === 'maintain') setEditTargetCal(2100);
                        if (g.id === 'gain') setEditTargetCal(2500);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        editGoal === g.id
                          ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-xs font-bold">{g.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{g.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'বয়স (বছর)' : 'Age'}
                  </label>
                  <input
                    type="number"
                    value={editAge}
                    onChange={(e) => setEditAge(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'লিঙ্গ' : 'Gender'}
                  </label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">পুরুষ (Male)</option>
                    <option value="female">মহিলা (Female)</option>
                  </select>
                </div>
              </div>

              {/* Weight & Height */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'বর্তমান ওজন (কেজি)' : 'Weight (Kg)'}
                  </label>
                  <input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'উচ্চতা (ফুট ও ইঞ্চি)' : 'Height'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="ফুট"
                      value={editHeightFeet}
                      onChange={(e) => setEditHeightFeet(Number(e.target.value))}
                      className="w-1/2 px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="ইঞ্চি"
                      value={editHeightInches}
                      onChange={(e) => setEditHeightInches(Number(e.target.value))}
                      className="w-1/2 px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Target Daily Calories */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'দৈনিক ক্যালরি টার্গেট (kcal)' : 'Target Daily Calories (kcal)'}
                </label>
                <input
                  type="number"
                  required
                  value={editTargetCal}
                  onChange={(e) => setEditTargetCal(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                {language === 'bn' ? 'লক্ষ্যমাত্রা সংরক্ষণ করুন' : 'Save Goals'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Camera Food Scanner Modal */}
      <CameraFoodScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onAddMealLog={onAddMealLog}
        selectedDate={selectedDate}
        language={language}
      />
    </div>
  );
};
