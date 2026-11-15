<script lang="ts">
  import type { GameModule } from '../games/types';
  import BigButton from '../lib/ui/BigButton.svelte';
  import Icon from '../lib/ui/Icon.svelte';

  /** « Une partie est en cours » : proposée sur l'accueil au lancement. */
  let {
    game,
    lines,
    onresume,
    onabandon,
  }: { game: GameModule; lines: string[]; onresume: () => void; onabandon: () => void } = $props();
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="resume-title">
  <div class="sheet">
    <div class="grip"></div>
    <h1 id="resume-title">Une partie est en cours</h1>
    <div class="card" style:--bg="var(--{game.color})" style:--sh="var(--{game.color}-ombre)">
      <div class="ic"><Icon name={game.icon} size={30} /></div>
      <div class="txt">
        <span class="t">{lines[0]}</span>
        {#each lines.slice(1) as l}<span class="l">{l}</span>{/each}
      </div>
    </div>
    <BigButton variant="pop" onclick={onresume}><Icon name="play" size={22} />Reprendre la partie</BigButton>
    <button type="button" class="quit" onclick={onabandon}>Abandonner</button>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; background: rgba(15, 9, 32, 0.65); display: flex; flex-direction: column; justify-content: flex-end; z-index: 10; }
  .sheet {
    background: var(--surface);
    border-radius: 36px 36px 0 0;
    padding: 14px 20px calc(32px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .grip { width: 48px; height: 6px; border-radius: 999px; background: var(--ligne); align-self: center; }
  h1 { font-size: 30px; text-align: center; }
  .card {
    background: var(--bg);
    color: var(--nuit);
    border-radius: 24px;
    box-shadow: 0 6px 0 var(--sh);
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 6px;
  }
  .ic { width: 56px; height: 56px; border-radius: 18px; background: rgba(26, 16, 51, 0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .txt { display: flex; flex-direction: column; gap: 2px; }
  .t { font-family: var(--font-display); font-weight: 700; font-size: 22px; line-height: 1.1; }
  .l { font-size: 15px; font-weight: 800; }
  .quit {
    height: 52px;
    border-radius: 20px;
    border: 3px solid var(--ligne);
    color: var(--ko);
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 19px;
  }
</style>
