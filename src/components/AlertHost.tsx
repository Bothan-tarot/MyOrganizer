import { useEffect, useState } from 'react';
import { AlertButton, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertRequest, subscribeAlerts } from '@/utils/alert';

// Renders showAlert() dialogs on web; on native subscribeAlerts never fires
export function AlertHost() {
  const [req, setReq] = useState<AlertRequest | null>(null);

  useEffect(() => subscribeAlerts(setReq), []);

  if (!req) return null;

  const cancel = req.buttons.find((b) => b.style === 'cancel');
  const press = (b?: AlertButton) => {
    setReq(null);
    // Deferred so a button can open a follow-up dialog
    setTimeout(() => b?.onPress?.(), 0);
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={() => press(cancel)}>
      <Pressable style={styles.backdrop} onPress={() => press(cancel)}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{req.title}</Text>
          {req.message ? <Text style={styles.message}>{req.message}</Text> : null}
          <View style={styles.buttons}>
            {req.buttons.map((b, i) => (
              <Pressable
                key={i}
                onPress={() => press(b)}
                style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    b.style === 'cancel' && styles.cancel,
                    b.style === 'destructive' && styles.destructive,
                  ]}
                >
                  {b.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  title: { fontSize: 17, fontWeight: '600', color: '#0F172A' },
  message: { marginTop: 8, fontSize: 15, color: '#475569' },
  buttons: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' },
  button: { paddingVertical: 10, paddingHorizontal: 14 },
  buttonText: { fontSize: 15, fontWeight: '600', color: '#2563EB' },
  cancel: { color: '#64748B', fontWeight: '500' },
  destructive: { color: '#DC2626' },
});
