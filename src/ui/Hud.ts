import type { GameState } from '../game/types';

function $<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemento #${id} não encontrado.`);
  return element as T;
}

interface OverlayContent {
  title: string;
  text: string;
  button: string;
}

const OVERLAY: Partial<Record<GameState['status'], OverlayContent>> = {
  ready: {
    title: 'Pronto?',
    text: 'Coma as frutinhas, cresça e não bata nas paredes nem em você mesmo.',
    button: 'Jogar',
  },
  paused: {
    title: 'Pausado',
    text: 'Respire fundo. A cobrinha espera.',
    button: 'Continuar',
  },
  over: {
    title: 'Fim de jogo',
    text: '',
    button: 'Jogar de novo',
  },
  won: {
    title: 'Você zerou!',
    text: 'A cobrinha ocupou o tabuleiro inteiro. Impressionante.',
    button: 'Jogar de novo',
  },
};

/** Placar, recorde, botão de pausa e a camada de mensagens sobre o tabuleiro. */
export class Hud {
  private readonly score = $('score');
  private readonly best = $('best');
  private readonly pauseButton = $<HTMLButtonElement>('pauseButton');
  private readonly overlay = $('overlay');
  private readonly overlayBadge = $('overlayBadge');
  private readonly overlayTitle = $('overlayTitle');
  private readonly overlayText = $('overlayText');
  private readonly overlayButton = $<HTMLButtonElement>('overlayButton');

  constructor(actions: { onPrimary(): void; onPause(): void }) {
    this.overlayButton.addEventListener('click', actions.onPrimary);
    this.pauseButton.addEventListener('click', actions.onPause);
  }

  update(state: GameState, best: number, isNewRecord: boolean): void {
    this.setNumber(this.score, state.score);
    this.setNumber(this.best, best);

    const running = state.status === 'running';
    this.pauseButton.disabled = !running && state.status !== 'paused';
    this.pauseButton.classList.toggle('is-paused', state.status === 'paused');
    this.pauseButton.setAttribute('aria-label', state.status === 'paused' ? 'Continuar' : 'Pausar');

    const content = OVERLAY[state.status];
    this.overlay.classList.toggle('is-visible', Boolean(content));
    if (!content) {
      this.overlayButton.blur();
      return;
    }

    const finished = state.status === 'over' || state.status === 'won';
    this.overlayTitle.textContent = content.title;
    this.overlayText.textContent =
      state.status === 'over' ? `Você fez ${state.score} ${state.score === 1 ? 'ponto' : 'pontos'}.` : content.text;
    this.overlayButton.textContent = content.button;
    this.overlayBadge.hidden = !(finished && isNewRecord);
    this.overlay.dataset.status = state.status;
    this.overlayButton.focus({ preventScroll: true });
  }

  /** Pequena animação no placar quando a cobra come. */
  bump(): void {
    this.score.classList.remove('is-bumping');
    void this.score.offsetWidth; // reinicia a animação
    this.score.classList.add('is-bumping');
  }

  private setNumber(element: HTMLElement, value: number): void {
    const text = String(value);
    if (element.textContent !== text) element.textContent = text;
  }
}
