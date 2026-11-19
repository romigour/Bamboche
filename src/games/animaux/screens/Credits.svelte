<script lang="ts">
  import Screen from '../../../lib/ui/Screen.svelte';
  import type { Animal } from '../types';

  /** Crédits Wikimedia Commons de chaque son et de chaque photo (exigés par les licences). */
  let { animals, onback }: { animals: Animal[]; onback: () => void } = $props();

  const sorted = $derived([...animals].sort((a, b) => a.name.localeCompare(b.name, 'fr')));
</script>

<Screen color="animaux" eyebrow="Cris d'animaux" title="Crédits" back={onback}>
  <p class="intro">Sons et photos de Wikimedia Commons. Merci à leurs auteurs !</p>
  {#each sorted as a (a.id)}
    <article>
      <h2>{a.name}</h2>
      <a href={a.credits.sound.url} target="_blank" rel="noopener">Son : {a.credits.sound.author} · {a.credits.sound.license}</a>
      <a href={a.credits.photo.url} target="_blank" rel="noopener">Photo : {a.credits.photo.author} · {a.credits.photo.license}</a>
    </article>
  {/each}
</Screen>

<style>
  .intro { margin: 0; font-size: 15px; font-weight: 700; color: var(--texte-doux); }
  article { background: var(--surface); border-radius: 18px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
  h2 { margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 19px; }
  a { color: var(--texte-doux); font-size: 14px; font-weight: 700; overflow-wrap: anywhere; }
</style>
