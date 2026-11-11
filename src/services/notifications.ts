import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import {
  ageOn,
  BIN_INFO,
  Birthday,
  birthdayInYear,
  BirthdaySettings,
  BinsConfig,
  nextBinDays,
} from '@/store/planner';
import { addDays, fromKey, today } from '@/utils/dates';

const CHANNEL_ID = 'reminders';
// Bins alternate colors, so each reminder is scheduled as a one-off date
const BIN_WEEKS_AHEAD = 26;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensurePermission() {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Rappels',
    importance: AndroidImportance.HIGH,
  });
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

type Reminder = { date: Date; title: string; body: string };

const at = (day: Date, hour: number, minute: number) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);

function birthdayReminders(birthdays: Birthday[], s: BirthdaySettings): Reminder[] {
  if (!s.enabled) return [];
  const year = today().getFullYear();
  // This year and the next two, so reminders keep coming even if the app isn't opened for a while
  return birthdays.flatMap((b) =>
    [year, year + 1, year + 2].flatMap((y) => {
      const day = birthdayInYear(b, y);
      const age = ageOn(b, day);
      const reminders: Reminder[] = [
        {
          date: at(day, s.hour, s.minute),
          title: `🎂 Anniversaire de ${b.name}`,
          body: age
            ? `${b.name} fête ses ${age} ans aujourd’hui !`
            : `C’est l’anniversaire de ${b.name} aujourd’hui !`,
        },
      ];
      if (s.dayBefore) {
        reminders.push({
          date: at(addDays(day, -1), s.hour, s.minute),
          title: `🎁 Demain : anniversaire de ${b.name}`,
          body: age ? `${b.name} fêtera ses ${age} ans demain.` : 'Pensez au cadeau !',
        });
      }
      return reminders;
    }),
  );
}

function binReminders(c: BinsConfig): Reminder[] {
  if (!c.remindersEnabled) return [];
  return nextBinDays(c, BIN_WEEKS_AHEAD).map(({ date, color }) => ({
    date: at(date, c.hour, c.minute),
    title: `🗑️ Poubelle ${BIN_INFO[color].label} ${BIN_INFO[color].emoji}`,
    body: `C’est le tour de la poubelle ${BIN_INFO[color].label} cette semaine.`,
  }));
}

export type TaskReminder = { text: string; dueDate: string; listName: string };

const TASK_HOUR = 9;

const taskReminders = (tasks: TaskReminder[]): Reminder[] =>
  tasks.map((t) => ({
    date: at(fromKey(t.dueDate), TASK_HOUR, 0),
    title: `📌 À faire aujourd’hui : ${t.text}`,
    body: t.listName,
  }));

export type ReminderData = {
  birthdays: Birthday[];
  birthdaySettings: BirthdaySettings;
  bins: BinsConfig;
  tasks: TaskReminder[];
};

async function reschedule(data: ReminderData) {
  if (!(await ensurePermission())) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  const reminders = [
    ...birthdayReminders(data.birthdays, data.birthdaySettings),
    ...binReminders(data.bins),
    ...taskReminders(data.tasks),
  ].filter((r) => r.date.getTime() > now);

  for (const r of reminders) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: r.date,
        channelId: CHANNEL_ID,
      },
    });
  }
}

// Calls are chained so that two quick changes never interleave cancel/schedule
let queue = Promise.resolve();

export function rescheduleReminders(data: ReminderData) {
  queue = queue.then(() => reschedule(data)).catch(() => {});
  return queue;
}
