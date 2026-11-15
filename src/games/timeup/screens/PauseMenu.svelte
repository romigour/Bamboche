<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import { ROUND_RULES, timeLeft, totals, type TimeUpState } from '../logic/game';

  /** Feuille de pause : scores, règle de la manche, reprise ou abandon (avec confirmation). */
  let { s, onresume, onquit }: { s: TimeUpState; onresume: () => void; onquit: () => void } = $props();

  let showRule = $state(false);
  let confirmQuit = $state(false);
  const team = $derived(s.teams[s.currentTeam]);
  const scores = $derived(Object.fromEntries(totals(s).map((t) => [t.teamId, t.total])));
  const left = $derived(Math.ceil(timeLeft(s, Date.now()) / 1000));
  const rule = $derived(ROUND_RULES[s.round as 1 | 2 | 3]);
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Pause">
  <div class="behind">
    {#if s.phase === 'turn'}
      <div class="clock">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</div>
      <div class="eyebrow">Chrono arrêté</div>
    {/if}
  </div>
  <div class="sheet">
    <div class="grip"></div>
    <div class="head">
      <div class="ic"><Icon name="pause" size={28} stroke={3} /></div>
      <div class="ht">
        <h1>Pause</h1>
        <span class="sub">Manche {s.round} · {team.name} jouent</span>
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
            <span class="v">{scores[t.id]}</span>
          </div>
        {/each}
      </div>
      {#if showRule}
        <div class="rule"><strong>{rule.title}</strong> — {rule.rule}</div>
      {/if}
      <BigButton variant="pop" onclick={onresume}><Icon name="play" size={22} />Reprendre</BigButton>
      <BigButton variant="secondary" size="md" onclick={() => (showRule = !showRule)}>{showRule ? 'Masquer la règle' : 'Revoir la règle'}</BigButton>
      <button type="button" class="quit" onclick={() => (confirmQuit = true)}>Quitter la partie</button>
    {/if}
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; background: #0f0920; display: flex; flex-direction: column; justify-content: flex-end; z-index: 10; }
  .behind { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; opacity: 0.45; }
  .clock { font-family: var(--font-display); font-weight: 700; font-size: 84px; line-height: 1; color: var(--timeup); }
  .eyebrow { font-size: 15px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  .sheet {
    background: var(--surface);
    border-radius: 36px 36px 0 0;
    padding: 14px 20px calc(28px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 14px;
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
  .rule { background: var(--nuit); border-radius: 18px; padding: 12px 14px; font-weight: 700; color: var(--texte-doux); }
  .rule strong { color: var(--timeup); }
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
