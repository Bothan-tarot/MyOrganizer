import { Alert, AlertButton } from 'react-native';

export type AlertRequest = { title: string; message?: string; buttons: AlertButton[] };

// Native: the platform dialog already does the job
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  Alert.alert(title, message, buttons);
}

// Only the web version renders dialogs itself (see alert.web.ts / AlertHost)
export function subscribeAlerts(_listener: (req: AlertRequest | null) => void) {
  return () => {};
}
