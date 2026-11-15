<script lang="ts">
  import { wordFontSize } from '../logic/wordSize';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import IconButton from '../../../lib/ui/IconButton.svelte';
  import TransitionScreen from '../../../lib/ui/TransitionScreen.svelte';

  /**
   * Distribution secrète : « passe le téléphone à X », puis le mot au tap.
   * Le mot n'est jamais rendu avant le tap et disparaît dès « onseen » (le parent
   * enveloppe Deal dans `{#key playerId}`). Volontairement sans transition de sortie.
   */
  let {
    name,
    word,
    onseen,
    doneLabel = "J'ai retenu",
    onquit,
  }: { name: string; word: string | null; onseen: () => void; doneLabel?: string; onquit?: () => void } = $props();

  let shown = $state(false);
  let confirmQuit = $state(false);

  /** Temps mort à chaque changement d'état : un double tap ne révèle pas le mot du joueur suivant ni ne valide sans lecture. */
  let since = Date.now();
  const guard = (fn: () => void) => () => {
    if (Date.now() - since >= 400) fn();
  };
  const reveal = guard(() => {
    shown = true;
    since = Date.now();
  });
  const done = guard(() => onseen());

</script>

{#if confirmQuit}
  <TransitionScreen
    color="var(--undercover)"
    title="Quitter la série ?"
    subtitle="Les scores seront perdus."
    actionLabel="Non, on continue"
    onaction={() => (confirmQuit = false)}
  >
    <BigButton variant="ko" size="md" onclick={() => onquit?.()}>Oui, quitter</BigButton>
  </TransitionScreen>
{:else if !shown}
  <TransitionScreen
    color="var(--undercover)"
    eyebrow="Passe le téléphone à"
    title={name}
    subtitle="Les autres, on ne regarde pas !"
    actionLabel="C'est moi, voir mon mot"
    onaction={reveal}
  >
    {#snippet top()}
      {#if onquit}<IconButton icon="home" label="Quitter" tone="onColor" onclick={() => (confirmQuit = true)} />{/if}
    {/snippet}
  </TransitionScreen>
{:else if word !== null}
  <TransitionScreen color="var(--undercover)" actionLabel={doneLabel} onaction={done}>
    <span class="label">Ton mot</span>
    <span class="word" style:font-size="{wordFontSize(word)}px">{word}</span>
  </TransitionScreen>
{:else}
  <TransitionScreen
    color="var(--undercover)"
    title="Mr White"
    subtitle="Tu n'as pas de mot. Écoute et bluffe !"
    actionLabel="J'ai compris"
    onaction={done}
  />
{/if}

<style>
  .label { font-size: 15px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; }
  .word {
    font-family: var(--font-display);
    font-weight: 700;
    line-height: 1;
    max-width: 100%;
    overflow-wrap: normal;
    word-break: normal;
    hyphens: none;
  }
</style>
