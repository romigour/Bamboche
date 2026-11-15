<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import TeamRow from '../../../lib/ui/TeamRow.svelte';
  import { ROUND_RULES, totals, type TimeUpState } from '../logic/game';

  let { s, onnext }: { s: TimeUpState; onnext: () => void } = $props();

  const ranking = $derived(totals(s));
  const last = $derived(s.round >= s.settings.rounds);
  const nextRule = $derived(last ? null : ROUND_RULES[(s.round + 1) as 1 | 2 | 3]);
  const team = (id: string) => s.teams.find((t) => t.id === id)!;
  const starter = $derived(s.teams[s.currentTeam]);
</script>

<div class="page">
  <div class="head">
    <div class="steps" aria-label="Manche {s.round} sur {s.settings.rounds} terminée">
      {#each Array(s.settings.rounds) as _, i}<span class:on={i < s.round}></span>{/each}
    </div>
    <span class="eyebrow">Toutes les cartes sont trouvées</span>
    <h1>Fin de la manche {s.round}</h1>
  </div>

  <div class="rows">
    {#each ranking as r (r.teamId)}
      <TeamRow
        name={team(r.teamId).name}
        color="var(--{team(r.teamId).color})"
        subtitle="+{s.scores[r.teamId][s.round - 1]} cette manche"
        score={r.total}
        highlight={r.rank === 1}
      />
    {/each}
  </div>

  <div class="next">
    {#if nextRule}
      <span class="eyebrow">Prochaine manche</span>
      <div class="nr"><span class="num">{s.round + 1}</span><span class="title">{nextRule.title}</span></div>
      <span class="desc">Mêmes cartes. {nextRule.rule} {starter.name} commencent.</span>
    {:else}
      <span class="eyebrow">C'était la dernière manche</span>
      <span class="title">Place au podium !</span>
    {/if}
  </div>

  <BigButton variant="pop" onclick={onnext}>{nextRule ? 'Manche suivante' : 'Voir le podium'}</BigButton>
</div>

<style>
  .page {
    flex: 1;
    min-height: 100dvh;
    padding: calc(32px + env(safe-area-inset-top)) 20px calc(26px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .head { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
  .steps { display: flex; gap: 10px; margin-bottom: 10px; }
  .steps span { width: 44px; height: 10px; border-radius: 999px; background: var(--surface-plus); }
  .steps span.on { background: var(--ok); }
  .eyebrow { font-size: 14px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  h1 { font-size: 40px; line-height: 1.05; }
  .rows { display: flex; flex-direction: column; gap: 10px; }
  .next {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: var(--surface);
    border-radius: 28px;
    padding: 20px;
    text-align: center;
  }
  .nr { display: flex; align-items: center; gap: 12px; }
  .num {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--timeup);
    color: var(--nuit);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 28px;
  }
  .title { font-family: var(--font-display); font-weight: 700; font-size: 32px; color: var(--timeup); }
  .desc { font-size: 15px; color: var(--texte-doux); font-weight: 700; }
</style>
