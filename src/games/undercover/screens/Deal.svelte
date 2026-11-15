<script lang="ts">
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
  }: { name: string; word: string | null; onseen: () => void; doneLabel?: string } = $props();

  let shown = $state(false);

  // Réduit la taille des mots longs pour tenir sur 375 px de large.
  const wordSize = $derived(
    word === null ? 96 : word.length <= 7 ? 96 : word.length <= 10 ? 72 : word.length <= 13 ? 56 : 44,
  );
</script>

{#if !shown}
  <TransitionScreen
    color="var(--undercover)"
    eyebrow="Passe le téléphone à"
    title={name}
    subtitle="Les autres, on ne regarde pas !"
    actionLabel="C'est moi, voir mon mot"
    onaction={() => (shown = true)}
  />
{:else if word !== null}
  <TransitionScreen color="var(--undercover)" actionLabel={doneLabel} onaction={onseen}>
    <span class="label">Ton mot</span>
    <span class="word" style:font-size="{wordSize}px">{word}</span>
  </TransitionScreen>
{:else}
  <TransitionScreen
    color="var(--undercover)"
    title="Mr White"
    subtitle="Tu n'as pas de mot. Écoute et bluffe !"
    actionLabel="J'ai compris"
    onaction={onseen}
  />
{/if}

<style>
  .label { font-size: 15px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; }
  .word {
    font-family: var(--font-display);
    font-weight: 700;
    line-height: 1;
    max-width: 100%;
    overflow-wrap: anywhere;
  }
</style>
