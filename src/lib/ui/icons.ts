export type IconName =
  | 'play' | 'back' | 'settings' | 'users' | 'timer' | 'music' | 'disc' | 'eyeoff'
  | 'check' | 'cross' | 'pause' | 'plus' | 'minus' | 'shuffle' | 'chevron' | 'trash' | 'edit'
  | 'undo' | 'trophy' | 'volume' | 'volumeoff' | 'skip' | 'home';

/** Tracés 24×24 au trait arrondi. `fill: true` pour les formes pleines. */
export const ICONS: Record<IconName, { d: string; circles?: [number, number, number][]; fill?: boolean }> = {
  play: { d: 'M7 4.5v15l12.5-7.5z', fill: true },
  back: { d: 'M15 5l-7 7 7 7' },
  chevron: { d: 'M9 5l7 7-7 7' },
  settings: { d: 'M4 6h9M19 6h1M4 12h3M13 12h7M4 18h11M21 18h-1', circles: [[16, 6, 2.5], [10, 12, 2.5], [18, 18, 2.5]] },
  users: { d: 'M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.2.6 3.5 2.7 3.5 5.7', circles: [[9, 8, 3.5]] },
  timer: { d: 'M12 10v3.5l2.5 2M9.5 2.5h5', circles: [[12, 13.5, 7.5]] },
  music: { d: 'M9 18V5l11-2v13', circles: [[6, 18, 3], [17, 16, 3]] },
  disc: { d: '', circles: [[12, 12, 8.5], [12, 12, 2.5]] },
  eyeoff: { d: 'M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-2.6 3.2M6.6 6.6C4.3 8.1 3 12 3 12s4 6 9 6c1.6 0 3-.4 4.3-1.1' },
  check: { d: 'M5 12.5l4.5 4.5L19 7' },
  cross: { d: 'M6 6l12 12M18 6L6 18' },
  pause: { d: 'M8 5v14M16 5v14' },
  plus: { d: 'M12 5v14M5 12h14' },
  minus: { d: 'M5 12h14' },
  shuffle: { d: 'M3 7h3c4 0 6 10 10 10h5M3 17h3c1.6 0 2.8-1.6 4-3.6M14 9.6c1.2-1.6 2.4-2.6 4-2.6h3M18 4l3 3-3 3M18 14l3 3-3 3' },
  trash: { d: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13' },
  edit: { d: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4' },
  undo: { d: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3' },
  trophy: { d: 'M7 4h10v5a5 5 0 0 1-10 0zM7 6H4.5a2.5 2.5 0 0 0 2.5 4M17 6h2.5a2.5 2.5 0 0 1-2.5 4M12 14v3M8.5 20h7' },
  volume: { d: 'M4 9.5v5h3.5L12 19V5L7.5 9.5zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11' },
  volumeoff: { d: 'M4 9.5v5h3.5L12 19V5L7.5 9.5zM16 9.5l5 5M21 9.5l-5 5' },
  skip: { d: 'M5 5l8 7-8 7zM17 5v14' },
  home: { d: 'M4 11l8-7 8 7M6 9.5V20h12V9.5' },
};
