import { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View, ViewStyle } from 'react-native';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function SwitchRow({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  color: string;
}) {
  return (
    <SettingRow label={label}>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: color }} />
    </SettingRow>
  );
}

export function ValueButton({
  label,
  onPress,
  color,
}: {
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.valueButton, { borderColor: color }]} hitSlop={6}>
      <Text style={[styles.valueButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Fab({
  color,
  onPress,
  bottom,
}: {
  color: string;
  onPress: () => void;
  bottom: number;
}) {
  return (
    <Pressable style={[styles.fab, { backgroundColor: color, bottom }]} onPress={onPress}>
      <Text style={styles.fabText}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: -4,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  settingLabel: { fontSize: 15, color: '#0F172A', flexShrink: 1 },
  valueButton: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  valueButtonText: { fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 34 },
});
