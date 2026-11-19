<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { rankScores } from '../../lib/ranking';
  import { navigate } from '../../lib/router';
  import PodiumView from '../../lib/ui/PodiumView.svelte';
  import { keepAwake, releaseAwake } from '../../lib/wakelock';
  import { animalPlayer } from './audio';
  import { animalById } from './catalog';
  import { nextSound, reveal, scores, setAnswer, skipSound, type AnimauxState } from './logic/game';
  import PauseSheet from './screens/PauseSheet.svelte';
  import Reveal from './screens/Reveal.svelte';
  import Sound from './screens/Sound.svelte';
  import { abandonAnimaux, animauxGame, loadSavedAnimaux } from './session';

  /** Partie : son → révélation → … → podium. */
  if (!$animauxGame) {
    const saved = loadSavedAnimaux();
    if (saved) animauxGame.set(saved);
    else navigate('/');
  }

  const player = animalPlayer();
  let paused = $state(false);
  onMount(() => void keepAwake());
  onDestroy(() => {
    player.stop();
    void releaseAwake();
  });

  const s = $derived($animauxGame);
  const round = $derived(s ? s.rounds[s.current] : undefined);
  const animal = $derived(round ? animalById(round.animalId) : undefined);
  const options = $derived(round ? round.options.map((id) => animalById(id)).filter((a) => !!a) : []);

  function apply(f: (x: AnimauxState) => AnimauxState) {
    const cur = $animauxGame;
    if (!cur) return;
    const next = f(cur);
    if (next !== cur) {
      player.stop();
      animauxGame.set(next);
    }
  }

  function quit() {
    player.stop();
    abandonAnimaux();
    navigate('/');
  }
</script>

{#if s}
  {#if s.phase === 'sound' && animal}
    {#key s.current}
      <Sound
        {s}
        {options}
        {player}
        soundUrl={animal.sound}
        onanswer={(p, a) => animauxGame.set(setAnswer(s, p, a))}
        onreveal={() => apply(reveal)}
        onskip={() => apply(skipSound)}
        onpause={() => (paused = true)}
      />
    {/key}
  {:else if s.phase === 'reveal' && animal}
    {#key s.current}
      <Reveal {s} {animal} {options} {player} onnext={() => apply(nextSound)} />
    {/key}
  {:else if s.phase === 'podium'}
    <PodiumView
      ranking={rankScores(Object.entries(scores(s)).map(([id, total]) => ({ id, total }))).map((r) => {
        const p = s.players.find((x) => x.id === r.id)!;
        return { ...r, name: p.name, color: p.color };
      })}
      onreplay={() => {
        abandonAnimaux();
        navigate('/animaux');
      }}
      onhome={quit}
    />
  {/if}
  {#if paused && s.phase !== 'podium'}
    <PauseSheet {s} points={scores(s)} onresume={() => (paused = false)} onquit={quit} />
  {/if}
{/if}
