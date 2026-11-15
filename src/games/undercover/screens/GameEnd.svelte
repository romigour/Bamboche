<script lang="ts">
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import { alive, type Role, type UndercoverState } from '../logic/game';
  import { deadTime } from './deadTime';

  /** Fin de partie : vainqueur, mots, rôles et points gagnés. */
  let { s, oncontinue }: { s: UndercoverState; oncontinue: () => void } = $props();

  const LABEL: Record<Role, string> = { civil: 'Civil', undercover: 'Undercover', mrwhite: 'Mr White' };
  const guard = deadTime();

  const title = $derived.by(() => {
    if (s.winner === 'civils') return 'Les civils gagnent !';
    if (s.winner === 'mrwhite') return 'Mr White a trouvé le mot !';
    const left = alive(s).filter((id) => s.roles[id] !== 'civil');
    if (left.length === 1) return s.roles[left[0]] === 'mrwhite' ? 'Mr White gagne !' : "L'undercover gagne !";
    return 'Les imposteurs gagnent !';
  });
</script>

<Screen color="undercover" eyebrow="Partie {s.gameNumber}" {title}>
  <div class="words">
    <div class="word"><span class="k">Mot des civils</span><span class="w">{s.civilWord}</span></div>
    <div class="word"><span class="k">Mot de l'undercover</span><span class="w">{s.undercoverWord}</span></div>
  </div>
  <ul>
    {#each s.players as p (p.id)}
      <li>
        <span class="n">{p.name}</span>
        <span class="r">{LABEL[s.roles[p.id]]}</span>
        <span class="g">+{s.gained[p.id] ?? 0}</span>
      </li>
    {/each}
  </ul>
  {#snippet footer()}
    <BigButton variant="pop" onclick={guard(oncontinue)}>Voir les scores</BigButton>
  {/snippet}
</Screen>

<style>
  .words { display: flex; gap: 10px; }
  .word { flex: 1; min-width: 0; background: var(--surface); border-radius: 18px; padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; }
  .k { font-size: 13px; font-weight: 800; color: var(--texte-doux); }
  .w { font-family: var(--font-display); font-weight: 700; font-size: 24px; overflow-wrap: anywhere; }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  li { display: flex; align-items: center; gap: 10px; min-height: 56px; background: var(--surface); border-radius: 18px; padding: 8px 14px; }
  .n { flex: 1; min-width: 0; font-family: var(--font-display); font-weight: 600; font-size: 18px; overflow-wrap: anywhere; }
  .r { font-size: 14px; font-weight: 800; color: var(--texte-doux); }
  .g { font-family: var(--font-display); font-weight: 700; font-size: 22px; color: var(--pop); min-width: 2.5ch; text-align: right; }
</style>
