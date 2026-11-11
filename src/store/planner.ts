import {
  addDays,
  type DateKey,
  daysBetween,
  fromKey,
  isEvenWeek,
  toKey,
  today,
  weekdayIndex,
} from '@/utils/dates';

// ---------- Birthdays ----------

export type Birthday = {
  id: string;
  name: string;
  day: number;
  month: number; // 1-12
  year?: number;
};

export type BirthdaySettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  dayBefore: boolean;
};

export const DEFAULT_BIRTHDAY_SETTINGS: BirthdaySettings = {
  enabled: true,
  hour: 9,
  minute: 0,
  dayBefore: true,
};

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

// Feb 29 birthdays are celebrated on Feb 28 in non-leap years
export const birthdayInYear = (b: Birthday, year: number) =>
  new Date(year, b.month - 1, b.month === 2 && b.day === 29 && !isLeap(year) ? 28 : b.day);

export function nextBirthday(b: Birthday, from = today()) {
  const thisYear = birthdayInYear(b, from.getFullYear());
  return thisYear >= from ? thisYear : birthdayInYear(b, from.getFullYear() + 1);
}

export const ageOn = (b: Birthday, date: Date) =>
  b.year ? date.getFullYear() - b.year : undefined;

export const birthdaysOn = (birthdays: Birthday[], date: Date) =>
  birthdays.filter((b) => birthdayInYear(b, date.getFullYear()).getTime() === date.getTime());

export const sortByNext = (birthdays: Birthday[]) =>
  [...birthdays]
    .map((b) => ({ birthday: b, date: nextBirthday(b) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

// ---------- Shared custody ----------

export type Parent = 'A' | 'B';

export type CustodyConfig = {
  childName: string;
  parentA: string;
  parentB: string;
  // The parent living in our household: the child is "with us" on their days
  homeParent: Parent;
  // Index 0 = Monday … 6 = Sunday
  even: Parent[];
  odd: Parent[];
  // Manual exceptions (holidays, swaps…)
  overrides: Record<DateKey, Parent>;
};

export const DEFAULT_CUSTODY: CustodyConfig = {
  childName: 'Alicia',
  parentA: 'Papa',
  parentB: 'Maman',
  homeParent: 'B',
  even: ['B', 'B', 'B', 'B', 'B', 'A', 'A'], // weekend at dad's
  odd: ['B', 'B', 'A', 'B', 'B', 'B', 'B'], // Wednesday at dad's
  overrides: {},
};

export const PARENT_COLORS: Record<Parent, string> = { A: '#2563EB', B: '#F59E0B' };

export const defaultParentOn = (c: CustodyConfig, date: Date): Parent =>
  (isEvenWeek(date) ? c.even : c.odd)[weekdayIndex(date)];

export function custodyOn(c: CustodyConfig, date: Date) {
  const override = c.overrides[toKey(date)];
  return { parent: override ?? defaultParentOn(c, date), overridden: override !== undefined };
}

export const parentName = (c: CustodyConfig, p: Parent) => (p === 'A' ? c.parentA : c.parentB);

export function childWithUs(c: CustodyConfig, date: Date) {
  const { parent, overridden } = custodyOn(c, date);
  return { withUs: parent === c.homeParent, overridden };
}

// ---------- Races ----------

export type Runner = 'a' | 'b';

export type Race = {
  id: string;
  date: DateKey;
  name: string;
  distance: string; // free text: "21", "13+17", "S", "M"…
  runners: Runner[];
  dateToConfirm: boolean;
  note?: string;
};

// Races saved before "date à confirmer" replaced the former "inscription faite" flag
type StoredRace = Omit<Race, 'dateToConfirm'> & { dateToConfirm?: boolean; registered?: boolean };

export function normalizeRace({ registered, ...race }: StoredRace): Race {
  if (race.dateToConfirm !== undefined) return race as Race;
  // Only imported rows used `registered: false` to mean the yellow "date à confirmer"
  return { ...race, dateToConfirm: race.id.startsWith('seed-') && registered === false };
}

export type RaceSettings = { runnerA: string; runnerB: string };

export const DEFAULT_RACE_SETTINGS: RaceSettings = { runnerA: 'Amandine', runnerB: 'Thibault' };

export const RUNNER_COLORS: Record<Runner, string> = { a: '#9333EA', b: '#0D9488' };

export const runnerName = (s: RaceSettings, r: Runner) => (r === 'a' ? s.runnerA : s.runnerB);

// Imported from the shared spreadsheet; rows highlighted in yellow were "date à confirmer"
const seed = (
  date: DateKey,
  name: string,
  distance: string,
  runners: Runner[],
  dateToConfirm = false,
  note?: string,
): Race => ({ id: `seed-${date}`, date, name, distance, runners, dateToConfirm, note });

export const SEED_RACES: Race[] = [
  seed('2026-09-11', '400 du Pian', '14', ['b']),
  seed('2026-10-04', 'La Saucataise', '11', ['a']),
  seed('2026-10-11', 'Triathlon Vieux Boucau', 'S', ['a']),
  seed('2026-10-18', 'La course Royale de Versailles', '15', ['a', 'b']),
  seed('2026-11-08', 'Semi-marathon de Bordeaux', '21', ['a']),
  seed('2026-11-15', 'Maratrail Pays de Brive', '42', ['b']),
  seed('2026-12-05', 'SoliTrail', '10', ['a']),
  seed('2027-01-16', 'Trail du Ciron', '13+17', ['b']),
  seed('2027-02-15', 'Trail des Valentins', '', ['a'], true),
  seed('2027-02-21', 'Barjottrail', '30', ['b']),
  seed('2027-03-07', 'Semi-marathon de Bazas-Langon', '21', ['a', 'b'], true),
  seed('2027-03-13', 'Trail de Costalat', '42', ['b']),
  seed('2027-03-21', 'Trail des Galopins (Soulac)', '', ['a']),
  seed('2027-04-04', 'Trail des salamandres', '', ['a']),
  seed('2027-05-06', 'Triathlon Frenchman', 'M', ['a', 'b'], false, 'Échange de garde à faire'),
  seed('2027-05-15', 'Cavale', '', ['a'], true),
  seed('2027-06-01', 'Montan’Aspe 45', '45', ['b']),
  seed('2027-06-20', 'Patou Trail 20', '20', ['a'], true),
];

// ---------- Bins ----------

export type BinColor = 'yellow' | 'black';

export type BinsConfig = {
  // A known "sortie" day and the bin that went out that day; colors alternate weekly from it
  refDate: DateKey;
  refColor: BinColor;
  weekday: number; // 0 = Monday … 6 = Sunday
  hour: number;
  minute: number;
  remindersEnabled: boolean;
};

export const DEFAULT_BINS: BinsConfig = {
  refDate: '2026-11-01',
  refColor: 'black',
  weekday: 6,
  hour: 16,
  minute: 0,
  remindersEnabled: true,
};

export const BIN_INFO: Record<
  BinColor,
  { label: string; emoji: string; color: string; textColor: string }
> = {
  yellow: { label: 'jaune', emoji: '🟡', color: '#FACC15', textColor: '#422006' },
  black: { label: 'noire', emoji: '⚫', color: '#1E293B', textColor: '#FFFFFF' },
};

export function binColorOn(c: BinsConfig, date: Date): BinColor {
  const weeks = Math.floor(daysBetween(fromKey(c.refDate), date) / 7);
  const sameAsRef = ((weeks % 2) + 2) % 2 === 0;
  return sameAsRef ? c.refColor : c.refColor === 'black' ? 'yellow' : 'black';
}

export function nextBinDays(c: BinsConfig, count: number, from = today()) {
  const first = addDays(from, (c.weekday - weekdayIndex(from) + 7) % 7);
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(first, i * 7);
    return { date, color: binColorOn(c, date) };
  });
}
