<script lang="ts">
  import { players } from '../../../lib/players';
  import { navigate } from '../../../lib/router';
  import { getSettings, setSetting } from '../../../lib/settings';
  import { validateTeams } from '../../../lib/teams';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import IconButton from '../../../lib/ui/IconButton.svelte';
  import Pills from '../../../lib/ui/Pills.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import { timeup } from '../module';
  import { pruneTeams, teamsDraft } from '../setup';
  import TeamBuilder from '../../../lib/ui/TeamBuilder.svelte';

  let { onnext, onback }: { onnext: () => void; onback: () => void } = $props();

  const teams = $derived(pruneTeams($teamsDraft, $players));
  const names = $derived(Object.fromEntries($players.map((p) => [p.id, p.name])));
  const check = $derived(validateTeams(teams, 2, 2, names));

  let turnSeconds = $state(getSettings(timeup).turnSeconds);
  const turnDef = timeup.settings.find((s) => s.key === 'turnSeconds')!;
  const turnOptions = turnDef.type === 'choice' ? turnDef.options.map((v) => ({ value: v, label: `${v} s` })) : [];

</script>

<Screen color="timeup" eyebrow="Time Up · étape 1 sur 2" title="Formez les équipes" back={onback} backLabel="Retour à l'accueil">
  {#snippet actions()}
    <IconButton icon="settings" label="Réglages du jeu" tone="onColor" size={44} onclick={() => navigate('/reglages/timeup', { retour: '/timeup' })} />
  {/snippet}

  <TeamBuilder draft={teamsDraft} minPerTeam={2} showErrors={false} onconfigure={() => navigate('/joueurs', { retour: '/timeup' })} />

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
  .field { display: flex; flex-direction: column; gap: 8px; }
  .label { font-size: 13px; font-weight: 800; letter-spacing: 1.3px; text-transform: uppercase; color: var(--texte-doux); }
  .errors { list-style: none; margin: 0; padding: 0; color: var(--ko); font-weight: 800; font-size: 15px; text-align: center; }
</style>
