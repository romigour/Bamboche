import { PreviewSource, type MusicSource } from './source';

let instance: MusicSource | null = null;

/** Lecteur unique de l'app : le même élément audio reste débloqué par iOS d'un extrait à l'autre. */
export function music(): MusicSource {
  if (!instance) instance = new PreviewSource();
  return instance;
}
