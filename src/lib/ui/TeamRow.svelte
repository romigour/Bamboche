<script lang="ts">
  let {
    name,
    color,
    subtitle,
    score,
    highlight = false,
  }: { name: string; color: string; subtitle?: string; score?: number; highlight?: boolean } = $props();
</script>

<div class="row" class:highlight>
  <div class="dot" style:background={color}>{name.replace(/^Les\s+/i, '').charAt(0)}</div>
  <div class="txt">
    <span class="name">{name}</span>
    {#if subtitle}<span class="sub">{subtitle}</span>{/if}
  </div>
  {#if score !== undefined}<span class="score">{score}</span>{/if}
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--surface);
    border-radius: 22px;
    padding: 14px 16px;
    border: 3px solid transparent;
  }
  .highlight { border-color: var(--pop); }
  .highlight .score { color: var(--pop); }
  .dot {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    color: var(--nuit);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .txt { flex-grow: 1; display: flex; flex-direction: column; min-width: 0; }
  .name { font-family: var(--font-display); font-weight: 600; font-size: 20px; }
  .sub { font-size: 13px; color: var(--texte-doux); font-weight: 700; }
  .score { font-family: var(--font-display); font-weight: 700; font-size: 36px; }
</style>
