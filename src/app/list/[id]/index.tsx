import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlert } from '@/utils/alert';
import { SearchInput } from '@/components/SearchInput';
import { searchFor } from '@/services/search';
import { useLists } from '@/store/ListsContext';
import { Item } from '@/store/types';
import { daysBetween, formatRelative, fromKey, today } from '@/utils/dates';

const PLACEHOLDERS = {
  simple: 'Ajouter un élément…',
  movies: 'Titre du film…',
  books: 'Titre du livre…',
};

// Undone items with a target date first (soonest on top), then other undone items, then done ones
function sortItems(items: Item[]) {
  const dated = items.filter((i) => !i.done && i.dueDate);
  dated.sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  return [...dated, ...items.filter((i) => !i.done && !i.dueDate), ...items.filter((i) => i.done)];
}

function dueStyle(dueDate: string, done: boolean) {
  if (done) return { color: '#94A3B8', backgroundColor: '#F1F5F9' };
  const diff = daysBetween(today(), fromKey(dueDate));
  if (diff < 0) return { color: '#DC2626', backgroundColor: '#FEE2E2' };
  if (diff <= 1) return { color: '#C2410C', backgroundColor: '#FFEDD5' };
  return { color: '#475569', backgroundColor: '#F1F5F9' };
}

export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lists, addItem, toggleItem, deleteItem, clearDone } = useLists();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const list = lists.find((l) => l.id === id);
  const items = useMemo(() => (list ? sortItems(list.items) : []), [list]);

  if (!list) {
    return (
      <View style={styles.center}>
        <Text>Liste introuvable.</Text>
      </View>
    );
  }

  const doneCount = list.items.filter((i) => i.done).length;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `${list.emoji} ${list.name}`,
          headerTintColor: list.color,
          headerRight: () =>
            doneCount > 0 ? (
              <Pressable onPress={() => clearDone(list.id)} hitSlop={10}>
                <Text style={{ color: list.color, fontWeight: '600' }}>Effacer cochés</Text>
              </Pressable>
            ) : null,
        }}
      />

      <SearchInput
        color={list.color}
        placeholder={PLACEHOLDERS[list.kind]}
        search={searchFor(list.kind)}
        onAdd={(text, s) =>
          addItem(list.id, text, { subtitle: s?.subtitle, imageUrl: s?.imageUrl })
        }
      />

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 + insets.bottom, gap: 8 }}
        ListEmptyComponent={<Text style={styles.empty}>Liste vide pour le moment.</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/list/[id]/[itemId]',
                params: { id: list.id, itemId: item.id },
              })
            }
            onLongPress={() =>
              showAlert('Supprimer ?', item.text, [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: () => deleteItem(list.id, item.id),
                },
              ])
            }
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
          >
            <Pressable onPress={() => toggleItem(list.id, item.id)} hitSlop={12}>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: list.color },
                  item.done && { backgroundColor: list.color },
                ]}
              >
                {item.done && <Text style={styles.check}>✓</Text>}
              </View>
            </Pressable>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.itemText, item.done && styles.itemDone]}>{item.text}</Text>
              {item.subtitle && (
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              )}
              {item.note && (
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                  📝 {item.note}
                </Text>
              )}
              {item.dueDate && (
                <Text style={[styles.due, dueStyle(item.dueDate, item.done)]}>
                  📅 {formatRelative(fromKey(item.dueDate))}
                </Text>
              )}
            </View>
            {item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={[styles.cover, item.done && { opacity: 0.4 }]}
              />
            )}
          </Pressable>
        )}
        ListFooterComponent={
          list.items.length > 0 ? (
            <Text style={styles.hint}>
              Case pour cocher · touchez pour les détails · appui long pour supprimer
            </Text>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#64748B', marginTop: 40 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#fff', fontWeight: '900', fontSize: 14 },
  itemText: { fontSize: 16, color: '#0F172A' },
  itemSubtitle: { fontSize: 12, color: '#64748B' },
  due: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 2,
    overflow: 'hidden',
  },
  cover: { width: 32, height: 46, borderRadius: 4, backgroundColor: '#E2E8F0' },
  itemDone: { textDecorationLine: 'line-through', color: '#94A3B8' },
  hint: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 12 },
});
