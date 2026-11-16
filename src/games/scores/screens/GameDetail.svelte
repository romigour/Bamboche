<script lang="ts">
  import { navigate } from '../../../lib/router';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import { scoreGameById } from '../defs';
  import { winners } from '../logic/stats';
  import { deleteFinished, scoreHistory } from '../session';
  import ScoreTable from '../ui/ScoreTable.svelte';

  /** Détail (lecture seule) d'une partie de l'historique. */
  let { id }: { id: string } = $props();

  const entry = $derived($scoreHistory.find((g) => g.id === id));
  const def = $derived(entry ? scoreGameById(entry.gameId) : undefined);
  const won = $derived(
    entry
      ? entry.participants
          .filter((p) => winners(entry).includes(p.id))
          .map((p) => p.name)
          .join(', ')
      : '',
  );

  let asking = $state(false);
  let deleted = false;

  $effect(() => {
    if (!deleted && (!entry || !def)) navigate('/scores/historique');
  });

  function remove() {
    if (!entry) return;
    const jeu = entry.gameId;
    deleted = true;
    deleteFinished(entry.id);
    asking = false;
    navigate('/scores/historique', { jeu });
  }
</script>

{#if entry && def}
  <Screen
    color={def.color}
    eyebrow={new Date(entry.finishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
    title={def.name}
    back={() => navigate('/scores/historique', { jeu: def.id })}
    backLabel="Retour à l'historique"
  >
    <ScoreTable participants={entry.participants} rounds={entry.rounds} />
    <p class="winner">🏆 {won}</p>

    {#snippet footer()}
      <BigButton variant="secondary" onclick={() => (asking = true)}>Supprimer cette partie</BigButton>
    {/snippet}
  </Screen>

  {#if asking}
    <div class="overlay" role="dialog" aria-modal="true" aria-label="Suppression">
      <div class="sheet">
        <div class="grip"></div>
        <p class="confirm">Supprimer cette partie de l'historique ?</p>
        <BigButton variant="ko" size="md" onclick={remove}>Oui, supprimer</BigButton>
        <BigButton variant="secondary" size="md" onclick={() => (asking = false)}>Annuler</BigButton>
      </div>
    </div>
  {/if}
{/if}

<style>
  .winner { margin: 0; text-align: center; font-family: var(--font-display); font-weight: 700; font-size: 22px; }
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
