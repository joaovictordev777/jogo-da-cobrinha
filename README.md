# 🐍 Jogo da Cobrinha

O clássico Jogo da Cobrinha, no navegador e no celular. Feito com **TypeScript**, **Canvas 2D** e **Vite**.

## Como jogar

| Ação           | Teclado                    | Celular                      |
| -------------- | -------------------------- | ---------------------------- |
| Mover          | Setas ou `W` `A` `S` `D`   | Deslizar no tabuleiro ou D-pad |
| Pausar/retomar | `Espaço`, `P` ou `Esc`     | Botão de pausa               |
| Começar        | `Enter` ou qualquer seta   | Botão **Jogar**              |
| Ligar/desligar som | `M`                    | Botão de som                 |
| Como jogar     | Botão **?**                | Botão **?**                  |

A cobra acelera um pouco a cada frutinha. Na primeira visita aparece um mini tutorial. O recorde e a preferência de som ficam salvos no navegador.

Os efeitos sonoros (comer, morrer, começar/recomeçar, pausar) são sintetizados na hora com a Web Audio API — não há arquivos de áudio.

O layout se adapta a desktop, celular em pé (tabuleiro + D-pad) e celular deitado (tabuleiro ao lado dos controles).

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
├── main.ts              # Ponto de entrada: conecta jogo, entrada, som e interface
├── styles.css
├── audio/
│   └── Sound.ts         # Efeitos sonoros com Web Audio
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
│   ├── Hud.ts           # Placar, botões e telas de início/pausa/fim
│   └── Tutorial.ts      # Mini tutorial antes da primeira partida
└── storage/
    └── storage.ts       # Recorde e preferências no localStorage
```

As regras do jogo ficam em `logic.ts` como funções puras, separadas do desenho e da entrada — por isso são fáceis de testar (`*.test.ts`).
