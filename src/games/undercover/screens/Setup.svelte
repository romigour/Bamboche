<script lang="ts">
  import { players } from '../../../lib/players';
  import { navigate } from '../../../lib/router';
  import { TEAM_COLORS } from '../../../lib/teams';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import Pills from '../../../lib/ui/Pills.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import { composition } from '../logic/game';
  import { mrWhiteOn, validateSetup } from '../setup';

  /** « Qui joue ? » : les joueurs de la soirée, Mr White en option, et la répartition des rôles. */
  let { onstart, onback }: { onstart: () => void; onback: () => void } = $props();

  const check = $derived(validateSetup($players.length, $mrWhiteOn));
  const compo = $derived.by(() => {
    const c = composition($players.length, $mrWhiteOn);
    return ['1 undercover', ...(c.mrWhite ? ['1 Mr White'] : []), `${c.civils} ${c.civils > 1 ? 'civils' : 'civil'}`].join(' · ');
  });
</script>

<Screen color="undercover" eyebrow="Undercover" title="Qui joue ?" back={onback} backLabel="Retour à l'accueil">
  <div class="list">
    {#each $players as p, i (p.id)}
      <div class="row">
        <span class="av" style:background={`var(--${TEAM_COLORS[i % TEAM_COLORS.length]})`}>{p.name.charAt(0).toUpperCase()}</span>
        <span class="name">{p.name}</span>
      </div>
    {/each}
    <BigButton variant="secondary" onclick={() => navigate('/joueurs', { retour: '/undercover' })}>
      <Icon name="plus" size={16} stroke={3} />Configurer les joueurs
    </BigButton>
  </div>

  <Pills
    label="Mr White"
    options={[
      { value: 0, label: 'Non' },
      { value: 1, label: 'Oui' },
    ]}
    value={$mrWhiteOn ? 1 : 0}
    onchange={(v) => mrWhiteOn.set(v === 1)}
  />

  {#if check.ok}<p class="compo">{compo}</p>{/if}

  {#snippet footer()}
    {#if check.error}<p class="error" aria-live="polite">{check.error}</p>{/if}
    <BigButton variant="pop" disabled={!check.ok} onclick={onstart}>Lancer<Icon name="chevron" size={22} stroke={3} /></BigButton>
  {/snippet}
</Screen>

<style>
  .list { display: flex; flex-direction: column; gap: 8px; }
  .row { display: flex; align-items: center; gap: 12px; background: var(--surface); border-radius: 18px; padding: 10px 14px; }
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
  .name { font-family: var(--font-display); font-weight: 600; font-size: 19px; }
  .compo { margin: 0; text-align: center; font-weight: 800; font-size: 16px; color: var(--texte-doux); }
  .error { margin: 0; color: var(--ko); font-weight: 800; font-size: 15px; text-align: center; }
</style>
