/**
 * Web Audio API synthesizer beep for barcode scan feedback
 */
export function playBeep(type: 'success' | 'error' = 'success') {
  if (typeof window === 'undefined') return;

  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime); // 800Hz beep
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.08); // 80ms duration
    } else {
      // Error/warning feedback: two short low-pitched buzzes
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime); // 150Hz buzz
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15); // 150ms duration
    }
  } catch (e) {
    console.error('Audio feedback failed:', e);
  }
}

/**
 * Trigger mobile device vibration haptic feedback
 */
export function triggerHaptic() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(100); // 100ms vibration
  }
}
