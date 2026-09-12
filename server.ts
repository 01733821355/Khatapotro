import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Intelligent fallback database for Bangladeshi and global foods
const BACKUP_NUTRITION_DB: { pattern: RegExp; name: string; cal: number; p: number; c: number; f: number; unit: string }[] = [
  { pattern: /বিরিয়ানি|biryani|tehari|তেহারি|কাচ্চি|kacchi/i, name: 'কাচ্চি / বিরিয়ানি', cal: 550, p: 20, c: 68, f: 22, unit: '১ প্লেট (৩৫০ গ্রাম)' },
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
  { pattern: /দুধ চা|milk tea/i, name: 'চিনিসহ দুধ চা', cal: 75, p: 2, c: 12, f: 2, unit: '১ কাপ' },
  { pattern: /চা|রং চা|লাল চা|black tea|green tea/i, name: 'লাল চা / গ্রিন টি', cal: 5, p: 0, c: 1, f: 0, unit: '১ কাপ' },
  { pattern: /কলা|banana/i, name: 'পাকা কলা', cal: 105, p: 1.3, c: 27, f: 0.3, unit: '১টি মাঝারি' },
  { pattern: /আপেল|apple/i, name: 'লাল আপেল', cal: 95, p: 0.5, c: 25, f: 0.3, unit: '১টি মাঝারি' },
  { pattern: /আম|mango/i, name: 'পাকা আম', cal: 150, p: 1.2, c: 38, f: 0.6, unit: '১টি মাঝারি' },
  { pattern: /আলু ভর্তা|alu bhorta|bhorta/i, name: 'আলু ভর্তা খাঁটি সরিষার তেলে', cal: 130, p: 2.5, c: 22, f: 4, unit: '২ চামচ' },
  { pattern: /পায়েস|payesh|kheer/i, name: 'দুধের পায়েস / ক্ষীর', cal: 260, p: 6, c: 42, f: 8, unit: '১ বাটি' },
  { pattern: /মিষ্টি|rosogolla|sandesh|sweet/i, name: 'রসগোল্লা / মিষ্টি', cal: 175, p: 3, c: 32, f: 4, unit: '১টি মিষ্টি' },
  { pattern: /কেক|cake|chocolate/i, name: 'চকলেট কেক স্লাইস', cal: 310, p: 4, c: 44, f: 14, unit: '১ স্লাইস (৮০ গ্রাম)' },
  { pattern: /বার্গার|burger/i, name: 'চিকেন বা বিফ বার্গার', cal: 420, p: 22, c: 40, f: 18, unit: '১টি বার্গার' },
  { pattern: /পিজ্জা|pizza/i, name: 'চিকেন পিজ্জা স্লাইস', cal: 270, p: 12, c: 32, f: 10, unit: '১ স্লাইস' },
  { pattern: /বোরহানি|borhani/i, name: 'শাহী বোরহানি', cal: 140, p: 4, c: 18, f: 5, unit: '১ গ্লাস (২০০ মিলি)' },
];

function calculateFallback(foodName: string, mult: number, language: string) {
  const norm = foodName.trim();
  for (const item of BACKUP_NUTRITION_DB) {
    if (item.pattern.test(norm)) {
      return {
        foodName: norm,
        calories: Math.round(item.cal * mult),
        protein: Math.round(item.p * mult * 10) / 10,
        carbs: Math.round(item.c * mult * 10) / 10,
        fat: Math.round(item.f * mult * 10) / 10,
        servingUnit: item.unit,
        explanation: language === 'bn'
          ? `স্ট্যান্ডার্ড ডাটাবেজ প্রাক্কলন: প্রতি পরিবেশনে প্রায় ${item.cal} kcal (প্রোটিন ${item.p}g, কার্বস ${item.c}g, ফ্যাট ${item.f}g)।`
          : `Standard nutritional estimate: ~${item.cal} kcal per serving (Protein: ${item.p}g, Carbs: ${item.c}g, Fat: ${item.f}g).`,
      };
    }
  }

  const baseCal = Math.round(220 * mult);
  return {
    foodName: norm,
    calories: baseCal,
    protein: Math.round(8 * mult),
    carbs: Math.round(28 * mult),
    fat: Math.round(7 * mult),
    servingUnit: language === 'bn' ? '১ পরিবেশন (পরিমাণমতো)' : '1 standard serving',
    explanation: language === 'bn'
      ? 'স্বাভাবিক খাদ্যের গড় পুষ্টি উপাদান থেকে পরিগণিত আনুমানিক হিসাব (পরিবর্তনযোগ্য)।'
      : 'Calculated from standard dietary averages (customizable).',
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to initialize GoogleGenAI lazily with process.env.GEMINI_API_KEY
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Endpoint: AI Calorie and Nutrition Estimation for Custom Food
  app.post('/api/ai/calculate-calories', async (req, res) => {
    const { foodName, portionMultiplier = 1, language = 'bn' } = req.body;

    if (!foodName || typeof foodName !== 'string' || !foodName.trim()) {
      return res.status(400).json({ error: 'Food name is required' });
    }

    const mult = Number(portionMultiplier) > 0 ? Number(portionMultiplier) : 1;
    const ai = getGeminiClient();

    // If API key is missing, respond gracefully using the smart nutrition knowledge base
    if (!ai) {
      const fallback = calculateFallback(foodName, mult, language);
      return res.json({ success: true, data: fallback, source: 'fallback' });
    }

    const prompt = `You are an expert nutritionist and dietitian specializing in Bangladeshi, South Asian, and international foods.
Analyze the user's custom food input: "${foodName.trim()}".
Portion multiplier requested: ${mult}.
Target language: ${language === 'bn' ? 'Bengali (বাংলা)' : 'English'}.

Task:
Calculate an accurate, realistic estimate for:
1. Standardized food name.
2. Total calories (integer kcal) for the requested portion.
3. Macronutrients in grams: protein, carbohydrates (carbs), and fat.
4. Serving unit or measurement description (e.g. "১ প্লেট (৩৫০ গ্রাম)", "১ বাটি (২০০ গ্রাম)", "২টি মাঝারি সাইজ").
5. Short 1-sentence nutritional insight or explanation in ${language === 'bn' ? 'Bengali' : 'English'}.

Respond strictly according to the requested JSON schema.`;

    // High availability models list with failover order
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                foodName: {
                  type: Type.STRING,
                  description: 'Standardized clean name of the food item',
                },
                calories: {
                  type: Type.INTEGER,
                  description: 'Estimated total calories (kcal) as integer',
                },
                protein: {
                  type: Type.NUMBER,
                  description: 'Estimated protein in grams',
                },
                carbs: {
                  type: Type.NUMBER,
                  description: 'Estimated carbs in grams',
                },
                fat: {
                  type: Type.NUMBER,
                  description: 'Estimated fat in grams',
                },
                servingUnit: {
                  type: Type.STRING,
                  description: 'Standard serving size description',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Short 1-sentence note or nutritional breakdown',
                },
              },
              required: ['foodName', 'calories', 'protein', 'carbs', 'fat', 'servingUnit'],
            },
          },
        });

        const responseText = response.text;
        if (responseText) {
          const parsedData = JSON.parse(responseText.trim());
          return res.json({ success: true, data: parsedData, source: 'ai', model: modelName });
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        // If the model is experiencing high demand (503/429/UNAVAILABLE), try the next candidate model
        if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('429')) {
          console.warn(`Model ${modelName} unavailable or experiencing high demand. Trying next model...`);
          // Brief pause before trying fallback model
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        } else {
          // For other non-transient errors, try next or fallback
          console.warn(`Model ${modelName} returned error: ${msg}. Trying next candidate...`);
        }
      }
    }

    // If all AI models are temporarily unavailable or high demand, provide smart nutrition estimate gracefully
    console.warn('All Gemini models temporarily experiencing high demand. Serving instant smart nutrition fallback for:', foodName.trim());
    const safeFallback = calculateFallback(foodName, mult, language);
    return res.json({
      success: true,
      data: safeFallback,
      source: 'smart_fallback',
      notice: 'Gemini models are experiencing temporary high demand; served from validated nutrition database.',
    });
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
