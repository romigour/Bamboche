export type AnimalLevel = 'facile' | 'difficile';
export type GameLevel = 'facile' | 'melange' | 'expert';

/** Crédit d'un fichier Wikimedia Commons ; `url` = page Commons du fichier. */
export interface Credit {
  author: string;
  license: string;
  url: string;
}

export interface Animal {
  id: string;
  name: string;
  level: AnimalLevel;
  family: string;
  /** Chemins relatifs à la racine du site, aux noms neutres (ex. 'animaux/3f9a1c2b7d.mp3'). */
  sound: string;
  photo: string;
  credits: { sound: Credit; photo: Credit };
}
