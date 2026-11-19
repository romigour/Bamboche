<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { online } from '../../lib/online';
  import { players } from '../../lib/players';
  import { navigate } from '../../lib/router';
  import { getSettings } from '../../lib/settings';
  import { bankReady, bankUrls, downloadBank } from './bank';
  import { animals } from './catalog';
  import { createAnimaux } from './logic/game';
  import { animaux } from './module';
  import Credits from './screens/Credits.svelte';
  import Setup, { type BankStatus } from './screens/Setup.svelte';
  import { readHistory, startAnimaux } from './session';
  import { animauxLevel } from './setup';

  /** Préparation (téléchargement des sons pour le hors ligne) et crédits. */
  let { view = 'setup', onhome }: { view?: 'setup' | 'credits'; onhome: () => void } = $props();

  const urls = bankUrls(animals);
  let done = $state(0);
  let failed = $state(0);
  let finished = $state(false);
  let running = false;

  async function sync() {
    if (running) return;
    running = true;
    if (await bankReady(urls)) {
      done = urls.length;
      failed = 0;
      finished = true;
    } else if (get(online)) {
      const res = await downloadBank(urls, (d) => (done = d));
      failed = res.failed.length;
      finished = true;
    }
    running = false;
  }

  onMount(() => {
    void sync();
    // de retour en ligne : on reprend le téléchargement
    return online.subscribe((on) => {
      if (on && !finished) void sync();
    });
  });

  const bank: BankStatus = $derived({ ready: finished && failed < urls.length, done, total: urls.length, failed, offline: !$online });

  function start() {
    const settings = getSettings(animaux);
    const { state, history } = createAnimaux(get(players), animals, { sounds: settings.sounds, choices: settings.choices }, get(animauxLevel), readHistory());
    startAnimaux(state, history);
  }
</script>

{#if view === 'credits'}
  <Credits {animals} onback={() => navigate('/animaux')} />
{:else}
  <Setup
    {bank}
    onstart={start}
    onback={onhome}
    oncredits={() => navigate('/animaux/credits')}
    onretry={() => {
      finished = false;
      void sync();
    }}
  />
{/if}
