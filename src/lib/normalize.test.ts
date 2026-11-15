import { expect, test } from 'vitest';
import { normalizeWord } from './normalize';

test('minuscules, accents et ponctuation retirés', () => expect(normalizeWord('  Astérix !  ')).toBe('asterix'));
test('tirets et espaces multiples réduits', () => expect(normalizeWord('Jean-Paul  Belmondo')).toBe('jean paul belmondo'));
test('apostrophes et cédilles', () => expect(normalizeWord("L'Arc de Triomphe Ça")).toBe('l arc de triomphe ca'));
test('vide reste vide', () => expect(normalizeWord('  ?! ')).toBe(''));
