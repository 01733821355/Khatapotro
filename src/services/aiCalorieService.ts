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
];

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

/**
 * Multimodal Camera Food Scanner
 * Sends captured food picture to Gemini Multimodal Vision API
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

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.error || `Vision analysis failed with status ${res.status}`);
  }

  const data = await res.json();
  if (!data || !data.data) {
    throw new Error('Invalid response from Vision API');
  }

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
