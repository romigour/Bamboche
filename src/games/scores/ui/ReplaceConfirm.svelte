<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';

  /** Confirmation avant d'écraser la feuille en cours par une nouvelle partie. */
  let { gameName, onconfirm, oncancel }: { gameName: string; onconfirm: () => void; oncancel: () => void } = $props();
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Partie en cours">
  <div class="sheet">
    <div class="grip"></div>
    <p class="confirm">La partie de {gameName} en cours sera abandonnée.</p>
    <BigButton variant="ko" size="md" onclick={onconfirm}>Abandonner et commencer</BigButton>
    <BigButton variant="secondary" size="md" onclick={oncancel}>Annuler</BigButton>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; background: rgba(15, 9, 32, 0.8); display: flex; flex-direction: column; justify-content: flex-end; z-index: 10; }
  .sheet {
    background: var(--surface);
    border-radius: 36px 36px 0 0;
    padding: 14px 20px calc(28px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .grip { width: 48px; height: 6px; border-radius: 999px; background: var(--ligne); align-self: center; }
  .confirm { margin: 0; text-align: center; font-weight: 800; font-size: 17px; }
</style>
