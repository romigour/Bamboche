<script lang="ts">
  import type { Cell, Participant } from '../logic/sheet';

  let {
    participants,
    rounds,
    pending,
    cursor = null,
    draft = '',
    onselect,
  }: {
    participants: Participant[];
    rounds: number[][];
    pending?: (number | null)[];
    cursor?: Cell | null;
    draft?: string;
    onselect?: (c: Cell) => void;
  } = $props();

  const columns = $derived(rounds.length + (pending ? 1 : 0));
  const totals = $derived(participants.map((_, i) => rounds.reduce((sum, r) => sum + (r[i] ?? 0), 0)));

  function valueAt(round: number, index: number): number | null {
    return round < rounds.length ? (rounds[round][index] ?? null) : (pending?.[index] ?? null);
  }
  const isCursor = (round: number, index: number) => cursor?.round === round && cursor?.index === index;

  let wrap: HTMLDivElement | undefined = $state();
  $effect(() => {
    void cursor?.round;
    void cursor?.index;
    // scrollIntoView n'existe pas partout (jsdom) : appel optionnel
    wrap?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  });
</script>

<div class="wrap" bind:this={wrap}>
  <table>
    <thead>
      <tr>
        <th class="name" scope="col">Joueur</th>
        {#each Array.from({ length: columns }, (_, r) => r) as r (r)}
          <th scope="col">M{r + 1}</th>
        {/each}
        <th class="total" scope="col">Total</th>
      </tr>
    </thead>
    <tbody>
      {#each participants as p, i (p.id)}
        <tr>
          <th class="name" scope="row">{p.name}</th>
          {#each Array.from({ length: columns }, (_, r) => r) as r (r)}
            {@const v = valueAt(r, i)}
            {#if isCursor(r, i)}
              <td class="cur" aria-current="true">{draft || '·'}</td>
            {:else if v !== null && onselect}
              <td><button type="button" onclick={() => onselect({ round: r, index: i })}>{v}</button></td>
            {:else}
              <td>{v ?? ''}</td>
            {/if}
          {/each}
          <td class="total">{totals[i]}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  /* scroll-padding : la colonne courante ne se cache jamais sous les colonnes collantes Joueur / Total. */
  .wrap {
    overflow-x: auto;
    background: var(--surface);
    border-radius: 18px;
    touch-action: manipulation;
    scroll-padding-inline: 110px 64px;
  }
  table { border-collapse: separate; border-spacing: 0; width: 100%; font-family: var(--font-display); }
  /* Hauteur fixe : une ligne ne change jamais de taille selon son contenu. */
  th, td { height: 58px; padding: 0 4px; box-sizing: border-box; text-align: center; min-width: 56px; font-weight: 600; }
  thead th { height: 40px; }
  th[scope='col'] { color: var(--texte-doux); font-size: 14px; }
  .name, .total { position: sticky; background: var(--surface); z-index: 1; }
  .name { left: 0; text-align: left; font-weight: 700; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .total { right: 0; font-weight: 700; }
  td button {
    min-width: 56px;
    height: 56px;
    border-radius: 12px;
    background: var(--surface-plus);
    color: var(--texte);
    font: inherit;
    box-shadow: 0 3px 0 var(--secondary-ombre);
  }
  td button:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--secondary-ombre); }
  .cur { background: var(--pop); color: var(--nuit); border-radius: 12px; font-weight: 700; }
</style>
