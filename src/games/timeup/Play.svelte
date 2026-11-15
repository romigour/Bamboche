<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { play, vibrate } from '../../lib/feedback';
  import { navigate } from '../../lib/router';
  import { keepAwake, releaseAwake } from '../../lib/wakelock';
  import {
    beginRound,
    confirmTurn,
    endTurnIfExpired,
    markFound,
    markPassed,
    nextRound,
    pauseTurn,
    redoFound,
    resumeTurn,
    startTurn,
    undoFound,
    type TimeUpState,
  } from './logic/game';
  import PauseMenu from './screens/PauseMenu.svelte';
  import Podium from './screens/Podium.svelte';
  import RoundEnd from './screens/RoundEnd.svelte';
  import RoundIntro from './screens/RoundIntro.svelte';
  import Turn from './screens/Turn.svelte';
  import TurnRecap from './screens/TurnRecap.svelte';
  import TurnStart from './screens/TurnStart.svelte';
  import { abandonGame, game, loadSavedGame } from './session';
  import { draftsFromGame, teamsDraft } from './setup';

  /** Partie en cours : aiguillage par phase ; toute action passe par le moteur pur. */
  if (!$game) {
    const saved = loadSavedGame(Date.now());
    if (saved) game.set(saved);
    else navigate('/');
  }

  // Écran allumé pendant toute la partie (passage du téléphone, récap, scores), pas seulement le tour.
  onMount(() => void keepAwake());
  onDestroy(() => void releaseAwake());

  let menuOpen = $state(false);
  const s = $derived($game);
  const paused = $derived(s?.phase === 'turn' && s.turn?.endsAt === null);

  function apply(f: (s: TimeUpState) => TimeUpState) {
    const cur = $game;
    if (!cur) return;
    const next = f(cur);
    if (next === cur) return;
    // fin du chrono (tour fini avec des cartes restantes) : signal sonore et vibration, une seule fois
    if (cur.phase === 'turn' && next.phase === 'turnRecap' && next.deck.length > 0) {
      play('end');
      vibrate([200, 100, 200]);
    }
    game.set(next);
  }

  function launch() {
    apply((x) => startTurn(x, Date.now()));
    void keepAwake();
  }
  function pause() {
    apply((x) => pauseTurn(x, Date.now()));
    menuOpen = true;
  }
  function resume() {
    menuOpen = false;
    apply((x) => resumeTurn(x, Date.now()));
    void keepAwake();
  }
  function quit() {
    menuOpen = false;
    void releaseAwake();
    abandonGame();
    navigate('/');
  }
  function next() {
    apply(confirmTurn);
  }
</script>

{#if s}
  {#if s.phase === 'roundIntro'}
    <RoundIntro round={s.round} rounds={s.settings.rounds} onready={() => apply(beginRound)} />
  {:else if s.phase === 'turnStart'}
    <TurnStart {s} onlaunch={launch} onmenu={() => (menuOpen = true)} />
  {:else if s.phase === 'turn'}
    <Turn
      {s}
      onfound={() => apply((x) => markFound(x, Date.now()))}
      onpass={() => apply((x) => markPassed(x, Date.now()))}
      onexpire={() => apply((x) => endTurnIfExpired(x, Date.now()))}
      onpause={pause}
      onleave={() => apply((x) => pauseTurn(x, Date.now()))}
    />
  {:else if s.phase === 'turnRecap'}
    {#key `${s.round}-${s.currentTeam}-${s.teams[s.currentTeam].nextPlayer}`}
      <TurnRecap {s} onundo={(id) => apply((x) => undoFound(x, id))} onredo={(id) => apply((x) => redoFound(x, id))} onnext={next} />
    {/key}
  {:else if s.phase === 'roundEnd'}
    <RoundEnd {s} onnext={() => apply((x) => nextRound(x))} />
  {:else if s.phase === 'podium'}
    <Podium
      {s}
      onreplay={() => {
        teamsDraft.set(draftsFromGame(s));
        abandonGame();
        navigate('/timeup', { etape: 'mode' });
      }}
      onhome={() => {
        abandonGame();
        navigate('/');
      }}
    />
  {/if}

  {#if menuOpen || paused}
    <PauseMenu {s} onresume={s.phase === 'turn' ? resume : () => (menuOpen = false)} onquit={quit} />
  {/if}
{/if}
