<script lang="ts">
  import { normalizeWord } from '../../../lib/normalize';
  import type { TeamDraft } from '../../../lib/teams';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import type { Duplicate } from '../logic/dedupe';

  /** « Oups, déjà pris ! » : remplacement d'un mot en double, en secret. */
  let {
    team,
    dup,
    remaining,
    taken,
    onreplace,
  }: {
    team: TeamDraft;
    dup: Duplicate;
    remaining: number;
    /** formes normalisées déjà utilisées (pour refuser un nouveau doublon tout de suite) */
    taken: Set<string>;
    onreplace: (word: string) => void;
  } = $props();

  let word = $state('');
  const key = $derived(normalizeWord(word));
  const clash = $derived(!!key && taken.has(key));
  const ok = $derived(!!key && !clash);
</script>

<Screen color={team.color} eyebrow="{team.name} · {remaining} mot{remaining > 1 ? 's' : ''} à changer" title="Oups, déjà pris !">
  <div class="card">
    <div class="ko"><Icon name="cross" size={30} stroke={3} /></div>
    <div class="word">{dup.word}</div>
    <p>Ce mot est déjà dans le paquet.<br />Proposez-en un autre, en secret.</p>
  </div>
  <form
    onsubmit={(e) => {
      e.preventDefault();
      if (ok) onreplace(word.trim());
    }}
  >
    <label for="remplacement" class="label">Nouveau mot</label>
    <input id="remplacement" type="text" bind:value={word} maxlength="40" autocomplete="off" style:--tc="var(--{team.color})" />
  </form>
  {#if clash}<p class="err">Celui-là aussi est déjà pris !</p>{/if}
  <p class="note">On compare sans tenir compte des accents ni des majuscules : « Astérix » = « asterix ».</p>
  {#snippet footer()}
    <BigButton variant="pop" disabled={!ok} onclick={() => onreplace(word.trim())}>Remplacer</BigButton>
  {/snippet}
</Screen>

<style>
  .card {
    background: var(--surface);
    border-radius: 24px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }
  .ko { width: 60px; height: 60px; border-radius: 50%; background: var(--ko); color: var(--nuit); display: flex; align-items: center; justify-content: center; }
  .word { font-family: var(--font-display); font-weight: 700; font-size: 30px; text-decoration: line-through; text-decoration-color: var(--ko); }
  .card p { margin: 0; color: var(--texte-doux); font-weight: 700; font-size: 15px; }
  form { display: flex; flex-direction: column; gap: 8px; }
  .label { font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  input {
    height: 60px;
    border-radius: 18px;
    border: 3px solid var(--tc);
    background: var(--surface);
    color: var(--texte);
    padding: 0 18px;
    font-weight: 800;
    font-size: 20px;
    outline: none;
  }
  .err { margin: 0; color: var(--ko); font-weight: 800; text-align: center; }
  .note { margin: 0; font-size: 14px; color: var(--texte-doux); text-align: center; }
</style>
