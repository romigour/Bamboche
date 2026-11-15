<script lang="ts">
  import { get } from 'svelte/store';
  import { tap } from '../../../lib/feedback';
  import { players } from '../../../lib/players';
  import { navigate } from '../../../lib/router';
  import { getSettings, setSetting } from '../../../lib/settings';
  import { validateTeams } from '../../../lib/teams';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import IconButton from '../../../lib/ui/IconButton.svelte';
  import Pills from '../../../lib/ui/Pills.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import Stepper from '../../../lib/ui/Stepper.svelte';
  import { timeup } from '../module';
  import { cyclePlayer, pruneTeams, resizeTeams, shuffleTeams, teamsDraft } from '../setup';

  let { onnext, onback }: { onnext: () => void; onback: () => void } = $props();

  if (get(teamsDraft).length === 0) {
    const ps = get(players);
    teamsDraft.set(ps.length >= 2 ? shuffleTeams(ps, 2) : resizeTeams([], 2));
  }

  const teams = $derived(pruneTeams($teamsDraft, $players));
  const names = $derived(Object.fromEntries($players.map((p) => [p.id, p.name])));
  const assigned = $derived(new Set(teams.flatMap((t) => t.playerIds)));
  const unassigned = $derived($players.filter((p) => !assigned.has(p.id)));
  const check = $derived(validateTeams(teams, 2, 2, names));

  let turnSeconds = $state(getSettings(timeup).turnSeconds);
  const turnDef = timeup.settings.find((s) => s.key === 'turnSeconds')!;
  const turnOptions = turnDef.type === 'choice' ? turnDef.options.map((v) => ({ value: v, label: `${v} s` })) : [];

  function move(id: string) {
    tap();
    teamsDraft.set(cyclePlayer(teams, id));
  }
  const plural = (n: number) => `${n} joueur${n > 1 ? 's' : ''}`;
</script>

<Screen color="timeup" eyebrow="Time Up · étape 1 sur 2" title="Formez les équipes" back={onback} backLabel="Retour à l'accueil">
  {#snippet actions()}
    <IconButton icon="settings" label="Réglages du jeu" tone="onColor" size={44} onclick={() => navigate('/reglages/timeup', { retour: '/timeup' })} />
  {/snippet}

  <div class="row">
    <Stepper
      value={teams.length}
      min={2}
      max={20}
      format={(n) => `${n} équipes`}
      lessLabel="Une équipe de moins"
      moreLabel="Une équipe de plus"
      onchange={(n) => teamsDraft.set(resizeTeams(teams, n))}
    />
    <button
      type="button"
      class="shuffle"
      onclick={() => {
        tap();
        teamsDraft.set(shuffleTeams($players, teams.length));
      }}><span class="pop"><Icon name="shuffle" size={22} /></span>Au hasard</button
    >
  </div>

  <div class="teams">
    {#each teams as t (t.id)}
      <div class="team" style:--tc="var(--{t.color})">
        <div class="thead">
          <span class="dot">{t.name.replace(/^Les\s+/i, '').charAt(0)}</span>
          <span class="tname">{t.name}</span>
          <span class="count">{plural(t.playerIds.length)}</span>
        </div>
        <div class="chips">
          {#each t.playerIds as id (id)}
            <button type="button" class="chip" onclick={() => move(id)}>{names[id]}</button>
          {:else}
            <span class="hint">Touche un joueur sans équipe pour l'ajouter ici.</span>
          {/each}
        </div>
      </div>
    {/each}

    <div class="none">
      <span class="label">Sans équipe</span>
      <div class="chips">
        {#each unassigned as p (p.id)}
          <button type="button" class="chip free" onclick={() => move(p.id)}>{p.name}</button>
        {/each}
        <button type="button" class="config" onclick={() => navigate('/joueurs', { retour: '/timeup' })}>
          <Icon name="plus" size={16} stroke={3} />Configurer les joueurs
        </button>
      </div>
    </div>
    <p class="tip">Touche un joueur pour le changer d'équipe.</p>
  </div>

  <div class="field">
    <div class="label">Temps par tour</div>
    <Pills
      label="Temps par tour"
      options={turnOptions}
      value={turnSeconds}
      onchange={(v) => {
        turnSeconds = v;
        setSetting('timeup', 'turnSeconds', v);
      }}
    />
  </div>

  {#snippet footer()}
    {#if !check.ok}
      <ul class="errors" aria-live="polite">
        {#each check.errors as e}<li>{e}</li>{/each}
      </ul>
    {/if}
    <BigButton variant="pop" disabled={!check.ok} onclick={onnext}>
      Continuer<Icon name="chevron" size={22} stroke={3} />
    </BigButton>
  {/snippet}
</Screen>

<style>
  .row { display: flex; gap: 10px; }
  .shuffle {
    height: 56px;
    padding: 0 14px;
    border-radius: 18px;
    background: var(--surface-plus);
    box-shadow: 0 4px 0 var(--secondary-ombre);
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 16px;
    flex-shrink: 0;
  }
  .shuffle:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--secondary-ombre); }
  .pop { color: var(--pop); display: flex; }
  .teams { display: flex; flex-direction: column; gap: 10px; }
  .team { background: var(--surface); border-radius: 20px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
  .thead { display: flex; align-items: center; gap: 10px; }
  .dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--tc);
    color: var(--nuit);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tname { flex-grow: 1; font-family: var(--font-display); font-weight: 600; font-size: 19px; }
  .count { font-size: 13px; color: var(--texte-doux); font-weight: 700; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .chip {
    height: 40px;
    padding: 0 14px;
    border-radius: 999px;
    background: var(--tc);
    color: var(--nuit);
    font-weight: 800;
    font-size: 15px;
    transition: transform 0.08s ease;
  }
  .chip:active { transform: scale(0.94); }
  .chip.free { background: var(--surface-plus); color: var(--texte); }
  .hint { font-size: 14px; color: var(--texte-doux); }
  .none { border: 3px dashed var(--ligne); border-radius: 20px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
  .label { font-size: 13px; font-weight: 800; letter-spacing: 1.3px; text-transform: uppercase; color: var(--texte-doux); }
  .config {
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
  .tip { margin: 0; font-size: 14px; color: var(--texte-doux); text-align: center; }
  .field { display: flex; flex-direction: column; gap: 8px; }
  .errors { list-style: none; margin: 0; padding: 0; color: var(--ko); font-weight: 800; font-size: 15px; text-align: center; }
</style>
