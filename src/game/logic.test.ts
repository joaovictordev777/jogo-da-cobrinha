import { describe, expect, it } from 'vitest';
import { createInitialState, spawnFood, step, tickDuration } from './logic';
import { DIFFICULTIES } from './config';
import type { GameState } from './types';

const fixedRng = (value: number) => () => value;

function running(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(10, 10, { rng: fixedRng(0) }), status: 'running', ...overrides };
}

describe('createInitialState', () => {
  it('coloca a cobra no centro, virada para a direita', () => {
    const state = createInitialState(10, 10, { rng: fixedRng(0) });
    expect(state.snake).toEqual([
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ]);
    expect(state.direction).toBe('right');
    expect(state.status).toBe('ready');
  });
});

describe('spawnFood', () => {
  it('nunca nasce em cima da cobra', () => {
    const snake = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];
    for (const r of [0, 0.25, 0.5, 0.99]) {
      const food = spawnFood(snake, 2, 2, fixedRng(r))!;
      expect(snake).not.toContainEqual(food);
    }
  });

  it('retorna null quando o tabuleiro está cheio', () => {
    expect(spawnFood([{ x: 0, y: 0 }], 1, 1)).toBeNull();
  });
});

describe('step', () => {
  it('anda uma célula na direção pedida', () => {
    const { state } = step(running(), 'down');
    expect(state.snake[0]).toEqual({ x: 5, y: 6 });
    expect(state.snake).toHaveLength(3);
  });

  it('ignora meia-volta', () => {
    const { state } = step(running(), 'left');
    expect(state.direction).toBe('right');
    expect(state.snake[0]).toEqual({ x: 6, y: 5 });
  });

  it('cresce e pontua ao comer', () => {
    const { state, ate } = step(running({ food: { x: 6, y: 5 } }), 'right');
    expect(ate).toBe(true);
    expect(state.score).toBe(1);
    expect(state.snake).toHaveLength(4);
    expect(state.food).not.toBeNull();
  });

  it('termina ao bater na parede', () => {
    const { state } = step(running({ snake: [{ x: 9, y: 0 }] }), 'right');
    expect(state.status).toBe('over');
  });

  it('com paredes atravessáveis, sai de um lado e entra do outro', () => {
    const right = step(running({ wrap: true, snake: [{ x: 9, y: 4 }], food: null }), 'right').state;
    expect(right.status).toBe('running');
    expect(right.snake[0]).toEqual({ x: 0, y: 4 });

    const up = step(running({ wrap: true, snake: [{ x: 3, y: 0 }], direction: 'up', food: null }), 'up').state;
    expect(up.snake[0]).toEqual({ x: 3, y: 9 });
  });

  it('com paredes atravessáveis, ainda morre ao bater em si mesma', () => {
    const snake = [
      { x: 9, y: 0 },
      { x: 9, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];
    const { state } = step(running({ wrap: true, snake, direction: 'up', food: null }), 'right');
    expect(state.status).toBe('over');
  });

  it('termina ao bater em si mesma', () => {
    const snake = [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 3, y: 2 },
      { x: 3, y: 1 },
    ];
    const { state } = step(running({ snake, direction: 'up', food: null }), 'right');
    expect(state.status).toBe('over');
  });

  it('pode entrar na célula que a cauda está deixando', () => {
    const snake = [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 3, y: 2 },
    ];
    const { state } = step(running({ snake, direction: 'up', food: { x: 0, y: 0 } }), 'right');
    expect(state.status).toBe('running');
    expect(state.snake[0]).toEqual({ x: 3, y: 2 });
  });

  it('vence quando não sobra espaço para comida', () => {
    const snake = [{ x: 0, y: 0 }];
    const { state } = step(running({ cols: 2, rows: 1, snake, food: { x: 1, y: 0 } }), 'right');
    expect(state.status).toBe('won');
  });

  it('não faz nada se o jogo não estiver rodando', () => {
    const paused = running({ status: 'paused' });
    expect(step(paused, 'down').state).toBe(paused);
  });
});

describe('tickDuration', () => {
  it('acelera com a pontuação até o limite', () => {
    const normal = DIFFICULTIES.normal;
    expect(tickDuration(0, normal)).toBe(normal.initialTickMs);
    expect(tickDuration(5, normal)).toBeLessThan(tickDuration(0, normal));
    expect(tickDuration(10_000, normal)).toBe(normal.minTickMs);
  });

  it('é mais lento no fácil e mais rápido no difícil', () => {
    for (const score of [0, 10, 30]) {
      expect(tickDuration(score, DIFFICULTIES.easy)).toBeGreaterThan(tickDuration(score, DIFFICULTIES.normal));
      expect(tickDuration(score, DIFFICULTIES.hard)).toBeLessThan(tickDuration(score, DIFFICULTIES.normal));
    }
  });
});
