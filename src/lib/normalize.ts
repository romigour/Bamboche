/** Forme de comparaison d'un mot : minuscules, sans accents ni ponctuation, espaces réduits. */
export function normalizeWord(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('fr')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
