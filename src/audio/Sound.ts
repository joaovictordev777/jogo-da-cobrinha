interface Tone {
  freq: number;
  /** Frequência final, para fazer um "slide". */
  to?: number;
  /** Atraso em segundos a partir de agora. */
  delay?: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

type AudioContextCtor = typeof AudioContext;

/**
 * Efeitos sonoros sintetizados na hora com Web Audio — sem arquivos de áudio.
 */
export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor(private muted = false) {}

  get isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /** Navegadores só liberam áudio depois de um gesto do usuário — chame em cliques e teclas. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  /** Fica mais agudo conforme a pontuação sobe. */
  eat(score: number): void {
    const base = 520 * Math.pow(2, Math.min(score, 36) / 36);
    this.play([
      { freq: base, to: base * 1.5, duration: 0.07, type: 'square', volume: 0.12 },
      { freq: base * 1.5, to: base * 2, delay: 0.05, duration: 0.09, type: 'triangle', volume: 0.22 },
    ]);
  }

  die(): void {
    this.play([
      { freq: 420, to: 60, duration: 0.6, type: 'sawtooth', volume: 0.14 },
      { freq: 210, to: 45, delay: 0.06, duration: 0.65, type: 'square', volume: 0.1 },
      { freq: 90, to: 40, duration: 0.3, type: 'sine', volume: 0.35 },
    ]);
  }

  start(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    this.play(notes.map((freq, i) => ({ freq, delay: i * 0.07, duration: 0.14, type: 'triangle', volume: 0.22 })));
  }

  win(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
    this.play(notes.map((freq, i) => ({ freq, delay: i * 0.1, duration: 0.2, type: 'triangle', volume: 0.22 })));
  }

  pause(): void {
    this.play([{ freq: 660, to: 440, duration: 0.12, type: 'sine', volume: 0.2 }]);
  }

  resume(): void {
    this.play([{ freq: 440, to: 660, duration: 0.12, type: 'sine', volume: 0.2 }]);
  }

  /** Clique curto, usado ao reativar o som (para confirmar que está ligado). */
  tick(): void {
    this.play([{ freq: 880, duration: 0.06, type: 'triangle', volume: 0.18 }]);
  }

  private play(tones: Tone[]): void {
    if (this.muted) return;
    this.unlock();
    const { ctx, master } = this;
    if (!ctx || !master) return;

    const now = ctx.currentTime;
    for (const tone of tones) {
      const start = now + (tone.delay ?? 0);
      const end = start + tone.duration;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = tone.type ?? 'sine';
      osc.frequency.setValueAtTime(tone.freq, start);
      if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, end);

      // Envelope rápido para evitar estalos no começo e no fim.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(tone.volume ?? 0.2, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain).connect(master);
      osc.start(start);
      osc.stop(end + 0.02);
    }
  }
}
