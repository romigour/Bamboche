import type { IconName } from '../lib/ui/icons';

export type GameColor = 'pop' | 'timeup' | 'blindtest' | 'hipster' | 'undercover' | 'animaux' | 'ok' | 'ko';

export type SettingDef =
  | { key: string; label: string; type: 'choice'; options: number[]; unit?: string; default: number }
  | { key: string; label: string; type: 'int'; min: number; max: number; unit?: string; default: number };

export interface GameModule {
  id: string;
  name: string;
  color: GameColor;
  icon: IconName;
  players: { min: number; max: number };
  status: 'disponible' | 'bientot';
  settings: SettingDef[];
  route: string;
}
