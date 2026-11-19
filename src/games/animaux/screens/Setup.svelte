<script lang="ts">
  import { tap } from '../../../lib/feedback';
  import { players } from '../../../lib/players';
  import { navigate } from '../../../lib/router';
  import { TEAM_COLORS } from '../../../lib/teams';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import IconButton from '../../../lib/ui/IconButton.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import { animauxLevel, validateSetup } from '../setup';
  import type { GameLevel } from '../types';

  export interface BankStatus {
    /** Téléchargement terminé (même avec quelques fichiers en échec). */
    ready: boolean;
    done: number;
    total: number;
    failed: number;
    offline: boolean;
  }

  /** « Qui joue ? » : joueurs de la soirée, niveau, état des sons, crédits. */
  let {
    bank,
    onstart,
    onback,
    oncredits,
    onretry,
  }: { bank: BankStatus; onstart: () => void; onback: () => void; oncredits: () => void; onretry: () => void } = $props();

  const LEVELS: { id: GameLevel; label: string; help: string }[] = [
    { id: 'facile', label: 'Facile', help: 'Des animaux connus, des choix bien différents. Parfait pour les enfants.' },
    { id: 'melange', label: 'Mélangé', help: 'Moitié facile, moitié piégeux : tout le monde a sa chance.' },
    { id: 'expert', label: 'Expert', help: 'Des cris rares et des choix qui se ressemblent.' },
  ];
  const check = $derived(validateSetup($players.length));
  const help = $derived(LEVELS.find((l) => l.id === $animauxLevel)?.help ?? '');
  const pct = $derived(bank.total ? Math.round((bank.done / bank.total) * 100) : 0);
</script>

<Screen color="animaux" eyebrow="Cris d'animaux" title="Qui joue ?" back={onback} backLabel="Retour à l'accueil">
  {#snippet actions()}
    <IconButton icon="settings" label="Réglages du jeu" tone="onColor" size={44} onclick={() => navigate('/reglages/animaux', { retour: '/animaux' })} />
  {/snippet}

  <div class="chips">
    {#each $players as p, i (p.id)}
      <span class="chip"><span class="av" style:background={`var(--${TEAM_COLORS[i % TEAM_COLORS.length]})`}>{p.name.charAt(0).toUpperCase()}</span>{p.name}</span>
    {/each}
  </div>
  <BigButton variant="secondary" size="md" onclick={() => navigate('/joueurs', { retour: '/animaux' })}>
    <Icon name="plus" size={16} stroke={3} />Configurer les joueurs
  </BigButton>

  <section class="level">
    <h2 class="label">Niveau</h2>
    <div class="pills" role="group" aria-label="Niveau">
      {#each LEVELS as l (l.id)}
        <button
          type="button"
          aria-pressed={$animauxLevel === l.id}
          onclick={() => {
            tap();
            animauxLevel.set(l.id);
          }}>{l.label}</button
        >
      {/each}
    </div>
    <p class="help">{help}</p>
  </section>

  <section class="bank" aria-live="polite">
    {#if bank.ready && bank.failed === 0}
      <p class="line"><Icon name="check" size={20} stroke={3} />Sons prêts : le jeu marche sans connexion.</p>
    {:else if bank.ready}
      <p class="line">{bank.failed} {bank.failed > 1 ? 'fichiers n’ont' : 'fichier n’a'} pas pu être téléchargés.</p>
      <BigButton variant="secondary" size="md" onclick={onretry}>Réessayer</BigButton>
    {:else if bank.offline}
      <p class="line">Connexion requise pour télécharger les sons la première fois.</p>
    {:else}
      <p class="line">Téléchargement des sons… {bank.done} / {bank.total}</p>
      <div class="bar"><div style:width="{pct}%"></div></div>
      <p class="sub">Une seule fois : ensuite le jeu marche sans connexion.</p>
    {/if}
  </section>

  <button type="button" class="link" onclick={oncredits}>Crédits des sons et photos</button>

  {#snippet footer()}
    {#if check.error}<p class="error" aria-live="polite">{check.error}</p>{:else}<p class="hint">L'animateur garde le téléphone et joue aussi.</p>{/if}
    <BigButton variant="pop" disabled={!check.ok || !bank.ready} onclick={onstart}><Icon name="play" size={22} />Jouer</BigButton>
  {/snippet}
</Screen>

<style>
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    height: 40px;
    padding: 0 14px 0 6px;
    border-radius: 999px;
    background: var(--surface);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
    font-size: 16px;
  }
  .av {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    color: var(--nuit);
    font-family: var(--font-display);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .level { display: flex; flex-direction: column; gap: 8px; }
  .label { margin: 0; font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  .pills { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .pills button {
    height: 48px;
    border-radius: 999px;
    background: var(--surface-plus);
    color: var(--texte);
    font-weight: 800;
    font-size: 16px;
    box-shadow: 0 4px 0 var(--secondary-ombre);
  }
  .pills button[aria-pressed='true'] { background: var(--texte); color: var(--nuit); box-shadow: 0 4px 0 #8c80b8; }
  .help { margin: 0; font-size: 15px; font-weight: 700; color: var(--texte-doux); }
  .bank { background: var(--surface); border-radius: 20px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
  .line { margin: 0; font-weight: 800; font-size: 16px; display: flex; align-items: center; gap: 8px; }
  .line :global(svg) { color: var(--animaux); flex-shrink: 0; }
  .bar { height: 10px; border-radius: 999px; background: var(--surface-plus); overflow: hidden; }
  .bar div { height: 100%; border-radius: 999px; background: var(--animaux); transition: width 0.2s ease; }
  .sub { margin: 0; font-size: 14px; font-weight: 700; color: var(--texte-doux); }
  .link { align-self: center; background: none; color: var(--texte-doux); font-weight: 800; font-size: 15px; text-decoration: underline; padding: 10px; }
  .hint { margin: 0; text-align: center; font-size: 14px; color: var(--texte-doux); font-weight: 700; }
  .error { margin: 0; color: var(--ko); font-weight: 800; font-size: 15px; text-align: center; }
</style>
