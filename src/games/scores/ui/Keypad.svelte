<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import { tap } from '../../../lib/feedback';
  import type { Key } from '../logic/keypad';

  let { onkey, onnext }: { onkey: (k: Key) => void; onnext: () => void } = $props();

  const keys: { key: Key; label?: string }[] = [
    { key: '1' }, { key: '2' }, { key: '3' },
    { key: '4' }, { key: '5' }, { key: '6' },
    { key: '7' }, { key: '8' }, { key: '9' },
    { key: '±', label: 'Changer le signe' }, { key: '0' }, { key: '⌫', label: 'Effacer' },
  ];

  function press(k: Key) {
    tap();
    onkey(k);
  }
</script>

<div class="pad">
  <div class="grid">
    {#each keys as { key, label } (key)}
      <button type="button" aria-label={label} onclick={() => press(key)}>{key}</button>
    {/each}
  </div>
  <BigButton variant="pop" onclick={onnext}>Suivant</BigButton>
</div>

<style>
  .pad { display: flex; flex-direction: column; gap: 10px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .grid button {
    min-height: 56px;
    border-radius: var(--radius-btn);
    background: var(--surface-plus);
    color: var(--texte);
    box-shadow: 0 4px 0 var(--secondary-ombre);
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 600;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }
  .grid button:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--secondary-ombre); }
</style>
