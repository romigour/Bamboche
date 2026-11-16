<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tap } from '../feedback';

  /** Une ligne entière qui bascule une option : icône facultative, libellé, explication, interrupteur à droite. */
  let {
    checked,
    label,
    description,
    icon,
    onchange,
  }: {
    checked: boolean;
    label: string;
    description?: string;
    icon?: Snippet;
    onchange: (v: boolean) => void;
  } = $props();

  const id = $props.id();
</script>

<button
  type="button"
  role="switch"
  class="row"
  aria-checked={checked}
  aria-labelledby="{id}-libelle"
  aria-describedby={description ? `${id}-explication` : undefined}
  onclick={() => {
    tap();
    onchange(!checked);
  }}
>
  {@render icon?.()}
  <span class="text">
    <span class="label" id="{id}-libelle">{label}</span>
    {#if description}<span class="description" id="{id}-explication">{description}</span>{/if}
  </span>
  <span class="track" aria-hidden="true"><span></span></span>
</button>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    background: var(--surface);
    color: var(--texte);
    border-radius: 18px;
    padding: 12px 14px;
    text-align: left;
  }
  .text { display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0; }
  .label { font-family: var(--font-display); font-weight: 600; font-size: 18px; }
  .description { font-size: 14px; color: var(--texte-doux); }
  .track {
    width: 60px;
    height: 36px;
    border-radius: 999px;
    background: var(--surface-plus);
    padding: 4px;
    display: flex;
    justify-content: flex-start;
    flex-shrink: 0;
    transition: background 0.15s ease;
  }
  .row[aria-checked='true'] .track { background: var(--ok); justify-content: flex-end; }
  .track span { width: 28px; height: 28px; border-radius: 50%; background: var(--nuit); }
</style>
