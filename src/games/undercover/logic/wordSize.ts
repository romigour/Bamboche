/** Budget de largeur (px) pour un mot : 375 px d'écran moins les marges, avec une réserve. */
const BUDGET = 320;
/** Largeur moyenne d'un caractère de Fredoka 700, en em. */
const CHAR_EM = 0.62;

/** Taille (px) du mot secret : la plus grande qui tient sur une ligne pour son plus long segment sans espace. */
export function wordFontSize(word: string): number {
  const longest = Math.max(1, ...word.split(/\s+/).map((s) => s.length));
  return Math.max(36, Math.min(96, Math.floor(BUDGET / (longest * CHAR_EM))));
}
