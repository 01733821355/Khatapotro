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

/**
 * Intelligent client-side fallback dictionary for common Bangladeshi & street foods
 * in case the network/Gemini API is unavailable or rate-limited.
 */
const FALLBACK_KNOWLEDGE: { pattern: RegExp; name: string; cal: number; p: number; c: number; f: number; unit: string }[] = [
  { pattern: /বিরিয়ানি|biryani|tehari|তেহারি/i, name: 'বিরিয়ানি / তেহারি', cal: 550, p: 20, c: 68, f: 22, unit: '১ প্লেট (৩৫০ গ্রাম)' },
  { pattern: /খিচুড়ি|khichuri/i, name: 'ভুনা খিচুড়ি', cal: 380, p: 12, c: 56, f: 12, unit: '১ প্লেট' },
  { pattern: /ভাত|rice|bhat/i, name: 'সাদা ভাত', cal: 200, p: 4, c: 45, f: 0.5, unit: '১ কাপ (১৫০ গ্রাম)' },
  { pattern: /রুটি|roti|ruti/i, name: 'লাল আটার রুটি', cal: 95, p: 3.5, c: 19, f: 0.8, unit: '১টি মাঝারি' },
  { pattern: /পরোটা|paratha/i, name: 'তেলে ভাজা পরোটা', cal: 240, p: 4.5, c: 30, f: 11, unit: '১টি পরোটা' },
  { pattern: /ডিম ভাজি|dim vaji|fried egg|omelette|অমলেট/i, name: 'ডিম ভাজি / ওমলেট', cal: 135, p: 6.5, c: 1.2, f: 11, unit: '১টি ডিম' },
  { pattern: /সেদ্ধ ডিম|boiled egg|dim sheddo/i, name: 'সেদ্ধ ডিম', cal: 78, p: 6.3, c: 0.6, f: 5.3, unit: '১টি ডিম' },
  { pattern: /ডাল|dal|daal/i, name: 'পাতলা মসুর ডাল', cal: 110, p: 7, c: 16, f: 2, unit: '১ বাটি' },
  { pattern: /ইলিশ|hilsa|ilish/i, name: 'ইলিশ মাছের ঝোল / ভাজা', cal: 280, p: 22, c: 2, f: 20, unit: '১ টুকরা মাঝারি' },
  { pattern: /রুই|কাতলা|rui|katla|fish/i, name: 'রুই মাছের হালকা ঝোল', cal: 170, p: 21, c: 3, f: 8, unit: '১ টুকরা' },
  { pattern: /গরু|beef|gorur mangsho/i, name: 'গরুর মাংসের ভুনা', cal: 320, p: 26, c: 4, f: 22, unit: '১ বাটি (৩-৪ টুকরা)' },
  { pattern: /মুরগি|chicken|murgir mangsho/i, name: 'মুরগির ঝোল / ভুনা', cal: 240, p: 25, c: 5, f: 13, unit: '১ বাটি (২ টুকরা)' },
  { pattern: /খাসি|mutton|khasir/i, name: 'খাসির মাংসের রেজালা', cal: 360, p: 24, c: 5, f: 27, unit: '১ বাটি' },
  { pattern: /ফুচকা|fuchka|phuchka/i, name: 'টক ফুচকা', cal: 220, p: 4, c: 38, f: 6, unit: '৬টি ফুচকা' },
  { pattern: /সিঙাড়া|singara|shingara/i, name: 'আলুর সিঙাড়া', cal: 160, p: 3, c: 20, f: 8, unit: '১টি সিঙাড়া' },
  { pattern: /সমুচা|samosa|somucha/i, name: 'সমুচা', cal: 140, p: 3.5, c: 16, f: 7, unit: '১টি সমুচা' },
  { pattern: /চাপ|chaap/i, name: 'চিকেন বা বিফ চাপ', cal: 380, p: 30, c: 8, f: 26, unit: '১ প্লেট' },
  { pattern: /হালিম|haleem|halim/i, name: 'শাহী হালিম', cal: 340, p: 22, c: 38, f: 12, unit: '১ মাঝারি বাটি' },
  { pattern: /চা|দুধ চা|tea|milk tea/i, name: 'চিনিসহ দুধ চা', cal: 75, p: 2, c: 12, f: 2, unit: '১ কাপ' },
  { pattern: /রং চা|লাল চা|black tea|green tea/i, name: 'লাল চা / গ্রিন টি (চিনি ছাড়া)', cal: 5, p: 0, c: 1, f: 0, unit: '১ কাপ' },
  { pattern: /কলা|banana/i, name: 'পাকা সাগর/সবরি কলা', cal: 105, p: 1.3, c: 27, f: 0.3, unit: '১টি মাঝারি' },
  { pattern: /আপেল|apple/i, name: 'লাল আপেল', cal: 95, p: 0.5, c: 25, f: 0.3, unit: '১টি মাঝারি' },
  { pattern: /আম|mango/i, name: 'পাকা হিমসাগর / ল্যাংড়া আম', cal: 150, p: 1.2, c: 38, f: 0.6, unit: '১টি মাঝারি' },
  { pattern: /আলু ভর্তা|alu bhorta|bhorta/i, name: 'আলু ভর্তা খাঁটি সরিষার তেলে', cal: 130, p: 2.5, c: 22, f: 4, unit: '২ চামচ' },
  { pattern: /পায়েস|payesh|kheer/i, name: 'দুধের পায়েস / ক্ষীর', cal: 260, p: 6, c: 42, f: 8, unit: '১ বাটি' },
  { pattern: /মিষ্টি|rosogolla|sandesh|sweet/i, name: 'রসগোল্লা / মিষ্টি', cal: 175, p: 3, c: 32, f: 4, unit: '১টি মিষ্টি' },
];

function fallbackEstimate(foodName: string, portionMultiplier: number = 1): AiCalorieEstimate {
  const normalized = foodName.trim();
  const mult = Number(portionMultiplier) > 0 ? Number(portionMultiplier) : 1;

  // Try to match in knowledge base
  for (const item of FALLBACK_KNOWLEDGE) {
    if (item.pattern.test(normalized)) {
      return {
        foodName: normalized,
        calories: Math.round(item.cal * mult),
        protein: Math.round(item.p * mult * 10) / 10,
        carbs: Math.round(item.c * mult * 10) / 10,
        fat: Math.round(item.f * mult * 10) / 10,
        servingUnit: item.unit,
        explanation: `অনুমানভিত্তিক স্ট্যান্ডার্ড হিসাব: প্রতি সার্ভিংয়ে প্রায় ${item.cal} kcal (প্রোটিন ${item.p}g, কার্ব ${item.c}g, ফ্যাট ${item.f}g)।`,
        source: 'fallback',
      };
    }
  }

  // Generic estimation
  const defaultCal = Math.round(220 * mult);
  return {
    foodName: normalized,
    calories: defaultCal,
    protein: Math.round(8 * mult),
    carbs: Math.round(28 * mult),
    fat: Math.round(7 * mult),
    servingUnit: '১ পরিবেশন (পরিমাণমতো)',
    explanation: 'সাধারণ খাবারের গড় অনুপাত থেকে প্রাক্কলিত মান (ক্যালরি ও পুষ্টি উপাদান পরিবর্তনযোগ্য)।',
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
    console.warn('AI Calorie API failed, using intelligent nutrition fallback:', err.message);
    return fallbackEstimate(trimmed, portionMultiplier);
  }
}
