export const GRID = {
  cols: 20,
  rows: 20,
} as const;

export const INITIAL_LENGTH = 3;

/** Quantos comandos de direção podem ficar enfileirados entre dois passos. */
export const MAX_QUEUED_TURNS = 2;

export type DifficultyId = 'easy' | 'normal' | 'hard';

export interface Difficulty {
  id: DifficultyId;
  label: string;
  description: string;
  /** Intervalo entre passos no início da partida (ms). */
  initialTickMs: number;
  /** Intervalo mínimo — a cobra nunca fica mais rápida que isso (ms). */
  minTickMs: number;
  /** Quanto o intervalo diminui a cada comida (ms). */
  stepPerFood: number;
  /** Se `true`, sair por uma parede faz a cobra entrar pela do lado oposto. */
  wrap: boolean;
}

export const DIFFICULTIES: Record<DifficultyId, Difficulty> = {
  easy: {
    id: 'easy',
    label: 'Fácil',
    description: 'Mais devagar e dá para atravessar as paredes.',
    initialTickMs: 170,
    minTickMs: 100,
    stepPerFood: 2,
    wrap: true,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    description: 'O clássico: parede é fim de jogo.',
    initialTickMs: 140,
    minTickMs: 60,
    stepPerFood: 3,
    wrap: false,
  },
  hard: {
    id: 'hard',
    label: 'Difícil',
    description: 'Rápida desde o início e acelera mais a cada fruta.',
    initialTickMs: 95,
    minTickMs: 45,
    stepPerFood: 4,
    wrap: false,
  },
};

export const DIFFICULTY_ORDER: DifficultyId[] = ['easy', 'normal', 'hard'];

export const DEFAULT_DIFFICULTY: DifficultyId = 'normal';

export function isDifficultyId(value: unknown): value is DifficultyId {
  return typeof value === 'string' && value in DIFFICULTIES;
}
