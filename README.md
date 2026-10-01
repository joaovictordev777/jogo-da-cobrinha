# 🐍 Jogo da Cobrinha

O clássico Jogo da Cobrinha, no navegador e no celular. Feito com **TypeScript**, **Canvas 2D** e **Vite**.

## Como jogar

| Ação           | Teclado                    | Celular                      |
| -------------- | -------------------------- | ---------------------------- |
| Mover          | Setas ou `W` `A` `S` `D`   | Deslizar no tabuleiro ou D-pad |
| Pausar/retomar | `Espaço`, `P` ou `Esc`     | Botão de pausa               |
| Começar        | `Enter` ou qualquer seta   | Botão **Jogar**              |

A cobra acelera um pouco a cada frutinha. O recorde fica salvo no navegador.

## Rodando localmente

Requer [Node.js](https://nodejs.org/) 20 ou mais recente.

```bash
npm install
npm run dev
```

| Script              | O que faz                                    |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento com recarga automática |
| `npm run build`     | Checa os tipos e gera o site estático em `dist/` |
| `npm run preview`   | Serve o build de produção localmente         |
| `npm test`          | Roda os testes (Vitest)                      |

O conteúdo de `dist/` pode ser publicado em qualquer hospedagem estática (GitHub Pages, Vercel, Netlify…).

## Estrutura

```
src/
├── main.ts              # Ponto de entrada: conecta jogo, entrada e interface
├── styles.css
├── game/
│   ├── config.ts        # Tamanho do tabuleiro e velocidade
│   ├── types.ts
│   ├── logic.ts         # Regras puras (mover, comer, colidir) — sem DOM
│   └── Game.ts          # Loop de jogo, fila de comandos, pausa
├── render/
│   └── Renderer.ts      # Desenho no canvas com animação suave
├── input/
│   ├── keyboard.ts
│   └── touch.ts         # Gestos de deslizar
├── ui/
│   └── Hud.ts           # Placar e telas de início/pausa/fim
└── storage/
    └── highScore.ts     # Recorde no localStorage
```

As regras do jogo ficam em `logic.ts` como funções puras, separadas do desenho e da entrada — por isso são fáceis de testar (`*.test.ts`).
