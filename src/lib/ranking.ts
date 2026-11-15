/** Classement décroissant ; les ex æquo partagent le même rang (1, 1, 3…). */
export function rankScores(entries: { id: string; total: number }[]): { id: string; total: number; rank: number }[] {
  const sorted = [...entries].sort((a, b) => b.total - a.total);
  return sorted.map((e) => ({ ...e, rank: sorted.findIndex((x) => x.total === e.total) + 1 }));
}
