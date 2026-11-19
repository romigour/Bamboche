<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { GameColor } from '../../games/types';
  import { tap } from '../feedback';

  export type ButtonVariant = GameColor | 'secondary' | 'ghost' | 'nuit';

  let {
    variant = 'pop',
    size = 'lg',
    disabled = false,
    onclick,
    children,
    label,
  }: {
    variant?: ButtonVariant;
    size?: 'md' | 'lg' | 'action';
    disabled?: boolean;
    onclick?: () => void;
    children: Snippet;
    label?: string;
  } = $props();

  function handle() {
    if (disabled) return;
    tap();
    onclick?.();
  }
</script>

<button type="button" class="big {size} v-{variant}" {disabled} aria-label={label} onclick={handle}>
  {@render children()}
</button>

<style>
  .big {
    --bg: var(--pop);
    --sh: var(--pop-ombre);
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-radius: var(--radius-btn);
    background: var(--bg);
    color: var(--nuit);
    font-family: var(--font-display);
    font-weight: 700;
    box-shadow: 0 var(--shadow-depth) 0 var(--sh);
    transition: transform 0.08s ease, box-shadow 0.08s ease;
    margin-bottom: var(--shadow-depth);
  }
  .big:active:not(:disabled) {
    transform: translateY(var(--press-depth));
    box-shadow: 0 calc(var(--shadow-depth) - var(--press-depth)) 0 var(--sh);
  }
  .big:disabled { opacity: 0.4; cursor: default; }
  .md { height: 56px; font-size: 20px; font-weight: 600; }
  .lg { height: 64px; font-size: 24px; }
  .action { height: 100px; font-size: 30px; border-radius: 28px; }

  .v-timeup { --bg: var(--timeup); --sh: var(--timeup-ombre); }
  .v-blindtest { --bg: var(--blindtest); --sh: var(--blindtest-ombre); }
  .v-hipster { --bg: var(--hipster); --sh: var(--hipster-ombre); }
  .v-undercover { --bg: var(--undercover); --sh: var(--undercover-ombre); }
  .v-animaux { --bg: var(--animaux); --sh: var(--animaux-ombre); }
  .v-ok { --bg: var(--ok); --sh: var(--ok-ombre); }
  .v-ko { --bg: var(--ko); --sh: var(--ko-ombre); }
  .v-secondary { --bg: var(--secondary); --sh: var(--secondary-ombre); color: var(--texte); }
  .v-nuit { --bg: var(--nuit); --sh: rgba(0, 0, 0, 0.35); color: var(--texte); }
  .v-ghost {
    background: transparent;
    border: 3px solid var(--ligne);
    color: var(--texte);
    box-shadow: none;
    margin-bottom: 0;
  }
  .v-ghost:active:not(:disabled) { box-shadow: none; }
</style>
