/**
 * Bengali & English Speech-to-Input Normalizer and Number Parser
 * Specially calibrated for Bengali colloquial phrases, verbal amounts, phone digits, and dates.
 */

const BN_DIGIT_MAP: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export const normalizeBengaliDigits = (text: string): string => {
  return text.replace(/[০-৯]/g, (d) => BN_DIGIT_MAP[d] || d);
};

const WORD_TO_NUMBER: Record<string, number> = {
  'শূন্য': 0, 'জিরো': 0, 'zero': 0,
  'এক': 1, 'one': 1, 'একটি': 1, '১টি': 1,
  'দুই': 2, 'two': 2, 'দুটো': 2, '২টি': 2,
  'তিন': 3, 'three': 3, 'তিনটি': 3,
  'চার': 4, 'four': 4, 'চারটি': 4,
  'পাঁচ': 5, 'five': 5, 'পাঁচটি': 5,
  'ছয়': 6, 'ছয়': 6, 'six': 6,
  'সাত': 7, 'seven': 7,
  'আট': 8, 'eight': 8,
  'নয়': 9, 'নয়': 9, 'nine': 9,
  'দশ': 10, 'ten': 10,
  'এগারো': 11, 'বারো': 12, 'তেরো': 13, 'চৌদ্দ': 14, 'পনেরো': 15,
  'ষোল': 16, 'সতেরো': 17, 'আঠারো': 18, 'উনিশ': 19,
  'বিশ': 20, 'কুড়ি': 20, 'কুড়ি': 20, 'twenty': 20,
  'পঁচিশ': 25,
  'ত্রিশ': 30, 'thirty': 30,
  'পঁয়ত্রিশ': 35, 'পঁয়ত্রিশ': 35,
  'চল্লিশ': 40, 'forty': 40,
  'পঁয়তাল্লিশ': 45, 'পঁয়তাল্লিশ': 45,
  'পঞ্চাশ': 50, 'fifty': 50,
  'পঞ্চান্ন': 55,
  'ষাট': 60, 'sixty': 60,
  'পঁয়ষট্টি': 65, 'পঁয়ষট্টি': 65,
  'সত্তর': 70, 'seventy': 70,
  'পঁচাত্তর': 75,
  'আশি': 80, 'eighty': 80,
  'পঁচাশি': 85,
  'নব্বই': 90, 'ninety': 90,
  'পঁচানব্বই': 95,
  'একশত': 100, 'একশো': 100, '১০০': 100, 'one hundred': 100,
  'দেড়শত': 150, 'দেড়শো': 150, 'দেড়শো': 150,
  'দুইশত': 200, 'দুইশো': 200, '২০০': 200, 'two hundred': 200,
  'আড়াইশত': 250, 'আড়াইশো': 250, 'আড়াইশো': 250,
  'তিনশত': 300, 'তিনশো': 300, '৩০০': 300,
  'চারশত': 400, 'চারশো': 400, '৪০০': 400,
  'পাঁচশত': 500, 'পাঁচশো': 500, '৫০০': 500,
  'ছয়শত': 600, 'ছয়শো': 600, 'ছয়শো': 600,
  'সাতশত': 700, 'সাতশো': 700,
  'আটশত': 800, 'আটশো': 800,
  'নয়শত': 900, 'নয়শো': 900, 'নয়শো': 900,
  'এক হাজার': 1000, 'হাজার': 1000, '1000': 1000, 'one thousand': 1000,
  'দেড় হাজার': 1500, 'দেড় হাজার': 1500,
  'দুই হাজার': 2000, 'আড়াই হাজার': 2500, 'আড়াই হাজার': 2500,
  'তিন হাজার': 3000, 'চার হাজার': 4000, 'পাঁচ হাজার': 5000,
  'ছয় হাজার': 6000, 'সাত হাজার': 7000, 'আট হাজার': 8000, 'নয় হাজার': 9000,
  'দশ হাজার': 10000, 'বিশ হাজার': 20000, 'পঞ্চাশ হাজার': 50000,
  'এক লাখ': 100000, 'এক লক্ষ': 100000, 'দুই লাখ': 200000, 'পাঁচ লাখ': 500000,
};

/**
 * Parses spoken numeric values from Bengali or English speech.
 * Example inputs: "পাঁচশত টাকা", "দেড় হাজার", "500", "১,২০০", "বিশ হাজার টাকা", "45.5"
 */
export const parseSpokenNumber = (text: string): number | null => {
  if (!text) return null;
  const raw = text.trim().toLowerCase();
  const normalized = normalizeBengaliDigits(raw);

  // 1. Check direct word phrases in priority order (longer phrases first)
  const sortedKeys = Object.keys(WORD_TO_NUMBER).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (normalized.includes(key) || raw.includes(key)) {
      let baseVal = WORD_TO_NUMBER[key];
      // Check if preceded by a digit e.g. "5 হাজার" -> 5000
      const prefixMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:হাজার|hajar|thousand|k)/i);
      if (prefixMatch) {
        const num = parseFloat(prefixMatch[1]);
        if (!isNaN(num)) return num * 1000;
      }
      const prefixLakhMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:লাখ|লক্ষ|lakh|lac)/i);
      if (prefixLakhMatch) {
        const num = parseFloat(prefixLakhMatch[1]);
        if (!isNaN(num)) return num * 100000;
      }
      return baseVal;
    }
  }

  // 2. Check compound e.g. "1500 টাকা", "500 tk", "১০০০"
  const digitRegex = /(\d+(?:[.,]\d+)?)/;
  const match = normalized.replace(/,/g, '').match(digitRegex);
  if (match) {
    let val = parseFloat(match[1]);
    if (!isNaN(val)) {
      if (/হাজার|hajar|thousand|k\b/i.test(normalized) && val < 1000) {
        val *= 1000;
      } else if (/লাখ|লক্ষ|lakh|lac\b/i.test(normalized) && val < 1000) {
        val *= 100000;
      } else if (/কোটি|crore\b/i.test(normalized) && val < 1000) {
        val *= 10000000;
      }
      return val;
    }
  }

  return null;
};

/**
 * Extracts a clean mobile phone number from spoken voice.
 * Handles spoken words e.g. "জিরো ওয়ান সেভেন ওয়ান..." -> "0171..."
 */
export const parseSpokenPhone = (text: string): string => {
  if (!text) return '';
  let str = text.trim().toLowerCase();

  const digitWordMap: Record<string, string> = {
    'জিরো': '0', 'শূন্য': '0', 'zero': '0',
    'ওয়ান': '1', 'এক': '1', 'one': '1',
    'টু': '2', 'দুই': '2', 'two': '2',
    'থ্রি': '3', 'তিন': '3', 'three': '3',
    'ফোর': '4', 'চার': '4', 'four': '4',
    'ফাইভ': '5', 'পাঁচ': '5', 'five': '5',
    'সিক্স': '6', 'ছয়': '6', 'ছয়': '6', 'six': '6',
    'সেভেন': '7', 'সাত': '7', 'seven': '7',
    'এইট': '8', 'আট': '8', 'eight': '8',
    'নাইন': '9', 'নয়': '9', 'নয়': '9', 'nine': '9',
  };

  // Replace words
  for (const [w, d] of Object.entries(digitWordMap)) {
    str = str.split(w).join(d);
  }

  str = normalizeBengaliDigits(str);
  // Extract all contiguous or spaced digits
  const onlyDigits = str.replace(/[^\d+]/g, '');
  if (onlyDigits.length >= 10) {
    return onlyDigits;
  }
  return onlyDigits || text.trim();
};

/**
 * Extracts a clean email from spoken voice.
 * Handles "at the rate", "dot com", "এট দ্য রেট", "ডট কম"
 */
export const parseSpokenEmail = (text: string): string => {
  if (!text) return '';
  let s = text.trim().toLowerCase();
  s = s.replace(/(\bat\s+the\s+rate\b|\bat\b|এট\s*দ্য\s*রেট|এট)/gi, '@');
  s = s.replace(/(\bdot\s+com\b|ডট\s*কম)/gi, '.com');
  s = s.replace(/(\bdot\b|ডট)/gi, '.');
  s = s.replace(/\s+/g, '');
  return s;
};

/**
 * Cleans regular text input from spoken filler words.
 * Removes common speech filler phrases like "লিখুন", "টাইপ করো", "হচ্ছে", "আমি বলতেছি"
 */
export const cleanSpokenText = (text: string): string => {
  if (!text) return '';
  let cleaned = text.trim();

  // Strip common command wrappers
  cleaned = cleaned.replace(/^(লিখুন|লিখো|টাইপ করুন|টাইপ করো|বলো|লেখেন|বসাও)\s*[:,-]?\s*/gi, '');
  cleaned = cleaned.replace(/\s*(হিসেবে লিখুন|লিখুন|বসাও|টাইপ করো)$/gi, '');

  return cleaned.trim();
};
