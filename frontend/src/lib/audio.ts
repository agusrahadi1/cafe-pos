/**
 * Web Audio API Notification Sound Engine
 * Zero external audio assets, works 100% offline and instant with zero latency.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type SoundType = 'order' | 'bell' | 'ready';

/**
 * Play a synthesized chime or bell sound
 */
export function playNotificationSound(type: SoundType = 'order') {
  if (typeof window === 'undefined') return;

  // Check if staff has muted audio in localStorage
  const isMuted = localStorage.getItem('cafe_audio_muted') === 'true';
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'order') {
      // Pleasant dual-tone "Ding-Dong!" for new incoming orders
      // Tone 1: 784 Hz (G5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(784, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: 1046.5 Hz (C6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.18);
      gain2.gain.setValueAtTime(0.4, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.75);
    } else if (type === 'bell') {
      // Service Bell "Cling-Cling!" for Call Waiter
      [now, now + 0.14].forEach((t, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1318.51 + i * 150, t);
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } else if (type === 'ready') {
      // Ascending triple chime for "Pesanan Siap Diantar"
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const t = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    }
  } catch (err) {
    console.warn('Could not play audio notification:', err);
  }
}

export function isAudioMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('cafe_audio_muted') === 'true';
}

export function setAudioMuted(muted: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cafe_audio_muted', muted ? 'true' : 'false');
}

export function testAudioNotification(type: SoundType = 'order') {
  // Ensure AudioContext is resumed upon explicit user interaction
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().then(() => {
      playNotificationSound(type);
    });
  } else {
    playNotificationSound(type);
  }
}

