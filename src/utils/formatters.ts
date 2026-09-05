export function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const str = typeof num === 'number' ? num.toLocaleString('en-IN') : num.toString();
  return str.replace(/\d/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

export function formatCurrency(amount: number, lang: 'bn' | 'en' = 'bn'): string {
  if (lang === 'bn') {
    return `৳ ${toBengaliNumber(amount)}`;
  }
  return `৳ ${amount.toLocaleString('en-IN')}`;
}

export function formatNumber(val: number, lang: 'bn' | 'en' = 'bn'): string {
  if (lang === 'bn') {
    return toBengaliNumber(val);
  }
  return val.toLocaleString();
}

export function formatRelativeDate(dateStr: string, lang: 'bn' | 'en' = 'bn'): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    return lang === 'bn' ? toBengaliNumber(formatted) : formatted;
  } catch {
    return dateStr;
  }
}
