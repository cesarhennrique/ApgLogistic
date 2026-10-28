# Análise da referência (unitedcarriers.com)

Fonte: gravação de scroll completo (66 s, 1920×1080), analisada em frames de 1 s em 2026-10-28. O vídeo fica em `assets-src/reference/` e não é versionado.

## Sequência observada

| Tempo | O que aparece | Técnica provável |
|---|---|---|
| 0–8 s | Hero escuro: globo com pontos, arcos de rota laranja e brilho azul na borda. Título grande à esquerda, dois botões pequenos | WebGL (Three.js), cena mínima |
| 9–10 s | O globo se afasta e vira um degradê azul (atmosfera), que clareia até branco | Transição de cor, sem cena |
| 10–13 s | Seção branca editorial: título grande, números enormes (2.500+, 96,7%, 8+), uma foto pequena | HTML |
| 13–20 s | **Objetos isolados sobre fundo branco puro:** reach stacker pega um container e o coloca numa carreta. Fotorrealista, sem cenário, sem céu | Sequência de frames pré-renderizada (estúdio) |
| 20–26 s | A carreta atravessa uma faixa escura. Texto gigante vazado "OUR SERVICES" atrás, cards de serviço rolando na frente | Frames + HTML sticky |
| 27–32 s | **Vista de cima:** a carreta segue uma estrada preta estilizada sobre fundo branco, fazendo curvas entre os blocos de texto | Ilustração vetorial + objeto de cima |
| 32–40 s | **Vista de cima:** navio sobre oceano real (vídeo), com rastro de espuma. Diferenciais distribuídos em volta | Vídeo de oceano + navio pré-renderizado |
| 40–42 s | Nuvens passam e um avião, visto de cima, cruza a tela até o bloco de depoimentos | Frames pré-renderizados |
| 42–62 s | Depoimentos, grade de logos de parceiros, notícias, FAQ, CTA final, footer com o nome em partículas | HTML + microinterações |

## O que faz o site parecer premium

1. **Objetos isolados, não mundos.** Nunca aparece um cenário inteiro com céu, horizonte ou porto. Cada objeto (reach stacker, carreta, navio, avião) aparece sozinho, sobre fundo limpo, iluminado como foto de produto.
2. **Vista de cima** nos trechos de movimento (estrada, oceano, avião). Ela esconde a falta de cenário e é muito legível.
3. **Um material real por vez:** o oceano é vídeo de verdade, os objetos são renders fotorrealistas e o resto é tipografia.
4. **Contraste de ritmo:** escuro (hero), depois branco, escuro, branco, azul profundo, branco. Cada seção tem uma cor de fundo dominante.
5. **Tipografia faz metade do trabalho:** títulos enormes, números enormes, muito espaço branco.
6. **O 3D em tempo real é mínimo** (só o globo). O impacto vem de frames pré-renderizados sincronizados ao scroll.

## Diagnóstico do nosso caminho atual

Construímos um **mundo contínuo** (céu, mar, porto, estrada, terminal) em 3D em tempo real e estilizado. É o caminho mais difícil, porque o olho compara céu, mar e névoa com a realidade, e qualquer falha vira "desenho animado". A referência faz o oposto: evita cenário e mostra objetos impecáveis isolados.

## Recomendação

Mudar a linguagem visual da jornada sem copiar a referência. Os modelos que já existem (containers, portêiner, navio, carreta) são reaproveitados:

- **Estúdio:** objetos isolados sobre fundo sand-50 ou navy, com luz de estúdio PBR (HDRI de estúdio, sombra de contato, AO). Em tempo real, um objeto isolado pode chegar a qualidade de configurador de produto.
- **Assinatura APG:** a seta vermelha do logo vira a linha do trajeto, em vista de cima, ligando Suape, a BR-101, o terminal CONE e o mapa de PE e BA.
- **Oceano:** vídeo real (stock livre) em vista de cima, com o navio por cima.
- **Opcional, para os 2 ou 3 momentos-chave:** renderizar frames fotorrealistas da nossa própria cena com path tracing (`three-gpu-pathtracer`) e tocar como sequência de frames, igual à técnica da referência, sem artista 3D externo.
