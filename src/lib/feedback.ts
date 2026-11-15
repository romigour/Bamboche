import { writable, get } from 'svelte/store';
import { load, save } from './storage';

export type Sound = 'tap' | 'found' | 'pass' | 'tick' | 'end';

/** Préférence « Sons et vibrations », persistée sous `soundOn`. */
export const soundOn = writable<boolean>(load('soundOn', true));
soundOn.subscribe((v) => save('soundOn', v));

let ctx: AudioContext | null = null;

/** À appeler sur un geste : iOS n'autorise le son qu'après une interaction. */
export function unlockAudio(): void {
  try {
    const Ctor = (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    if (!ctx) {
      ctx = new Ctor();
      // iOS : jouer un échantillon silencieux pendant le geste « déverrouille » vraiment le son
      try {
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      } catch {
        // pas de tampon : sans importance
      }
    }
    // 'suspended' ou 'interrupted' (iOS après un appel ou une mise en veille)
    if ((ctx.state as string) !== 'running') void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** Débloque le son sur tous les gestes qui comptent comme activation (iOS exige touchend/click). */
export function installAudioUnlock(target: Pick<Window, 'addEventListener'>): void {
  for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'])
    target.addEventListener(ev, unlockAudio, { passive: true });
}

type Note = { f: number; to?: number; at: number; dur: number; type?: OscillatorType; vol?: number };

const SOUNDS: Record<Sound, Note[]> = {
  tap: [{ f: 520, at: 0, dur: 0.05, type: 'triangle', vol: 0.08 }],
  found: [
    { f: 660, at: 0, dur: 0.11, type: 'triangle' },
    { f: 990, at: 0.1, dur: 0.18, type: 'triangle' },
  ],
  pass: [{ f: 440, to: 260, at: 0, dur: 0.2, type: 'sine' }],
  tick: [{ f: 1200, at: 0, dur: 0.04, type: 'square', vol: 0.06 }],
  end: [
    { f: 880, at: 0, dur: 0.18, type: 'square', vol: 0.12 },
    { f: 660, at: 0.2, dur: 0.18, type: 'square', vol: 0.12 },
    { f: 440, at: 0.4, dur: 0.45, type: 'square', vol: 0.12 },
  ],
};

export function play(sound: Sound): void {
  if (!get(soundOn) || !ctx) return;
  try {
    const t0 = ctx.currentTime;
    for (const n of SOUNDS[sound]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type ?? 'sine';
      osc.frequency.setValueAtTime(n.f, t0 + n.at);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t0 + n.at + n.dur);
      gain.gain.setValueAtTime(n.vol ?? 0.18, t0 + n.at);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0 + n.at);
      osc.stop(t0 + n.at + n.dur + 0.02);
    }
  } catch {
    // son indisponible : on continue en silence
  }
}

export function vibrate(pattern: number | number[]): void {
  if (!get(soundOn)) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch {
    // ignoré (iOS n'a pas de vibration)
  }
}

export function tap(): void {
  play('tap');
  vibrate(10);
}
