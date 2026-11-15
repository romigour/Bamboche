<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import PodiumView from '../../../lib/ui/PodiumView.svelte';
  import { deadTime } from './deadTime';

  /** Podium de la série : temps mort à l'ouverture, pour qu'un double tap sur « Terminer » ne déclenche pas « Retour à l'accueil ». */
  let { ranking, onreplay, onhome }: { ranking: ComponentProps<typeof PodiumView>['ranking']; onreplay: () => void; onhome: () => void } = $props();
  const guard = deadTime();
</script>

<PodiumView {ranking} onreplay={guard(onreplay)} onhome={guard(onhome)} />
