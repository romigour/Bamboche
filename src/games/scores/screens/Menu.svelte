<script lang="ts">
  import { navigate } from '../../../lib/router';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import { fmt, scoreGameById, scoreGames } from '../defs';
  import { totals } from '../logic/sheet';
  import { currentSheet } from '../session';

  /** Sous-menu « Feuille de score » : reprise de la feuille en cours et choix du jeu. */
  const resumeDef = $derived($currentSheet ? scoreGameById($currentSheet.gameId) : undefined);
  const summary = $derived.by(() => {
    const s = $currentSheet;
    if (!s) return '';
    const tot = totals(s);
    return `Manche ${s.rounds.length + 1} · ${s.participants.map((p, i) => `${p.name} ${fmt(tot[i])}`).join(' – ')}`;
  });
</script>

<Screen color="hipster" title="Feuille de score" back={() => navigate('/')} backLabel="Retour à l'accueil">
  {#if $currentSheet && resumeDef}
    <button type="button" class="resume" onclick={() => navigate('/scores/partie')}>
      <span class="text">
        <span class="main">Reprendre : {resumeDef.name}</span>
        <span class="sub">{summary}</span>
      </span>
      <Icon name="chevron" size={22} stroke={3} />
    </button>
  {/if}

  <div class="list">
    {#each scoreGames as def (def.id)}
      <button type="button" class="row" onclick={() => navigate('/scores/nouvelle', { jeu: def.id })}>
        <span class="dot" style:background={`var(--${def.color})`}></span>
        <span class="name">{def.name}</span>
        <Icon name="chevron" size={20} stroke={3} />
      </button>
    {/each}
  </div>

  {#snippet footer()}
    <BigButton variant="secondary" onclick={() => navigate('/scores/historique')}>Historique et bilans</BigButton>
  {/snippet}
</Screen>

<style>
  .resume {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 72px;
    padding: 12px 18px;
    border-radius: 24px;
    background: var(--surface-plus);
    border: 3px solid var(--hipster);
    text-align: left;
  }
  .text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .main { font-family: var(--font-display); font-weight: 700; font-size: 20px; }
  .sub { font-weight: 700; font-size: 14px; color: var(--texte-doux); }
  .list { display: flex; flex-direction: column; gap: 8px; }
  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 64px;
    padding: 8px 18px;
    border-radius: 20px;
    background: var(--surface);
    text-align: left;
  }
  .dot { width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; }
  .name { flex: 1; font-family: var(--font-display); font-weight: 600; font-size: 20px; }
</style>
