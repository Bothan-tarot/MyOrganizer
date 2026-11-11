import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Item, List, ListKind } from './types';

const STORAGE_KEY = 'myorganizer:lists:v1';

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const defaultLists = (): List[] => {
  const now = Date.now();
  return [
    {
      id: newId(),
      name: 'TODO',
      emoji: '✅',
      color: '#4F46E5',
      kind: 'simple',
      items: [],
      createdAt: now,
    },
    {
      id: newId(),
      name: 'Films à voir',
      emoji: '🎬',
      color: '#DC2626',
      kind: 'movies',
      items: [],
      createdAt: now + 1,
    },
    {
      id: newId(),
      name: 'Livres à lire',
      emoji: '📚',
      color: '#059669',
      kind: 'books',
      items: [],
      createdAt: now + 2,
    },
  ];
};

// Lists saved before `kind` existed: guess it from the emoji
const withKind = (list: List): List => {
  if (list.kind) return list;
  const kind: ListKind = list.emoji === '🎬' ? 'movies' : list.emoji === '📚' ? 'books' : 'simple';
  return { ...list, kind };
};

type ListInput = Pick<List, 'name' | 'emoji' | 'color' | 'kind'>;
type ItemExtra = Pick<Item, 'subtitle' | 'imageUrl'>;

type ListsContextValue = {
  lists: List[];
  loaded: boolean;
  addList: (input: ListInput) => void;
  updateList: (id: string, input: ListInput) => void;
  deleteList: (id: string) => void;
  addItem: (listId: string, text: string, extra?: ItemExtra) => void;
  updateItem: (listId: string, itemId: string, patch: Partial<Omit<Item, 'id'>>) => void;
  toggleItem: (listId: string, itemId: string) => void;
  deleteItem: (listId: string, itemId: string) => void;
  clearDone: (listId: string) => void;
};

const ListsContext = createContext<ListsContextValue | null>(null);

export function ListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<List[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setLists(raw ? (JSON.parse(raw) as List[]).map(withKind) : defaultLists()))
      .catch(() => setLists(defaultLists()))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists)).catch(() => {});
    }
  }, [lists, loaded]);

  const value = useMemo<ListsContextValue>(() => {
    const updateItems = (listId: string, fn: (items: Item[]) => Item[]) =>
      setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, items: fn(l.items) } : l)));

    return {
      lists,
      loaded,
      addList: (input) =>
        setLists((prev) => [...prev, { ...input, id: newId(), items: [], createdAt: Date.now() }]),
      updateList: (id, input) =>
        setLists((prev) => prev.map((l) => (l.id === id ? { ...l, ...input } : l))),
      deleteList: (id) => setLists((prev) => prev.filter((l) => l.id !== id)),
      addItem: (listId, text, extra) =>
        updateItems(listId, (items) => [
          { id: newId(), text, done: false, createdAt: Date.now(), ...extra },
          ...items,
        ]),
      updateItem: (listId, itemId, patch) =>
        updateItems(listId, (items) =>
          items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
        ),
      toggleItem: (listId, itemId) =>
        updateItems(listId, (items) =>
          items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
        ),
      deleteItem: (listId, itemId) =>
        updateItems(listId, (items) => items.filter((i) => i.id !== itemId)),
      clearDone: (listId) => updateItems(listId, (items) => items.filter((i) => !i.done)),
    };
  }, [lists, loaded]);

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}

export function useLists() {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error('useLists must be used inside ListsProvider');
  return ctx;
}
