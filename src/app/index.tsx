import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlert } from '@/utils/alert';
import { Dashboard } from '@/components/Dashboard';
import { ListFormModal } from '@/components/ListFormModal';
import { useLists } from '@/store/ListsContext';
import { List } from '@/store/types';

export default function HomeScreen() {
  const { lists, loaded, addList, updateList, deleteList } = useLists();
  const insets = useSafeAreaInsets();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<List | undefined>();

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openActions = (list: List) => {
    showAlert(`${list.emoji} ${list.name}`, undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          showAlert(
            'Supprimer la liste ?',
            `« ${list.name} » et ses ${list.items.length} élément(s) seront perdus.`,
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => deleteList(list.id) },
            ],
          ),
      },
      {
        text: 'Modifier',
        onPress: () => {
          setEditing(list);
          setModalOpen(true);
        },
      },
    ]);
  };

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        keyExtractor={(l) => l.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom, gap: 12 }}
        ListHeaderComponent={<Dashboard />}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune liste. Appuyez sur + pour en créer une.</Text>
        }
        renderItem={({ item: list }) => {
          const remaining = list.items.filter((i) => !i.done).length;
          return (
            <Link href={{ pathname: '/list/[id]', params: { id: list.id } }} asChild>
              <Pressable
                onLongPress={() => openActions(list)}
                style={({ pressed }) => [
                  styles.card,
                  { borderLeftColor: list.color },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.cardEmoji}>{list.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{list.name}</Text>
                  <Text style={styles.cardSubtitle}>
                    {remaining} à faire · {list.items.length} au total
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Link>
          );
        }}
      />

      <Text style={[styles.hint, { bottom: 32 + insets.bottom }]}>
        Appui long sur une liste pour la modifier
      </Text>

      <Pressable style={[styles.fab, { bottom: 24 + insets.bottom }]} onPress={openCreate}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <ListFormModal
        visible={modalOpen}
        initial={editing}
        onCancel={() => setModalOpen(false)}
        onSubmit={(values) => {
          if (editing) updateList(editing.id, values);
          else addList(values);
          setModalOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#64748B', marginTop: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 6,
    elevation: 1,
  },
  cardEmoji: { fontSize: 30 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  cardSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  chevron: { fontSize: 28, color: '#94A3B8' },
  hint: { position: 'absolute', left: 16, color: '#94A3B8', fontSize: 12 },
  fab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 34 },
});
