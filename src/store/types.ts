export type ListKind = 'simple' | 'movies' | 'books';

export type Item = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  // Filled when the item was picked from a search suggestion
  subtitle?: string;
  imageUrl?: string;
  note?: string;
  dueDate?: string; // 'YYYY-MM-DD'
};

export type List = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  kind: ListKind;
  items: Item[];
  createdAt: number;
};

export const LIST_KINDS: { value: ListKind; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'movies', label: '🎬 Films' },
  { value: 'books', label: '📚 Livres' },
];

export const EMOJIS = ['✅', '🎬', '📚', '🛒', '🎮', '🎵', '✈️', '🍽️', '💡', '🎁', '🏋️', '📺'];

export const COLORS = [
  '#4F46E5',
  '#DC2626',
  '#059669',
  '#D97706',
  '#DB2777',
  '#0891B2',
  '#7C3AED',
  '#475569',
];
