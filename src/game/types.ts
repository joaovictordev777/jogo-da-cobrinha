export interface Point {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type Status = 'ready' | 'running' | 'paused' | 'over' | 'won';

export interface GameState {
  cols: number;
  rows: number;
  /** Segmentos da cobra; o índice 0 é a cabeça. */
  snake: Point[];
  direction: Direction;
  /** `null` apenas quando o tabuleiro está totalmente ocupado (vitória). */
  food: Point | null;
  score: number;
  status: Status;
}

/** Gerador de números em [0, 1). Injetável para facilitar testes. */
export type Rng = () => number;
