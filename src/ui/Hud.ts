import type { Difficulty, DifficultyId } from '../game/config';
import type { GameState } from '../game/types';
import { $ } from './dom';

interface OverlayContent {
  title: string;
  text: string;
  button: string;
}

const OVERLAY: Partial<Record<GameState['status'], OverlayContent>> = {
  ready: {
    title: 'Pronto?',
    text: '',
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

export interface HudActions {
  onPrimary(): void;
  onPause(): void;
  onMute(): void;
  onHelp(): void;
  onDifficulty(id: DifficultyId): void;
}

/** Placar, botões do topo e a camada de mensagens sobre o tabuleiro. */
export class Hud {
  private readonly score = $('score');
  private readonly best = $('best');
  private readonly pauseButton = $<HTMLButtonElement>('pauseButton');
  private readonly muteButton = $<HTMLButtonElement>('muteButton');
  private readonly overlay = $('overlay');
  private readonly overlayBadge = $('overlayBadge');
  private readonly overlayTitle = $('overlayTitle');
  private readonly overlayText = $('overlayText');
  private readonly overlayButton = $<HTMLButtonElement>('overlayButton');
  private readonly overlayHelp = $<HTMLButtonElement>('overlayHelp');
  private readonly difficulty = $('difficulty');
  private readonly difficultyHint = $('difficultyHint');
  private readonly bestLevel = $('bestLevel');
  private readonly board = $('board');
  private readonly difficultyButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-difficulty]'));

  constructor(actions: HudActions) {
    this.overlayButton.addEventListener('click', actions.onPrimary);
    this.pauseButton.addEventListener('click', actions.onPause);
    this.muteButton.addEventListener('click', actions.onMute);
    this.overlayHelp.addEventListener('click', actions.onHelp);
    $('helpButton').addEventListener('click', actions.onHelp);
    for (const button of this.difficultyButtons) {
      button.addEventListener('click', () => actions.onDifficulty(button.dataset.difficulty as DifficultyId));
    }
  }

  setDifficulty(difficulty: Difficulty): void {
    for (const button of this.difficultyButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.difficulty === difficulty.id));
    }
    this.difficultyHint.textContent = difficulty.description;
    this.bestLevel.textContent = difficulty.label;
    // Borda tracejada indica paredes atravessáveis.
    this.board.dataset.wrap = String(difficulty.wrap);
  }

  update(state: GameState, best: number, isNewRecord: boolean): void {
    this.setNumber(this.score, state.score);
    this.setNumber(this.best, best);

    const paused = state.status === 'paused';
    this.pauseButton.disabled = state.status !== 'running' && !paused;
    this.pauseButton.classList.toggle('is-paused', paused);
    this.pauseButton.setAttribute('aria-label', paused ? 'Continuar' : 'Pausar');

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
    this.overlayText.hidden = !this.overlayText.textContent;
    this.overlayButton.textContent = content.button;
    // A dificuldade só pode ser trocada fora de uma partida.
    this.difficulty.hidden = state.status === 'paused';
    this.overlayBadge.hidden = !(finished && isNewRecord);
    this.overlayHelp.hidden = state.status !== 'ready';
    this.overlay.dataset.status = state.status;
  }

  /** Dá foco ao botão principal da camada de mensagens (para Enter/Espaço funcionarem). */
  focusPrimary(): void {
    if (this.overlay.classList.contains('is-visible')) this.overlayButton.focus({ preventScroll: true });
  }

  setMuted(muted: boolean): void {
    this.muteButton.classList.toggle('is-muted', muted);
    this.muteButton.setAttribute('aria-pressed', String(muted));
    this.muteButton.setAttribute('aria-label', muted ? 'Ativar som' : 'Desativar som');
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
