<script lang="ts">
  import type { GameColor } from '../../games/types';

  let { ratio, color = 'timeup' }: { ratio: number; color?: GameColor } = $props();
  const clamped = $derived(Math.max(0, Math.min(1, ratio)));
</script>

<div class="track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped * 100)}>
  <div class="fill" class:low={clamped <= 0.17} style:width="{clamped * 100}%" style:--c="var(--{color})"></div>
</div>

<style>
  .track { height: 14px; border-radius: 999px; background: var(--surface-plus); overflow: hidden; }
  .fill { height: 100%; border-radius: 999px; background: var(--c); transition: width 0.25s linear; }
  .low { background: var(--ko); }
</style>
