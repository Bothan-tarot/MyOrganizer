import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlert } from '@/utils/alert';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Card, SectionTitle } from '@/components/ui';
import {
  custodyOn,
  CustodyConfig,
  defaultParentOn,
  DEFAULT_CUSTODY,
  Parent,
  PARENT_COLORS,
  parentName,
} from '@/store/planner';
import { usePlanner } from '@/store/PlannerContext';
import { addDays, DAY_LETTERS, isEvenWeek, toKey, today } from '@/utils/dates';

const COLOR = '#2563EB';
const other = (p: Parent): Parent => (p === 'A' ? 'B' : 'A');
const tint = (p: Parent) => PARENT_COLORS[p] + '33'; // 20% opacity

export default function CustodyScreen() {
  const { custody, setCustody } = usePlanner();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(today());

  const now = today();
  const todayInfo = custodyOn(custody, now);
  const tomorrowInfo = custodyOn(custody, addDays(now, 1));

  // Tapping a day swaps the parent for that day only; back to the pattern removes the exception
  const toggleDay = (date: Date) =>
    setCustody((c) => {
      const key = toKey(date);
      const next = other(custodyOn(c, date).parent);
      const overrides = { ...c.overrides };
      if (next === defaultParentOn(c, date)) delete overrides[key];
      else overrides[key] = next;
      return { ...c, overrides };
    });

  const resetDay = (date: Date) =>
    setCustody((c) => {
      const overrides = { ...c.overrides };
      delete overrides[toKey(date)];
      return { ...c, overrides };
    });

  const togglePattern = (week: 'even' | 'odd', day: number) =>
    setCustody((c) => ({ ...c, [week]: c[week].map((p, i) => (i === day ? other(p) : p)) }));

  const exceptionCount = Object.keys(custody.overrides).length;

  const confirmReset = () =>
    showAlert('Tout réinitialiser ?', 'Noms, rythme et exceptions reviendront par défaut.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réinitialiser',
        style: 'destructive',
        onPress: () => setCustody(DEFAULT_CUSTODY),
      },
    ]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `👧 Garde${custody.childName ? ` de ${custody.childName}` : ''}`,
          headerTintColor: COLOR,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom, gap: 12 }}
      >
        <View style={styles.todayRow}>
          {[
            { label: 'Aujourd’hui', info: todayInfo },
            { label: 'Demain', info: tomorrowInfo },
          ].map(({ label, info }) => (
            <View
              key={label}
              style={[styles.todayCard, { backgroundColor: PARENT_COLORS[info.parent] }]}
            >
              <Text style={styles.todayLabel}>{label}</Text>
              <Text style={styles.todayValue}>Chez {parentName(custody, info.parent)}</Text>
              {info.overridden && <Text style={styles.todayLabel}>exception</Text>}
            </View>
          ))}
        </View>

        <MonthCalendar
          month={month}
          onChangeMonth={setMonth}
          accentColor={COLOR}
          onDayPress={toggleDay}
          onDayLongPress={resetDay}
          decorate={(date) => {
            const { parent, overridden } = custodyOn(custody, date);
            return { backgroundColor: tint(parent), marker: overridden ? '✱' : undefined };
          }}
        />
        <View style={styles.legend}>
          {(['A', 'B'] as Parent[]).map((p) => (
            <View key={p} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: PARENT_COLORS[p] }]} />
              <Text style={styles.legendText}>{parentName(custody, p)}</Text>
            </View>
          ))}
          <Text style={styles.legendText}>✱ exception</Text>
        </View>
        <Text style={styles.hint}>
          Touchez un jour pour l’échanger (vacances, imprévu…) · appui long pour revenir au rythme
          normal
        </Text>

        <SectionTitle>Rythme habituel</SectionTitle>
        <Card style={{ gap: 12 }}>
          {(['even', 'odd'] as const).map((week) => (
            <View key={week}>
              <Text style={styles.patternTitle}>
                Semaines {week === 'even' ? 'paires' : 'impaires'}
                {isEvenWeek(now) === (week === 'even') ? '  (cette semaine)' : ''}
              </Text>
              <View style={styles.patternRow}>
                {custody[week].map((p, day) => (
                  <Pressable
                    key={day}
                    onPress={() => togglePattern(week, day)}
                    style={[styles.patternDay, { backgroundColor: PARENT_COLORS[p] }]}
                  >
                    <Text style={styles.patternLetter}>{DAY_LETTERS[day]}</Text>
                    <Text style={styles.patternParent} numberOfLines={1}>
                      {parentName(custody, p).slice(0, 5)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          <Text style={styles.hint}>Touchez un jour pour changer de parent</Text>
        </Card>

        <SectionTitle>Enfant et parents</SectionTitle>
        <Card style={{ gap: 10 }}>
          <View style={styles.nameRow}>
            <Text style={styles.childIcon}>👧</Text>
            <TextInput
              style={styles.nameInput}
              value={custody.childName}
              onChangeText={(childName) => setCustody((c) => ({ ...c, childName }))}
              placeholder="Prénom de l’enfant"
            />
          </View>
          {(['A', 'B'] as Parent[]).map((p) => {
            const field: keyof CustodyConfig = p === 'A' ? 'parentA' : 'parentB';
            const home = custody.homeParent === p;
            return (
              <View key={p} style={styles.nameRow}>
                <View style={[styles.legendDot, { backgroundColor: PARENT_COLORS[p] }]} />
                <TextInput
                  style={styles.nameInput}
                  value={custody[field]}
                  onChangeText={(text) => setCustody((c) => ({ ...c, [field]: text }))}
                  placeholder={p === 'A' ? 'Papa' : 'Maman'}
                />
                <Pressable
                  onPress={() => setCustody((c) => ({ ...c, homeParent: p }))}
                  style={[styles.homeChip, home && { backgroundColor: PARENT_COLORS[p] }]}
                >
                  <Text style={[styles.homeChipText, home && { color: '#fff' }]}>🏠 Chez nous</Text>
                </Pressable>
              </View>
            );
          })}
          <Text style={styles.hint}>
            « Chez nous » sert au module Courses pour savoir si {custody.childName || 'l’enfant'}{' '}
            est avec vous.
          </Text>
        </Card>

        <View style={styles.footer}>
          {exceptionCount > 0 && (
            <Pressable onPress={() => setCustody((c) => ({ ...c, overrides: {} }))}>
              <Text style={styles.link}>Effacer les {exceptionCount} exception(s)</Text>
            </Pressable>
          )}
          <Pressable onPress={confirmReset}>
            <Text style={[styles.link, { color: '#DC2626' }]}>Tout réinitialiser</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  todayRow: { flexDirection: 'row', gap: 12 },
  todayCard: { flex: 1, borderRadius: 14, padding: 14 },
  todayLabel: { color: '#fff', opacity: 0.9, fontSize: 13 },
  todayValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 14, height: 14, borderRadius: 7 },
  legendText: { color: '#475569', fontSize: 13 },
  hint: { textAlign: 'center', color: '#94A3B8', fontSize: 12 },
  patternTitle: { fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  patternRow: { flexDirection: 'row', gap: 4 },
  patternDay: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  patternLetter: { color: '#fff', fontWeight: '800' },
  patternParent: { color: '#fff', fontSize: 9 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  childIcon: { fontSize: 14, width: 14 },
  homeChip: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
  },
  homeChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  footer: { alignItems: 'center', gap: 12, marginTop: 8 },
  link: { color: COLOR, fontWeight: '600' },
});
