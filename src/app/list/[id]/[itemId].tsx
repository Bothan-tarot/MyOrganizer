import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlert } from '@/utils/alert';
import { useLists } from '@/store/ListsContext';
import {
  addDays,
  capitalize,
  formatLong,
  fromKey,
  inDays,
  daysBetween,
  toKey,
  today,
} from '@/utils/dates';
import { pickDate } from '@/utils/pickDate';

export default function ItemScreen() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const { lists, updateItem, deleteItem } = useLists();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const list = lists.find((l) => l.id === id);
  const item = list?.items.find((i) => i.id === itemId);

  if (!list || !item) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        <Text>Élément introuvable.</Text>
      </View>
    );
  }

  const update = (patch: Parameters<typeof updateItem>[2]) => updateItem(list.id, item.id, patch);
  const due = item.dueDate ? fromKey(item.dueDate) : undefined;

  const chooseDate = async () => {
    const picked = await pickDate(due ?? today());
    if (picked) update({ dueDate: toKey(picked) });
  };

  const confirmDelete = () =>
    showAlert('Supprimer ?', item.text, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteItem(list.id, item.id);
        },
      },
    ]);

  const quickDates = [
    { label: "Aujourd'hui", date: today() },
    { label: 'Demain', date: addDays(today(), 1) },
    { label: 'Dans 1 semaine', date: addDays(today(), 7) },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Détail', headerTintColor: list.color }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom, gap: 16 }}
      >
        <View style={styles.card}>
          <Text style={styles.label}>Titre</Text>
          <TextInput
            style={styles.titleInput}
            value={item.text}
            onChangeText={(text) => update({ text })}
            multiline
          />
          {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
          <View style={styles.doneRow}>
            <Text style={styles.doneLabel}>{item.done ? 'Terminé ✓' : 'À faire'}</Text>
            <Switch
              value={item.done}
              onValueChange={(done) => update({ done })}
              trackColor={{ true: list.color }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Date cible</Text>
          <Pressable onPress={chooseDate} style={styles.dateButton}>
            <Text style={[styles.dateText, !due && { color: '#94A3B8' }]}>
              📅 {due ? capitalize(formatLong(due)) : 'Aucune date'}
            </Text>
            {due && (
              <Text style={styles.dateHint}>
                {daysBetween(today(), due) < 0
                  ? `En retard de ${-daysBetween(today(), due)} jour(s)`
                  : capitalize(inDays(daysBetween(today(), due)))}
              </Text>
            )}
          </Pressable>
          <View style={styles.chips}>
            {quickDates.map((q) => (
              <Pressable
                key={q.label}
                onPress={() => update({ dueDate: toKey(q.date) })}
                style={[styles.chip, { borderColor: list.color }]}
              >
                <Text style={[styles.chipText, { color: list.color }]}>{q.label}</Text>
              </Pressable>
            ))}
            {due && (
              <Pressable
                onPress={() => update({ dueDate: undefined })}
                style={[styles.chip, { borderColor: '#94A3B8' }]}
              >
                <Text style={[styles.chipText, { color: '#64748B' }]}>Retirer</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Détails</Text>
          <TextInput
            style={styles.noteInput}
            value={item.note ?? ''}
            onChangeText={(note) => update({ note: note || undefined })}
            placeholder="Ajouter des précisions…"
            multiline
            textAlignVertical="top"
          />
        </View>

        <Pressable onPress={confirmDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Supprimer cet élément</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  titleInput: { fontSize: 18, fontWeight: '600', color: '#0F172A', padding: 0 },
  subtitle: { fontSize: 13, color: '#64748B' },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  doneLabel: { fontSize: 15, color: '#475569' },
  dateButton: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12 },
  dateText: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  dateHint: { fontSize: 12, color: '#64748B', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 13, fontWeight: '600' },
  noteInput: { minHeight: 120, fontSize: 15, color: '#0F172A', padding: 0 },
  deleteButton: { alignItems: 'center', padding: 12 },
  deleteText: { color: '#DC2626', fontWeight: '600' },
});
