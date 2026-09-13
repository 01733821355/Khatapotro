import type { TransactionType, PaymentMethod } from '../types';

export interface ParsedVoiceTransaction {
  type: TransactionType;
  title: string;
  amount: number | '';
  category: string;
  paymentMethod: PaymentMethod;
  rawText: string;
  confidence: number;
}

// Map Bengali digits to English
const BN_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export const normalizeBengaliNumbers = (text: string): string => {
  return text.replace(/[০-৯]/g, (d) => BN_DIGITS[d] || d);
};

// Bengali verbal numbers conversion
const parseVerbalNumbers = (text: string): number | null => {
  const norm = normalizeBengaliNumbers(text.toLowerCase());

  // Direct digits search like 500 or 1200 or 50.5
  const digitMatch = norm.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) {
    const val = parseFloat(digitMatch[1]);
    if (!isNaN(val) && val > 0) {
      // Check if followed by "হাজার" (e.g. "5 হাজার" -> 5000)
      if (/হাজার|hajar|thousand/i.test(text)) {
        if (val < 1000) return val * 1000;
      }
      // Check if followed by "লাখ" (e.g. "2 লাখ" -> 200000)
      if (/লাখ|lakh/i.test(text)) {
        if (val < 1000) return val * 100000;
      }
      return val;
    }
  }

  // Verbal words lookup
  const words = text.toLowerCase();
  if (words.includes('এক লাখ') || words.includes('১ লাখ')) return 100000;
  if (words.includes('দুই লাখ') || words.includes('২ লাখ')) return 200000;
  if (words.includes('পাঁচ হাজার') || words.includes('৫ হাজার')) return 5000;
  if (words.includes('দশ হাজার') || words.includes('১০ হাজার')) return 10000;
  if (words.includes('বিশ হাজার') || words.includes('২০ হাজার')) return 20000;
  if (words.includes('পঞ্চাশ হাজার') || words.includes('৫০ হাজার')) return 50000;
  if (words.includes('দেড় হাজার') || words.includes('দেড় হাজার')) return 1500;
  if (words.includes('আড়াই হাজার') || words.includes('আড়াই হাজার')) return 2500;
  if (words.includes('এক হাজার') || words.includes('১ হাজার')) return 1000;
  if (words.includes('দুই হাজার') || words.includes('২ হাজার')) return 2000;
  if (words.includes('তিন হাজার') || words.includes('৩ হাজার')) return 3000;
  if (words.includes('চার হাজার') || words.includes('৪ হাজার')) return 4000;
  if (words.includes('একশত') || words.includes('একশো')) return 100;
  if (words.includes('দুইশত') || words.includes('দুইশো')) return 200;
  if (words.includes('তিনশত') || words.includes('তিনশো')) return 300;
  if (words.includes('চারশত') || words.includes('চারশো')) return 400;
  if (words.includes('পাঁচশত') || words.includes('পাঁচশো')) return 500;
  if (words.includes('দেড়শত') || words.includes('দেড়শো')) return 150;
  if (words.includes('আড়াইশত') || words.includes('আড়াইশো')) return 250;
  if (words.includes('হাজার')) return 1000;

  return null;
};

export const parseVoiceTransaction = (spokenText: string): ParsedVoiceTransaction => {
  const raw = spokenText.trim();
  const lower = raw.toLowerCase();

  // 1. Determine Type: Income vs Expense
  const incomeKeywords = [
    'জমা', 'আয়', 'বেতন', 'ইনকাম', 'পেলাম', 'পেয়েছি', 'লাভ', 'বিক্রি', 'সেল',
    'ক্যাশব্যাক', 'বোনাস', 'ধার ফেরত', 'টাকা পেয়েছি', 'income', 'salary', 'received'
  ];
  const expenseKeywords = [
    'খরচ', 'কিনলাম', 'দিলাম', 'বাজার', 'বিল', 'ভাড়া', 'নাস্তা', 'খাবার',
    'পেমেন্ট', 'শোধ', 'কিনছি', 'দিয়েছি', 'expense', 'spent', 'paid', 'buy'
  ];

  let type: TransactionType = 'expense';
  let hasIncomeClue = incomeKeywords.some((k) => lower.includes(k));
  let hasExpenseClue = expenseKeywords.some((k) => lower.includes(k));

  if (hasIncomeClue && !hasExpenseClue) {
    type = 'income';
  } else if (hasExpenseClue) {
    type = 'expense';
  }

  // 2. Parse Amount
  const parsedAmount = parseVerbalNumbers(raw) || '';

  // 3. Detect Category
  let category = type === 'income' ? 'অন্যান্য জমা' : 'অন্যান্য খরচ';

  if (type === 'income') {
    if (/বেতন|স্যালারি|salary/i.test(lower)) {
      category = 'বেতন';
    } else if (/ব্যবসা|বিক্রি|দোকান|order|sales/i.test(lower)) {
      category = 'ব্যবসা';
    } else if (/পণ্য|মাল বিক্রি/i.test(lower)) {
      category = 'পণ্য বিক্রয়';
    } else if (/ধার ফেরত|হাওলাত ফেরত/i.test(lower)) {
      category = 'ধার ফেরত';
    } else if (/ঋণ|লোন/i.test(lower)) {
      category = 'ঋণ গ্রহণ';
    } else if (/ক্যাশব্যাক|cashback/i.test(lower)) {
      category = 'ক্রেডিট কার্ড ক্যাশব্যাক';
    }
  } else {
    // Expense
    if (/খাবার|ভাত|হোটেল|রেস্টুরেন্ট|চা|নাস্তা|বিরিয়ানি|বার্গার|লাঞ্চ|ডিনার|food|lunch|dinner/i.test(lower)) {
      category = 'খাবার';
    } else if (/বাজার|কাঁচাবাজার|চাল|ডাল|তেল|মাছ|মাংস|সবজি|মুদি|bazar|grocery/i.test(lower)) {
      category = 'বাজার';
    } else if (/বিল|বিদ্যুৎ|কারেন্ট|গ্যাস|পানি|ইন্টারনেট|ওয়াইফাই|রিচার্জ|bill|electric|wifi/i.test(lower)) {
      category = 'বিল';
    } else if (/যাতায়াত|রিকশা|উবার|পাঠাও|বাস|সিএনজি|অকটেন|পেট্রোল|গাড়ি|ভাড়া|travel|rent/i.test(lower)) {
      if (/দোকান ভাড়া|বাসা ভাড়া/i.test(lower)) {
        category = 'দোকান ভাড়া';
      } else {
        category = 'যাতায়াত';
      }
    } else if (/দোকান ভাড়া|দোকানের ভাড়া/i.test(lower)) {
      category = 'দোকান ভাড়া';
    } else if (/বেতন|salary/i.test(lower)) {
      category = 'বেতন';
    } else if (/ধার দিলাম|হাওলাত/i.test(lower)) {
      category = 'ধার প্রদান';
    } else if (/ঋণ পরিশোধ|কিস্তি|লোন শোধ/i.test(lower)) {
      category = 'ঋণ পরিশোধ';
    }
  }

  // 4. Detect Payment Method
  let paymentMethod: PaymentMethod = 'Cash';
  if (/বিকাশ|bkash/i.test(lower)) {
    paymentMethod = 'bKash';
  } else if (/নগদ(?!\s*টাকা)|nagad/i.test(lower)) {
    paymentMethod = 'Nagad';
  } else if (/রকেট|rocket/i.test(lower)) {
    paymentMethod = 'Rocket';
  } else if (/ব্যাংক|bank|ট্রান্সফার|transfer/i.test(lower)) {
    paymentMethod = 'Bank Transfer';
  } else if (/কার্ড|card|ক্রেডিট|debit/i.test(lower)) {
    paymentMethod = 'Credit Card';
  } else if (/ক্যাশ|নগদ টাকা|cash/i.test(lower)) {
    paymentMethod = 'Cash';
  }

  // 5. Clean Title / Description
  // Remove boilerplate words like "টাকা", "টাকার", "আজকে", "খরচ", "জমা", "বিকাশ", "ক্যাশ"
  let cleanTitle = raw
    .replace(/[০-৯\d]+(\.\d+)?/g, '') // remove numbers
    .replace(/টাকা|টাকার|tk|taka/gi, '')
    .replace(/হাজার|লাখ|শত|শো/gi, '')
    .replace(/আজকে|আজকের|গতকাল|এখন/gi, '')
    .replace(/খরচ|জমা|কিনলাম|দিলাম|পেলাম|দিয়েছি|পেয়েছি|করলাম/gi, '')
    .replace(/বিকাশে|বিকাশ|নগদে|নগদ|রকেটে|রকেট|ক্যাশে|ক্যাশ|ব্যাংকে|ব্যাংক/gi, '')
    .replace(/হিসাবে|হিসাব|এন্ট্রি/gi, '')
    .trim();

  // If after stripping, cleanTitle is empty or very short, fallback to category name
  if (!cleanTitle || cleanTitle.length < 2) {
    cleanTitle = category;
  }

  return {
    type,
    title: cleanTitle,
    amount: parsedAmount,
    category,
    paymentMethod,
    rawText: raw,
    confidence: parsedAmount ? 0.9 : 0.6,
  };
};
