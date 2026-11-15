/** Garde l'écran allumé pendant un tour ; sans effet (ni erreur) si l'API manque. */
type Sentinel = { release: () => Promise<void> };

let sentinel: Sentinel | null = null;
let wanted = false;

async function acquire(): Promise<void> {
  try {
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock;
    if (!wl) return;
    sentinel = await wl.request('screen');
  } catch {
    sentinel = null;
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (wanted && document.visibilityState === 'visible') void acquire();
  });
}

export async function keepAwake(): Promise<void> {
  wanted = true;
  if (!sentinel) await acquire();
}

export async function releaseAwake(): Promise<void> {
  wanted = false;
  const s = sentinel;
  sentinel = null;
  try {
    await s?.release();
  } catch {
    // ignoré
  }
}
