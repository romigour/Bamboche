<script lang="ts">
  import { onMount } from 'svelte';
  import { tap } from '../../../lib/feedback';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import type { AnimalPlayer } from '../audio';
  import type { AnimauxState } from '../logic/game';
  import type { Animal } from '../types';
  import { letter } from './letters';

  /** Un son : propositions, lecture, réponse de chaque joueur, Révéler. Rien ne désigne la bonne réponse. */
  let {
    s,
    options,
    player,
    soundUrl,
    onanswer,
    onreveal,
    onskip,
    onpause,
  }: {
    s: AnimauxState;
    /** Les animaux proposés, dans l'ordre affiché. */
    options: Animal[];
    player: AnimalPlayer;
    soundUrl: string;
    onanswer: (playerId: string, animalId: string) => void;
    onreveal: () => void;
    onskip: () => void;
    onpause: () => void;
  } = $props();

  const LEVEL_NAMES = { facile: 'Facile', melange: 'Mélangé', expert: 'Expert' };
  let listen = $state<'idle' | 'played' | 'blocked'>('idle');
  let missingSound = $state(false);
  const round = $derived(s.rounds[s.current]);
  const missing = $derived(s.players.filter((p) => !round.answers[p.id]).length);
  const compact = $derived(s.players.length > 4);
  const playLabel = $derived(listen === 'blocked' ? 'Touche pour écouter' : listen === 'played' ? 'Réécouter le cri' : 'Écouter le cri');

  onMount(() => player.onError(() => (missingSound = true)));

  function play() {
    tap();
    listen = 'played';
    player.play(soundUrl).catch(() => (listen = 'blocked'));
  }
</script>

<div class="page" class:compact>
  <div class="top">
    <div class="head">
      <button type="button" class="round-btn" aria-label="Pause" onclick={onpause}><Icon name="pause" size={22} stroke={3} /></button>
      <div class="ht">
        <span class="eyebrow">Cris d'animaux · {LEVEL_NAMES[s.level]}</span>
        <span class="count">Son {s.current + 1} / {s.rounds.length}</span>
      </div>
      {#if compact}
        <button type="button" class="play small" aria-label={playLabel} onclick={play}><Icon name="volume" size={34} stroke={2.6} /></button>
      {/if}
    </div>

    {#if !compact}
      <div class="hero">
        <button type="button" class="play" aria-label={playLabel} onclick={play}><Icon name="volume" size={48} stroke={2.6} /></button>
        <div class="hero-text">
          <h1>Qui fait ce cri ?</h1>
          <p>{listen === 'blocked' ? 'Le son est bloqué : touche le bouton pour écouter.' : `Lis les ${options.length} choix, puis touche pour écouter. Réécoute autant que tu veux.`}</p>
        </div>
      </div>
    {/if}

    {#if compact && listen === 'blocked'}
      <p class="blocked" role="status">Le son est bloqué : touche le haut-parleur pour écouter.</p>
    {/if}

    {#if missingSound}
      <div class="missing" role="alert">
        <strong>Son introuvable</strong>
        <BigButton variant="secondary" size="md" onclick={onskip}><Icon name="skip" size={18} />Passer ce son</BigButton>
      </div>
    {/if}

    <ul class="options">
      {#each options as o, i (o.id)}
        {@const l = letter(i)}
        <li><span class="badge" style:background={l.bg}>{l.letter}</span><span class="oname">{o.name}</span></li>
      {/each}
    </ul>
  </div>

  <div class="answers">
    {#if !compact}<h2 class="label">Les réponses</h2>{/if}
    {#each s.players as p (p.id)}
      <div class="row">
        <span class="pname">{p.name}</span>
        <div class="letters" style:grid-template-columns="repeat({options.length}, minmax(0, 1fr))">
          {#each options as o, i (o.id)}
            {@const l = letter(i)}
            {@const on = round.answers[p.id] === o.id}
            <button
              type="button"
              class="let"
              class:on
              aria-label="{p.name} : {o.name}"
              aria-pressed={on}
              style:--bg={l.bg}
              style:--sh={l.sh}
              onclick={() => {
                tap();
                onanswer(p.id, o.id);
              }}>{l.letter}</button
            >
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <div class="foot">
    <span class="hint">{missing === 0 ? 'Tout le monde a répondu !' : missing === 1 ? 'Il manque 1 réponse' : `Il manque ${missing} réponses`}</span>
    <BigButton variant="pop" disabled={missing > 0} onclick={onreveal}><Icon name="eye" size={24} stroke={2.6} />Révéler</BigButton>
  </div>
</div>

<style>
  .page { height: 100dvh; display: flex; flex-direction: column; overflow: hidden; }
  .top { padding: calc(20px + env(safe-area-inset-top)) 20px 12px; display: flex; flex-direction: column; gap: 14px; flex-shrink: 0; }
  .head { display: flex; align-items: center; gap: 12px; }
  .ht { flex-grow: 1; display: flex; flex-direction: column; align-items: center; }
  .compact .ht { align-items: flex-start; }
  .eyebrow { font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  .count { font-family: var(--font-display); font-weight: 600; font-size: 18px; }
  .round-btn {
    width: 52px;
    height: 52px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--surface-plus);
    color: var(--texte);
    box-shadow: 0 5px 0 var(--secondary-ombre);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .head:not(:has(.small))::after { content: ''; width: 52px; flex-shrink: 0; }
  .hero { display: flex; align-items: center; gap: 16px; }
  .play {
    width: 112px;
    height: 112px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--animaux);
    color: var(--nuit);
    box-shadow: 0 8px 0 var(--animaux-ombre);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .play.small { width: 72px; height: 72px; box-shadow: 0 6px 0 var(--animaux-ombre); }
  .play:active, .round-btn:active, .let:active { transform: translateY(4px); box-shadow: 0 2px 0 rgba(0, 0, 0, 0.35); }
  .hero-text { display: flex; flex-direction: column; gap: 4px; }
  h1 { font-weight: 700; font-size: 26px; line-height: 1.05; }
  .hero-text p { margin: 0; font-size: 15px; color: var(--texte-doux); font-weight: 700; }
  .blocked { margin: 0; font-size: 15px; font-weight: 800; color: var(--animaux); }
  .missing { background: var(--surface); border-radius: 18px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .missing strong { color: var(--ko); font-size: 17px; }
  .options { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .options li { min-height: 54px; border-radius: 18px; background: var(--surface); display: flex; align-items: center; gap: 10px; padding: 6px 12px; }
  .compact .options { gap: 8px; }
  .compact .options li { min-height: 44px; border-radius: 14px; padding: 4px 10px; }
  .badge {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 10px;
    color: var(--nuit);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .oname { font-family: var(--font-display); font-weight: 600; font-size: 19px; line-height: 1.1; }
  .compact .oname { font-size: 17px; }
  .answers { flex: 1 1 0; min-height: 0; overflow-y: auto; padding: 4px 20px 12px; display: flex; flex-direction: column; gap: 10px; }
  .compact .answers { border-top: 2px solid var(--surface); gap: 8px; }
  .label { margin: 4px 0 0; font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  .row { display: flex; align-items: center; gap: 8px; min-height: 52px; }
  .pname { width: 86px; flex-shrink: 0; font-family: var(--font-display); font-weight: 600; font-size: 19px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .letters { flex-grow: 1; display: grid; gap: 6px; }
  .let {
    height: 48px;
    border-radius: 16px;
    border: 3px solid var(--ligne);
    background: transparent;
    color: var(--texte-doux);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 20px;
  }
  .let.on { border: none; background: var(--bg); color: var(--nuit); box-shadow: 0 4px 0 var(--sh); }
  .foot { padding: 10px 20px calc(18px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
  .hint { text-align: center; font-size: 14px; font-weight: 700; color: var(--texte-doux); }
</style>
