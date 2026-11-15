// Valeurs de version injectées au build (voir vite.config.ts et src/build-info.d.ts).
// Fichier JS pour lire package.json et git sans dépendre des types Node.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function gitHash() {
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'dev';
  }
}

/** @returns {Record<string, string>} */
export function buildDefines() {
  const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
  return {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __GIT_HASH__: JSON.stringify(gitHash()),
  };
}
