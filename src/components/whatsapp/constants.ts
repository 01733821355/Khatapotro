import { AppState } from './types';

export const STORAGE_KEY = 'wa_checklist_plus_v3';

export const DEFAULT_STATE: AppState = {
  presets: [
    {
      nameBn: 'অর্ডার কনফার্মেশন',
      nameEn: 'Order Confirmation',
      itemsBn: ['প্রোডাক্ট নাম ও পরিমাণ', 'ডেলিভারি ঠিকানা নিশ্চিত', 'মোট ক্যাশ অন ডেলিভারি টাকা', 'ডেলিভারি সময়সীমা জানানো হয়েছে'],
      itemsEn: ['Product name & quantity confirmed', 'Delivery address verified', 'Total COD amount confirmed', 'Estimated delivery timeframe shared']
    },
    {
      nameBn: 'ডেলিভারি আপডেট',
      nameEn: 'Delivery Update',
      itemsBn: ['পার্সেল কুরিয়ারে হস্তান্তর সম্পন্ন', 'ট্র্যাকিং কোড পাঠানো হয়েছে', 'রাইডারের সাথে যোগাযোগের নম্বর', 'ক্যাশ প্রস্তুত রাখতে বলা হয়েছে'],
      itemsEn: ['Parcel handed to courier', 'Tracking code provided', 'Rider contact information', 'Cash ready reminder']
    },
    {
      nameBn: 'পেমেন্ট রসিদ',
      nameEn: 'Payment Receipt',
      itemsBn: ['পেমেন্ট মেথড (বিকাশ/নগদ/ব্যাংক)', 'ট্রানজেকশন আইডি নিশ্চিত', 'পরিশোধিত টাকার পরিমাণ', 'বকেয়া হিসাব জানানো হয়েছে'],
      itemsEn: ['Payment method (Bkash/Nagad/Bank)', 'Transaction ID verified', 'Amount paid confirmed', 'Remaining balance updated']
    }
  ],
  numbers: [],
  history: [],
  settings: {
    fontPercent: 100,
    fontFamily: 'Poppins, sans-serif',
    lang: 'bn',
    mode: 'light',
    headerBn: '*_____*',
    footerBn: 'বার্তার তারিখ ও সময়:\n\n*ধন্যবাদ, আপনার দিন শুভ হোক!*',
    headerEn: '*_____*',
    footerEn: 'Date & Time of message:\n\n*Thank you, have a great day!*',
    preferredApp: 'ask'
  }
};
