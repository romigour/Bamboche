<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import IconButton from '../../../lib/ui/IconButton.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';

  /** Tour de parole : qui commence, puis l'ordre de table. */
  let {
    round,
    order,
    onvote,
    onpause,
  }: {
    round: number;
    order: { id: string; name: string }[];
    onvote: () => void;
    onpause: () => void;
  } = $props();
</script>

<Screen color="undercover" title="Manche {round}">
  {#snippet actions()}
    <IconButton icon="pause" label="Pause" tone="onColor" onclick={onpause} />
  {/snippet}
  <p class="first">{order[0]?.name} commence</p>
  <ol>
    {#each order as p (p.id)}<li>{p.name}</li>{/each}
  </ol>
  {#snippet footer()}
    <BigButton variant="pop" onclick={onvote}>Passer au vote</BigButton>
  {/snippet}
</Screen>

<style>
  .first { font-family: var(--font-display); font-weight: 700; font-size: 38px; line-height: 1.05; text-align: center; overflow-wrap: anywhere; }
  ol { margin: 0; padding-left: 36px; display: flex; flex-direction: column; gap: 8px; font-size: 22px; font-weight: 700; }
  li { overflow-wrap: anywhere; }
</style>
