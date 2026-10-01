# Lunara · As Estrelas Perdidas

Uma aventura de plataforma em seis capítulos, feita com HTML5 Canvas e JavaScript. O jogo funciona sem instalação, compilação, fontes remotas ou arquivos de áudio externos.

## A jornada

Lunara encontra no seu pingente a última semente da guardiã da floresta. Para despertar a Árvore Ancestral, precisa reconstruir uma constelação espalhada por seis lugares. As memórias violetas revelam uma segunda conclusão para a história.

| Capítulo | Lugar | Desafio |
| --- | --- | --- |
| 1 — O último brilho | Início da Floresta | Movimento e saltos de altura variável |
| 2 — O bosque que sonha | Bosque dos Cogumelos | Impulsos automáticos e caminhos nas copas |
| 3 — Entre duas margens | Ponte Antiga | Travessias e exploração abaixo da ponte |
| 4 — A canção do riacho | Riacho Encantado | Saltos entre pedras e retorno ao cair na água |
| 5 — Memórias de pedra | Clareira Mística | Escadarias e plataformas em movimento |
| 6 — De volta ao firmamento | Árvore Ancestral | Combinação das mecânicas e encerramento |

Cada fase tem **cinco fragmentos obrigatórios**, **uma memória opcional**, dois checkpoints e um portal. As cinco luzes sobre o portal mostram o progresso. Reunir os fragmentos e atravessar o portal desbloqueia o próximo capítulo. Todas as rotas obrigatórias e memórias são alcançáveis sem poderes. Cair preserva as coletas; não há vidas ou game over.

A narrativa e as instruções ficam nas telas de capítulo, ajuda e pausa. Durante a ação, aparecem apenas ícones, contadores e controles.

## Jogar

Abra `index.html` em um navegador moderno. Para uma origem estável de salvamento, também é possível servir a pasta:

```sh
python -m http.server 8000
```

Acesse `http://localhost:8000`.

### Controles

- **A/D ou ←/→:** andar.
- **W, ↑ ou Espaço:** pular; segure para saltar mais alto.
- **Shift:** correr.
- **E ou ✦:** impulso estelar, desbloqueado após cinco fragmentos acumulados. Recarrega em seis segundos. A partir de dez fragmentos, permite um segundo salto no ar durante os três segundos de ativação.
- **Esc ou ⏸:** pausar.
- **Celular:** setas de movimento e botão ↑. Os controles também podem ser ativados nas configurações.

O jogo pausa ao perder o foco ou trocar de aba. O retorno de uma queda também fica congelado durante a pausa.

## Progresso e acessibilidade

O progresso é salvo automaticamente neste navegador, por fase: coletas, checkpoint, capítulos desbloqueados e conclusão. O menu permite continuar, revisitar capítulos e recomeçar com confirmação. Recomeçar mantém as preferências. Não existe sincronização entre dispositivos ou navegadores. Se o armazenamento estiver bloqueado, o jogo continua na sessão e avisa na pausa.

As configurações incluem volumes independentes, silenciar áudio, redução de movimento, tremor de tela, densidade de partículas, destaque de fragmentos e controles na tela. Menus aceitam teclado, mostram foco e mantêm a navegação dentro da tela aberta. Reduzir movimento desativa animações decorativas; as plataformas móveis continuam funcionando por fazerem parte do desafio.

## Desenvolvimento e testes

Node.js 22 ou superior é suficiente para os testes de física:

```sh
npm test
```

Para a verificação de navegador:

```sh
npm install
npx playwright install chromium
npm run test:browser
```

É possível usar um navegador Chromium já instalado definindo `BROWSER_EXECUTABLE` com o caminho do executável. O teste de navegador inicia e encerra seu próprio servidor local.

- `tests/physics.cjs`: simula trajetórias com a física real, sem poderes, para verificar acesso a fragmentos, memórias e saídas, além das regressões de salto, colisão, cogumelos e água.
- `tests/browser.cjs`: valida menus, controles, pausa, salvamento, reinício, seis transições e dois finais, em desktop e emulação móvel. Para testar rapidamente as transições, posiciona a personagem junto aos itens; a geometria é validada separadamente pela simulação.
- `docs/QA.md`: resultados e limites da validação.
- GitHub Actions executa as duas suítes a cada alteração na `main`.

## Arquivos

`js/campaign.js` reúne narrativa, geometria, portais, salvamento e detalhes vetoriais dos seis capítulos. `js/game.js` controla os estados e a simulação fixa de 120 passos por segundo. `js/player.js` reúne física e desenho animado de Lunara. Os demais módulos cuidam de áudio, câmera, colecionáveis, checkpoints, partículas, cenários e interface.

Criação de **SouBeatrizKaroline**.
