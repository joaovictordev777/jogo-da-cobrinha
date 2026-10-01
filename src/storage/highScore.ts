const KEY = 'cobrinha:recorde';

/** O localStorage pode estar indisponível (aba anônima, bloqueio de cookies), então tudo é tolerante a falhas. */
export function loadHighScore(): number {
  try {
    const value = Number(localStorage.getItem(KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(KEY, String(score));
  } catch {
    // Sem persistência — o recorde vale só para esta sessão.
  }
}
