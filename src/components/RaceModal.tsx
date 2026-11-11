import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { showAlert } from '@/utils/alert';
import { childWithUs, parentName, Race, Runner, RUNNER_COLORS, runnerName } from '@/store/planner';
import { usePlanner } from '@/store/PlannerContext';
import { capitalize, formatLong, fromKey, toKey, today } from '@/utils/dates';
import { pickDate } from '@/utils/pickDate';

export const RACE_COLOR = '#EA580C';

type Props = {
  visible: boolean;
  initial?: Race;
  onCancel: () => void;
  onSave: (r: Omit<Race, 'id'> & { id?: string }) => void;
  onDelete: (id: string) => void;
};

export function RaceModal({ visible, ...props }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={props.onCancel}>
      {/* Mounted only while visible so the form state starts fresh from `initial` */}
      {visible && <RaceForm {...props} />}
    </Modal>
  );
}

function RaceForm({ initial, onCancel, onSave, onDelete }: Omit<Props, 'visible'>) {
  const { custody, raceSettings } = usePlanner();
  const [name, setName] = useState(initial?.name ?? '');
  const [date, setDate] = useState(initial ? fromKey(initial.date) : today());
  const [distance, setDistance] = useState(initial?.distance ?? '');
  const [runners, setRunners] = useState<Runner[]>(initial?.runners ?? []);
  const [dateToConfirm, setDateToConfirm] = useState(initial?.dateToConfirm ?? false);
  const [note, setNote] = useState(initial?.note ?? '');

  const child = childWithUs(custody, date);
  const canSave = name.trim().length > 0 && runners.length > 0;

  const toggleRunner = (r: Runner) =>
    setRunners((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r].sort()));

  const chooseDate = async () => {
    const picked = await pickDate(date);
    if (picked) setDate(picked);
  };

  const confirmDelete = () =>
    showAlert('Supprimer ?', initial?.name, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(initial!.id) },
    ]);

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
          <Text style={styles.title}>{initial ? 'Modifier la course' : 'Nouvelle course'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Nom de la course"
            value={name}
            onChangeText={setName}
            autoFocus={!initial}
          />

          <Pressable style={styles.dateButton} onPress={chooseDate}>
            <Text style={styles.dateText}>📅 {capitalize(formatLong(date))}</Text>
            <Text style={styles.dateHint}>
              {custody.childName} :{' '}
              {child.withUs
                ? 'avec nous'
                : `chez ${parentName(custody, custody.homeParent === 'A' ? 'B' : 'A')}`}
              {child.overridden ? ' (exception)' : ''}
            </Text>
          </Pressable>

          <TextInput
            style={styles.input}
            placeholder="Distance (21, 13+17, S, M…)"
            value={distance}
            onChangeText={setDistance}
          />

          <View>
            <Text style={styles.label}>Qui participe ?</Text>
            <View style={styles.runners}>
              {(['a', 'b'] as Runner[]).map((r) => {
                const on = runners.includes(r);
                return (
                  <Pressable
                    key={r}
                    onPress={() => toggleRunner(r)}
                    style={[
                      styles.runner,
                      { borderColor: RUNNER_COLORS[r] },
                      on && { backgroundColor: RUNNER_COLORS[r] },
                    ]}
                  >
                    <Text style={[styles.runnerText, { color: on ? '#fff' : RUNNER_COLORS[r] }]}>
                      {on ? '✓ ' : ''}
                      {runnerName(raceSettings, r)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Date à confirmer</Text>
            <Switch
              value={dateToConfirm}
              onValueChange={setDateToConfirm}
              trackColor={{ true: '#EAB308' }}
            />
          </View>

          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            placeholder="Note (logistique, dossard…)"
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            {initial && (
              <Pressable onPress={confirmDelete} style={[styles.button, { marginRight: 'auto' }]}>
                <Text style={styles.delete}>Supprimer</Text>
              </Pressable>
            )}
            <Pressable onPress={onCancel} style={styles.button}>
              <Text style={styles.cancel}>Annuler</Text>
            </Pressable>
            <Pressable
              disabled={!canSave}
              onPress={() =>
                onSave({
                  id: initial?.id,
                  name: name.trim(),
                  date: toKey(date),
                  distance: distance.trim(),
                  runners,
                  dateToConfirm,
                  note: note.trim() || undefined,
                })
              }
              style={[styles.button, { backgroundColor: canSave ? RACE_COLOR : '#CBD5E1' }]}
            >
              <Text style={styles.submit}>Enregistrer</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '90%' },
  title: { fontSize: 20, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  dateButton: { backgroundColor: '#FFF7ED', borderRadius: 10, padding: 12 },
  dateText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  dateHint: { fontSize: 13, color: RACE_COLOR, marginTop: 2 },
  label: { fontWeight: '600', color: '#475569', marginBottom: 8 },
  runners: { flexDirection: 'row', gap: 8 },
  runner: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  runnerText: { fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { color: '#475569', fontSize: 15 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
  button: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  cancel: { color: '#475569', fontWeight: '600' },
  delete: { color: '#DC2626', fontWeight: '600' },
  submit: { color: '#fff', fontWeight: '700' },
});
