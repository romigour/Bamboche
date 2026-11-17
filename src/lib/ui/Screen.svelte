<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { GameColor } from '../../games/types';
  import IconButton from './IconButton.svelte';

  /** Écran standard : en-tête coloré arrondi (si `color`) puis contenu, pied collé en bas. */
  let {
    color,
    eyebrow,
    title,
    back,
    backLabel = 'Retour',
    actions,
    children,
    footer,
    fit = false,
  }: {
    color?: GameColor;
    eyebrow?: string;
    title?: string;
    back?: () => void;
    backLabel?: string;
    actions?: Snippet;
    children: Snippet;
    footer?: Snippet;
    /** Occupe exactement la hauteur de la fenêtre : le contenu défile, le pied reste visible. */
    fit?: boolean;
  } = $props();
</script>

<div class="screen" class:fit>
  {#if color || title || back}
    <header class:colored={!!color} style:--hc={color ? `var(--${color})` : undefined}>
      {#if back || actions}
        <div class="bar">
          {#if back}<IconButton icon="back" label={backLabel} onclick={back} tone={color ? 'onColor' : 'surface'} />{:else}<span></span>{/if}
          {#if actions}<div class="actions">{@render actions()}</div>{/if}
        </div>
      {/if}
      {#if eyebrow || title}
        <div class="titles">
          {#if eyebrow}<span class="eyebrow">{eyebrow}</span>{/if}
          {#if title}<h1>{title}</h1>{/if}
        </div>
      {/if}
    </header>
  {/if}
  <main>{@render children()}</main>
  {#if footer}<footer>{@render footer()}</footer>{/if}
</div>

<style>
  .screen { flex: 1; display: flex; flex-direction: column; min-height: 100dvh; }
  .screen.fit { flex: 0 0 auto; height: 100dvh; max-height: 100dvh; min-height: 0; }
  .screen.fit main { flex: 1 1 0; min-height: 0; overflow-y: auto; padding-block: 10px; }
  .screen.fit header { padding: calc(10px + env(safe-area-inset-top)) 20px 14px; gap: 6px; }
  .screen.fit h1 { font-size: 26px; }
  header {
    padding: calc(20px + env(safe-area-inset-top)) 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  header.colored { background: var(--hc); color: var(--nuit); border-radius: 0 0 32px 32px; }
  .bar { display: flex; justify-content: space-between; align-items: center; }
  .actions { display: flex; gap: 10px; }
  .titles { display: flex; flex-direction: column; gap: 2px; }
  .eyebrow { font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; }
  h1 { font-weight: 700; font-size: 32px; line-height: 1.05; }
  main { flex-grow: 1; padding: 18px 20px 16px; display: flex; flex-direction: column; gap: 16px; }
  footer { padding: 0 20px calc(18px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 12px; }
</style>
