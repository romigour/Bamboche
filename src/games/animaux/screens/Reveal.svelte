<script lang="ts">
  import { tap } from '../../../lib/feedback';
  import { shortName } from '../../../lib/teams';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import type { AnimalPlayer } from '../audio';
  import { correctPlayers, scores, type AnimauxState } from '../logic/game';
  import type { Animal } from '../types';
  import { letter } from './letters';

  /** Révélation : photo, nom, qui a trouvé, réponses des autres, scores. */
  let {
    s,
    animal,
    options,
    player,
    onnext,
  }: { s: AnimauxState; animal: Animal; options: Animal[]; player: AnimalPlayer; onnext: () => void } = $props();

  /** Temps mort à l'ouverture : un double tap sur Révéler ne passe pas au son suivant. */
  const openedAt = Date.now();
  const goNext = () => {
    if (Date.now() - openedAt >= 400) onnext();
  };
  let photoFailed = $state(false);
  const round = $derived(s.rounds[s.current]);
  const winners = $derived(new Set(correctPlayers(s, s.current)));
  const pts = $derived(scores(s));
  const best = $derived(Math.max(...Object.values(pts)));
  const last = $derived(s.current + 1 >= s.rounds.length);
  const l = $derived(letter(round.options.indexOf(animal.id)));
  const nameOf = (id: string) => options.find((o) => o.id === id)?.name ?? '?';
</script>

<div class="page">
  <span class="eyebrow">Son {s.current + 1} / {s.rounds.length} · la réponse</span>

  <div class="mid">
    <div class="photo">
      {#if !photoFailed}
        <img src={animal.photo} alt={animal.name} onerror={() => (photoFailed = true)} />
      {:else}
        <Icon name="paw" size={80} />
      {/if}
      <button
        type="button"
        class="replay"
        aria-label="Réécouter le cri"
        onclick={() => {
          tap();
          player.play(animal.sound).catch(() => {});
        }}><Icon name="volume" size={28} stroke={2.6} /></button
      >
    </div>
    <h1><span class="badge" style:background={l.bg}>{l.letter}</span>{animal.name}</h1>
    <div class="chips">
      {#if winners.size === 0}<span class="chip none">Personne n'a trouvé</span>{/if}
      {#each s.players as p (p.id)}
        {#if winners.has(p.id)}
          <span class="chip ok"><Icon name="check" size={16} stroke={3.2} />{shortName(p.name)} +1</span>
        {:else}
          <span class="chip">{shortName(p.name)} : {nameOf(round.answers[p.id])}</span>
        {/if}
      {/each}
    </div>
  </div>

  <div class="scores">
    {#each s.players as p (p.id)}
      <div class="sc"><span class="sn" style:color="var(--{p.color})">{shortName(p.name)}</span><span class="sv" class:lead={pts[p.id] === best && best > 0}>{pts[p.id]}</span></div>
    {/each}
  </div>

  <BigButton variant="pop" onclick={goNext}>{last ? 'Voir le podium' : 'Son suivant'}<Icon name="chevron" size={22} stroke={3} /></BigButton>
</div>

<style>
  .page {
    min-height: 100dvh;
    box-sizing: border-box;
    padding: calc(20px + env(safe-area-inset-top)) 20px calc(18px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .eyebrow { text-align: center; font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  .mid { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; text-align: center; }
  .photo {
    position: relative;
    width: min(280px, 80vw);
    aspect-ratio: 280 / 230;
    border-radius: 28px;
    background: linear-gradient(150deg, var(--surface-plus), var(--animaux-ombre) 55%, var(--animaux));
    box-shadow: 0 10px 0 var(--animaux-ombre);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--nuit);
  }
  .photo img { width: 100%; height: 100%; object-fit: cover; border-radius: 28px; }
  .replay {
    position: absolute;
    right: -10px;
    bottom: -14px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--animaux);
    color: var(--nuit);
    box-shadow: 0 5px 0 var(--animaux-ombre);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .replay:active { transform: translateY(4px); box-shadow: 0 1px 0 var(--animaux-ombre); }
  h1 { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 36px; line-height: 1.05; }
  .badge {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 12px;
    color: var(--nuit);
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
  .chip {
    min-height: 36px;
    padding: 0 14px;
    border-radius: 999px;
    background: var(--surface-plus);
    color: var(--texte-doux);
    font-weight: 800;
    font-size: 16px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .chip.ok { background: var(--ok); color: var(--nuit); }
  .chip.none { background: var(--surface); color: var(--texte); }
  .scores { background: var(--surface); border-radius: 20px; padding: 10px 14px; display: flex; flex-wrap: wrap; gap: 8px 14px; justify-content: space-around; }
  .sc { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .sn { font-size: 13px; font-weight: 800; }
  .sv { font-family: var(--font-display); font-weight: 700; font-size: 24px; }
  .sv.lead { color: var(--pop); }
</style>
