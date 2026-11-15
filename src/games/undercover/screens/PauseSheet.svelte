<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import { alive, type UndercoverState } from '../logic/game';

  /** Pause de l'Undercover : reprise, revoir son mot, scores, abandon (avec confirmation). */
  let {
    s,
    onresume,
    onreveal,
    onquit,
  }: { s: UndercoverState; onresume: () => void; onreveal: (id: string) => void; onquit: () => void } = $props();
  let confirmQuit = $state(false);
  let picking = $state(false);

  const inPlay = $derived(s.players.filter((p) => alive(s).includes(p.id)));
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Pause">
  <div class="sheet">
    <div class="grip"></div>
    <div class="head">
      <div class="ic"><Icon name="pause" size={28} stroke={3} /></div>
      <div class="ht">
        <h1>Pause</h1>
        <span class="sub">Partie {s.gameNumber}</span>
      </div>
    </div>
    {#if confirmQuit}
      <p class="confirm">Quitter la série ? Les scores seront perdus.</p>
      <BigButton variant="ko" size="md" onclick={onquit}>Oui, quitter</BigButton>
      <BigButton variant="secondary" size="md" onclick={() => (confirmQuit = false)}>Non, on continue</BigButton>
    {:else}
      <div class="scores">
        {#each s.players as p (p.id)}
          <div class="row">
            <span class="n">{p.name}</span>
            <span class="v">{s.totals[p.id] ?? 0}</span>
          </div>
        {/each}
      </div>
      <BigButton variant="pop" onclick={onresume}><Icon name="play" size={22} />Reprendre</BigButton>
      <button type="button" class="act" onclick={() => (picking = !picking)} aria-expanded={picking}>Revoir mon mot</button>
      {#if picking}
        <div class="pick">
          {#each inPlay as p (p.id)}
            <button type="button" class="act" onclick={() => onreveal(p.id)}>{p.name}</button>
          {/each}
        </div>
      {/if}
      <button type="button" class="act quit" onclick={() => (confirmQuit = true)}>Quitter la série</button>
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
  .grip { width: 48px; height: 6px; border-radius: 999px; background: var(--ligne); align-self: center; flex-shrink: 0; }
  .head { display: flex; align-items: center; gap: 14px; }
  .ic { width: 56px; height: 56px; border-radius: 18px; background: var(--surface-plus); display: flex; align-items: center; justify-content: center; }
  .ht { display: flex; flex-direction: column; }
  h1 { font-size: 30px; line-height: 1.05; }
  .sub { font-size: 15px; color: var(--texte-doux); font-weight: 700; }
  .scores { display: flex; flex-direction: column; gap: 8px; }
  .row { display: flex; gap: 12px; align-items: center; background: var(--nuit); border-radius: 18px; padding: 10px 14px; }
  .n { flex: 1; min-width: 0; font-family: var(--font-display); font-weight: 600; font-size: 18px; overflow-wrap: anywhere; }
  .v { font-family: var(--font-display); font-weight: 700; font-size: 24px; color: var(--pop); }
  .pick { display: flex; flex-direction: column; gap: 8px; }
  .act {
    min-height: 56px;
    padding: 6px 14px;
    border-radius: 20px;
    border: 3px solid var(--ligne);
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 19px;
    overflow-wrap: anywhere;
  }
  .quit { color: var(--ko); }
  .confirm { margin: 0; text-align: center; font-weight: 800; font-size: 17px; }
</style>
