import type { AlertButton } from 'react-native';
import type { AlertRequest } from './alert';

// react-native-web's Alert.alert is a no-op, so dialogs are rendered by <AlertHost />
let listener: ((req: AlertRequest | null) => void) | null = null;

export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  const req = { title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] };
  if (listener) listener(req);
  else window.alert(message ? `${title}\n\n${message}` : title);
}

export function subscribeAlerts(l: (req: AlertRequest | null) => void) {
  listener = l;
  return () => {
    if (listener === l) listener = null;
  };
}
