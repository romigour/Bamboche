<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import type { Role } from '../logic/game';
  import { deadTime } from './deadTime';

  /** Révélation du rôle du joueur éliminé. */
  let { name, role, oncontinue }: { name: string; role: Role; oncontinue: () => void } = $props();

  const LABEL: Record<Role, string> = { civil: 'Civil', undercover: 'Undercover', mrwhite: 'Mr White' };
  const guard = deadTime();
</script>

<Screen color="undercover">
  <div class="center">
    <p class="who">{name} était…</p>
    <p class="role">{LABEL[role]}</p>
  </div>
  {#snippet footer()}
    <BigButton variant="pop" onclick={guard(oncontinue)}>Continuer</BigButton>
  {/snippet}
</Screen>

<style>
  .center { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
  .who { font-size: 24px; font-weight: 800; overflow-wrap: anywhere; }
  .role { font-family: var(--font-display); font-weight: 700; font-size: 64px; line-height: 1; overflow-wrap: anywhere; }
</style>
