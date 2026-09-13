export interface AiCalorieEstimate {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingUnit: string;
  explanation?: string;
  source: 'ai' | 'fallback';
}

export interface ScannedFoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ScannedMealResult {
  mealTitle: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  servingDescription: string;
  items: ScannedFoodItem[];
  dietaryAdvice: string;
  source: 'ai' | 'fallback';
}

/**
 * Intelligent client-side fallback dictionary for common Bangladeshi & street foods
 * calibrated with Dhaka University INFS & USDA FoodData Central standards.
 */
const FALLBACK_KNOWLEDGE: { pattern: RegExp; name: string; cal: number; p: number; c: number; f: number; unit: string; advice: string }[] = [
  { pattern: /কাচ্চি|kacchi/i, name: 'খাসির কাচ্চি বিরিয়ানি', cal: 650, p: 24, c: 75, f: 28, unit: '১ প্লেট (৩৫০-৪০০ গ্রাম)', advice: 'উচ্চ ক্যালরি ও ফ্যাট সমৃদ্ধ পদ।' },
  { pattern: /তেহারি|tehari/i, name: 'গরুর তেহারি', cal: 560, p: 22, c: 70, f: 22, unit: '১ প্লেট (৩৫০ গ্রাম)', advice: 'তেল ও চর্বিযুক্ত ঐতিহ্যবাহী খাবার।' },
  { pattern: /বিরিয়ানি|biryani/i, name: 'চিকেন বা মাটন বিরিয়ানি', cal: 580, p: 25, c: 72, f: 21, unit: '১ প্লেট (৩৫০ গ্রাম)', advice: 'পরিমিত সালাদ ও রায়তা সহযোগে খাওয়া ভালো।' },
  { pattern: /খিচুড়ি|khichuri/i, name: 'ভুনা খিচুড়ি', cal: 380, p: 12, c: 56, f: 12, unit: '১ প্লেট (৩০০ গ্রাম)', advice: 'চাল-ডালের সুষম মিশ্রণে পুষ্টিকর খাবার।' },
  { pattern: /ভাত|rice|bhat/i, name: 'সাদা ভাত (সিদ্ধ)', cal: 200, p: 4, c: 45, f: 0.5, unit: '১ মাঝারি কাপ (১৫০ গ্রাম)', advice: 'প্রধান শর্করা; সবজি ও প্রোটিন সহযোগে খান।' },
  { pattern: /রুটি|roti|ruti/i, name: 'শুকনো আটার লাল রুটি', cal: 90, p: 3.5, c: 19, f: 0.8, unit: '১টি মাঝারি (৪০ গ্রাম)', advice: 'কম ক্যালরি ও আঁশসমৃদ্ধ স্বাস্থ্যকর রুটি।' },
  { pattern: /পরোটা|paratha/i, name: 'তেলে ভাজা পরোটা', cal: 250, p: 4.5, c: 30, f: 12, unit: '১টি মাঝারি (৭০ গ্রাম)', advice: 'তেলে ভাজা হওয়ায় ক্যালরি তুলনামূলক বেশি।' },
  { pattern: /ডিম ভাজি|dim vaji|fried egg|omelette|অমলেট/i, name: 'ডিম ভাজি / ওমলেট', cal: 135, p: 6.5, c: 1.2, f: 11, unit: '১টি মাঝারি ডিম', advice: 'উচ্চমানের প্রোটিনের ভালো উৎস।' },
  { pattern: /সেদ্ধ ডিম|boiled egg|dim sheddo/i, name: 'সেদ্ধ ডিম', cal: 78, p: 6.3, c: 0.6, f: 5.3, unit: '১টি ডিম (৫০ গ্রাম)', advice: 'আদর্শ কম ক্যালরির লিন প্রোটিন।' },
  { pattern: /ডাল|dal|daal/i, name: 'পাতলা মসুর ডাল', cal: 105, p: 7, c: 16, f: 2, unit: '১ বাটি (১৫০ মিলি)', advice: 'উদ্ভিজ্জ প্রোটিন ও আয়রনের আদর্শ উপাদান।' },
  { pattern: /ইলিশ|hilsa|ilish/i, name: 'ইলিশ মাছ ভাজা বা ঝোল', cal: 270, p: 22, c: 2, f: 20, unit: '১ টুকরা মাঝারি (৮৫ গ্রাম)', advice: 'ওমেগা-৩ ফ্যাটি এসিড সমৃদ্ধ মাছ।' },
  { pattern: /রুই|কাতলা|rui|katla|fish/i, name: 'রুই মাছের হালকা ঝোল', cal: 170, p: 21, c: 3, f: 8, unit: '১ টুকরা মাঝারি (৮৫ গ্রাম)', advice: 'সহজে পরিপাকযোগ্য স্বাস্থ্যকর প্রোটিন।' },
  { pattern: /গরু|beef|gorur mangsho/i, name: 'গরুর মাংসের ভুনা', cal: 320, p: 26, c: 4, f: 22, unit: '১ বাটি (৩-৪ টুকরা, ১৫০ গ্রাম)', advice: 'আয়রন ও প্রোটিন সমৃদ্ধ খাবার।' },
  { pattern: /মুরগি|chicken|murgir mangsho/i, name: 'মুরগির মাংসের ঝোল', cal: 230, p: 25, c: 4, f: 13, unit: '১ বাটি (২ টুকরা, ১৫০ গ্রাম)', advice: 'লিন প্রোটিনের জন্য চমৎকার খাদ্য।' },
  { pattern: /খাসি|mutton|khasir/i, name: 'খাসির মাংসের রেজালা', cal: 360, p: 24, c: 5, f: 27, unit: '১ বাটি (১৫০ গ্রাম)', advice: 'চর্বিযুক্ত মাংস; পরিমিত খাওয়া উচিত।' },
  { pattern: /ফুচকা|fuchka|phuchka/i, name: 'টক ফুচকা (তেঁতুল পানিসহ)', cal: 220, p: 4, c: 38, f: 6, unit: '৬টি ফুচকা', advice: 'স্ট্রিট ফুড স্ন্যাক্স।' },
  { pattern: /সিঙাড়া|singara|shingara/i, name: 'আলুর সিঙাড়া', cal: 160, p: 3, c: 20, f: 8, unit: '১টি মাঝারি সিঙাড়া', advice: 'ডিপ ফ্রাইড খাবার।' },
  { pattern: /সমুচা|samosa|somucha/i, name: 'সমুচা', cal: 140, p: 3.5, c: 16, f: 7, unit: '১টি সমুচা', advice: 'বিকেলের স্ন্যাক্স।' },
  { pattern: /চাপ|chaap/i, name: 'চিকেন বা বিফ চাপ', cal: 380, p: 30, c: 8, f: 26, unit: '১ প্লেট চাপ', advice: 'উচ্চ প্রোটিন ও ফ্রাইড স্ন্যাক্স।' },
  { pattern: /হালিম|haleem|halim/i, name: 'শাহী হালিম', cal: 340, p: 22, c: 38, f: 12, unit: '১ বাটি (২৫০ গ্রাম)', advice: 'ডাল ও মাংসের পুষ্টিকর খাদ্য।' },
  { pattern: /দুধ চা|milk tea/i, name: 'দুধ চা (চিনিসহ)', cal: 75, p: 2, c: 12, f: 2, unit: '১ কাপ (১৫০ মিলি)', advice: 'চিনি নিয়ন্ত্রণে রাখুন।' },
  { pattern: /রং চা|লাল চা|black tea|green tea/i, name: 'লাল চা বা গ্রিন টি', cal: 5, p: 0, c: 1, f: 0, unit: '১ কাপ', advice: 'ক্যালরি মুক্ত অ্যান্টি-অক্সিডেন্ট।' },
  { pattern: /কলা|banana/i, name: 'পাকা কলা', cal: 105, p: 1.3, c: 27, f: 0.3, unit: '১টি মাঝারি (১২০ গ্রাম)', advice: 'পটাশিয়াম ও তাৎক্ষণিক শক্তি যোগায়।' },
  { pattern: /আপেল|apple/i, name: 'লাল আপেল', cal: 95, p: 0.5, c: 25, f: 0.3, unit: '১টি মাঝারি (১৮০ গ্রাম)', advice: 'ন্যাচারাল পেকটিন ও ফাইবারসমৃদ্ধ।' },
  { pattern: /আম|mango/i, name: 'পাকা আম', cal: 150, p: 1.2, c: 38, f: 0.6, unit: '১টি মাঝারি (২০০ গ্রাম)', advice: 'ভিটামিন এ ও সি-এর ভালো উৎস।' },
  { pattern: /আলু ভর্তা|alu bhorta|bhorta/i, name: 'আলু ভর্তা সরিষার তেলে', cal: 130, p: 2.5, c: 22, f: 4, unit: '২ চামচ (৬০ গ্রাম)', advice: 'ঐতিহ্যবাহী স্বাদের কার্বোহাইড্রেট পদ।' },
  { pattern: /পায়েস|payesh|kheer/i, name: 'দুধের পায়েস / ক্ষীর', cal: 260, p: 6, c: 42, f: 8, unit: '১ ছোট বাটি (১৫০ গ্রাম)', advice: 'দুধ ও চালের মিষ্টি পদ।' },
  { pattern: /মিষ্টি|rosogolla|sandesh|sweet/i, name: 'রসগোল্লা বা মিষ্টি', cal: 175, p: 3, c: 32, f: 4, unit: '১টি মিষ্টি', advice: 'চিনি ও ক্যালরি বেশি।' },
  { pattern: /পোলাও|polao|pulao/i, name: 'মটর বা সুগন্ধি পোলাও', cal: 260, p: 4.5, c: 46, f: 6.5, unit: '১ মাঝারি প্লেট (১৫০ গ্রাম)', advice: 'ঘি ও সুগন্ধি চালের পদ।' },
  { pattern: /সবজি|শাক|ভাজি|vegetable|shobji|saag|শাকসবজি/i, name: 'মিশ্র সবজি বা শাক ভাজি', cal: 55, p: 2.2, c: 7, f: 2.5, unit: '১ বাটি (১০০ গ্রাম)', advice: 'প্রচুর ফাইবার ও ভিটামিনের চমৎকার উৎস।' },
  { pattern: /সালাদ|শসা|টমেটো|salad|cucumber/i, name: 'তাজা শসা ও সালাদ', cal: 18, p: 0.8, c: 3.5, f: 0.2, unit: '১ বাটি (১০০ গ্রাম)', advice: 'জিরো ফ্যাট ও হাই হাইড্রেশন ডায়েট ফুড।' },
  { pattern: /চিংড়ি|shrimp|prawn/i, name: 'চিংড়ি মাছের মালাইকারি বা ভুনা', cal: 180, p: 19, c: 4, f: 9, unit: '১ বাটি (৪-৫টি মাঝারি)', advice: 'উচ্চ প্রোটিন ও জিংক সমৃদ্ধ।' },
  { pattern: /মাছ|fish/i, name: 'মাছের ঝোল / ভাজা', cal: 175, p: 21, c: 2, f: 8.5, unit: '১ টুকরা (৮৫ গ্রাম)', advice: 'সহজপাচ্য স্বাস্থ্যকর প্রোটিন।' },
  { pattern: /মাংস|meat/i, name: 'মাংসের তরকারি', cal: 270, p: 24, c: 3.5, f: 18, unit: '১ বাটি (১৫০ গ্রাম)', advice: 'প্রোটিন সমৃদ্ধ।' },
  { pattern: /দুধ|milk/i, name: 'খাঁটি গাভীর দুধ', cal: 130, p: 6.5, c: 10, f: 7, unit: '১ গ্লাস (২০০ মিলি)', advice: 'ক্যালসিয়াম ও ভিটামিন ডি-এর দারুণ উৎস।' },
  { pattern: /দই|yogurt|doi/i, name: 'মিষ্টি বা টক দই', cal: 110, p: 5.5, c: 12, f: 4.5, unit: '১ বাটি (১০০ গ্রাম)', advice: 'প্রোবায়োটিক হজমে উপকারী।' },
  { pattern: /মুড়ি|chira|চিঁড়া|muri/i, name: 'শুকনো মুড়ি বা চিঁড়া', cal: 110, p: 2.5, c: 24, f: 0.2, unit: '১ বাটি (৩০ গ্রাম)', advice: 'হালকা ও সহজে হজমযোগ্য নাস্তা।' },
  { pattern: /ফল|fruit/i, name: 'মৌসুমি তাজা ফল', cal: 75, p: 0.8, c: 18, f: 0.2, unit: '১টি বা ১ বাটি (১০০ গ্রাম)', advice: 'প্রাকৃতিক ভিটামিন ও অ্যান্টিঅক্সিডেন্ট।' },
];

export function lookupNutritionInstant(foodName: string, portionMultiplier: number = 1): AiCalorieEstimate {
  return fallbackEstimate(foodName, portionMultiplier);
}

function fallbackEstimate(foodName: string, portionMultiplier: number = 1): AiCalorieEstimate {
  const normalized = foodName.trim();
  const mult = Number(portionMultiplier) > 0 ? Number(portionMultiplier) : 1;

  for (const item of FALLBACK_KNOWLEDGE) {
    if (item.pattern.test(normalized)) {
      return {
        foodName: normalized,
        calories: Math.round(item.cal * mult),
        protein: Math.round(item.p * mult * 10) / 10,
        carbs: Math.round(item.c * mult * 10) / 10,
        fat: Math.round(item.f * mult * 10) / 10,
        servingUnit: item.unit,
        explanation: `${item.advice} (স্ট্যান্ডার্ড INFS মান: ~${item.cal} kcal, প্রোটিন ${item.p}g, কার্ব ${item.c}g, ফ্যাট ${item.f}g)`,
        source: 'fallback',
      };
    }
  }

  const defaultCal = Math.round(200 * mult);
  return {
    foodName: normalized,
    calories: defaultCal,
    protein: Math.round(6 * mult * 10) / 10,
    carbs: Math.round(30 * mult * 10) / 10,
    fat: Math.round(6 * mult * 10) / 10,
    servingUnit: '১ পরিবেশন (মাঝারি)',
    explanation: 'সাধারণ খাবারের গড় পুষ্টি উপাদান থেকে পরিগণিত প্রাক্কলন (ক্যালরি ও উপাদান পরিবর্তনযোগ্য)।',
    source: 'fallback',
  };
}

export async function estimateFoodCalories(
  foodName: string,
  portionMultiplier: number = 1,
  language: 'bn' | 'en' = 'bn'
): Promise<AiCalorieEstimate> {
  const trimmed = foodName.trim();
  if (!trimmed) {
    throw new Error(language === 'bn' ? 'খাবারের নাম প্রদান করুন' : 'Please provide a food name');
  }

  try {
    const res = await fetch('/api/ai/calculate-calories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        foodName: trimmed,
        portionMultiplier,
        language,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.error || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    if (!data || !data.data) {
      throw new Error('Invalid response structure from AI');
    }

    const aiRes = data.data;
    return {
      foodName: aiRes.foodName || trimmed,
      calories: Math.round(Number(aiRes.calories) || 0),
      protein: Math.round((Number(aiRes.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(aiRes.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(aiRes.fat) || 0) * 10) / 10,
      servingUnit: aiRes.servingUnit || '১ পরিবেশন',
      explanation: aiRes.explanation || undefined,
      source: data.source === 'smart_fallback' ? 'fallback' : (data.source || 'ai'),
    };
  } catch (err: any) {
    console.warn('AI Calorie API notice, using calibrated INFS fallback:', err.message);
    return fallbackEstimate(trimmed, portionMultiplier);
  }
}

export function getSmartPlateFallback(
  mealType: string = 'lunch',
  language: 'bn' | 'en' = 'bn'
): ScannedMealResult {
  const isBn = language === 'bn';
  const table: Record<string, ScannedMealResult> = {
    breakfast: {
      mealTitle: isBn ? 'সকালের নাস্তা' : 'Breakfast Plate',
      totalCalories: 380,
      totalProtein: 14,
      totalCarbs: 45,
      totalFat: 15,
      servingDescription: isBn ? '১ প্লেট নাস্তা' : '1 Breakfast plate',
      items: [
        { name: isBn ? 'আটার লাল রুটি' : 'Whole Wheat Roti', portion: isBn ? '২টি (৮০ গ্রাম)' : '2 pcs (80g)', calories: 180, protein: 7, carbs: 38, fat: 1.5 },
        { name: isBn ? 'ডিম ভাজি / ওমলেট' : 'Fried Egg / Omelette', portion: isBn ? '১টি মাঝারি' : '1 medium', calories: 130, protein: 6.5, carbs: 1, fat: 11 },
        { name: isBn ? 'সবজি ভাজি' : 'Mixed Vegetable Fry', portion: isBn ? '১ বাটি (১০০ গ্রাম)' : '1 cup (100g)', calories: 70, protein: 2, carbs: 6, fat: 4 },
      ],
      dietaryAdvice: isBn ? 'সকালের খাবারে লাল আটার রুটি ও ডিম দিয়ে পর্যাপ্ত প্রোটিন ও ফাইবার নিশ্চিত করুন।' : 'High fiber and clean protein for a balanced morning start.',
      source: 'fallback',
    },
    lunch: {
      mealTitle: isBn ? 'ভাত, মুরগির মাংসের ঝোল ও সালাদ' : 'Rice, Chicken Curry & Salad',
      totalCalories: 480,
      totalProtein: 29,
      totalCarbs: 52,
      totalFat: 14.5,
      servingDescription: isBn ? '১ প্লেট দুপুরের খাবার' : '1 Lunch plate',
      items: [
        { name: isBn ? 'সাদা ভাত' : 'White Rice', portion: isBn ? '১ কাপ (১৫০ গ্রাম)' : '1 cup (150g)', calories: 200, protein: 4, carbs: 45, fat: 0.5 },
        { name: isBn ? 'মুরগির মাংসের ঝোল' : 'Chicken Curry', portion: isBn ? '১ বাটি (১৫০ গ্রাম)' : '1 bowl (150g)', calories: 230, protein: 24, carbs: 4, fat: 13 },
        { name: isBn ? 'পাতলা মসুর ডাল' : 'Lentil Soup (Dal)', portion: isBn ? '১ ছোট বাটি (১০০ মিলি)' : '1 small bowl (100ml)', calories: 35, protein: 2.5, carbs: 5, fat: 0.8 },
        { name: isBn ? 'শসা ও সালাদ' : 'Cucumber Salad', portion: isBn ? '১ ছোট বাটি' : '1 small bowl', calories: 15, protein: 0.5, carbs: 2, fat: 0.2 },
      ],
      dietaryAdvice: isBn ? 'সুষম দুপুরের খাবার। ঝোলের অতিরিক্ত তেল পরিহার করলে ক্যালরি নিয়ন্ত্রণে থাকবে।' : 'Nutritious balanced lunch. Keep extra gravy moderate to control fat.',
      source: 'fallback',
    },
    dinner: {
      mealTitle: isBn ? 'রাতের খাবার (ভাত/রুটি ও তরকারি)' : 'Dinner Plate',
      totalCalories: 420,
      totalProtein: 24,
      totalCarbs: 48,
      totalFat: 12,
      servingDescription: isBn ? '১ প্লেট রাতের খাবার' : '1 Dinner plate',
      items: [
        { name: isBn ? 'সাদা ভাত বা রুটি' : 'Rice or Roti', portion: isBn ? '১ কাপ বা ২টি রুটি' : '1 cup or 2 rotis', calories: 190, protein: 4.5, carbs: 42, fat: 1 },
        { name: isBn ? 'মাছ বা মাংসের ভুনা' : 'Fish or Meat Curry', portion: isBn ? '১ টুকরা (১০০ গ্রাম)' : '1 pc (100g)', calories: 180, protein: 18, carbs: 2, fat: 10 },
        { name: isBn ? 'সবজি ও সালাদ' : 'Vegetables & Salad', portion: isBn ? '১ ছোট বাটি' : '1 cup', calories: 50, protein: 1.5, carbs: 4, fat: 1 },
      ],
      dietaryAdvice: isBn ? 'রাতে ঘুমানোর কমপক্ষে ২ ঘণ্টা আগে হালকা খাবার গ্রহণ হজমে সহায়ক।' : 'A light dinner 2 hours before bedtime aids restful sleep.',
      source: 'fallback',
    },
    snack: {
      mealTitle: isBn ? 'বিকেলের হালকা নাস্তা' : 'Evening Snack',
      totalCalories: 180,
      totalProtein: 3.5,
      totalCarbs: 32,
      totalFat: 4,
      servingDescription: isBn ? '১ পরিবেশন' : '1 serving',
      items: [
        { name: isBn ? 'লাল চা বা গ্রিন টি' : 'Black or Green Tea', portion: isBn ? '১ কাপ' : '1 cup', calories: 5, protein: 0, carbs: 1, fat: 0 },
        { name: isBn ? 'বিস্কুট বা মুড়ি' : 'Biscuits or Puffed Rice', portion: isBn ? '২টি বা ১ কাপ' : '2 pcs or 1 cup', calories: 95, protein: 2, carbs: 20, fat: 2 },
        { name: isBn ? 'পাকা কলা' : 'Ripe Banana', portion: isBn ? '১টি ছোট' : '1 small', calories: 80, protein: 1.5, carbs: 11, fat: 0.2 },
      ],
      dietaryAdvice: isBn ? 'বিকেলে ভাজাপোড়ার বদলে তাজা ফল বা মুড়ি খাওয়া স্বাস্থ্যের জন্য উপকারী।' : 'Prefer fresh fruits or light puffed rice over deep fried items.',
      source: 'fallback',
    }
  };

  return table[mealType] || table.lunch;
}

/**
 * Multimodal Camera Food Scanner
 * Sends captured food picture to Gemini Multimodal Vision API
 * Gracefully falls back to smart plate breakdown if running on a static host (like Netlify)
 */
export async function scanFoodImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  mealType: string = 'lunch',
  language: 'bn' | 'en' = 'bn'
): Promise<ScannedMealResult> {
  if (!imageBase64) {
    throw new Error(language === 'bn' ? 'ছবির ডেটা পাওয়া যায়নি' : 'No image data provided');
  }

  // 1. First attempt calling backend endpoint (/api/ai/scan-food-image)
  try {
    const res = await fetch('/api/ai/scan-food-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        mealType,
        language,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.data) {
        const d = data.data;
        return {
          mealTitle: d.mealTitle || (language === 'bn' ? 'স্ক্যান করা খাবার' : 'Scanned Meal'),
          totalCalories: Math.round(Number(d.totalCalories) || 450),
          totalProtein: Math.round((Number(d.totalProtein) || 0) * 10) / 10,
          totalCarbs: Math.round((Number(d.totalCarbs) || 0) * 10) / 10,
          totalFat: Math.round((Number(d.totalFat) || 0) * 10) / 10,
          servingDescription: d.servingDescription || (language === 'bn' ? '১ প্লেট খাবার' : '1 plate'),
          items: Array.isArray(d.items) ? d.items : [],
          dietaryAdvice: d.dietaryAdvice || '',
          source: data.source || 'ai',
        };
      }
    } else {
      console.warn(`Backend /api/ai/scan-food-image responded with ${res.status}. Falling back to client-safe handler.`);
    }
  } catch (netErr: any) {
    console.warn('Backend connection notice for image scan, checking client options:', netErr?.message);
  }

  // 2. Client-side fallback for static deployments (e.g., Netlify with VITE_GEMINI_API_KEY)
  const clientApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (clientApiKey) {
    try {
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: clientApiKey });
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

      const visionPrompt = `You are an expert clinical nutritionist and dietitian specializing in Bangladeshi, South Asian, and global cuisines.
Examine this photo of a meal, bowl, or plate with high analytical accuracy.
Task:
1. Item Breakdown: Identify and list EVERY distinct food item clearly visible on the plate or table (e.g. সাদা ভাত, মুরগির মাংসের ঝোল, গরুর মাংস, পাতলা মসুর ডাল, ডিম ভাজি, সালাদ, আলু ভর্তা, পরোটা, সবজি ভাজি, মিষ্টি, ফল, ইত্যাদি).
2. Exact Portion: For every item, provide a clear, realistic portion estimate including visual measure and weight in grams.
3. Accurate Nutritional Metrics: Calculate accurate calories (kcal), protein (g), carbs (g), and fat (g) for each distinct item.
4. Summary: Calculate aggregate total calories, total protein, total carbs, and total fat for the whole plate.
5. Dietary Note: Provide a 1-2 sentence dietary insight or advice in ${language === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
Respond strictly in JSON format matching schema.`;

      const candidateModels = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
      for (const m of candidateModels) {
        try {
          const clientRes = await ai.models.generateContent({
            model: m,
            contents: [
              { inlineData: { mimeType: mimeType || 'image/jpeg', data: cleanBase64 } },
              visionPrompt,
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  mealTitle: { type: Type.STRING },
                  totalCalories: { type: Type.INTEGER },
                  totalProtein: { type: Type.NUMBER },
                  totalCarbs: { type: Type.NUMBER },
                  totalFat: { type: Type.NUMBER },
                  servingDescription: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        portion: { type: Type.STRING },
                        calories: { type: Type.INTEGER },
                        protein: { type: Type.NUMBER },
                        carbs: { type: Type.NUMBER },
                        fat: { type: Type.NUMBER },
                      },
                      required: ['name', 'portion', 'calories', 'protein', 'carbs', 'fat'],
                    },
                  },
                  dietaryAdvice: { type: Type.STRING },
                },
                required: ['mealTitle', 'totalCalories', 'totalProtein', 'totalCarbs', 'totalFat', 'servingDescription', 'items', 'dietaryAdvice'],
              },
            },
          });

          if (clientRes.text) {
            const parsed = JSON.parse(clientRes.text.trim());
            return {
              mealTitle: parsed.mealTitle || (language === 'bn' ? 'স্ক্যান করা খাবার' : 'Scanned Meal'),
              totalCalories: Math.round(Number(parsed.totalCalories) || 450),
              totalProtein: Math.round((Number(parsed.totalProtein) || 0) * 10) / 10,
              totalCarbs: Math.round((Number(parsed.totalCarbs) || 0) * 10) / 10,
              totalFat: Math.round((Number(parsed.totalFat) || 0) * 10) / 10,
              servingDescription: parsed.servingDescription || (language === 'bn' ? '১ প্লেট খাবার' : '1 plate'),
              items: Array.isArray(parsed.items) ? parsed.items : [],
              dietaryAdvice: parsed.dietaryAdvice || '',
              source: 'ai',
            };
          }
        } catch (mErr: any) {
          console.warn(`Client Gemini model ${m} notice:`, mErr?.message);
        }
      }
    } catch (clientErr: any) {
      console.warn('Client-side Gemini execution notice:', clientErr?.message);
    }
  }

  // 3. Guaranteed reliable fallback based on INFS standard plate so user can immediately edit items and quantities
  return getSmartPlateFallback(mealType, language);
}
