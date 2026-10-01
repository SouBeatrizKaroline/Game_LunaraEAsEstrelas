# Validação da campanha — 1 de outubro de 2026

## Resultado local

- **58 verificações de física passaram**, incluindo todas as fases.
- **63 verificações de navegador passaram**, em Microsoft Edge com desktop e emulação móvel.
- Todos os arquivos JavaScript do jogo passaram na verificação de sintaxe.
- Nenhum erro de execução foi registrado na página desktop durante a suíte de interface.

## O que foi corrigido

O código anterior tinha uma única fase e não acionava um fluxo de conclusão. O replay não reiniciava a partida. Configurações e som não estavam integrados à interface. Pulos ficavam armazenados sem expiração, faltavam altura variável e tolerância de borda, as colisões podiam capturar a personagem por baixo e os cogumelos não impulsionavam. A água também não causava retorno ao checkpoint. A proteção contra quedas podia deixar a personagem caindo indefinidamente.

A campanha agora possui seis fases independentes, transições de história, desbloqueio sequencial, checkpoints, salvamento, revisitação, reinício confirmado e dois encerramentos. A simulação usa passos fixos e o retorno de uma queda participa da pausa, sem temporizadores que continuem movimentando a personagem durante um menu.

Também foram corrigidos divisão por zero e excesso de deslocamento na atração dos colecionáveis, liberação de comandos após perda de foco, uso simultâneo de teclas equivalentes e liberação de controles de ponteiro fora dos botões.

## Cobertura

### Física e geometria

As trajetórias são simuladas com a classe Player e a geometria real de cada capítulo. O teste explora saltos e caminhadas a partir de plataformas alcançadas, sem ativar poderes. Ele verifica que os cinco fragmentos, a memória opcional e a saída de cada fase podem ser alcançados.

Também verifica salto longo/curto, expiração de comandos, tolerância de borda, aterrissagem em queda rápida, ausência de captura por baixo, cogumelos, água, recarga de poder, transporte por plataforma móvel, retorno mesmo com poder ativado e recuperação de salvamentos ausentes ou inválidos.

### Interface e progresso

Menu inicial, capítulos bloqueados, história antes da ação, movimento por teclado, pausa, volumes, redução de movimento, controles na tela, captura de ponteiro, teclas simultâneas, perda de foco, coleta, portal bloqueado, conclusão dos seis capítulos, retorno após cair, pausa durante o retorno, dois finais, recarregamento da página, persistência de preferências, ausência de contagem duplicada, reinício confirmado/cancelado, celular em retrato e paisagem.

Para verificar a coleta e todas as transições em pouco tempo, o teste de interface posiciona a personagem perto dos itens e executa as atualizações reais do jogo. A travessia das fases é verificada separadamente pelo teste de trajetórias; isso não substitui uma avaliação longa de ritmo e dificuldade por jogadores.

## Limites

A verificação local usou Microsoft Edge e emulação móvel, não um aparelho físico. Safari e Firefox não foram executados neste ambiente. A suíte não mede preferência artística, duração ideal da campanha ou desempenho em celulares antigos. O salvamento pertence ao navegador e à origem usados; não é uma conta na nuvem.

O fluxo de GitHub Actions foi adicionado para repetir a verificação em Chromium. Seu resultado remoto deve ser consultado no GitHub após a publicação.
