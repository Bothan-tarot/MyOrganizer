import { createContext, ReactNode, useContext, useEffect, useMemo } from 'react';
import { rescheduleReminders, TaskReminder } from '@/services/notifications';
import { toKey, today } from '@/utils/dates';
import { useLists } from './ListsContext';
import {
  Birthday,
  BirthdaySettings,
  BinsConfig,
  CustodyConfig,
  DEFAULT_BINS,
  DEFAULT_BIRTHDAY_SETTINGS,
  DEFAULT_CUSTODY,
  DEFAULT_RACE_SETTINGS,
  normalizeRace,
  Race,
  RaceSettings,
  SEED_RACES,
} from './planner';
import { usePersistedState } from './usePersistedState';

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

type Setter<T> = (update: T | ((prev: T) => T)) => void;

type PlannerContextValue = {
  loaded: boolean;
  birthdays: Birthday[];
  saveBirthday: (b: Omit<Birthday, 'id'> & { id?: string }) => void;
  deleteBirthday: (id: string) => void;
  birthdaySettings: BirthdaySettings;
  setBirthdaySettings: Setter<BirthdaySettings>;
  custody: CustodyConfig;
  setCustody: Setter<CustodyConfig>;
  bins: BinsConfig;
  setBins: Setter<BinsConfig>;
  races: Race[];
  saveRace: (r: Omit<Race, 'id'> & { id?: string }) => void;
  deleteRace: (id: string) => void;
  raceSettings: RaceSettings;
  setRaceSettings: Setter<RaceSettings>;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const { lists } = useLists();
  const [birthdays, setBirthdays, l1] = usePersistedState<Birthday[]>('myorganizer:birthdays', []);
  const [birthdaySettings, setBirthdaySettings, l2] = usePersistedState(
    'myorganizer:birthdaySettings',
    DEFAULT_BIRTHDAY_SETTINGS,
  );
  const [custody, setCustody, l3] = usePersistedState('myorganizer:custody', DEFAULT_CUSTODY);
  const [bins, setBins, l4] = usePersistedState('myorganizer:bins', DEFAULT_BINS);
  const [races, setRaces, l5] = usePersistedState<Race[]>(
    'myorganizer:races',
    SEED_RACES,
    (stored) => stored.map(normalizeRace),
  );
  const [raceSettings, setRaceSettings, l6] = usePersistedState(
    'myorganizer:raceSettings',
    DEFAULT_RACE_SETTINGS,
  );
  const loaded = l1 && l2 && l3 && l4 && l5 && l6;

  // Serialized so that edits unrelated to due dates (notes, ticking undated items…) don't reschedule
  const tasksKey = useMemo(() => {
    const from = toKey(today());
    const tasks: TaskReminder[] = lists.flatMap((l) =>
      l.items
        .filter((i) => !i.done && i.dueDate && i.dueDate >= from)
        .map((i) => ({ text: i.text, dueDate: i.dueDate!, listName: `${l.emoji} ${l.name}` })),
    );
    return JSON.stringify(tasks);
  }, [lists]);

  // Debounced so that editing settings doesn't reschedule on every tap
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(
      () =>
        rescheduleReminders({
          birthdays,
          birthdaySettings,
          bins,
          tasks: JSON.parse(tasksKey),
        }),
      1000,
    );
    return () => clearTimeout(timer);
  }, [loaded, birthdays, birthdaySettings, bins, tasksKey]);

  const value = useMemo<PlannerContextValue>(
    () => ({
      loaded,
      birthdays,
      saveBirthday: (b) =>
        setBirthdays((prev) =>
          b.id
            ? prev.map((x) => (x.id === b.id ? { ...b, id: x.id } : x))
            : [...prev, { ...b, id: newId() }],
        ),
      deleteBirthday: (id) => setBirthdays((prev) => prev.filter((b) => b.id !== id)),
      birthdaySettings,
      setBirthdaySettings,
      custody,
      setCustody,
      bins,
      setBins,
      races,
      saveRace: (r) =>
        setRaces((prev) =>
          r.id
            ? prev.map((x) => (x.id === r.id ? { ...r, id: x.id } : x))
            : [...prev, { ...r, id: newId() }],
        ),
      deleteRace: (id) => setRaces((prev) => prev.filter((r) => r.id !== id)),
      raceSettings,
      setRaceSettings,
    }),
    [
      loaded,
      birthdays,
      setBirthdays,
      birthdaySettings,
      setBirthdaySettings,
      custody,
      setCustody,
      bins,
      setBins,
      races,
      setRaces,
      raceSettings,
      setRaceSettings,
    ],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used inside PlannerProvider');
  return ctx;
}
