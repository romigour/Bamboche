<script lang="ts">
  import { untrack } from 'svelte';
  import { get } from 'svelte/store';
  import { uid } from '../../../lib/id';
  import { addPlayer, players } from '../../../lib/players';
  import { navigate } from '../../../lib/router';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import Pills from '../../../lib/ui/Pills.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import Stepper from '../../../lib/ui/Stepper.svelte';
  import { endLabel, scoreGameById } from '../defs';
  import { createSheet, type Participant } from '../logic/sheet';
  import { nameConflict } from '../logic/stats';
  import { abandonSheet, currentSheet, endValueFor, startSheet } from '../session';
  import ReplaceConfirm from '../ui/ReplaceConfirm.svelte';

  /** Préparation d'une feuille : joueurs cochés, équipes (Belote) et fin de partie. */
  let { gameId }: { gameId: string } = $props();

  const def = $derived(scoreGameById(gameId));

  $effect(() => {
    if (!def) navigate('/scores');
  });

  // Tous cochés à l'ouverture : on retient les décochés, un joueur ajouté est donc coché d'office.
  let unchecked = $state<Record<string, boolean>>({});
  let teamOf = $state<Record<string, number>>({});
  let newName = $state('');
  let endValue = $state(untrack(() => (def ? endValueFor(def.id) : 0)));

  const picked = $derived.by(() => {
    // Équipe par défaut : alternance dans l'ordre de la liste, parmi les joueurs cochés.
    let rank = 0;
    return $players
      .filter((p) => !unchecked[p.id])
      .map((p) => ({ ...p, team: teamOf[p.id] ?? (rank++ % 2) + 1 }));
  });
  const teamById = $derived(new Map(picked.map((p) => [p.id, p.team])));

  const error = $derived.by(() => {
    if (!def) return '';
    const dup = nameConflict(picked.map((p) => p.name));
    if (dup) return `Deux joueurs s'appellent ${dup} : ajoute une initiale.`;
    if (def.teams) {
      if (picked.length !== 4) return 'La belote se joue à 4 joueurs.';
      if (picked.filter((p) => p.team === 1).length !== 2) return 'Chaque équipe doit avoir 2 joueurs.';
    }
    if (picked.length < def.minPlayers) return `Il faut au moins ${def.minPlayers} joueurs.`;
    return '';
  });

  function add(e?: Event) {
    e?.preventDefault();
    if (addPlayer(newName)) newName = '';
  }

  let asking = $state(false);

  function start() {
    if (!def || error) return;
    // Une feuille est déjà en cours : on ne l'écrase qu'avec l'accord du joueur.
    if (get(currentSheet)) asking = true;
    else launch();
  }

  function replace() {
    asking = false;
    abandonSheet();
    launch();
  }

  function launch() {
    if (!def) return;
    let participants: Participant[];
    if (def.teams) {
      participants = [1, 2].map((t) => {
        const members = picked.filter((p) => p.team === t).map((p) => p.name);
        return { id: uid('s'), name: members.join(' & '), members };
      });
    } else {
      participants = picked.map((p) => ({ id: uid('s'), name: p.name, members: [p.name] }));
    }
    startSheet(createSheet(def.id, participants, endValue, Date.now(), uid('s')));
  }
</script>

{#if def}
  <Screen color={def.color} eyebrow="Feuille de score" title={def.name} back={() => navigate('/scores')}>
    <div class="list">
      {#each $players as p (p.id)}
        {@const on = !unchecked[p.id]}
        <div class="item">
          <button type="button" role="checkbox" aria-checked={on} class="row" onclick={() => (unchecked[p.id] = on)}>
            <span class="box" class:on>{#if on}<Icon name="check" size={18} stroke={4} />{/if}</span>
            <span class="name">{p.name}</span>
          </button>
          {#if def.teams && on}
            <div class="teams">
              <Pills
                label={`Équipe de ${p.name}`}
                options={[
                  { value: 1, label: 'Équipe 1' },
                  { value: 2, label: 'Équipe 2' },
                ]}
                value={teamById.get(p.id) ?? 1}
                onchange={(v) => (teamOf[p.id] = v)}
              />
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <form class="add" onsubmit={add}>
      <input
        type="text"
        aria-label="Ajouter un joueur"
        placeholder="Ajouter un joueur"
        bind:value={newName}
        maxlength="24"
        autocomplete="off"
        enterkeyhint="done"
      />
      <button type="submit" class="addbtn" aria-label="Ajouter" disabled={!newName.trim()}>
        <Icon name="plus" size={26} stroke={3} />
      </button>
    </form>

    <div>
      <Stepper
        value={endValue}
        min={def.end.min}
        max={def.end.max}
        step={def.end.step}
        format={(n) => endLabel(def, n)}
        onchange={(v) => (endValue = v)}
      />
    </div>

    {#snippet footer()}
      {#if error}<p class="error" aria-live="polite">{error}</p>{/if}
      <BigButton variant="pop" disabled={!!error} onclick={start}>C'est parti<Icon name="chevron" size={22} stroke={3} /></BigButton>
    {/snippet}
  </Screen>

  {#if asking && $currentSheet}
    <ReplaceConfirm
      gameName={scoreGameById($currentSheet.gameId)?.name ?? ''}
      onconfirm={replace}
      oncancel={() => (asking = false)}
    />
  {/if}
{/if}

<style>
  .list { display: flex; flex-direction: column; gap: 8px; }
  .item { display: flex; flex-direction: column; background: var(--surface); border-radius: 18px; padding: 0 12px; }
  .teams { padding-bottom: 10px; }
  .row { display: flex; align-items: center; gap: 14px; min-height: 56px; width: 100%; text-align: left; }
  .box {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    border: 3px solid var(--ligne);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--nuit);
  }
  .box.on { background: var(--texte); border-color: var(--texte); }
  .name { font-family: var(--font-display); font-weight: 600; font-size: 19px; }
  .add { display: flex; gap: 10px; align-items: center; }
  .add input {
    flex-grow: 1;
    min-width: 0;
    height: 56px;
    border-radius: 20px;
    padding: 0 16px;
    background: var(--surface);
    color: var(--texte);
    border: 3px solid var(--ligne);
    font-size: 17px;
  }
  /* Bouton secondaire : le seul bouton jaune de l'écran est « C'est parti ». */
  .addbtn {
    width: 56px;
    height: 56px;
    border-radius: 20px;
    background: var(--surface-plus);
    color: var(--texte);
    box-shadow: 0 4px 0 var(--secondary-ombre);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .addbtn:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 var(--secondary-ombre); }
  .addbtn:disabled { opacity: 0.45; }
  .error { margin: 0; color: var(--ko); font-weight: 800; font-size: 15px; text-align: center; }
</style>
