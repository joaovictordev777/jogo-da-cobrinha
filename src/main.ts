import '@fontsource-variable/space-grotesk';
import './styles.css';

import { GRID } from './game/config';
import { Game } from './game/Game';
import type { Direction, GameState } from './game/types';
import { bindKeyboard } from './input/keyboard';
import { bindSwipe } from './input/touch';
import { CanvasRenderer } from './render/Renderer';
import { loadHighScore, saveHighScore } from './storage/highScore';
import { Hud } from './ui/Hud';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const board = document.getElementById('board') as HTMLElement;

let best = loadHighScore();
let recordAtStart = best;

const hud = new Hud({
  onPrimary: () => game.start(),
  onPause: () => game.togglePause(),
});

const game = new Game(new CanvasRenderer(canvas, GRID.cols, GRID.rows), {
  onChange: handleChange,
  onEat: () => hud.bump(),
});

function handleChange(state: GameState): void {
  if (state.status === 'running' && state.score === 0) recordAtStart = best;
  if (state.score > best) {
    best = state.score;
    saveHighScore(best);
  }
  hud.update(state, best, state.score > recordAtStart);
}

const turn = (direction: Direction) => game.turn(direction);

bindKeyboard({
  onDirection: turn,
  onPause: () => (game.current.status === 'running' || game.current.status === 'paused' ? game.togglePause() : game.start()),
  onConfirm: () => (game.current.status === 'paused' ? game.togglePause() : game.start()),
});

bindSwipe(board, turn);

document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((button) => {
  // pointerdown responde mais rápido que click no celular.
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    turn(button.dataset.direction as Direction);
  });
});

// Pausa automaticamente ao trocar de aba.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.current.status === 'running') game.togglePause();
});

handleChange(game.current);
