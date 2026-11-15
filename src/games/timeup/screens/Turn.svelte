<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { play, vibrate } from '../../../lib/feedback';
  import Icon from '../../../lib/ui/Icon.svelte';
  import IconButton from '../../../lib/ui/IconButton.svelte';
  import TimerBar from '../../../lib/ui/TimerBar.svelte';
  import { currentCard, ROUND_RULES, timeLeft, type TimeUpState } from '../logic/game';

  /** Tour en cours : chrono, carte, Passer / Trouvé (boutons ou balayage). */
  let {
    s,
    onfound,
    onpass,
    onexpire,
    onpause,
    onleave,
  }: {
    s: TimeUpState;
    onfound: () => void;
    onpass: () => void;
    onexpire: () => void;
    onpause: () => void;
    /** appelé quand l'écran se ferme (navigation) : le parent met le tour en pause sans ouvrir le menu */
    onleave?: () => void;
  } = $props();

  const HINT: Record<number, string> = { 1: 'Décris sans dire le mot.', 2: 'Un seul mot !', 3: 'Mime, sans un bruit !' };
  const SWIPE = 80;

  let now = $state(Date.now());
  let timer: ReturnType<typeof setInterval> | undefined;
  let lastSecond = -1;
  const left = $derived(timeLeft(s, now));
  const seconds = $derived(Math.ceil(left / 1000));
  const card = $derived(currentCard(s));
  const team = $derived(s.teams[s.currentTeam]);
  const clock = $derived(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
  const author = $derived(card?.byTeamId ? s.teams.find((t) => t.id === card.byTeamId)?.name : undefined);

  function frame() {
    now = Date.now();
    const sec = Math.ceil(timeLeft(s, now) / 1000);
    if (sec !== lastSecond) {
      if (sec > 0 && sec <= 5 && lastSecond !== -1) play('tick');
      lastSecond = sec;
    }
    if (s.turn?.endsAt !== null && s.turn && now >= s.turn.endsAt) {
      clearInterval(timer);
      onexpire(); // le signal de fin est joué par Play, quelle que soit la façon dont le tour se termine
    }
  }

  function onVisibility() {
    if (document.visibilityState === 'hidden') onpause();
  }

  onMount(() => {
    // intervalle plutôt que requestAnimationFrame : continue même quand l'affichage est ralenti
    timer = setInterval(frame, 100);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onpause);
  });
  onDestroy(() => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onpause);
    onleave?.();
  });

  /** Temps mort après chaque action : un double tap ne compte qu'une fois. */
  const COOLDOWN_MS = 350;
  let lastAction = 0;
  function ready(): boolean {
    const t = Date.now();
    if (t - lastAction < COOLDOWN_MS) return false;
    lastAction = t;
    return true;
  }

  /** Temps écoulé mais pas encore vu par l'intervalle : on termine le tour au lieu de compter. */
  function timeIsUp(): boolean {
    if (timeLeft(s, Date.now()) > 0) return false;
    clearInterval(timer);
    onexpire();
    return true;
  }

  function found() {
    if (timeIsUp() || !ready()) return;
    play('found');
    vibrate(30);
    onfound();
  }
  function pass() {
    // une seule carte : « Passer » ne fait rien, donc ni son ni vibration
    if (s.deck.length < 2 || timeIsUp() || !ready()) return;
    play('pass');
    vibrate(15);
    onpass();
  }

  // Balayage : la carte suit le doigt, au-delà du seuil droite = trouvé, gauche = passer.
  let dx = $state(0);
  let startX: number | null = null;
  let pointerId: number | null = null;
  function down(e: PointerEvent) {
    startX = e.clientX;
    pointerId = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function moveCard(e: PointerEvent) {
    if (startX !== null && e.pointerId === pointerId) dx = e.clientX - startX;
  }
  function up(e: PointerEvent) {
    if (startX === null || e.pointerId !== pointerId) return;
    const d = dx;
    startX = null;
    pointerId = null;
    dx = 0;
    if (d > SWIPE) found();
    else if (d < -SWIPE) pass();
  }
</script>

<div class="page">
  <div class="top">
    <IconButton icon="pause" label="Pause" onclick={onpause} />
    <div class="who">
      <span class="eyebrow">Manche {s.round} · {ROUND_RULES[s.round as 1 | 2 | 3].title}</span>
      <span class="team" style:color="var(--{team.color})">{team.name}</span>
    </div>
    <div class="count" aria-label="{s.turn?.foundIds.length ?? 0} trouvés">{s.turn?.foundIds.length ?? 0}</div>
  </div>

  <div class="timer">
    <div class="clock" class:low={seconds <= 5}>{clock}</div>
    <TimerBar ratio={left / (s.settings.turnSeconds * 1000)} color="timeup" />
  </div>

  <div
    class="card"
    class:go-right={dx > SWIPE}
    class:go-left={dx < -SWIPE}
    style:transform="translateX({dx}px) rotate({dx / 20}deg)"
    style:transition={dx === 0 ? 'transform .2s ease' : 'none'}
    onpointerdown={down}
    onpointermove={moveCard}
    onpointerup={up}
    onpointercancel={up}
    role="group"
    aria-label="Carte à faire deviner"
  >
    {#if card}
      {#if card.category}<span class="cat">{card.category}</span>{:else if author}<span class="cat">Mot des {author.replace(/^Les\s+/i, '')}</span>{/if}
      <div class="word">{card.text}</div>
      <div class="hint">{HINT[s.round] ?? ''}</div>
    {/if}
  </div>
  <div class="swipe"><span>← glisse pour passer</span><span>glisse si trouvé →</span></div>

  <div class="actions">
    <button type="button" class="act ko" onclick={pass} disabled={s.deck.length < 2}>
      <Icon name="skip" size={30} stroke={2.8} />Passer
    </button>
    <button type="button" class="act ok" onclick={found}>
      <Icon name="check" size={34} stroke={3.2} />Trouvé !
    </button>
  </div>
</div>

<style>
  .page {
    flex: 1;
    min-height: 100dvh;
    padding: calc(20px + env(safe-area-inset-top)) 20px calc(26px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 18px;
    touch-action: manipulation;
  }
  .top { display: flex; justify-content: space-between; align-items: center; }
  .who { display: flex; flex-direction: column; align-items: center; }
  .eyebrow { font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  .team { font-family: var(--font-display); font-weight: 600; font-size: 18px; }
  .count {
    height: 52px;
    min-width: 52px;
    padding: 0 14px;
    border-radius: 999px;
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 24px;
    color: var(--ok);
  }
  .timer { display: flex; flex-direction: column; align-items: stretch; text-align: center; gap: 10px; }
  .clock { font-family: var(--font-display); font-weight: 700; font-size: 84px; line-height: 1; color: var(--timeup); font-variant-numeric: tabular-nums; }
  .clock.low { color: var(--ko); animation: beat 1s ease-in-out infinite; }
  @keyframes beat { 50% { transform: scale(1.08); } }
  .card {
    flex-grow: 1;
    min-height: 200px;
    background: #fff;
    color: var(--nuit);
    border-radius: 32px;
    box-shadow: 0 8px 0 var(--timeup-ombre);
    border: 6px solid var(--timeup);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 20px;
    text-align: center;
    touch-action: none;
    cursor: grab;
  }
  .card.go-right { border-color: var(--ok); }
  .card.go-left { border-color: var(--ko); }
  .cat {
    height: 32px;
    padding: 0 14px;
    border-radius: 999px;
    background: #ffe8d6;
    color: #8a3a08;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    display: inline-flex;
    align-items: center;
  }
  .word { font-family: var(--font-display); font-weight: 700; font-size: 44px; line-height: 1.05; overflow-wrap: anywhere; }
  .hint { font-size: 15px; color: var(--ligne); font-weight: 600; }
  .swipe { display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; color: var(--texte-doux); margin-top: -6px; }
  .actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .act {
    height: 104px;
    border-radius: 32px;
    color: var(--nuit);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 24px;
    margin-bottom: 7px;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }
  .act.ko { background: var(--ko); box-shadow: 0 7px 0 var(--ko-ombre); }
  .act.ok { background: var(--ok); box-shadow: 0 7px 0 var(--ok-ombre); }
  .act:active:not(:disabled) { transform: translateY(5px); box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3); }
  .act:disabled { opacity: 0.4; }
</style>
