export type Key = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '±' | '⌫';

/** replace : la prochaine touche chiffre remplace le texte (suggestion Belote). */
export interface Buffer {
  text: string;
  replace: boolean;
}

const MAX_DIGITS = 5;

export function applyKey(b: Buffer, k: Key): Buffer {
  if (k === '⌫') return { text: b.replace ? '' : b.text.slice(0, -1), replace: false };
  if (k === '±') {
    return { text: b.text.startsWith('-') ? b.text.slice(1) : '-' + b.text, replace: false };
  }
  const base = b.replace ? '' : b.text;
  const sign = base.startsWith('-') ? '-' : '';
  const digits = base.replace('-', '');
  // les zéros de tête sont retirés : « 07 » ⇒ « 7 »
  const next = (digits === '0' ? '' : digits) + k;
  const trimmed = next.length > MAX_DIGITS ? digits : next;
  return { text: sign + trimmed, replace: false };
}

export function bufferValue(b: Buffer): number {
  const n = Number(b.text);
  return Number.isFinite(n) ? n || 0 : 0; // « -0 » vaut 0
}
