/**
 * Lecture de la musique du Blindtest. Les écrans ne connaissent que MusicSource :
 * plus tard, une SpotifyConnectSource pourra remplacer PreviewSource sans les toucher.
 */
export interface MusicSource {
  /** Rejette si le navigateur refuse la lecture. À appeler directement dans un tap (iOS). */
  play(url: string, fromMs?: number): Promise<void>;
  /** Précharge l'extrait suivant dans le cache (la lecture garde l'élément débloqué par iOS). */
  preload(url: string): void;
  pause(): void;
  /** Pause et retour au début. */
  stop(): void;
  positionMs(): number;
  playing(): boolean;
  onEnded(cb: () => void): () => void;
  onError(cb: () => void): () => void;
}

/** Sans démarrage effectif dans ce délai, l'extrait est considéré comme indisponible. */
export const LOAD_TIMEOUT_MS = 8000;

/** Extraits de 30 s lus par un élément <audio>. */
export class PreviewSource implements MusicSource {
  private main: HTMLAudioElement;
  private spare: HTMLAudioElement | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private seq = 0;
  private ended = new Set<() => void>();
  private errors = new Set<() => void>();

  constructor(private createAudio: () => HTMLAudioElement = () => new Audio()) {
    this.main = this.wire(createAudio());
  }

  private wire(el: HTMLAudioElement): HTMLAudioElement {
    el.preload = 'auto';
    el.addEventListener('ended', () => {
      if (el === this.main) for (const cb of this.ended) cb();
    });
    el.addEventListener('error', () => {
      if (el === this.main && el.src) this.fail();
    });
    el.addEventListener('playing', () => {
      if (el === this.main) this.clearTimer();
    });
    return el;
  }

  private clearTimer() {
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  private fail() {
    this.clearTimer();
    for (const cb of this.errors) cb();
  }

  play(url: string, fromMs = 0): Promise<void> {
    const el = this.main;
    if (el.src !== url || el.error) {
      // après une erreur (réseau coupé), même URL : il faut recharger, sinon play() échoue en boucle
      el.src = url;
      el.load?.();
    }
    el.currentTime = fromMs / 1000;
    this.clearTimer();
    this.timer = setTimeout(() => this.fail(), LOAD_TIMEOUT_MS);
    // appel synchrone : iOS n'autorise play() que pendant le geste de l'utilisateur
    let started: Promise<void>;
    try {
      started = Promise.resolve(el.play());
    } catch (e) {
      started = Promise.reject(e);
    }
    const seq = ++this.seq;
    return started.catch((e) => {
      // un refus tardif d'un extrait précédent ne doit pas annuler le délai de l'extrait courant
      if (seq === this.seq) this.clearTimer();
      throw e;
    });
  }

  preload(url: string): void {
    if (!this.spare) this.spare = this.wire(this.createAudio());
    if (this.spare.src !== url) {
      this.spare.src = url;
      this.spare.load?.();
    }
  }

  pause(): void {
    this.clearTimer();
    this.main.pause();
  }

  stop(): void {
    this.pause();
    this.main.currentTime = 0;
  }

  positionMs(): number {
    return (this.main.currentTime || 0) * 1000;
  }

  playing(): boolean {
    return !this.main.paused;
  }

  onEnded(cb: () => void): () => void {
    this.ended.add(cb);
    return () => this.ended.delete(cb);
  }

  onError(cb: () => void): () => void {
    this.errors.add(cb);
    return () => this.errors.delete(cb);
  }
}
