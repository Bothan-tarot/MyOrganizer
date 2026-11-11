import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BirthdayModal } from '@/components/BirthdayModal';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Card, Fab, SectionTitle, SwitchRow, SettingRow, ValueButton } from '@/components/ui';
import { ageOn, Birthday, birthdaysOn, sortByNext } from '@/store/planner';
import { usePlanner } from '@/store/PlannerContext';
import { daysBetween, formatLong, formatTime, inDays, today } from '@/utils/dates';
import { pickDate } from '@/utils/pickDate';

const COLOR = '#DB2777';

export default function BirthdaysScreen() {
  const { birthdays, saveBirthday, deleteBirthday, birthdaySettings, setBirthdaySettings } =
    usePlanner();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(today());
  const [editing, setEditing] = useState<Partial<Birthday> | null>(null);

  const upcoming = sortByNext(birthdays);

  const onDayPress = (date: Date) => {
    const existing = birthdaysOn(birthdays, date);
    setEditing(existing[0] ?? { day: date.getDate(), month: date.getMonth() + 1 });
  };

  const chooseTime = async () => {
    const value = new Date();
    value.setHours(birthdaySettings.hour, birthdaySettings.minute);
    const picked = await pickDate(value, 'time');
    if (picked)
      setBirthdaySettings((s) => ({ ...s, hour: picked.getHours(), minute: picked.getMinutes() }));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '🎂 Anniversaires', headerTintColor: COLOR }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom, gap: 12 }}
      >
        <MonthCalendar
          month={month}
          onChangeMonth={setMonth}
          accentColor={COLOR}
          onDayPress={onDayPress}
          decorate={(date) =>
            birthdaysOn(birthdays, date).length > 0
              ? { backgroundColor: '#FCE7F3', marker: '🎂' }
              : undefined
          }
        />
        <Text style={styles.hint}>Touchez un jour pour ajouter ou voir un anniversaire</Text>

        <SectionTitle>À venir</SectionTitle>
        <Card style={{ paddingVertical: 4 }}>
          {upcoming.length === 0 && (
            <Text style={styles.empty}>Aucun anniversaire. Appuyez sur + pour en ajouter.</Text>
          )}
          {upcoming.map(({ birthday: b, date }, i) => {
            const days = daysBetween(today(), date);
            const age = ageOn(b, date);
            return (
              <Pressable
                key={b.id}
                onPress={() => setEditing(b)}
                style={[styles.row, i > 0 && styles.rowBorder]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {days === 0 ? '🎉 ' : ''}
                    {b.name}
                  </Text>
                  <Text style={styles.sub}>
                    {formatLong(date)}
                    {age !== undefined ? ` · ${age} ans` : ''}
                  </Text>
                </View>
                <Text style={[styles.badge, days <= 7 && { color: COLOR, fontWeight: '700' }]}>
                  {inDays(days)}
                </Text>
              </Pressable>
            );
          })}
        </Card>

        <SectionTitle>Notifications</SectionTitle>
        <Card style={{ paddingVertical: 8 }}>
          <SwitchRow
            label="Me prévenir le jour J"
            value={birthdaySettings.enabled}
            onChange={(enabled) => setBirthdaySettings((s) => ({ ...s, enabled }))}
            color={COLOR}
          />
          {birthdaySettings.enabled && (
            <>
              <SettingRow label="Heure du rappel">
                <ValueButton
                  label={formatTime(birthdaySettings.hour, birthdaySettings.minute)}
                  onPress={chooseTime}
                  color={COLOR}
                />
              </SettingRow>
              <SwitchRow
                label="Aussi la veille"
                value={birthdaySettings.dayBefore}
                onChange={(dayBefore) => setBirthdaySettings((s) => ({ ...s, dayBefore }))}
                color={COLOR}
              />
            </>
          )}
        </Card>
      </ScrollView>

      <Fab color={COLOR} bottom={24 + insets.bottom} onPress={() => setEditing({})} />

      <BirthdayModal
        visible={editing !== null}
        initial={editing ?? undefined}
        onCancel={() => setEditing(null)}
        onSave={(b) => {
          saveBirthday(b);
          setEditing(null);
        }}
        onDelete={(id) => {
          deleteBirthday(id);
          setEditing(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  hint: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: -4 },
  empty: { color: '#64748B', paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  name: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  sub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  badge: { color: '#64748B', fontSize: 13 },
});
