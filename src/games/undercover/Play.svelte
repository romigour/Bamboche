<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { rankScores } from '../../lib/ranking';
  import { navigate } from '../../lib/router';
  import { TEAM_COLORS } from '../../lib/teams';
  import PodiumView from '../../lib/ui/PodiumView.svelte';
  import { keepAwake, releaseAwake } from '../../lib/wakelock';
  import {
    afterReveal,
    alive,
    eliminate,
    finishSeries,
    lastEliminated,
    mrWhiteGuess,
    nextGame,
    seeWord,
    speakingOrder,
    toScores,
    toTalk,
    toVote,
    wordOf,
    type UndercoverState,
  } from './logic/game';
  import { abandonUndercover, loadSavedUndercover, ucGame } from './session';
  import Deal from './screens/Deal.svelte';
  import GameEnd from './screens/GameEnd.svelte';
  import MrWhiteGuess from './screens/MrWhiteGuess.svelte';
  import PauseSheet from './screens/PauseSheet.svelte';
  import Reveal from './screens/Reveal.svelte';
  import Scores from './screens/Scores.svelte';
  import Talk from './screens/Talk.svelte';
  import Vote from './screens/Vote.svelte';
  import words from './words.json';

  /** Partie d'Undercover : distribution → manches (discussion, vote, révélation) → fin → scores → podium. */
  if (!$ucGame) {
    const saved = loadSavedUndercover();
    if (saved) ucGame.set(saved);
    else navigate('/');
  }

  onMount(() => void keepAwake());
  onDestroy(() => void releaseAwake());

  const s = $derived($ucGame);
  // État d'affichage local, jamais sauvegardé : pause ouverte, joueur qui revoit son mot.
  let paused = $state(false);
  let peeking = $state<string | null>(null);

  const nameOf = (x: UndercoverState, id: string) => x.players.find((p) => p.id === id)?.name ?? '';

  function apply(f: (x: UndercoverState) => UndercoverState) {
    const cur = $ucGame;
    if (!cur) return;
    const next = f(cur);
    if (next !== cur) ucGame.set(next);
  }

  function quit() {
    abandonUndercover();
    navigate('/');
  }
</script>

{#if s}
  {#if peeking}
    {#key peeking}
      <Deal name={nameOf(s, peeking)} word={wordOf(s, peeking)} doneLabel="C'est bon" onseen={() => (peeking = null)} />
    {/key}
  {:else if s.phase === 'deal'}
    {#key s.players[s.dealIndex].id}
      <Deal name={s.players[s.dealIndex].name} word={wordOf(s, s.players[s.dealIndex].id)} onseen={() => apply((x) => seeWord(x))} />
    {/key}
  {:else if s.phase === 'talk'}
    <Talk
      round={s.round}
      order={speakingOrder(s).map((id) => ({ id, name: nameOf(s, id) }))}
      onvote={() => apply(toVote)}
      onpause={() => (paused = true)}
    />
  {:else if s.phase === 'vote'}
    <Vote
      candidates={alive(s).map((id) => ({ id, name: nameOf(s, id) }))}
      onconfirm={(id) => apply((x) => eliminate(x, id))}
      onback={() => apply(toTalk)}
      onpause={() => (paused = true)}
    />
  {:else if s.phase === 'reveal'}
    {@const id = lastEliminated(s)}
    {#if id}
      <Reveal name={nameOf(s, id)} role={s.roles[id]} oncontinue={() => apply((x) => afterReveal(x))} />
    {/if}
  {:else if s.phase === 'mrwhite'}
    {@const id = lastEliminated(s)}
    {#if id}
      <MrWhiteGuess
        name={nameOf(s, id)}
        onfound={() => apply((x) => mrWhiteGuess(x, true))}
        onmissed={() => apply((x) => mrWhiteGuess(x, false))}
      />
    {/if}
  {:else if s.phase === 'end'}
    <GameEnd {s} oncontinue={() => apply(toScores)} />
  {:else if s.phase === 'scores'}
    <Scores {s} onnext={() => apply((x) => nextGame(x, words))} onfinish={() => apply(finishSeries)} />
  {:else if s.phase === 'podium'}
    <PodiumView
      ranking={rankScores(s.players.map((p) => ({ id: p.id, total: s.totals[p.id] ?? 0 }))).map((r) => {
        const i = s.players.findIndex((p) => p.id === r.id);
        return { ...r, name: s.players[i].name, color: TEAM_COLORS[i % TEAM_COLORS.length] };
      })}
      onreplay={() => {
        abandonUndercover();
        navigate('/undercover');
      }}
      onhome={quit}
    />
  {/if}

  {#if paused && !peeking && (s.phase === 'talk' || s.phase === 'vote')}
    <PauseSheet
      {s}
      onresume={() => (paused = false)}
      onreveal={(id) => {
        paused = false;
        peeking = id;
      }}
      onquit={quit}
    />
  {/if}
{/if}
