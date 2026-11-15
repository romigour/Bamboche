<script lang="ts">
  import { ICONS, type IconName } from './icons';

  let { name, size = 24, stroke = 2.5 }: { name: IconName; size?: number; stroke?: number } = $props();
  const icon = $derived(ICONS[name]);
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill={icon.fill ? 'currentColor' : 'none'}
  stroke={icon.fill ? 'none' : 'currentColor'}
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if icon.d}<path d={icon.d} />{/if}
  {#each icon.circles ?? [] as [cx, cy, r]}<circle {cx} {cy} {r} />{/each}
</svg>
