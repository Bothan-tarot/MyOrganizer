import { Href, Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EVEN_COLOR, ODD_COLOR } from '@/components/MonthCalendar';
import { SectionTitle } from '@/components/ui';
import {
  ageOn,
  BIN_INFO,
  custodyOn,
  nextBinDays,
  PARENT_COLORS,
  parentName,
  runnerName,
  sortByNext,
} from '@/store/planner';
import { RACE_COLOR } from '@/components/RaceModal';
import { usePlanner } from '@/store/PlannerContext';
import {
  capitalize,
  DAY_NAMES,
  daysBetween,
  formatLong,
  fromKey,
  inDays,
  isoWeek,
  toKey,
  today,
} from '@/utils/dates';

function Tile({
  href,
  icon,
  title,
  value,
  detail,
  color,
}: {
  href: Href;
  icon: string;
  title: string;
  value: string;
  detail?: string;
  color: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.tile, pressed && { opacity: 0.7 }]}>
        <Text style={styles.tileTitle}>
          {icon} {title}
        </Text>
        <Text style={[styles.tileValue, { color }]} numberOfLines={2}>
          {value}
        </Text>
        {detail && (
          <Text style={styles.tileDetail} numberOfLines={1}>
            {detail}
          </Text>
        )}
      </Pressable>
    </Link>
  );
}

export function Dashboard() {
  const { custody, bins, birthdays, races, raceSettings } = usePlanner();
  const now = today();
  const week = isoWeek(now);
  const even = week % 2 === 0;

  const custodyToday = custodyOn(custody, now);
  const nextBin = nextBinDays(bins, 1)[0];
  const binDays = daysBetween(now, nextBin.date);
  const nextBday = sortByNext(birthdays)[0];
  const nextRace = races
    .filter((r) => r.date >= toKey(now))
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.week, { backgroundColor: even ? EVEN_COLOR : ODD_COLOR }]}>
        <Text style={styles.weekDate}>{capitalize(formatLong(now))}</Text>
        <Text style={styles.weekValue}>
          Semaine {even ? 'paire' : 'impaire'}
          <Text style={styles.weekNumber}> · n°{week}</Text>
        </Text>
      </View>

      <View style={styles.tiles}>
        <Tile
          href="/custody"
          icon="👧"
          title={custody.childName || 'Garde'}
          value={`Chez ${parentName(custody, custodyToday.parent)}`}
          detail={custodyToday.overridden ? "Aujourd'hui (exception)" : "Aujourd'hui"}
          color={PARENT_COLORS[custodyToday.parent]}
        />
        <Tile
          href="/bins"
          icon="🗑️"
          title="Poubelles"
          value={`${BIN_INFO[nextBin.color].emoji} ${capitalize(BIN_INFO[nextBin.color].label)}`}
          detail={
            binDays === 0
              ? 'Ce soir'
              : `${capitalize(DAY_NAMES[bins.weekday])} (${inDays(binDays)})`
          }
          color="#0F172A"
        />
      </View>
      <View style={styles.tiles}>
        <Tile
          href="/birthdays"
          icon="🎂"
          title="Anniversaires"
          value={nextBday ? nextBday.birthday.name : 'Aucun'}
          detail={
            nextBday
              ? `${capitalize(inDays(daysBetween(now, nextBday.date)))}${
                  ageOn(nextBday.birthday, nextBday.date) !== undefined
                    ? ` · ${ageOn(nextBday.birthday, nextBday.date)} ans`
                    : ''
                }`
              : 'Touchez pour en ajouter'
          }
          color="#DB2777"
        />
        <Tile
          href="/races"
          icon="🏃"
          title="Courses"
          value={nextRace ? nextRace.name : 'Aucune'}
          detail={
            nextRace
              ? `${capitalize(inDays(daysBetween(now, fromKey(nextRace.date))))} · ${nextRace.runners
                  .map((r) => runnerName(raceSettings, r))
                  .join(' & ')}`
              : 'Touchez pour en ajouter'
          }
          color={RACE_COLOR}
        />
      </View>

      <SectionTitle>Mes listes</SectionTitle>
    </View>
  );
}

const styles = StyleSheet.create({
  week: { borderRadius: 16, padding: 18 },
  weekDate: { color: '#fff', opacity: 0.9, fontSize: 14 },
  weekValue: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 2 },
  weekNumber: { fontSize: 16, fontWeight: '600' },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 2 },
  tileTitle: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  tileValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  tileDetail: { fontSize: 12, color: '#64748B' },
});
