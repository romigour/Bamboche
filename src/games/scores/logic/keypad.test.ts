import { describe, it, expect } from 'vitest';
import { applyKey, bufferValue, type Buffer, type Key } from './keypad';

const tape = (keys: Key[], start: Buffer = { text: '', replace: false }) => keys.reduce(applyKey, start);

describe('applyKey', () => {
  it('ajoute les chiffres', () => expect(tape(['1', '2']).text).toBe('12'));
  it('plafonne à 5 chiffres', () => {
    const keys = '123456789012'.split('') as Key[];
    expect(tape(keys).text).toBe('12345');
  });
  it('± puis 5 donne -5', () => {
    const b = tape(['±', '5']);
    expect(b.text).toBe('-5');
    expect(bufferValue(b)).toBe(-5);
  });
  it('± bascule le signe', () => expect(tape(['4', '±', '±']).text).toBe('4'));
  it('« - » seul vaut 0', () => expect(bufferValue(tape(['±']))).toBe(0));
  it('« -0 » vaut 0 (pas -0)', () => expect(Object.is(bufferValue({ text: '-0', replace: false }), 0)).toBe(true));
  it('vide vaut 0', () => expect(bufferValue({ text: '', replace: false })).toBe(0));
  it('⌫ sur vide ne fait rien', () => expect(tape(['⌫']).text).toBe(''));
  it('⌫ retire le dernier caractère', () => expect(tape(['1', '2', '⌫']).text).toBe('1'));
  it('un chiffre remplace le texte en mode replace', () => {
    const b = applyKey({ text: '62', replace: true }, '8');
    expect(b).toEqual({ text: '8', replace: false });
  });
  it('⌫ vide le texte en mode replace', () => {
    expect(applyKey({ text: '62', replace: true }, '⌫')).toEqual({ text: '', replace: false });
  });
  it('retire les zéros de tête', () => expect(tape(['0', '7']).text).toBe('7'));
  it('garde un zéro seul et le signe avec les zéros de tête', () => {
    expect(tape(['0', '0']).text).toBe('0');
    expect(tape(['±', '0', '7']).text).toBe('-7');
  });
});
