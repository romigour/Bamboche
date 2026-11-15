<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import IconButton from '../../../lib/ui/IconButton.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import { deadTime } from './deadTime';

  /** Vote : une grosse touche par candidat, puis confirmation de l'élimination. */
  let {
    candidates,
    onconfirm,
    onback,
    onpause,
  }: {
    candidates: { id: string; name: string }[];
    onconfirm: (id: string) => void;
    onback: () => void;
    onpause: () => void;
  } = $props();

  const guard = deadTime();
  let picked = $state<{ id: string; name: string } | null>(null);
  let confirmed = $state(false);

  const pick = (c: { id: string; name: string }) => guard(() => (picked = c));
  function confirm() {
    if (confirmed || !picked) return;
    confirmed = true;
    onconfirm(picked.id);
  }
</script>

<Screen color="undercover" title="Qui est éliminé ?" back={onback}>
  {#snippet actions()}
    <IconButton icon="pause" label="Pause" tone="onColor" onclick={onpause} />
  {/snippet}
  {#if picked}
    <p class="ask">Éliminer {picked.name} ?</p>
    <BigButton variant="ko" disabled={confirmed} onclick={confirm}>Oui, éliminer</BigButton>
    <BigButton variant="secondary" disabled={confirmed} onclick={() => (picked = null)}>Annuler</BigButton>
  {:else}
    <div class="grid">
      {#each candidates as c (c.id)}
        <button type="button" class="cand" onclick={pick(c)}>{c.name}</button>
      {/each}
    </div>
  {/if}
</Screen>

<style>
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .cand {
    min-height: 84px;
    padding: 0 10px;
    border-radius: 24px;
    background: var(--undercover);
    color: var(--nuit);
    box-shadow: 0 6px 0 var(--undercover-ombre);
    margin-bottom: 6px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 24px;
    overflow-wrap: anywhere;
  }
  .cand:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--undercover-ombre); }
  .ask { font-family: var(--font-display); font-weight: 700; font-size: 34px; line-height: 1.1; text-align: center; margin: 24px 0; overflow-wrap: anywhere; }
</style>
