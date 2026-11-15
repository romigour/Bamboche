<script lang="ts">
  import { rankScores } from '../../../lib/ranking';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import type { UndercoverState } from '../logic/game';
  import { deadTime } from './deadTime';

  /** Scores de la série après une partie. */
  let { s, onnext, onfinish }: { s: UndercoverState; onnext: () => void; onfinish: () => void } = $props();

  const guard = deadTime();
  const name = (id: string) => s.players.find((p) => p.id === id)?.name ?? '';
  const rows = $derived(rankScores(s.players.map((p) => ({ id: p.id, total: s.totals[p.id] ?? 0 }))));
</script>

<Screen color="undercover" title="Scores après {s.gameNumber} {s.gameNumber > 1 ? 'parties' : 'partie'}">
  <ol>
    {#each rows as r (r.id)}
      <li>
        <span class="rk">{r.rank}</span>
        <span class="n">{name(r.id)}</span>
        <span class="t">{r.total}</span>
        <span class="g">+{s.gained[r.id] ?? 0}</span>
      </li>
    {/each}
  </ol>
  {#snippet footer()}
    <BigButton variant="pop" onclick={guard(onnext)}>Partie suivante</BigButton>
    <BigButton variant="secondary" size="md" onclick={guard(onfinish)}>Terminer</BigButton>
  {/snippet}
</Screen>

<style>
  ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  li { display: flex; align-items: center; gap: 10px; min-height: 56px; background: var(--surface); border-radius: 18px; padding: 8px 14px; }
  .rk { font-family: var(--font-display); font-weight: 700; font-size: 22px; width: 2ch; color: var(--texte-doux); }
  .n { flex: 1; min-width: 0; font-family: var(--font-display); font-weight: 600; font-size: 18px; overflow-wrap: anywhere; }
  .t { font-family: var(--font-display); font-weight: 700; font-size: 24px; color: var(--pop); }
  .g { font-size: 14px; font-weight: 800; color: var(--texte-doux); min-width: 3ch; text-align: right; }
</style>
