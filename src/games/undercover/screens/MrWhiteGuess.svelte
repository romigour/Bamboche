<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import { deadTime } from './deadTime';

  /** Mr White tente le mot des civils : le groupe juge, aucun mot n'est affiché. */
  let { name, onfound, onmissed }: { name: string; onfound: () => void; onmissed: () => void } = $props();

  const guard = deadTime();
</script>

<Screen color="undercover" title="{name} tente le mot des civils">
  <p class="hint">Il le dit à voix haute. Vous jugez.</p>
  {#snippet footer()}
    <BigButton variant="ok" size="action" onclick={guard(onfound)}>Trouvé</BigButton>
    <BigButton variant="ko" size="action" onclick={guard(onmissed)}>Raté</BigButton>
  {/snippet}
</Screen>

<style>
  .hint { font-size: 22px; font-weight: 700; text-align: center; margin-top: 24px; }
</style>
