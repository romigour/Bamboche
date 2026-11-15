<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import IconButton from '../../../lib/ui/IconButton.svelte';

  /** « Connexion requise pour la musique » : à l'entrée du jeu, ou par-dessus une partie. */
  let { onretry, onhome, overlay = false }: { onretry: () => void; onhome: () => void; overlay?: boolean } = $props();
</script>

<div class="page" class:overlay role={overlay ? 'dialog' : undefined} aria-modal={overlay ? 'true' : undefined}>
  {#if !overlay}<IconButton icon="back" label="Retour à l'accueil" onclick={onhome} />{/if}
  <div class="mid">
    <div class="circle">
      <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        ><path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.8M14.2 10.2a10 10 0 0 1 4.8 2.7M2 9.3a15 15 0 0 1 4.1-2.6M10.6 5.6A15 15 0 0 1 22 9.3"
        ></path><circle cx="12" cy="20" r="1" fill="currentColor"></circle></svg
      >
    </div>
    <h1>Connexion requise pour la musique</h1>
    <p>Les extraits sont lus depuis Internet. Active le wifi ou les données mobiles, puis réessaie.</p>
    {#if overlay}
      <div class="note">La partie et les scores sont gardés : tu pourras la reprendre depuis l'accueil.</div>
    {:else}
      <div class="note">Envie de jouer quand même ? <span class="tu">Time Up</span> marche sans réseau.</div>
    {/if}
  </div>
  <BigButton variant="pop" onclick={onretry}>Réessayer</BigButton>
  <BigButton variant="secondary" size="md" onclick={onhome}>Retour à l'accueil</BigButton>
</div>

<style>
  .page {
    flex: 1;
    min-height: 100dvh;
    background: var(--nuit);
    padding: calc(28px + env(safe-area-inset-top)) 24px calc(26px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .overlay { position: fixed; inset: 0; z-index: 20; }
  .mid { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; text-align: center; }
  .circle {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: var(--surface);
    border: 4px dashed var(--blindtest);
    color: var(--blindtest);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  h1 { font-size: 32px; line-height: 1.1; }
  p { margin: 0; font-size: 17px; color: var(--texte-doux); font-weight: 700; max-width: 300px; }
  .note { background: var(--surface); border-radius: 18px; padding: 12px 16px; font-size: 15px; font-weight: 700; color: var(--texte-doux); max-width: 300px; }
  .tu { color: var(--timeup); }
</style>
