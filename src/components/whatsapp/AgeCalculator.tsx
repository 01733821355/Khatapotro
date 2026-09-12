import React, { useState, useEffect } from 'react';

interface Props {
  lang: 'bn' | 'en';
  mode?: 'light' | 'dark';
}

export const AgeCalculator: React.FC<Props> = ({ lang, mode }) => {
  const [dob, setDob] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [age, setAge] = useState<{ years: number; months: number; days: number } | null>(null);

  const calculateAge = () => {
    if (!dob) return;

    const d1 = new Date(dob);
    const d2 = new Date(targetDate);

    let years = d2.getFullYear() - d1.getFullYear();
    let months = d2.getMonth() - d1.getMonth();
    let days = d2.getDate() - d1.getDate();

    if (days < 0) {
      months -= 1;
      const lastMonth = new Date(d2.getFullYear(), d2.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    setAge({ years, months, days });
  };

  useEffect(() => {
    if (dob) calculateAge();
  }, [dob, targetDate]);

  const isDark = mode === 'dark';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className={`rounded-3xl p-6 sm:p-8 shadow-xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200/80 backdrop-blur-md'}`}>
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          {lang === 'bn' ? 'বয়স ক্যালকুলেটর' : 'Age Calculator'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold opacity-70">
              {lang === 'bn' ? 'জন্ম তারিখ নির্বাচন করুন' : 'Select Date of Birth'}
            </label>
            <input 
              type="date" 
              value={dob}
              onChange={e => setDob(e.target.value)}
              className={`w-full rounded-2xl p-3.5 sm:p-4 focus:ring-2 focus:ring-indigo-400 text-base sm:text-lg border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold opacity-70">
              {lang === 'bn' ? 'আজকের তারিখ (অথবা লক্ষ্য)' : 'Age at the Date of'}
            </label>
            <input 
              type="date" 
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className={`w-full rounded-2xl p-3.5 sm:p-4 focus:ring-2 focus:ring-indigo-400 text-base sm:text-lg border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
          </div>
        </div>

        {age && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className={`p-4 sm:p-6 rounded-3xl border ${isDark ? 'bg-slate-900/80 border-indigo-900/40' : 'bg-indigo-50/70 border-indigo-100'}`}>
              <div className="text-3xl sm:text-4xl font-black text-indigo-600">{age.years}</div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-2 opacity-70">
                {lang === 'bn' ? 'বছর' : 'Years'}
              </div>
            </div>
            <div className={`p-4 sm:p-6 rounded-3xl border ${isDark ? 'bg-slate-900/80 border-purple-900/40' : 'bg-purple-50/70 border-purple-100'}`}>
              <div className="text-3xl sm:text-4xl font-black text-purple-600">{age.months}</div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-2 opacity-70">
                {lang === 'bn' ? 'মাস' : 'Months'}
              </div>
            </div>
            <div className={`p-4 sm:p-6 rounded-3xl border ${isDark ? 'bg-slate-900/80 border-pink-900/40' : 'bg-pink-50/70 border-pink-100'}`}>
              <div className="text-3xl sm:text-4xl font-black text-pink-600">{age.days}</div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-2 opacity-70">
                {lang === 'bn' ? 'দিন' : 'Days'}
              </div>
            </div>
          </div>
        )}

        {!age && (
          <div className="text-center py-12 text-slate-400">
            <i className="fas fa-baby-carriage text-5xl mb-4 block opacity-20"></i>
            {lang === 'bn' ? 'গণনা শুরু করতে তারিখ নির্বাচন করুন' : 'Select a date to calculate your age'}
          </div>
        )}
      </div>

      <div className={`p-5 rounded-3xl text-xs sm:text-sm text-slate-500 text-center border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white/70 border-slate-200/80'}`}>
        {lang === 'bn' ? 
          'সহজে বছর ও মাস নির্বাচনে উপরে ক্যালেন্ডার আইকনটি ব্যবহার করুন।' : 
          'Use the calendar icon to jump through years and months easily.'}
      </div>
    </div>
  );
};

export default AgeCalculator;
