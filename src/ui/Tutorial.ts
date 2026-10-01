import { $ } from './dom';

export interface TutorialStep {
  title: string;
  text: string;
  /** Ilustração em HTML/SVG (conteúdo fixo, definido aqui mesmo). */
  art: string;
}

const BOARD = '<rect class="art-board" x="6" y="6" width="108" height="68" rx="12" />';

const ART = {
  swipe: `<svg viewBox="0 0 120 80" aria-hidden="true">${BOARD}
    <path class="art-trail" d="M38 40h44M74 32l8 8-8 8" />
    <circle class="art-finger" cx="38" cy="40" r="10" /></svg>`,
  keys: `<div class="art-keys" aria-hidden="true">
    <kbd class="k-up">↑</kbd><kbd class="k-left">←</kbd><kbd class="k-down">↓</kbd><kbd class="k-right">→</kbd></div>`,
  eat: `<svg viewBox="0 0 120 80" aria-hidden="true">${BOARD}
    <path class="art-snake" d="M22 52h16a8 8 0 0 0 8-8v-4h22" />
    <circle class="art-head" cx="70" cy="40" r="8" /><circle class="art-eye" cx="72" cy="37" r="1.8" />
    <g class="art-fruit"><circle cx="94" cy="41" r="7" /><ellipse class="art-leaf" cx="97" cy="32" rx="3.6" ry="1.8" transform="rotate(-35 97 32)" /></g></svg>`,
  avoid: `<svg viewBox="0 0 120 80" aria-hidden="true">${BOARD}
    <path class="art-wall" d="M114 18v44" />
    <path class="art-snake" d="M40 56v-8a8 8 0 0 1 8-8h50" />
    <circle class="art-head" cx="100" cy="40" r="8" />
    <path class="art-x" d="M98 35l4 4m0-4l-4 4" /></svg>`,
};

export function buildSteps(isTouch: boolean): TutorialStep[] {
  return [
    {
      title: 'Mova a cobrinha',
      text: isTouch
        ? 'Deslize o dedo no tabuleiro para virar. Se preferir, use as setas embaixo dele.'
        : 'Use as setas do teclado ou W A S D para virar.',
      art: isTouch ? ART.swipe : ART.keys,
    },
    {
      title: 'Coma as frutinhas',
      text: 'Cada uma vale 1 ponto, faz a cobra crescer e deixa tudo um pouco mais rápido.',
      art: ART.eat,
    },
    {
      title: 'Não bata!',
      text: isTouch
        ? 'Encostar na parede ou no próprio corpo encerra a partida. Toque em ❚❚ para pausar.'
        : 'Encostar na parede ou no próprio corpo encerra a partida. Aperte Espaço para pausar.',
      art: ART.avoid,
    },
  ];
}

/** Mini tutorial em passos, mostrado num diálogo modal antes da primeira partida. */
export class Tutorial {
  private readonly dialog = $<HTMLDialogElement>('tutorial');
  private readonly art = $('tutorialArt');
  private readonly title = $('tutorialTitle');
  private readonly text = $('tutorialText');
  private readonly dots = $('tutorialDots');
  private readonly skipButton = $<HTMLButtonElement>('tutorialSkip');
  private readonly nextButton = $<HTMLButtonElement>('tutorialNext');
  private index = 0;

  constructor(
    private readonly steps: TutorialStep[],
    private readonly handlers: {
      /** Chegou ao fim e pediu para jogar. */
      onFinish(): void;
      /** Fechou antes do fim (Pular ou Esc). */
      onSkip(): void;
    },
  ) {
    this.dots.innerHTML = steps.map(() => '<span class="tutorial__dot"></span>').join('');
    this.nextButton.addEventListener('click', () => this.next());
    this.skipButton.addEventListener('click', () => this.close(false));
    this.dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.close(false);
    });
  }

  get isOpen(): boolean {
    return this.dialog.open;
  }

  open(): void {
    this.index = 0;
    this.render();
    if (!this.dialog.open) this.dialog.showModal();
    this.nextButton.focus();
  }

  next(): void {
    if (this.index === this.steps.length - 1) {
      this.close(true);
      return;
    }
    this.index++;
    this.render();
  }

  previous(): void {
    if (this.index === 0) return;
    this.index--;
    this.render();
  }

  private close(finished: boolean): void {
    this.dialog.close();
    if (finished) this.handlers.onFinish();
    else this.handlers.onSkip();
  }

  private render(): void {
    const step = this.steps[this.index]!;
    const last = this.index === this.steps.length - 1;

    this.art.innerHTML = step.art;
    this.title.textContent = step.title;
    this.text.textContent = step.text;
    this.nextButton.textContent = last ? 'Jogar!' : 'Próximo';
    this.skipButton.hidden = last;
    this.dialog.setAttribute('aria-label', `Como jogar — passo ${this.index + 1} de ${this.steps.length}`);
    Array.from(this.dots.children).forEach((dot, i) => dot.classList.toggle('is-active', i === this.index));

    // Reinicia a animação de entrada do conteúdo.
    const body = this.art.parentElement!;
    body.classList.remove('is-entering');
    void body.offsetWidth;
    body.classList.add('is-entering');
  }
}
