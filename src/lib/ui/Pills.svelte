<script lang="ts">
  import { tap } from '../feedback';

  let {
    options,
    value,
    onchange,
    label,
  }: {
    options: { value: number; label: string }[];
    value: number;
    onchange: (v: number) => void;
    label?: string;
  } = $props();
</script>

<div class="pills" role="group" aria-label={label} style:grid-template-columns="repeat({options.length}, minmax(0, 1fr))">
  {#each options as o (o.value)}
    <button
      type="button"
      aria-pressed={o.value === value}
      onclick={() => {
        tap();
        onchange(o.value);
      }}>{o.label}</button
    >
  {/each}
</div>

<style>
  .pills { display: grid; gap: 8px; }
  button {
    height: 48px;
    border-radius: 999px;
    background: var(--surface-plus);
    color: var(--texte);
    font-weight: 800;
    font-size: 16px;
    box-shadow: 0 4px 0 var(--secondary-ombre);
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }
  /* Convention : la pastille choisie est blanche, jamais jaune (un seul jaune par écran). */
  button[aria-pressed='true'] { background: var(--texte); color: var(--nuit); box-shadow: 0 4px 0 #8c80b8; }
  button:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--secondary-ombre); }
</style>
