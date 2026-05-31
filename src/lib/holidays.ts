// US holiday calendar — used for auto-displayed promo banners
// Banners auto-show 30 days before each holiday and hide once it passes.

export type Holiday = {
  key: string;
  name: string;
  emoji: string;
  // Returns the Date instance for this year (or next year if already past)
  dateFor: (year: number) => Date;
  // Marketing headline
  headline: string;
  // Promo code to advertise
  code: string;
  // Tailwind gradient classes for banner background
  gradient: string;
};

const fixed = (m: number, d: number) => (y: number) => new Date(y, m - 1, d);

// Nth weekday of month (e.g., 3rd Monday in January = MLK Day)
function nthWeekday(month: number, weekday: number, n: number) {
  return (y: number) => {
    const first = new Date(y, month - 1, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(y, month - 1, 1 + offset + (n - 1) * 7);
  };
}

// Last weekday of month (e.g., last Monday in May = Memorial Day)
function lastWeekday(month: number, weekday: number) {
  return (y: number) => {
    const last = new Date(y, month, 0); // last day of month
    const offset = (last.getDay() - weekday + 7) % 7;
    return new Date(y, month - 1, last.getDate() - offset);
  };
}

export const HOLIDAYS: Holiday[] = [
  { key: "new-year", name: "New Year", emoji: "🎆", dateFor: fixed(1, 1), headline: "New year, new memory.", code: "NEWYEAR30", gradient: "from-indigo-500 to-purple-600" },
  { key: "valentines", name: "Valentine's Day", emoji: "💝", dateFor: fixed(2, 14), headline: "Never forget the people you love.", code: "LOVE25", gradient: "from-rose-500 to-pink-600" },
  { key: "st-patricks", name: "St. Patrick's Day", emoji: "🍀", dateFor: fixed(3, 17), headline: "Lucky reminders, every step of the way.", code: "LUCKY20", gradient: "from-emerald-500 to-green-600" },
  { key: "mothers-day", name: "Mother's Day", emoji: "🌷", dateFor: nthWeekday(5, 0, 2), headline: "Remember to call mom — automatically.", code: "MOM30", gradient: "from-pink-500 to-rose-600" },
  { key: "memorial-day", name: "Memorial Day", emoji: "🇺🇸", dateFor: lastWeekday(5, 1), headline: "Honor what matters. Remember every day.", code: "HONOR25", gradient: "from-blue-600 to-red-600" },
  { key: "fathers-day", name: "Father's Day", emoji: "👔", dateFor: nthWeekday(6, 0, 3), headline: "Reminders that make dad proud.", code: "DAD30", gradient: "from-sky-600 to-indigo-600" },
  { key: "july-4", name: "Independence Day", emoji: "🎇", dateFor: fixed(7, 4), headline: "Freedom from forgetting.", code: "FREEDOM50", gradient: "from-blue-600 via-white to-red-600" },
  { key: "labor-day", name: "Labor Day", emoji: "🔧", dateFor: nthWeekday(9, 1, 1), headline: "Work less. Remember more.", code: "LABOR25", gradient: "from-amber-600 to-orange-600" },
  { key: "halloween", name: "Halloween", emoji: "🎃", dateFor: fixed(10, 31), headline: "Don't let your to-do list haunt you.", code: "SPOOKY30", gradient: "from-orange-600 to-purple-700" },
  { key: "veterans-day", name: "Veterans Day", emoji: "🎖️", dateFor: fixed(11, 11), headline: "Thank you to those who serve.", code: "VETERAN20", gradient: "from-blue-800 to-red-700" },
  { key: "thanksgiving", name: "Thanksgiving", emoji: "🦃", dateFor: nthWeekday(11, 4, 4), headline: "So much to remember to be grateful for.", code: "THANKS30", gradient: "from-amber-600 to-red-700" },
  { key: "black-friday", name: "Black Friday", emoji: "🛍️", dateFor: (y) => { const t = nthWeekday(11, 4, 4)(y); return new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1); }, headline: "Biggest sale of the year. 50% off Pro.", code: "BF50", gradient: "from-zinc-900 to-zinc-700" },
  { key: "christmas", name: "Christmas", emoji: "🎄", dateFor: fixed(12, 25), headline: "Give the gift of a better memory.", code: "MERRY40", gradient: "from-emerald-700 to-red-700" },
];

export type ActiveHoliday = Holiday & { date: Date; daysAway: number };

// Returns the next active promo (within the next 30 days, or in the past 1 day) or null.
export function getActiveHoliday(now: Date = new Date()): ActiveHoliday | null {
  const year = now.getFullYear();
  const candidates: ActiveHoliday[] = [];
  for (const h of HOLIDAYS) {
    for (const y of [year, year + 1]) {
      const date = h.dateFor(y);
      const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days >= -1 && days <= 30) {
        candidates.push({ ...h, date, daysAway: days });
      }
    }
  }
  candidates.sort((a, b) => a.daysAway - b.daysAway);
  return candidates[0] ?? null;
}
