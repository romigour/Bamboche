<script lang="ts">
  import { tap } from '../feedback';

  let {
    value,
    min,
    max,
    format = (n: number) => String(n),
    onchange,
    lessLabel = 'Moins',
    moreLabel = 'Plus',
    step: stepSize = 1,
  }: {
    value: number;
    min: number;
    max: number;
    format?: (n: number) => string;
    onchange: (n: number) => void;
    lessLabel?: string;
    moreLabel?: string;
    step?: number;
  } = $props();

  function step(d: number) {
    const next = Math.min(max, Math.max(min, value + d * stepSize));
    if (next !== value) {
      tap();
      onchange(next);
    }
  }
</script>

<div class="stepper">
  <button type="button" aria-label={lessLabel} disabled={value <= min} onclick={() => step(-1)}>−</button>
  <div class="val" aria-live="polite">{format(value)}</div>
  <button type="button" aria-label={moreLabel} disabled={value >= max} onclick={() => step(1)}>+</button>
</div>

<style>
  .stepper {
    flex-grow: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border-radius: 18px;
    padding: 6px;
  }
  button {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: var(--surface-plus);
    color: var(--texte);
    box-shadow: 0 4px 0 var(--secondary-ombre);
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 600;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }
  button:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 var(--secondary-ombre); }
  button:disabled { opacity: 0.35; }
  .val { flex-grow: 1; text-align: center; font-family: var(--font-display); font-weight: 700; font-size: 20px; }
</style>
