<script lang="ts">
  import type { GameColor } from '../../games/types';
  import { shortName } from '../teams';
  import BigButton from './BigButton.svelte';
  import Icon from './Icon.svelte';

  export interface PodiumEntry {
    id: string;
    name: string;
    color: GameColor;
    total: number;
    rank: number;
  }

  /** Podium de fin de partie, partagé entre les jeux (ex æquo au même rang). */
  let { ranking, onreplay, onhome }: { ranking: PodiumEntry[]; onreplay: () => void; onhome: () => void } = $props();

  const team = (id: string) => ranking.find((t) => t.id === id)!;
  const winners = $derived(ranking.filter((r) => r.rank === 1));
  /** Podium : 2e à gauche, 1er au centre, 3e à droite ; les ex æquo gardent le même rang. */
  const podium = $derived.by(() => {
    const top = ranking.slice(0, 3);
    return top.length === 3 ? [top[1], top[0], top[2]] : top.length === 2 ? [top[1], top[0]] : top;
  });
  const rest = $derived(ranking.slice(3));
  const HEIGHT: Record<number, number> = { 1: 210, 2: 150, 3: 110 };
  const tie = $derived.by(() => {
    const counts = new Map<number, number>();
    for (const r of ranking) counts.set(r.rank, (counts.get(r.rank) ?? 0) + 1);
    const tied = [...counts].filter(([, n]) => n > 1).map(([rank]) => rank);
    if (!tied.length) return '';
    return tied[0] === 1 ? 'Égalité parfaite en tête !' : `Égalité pour la ${tied[0]}e place !`;
  });
  const title = $derived(
    winners.length === 1 ? `${winners[0].name} !` : winners.map((w) => shortName(w.name)).join(' et ') + ' !',
  );
</script>

<div class="page">
  <i class="c c1"></i><i class="c c2"></i><i class="c c3"></i><i class="c c4"></i><i class="c c5"></i>
  <div class="head">
    <span class="trophy"><Icon name="trophy" size={64} stroke={2} /></span>
    <span class="eyebrow">Et les gagnants sont…</span>
    <h1 style:color="var(--{team(winners[0].id).color})">{title}</h1>
  </div>

  <div class="podium">
    {#each podium as r (r.id)}
      {@const t = team(r.id)}
      <div class="col">
        <span class="name">{shortName(t.name)}</span>
        <div class="block" style:height="{HEIGHT[Math.min(r.rank, 3)]}px" style:--bg="var(--{t.color})" style:--sh="var(--{t.color}-ombre)">
          <span class="rank" class:first={r.rank === 1}>{r.rank}</span>
          <span class="pts">{r.total} pts</span>
        </div>
      </div>
    {/each}
  </div>
  {#if rest.length}
    <div class="rest">
      {#each rest as r (r.id)}<span>{r.rank}. {team(r.id).name} · {r.total} pts</span>{/each}
    </div>
  {/if}
  {#if tie}<p class="tie">{tie}</p>{/if}

  <div class="actions">
    <BigButton variant="pop" onclick={onreplay}>Rejouer</BigButton>
    <BigButton variant="secondary" size="md" onclick={onhome}>Retour à l'accueil</BigButton>
  </div>
</div>

<style>
  .page {
    position: relative;
    flex: 1;
    min-height: 100dvh;
    padding: calc(28px + env(safe-area-inset-top)) 20px calc(26px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 18px;
    overflow: hidden;
  }
  .c { position: absolute; border-radius: 4px; animation: fall 3s ease-in-out infinite alternate; }
  .c1 { left: 30px; top: 40px; width: 14px; height: 14px; background: var(--pop); transform: rotate(20deg); }
  .c2 { right: 44px; top: 70px; width: 12px; height: 12px; border-radius: 50%; background: var(--hipster); animation-delay: 0.4s; }
  .c3 { left: 70px; top: 150px; width: 10px; height: 18px; background: var(--blindtest); animation-delay: 0.8s; }
  .c4 { right: 80px; top: 170px; width: 14px; height: 14px; background: var(--undercover); animation-delay: 1.2s; }
  .c5 { right: 26px; top: 230px; width: 10px; height: 10px; border-radius: 50%; background: var(--timeup); animation-delay: 1.6s; }
  @keyframes fall { to { translate: 0 18px; rotate: 40deg; } }
  .head { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; margin-top: 8px; }
  .trophy { color: var(--pop); display: flex; }
  .eyebrow { font-size: 14px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  h1 { font-size: 46px; line-height: 1; }
  .podium { flex-grow: 1; display: flex; align-items: flex-end; justify-content: center; gap: 10px; }
  .col { flex: 1 1 0; display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 0; }
  .name { font-family: var(--font-display); font-weight: 600; font-size: 17px; text-align: center; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .block {
    width: 100%;
    border-radius: 20px 20px 8px 8px;
    background: var(--bg);
    box-shadow: 0 6px 0 var(--sh);
    color: var(--nuit);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 12px;
  }
  .rank { font-family: var(--font-display); font-weight: 700; font-size: 34px; line-height: 1; }
  .rank.first { font-size: 44px; }
  .pts { font-size: 15px; font-weight: 800; }
  .rest { display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--texte-doux); font-weight: 700; font-size: 15px; }
  .tie { margin: 0; text-align: center; font-size: 14px; color: var(--texte-doux); font-weight: 700; }
  .actions { display: flex; flex-direction: column; gap: 6px; }
</style>
