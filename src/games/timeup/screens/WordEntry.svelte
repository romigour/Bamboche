<script lang="ts">
  import { normalizeWord } from '../../../lib/normalize';
  import type { TeamDraft } from '../../../lib/teams';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import { validateEntry } from '../logic/dedupe';

  /** Saisie secrète des N mots d'une équipe. */
  let { team, count, onsubmit }: { team: TeamDraft; count: number; onsubmit: (words: string[]) => void } = $props();

  let words = $state<string[]>(Array.from({ length: (() => count)() }, () => ''));
  const filled = $derived(words.filter((w) => normalizeWord(w)).length);
  const ok = $derived(validateEntry(words, count).ok);
  const EXAMPLES = ['Céline Dion', 'Brosse à dents', 'Pikachu', 'Tour Eiffel', 'Girafe', 'Titanic', 'Napoléon', 'Parapluie', 'Shrek', 'Disneyland'];
</script>

<Screen color={team.color} eyebrow="{team.name} · en secret" title="Écrivez vos {count} mots">
  <p class="sub">Personnages, célébrités, objets… ce que vous voulez !</p>
  <form
    class="form"
    onsubmit={(e) => {
      e.preventDefault();
      if (ok) onsubmit(words.map((w) => w.trim()));
    }}
  >
    {#each words as _, i}
      <label class="sr" for="m{i}">Mot {i + 1}</label>
      <input
        id="m{i}"
        type="text"
        bind:value={words[i]}
        placeholder="Ex. {EXAMPLES[i % EXAMPLES.length]}"
        maxlength="40"
        autocomplete="off"
        autocapitalize="sentences"
        enterkeyhint={i === count - 1 ? 'done' : 'next'}
        style:--tc="var(--{team.color})"
      />
    {/each}
    <div class="progress" aria-label="{filled} mots sur {count}">
      {#each words as w}<span class:on={!!normalizeWord(w)} style:--tc="var(--{team.color})"></span>{/each}
    </div>
  </form>
  {#snippet footer()}
    <BigButton variant="pop" disabled={!ok} onclick={() => onsubmit(words.map((w) => w.trim()))}>Valider nos mots</BigButton>
  {/snippet}
</Screen>

<style>
  .sub { margin: -6px 0 0; font-size: 15px; color: var(--texte-doux); font-weight: 700; }
  .form { display: flex; flex-direction: column; gap: 10px; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  input {
    height: 52px;
    border-radius: 16px;
    border: 3px solid var(--surface-plus);
    background: var(--surface);
    color: var(--texte);
    padding: 0 16px;
    font-weight: 700;
    font-size: 18px;
    outline: none;
  }
  input:focus { border-color: var(--tc); }
  input::placeholder { color: #8c80b8; }
  .progress { display: flex; gap: 8px; justify-content: center; padding-top: 6px; }
  .progress span { width: 28px; height: 8px; border-radius: 999px; background: var(--surface-plus); }
  .progress span.on { background: var(--tc); }
</style>
