import type { Direction } from '../game/types';

/** Distância mínima (px) para considerar o gesto um deslize. */
const SWIPE_THRESHOLD = 24;

/**
 * Detecta deslizes no elemento. A direção é disparada assim que o dedo passa
 * do limite — sem esperar soltar — e o gesto pode continuar para outra curva.
 */
export function bindSwipe(element: HTMLElement, onDirection: (direction: Direction) => void): void {
  let origin: { x: number; y: number } | null = null;

  element.addEventListener(
    'touchstart',
    (event) => {
      const touch = event.touches[0];
      if (touch) origin = { x: touch.clientX, y: touch.clientY };
    },
    { passive: true },
  );

  element.addEventListener(
    'touchmove',
    (event) => {
      // Impede a página de rolar enquanto se joga.
      event.preventDefault();
      const touch = event.touches[0];
      if (!origin || !touch) return;

      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;

      if (Math.abs(dx) > Math.abs(dy)) onDirection(dx > 0 ? 'right' : 'left');
      else onDirection(dy > 0 ? 'down' : 'up');
      origin = { x: touch.clientX, y: touch.clientY };
    },
    { passive: false },
  );

  element.addEventListener('touchend', () => {
    origin = null;
  });
}
