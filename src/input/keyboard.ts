import type { Direction } from '../game/types';

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

export interface KeyboardHandlers {
  onDirection(direction: Direction): void;
  /** Espaço, P ou Esc. */
  onPause(): void;
  /** Enter. */
  onConfirm(): void;
  /** M. */
  onMute(): void;
  /** 1, 2 ou 3 — recebe o índice (0, 1 ou 2). */
  onDifficulty(index: number): void;
}

const DIGITS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 };

export function bindKeyboard(handlers: KeyboardHandlers): void {
  document.addEventListener('keydown', (event) => {
    if (event.repeat && !(event.code in KEY_TO_DIRECTION)) return;
    // Não rouba o Enter/Espaço de botões focados.
    const onButton = event.target instanceof HTMLButtonElement;

    const direction = KEY_TO_DIRECTION[event.code];
    if (direction) {
      event.preventDefault();
      handlers.onDirection(direction);
      return;
    }

    const digit = DIGITS[event.code];
    if (digit !== undefined) {
      handlers.onDifficulty(digit);
      return;
    }

    switch (event.code) {
      case 'Space':
      case 'KeyP':
      case 'Escape':
        if (onButton && event.code === 'Space') return;
        event.preventDefault();
        handlers.onPause();
        break;
      case 'Enter':
        if (onButton) return;
        event.preventDefault();
        handlers.onConfirm();
        break;
      case 'KeyM':
        handlers.onMute();
        break;
    }
  });
}
