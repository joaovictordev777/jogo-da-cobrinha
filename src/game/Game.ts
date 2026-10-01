import { GRID, MAX_QUEUED_TURNS } from './config';
import { createInitialState, isOpposite, step, tickDuration } from './logic';
import type { Direction, GameState, Point } from './types';

export interface FrameRenderer {
  /** `progress` vai de 0 a 1 entre `previous` e `state.snake` — usado para animar suavemente. */
  render(state: GameState, previous: Point[], progress: number, now: number): void;
}

export interface GameEvents {
  /** Disparado quando pontuação ou status mudam. */
  onChange(state: GameState): void;
  onEat?(state: GameState): void;
}

/**
 * Controla o tempo: roda o loop com `requestAnimationFrame`, avança a lógica
 * em passos fixos e guarda a fila de comandos do jogador.
 */
export class Game {
  private state: GameState;
  private previousSnake: Point[];
  private queue: Direction[] = [];
  private accumulator = 0;
  private lastFrame = 0;

  constructor(
    private readonly renderer: FrameRenderer,
    private readonly events: GameEvents,
  ) {
    this.state = createInitialState(GRID.cols, GRID.rows);
    this.previousSnake = this.state.snake;
    requestAnimationFrame(this.frame);
  }

  get current(): GameState {
    return this.state;
  }

  /** Inicia (ou reinicia, se a partida acabou) o jogo. */
  start(): void {
    if (this.state.status === 'running') return;
    if (this.state.status === 'over' || this.state.status === 'won') this.reset();
    this.setStatus('running');
  }

  reset(): void {
    this.state = createInitialState(GRID.cols, GRID.rows);
    this.previousSnake = this.state.snake;
    this.queue = [];
    this.accumulator = 0;
    this.events.onChange(this.state);
  }

  togglePause(): void {
    if (this.state.status === 'running') this.setStatus('paused');
    else if (this.state.status === 'paused') this.setStatus('running');
  }

  turn(direction: Direction): void {
    const { status } = this.state;
    if (status === 'paused' || status === 'over' || status === 'won') return;

    // Compara com o último comando enfileirado, não só com a direção atual.
    // Assim, apertar ↑ e ← rapidinho não faz a cobra virar para dentro de si mesma.
    const last = this.queue.at(-1) ?? this.state.direction;
    const isTurn = direction !== last && !isOpposite(last, direction);
    if (isTurn && this.queue.length < MAX_QUEUED_TURNS) this.queue.push(direction);

    // Na tela inicial, qualquer seta já começa a partida.
    if (status === 'ready') this.start();
  }

  private setStatus(status: GameState['status']): void {
    this.state = { ...this.state, status };
    this.events.onChange(this.state);
  }

  private tick(): void {
    const direction = this.queue.shift() ?? this.state.direction;
    const before = this.state;
    const { state, ate } = step(before, direction);

    this.previousSnake = before.snake;
    this.state = state;

    if (state.status !== 'running') {
      // Fim de jogo: congela a cobra na posição final.
      this.previousSnake = state.snake;
      this.accumulator = 0;
    }
    if (ate) this.events.onEat?.(state);
    if (ate || state.status !== before.status) this.events.onChange(state);
  }

  private frame = (now: number): void => {
    // Limita o delta para não "pular" vários passos ao voltar de outra aba.
    const delta = this.lastFrame ? Math.min(now - this.lastFrame, 250) : 0;
    this.lastFrame = now;

    let progress = 1;
    if (this.state.status === 'running') {
      this.accumulator += delta;
      let duration = tickDuration(this.state.score);
      while (this.accumulator >= duration && this.state.status === 'running') {
        this.accumulator -= duration;
        this.tick();
        duration = tickDuration(this.state.score);
      }
      progress = this.state.status === 'running' ? this.accumulator / duration : 1;
    } else if (this.state.status === 'paused') {
      progress = this.accumulator / tickDuration(this.state.score);
    }

    this.renderer.render(this.state, this.previousSnake, progress, now);
    requestAnimationFrame(this.frame);
  };
}
