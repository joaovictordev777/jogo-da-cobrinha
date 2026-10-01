/*
 * O localStorage pode estar indisponível (aba anônima, cookies bloqueados),
 * então toda leitura e escrita é tolerante a falhas.
 */

const PREFIX = 'cobrinha:';

function read(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // Sem persistência — o valor vale só para esta sessão.
  }
}

export function loadNumber(key: string): number {
  const value = Number(read(key));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function saveNumber(key: string, value: number): void {
  write(key, String(value));
}

export function loadString(key: string): string | null {
  return read(key);
}

export function saveString(key: string, value: string): void {
  write(key, value);
}

export function loadFlag(key: string): boolean {
  return read(key) === '1';
}

export function saveFlag(key: string, value: boolean): void {
  write(key, value ? '1' : '0');
}

export const KEYS = {
  highScore: 'recorde',
  muted: 'mudo',
  tutorialSeen: 'tutorial-visto',
  difficulty: 'dificuldade',
} as const;

/** Recorde separado por dificuldade. O Normal usa a chave antiga para manter recordes já salvos. */
export function highScoreKey(difficulty: string): string {
  return difficulty === 'normal' ? KEYS.highScore : `${KEYS.highScore}:${difficulty}`;
}
