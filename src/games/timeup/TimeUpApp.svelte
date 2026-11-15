<script lang="ts">
  import { get } from 'svelte/store';
  import { normalizeWord } from '../../lib/normalize';
  import { players } from '../../lib/players';
  import { getSettings } from '../../lib/settings';
  import { drawQuickCards } from './logic/deck';
  import { findDuplicates, replaceWord, toCards, type TeamWords } from './logic/dedupe';
  import { createGame } from './logic/game';
  import type { Card, WordEntry as Word } from '../../lib/teams';
  import { pruneTeams, teamsDraft } from './setup';
  import { startGame } from './session';
  import { timeup } from './module';
  import words from './words.json';
  import Duplicates from './screens/Duplicates.svelte';
  import Mode from './screens/Mode.svelte';
  import PassPhone from './screens/PassPhone.svelte';
  import Teams from './screens/Teams.svelte';
  import WordEntry from './screens/WordEntry.svelte';

  /** Préparation d'une partie : équipes → mode → (saisie perso → doublons) → partie. */
  let { initialStep = 'teams', onhome }: { initialStep?: 'teams' | 'mode'; onhome: () => void } = $props();

  type Step =
    | { kind: 'teams' }
    | { kind: 'mode' }
    | { kind: 'pass'; teamIndex: number; then: 'entry' | 'dup' }
    | { kind: 'entry'; teamIndex: number }
    | { kind: 'dup' };

  let step = $state<Step>({ kind: (() => initialStep)() });
  let wordsPerTeam = $state(5);
  let entries = $state<TeamWords[]>([]);
  let lastHolder = $state<string | null>(null);

  const teams = $derived(pruneTeams($teamsDraft, $players));
  const names = $derived(Object.fromEntries($players.map((p) => [p.id, p.name])));
  const dups = $derived(step.kind === 'dup' || step.kind === 'pass' ? findDuplicates(entries) : []);

  function launch(cards: Card[]) {
    const s = getSettings(timeup);
    teamsDraft.set(teams);
    startGame(createGame(teams, get(players), cards, { turnSeconds: s.turnSeconds, rounds: s.rounds }));
  }

  function quick() {
    launch(drawQuickCards(words as Word[], getSettings(timeup).quickCards));
  }

  function custom(n: number) {
    wordsPerTeam = n;
    entries = [];
    lastHolder = null;
    step = { kind: 'pass', teamIndex: 0, then: 'entry' };
  }

  function submitWords(teamIndex: number, list: string[]) {
    entries = [...entries, { teamId: teams[teamIndex].id, words: list }];
    lastHolder = teams[teamIndex].id;
    if (teamIndex + 1 < teams.length) step = { kind: 'pass', teamIndex: teamIndex + 1, then: 'entry' };
    else nextDuplicate();
  }

  function nextDuplicate() {
    const d = findDuplicates(entries)[0];
    if (!d) {
      launch(toCards(entries));
      return;
    }
    const idx = teams.findIndex((t) => t.id === d.teamId);
    step = d.teamId === lastHolder ? { kind: 'dup' } : { kind: 'pass', teamIndex: idx, then: 'dup' };
  }

  function replace(word: string) {
    const d = dups[0];
    entries = replaceWord(entries, d.teamId, d.index, word);
    lastHolder = d.teamId;
    nextDuplicate();
  }

  /** Formes déjà présentes, hors le mot à remplacer. */
  function takenFor(): Set<string> {
    const d = dups[0];
    const set = new Set<string>();
    for (const e of entries)
      e.words.forEach((w, i) => {
        if (!(e.teamId === d.teamId && i === d.index)) set.add(normalizeWord(w));
      });
    return set;
  }
</script>

{#if step.kind === 'teams'}
  <Teams onback={onhome} onnext={() => (step = { kind: 'mode' })} />
{:else if step.kind === 'mode'}
  <Mode onback={() => (step = { kind: 'teams' })} onquick={quick} oncustom={custom} />
{:else if step.kind === 'pass'}
  {@const s = step}
  {@const team = teams[s.teamIndex]}
  {#key `${s.teamIndex}-${s.then}`}
    <PassPhone
      {team}
      playerNames={team.playerIds.map((id) => names[id])}
      step={s.then === 'entry' ? `Saisie des mots · équipe ${s.teamIndex + 1} sur ${teams.length}` : 'Un mot à changer'}
      onready={() => {
        lastHolder = team.id;
        step = s.then === 'entry' ? { kind: 'entry', teamIndex: s.teamIndex } : { kind: 'dup' };
      }}
    />
  {/key}
{:else if step.kind === 'entry'}
  {@const s = step}
  {#key s.teamIndex}
    <WordEntry team={teams[s.teamIndex]} count={wordsPerTeam} onsubmit={(list) => submitWords(s.teamIndex, list)} />
  {/key}
{:else if step.kind === 'dup' && dups.length > 0}
  {@const d = dups[0]}
  {#key `${d.teamId}-${d.index}`}
    <Duplicates
      team={teams.find((t) => t.id === d.teamId)!}
      dup={d}
      remaining={dups.filter((x) => x.teamId === d.teamId).length}
      taken={takenFor()}
      onreplace={replace}
    />
  {/key}
{/if}
