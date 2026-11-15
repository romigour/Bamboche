<script lang="ts">
  import type { TeamDraft } from '../../../lib/teams';
  import Icon from '../../../lib/ui/Icon.svelte';
  import TransitionScreen from '../../../lib/ui/TransitionScreen.svelte';

  /** « Passe le téléphone aux … » : plein aplat à la couleur de l'équipe. */
  let {
    team,
    playerNames,
    step,
    onready,
  }: { team: TeamDraft; playerNames: string[]; step: string; onready: () => void } = $props();
</script>

<TransitionScreen color="var(--{team.color})" actionLabel="C'est nous !" onaction={onready}>
  {#snippet top()}
    <span class="pill">{step}</span>
  {/snippet}
  <div class="circle"><Icon name="users" size={84} stroke={2} /></div>
  <span class="lead">Passe le téléphone aux</span>
  <span class="big">{team.name.replace(/^Les\s+/i, '')}</span>
  <span class="names">{playerNames.join(', ')}</span>
  <div class="secret"><Icon name="eyeoff" size={22} />Les autres, on ne regarde pas !</div>
</TransitionScreen>

<style>
  .pill {
    margin: 0 auto;
    height: 36px;
    padding: 0 16px;
    border-radius: 999px;
    background: rgba(26, 16, 51, 0.14);
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    display: inline-flex;
    align-items: center;
  }
  .circle {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(26, 16, 51, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }
  .lead { font-size: 20px; font-weight: 800; }
  .big { font-family: var(--font-display); font-weight: 700; font-size: 56px; line-height: 1; }
  .names { font-size: 18px; font-weight: 700; }
  .secret {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(26, 16, 51, 0.12);
    border-radius: 18px;
    padding: 12px 16px;
    font-size: 15px;
    font-weight: 800;
    margin-top: 8px;
  }
</style>
