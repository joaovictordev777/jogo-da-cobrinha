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
}

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
    }
  });
}
