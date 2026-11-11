import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, SectionTitle, SettingRow, SwitchRow, ValueButton } from '@/components/ui';
import { BIN_INFO, nextBinDays } from '@/store/planner';
import { usePlanner } from '@/store/PlannerContext';
import {
  capitalize,
  DAY_LETTERS,
  DAY_NAMES,
  daysBetween,
  formatLong,
  formatTime,
  inDays,
  today,
} from '@/utils/dates';
import { pickDate } from '@/utils/pickDate';

const COLOR = '#059669';

export default function BinsScreen() {
  const { bins, setBins } = usePlanner();
  const insets = useSafeAreaInsets();

  const [next, ...later] = nextBinDays(bins, 9);
  const nextInfo = BIN_INFO[next.color];
  const days = daysBetween(today(), next.date);

  const chooseTime = async () => {
    const value = new Date();
    value.setHours(bins.hour, bins.minute);
    const picked = await pickDate(value, 'time');
    if (picked) setBins((b) => ({ ...b, hour: picked.getHours(), minute: picked.getMinutes() }));
  };

  const invert = () =>
    setBins((b) => ({ ...b, refColor: b.refColor === 'black' ? 'yellow' : 'black' }));

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '🗑️ Poubelles', headerTintColor: COLOR }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom, gap: 12 }}
      >
        <View style={[styles.hero, { backgroundColor: nextInfo.color }]}>
          <Text style={[styles.heroLabel, { color: nextInfo.textColor }]}>
            {days === 0 ? 'Ce soir' : capitalize(formatLong(next.date))} ({inDays(days)})
          </Text>
          <Text style={[styles.heroValue, { color: nextInfo.textColor }]}>
            {nextInfo.emoji} Poubelle {nextInfo.label}
          </Text>
        </View>

        <SectionTitle>Prochaines semaines</SectionTitle>
        <Card style={{ paddingVertical: 4 }}>
          {later.map(({ date, color }, i) => (
            <View key={date.getTime()} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Text style={styles.rowDate}>{capitalize(formatLong(date))}</Text>
              <Text style={styles.rowBin}>
                {BIN_INFO[color].emoji} {BIN_INFO[color].label}
              </Text>
            </View>
          ))}
        </Card>

        <SectionTitle>Réglages</SectionTitle>
        <Card style={{ paddingVertical: 8 }}>
          <Text style={styles.label}>Jour de sortie</Text>
          <View style={styles.days}>
            {DAY_LETTERS.map((l, i) => (
              <Pressable
                key={i}
                onPress={() => setBins((b) => ({ ...b, weekday: i }))}
                style={[styles.day, bins.weekday === i && { backgroundColor: COLOR }]}
              >
                <Text style={[styles.dayText, bins.weekday === i && { color: '#fff' }]}>{l}</Text>
              </Pressable>
            ))}
          </View>
          <SwitchRow
            label={`Rappel le ${DAY_NAMES[bins.weekday]}`}
            value={bins.remindersEnabled}
            onChange={(remindersEnabled) => setBins((b) => ({ ...b, remindersEnabled }))}
            color={COLOR}
          />
          {bins.remindersEnabled && (
            <SettingRow label="Heure du rappel">
              <ValueButton
                label={formatTime(bins.hour, bins.minute)}
                onPress={chooseTime}
                color={COLOR}
              />
            </SettingRow>
          )}
          <SettingRow label="Les couleurs sont décalées ?">
            <ValueButton label="Inverser" onPress={invert} color={COLOR} />
          </SettingRow>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  hero: { borderRadius: 16, padding: 20 },
  heroLabel: { opacity: 0.85, fontSize: 15 },
  heroValue: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  label: { fontSize: 15, color: '#0F172A', paddingTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  rowDate: { color: '#0F172A', fontSize: 15 },
  rowBin: { color: '#475569', fontSize: 15, fontWeight: '600' },
  days: { flexDirection: 'row', gap: 6, paddingVertical: 8 },
  day: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  dayText: { fontWeight: '700', color: '#475569', fontSize: 12 },
});
