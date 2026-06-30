import { useEffect, useRef } from 'react';

export const useBarcodeScanner = (onScan: (barcode: string) => void) => {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Filter out modifier keys explicitly at the very top of listener
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt') {
        return; // Skip modifier keys, wait for the actual alphanumeric value
      }

      // Ignore other functional keys (except Enter)
      if (e.key.length > 1 && e.key !== 'Enter') {
        return;
      }

      const currentTime = Date.now();
      const delay = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Fix: If it's the first character in a while, don't wipe it; start the buffer!
      if (bufferRef.current.length > 0 && delay > 75) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          onScan(bufferRef.current);
        }
        bufferRef.current = '';
      } else if (e.key.length === 1) {
        // If we are in an input and detect a fast key sequence (indicating scanner wedge)
        if (isInput && (delay < 75 || bufferRef.current.length > 0)) {
          e.preventDefault();
          e.stopPropagation();

          // If this is the second character and it arrived fast, the first character must have leaked.
          // Let's remove the leaked first character from the input element value.
          if (delay < 75 && bufferRef.current.length === 1) {
            const input = target as HTMLInputElement | HTMLTextAreaElement;
            const val = input.value;
            const firstChar = bufferRef.current[0];
            if (val && val.endsWith(firstChar)) {
              input.value = val.slice(0, -1);
              // Dispatch input event to ensure React state updates correctly
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        }
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onScan]);
};
