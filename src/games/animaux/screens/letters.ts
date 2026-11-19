/** Lettre et couleur de chaque proposition (A rose, B cyan, C violet, D orange, E vert, F lavande). */
const COLORS: [string, string][] = [
  ['var(--blindtest)', 'var(--blindtest-ombre)'],
  ['var(--hipster)', 'var(--hipster-ombre)'],
  ['var(--undercover)', 'var(--undercover-ombre)'],
  ['var(--timeup)', 'var(--timeup-ombre)'],
  ['var(--ok)', 'var(--ok-ombre)'],
  ['var(--texte-doux)', '#8c80b8'],
];

export function letter(i: number): { letter: string; bg: string; sh: string } {
  const [bg, sh] = COLORS[i % COLORS.length];
  return { letter: String.fromCharCode(65 + i), bg, sh };
}
