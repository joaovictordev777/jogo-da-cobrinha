import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Game, type FrameRenderer } from './Game';
import { DIFFICULTIES } from './config';
import type { GameState } from './types';

const SPEED = DIFFICULTIES.normal;

let frameCallback: FrameRequestCallback | null = null;
let now = 0;

/** Avança o relógio falso disparando um quadro a cada ~16ms. */
function advance(ms: number): void {
  const end = now + ms;
  while (now < end) {
    now = Math.min(now + 16, end);
    const cb = frameCallback;
    frameCallback = null;
    cb?.(now);
  }
}

function setup(difficulty: keyof typeof DIFFICULTIES = 'normal') {
  const renderer: FrameRenderer = { render: vi.fn() };
  const changes: GameState[] = [];
  const game = new Game(renderer, { onChange: (s) => changes.push(s) }, difficulty);
  advance(16); // primeiro quadro só inicializa o relógio
  return { game, renderer, changes };
}

beforeEach(() => {
  now = 0;
  frameCallback = null;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frameCallback = cb;
    return 1;
  });
});

describe('Game', () => {
  it('começa parado e só anda depois de start()', () => {
    const { game } = setup();
    const head = game.current.snake[0];
    advance(1000);
    expect(game.current.snake[0]).toEqual(head);

    game.start();
    advance(SPEED.initialTickMs + 1);
    expect(game.current.snake[0]).toEqual({ x: head!.x + 1, y: head!.y });
  });

  it('uma seta na tela inicial já começa o jogo', () => {
    const { game } = setup();
    game.turn('up');
    expect(game.current.status).toBe('running');
    advance(SPEED.initialTickMs + 1);
    expect(game.current.direction).toBe('up');
  });

  it('dois comandos rápidos não fazem a cobra virar para dentro de si mesma', () => {
    const { game } = setup();
    game.start();
    // Indo para a direita: ↑ e ← no mesmo intervalo devem virar para cima e depois esquerda.
    game.turn('up');
    game.turn('left');
    advance(SPEED.initialTickMs * 2 + 1);
    expect(game.current.status).toBe('running');
    expect(game.current.direction).toBe('left');
  });

  it('pausa congela a cobra', () => {
    const { game } = setup();
    game.start();
    game.togglePause();
    const snake = game.current.snake;
    advance(2000);
    expect(game.current.snake).toBe(snake);
    expect(game.current.status).toBe('paused');
  });

  it('termina ao bater na parede e reinicia com start()', () => {
    const { game, changes } = setup();
    game.start();
    advance(5000);
    expect(game.current.status).toBe('over');
    expect(changes.at(-1)?.status).toBe('over');

    game.start();
    expect(game.current.status).toBe('running');
    expect(game.current.score).toBe(0);
  });

  it('no fácil a cobra atravessa a parede em vez de morrer', () => {
    const { game } = setup('easy');
    expect(game.current.wrap).toBe(true);
    game.start();
    advance(DIFFICULTIES.easy.initialTickMs * 15);
    expect(game.current.status).toBe('running');
  });

  it('troca de dificuldade só fora da partida', () => {
    const { game } = setup();
    expect(game.setDifficulty('easy')).toBe(true);
    expect(game.difficulty.id).toBe('easy');
    expect(game.current.wrap).toBe(true);

    game.start();
    expect(game.setDifficulty('hard')).toBe(false);
    game.togglePause();
    expect(game.setDifficulty('hard')).toBe(false);
    expect(game.difficulty.id).toBe('easy');
  });

  it('a troca feita no fim de jogo vale para a próxima partida', () => {
    const { game } = setup();
    game.start();
    advance(5000);
    expect(game.current.status).toBe('over');

    expect(game.setDifficulty('easy')).toBe(true);
    expect(game.current.status).toBe('over');
    game.start();
    expect(game.current.wrap).toBe(true);
  });
});
