<script lang="ts">
  import { navigate } from '../../../lib/router';
  import Pills from '../../../lib/ui/Pills.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import { fmt, scoreGames } from '../defs';
  import { totals } from '../logic/sheet';
  import { playerStats, winners, type FinishedGame } from '../logic/stats';
  import { scoreHistory } from '../session';

  /** Historique et bilans, jeu par jeu. */
  let { gameId }: { gameId?: string } = $props();

  let picked = $state<number | null>(null);

  const defaultIndex = $derived.by(() => {
    const fromProp = scoreGames.findIndex((g) => g.id === gameId);
    if (fromProp >= 0) return fromProp;
    const last = $scoreHistory.reduce<FinishedGame | null>((best, g) => (!best || g.finishedAt >= best.finishedAt ? g : best), null);
    const i = last ? scoreGames.findIndex((g) => g.id === last.gameId) : -1;
    return i >= 0 ? i : 0;
  });
  const index = $derived(picked ?? defaultIndex);
  const def = $derived(scoreGames[index]);

  const games = $derived($scoreHistory.filter((g) => g.gameId === def.id).sort((a, b) => b.finishedAt - a.finishedAt));
  const stats = $derived(playerStats($scoreHistory, def.id));

  function pick(i: number) {
    picked = i;
    navigate('/scores/historique', { jeu: scoreGames[i].id });
  }

  const date = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

  function line(g: FinishedGame) {
    const tot = totals(g);
    const won = new Set(winners(g));
    return {
      scores: g.participants.map((p, i) => `${p.name} ${fmt(tot[i])}`).join(' – '),
      winner: g.participants.filter((p) => won.has(p.id)).map((p) => p.name).join(', '),
    };
  }
</script>

<Screen color="hipster" title="Historique et bilans" back={() => navigate('/scores')} backLabel="Retour à la feuille de score">
  <Pills label="Jeu" options={scoreGames.map((g, i) => ({ value: i, label: g.short }))} value={index} onchange={pick} />

  {#if games.length === 0}
    <p class="empty">Aucune partie de {def.name} terminée pour l'instant.</p>
  {:else}
    <h2>Bilans · {plural(games.length, 'partie')}</h2>
    <ul class="stats">
      {#each stats as s, i (s.key)}
        <li>
          <span class="who">{i + 1}. {s.name}</span>
          <span class="wins">{plural(s.wins, 'victoire')} / {s.played}</span>
          <span class="pct">{s.pct} %</span>
        </li>
      {/each}
    </ul>

    <h2>Parties</h2>
    <div class="games">
      {#each games as g (g.id)}
        {@const l = line(g)}
        <button type="button" class="game" onclick={() => navigate('/scores/historique/partie', { id: g.id })}>
          <span class="date">{date(g.finishedAt)}</span>
          <span class="scores">{l.scores}</span>
          <span class="winner">🏆 {l.winner}</span>
        </button>
      {/each}
    </div>
  {/if}
</Screen>

<style>
  h2 { margin: 6px 0 0; font-family: var(--font-display); font-size: 18px; font-weight: 700; }
  .empty { margin: 24px 0; text-align: center; font-weight: 700; color: var(--texte-doux); }
  .stats { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .stats li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 8px 16px;
    border-radius: 18px;
    background: var(--surface);
    font-weight: 700;
  }
  .who { flex: 1; font-family: var(--font-display); font-size: 18px; }
  .wins { font-size: 14px; color: var(--texte-doux); }
  .pct { min-width: 54px; text-align: right; }
  .games { display: flex; flex-direction: column; gap: 8px; }
  .game {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 64px;
    padding: 10px 16px;
    border-radius: 18px;
    background: var(--surface);
    text-align: left;
  }
  .date { font-size: 13px; font-weight: 800; color: var(--texte-doux); }
  .scores { font-weight: 700; font-size: 16px; }
  .winner { font-weight: 800; font-size: 15px; }
</style>
