<script lang="ts">
  import { tap } from '../../../lib/feedback';
  import { players } from '../../../lib/players';
  import { navigate } from '../../../lib/router';
  import { TEAM_COLORS } from '../../../lib/teams';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import IconButton from '../../../lib/ui/IconButton.svelte';
  import Pills from '../../../lib/ui/Pills.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import TeamBuilder from '../../../lib/ui/TeamBuilder.svelte';
  import { animatorId, btMode, btTeamsDraft, validateSetup } from '../setup';

  /** « Qui joue ? » : chacun pour soi (avec un animateur facultatif) ou en équipes (dès 1 joueur). */
  let { onnext, onback }: { onnext: () => void; onback: () => void } = $props();

  const check = $derived(validateSetup($btMode, $players, $btTeamsDraft, $animatorId));
  const configure = () => navigate('/joueurs', { retour: '/blindtest' });
  let colorIndex = $derived.by(() => {
    const map: Record<string, number> = {};
    let i = 0;
    for (const p of $players) if (p.id !== $animatorId) map[p.id] = i++;
    return map;
  });
</script>

<Screen color="blindtest" eyebrow="Blindtest · étape 1 sur 2" title="Qui joue ?" back={onback} backLabel="Retour à l'accueil">
  {#snippet actions()}
    <IconButton icon="settings" label="Réglages du jeu" tone="onColor" size={44} onclick={() => navigate('/reglages/blindtest', { retour: '/blindtest' })} />
  {/snippet}

  <Pills
    label="Mode de jeu"
    options={[
      { value: 0, label: 'En équipes' },
      { value: 1, label: 'Chacun pour soi' },
    ]}
    value={$btMode === 'solo' ? 1 : 0}
    onchange={(v) => btMode.set(v === 1 ? 'solo' : 'equipes')}
  />

  {#if $btMode === 'solo'}
    <p class="hint">Chaque joueur marque pour lui-même. Touche un joueur s'il anime la partie : il ne joue pas.</p>
    <div class="list">
      {#each $players as p (p.id)}
        {@const anim = p.id === $animatorId}
        <button
          type="button"
          class="row"
          class:anim
          aria-label="{p.name} — {anim ? 'anime la partie' : 'joue'}"
          onclick={() => {
            tap();
            animatorId.set(anim ? null : p.id);
          }}
        >
          <span class="av" style:background={anim ? 'var(--surface-plus)' : `var(--${TEAM_COLORS[colorIndex[p.id] % TEAM_COLORS.length]})`}>
            {p.name.charAt(0).toUpperCase()}
          </span>
          <span class="name">{p.name}</span>
          <span class="state">{anim ? 'Anime la partie' : 'Joue'}</span>
        </button>
      {/each}
      <button type="button" class="config" onclick={configure}><Icon name="plus" size={16} stroke={3} />Configurer les joueurs</button>
    </div>
  {:else}
    <TeamBuilder draft={btTeamsDraft} minPerTeam={1} showErrors={false} onconfigure={configure} />
  {/if}

  {#snippet footer()}
    {#if !check.ok}
      <ul class="errors" aria-live="polite">
        {#each check.errors as e}<li>{e}</li>{/each}
      </ul>
    {/if}
    <BigButton variant="pop" disabled={!check.ok} onclick={onnext}>Continuer<Icon name="chevron" size={22} stroke={3} /></BigButton>
  {/snippet}
</Screen>

<style>
  .hint { margin: 0; font-size: 15px; color: var(--texte-doux); text-align: center; }
  .list { display: flex; flex-direction: column; gap: 8px; }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--surface);
    border-radius: 18px;
    padding: 10px 14px;
    text-align: left;
    border: 3px solid transparent;
  }
  .row:active { transform: scale(0.98); }
  .row.anim { background: none; border: 3px dashed var(--ligne); color: #8c80b8; }
  .av {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: var(--nuit);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .anim .av { color: var(--texte-doux); }
  .name { flex-grow: 1; font-family: var(--font-display); font-weight: 600; font-size: 19px; }
  .state { font-size: 13px; font-weight: 800; color: var(--ok); }
  .anim .state { color: #8c80b8; }
  .config {
    align-self: flex-start;
    height: 40px;
    padding: 0 12px;
    border-radius: 999px;
    border: 2px solid var(--ligne);
    color: var(--pop);
    font-weight: 800;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .errors { list-style: none; margin: 0; padding: 0; color: var(--ko); font-weight: 800; font-size: 15px; text-align: center; }
</style>
