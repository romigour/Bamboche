<script lang="ts">
  import { untrack } from 'svelte';
  import { get, type Writable } from 'svelte/store';
  import { tap } from '../feedback';
  import { players } from '../players';
  import { cyclePlayer, pruneTeams, resizeTeams, shuffleInto } from '../teamDraft';
  import { validateTeams, type TeamDraft } from '../teams';
  import Icon from './Icon.svelte';
  import Stepper from './Stepper.svelte';

  /** Formation des équipes, partagée entre les jeux : nombre d'équipes, tirage, joueurs à toucher. */
  let {
    draft,
    minPerTeam,
    onconfigure,
    showErrors = true,
  }: { draft: Writable<TeamDraft[]>; minPerTeam: number; onconfigure: () => void; showErrors?: boolean } = $props();

  // première ouverture : deux équipes tirées au hasard
  untrack(() => {
    if (get(draft).length === 0) {
      const ps = get(players);
      draft.set(ps.length >= 2 ? shuffleInto([], ps, 2) : resizeTeams([], 2));
    }
  });

  const teams = $derived(pruneTeams($draft, $players));
  const names = $derived(Object.fromEntries($players.map((p) => [p.id, p.name])));
  const assigned = $derived(new Set(teams.flatMap((t) => t.playerIds)));
  const unassigned = $derived($players.filter((p) => !assigned.has(p.id)));
  const check = $derived(validateTeams(teams, 2, minPerTeam, names));

  function move(id: string) {
    tap();
    draft.set(cyclePlayer(teams, id));
  }
  const plural = (n: number) => `${n} joueur${n > 1 ? 's' : ''}`;
</script>

  <div class="row">
    <Stepper
      value={teams.length}
      min={2}
      max={20}
      format={(n) => `${n} équipes`}
      lessLabel="Une équipe de moins"
      moreLabel="Une équipe de plus"
      onchange={(n) => draft.set(resizeTeams(teams, n))}
    />
    <button
      type="button"
      class="shuffle"
      onclick={() => {
        tap();
        draft.set(shuffleInto(teams, $players, teams.length));
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
        <button type="button" class="config" onclick={onconfigure}>
          <Icon name="plus" size={16} stroke={3} />Configurer les joueurs
        </button>
      </div>
    </div>
    <p class="tip">Touche un joueur pour le changer d'équipe.</p>
  </div>

{#if showErrors && !check.ok}
  <ul class="errors" aria-live="polite">
    {#each check.errors as e}<li>{e}</li>{/each}
  </ul>
{/if}

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
  .errors { list-style: none; margin: 0; padding: 0; color: var(--ko); font-weight: 800; font-size: 15px; text-align: center; }
</style>
