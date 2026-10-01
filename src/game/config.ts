export const GRID = {
  cols: 20,
  rows: 20,
} as const;

export const INITIAL_LENGTH = 3;

export const SPEED = {
  /** Intervalo entre passos no início da partida (ms). */
  initialTickMs: 140,
  /** Intervalo mínimo — a cobra nunca fica mais rápida que isso (ms). */
  minTickMs: 60,
  /** Quanto o intervalo diminui a cada comida (ms). */
  stepPerFood: 3,
} as const;

/** Quantos comandos de direção podem ficar enfileirados entre dois passos. */
export const MAX_QUEUED_TURNS = 2;
