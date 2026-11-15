<script lang="ts">
  import type { Snippet } from 'svelte';
  import BigButton from './BigButton.svelte';

  /** Écran plein aplat à la couleur d'une équipe, avec un bouton nuit. */
  let {
    color,
    eyebrow,
    title,
    subtitle,
    actionLabel,
    onaction,
    top,
    children,
  }: {
    color: string;
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    actionLabel: string;
    onaction: () => void;
    top?: Snippet;
    children?: Snippet;
  } = $props();
</script>

<div class="tr" style:background={color}>
  {#if top}<div class="top">{@render top()}</div>{/if}
  <div class="mid">
    {#if eyebrow}<span class="eyebrow">{eyebrow}</span>{/if}
    {#if title}<h1>{title}</h1>{/if}
    {#if subtitle}<p>{subtitle}</p>{/if}
    {#if children}{@render children()}{/if}
  </div>
  <BigButton variant="nuit" size="lg" onclick={onaction}>{actionLabel}</BigButton>
</div>

<style>
  .tr {
    flex: 1;
    min-height: 100dvh;
    color: var(--nuit);
    padding: calc(28px + env(safe-area-inset-top)) 20px calc(26px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .top { display: flex; justify-content: space-between; align-items: center; }
  .mid {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 12px;
  }
  .eyebrow { font-size: 15px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; }
  h1 { font-weight: 700; font-size: 46px; line-height: 1.02; }
  p { margin: 0; font-size: 18px; font-weight: 700; max-width: 300px; }
</style>
