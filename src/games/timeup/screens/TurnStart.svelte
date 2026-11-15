<script lang="ts">
  import { shortName } from '../../../lib/teams';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import IconButton from '../../../lib/ui/IconButton.svelte';
  import { currentGuesser, ROUND_RULES, totals, type TimeUpState } from '../logic/game';

  let { s, onlaunch, onmenu }: { s: TimeUpState; onlaunch: () => void; onmenu: () => void } = $props();

  const team = $derived(s.teams[s.currentTeam]);
  const guesser = $derived(currentGuesser(s));
  const others = $derived(team.players.filter((p) => p.id !== guesser.id).map((p) => p.name));
  const scores = $derived(Object.fromEntries(totals(s).map((t) => [t.teamId, t.total])));
  const othersText = $derived(
    others.length <= 1 ? `${others[0] ?? ''} devine.` : `${others.slice(0, -1).join(', ')} et ${others.at(-1)} devinent.`,
  );
</script>

<div class="page" style:background="var(--{team.color})">
  <div class="top">
    <span class="pill">Manche {s.round} · {ROUND_RULES[s.round as 1 | 2 | 3].title}</span>
    <IconButton icon="pause" label="Menu de la partie" tone="onColor" size={44} onclick={onmenu} />
  </div>
  <div class="mid">
    <div class="lead">Au tour des</div>
    <h1>{shortName(team.name)}</h1>
    <div class="who">
      <span class="av">{guesser.name.charAt(0).toUpperCase()}</span>
      <span class="wt"><span class="wn">{guesser.name}</span><span class="ws">fait deviner</span></span>
    </div>
    <p>{othersText} {s.settings.turnSeconds} secondes, c'est parti quand tu veux !</p>
    <span class="pill">{s.deck.length} carte{s.deck.length > 1 ? 's' : ''} restante{s.deck.length > 1 ? 's' : ''}</span>
  </div>
  <div class="scores" style:grid-template-columns="repeat({Math.min(s.teams.length, 3)}, minmax(0, 1fr))">
    {#each s.teams as t (t.id)}
      <div class="sc"><span class="sn">{shortName(t.name)}</span><span class="sv">{scores[t.id]}</span></div>
    {/each}
  </div>
  <BigButton variant="nuit" size="lg" onclick={onlaunch}><Icon name="play" size={24} />Lancer</BigButton>
</div>

<style>
  .page {
    flex: 1;
    min-height: 100dvh;
    color: var(--nuit);
    padding: calc(20px + env(safe-area-inset-top)) 24px calc(30px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    text-align: center;
  }
  .top { width: 100%; display: flex; justify-content: space-between; align-items: center; }
  .pill {
    height: 36px;
    padding: 0 14px;
    border-radius: 999px;
    background: rgba(26, 16, 51, 0.14);
    font-size: 14px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
  }
  .mid { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; }
  .lead { font-size: 20px; font-weight: 800; }
  h1 { font-size: 60px; line-height: 0.95; }
  .who {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--nuit);
    color: var(--texte);
    border-radius: 999px;
    padding: 8px 22px 8px 8px;
    margin-top: 8px;
  }
  .av {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--pop);
    color: var(--nuit);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wt { display: flex; flex-direction: column; align-items: flex-start; }
  .wn { font-family: var(--font-display); font-weight: 700; font-size: 22px; line-height: 1.1; }
  .ws { font-size: 14px; color: var(--texte-doux); font-weight: 700; }
  p { margin: 0; font-size: 16px; font-weight: 700; max-width: 290px; }
  .scores { width: 100%; display: grid; gap: 10px; }
  .sc { background: rgba(26, 16, 51, 0.14); border-radius: 18px; padding: 10px; display: flex; flex-direction: column; }
  .sn { font-size: 13px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sv { font-family: var(--font-display); font-weight: 700; font-size: 26px; line-height: 1.1; }
</style>
