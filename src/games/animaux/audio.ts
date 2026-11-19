/** Lecture des cris. Un seul élément <audio> pour toute l'app : iOS le garde débloqué après le premier tap. */
export interface AnimalPlayer {
  /** Rejette si le navigateur refuse la lecture. À appeler directement dans un tap (iOS). */
  play(url: string): Promise<void>;
  stop(): void;
  /** Son introuvable (erreur de chargement ou pas de démarrage dans le délai). Renvoie de quoi se désabonner. */
  onError(cb: () => void): () => void;
}

export const LOAD_TIMEOUT_MS = 8000;

export function createAnimalPlayer(createAudio: () => HTMLAudioElement = () => new Audio()): AnimalPlayer {
  const el = createAudio();
  el.preload = 'auto';
  const errors = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clear = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  const fail = () => {
    clear();
    for (const cb of errors) cb();
  };
  el.addEventListener('playing', clear);
  el.addEventListener('error', () => {
    if (el.src) fail();
  });
  return {
    play(url) {
      clear();
      if (!el.src.endsWith(url)) el.src = url;
      // déjà en lecture avec des données : le navigateur ne renverra pas « playing », pas de délai à surveiller
      const alreadyPlaying = !el.paused && el.readyState >= 3;
      el.currentTime = 0;
      if (!alreadyPlaying) timer = setTimeout(fail, LOAD_TIMEOUT_MS);
      return el.play().catch((e) => {
        clear();
        throw e;
      });
    },
    stop() {
      clear();
      el.pause();
    },
    onError(cb) {
      errors.add(cb);
      return () => errors.delete(cb);
    },
  };
}

let instance: AnimalPlayer | null = null;

export function animalPlayer(): AnimalPlayer {
  if (!instance) instance = createAnimalPlayer();
  return instance;
}
