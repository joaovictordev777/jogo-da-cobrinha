import { INITIAL_LENGTH, SPEED } from './config';
import type { Direction, GameState, Point, Rng } from './types';

/*
 * Regras do jogo como funções puras: recebem um estado e devolvem um novo,
 * sem tocar em DOM, canvas ou relógio. Isso deixa tudo fácil de testar.
 */

export const VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function isOpposite(a: Direction, b: Direction): boolean {
  return OPPOSITE[a] === b;
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Sorteia uma célula livre. Retorna `null` se não houver nenhuma. */
export function spawnFood(snake: Point[], cols: number, rows: number, rng: Rng = Math.random): Point | null {
  const occupied = new Set(snake.map((p) => p.y * cols + p.x));
  const free: number[] = [];
  for (let i = 0; i < cols * rows; i++) {
    if (!occupied.has(i)) free.push(i);
  }
  const index = free[Math.floor(rng() * free.length)];
  if (index === undefined) return null;
  return { x: index % cols, y: Math.floor(index / cols) };
}

export function createInitialState(cols: number, rows: number, rng: Rng = Math.random): GameState {
  const head = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
  const snake = Array.from({ length: INITIAL_LENGTH }, (_, i) => ({ x: head.x - i, y: head.y }));
  return {
    cols,
    rows,
    snake,
    direction: 'right',
    food: spawnFood(snake, cols, rows, rng),
    score: 0,
    status: 'ready',
  };
}

export interface StepResult {
  state: GameState;
  ate: boolean;
}

/** Avança a cobra uma célula na direção pedida (ignorando meia-volta). */
export function step(state: GameState, requested: Direction, rng: Rng = Math.random): StepResult {
  if (state.status !== 'running') return { state, ate: false };

  const direction = isOpposite(state.direction, requested) ? state.direction : requested;
  const { cols, rows } = state;
  const head = state.snake[0]!;
  const v = VECTORS[direction];
  const next = { x: head.x + v.x, y: head.y + v.y };

  const ate = state.food !== null && samePoint(next, state.food);
  // Se não comeu, a cauda sai do lugar neste mesmo passo — então pode ser ocupada.
  const body = ate ? state.snake : state.snake.slice(0, -1);

  const hitWall = next.x < 0 || next.x >= cols || next.y < 0 || next.y >= rows;
  const hitSelf = body.some((p) => samePoint(p, next));
  if (hitWall || hitSelf) {
    return { state: { ...state, direction, status: 'over' }, ate: false };
  }

  const snake = [next, ...body];
  if (!ate) {
    return { state: { ...state, snake, direction }, ate: false };
  }

  const food = spawnFood(snake, cols, rows, rng);
  return {
    state: {
      ...state,
      snake,
      direction,
      food,
      score: state.score + 1,
      status: food ? 'running' : 'won',
    },
    ate: true,
  };
}

/** Intervalo entre passos para uma dada pontuação — o jogo acelera aos poucos. */
export function tickDuration(score: number): number {
  return Math.max(SPEED.minTickMs, SPEED.initialTickMs - score * SPEED.stepPerFood);
}
