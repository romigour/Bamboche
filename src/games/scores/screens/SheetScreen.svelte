<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '../../../lib/router';
  import { keepAwake, releaseAwake } from '../../../lib/wakelock';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import IconButton from '../../../lib/ui/IconButton.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import Stepper from '../../../lib/ui/Stepper.svelte';
  import { endLabel, scoreGameById } from '../defs';
  import { applyKey, bufferValue, type Buffer, type Key } from '../logic/keypad';
  import {
    cursor,
    endMessage,
    endReached,
    enter,
    hasPending,
    progressLine,
    removeLast,
    select,
    suggestion,
    type Cell,
    type Sheet,
  } from '../logic/sheet';
  import { abandonSheet, currentSheet, finishSheet, rememberEndValue } from '../session';
  import Keypad from '../ui/Keypad.svelte';
  import ScoreTable from '../ui/ScoreTable.svelte';

  /** Feuille en cours : tableau, pavé, fin de partie et menu d'options. */
  const def = $derived($currentSheet ? scoreGameById($currentSheet.gameId) : undefined);

  $effect(() => {
    if (!$currentSheet || !def) navigate('/scores');
  });

  onMount(() => {
    void keepAwake();
    return () => void releaseAwake();
  });

  /** Tampon du pavé : valeur à corriger, proposition (Belote) ou vide. */
  function freshBuffer(s: Sheet): Buffer {
    if (s.editing) {
      // Correction : on repart de la valeur actuelle (Suivant la garde, taper la remplace).
      const { round, index } = s.editing;
      const v = round < s.rounds.length ? s.rounds[round][index] : s.pending[index];
      return { text: String(v ?? 0), replace: true };
    }
    const d = scoreGameById(s.gameId);
    const sug = d ? suggestion(d, s) : null;
    return sug === null ? { text: '', replace: false } : { text: String(sug), replace: true };
  }

  let buffer = $state<Buffer>($currentSheet ? freshBuffer($currentSheet) : { text: '', replace: false });
  let panel = $state<'end' | 'menu' | null>(null);
  let confirm = $state<'finish' | 'abandon' | null>(null);

  function apply(s: Sheet) {
    currentSheet.set(s);
    buffer = freshBuffer(s);
  }

  function onNext() {
    const s = $currentSheet;
    if (!s || !def) return;
    const next = enter(s, bufferValue(buffer));
    apply(next);
    if (next.rounds.length > s.rounds.length && endReached(def, next)) panel = 'end';
  }

  function onSelect(c: Cell) {
    if ($currentSheet) apply(select($currentSheet, c));
  }

  function closePanel() {
    panel = null;
    confirm = null;
  }

  function setEnd(v: number) {
    const s = $currentSheet;
    if (!s) return;
    currentSheet.set({ ...s, endValue: v });
    rememberEndValue(s.gameId, v);
  }

  function dropLast() {
    if ($currentSheet) apply(removeLast($currentSheet));
    closePanel();
  }

  function abandon() {
    abandonSheet();
    navigate('/scores');
  }

  const cur = $derived($currentSheet ? cursor($currentSheet) : null);
  const canDrop = $derived(!!$currentSheet && ($currentSheet.rounds.length > 0 || hasPending($currentSheet)));
</script>

{#if $currentSheet && def}
  {@const s = $currentSheet}
  <Screen
    color={def.color}
    eyebrow={def.name}
    title={`Manche ${s.rounds.length + 1}`}
    back={() => navigate('/scores')}
  >
    {#snippet actions()}
      <IconButton icon="settings" label="Options" tone="onColor" onclick={() => (panel = 'menu')} />
    {/snippet}

    <ScoreTable
      participants={s.participants}
      rounds={s.rounds}
      pending={s.pending}
      cursor={cur}
      draft={buffer.text}
      onselect={onSelect}
    />
    <p class="progress">{progressLine(def, s)}</p>
    <Keypad onkey={(k: Key) => (buffer = applyKey(buffer, k))} onnext={onNext} />
  </Screen>

  {#if panel}
    <div class="overlay" role="dialog" aria-modal="true" aria-label={panel === 'end' ? 'Fin de partie' : 'Options'}>
      <div class="sheet">
        <div class="grip"></div>
        {#if panel === 'end'}
          <h1>{endMessage(def, s)}</h1>
          <BigButton variant="pop" onclick={() => finishSheet(Date.now())}>Voir le classement</BigButton>
          <BigButton variant="secondary" size="md" onclick={closePanel}>Continuer la feuille</BigButton>
        {:else if confirm === 'finish'}
          <p class="confirm">
            Terminer la partie ? Elle sera enregistrée dans l'historique.{hasPending(s)
              ? ' La manche en cours ne sera pas comptée.'
              : ''}
          </p>
          <BigButton variant="pop" size="md" onclick={() => finishSheet(Date.now())}>Oui, terminer</BigButton>
          <BigButton variant="secondary" size="md" onclick={() => (confirm = null)}>Non, on continue</BigButton>
        {:else if confirm === 'abandon'}
          <p class="confirm">Abandonner la partie ? Rien ne sera enregistré.</p>
          <BigButton variant="ko" size="md" onclick={abandon}>Oui, abandonner</BigButton>
          <BigButton variant="secondary" size="md" onclick={() => (confirm = null)}>Non, on continue</BigButton>
        {:else}
          <h1>Options</h1>
          <div class="field">
            <span class="label">Modifier la fin de partie</span>
            <Stepper
              value={s.endValue}
              min={def.end.min}
              max={def.end.max}
              step={def.end.step}
              format={(n) => endLabel(def, n)}
              onchange={setEnd}
            />
          </div>
          <BigButton variant="secondary" size="md" disabled={!canDrop} onclick={dropLast}>
            Supprimer la dernière manche
          </BigButton>
          <BigButton variant="secondary" size="md" disabled={s.rounds.length === 0} onclick={() => (confirm = 'finish')}>
            Terminer la partie
          </BigButton>
          <button type="button" class="quit" onclick={() => (confirm = 'abandon')}>Abandonner la partie</button>
          <BigButton variant="secondary" size="md" onclick={closePanel}>Fermer</BigButton>
        {/if}
      </div>
    </div>
  {/if}
{/if}

<style>
  .progress { margin: 0; text-align: center; font-weight: 800; font-size: 16px; color: var(--texte-doux); }
  .overlay { position: fixed; inset: 0; background: rgba(15, 9, 32, 0.8); display: flex; flex-direction: column; justify-content: flex-end; z-index: 10; }
  .sheet {
    background: var(--surface);
    border-radius: 36px 36px 0 0;
    padding: 14px 20px calc(28px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-height: 90dvh;
    overflow-y: auto;
  }
  .grip { width: 48px; height: 6px; border-radius: 999px; background: var(--ligne); align-self: center; }
  h1 { font-size: 30px; line-height: 1.05; }
  .field { display: flex; flex-direction: column; gap: 8px; }
  .label { font-size: 15px; font-weight: 700; color: var(--texte-doux); }
  .quit {
    height: 56px;
    border-radius: 20px;
    border: 3px solid var(--ligne);
    color: var(--ko);
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 19px;
  }
  .confirm { margin: 0; text-align: center; font-weight: 800; font-size: 17px; }
</style>
