<script lang="ts">
  import { navigate } from '../../../lib/router';
  import { TEAM_COLORS } from '../../../lib/teams';
  import PodiumView, { type PodiumEntry } from '../../../lib/ui/PodiumView.svelte';
  import { scoreGameById } from '../defs';
  import { ranks, totals } from '../logic/sheet';
  import { replay, scoreHistory } from '../session';

  /** Classement d'une partie terminée (lue dans l'historique). */
  let { id }: { id: string } = $props();

  const entry = $derived($scoreHistory.find((g) => g.id === id));
  const def = $derived(entry ? scoreGameById(entry.gameId) : undefined);

  $effect(() => {
    if (!entry || !def) navigate('/scores');
  });

  const ranking = $derived.by((): PodiumEntry[] => {
    if (!entry || !def) return [];
    const tot = totals(entry);
    const rk = ranks(def, tot);
    return entry.participants
      .map((p, i) => ({
        id: p.id,
        name: p.name,
        color: TEAM_COLORS[i % TEAM_COLORS.length],
        total: tot[i],
        rank: rk[i],
      }))
      .sort((a, b) => a.rank - b.rank);
  });
</script>

{#if entry && ranking.length}
  <PodiumView {ranking} onreplay={() => replay(entry, Date.now())} onhome={() => navigate('/')} />
{/if}
