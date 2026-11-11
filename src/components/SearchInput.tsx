import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Suggestion } from '@/services/search';

type Props = {
  color: string;
  placeholder: string;
  // When provided, suggestions are fetched as the user types
  search: ((query: string, signal: AbortSignal) => Promise<Suggestion[]>) | null;
  onAdd: (text: string, suggestion?: Suggestion) => void;
};

const MIN_CHARS = 2;
const DEBOUNCE_MS = 350;

export function SearchInput({ color, placeholder, search, onAdd }: Props) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const query = text.trim();
  const active = search !== null && query.length >= MIN_CHARS;
  const showThumbs = suggestions.some((s) => s.imageUrl);

  useEffect(() => {
    if (!search || query.length < MIN_CHARS) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError(false);
      search(query, controller.signal)
        .then(setSuggestions)
        .catch((e) => {
          if (e.name !== 'AbortError') setError(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, search]);

  const reset = () => {
    setText('');
    setSuggestions([]);
    setError(false);
  };

  const submit = (suggestion?: Suggestion) => {
    const value = suggestion?.title ?? query;
    if (!value) return;
    onAdd(value, suggestion);
    reset();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => submit()}
          submitBehavior="submit"
          returnKeyType="done"
          autoCorrect={search === null}
        />
        {active && loading && <ActivityIndicator style={styles.spinner} color={color} />}
        <Pressable style={[styles.addButton, { backgroundColor: color }]} onPress={() => submit()}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {active && (suggestions.length > 0 || error) && (
        <View style={styles.dropdown}>
          {error ? (
            <Text style={styles.message}>Recherche indisponible (connexion ?)</Text>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {suggestions.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => submit(s)}
                  style={({ pressed }) => [
                    styles.suggestion,
                    pressed && { backgroundColor: '#F1F5F9' },
                  ]}
                >
                  {showThumbs &&
                    (s.imageUrl ? (
                      <Image source={{ uri: s.imageUrl }} style={styles.thumb} />
                    ) : (
                      <View style={[styles.thumb, styles.thumbEmpty]} />
                    ))}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                      {s.title}
                    </Text>
                    {s.subtitle && (
                      <Text style={styles.subtitle} numberOfLines={1}>
                        {s.subtitle}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // zIndex keeps the dropdown above the list rendered below this component
  wrapper: { padding: 16, zIndex: 10 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  spinner: { position: 'absolute', right: 66 },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 26, lineHeight: 28 },
  dropdown: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    maxHeight: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  thumb: { width: 32, height: 46, borderRadius: 4, backgroundColor: '#E2E8F0' },
  thumbEmpty: { opacity: 0.5 },
  title: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 1 },
  message: { padding: 14, color: '#64748B' },
});
