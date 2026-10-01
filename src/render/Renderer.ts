import type { FrameRenderer } from '../game/Game';
import { VECTORS } from '../game/logic';
import type { GameState, Point } from '../game/types';

const PALETTE = {
  boardA: '#111823',
  boardB: '#141c28',
  snakeHead: [163, 247, 122],
  snakeTail: [22, 163, 74],
  eye: '#0b1016',
  food: '#ff5d73',
  foodGlow: 'rgba(255, 93, 115, 0.45)',
  leaf: '#7ee08a',
} as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPoint = (a: Point, b: Point, t: number): Point => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

function mixColor(a: readonly number[], b: readonly number[], t: number): string {
  const [r, g, bl] = a.map((v, i) => Math.round(lerp(v, b[i]!, t)));
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Desenha o tabuleiro no canvas, ajustando-se ao tamanho em tela e à densidade de pixels. */
export class CanvasRenderer implements FrameRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private size = 0;
  private cell = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly cols: number,
    private readonly rows: number,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D não suportado neste navegador.');
    this.ctx = ctx;
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  private resize(): void {
    const { width } = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.size = width;
    this.cell = width / this.cols;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(width * (this.rows / this.cols) * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  render(state: GameState, previous: Point[], progress: number, now: number): void {
    if (!this.size) return;
    this.drawBoard();
    if (state.food) this.drawFood(state.food, now);
    this.drawSnake(state, previous, progress);
  }

  private drawBoard(): void {
    const { ctx, cell } = this;
    ctx.fillStyle = PALETTE.boardA;
    ctx.fillRect(0, 0, this.size, this.size);
    ctx.fillStyle = PALETTE.boardB;
    for (let y = 0; y < this.rows; y++) {
      for (let x = (y % 2); x < this.cols; x += 2) {
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }

  private drawFood(food: Point, now: number): void {
    const { ctx, cell } = this;
    const cx = (food.x + 0.5) * cell;
    const cy = (food.y + 0.5) * cell;
    const pulse = 1 + Math.sin(now / 220) * 0.06;
    const r = cell * 0.34 * pulse;

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * 0.9);
    glow.addColorStop(0, PALETTE.foodGlow);
    glow.addColorStop(1, 'rgba(255, 93, 115, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - cell, cy - cell, cell * 2, cell * 2);

    ctx.fillStyle = PALETTE.food;
    ctx.beginPath();
    ctx.arc(cx, cy + cell * 0.04, r, 0, Math.PI * 2);
    ctx.fill();

    // Brilho e folhinha
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.25, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.leaf;
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.35, cy - r * 1.05, r * 0.38, r * 0.18, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSnake(state: GameState, previous: Point[], t: number): void {
    const { ctx, cell } = this;
    const current = state.snake;
    const head = lerpPoint(previous[0] ?? current[0]!, current[0]!, t);

    // Corpo como uma linha contínua pelos centros das células — a cabeça e a
    // cauda são interpoladas, o resto já está na posição do passo anterior.
    const points: Point[] = [head];
    for (let i = 1; i < current.length - 1; i++) points.push(current[i]!);
    if (current.length > 1) {
      const last = current.length - 1;
      points.push(lerpPoint(previous[last] ?? current[last]!, current[last]!, t));
    }

    const toPx = (p: Point): Point => ({ x: (p.x + 0.5) * cell, y: (p.y + 0.5) * cell });
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Sombra suave embaixo da cobra
    ctx.save();
    ctx.shadowColor = 'rgba(34, 197, 94, 0.35)';
    ctx.shadowBlur = cell * 0.6;
    ctx.strokeStyle = mixColor(PALETTE.snakeHead, PALETTE.snakeTail, 0.5);
    ctx.lineWidth = cell * 0.7;
    ctx.beginPath();
    points.forEach((p, i) => {
      const { x, y } = toPx(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // Degradê da cabeça até a cauda, segmento por segmento (da cauda para a cabeça)
    for (let i = points.length - 1; i > 0; i--) {
      const a = toPx(points[i]!);
      const b = toPx(points[i - 1]!);
      const ratio = i / Math.max(points.length - 1, 1);
      ctx.strokeStyle = mixColor(PALETTE.snakeHead, PALETTE.snakeTail, ratio);
      ctx.lineWidth = cell * lerp(0.78, 0.55, ratio);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    this.drawHead(toPx(head), state);
  }

  private drawHead(center: Point, state: GameState): void {
    const { ctx, cell } = this;
    const dir = VECTORS[state.direction];
    const perp = { x: -dir.y, y: dir.x };

    ctx.fillStyle = mixColor(PALETTE.snakeHead, PALETTE.snakeTail, 0);
    ctx.beginPath();
    ctx.arc(center.x, center.y, cell * 0.44, 0, Math.PI * 2);
    ctx.fill();

    const dead = state.status === 'over';
    for (const side of [-1, 1]) {
      const ex = center.x + dir.x * cell * 0.14 + perp.x * side * cell * 0.19;
      const ey = center.y + dir.y * cell * 0.14 + perp.y * side * cell * 0.19;
      if (dead) {
        const s = cell * 0.08;
        ctx.strokeStyle = PALETTE.eye;
        ctx.lineWidth = cell * 0.06;
        ctx.beginPath();
        ctx.moveTo(ex - s, ey - s);
        ctx.lineTo(ex + s, ey + s);
        ctx.moveTo(ex + s, ey - s);
        ctx.lineTo(ex - s, ey + s);
        ctx.stroke();
        continue;
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex, ey, cell * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.eye;
      ctx.beginPath();
      ctx.arc(ex + dir.x * cell * 0.04, ey + dir.y * cell * 0.04, cell * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
