import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RACE_COLOR, RaceModal } from '@/components/RaceModal';
import { Card, Fab, SectionTitle } from '@/components/ui';
import {
  childWithUs,
  CustodyConfig,
  Race,
  RaceSettings,
  Runner,
  RUNNER_COLORS,
  runnerName,
} from '@/store/planner';
import { usePlanner } from '@/store/PlannerContext';
import { DAY_NAMES, daysBetween, fromKey, inDays, toKey, today, weekdayIndex } from '@/utils/dates';

const MONTH_ABBR = [
  'JANV',
  'FÉVR',
  'MARS',
  'AVR',
  'MAI',
  'JUIN',
  'JUIL',
  'AOÛT',
  'SEPT',
  'OCT',
  'NOV',
  'DÉC',
];

type Filter = 'all' | Runner;

function RaceRow({
  race,
  custody,
  settings,
  past,
  onPress,
}: {
  race: Race;
  custody: CustodyConfig;
  settings: RaceSettings;
  past: boolean;
  onPress: () => void;
}) {
  const date = fromKey(race.date);
  const child = childWithUs(custody, date);
  const days = daysBetween(today(), date);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, past && { opacity: 0.55 }, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.dateBlock, race.dateToConfirm && styles.dateTentative]}>
        <Text style={styles.dateDay}>
          {date.getDate()}
          {race.dateToConfirm ? '?' : ''}
        </Text>
        <Text style={styles.dateMonth}>{MONTH_ABBR[date.getMonth()]}</Text>
        <Text style={styles.dateYear}>{date.getFullYear()}</Text>
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.name}>{race.name}</Text>
        <Text style={styles.meta}>
          {DAY_NAMES[weekdayIndex(date)]}
          {!past && days <= 60 ? ` · ${inDays(days)}` : ''}
        </Text>
        <View style={styles.chips}>
          {race.distance !== '' && (
            <Text style={[styles.chip, styles.distance]}>
              {/^\d+(\+\d+)?$/.test(race.distance) ? `${race.distance} km` : race.distance}
            </Text>
          )}
          {race.runners.map((r) => (
            <Text
              key={r}
              style={[styles.chip, { backgroundColor: RUNNER_COLORS[r], color: '#fff' }]}
            >
              {runnerName(settings, r)}
            </Text>
          ))}
          {race.dateToConfirm && !past && (
            <Text style={[styles.chip, styles.todo]}>Date à confirmer</Text>
          )}
        </View>
        {race.note && <Text style={styles.note}>📝 {race.note}</Text>}
      </View>

      <View style={[styles.child, child.withUs ? styles.childYes : styles.childNo]}>
        <Text style={[styles.childName, child.withUs ? styles.childYesText : styles.childNoText]}>
          {custody.childName}
        </Text>
        <Text style={[styles.childValue, child.withUs ? styles.childYesText : styles.childNoText]}>
          {child.withUs ? 'Oui' : 'Non'}
          {child.overridden ? ' ✱' : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export default function RacesScreen() {
  const { races, saveRace, deleteRace, custody, raceSettings, setRaceSettings } = usePlanner();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [showPast, setShowPast] = useState(false);
  const [editing, setEditing] = useState<Race | 'new' | null>(null);

  const todayKey = toKey(today());
  const visible = races
    .filter((r) => filter === 'all' || r.runners.includes(filter))
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = visible.filter((r) => r.date >= todayKey);
  const past = visible.filter((r) => r.date < todayKey).reverse();

  const row = (race: Race, isPast: boolean) => (
    <RaceRow
      key={race.id}
      race={race}
      custody={custody}
      settings={raceSettings}
      past={isPast}
      onPress={() => setEditing(race)}
    />
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '🏃 Courses', headerTintColor: RACE_COLOR }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom, gap: 10 }}
      >
        <View style={styles.filters}>
          {(['all', 'a', 'b'] as Filter[]).map((f) => {
            const on = filter === f;
            const color = f === 'all' ? RACE_COLOR : RUNNER_COLORS[f];
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filter, { borderColor: color }, on && { backgroundColor: color }]}
              >
                <Text style={[styles.filterText, { color: on ? '#fff' : color }]}>
                  {f === 'all' ? 'Tous' : runnerName(raceSettings, f)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle>À venir ({upcoming.length})</SectionTitle>
        {upcoming.length === 0 && <Text style={styles.empty}>Aucune course à venir.</Text>}
        {upcoming.map((r) => row(r, false))}

        {past.length > 0 && (
          <Pressable onPress={() => setShowPast((v) => !v)} style={styles.pastToggle}>
            <Text style={styles.pastToggleText}>
              {showPast ? 'Masquer' : 'Afficher'} les {past.length} course(s) passée(s)
            </Text>
          </Pressable>
        )}
        {showPast && past.map((r) => row(r, true))}

        <SectionTitle>Participants</SectionTitle>
        <Card style={{ gap: 10 }}>
          {(['a', 'b'] as Runner[]).map((r) => {
            const field = r === 'a' ? 'runnerA' : 'runnerB';
            return (
              <View key={r} style={styles.nameRow}>
                <View style={[styles.dot, { backgroundColor: RUNNER_COLORS[r] }]} />
                <TextInput
                  style={styles.nameInput}
                  value={raceSettings[field]}
                  onChangeText={(text) => setRaceSettings((s) => ({ ...s, [field]: text }))}
                />
              </View>
            );
          })}
          <Text style={styles.hint}>
            La colonne « {custody.childName} » est calculée avec les règles de l’écran Garde
            (exceptions comprises, ✱).
          </Text>
        </Card>
      </ScrollView>

      <Fab color={RACE_COLOR} bottom={24 + insets.bottom} onPress={() => setEditing('new')} />

      <RaceModal
        visible={editing !== null}
        initial={editing === 'new' || editing === null ? undefined : editing}
        onCancel={() => setEditing(null)}
        onSave={(r) => {
          saveRace(r);
          setEditing(null);
        }}
        onDelete={(id) => {
          deleteRace(id);
          setEditing(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  filters: { flexDirection: 'row', gap: 8 },
  filter: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  filterText: { fontWeight: '700' },
  empty: { color: '#64748B', textAlign: 'center', marginVertical: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
  },
  dateBlock: { width: 50, alignItems: 'center', borderRadius: 10, paddingVertical: 4 },
  dateTentative: { backgroundColor: '#FEF08A' },
  dateDay: { fontSize: 22, fontWeight: '800', color: '#0F172A', lineHeight: 24 },
  dateMonth: { fontSize: 11, fontWeight: '700', color: RACE_COLOR },
  dateYear: { fontSize: 10, color: '#94A3B8' },
  name: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  meta: { fontSize: 12, color: '#64748B' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  distance: { backgroundColor: '#F1F5F9', color: '#334155' },
  todo: { backgroundColor: '#FEF08A', color: '#713F12' },
  note: { fontSize: 12, color: '#475569' },
  child: { width: 58, borderRadius: 10, paddingVertical: 6, alignItems: 'center' },
  childYes: { backgroundColor: '#DCFCE7' },
  childNo: { backgroundColor: '#F1F5F9' },
  childYesText: { color: '#166534' },
  childNoText: { color: '#64748B' },
  childName: { fontSize: 10, fontWeight: '600' },
  childValue: { fontSize: 14, fontWeight: '800' },
  pastToggle: { alignItems: 'center', padding: 8 },
  pastToggleText: { color: RACE_COLOR, fontWeight: '600' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  hint: { color: '#94A3B8', fontSize: 12 },
});
