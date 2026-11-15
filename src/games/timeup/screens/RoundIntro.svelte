<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import { ROUND_RULES } from '../logic/game';

  let { round, rounds, onready }: { round: number; rounds: number; onready: () => void } = $props();
  const rule = $derived(ROUND_RULES[round as 1 | 2 | 3]);
  const ICON = { 1: 'users', 2: 'edit', 3: 'eyeoff' } as const;
  const others = $derived(([1, 2, 3] as const).filter((r) => r > round && r <= rounds));
</script>

<div class="page">
  <div class="steps" aria-label="Manche {round} sur {rounds}">
    {#each Array(rounds) as _, i}<span class:on={i < round}></span>{/each}
  </div>
  <div class="mid">
    <div class="eyebrow">Manche {round} sur {rounds}</div>
    <div class="circle"><Icon name={ICON[round as 1 | 2 | 3]} size={96} stroke={2} /></div>
    <h1>{rule.title}</h1>
    <p>{rule.rule}</p>
    {#if others.length}
      <div class="next">
        {#each others as r}
          <div class="row"><span class="n">{r}</span><span>{ROUND_RULES[r].title}</span></div>
        {/each}
      </div>
    {/if}
  </div>
  <BigButton variant="pop" onclick={onready}>C'est compris !</BigButton>
</div>

<style>
  .page {
    flex: 1;
    min-height: 100dvh;
    padding: calc(32px + env(safe-area-inset-top)) 24px calc(30px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    text-align: center;
  }
  .steps { display: flex; gap: 10px; }
  .steps span { width: 44px; height: 10px; border-radius: 999px; background: var(--surface-plus); }
  .steps span.on { background: var(--timeup); }
  .mid { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; width: 100%; }
  .eyebrow { font-size: 16px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: var(--texte-doux); }
  .circle {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: var(--timeup);
    box-shadow: 0 10px 0 var(--timeup-ombre);
    color: var(--nuit);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  h1 { font-size: 56px; line-height: 1; color: var(--timeup); }
  p { margin: 0; font-size: 19px; font-weight: 700; line-height: 1.45; max-width: 300px; }
  .next { display: flex; flex-direction: column; gap: 8px; width: 100%; }
  .row { display: flex; align-items: center; gap: 12px; background: var(--surface); border-radius: 16px; padding: 10px 14px; text-align: left; font-size: 15px; color: var(--texte-doux); font-weight: 700; }
  .n { font-family: var(--font-display); font-weight: 700; font-size: 18px; color: #8c80b8; width: 20px; }
</style>
