<script lang="ts">
  import { untrack } from 'svelte';
  import { tap } from '../../../lib/feedback';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import type { TimeUpState } from '../logic/game';

  let { s, onundo, onredo, onnext }: { s: TimeUpState; onundo: (id: string) => void; onredo: (id: string) => void; onnext: () => void } = $props();

  /** Mots trouvés au début du récap : on les garde affichés (barrés) même annulés. */
  let shown = $state<string[]>(untrack(() => [...(s.turn?.foundIds ?? [])]));
  const found = $derived(new Set(s.turn?.foundIds ?? []));
  const team = $derived(s.teams[s.currentTeam]);
  const next = $derived(s.teams[(s.currentTeam + 1) % s.teams.length]);
  const roundTotal = $derived((s.scores[team.id]?.[s.round - 1] ?? 0) + found.size);
  const text = (id: string) => s.cards.find((c) => c.id === id)?.text ?? '';
  const emptied = $derived(s.deck.length === 0);
  /** Raison de la fin du tour, figée à l'ouverture : annuler un mot ne la change pas. */
  const endedByEmptyDeck = untrack(() => s.deck.length === 0);
</script>

<div class="page">
  <div class="head">
    <span class="eyebrow">{endedByEmptyDeck ? 'Plus de cartes !' : 'Temps écoulé !'}</span>
    <div class="big"><span class="n">{found.size}</span><span class="l">mot{found.size > 1 ? 's' : ''} trouvé{found.size > 1 ? 's' : ''}</span></div>
    <span class="sub"><span style:color="var(--{team.color})">{team.name}</span> · {roundTotal} point{roundTotal > 1 ? 's' : ''} sur la manche</span>
  </div>

  <div class="list">
    {#each shown as id (id)}
      {@const on = found.has(id)}
      <button
        type="button"
        class="item"
        class:off={!on}
        onclick={() => {
          tap();
          if (on) onundo(id);
          else onredo(id);
        }}
      >
        <span class="mark" class:on><Icon name={on ? 'check' : 'undo'} size={18} stroke={3} /></span>
        <span class="t">{text(id)}</span>
        {#if !on}<span class="annule">annulé</span>{/if}
      </button>
    {:else}
      <p class="none">Aucun mot cette fois… ça arrive aux meilleurs !</p>
    {/each}
  </div>
  {#if shown.length}<p class="tip">Une erreur ? Touche un mot pour l'annuler.</p>{/if}

  <div class="next" style:background="var(--{next.color})">
    <span class="nl">{emptied ? 'Manche terminée' : 'Prochaine équipe'}</span>
    {#if !emptied}<span class="nn">{next.name}</span>{/if}
  </div>
  <BigButton variant="pop" onclick={onnext}>{emptied ? 'Voir les scores' : 'Équipe suivante'}</BigButton>
</div>

<style>
  .page {
    flex: 1;
    min-height: 100dvh;
    padding: calc(28px + env(safe-area-inset-top)) 20px calc(26px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .head { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
  .eyebrow { font-size: 14px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  .big { display: flex; align-items: baseline; gap: 10px; }
  .n { font-family: var(--font-display); font-weight: 700; font-size: 96px; line-height: 1; color: var(--ok); }
  .l { font-family: var(--font-display); font-weight: 600; font-size: 26px; }
  .sub { font-size: 16px; font-weight: 700; }
  .list {
    background: var(--surface);
    border-radius: 24px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-grow: 1;
    overflow-y: auto;
    max-height: 46dvh;
  }
  .item {
    min-height: 48px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 12px;
    font-weight: 700;
    font-size: 17px;
    text-align: left;
  }
  .item.off { background: var(--nuit); color: #8c80b8; }
  .item.off .t { text-decoration: line-through; }
  .mark { width: 28px; height: 28px; border-radius: 50%; background: var(--surface-plus); color: var(--texte-doux); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .mark.on { background: var(--ok); color: var(--nuit); }
  .t { flex-grow: 1; }
  .annule { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
  .none { margin: auto; color: var(--texte-doux); text-align: center; font-weight: 700; padding: 20px; }
  .tip { margin: -6px 0 0; font-size: 13px; color: var(--texte-doux); text-align: center; }
  .next { display: flex; align-items: center; gap: 12px; color: var(--nuit); border-radius: 20px; padding: 12px 16px; }
  .nl { font-size: 14px; font-weight: 800; flex-grow: 1; }
  .nn { font-family: var(--font-display); font-weight: 700; font-size: 20px; }
</style>
