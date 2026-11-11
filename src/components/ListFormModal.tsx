import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, EMOJIS, LIST_KINDS, List, ListKind } from '@/store/types';

type Props = {
  visible: boolean;
  initial?: List;
  onCancel: () => void;
  onSubmit: (values: { name: string; emoji: string; color: string; kind: ListKind }) => void;
};

export function ListFormModal({ visible, ...formProps }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={formProps.onCancel}>
      {/* Mounted only while visible so the form state starts fresh from `initial` */}
      {visible && <ListForm {...formProps} />}
    </Modal>
  );
}

function ListForm({ initial, onCancel, onSubmit }: Omit<Props, 'visible'>) {
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? EMOJIS[0]);
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [kind, setKind] = useState<ListKind>(initial?.kind ?? 'simple');

  const chooseKind = (k: ListKind) => {
    setKind(k);
    // Suggest a matching icon for new lists
    if (!initial) setEmoji(k === 'movies' ? '🎬' : k === 'books' ? '📚' : EMOJIS[0]);
  };

  const canSubmit = name.trim().length > 0;

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>{initial ? 'Modifier la liste' : 'Nouvelle liste'}</Text>

        <TextInput
          style={styles.input}
          placeholder="Nom de la liste"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.row}>
          {LIST_KINDS.map((k) => (
            <Pressable
              key={k.value}
              onPress={() => chooseKind(k.value)}
              style={[
                styles.kind,
                k.value === kind && { borderColor: color, backgroundColor: '#F1F5F9' },
              ]}
            >
              <Text style={styles.kindText}>{k.label}</Text>
            </Pressable>
          ))}
        </View>
        {kind !== 'simple' && (
          <Text style={styles.help}>Suggestions automatiques pendant la saisie d’un titre</Text>
        )}

        <Text style={styles.label}>Icône</Text>
        <View style={styles.row}>
          {EMOJIS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEmoji(e)}
              style={[
                styles.emoji,
                e === emoji && { borderColor: color, backgroundColor: '#F1F5F9' },
              ]}
            >
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Couleur</Text>
        <View style={styles.row}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[styles.color, { backgroundColor: c }, c === color && styles.colorSelected]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onCancel} style={styles.button}>
            <Text style={styles.cancel}>Annuler</Text>
          </Pressable>
          <Pressable
            disabled={!canSubmit}
            onPress={() => onSubmit({ name: name.trim(), emoji, color, kind })}
            style={[styles.button, { backgroundColor: canSubmit ? color : '#CBD5E1' }]}
          >
            <Text style={styles.submit}>{initial ? 'Enregistrer' : 'Créer'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  label: { marginTop: 16, marginBottom: 8, fontWeight: '600', color: '#475569' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emoji: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kind: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  kindText: { fontWeight: '600', color: '#0F172A' },
  help: { marginTop: 6, fontSize: 12, color: '#64748B' },
  color: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: '#0F172A' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 24 },
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  cancel: { color: '#475569', fontWeight: '600' },
  submit: { color: '#fff', fontWeight: '700' },
});
