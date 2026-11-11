import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  addDays,
  capitalize,
  DAY_LETTERS,
  isoWeek,
  MONTH_NAMES,
  today,
  weekdayIndex,
} from '@/utils/dates';

export type DayDecoration = {
  backgroundColor?: string;
  textColor?: string;
  // Small text/emoji shown under the day number
  marker?: string;
};

type Props = {
  month: Date; // any day in the displayed month
  onChangeMonth: (month: Date) => void;
  decorate?: (date: Date) => DayDecoration | undefined;
  onDayPress?: (date: Date) => void;
  onDayLongPress?: (date: Date) => void;
  accentColor?: string;
};

export const EVEN_COLOR = '#0891B2';
export const ODD_COLOR = '#7C3AED';

export function MonthCalendar({
  month,
  onChangeMonth,
  decorate,
  onDayPress,
  onDayLongPress,
  accentColor = '#4F46E5',
}: Props) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = addDays(first, -weekdayIndex(first));
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const weekCount = Math.ceil((weekdayIndex(first) + daysInMonth) / 7);
  const todayTime = today().getTime();

  const shiftMonth = (delta: number) =>
    onChangeMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable onPress={() => shiftMonth(-1)} hitSlop={12} style={styles.arrow}>
          <Text style={[styles.arrowText, { color: accentColor }]}>‹</Text>
        </Pressable>
        <Pressable onPress={() => onChangeMonth(today())}>
          <Text style={styles.title}>
            {capitalize(MONTH_NAMES[month.getMonth()])} {month.getFullYear()}
          </Text>
        </Pressable>
        <Pressable onPress={() => shiftMonth(1)} hitSlop={12} style={styles.arrow}>
          <Text style={[styles.arrowText, { color: accentColor }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Text style={[styles.weekCol, styles.headLabel]}>Sem.</Text>
        {DAY_LETTERS.map((l, i) => (
          <Text key={i} style={[styles.cell, styles.headLabel]}>
            {l}
          </Text>
        ))}
      </View>

      {Array.from({ length: weekCount }, (_, w) => {
        const monday = addDays(gridStart, w * 7);
        const week = isoWeek(monday);
        const even = week % 2 === 0;
        return (
          <View key={w} style={styles.row}>
            <View style={styles.weekCol}>
              <Text style={[styles.weekNumber, { color: even ? EVEN_COLOR : ODD_COLOR }]}>
                {week}
              </Text>
              <Text style={[styles.weekParity, { color: even ? EVEN_COLOR : ODD_COLOR }]}>
                {even ? 'paire' : 'impaire'}
              </Text>
            </View>
            {Array.from({ length: 7 }, (_, d) => {
              const date = addDays(monday, d);
              const inMonth = date.getMonth() === month.getMonth();
              const deco = decorate?.(date);
              const isToday = date.getTime() === todayTime;
              return (
                <Pressable
                  key={d}
                  style={styles.cell}
                  onPress={onDayPress && (() => onDayPress(date))}
                  onLongPress={onDayLongPress && (() => onDayLongPress(date))}
                >
                  <View
                    style={[
                      styles.day,
                      deco?.backgroundColor && { backgroundColor: deco.backgroundColor },
                      isToday && { borderColor: accentColor, borderWidth: 2 },
                      !inMonth && { opacity: 0.35 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        deco?.textColor && { color: deco.textColor },
                        isToday && { fontWeight: '800' },
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {deco?.marker && <Text style={styles.marker}>{deco.marker}</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  arrow: { paddingHorizontal: 12 },
  arrowText: { fontSize: 30, lineHeight: 32 },
  title: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  row: { flexDirection: 'row', alignItems: 'center' },
  headLabel: { textAlign: 'center', color: '#64748B', fontWeight: '600', fontSize: 12 },
  weekCol: { width: 40, alignItems: 'center' },
  weekNumber: { fontSize: 13, fontWeight: '700' },
  weekParity: { fontSize: 8 },
  cell: { flex: 1, aspectRatio: 1, padding: 2 },
  day: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayText: { fontSize: 14, color: '#0F172A' },
  marker: { fontSize: 9, lineHeight: 11 },
});
