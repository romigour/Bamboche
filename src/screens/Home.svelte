<script lang="ts">
  import { games } from '../games/registry';
  import type { GameModule } from '../games/types';
  import { tap } from '../lib/feedback';
  import GameCard from '../lib/ui/GameCard.svelte';
  import Icon from '../lib/ui/Icon.svelte';
  import IconButton from '../lib/ui/IconButton.svelte';

  let {
    playerCount,
    onopen,
    onplayers,
  }: { playerCount: number; onopen: (g: GameModule) => void; onplayers: () => void } = $props();

  const LOGO: [string, string][] = [
    ['B', 'pop'], ['a', 'timeup'], ['m', 'blindtest'], ['b', 'undercover'],
    ['o', 'hipster'], ['c', 'pop'], ['h', 'timeup'], ['e', 'blindtest'],
  ];
  const playersLabel = $derived(
    playerCount === 0 ? 'Ajoute les joueurs' : `${playerCount} joueur${playerCount > 1 ? 's' : ''}`,
  );
</script>

<div class="home">
  <div class="top">
    <div class="logo" aria-label="Bamboche">
      {#each LOGO as [l, c]}<span style:color="var(--{c})">{l}</span>{/each}
    </div>
    <IconButton icon="settings" label="Réglages" onclick={onplayers} />
  </div>

  <div class="hello">
    <h1>On joue à quoi ?</h1>
    <p>Choisis un jeu, passe le téléphone, amuse-toi.</p>
  </div>

  <div class="grid">
    {#each games as g (g.id)}
      <GameCard game={g} onclick={() => onopen(g)} />
    {/each}
  </div>

  <div class="grow"></div>

  <button
    type="button"
    class="players"
    onclick={() => {
      tap();
      onplayers();
    }}
  >
    <span class="pi"><Icon name="users" size={26} /></span>
    <span class="pt">
      <span class="t1">Joueurs de la soirée</span>
      <span class="t2">{playersLabel}</span>
    </span>
    <span class="chev"><Icon name="chevron" size={22} stroke={2.8} /></span>
  </button>
</div>

<style>
  .home {
    flex: 1;
    min-height: 100dvh;
    padding: calc(28px + env(safe-area-inset-top)) 20px calc(24px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .top { display: flex; justify-content: space-between; align-items: center; }
  .logo { font-family: var(--font-display); font-weight: 700; font-size: 38px; line-height: 1; display: flex; }
  .hello { display: flex; flex-direction: column; gap: 4px; }
  h1 { font-size: 30px; }
  p { margin: 0; font-size: 16px; color: var(--texte-doux); }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .grow { flex-grow: 1; }
  .players {
    background: var(--surface);
    border-radius: 22px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    text-align: left;
    transition: transform 0.08s ease;
  }
  .players:active { transform: scale(0.98); }
  .pi {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: var(--surface-plus);
    color: var(--pop);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .pt { flex-grow: 1; display: flex; flex-direction: column; gap: 2px; }
  .t1 { font-family: var(--font-display); font-weight: 600; font-size: 18px; }
  .t2 { font-size: 14px; color: var(--texte-doux); }
  .chev { color: var(--texte-doux); display: flex; }
</style>
