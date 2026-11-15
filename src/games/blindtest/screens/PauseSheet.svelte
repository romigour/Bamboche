<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import type { BlindtestState } from '../logic/game';

  /** Pause du Blindtest : scores, reprise, abandon (avec confirmation). */
  let {
    s,
    points,
    onresume,
    onquit,
  }: { s: BlindtestState; points: Record<string, number>; onresume: () => void; onquit: () => void } = $props();
  let confirmQuit = $state(false);
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Pause">
  <div class="sheet">
    <div class="grip"></div>
    <div class="head">
      <div class="ic"><Icon name="pause" size={28} stroke={3} /></div>
      <div class="ht">
        <h1>Pause</h1>
        <span class="sub">Extrait {s.current + 1} sur {s.queue.length}</span>
      </div>
    </div>
    {#if confirmQuit}
      <p class="confirm">Quitter la partie ? Les scores seront perdus.</p>
      <BigButton variant="ko" size="md" onclick={onquit}>Oui, quitter</BigButton>
      <BigButton variant="secondary" size="md" onclick={() => (confirmQuit = false)}>Non, on continue</BigButton>
    {:else}
      <div class="scores">
        {#each s.teams as t (t.id)}
          <div class="row">
            <span class="dot" style:background="var(--{t.color})">{t.name.replace(/^Les\s+/i, '').charAt(0)}</span>
            <span class="n">{t.name}</span>
            <span class="v">{points[t.id] ?? 0}</span>
          </div>
        {/each}
      </div>
      <BigButton variant="pop" onclick={onresume}><Icon name="play" size={22} />Reprendre</BigButton>
      <button type="button" class="quit" onclick={() => (confirmQuit = true)}>Quitter la partie</button>
    {/if}
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; background: rgba(15, 9, 32, 0.8); display: flex; flex-direction: column; justify-content: flex-end; z-index: 10; }
  .sheet {
    background: var(--surface);
    border-radius: 36px 36px 0 0;
    padding: 14px 20px calc(28px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-height: 90dvh;
    overflow-y: auto;
  }
  .grip { width: 48px; height: 6px; border-radius: 999px; background: var(--ligne); align-self: center; }
  .head { display: flex; align-items: center; gap: 14px; }
  .ic { width: 56px; height: 56px; border-radius: 18px; background: var(--surface-plus); display: flex; align-items: center; justify-content: center; }
  .ht { display: flex; flex-direction: column; }
  h1 { font-size: 30px; line-height: 1.05; }
  .sub { font-size: 15px; color: var(--texte-doux); font-weight: 700; }
  .scores { display: flex; flex-direction: column; gap: 8px; }
  .row { display: flex; gap: 12px; align-items: center; background: var(--nuit); border-radius: 18px; padding: 10px 14px; }
  .dot {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: var(--nuit);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .n { flex-grow: 1; font-family: var(--font-display); font-weight: 600; font-size: 18px; }
  .v { font-family: var(--font-display); font-weight: 700; font-size: 24px; color: var(--pop); }
  .quit {
    height: 52px;
    border-radius: 20px;
    border: 3px solid var(--ligne);
    color: var(--ko);
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 19px;
  }
  .confirm { margin: 0; text-align: center; font-weight: 800; font-size: 17px; }
</style>
