import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { showAlert } from '@/utils/alert';
import { Birthday } from '@/store/planner';
import { MONTH_NAMES, today } from '@/utils/dates';
import { pickDate } from '@/utils/pickDate';

const COLOR = '#DB2777';

type Props = {
  visible: boolean;
  initial?: Partial<Birthday>;
  onCancel: () => void;
  onSave: (b: Omit<Birthday, 'id'> & { id?: string }) => void;
  onDelete: (id: string) => void;
};

export function BirthdayModal({ visible, ...props }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={props.onCancel}>
      {/* Mounted only while visible so the form state starts fresh from `initial` */}
      {visible && <BirthdayForm {...props} />}
    </Modal>
  );
}

function BirthdayForm({ initial, onCancel, onSave, onDelete }: Omit<Props, 'visible'>) {
  const now = today();
  const [name, setName] = useState(initial?.name ?? '');
  const [date, setDate] = useState(
    new Date(
      initial?.year ?? now.getFullYear(),
      (initial?.month ?? now.getMonth() + 1) - 1,
      initial?.day ?? now.getDate(),
    ),
  );
  const [yearKnown, setYearKnown] = useState(initial?.year !== undefined);

  const canSave = name.trim().length > 0;

  const chooseDate = async () => {
    const picked = await pickDate(date);
    if (picked) setDate(picked);
  };

  const save = () =>
    onSave({
      id: initial?.id,
      name: name.trim(),
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: yearKnown ? date.getFullYear() : undefined,
    });

  const confirmDelete = () =>
    showAlert('Supprimer ?', `Anniversaire de ${initial?.name}`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(initial!.id!) },
    ]);

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {initial?.id ? 'Modifier l’anniversaire' : 'Nouvel anniversaire'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Prénom / nom"
          value={name}
          onChangeText={setName}
          autoFocus={!initial?.id}
        />

        <Pressable style={styles.dateButton} onPress={chooseDate}>
          <Text style={styles.dateText}>
            🎂 {date.getDate()} {MONTH_NAMES[date.getMonth()]}
            {yearKnown ? ` ${date.getFullYear()}` : ''}
          </Text>
          <Text style={styles.dateHint}>Changer la date</Text>
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Année de naissance connue (pour l’âge)</Text>
          <Switch value={yearKnown} onValueChange={setYearKnown} trackColor={{ true: COLOR }} />
        </View>

        <View style={styles.actions}>
          {initial?.id && (
            <Pressable onPress={confirmDelete} style={[styles.button, { marginRight: 'auto' }]}>
              <Text style={styles.delete}>Supprimer</Text>
            </Pressable>
          )}
          <Pressable onPress={onCancel} style={styles.button}>
            <Text style={styles.cancel}>Annuler</Text>
          </Pressable>
          <Pressable
            disabled={!canSave}
            onPress={save}
            style={[styles.button, { backgroundColor: canSave ? COLOR : '#CBD5E1' }]}
          >
            <Text style={styles.submit}>Enregistrer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 14 },
  title: { fontSize: 20, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  dateButton: { backgroundColor: '#FDF2F8', borderRadius: 10, padding: 12 },
  dateText: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  dateHint: { fontSize: 12, color: COLOR, marginTop: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { flex: 1, color: '#475569' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
  button: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  cancel: { color: '#475569', fontWeight: '600' },
  delete: { color: '#DC2626', fontWeight: '600' },
  submit: { color: '#fff', fontWeight: '700' },
});
