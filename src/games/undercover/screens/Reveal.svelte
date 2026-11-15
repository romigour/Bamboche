<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import type { Role } from '../logic/game';
  import { wordFontSize } from '../logic/wordSize';
  import { deadTime } from './deadTime';

  /** Révélation du rôle du joueur éliminé. */
  let { name, role, oncontinue }: { name: string; role: Role; oncontinue: () => void } = $props();

  const LABEL: Record<Role, string> = { civil: 'Civil', undercover: 'Undercover', mrwhite: 'Mr White' };
  const guard = deadTime();
  /** Même budget de largeur que le mot secret : « Undercover » ne doit jamais être coupé. */
  const roleSize = $derived(Math.min(64, wordFontSize(LABEL[role])));
</script>

<Screen color="undercover" eyebrow="Révélation">
  <div class="center">
    <p class="who">{name} était…</p>
    <p class="role" style:font-size="{roleSize}px">{LABEL[role]}</p>
  </div>
  {#snippet footer()}
    <BigButton variant="pop" onclick={guard(oncontinue)}>Continuer</BigButton>
  {/snippet}
</Screen>

<style>
  .center { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
  .who { font-size: 24px; font-weight: 800; overflow-wrap: anywhere; }
  .role { font-family: var(--font-display); font-weight: 700; line-height: 1; overflow-wrap: normal; }
</style>
