<script lang="ts">
  import { tap } from '../feedback';
  import Icon from './Icon.svelte';
  import type { IconName } from './icons';

  let {
    icon,
    label,
    onclick,
    tone = 'surface',
    size = 52,
  }: {
    icon: IconName;
    label: string;
    onclick?: () => void;
    /** surface : rond violet avec ombre ; onColor : voile sombre sur un en-tête coloré */
    tone?: 'surface' | 'onColor';
    size?: number;
  } = $props();
</script>

<button
  type="button"
  class="ib {tone}"
  style:width="{size}px"
  style:height="{size}px"
  aria-label={label}
  onclick={() => {
    tap();
    onclick?.();
  }}
>
  <Icon name={icon} size={Math.round(size * 0.48)} stroke={2.8} />
</button>

<style>
  .ib {
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }
  .surface { background: var(--surface-plus); color: var(--texte); box-shadow: 0 5px 0 var(--secondary-ombre); }
  .surface:active { transform: translateY(3px); box-shadow: 0 2px 0 var(--secondary-ombre); }
  .onColor { background: rgba(26, 16, 51, 0.15); color: var(--nuit); }
  .onColor:active { transform: scale(0.94); }
</style>
