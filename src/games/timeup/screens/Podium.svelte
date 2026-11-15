<script lang="ts">
  import PodiumView from '../../../lib/ui/PodiumView.svelte';
  import { totals, type TimeUpState } from '../logic/game';

  let { s, onreplay, onhome }: { s: TimeUpState; onreplay: () => void; onhome: () => void } = $props();

  const ranking = $derived(
    totals(s).map((r) => {
      const t = s.teams.find((x) => x.id === r.teamId)!;
      return { id: r.teamId, name: t.name, color: t.color, total: r.total, rank: r.rank };
    }),
  );
</script>

<PodiumView {ranking} {onreplay} {onhome} />
