import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

// Opens the native Android date/time dialog; resolves null when dismissed
export function pickDate(value: Date, mode: 'date' | 'time' = 'date'): Promise<Date | null> {
  return new Promise((resolve) =>
    DateTimePickerAndroid.open({
      value,
      mode,
      is24Hour: true,
      onValueChange: (_event, date) => resolve(date),
      onDismiss: () => resolve(null),
    }),
  );
}
