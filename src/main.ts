import '@fontsource-variable/space-grotesk';
import './styles.css';

import { Sound } from './audio/Sound';
import { GRID } from './game/config';
import { Game } from './game/Game';
import type { Direction, GameState, Status } from './game/types';
import { bindKeyboard } from './input/keyboard';
import { bindSwipe } from './input/touch';
import { CanvasRenderer } from './render/Renderer';
import { KEYS, loadFlag, loadNumber, saveFlag, saveNumber } from './storage/storage';
import { $ } from './ui/dom';
import { Hud } from './ui/Hud';
import { buildSteps, Tutorial } from './ui/Tutorial';

const isTouch = window.matchMedia('(pointer: coarse)').matches;

let best = loadNumber(KEYS.highScore);
let recordAtStart = best;
let lastStatus: Status = 'ready';

const sound = new Sound(loadFlag(KEYS.muted));

const hud = new Hud({
  onPrimary: () => game.start(),
  onPause: () => game.togglePause(),
  onMute: toggleMute,
  onHelp: openTutorial,
});

const tutorial = new Tutorial(buildSteps(isTouch), {
  onFinish: () => {
    saveFlag(KEYS.tutorialSeen, true);
    game.start();
  },
  onSkip: () => {
    saveFlag(KEYS.tutorialSeen, true);
    hud.focusPrimary();
  },
});

const game = new Game(new CanvasRenderer($<HTMLCanvasElement>('canvas'), GRID.cols, GRID.rows), {
  onChange: handleChange,
  onEat: (state) => {
    hud.bump();
    sound.eat(state.score);
  },
});

function handleChange(state: GameState): void {
  const previous = lastStatus;
  lastStatus = state.status;

  if (state.status === 'running' && state.score === 0) recordAtStart = best;
  if (state.score > best) {
    best = state.score;
    saveNumber(KEYS.highScore, best);
  }

  playStatusSound(previous, state.status);
  hud.update(state, best, state.score > recordAtStart);
  if (!tutorial.isOpen) hud.focusPrimary();
}

function playStatusSound(from: Status, to: Status): void {
  if (from === to) return;
  if (to === 'over') {
    sound.die();
    if (!sound.isMuted) navigator.vibrate?.(200);
  } else if (to === 'won') sound.win();
  else if (to === 'paused') sound.pause();
  else if (to === 'running') {
    if (from === 'paused') sound.resume();
    else sound.start(); // começo ou recomeço de partida
  }
}

function toggleMute(): void {
  const muted = !sound.isMuted;
  sound.setMuted(muted);
  saveFlag(KEYS.muted, muted);
  hud.setMuted(muted);
  if (!muted) sound.tick();
}

function openTutorial(): void {
  if (game.current.status === 'running') game.togglePause();
  tutorial.open();
}

function turn(direction: Direction): void {
  if (tutorial.isOpen) return;
  game.turn(direction);
}

bindKeyboard({
  onDirection: (direction) => {
    if (!tutorial.isOpen) return turn(direction);
    if (direction === 'right') tutorial.next();
    if (direction === 'left') tutorial.previous();
  },
  onPause: () => {
    if (tutorial.isOpen) return;
    const { status } = game.current;
    if (status === 'running' || status === 'paused') game.togglePause();
    else game.start();
  },
  onConfirm: () => {
    if (tutorial.isOpen) return;
    if (game.current.status === 'paused') game.togglePause();
    else game.start();
  },
  onMute: toggleMute,
});

bindSwipe($('board'), turn);

document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((button) => {
  // pointerdown responde mais rápido que click no celular.
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    sound.unlock();
    turn(button.dataset.direction as Direction);
  });
});

// O áudio só pode ser liberado dentro de um gesto do usuário (exigência dos navegadores).
for (const type of ['pointerdown', 'keydown', 'touchend'] as const) {
  document.addEventListener(type, () => sound.unlock(), { capture: true, passive: true });
}

// Pausa automaticamente ao trocar de aba.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.current.status === 'running') game.togglePause();
});

hud.setMuted(sound.isMuted);
handleChange(game.current);
if (!loadFlag(KEYS.tutorialSeen)) tutorial.open();
