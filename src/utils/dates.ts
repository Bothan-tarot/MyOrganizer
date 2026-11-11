// Local calendar dates are stored as 'YYYY-MM-DD' strings to avoid timezone surprises
export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export const toKey = (d: Date): DateKey =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromKey = (key: DateKey) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const today = () => startOfDay(new Date());
export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Rounded so that daylight saving changes (23h/25h days) don't break the count
export const daysBetween = (from: Date, to: Date) =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);

// 0 = Monday … 6 = Sunday
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

// ISO 8601 week number (the one used for "semaine paire / impaire")
export function isoWeek(d: Date) {
  const thursday = addDays(d, 3 - weekdayIndex(d));
  const jan4 = new Date(thursday.getFullYear(), 0, 4);
  return 1 + Math.round((daysBetween(jan4, thursday) - 3 + weekdayIndex(jan4)) / 7);
}

export const isEvenWeek = (d: Date) => isoWeek(d) % 2 === 0;

export const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
export const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const MONTH_NAMES = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const MONTH_SHORT = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// "lundi 2 novembre"
export const formatLong = (d: Date) =>
  `${DAY_NAMES[weekdayIndex(d)]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;

// "lun. 2 nov." (+ year when not the current one)
export const formatShort = (d: Date) => {
  const year = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${DAY_NAMES[weekdayIndex(d)].slice(0, 3)}. ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}${year}`;
};

export const formatTime = (hour: number, minute: number) => `${hour}h${pad(minute)}`;

export function formatRelative(d: Date) {
  const diff = daysBetween(today(), d);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  return formatShort(d);
}

export const inDays = (n: number) =>
  n === 0 ? "aujourd'hui" : n === 1 ? 'demain' : `dans ${n} jours`;
