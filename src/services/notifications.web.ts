import type { ReminderData } from './notifications';

export type { ReminderData, TaskReminder } from './notifications';

// Scheduled local notifications don't exist on the web; real reminders will need Web Push
// (a server sending them at the right time). Until then, this is a no-op.
export function rescheduleReminders(_data: ReminderData) {
  return Promise.resolve();
}
