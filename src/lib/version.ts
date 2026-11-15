/** Libellé affiché dans les réglages : « Version 0.1.0 · 15/11/2026 · a1b2c3d ». */
export function versionLabel(): string {
  const d = new Date(__BUILD_DATE__);
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
  return `Version ${__APP_VERSION__} · ${date} · ${__GIT_HASH__}`;
}
