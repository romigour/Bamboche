<script lang="ts">
  import { get } from 'svelte/store';
  import { navigate } from '../../../lib/router';
  import { TEAM_COLORS } from '../../../lib/teams';
  import PodiumView, { type PodiumEntry } from '../../../lib/ui/PodiumView.svelte';
  import { scoreGameById } from '../defs';
  import { ranks, totals } from '../logic/sheet';
  import { abandonSheet, currentSheet, replay, scoreHistory } from '../session';
  import ReplaceConfirm from '../ui/ReplaceConfirm.svelte';

  /** Classement d'une partie terminée (lue dans l'historique). */
  let { id }: { id: string } = $props();

  const entry = $derived($scoreHistory.find((g) => g.id === id));
  const def = $derived(entry ? scoreGameById(entry.gameId) : undefined);

  $effect(() => {
    if (!entry || !def) navigate('/scores');
  });

  let asking = $state(false);

  function onreplay() {
    if (!entry) return;
    // Une feuille est déjà en cours : on ne l'écrase qu'avec l'accord du joueur.
    if (get(currentSheet)) asking = true;
    else replay(entry, Date.now());
  }

  function replace() {
    asking = false;
    abandonSheet();
    if (entry) replay(entry, Date.now());
  }

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
  <PodiumView {ranking} {onreplay} onhome={() => navigate('/')} />
  {#if asking && $currentSheet}
    <ReplaceConfirm
      gameName={scoreGameById($currentSheet.gameId)?.name ?? ''}
      onconfirm={replace}
      oncancel={() => (asking = false)}
    />
  {/if}
{/if}
