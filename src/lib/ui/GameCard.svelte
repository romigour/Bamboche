<script lang="ts">
  import type { GameModule } from '../../games/types';
  import { tap } from '../feedback';
  import Icon from './Icon.svelte';

  let { game, onclick }: { game: GameModule; onclick?: () => void } = $props();
  const soon = $derived(game.status === 'bientot');
</script>

{#if soon}
  <div class="card soon" style:--accent="var(--{game.color})" aria-label="{game.name}, bientôt disponible">
    <div class="badge"><Icon name={game.icon} size={30} /></div>
    <div class="grow"></div>
    <div class="name">{game.name}</div>
    <div class="meta accent">Bientôt</div>
  </div>
{:else}
  <button
    type="button"
    class="card"
    style:--bg="var(--{game.color})"
    style:--sh="var(--{game.color}-ombre)"
    onclick={() => {
      tap();
      onclick?.();
    }}
  >
    <div class="badge"><Icon name={game.icon} size={30} /></div>
    <div class="grow"></div>
    <div class="name">{game.name}</div>
    <div class="meta">{game.players.min} joueurs et +</div>
  </button>
{/if}

<style>
  .card {
    height: 176px;
    border-radius: var(--radius-card);
    padding: 18px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    text-align: left;
    background: var(--bg);
    color: var(--nuit);
    box-shadow: 0 6px 0 var(--sh);
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }
  button.card:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--sh); }
  .badge {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: rgba(26, 16, 51, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .grow { flex-grow: 1; }
  .name { font-family: var(--font-display); font-weight: 700; font-size: 24px; line-height: 1; }
  .meta { font-size: 13px; font-weight: 800; }
  .soon {
    background: var(--surface);
    border: 3px dashed var(--ligne);
    padding: 15px;
    color: var(--texte-doux);
    box-shadow: none;
  }
  .soon .badge { background: var(--surface-plus); color: var(--accent); }
  .soon .name { color: var(--texte); }
  .accent { color: var(--accent); }
</style>
