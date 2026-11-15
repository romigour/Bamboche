<script lang="ts">
  import type { GameModule } from '../games/types';
  import { getSettings, setSetting } from '../lib/settings';
  import BigButton from '../lib/ui/BigButton.svelte';
  import Pills from '../lib/ui/Pills.svelte';
  import Screen from '../lib/ui/Screen.svelte';
  import Stepper from '../lib/ui/Stepper.svelte';

  let { game, onback }: { game: GameModule; onback: () => void } = $props();

  let values = $state(getSettings(game));

  function change(key: string, v: number) {
    setSetting(game.id, key, v);
    values = { ...values, [key]: v };
  }
  const unit = (u: string | undefined, n: number) => (u ? `${n} ${u}` : String(n));
</script>

<Screen color={game.color} eyebrow={game.name} title="Réglages du jeu" back={onback}>
  {#each game.settings as s (s.key)}
    <div class="field">
      <div class="label">{s.label}</div>
      {#if s.type === 'choice'}
        <Pills
          label={s.label}
          options={s.options.map((o) => ({ value: o, label: unit(s.unit, o) }))}
          value={values[s.key]}
          onchange={(v) => change(s.key, v)}
        />
      {:else}
        <Stepper value={values[s.key]} min={s.min} max={s.max} format={(n) => unit(s.unit, n)} onchange={(v) => change(s.key, v)} />
      {/if}
    </div>
  {/each}
  {#snippet footer()}
    <BigButton variant="pop" onclick={onback}>C'est bon</BigButton>
  {/snippet}
</Screen>

<style>
  .field { display: flex; flex-direction: column; gap: 8px; }
  .label { font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
</style>
