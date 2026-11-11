const pad = (n: number) => String(n).padStart(2, '0');

// Web: opens the browser's native picker through a hidden <input>; resolves null when dismissed
export function pickDate(value: Date, mode: 'date' | 'time' = 'date'): Promise<Date | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = mode;
    input.value =
      mode === 'date'
        ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
        : `${pad(value.getHours())}:${pad(value.getMinutes())}`;
    Object.assign(input.style, {
      position: 'fixed',
      bottom: '0',
      left: '50%',
      opacity: '0',
      pointerEvents: 'none',
    });

    let done = false;
    const finish = (result: Date | null) => {
      if (done) return;
      done = true;
      input.remove();
      resolve(result);
    };

    input.addEventListener('change', () => {
      if (!input.value) return finish(null);
      const d = new Date(value);
      if (mode === 'date') {
        const [y, m, day] = input.value.split('-').map(Number);
        d.setFullYear(y, m - 1, day);
      } else {
        const [h, min] = input.value.split(':').map(Number);
        d.setHours(h, min, 0, 0);
      }
      finish(d);
    });
    input.addEventListener('cancel', () => finish(null));
    // Browsers without a 'cancel' event: the input loses focus when the picker closes
    input.addEventListener('blur', () => setTimeout(() => finish(null), 300));

    document.body.appendChild(input);
    input.focus();
    try {
      input.showPicker();
    } catch {
      input.click();
    }
  });
}
