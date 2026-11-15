<script lang="ts">
  import { get } from 'svelte/store';
  import { players } from '../../lib/players';
  import Setup from './screens/Setup.svelte';
  import { createSeries } from './logic/game';
  import { startUndercover } from './session';
  import { mrWhiteOn } from './setup';
  import words from './words.json';

  /** Lance une série à partir des joueurs de la soirée. */
  let { onhome }: { onhome: () => void } = $props();

  const start = () => startUndercover(createSeries(get(players), get(mrWhiteOn), words));
</script>

<Setup onstart={start} onback={onhome} />
