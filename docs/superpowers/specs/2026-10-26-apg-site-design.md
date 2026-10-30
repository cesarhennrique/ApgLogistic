# Site APG Transportes e Logística — Documento de Design

- **Data:** 2026-10-26
- **Cliente:** APG Transportes e Logística (Cabo de Santo Agostinho – PE)
- **Valor do projeto:** R$ 15.000
- **Site atual:** https://apgtransportes.wixsite.com/apg-transporte-e-log
- **Referência de nível de entrega:** https://unitedcarriers.com/ (nível de execução e animação, não layout nem conteúdo)

## 1. Objetivo

Substituir o site Wix atual por um site institucional de padrão internacional. A Home conta, numa cena 3D contínua controlada pelo scroll, a operação real da APG: do navio de cabotagem em Suape até a entrega fracionada. O site deve:

1. Posicionar a APG como operador logístico de grande porte, à altura das marcas que ela atende.
2. Gerar pedidos de cotação (formulário e WhatsApp).
3. Ranquear em buscas como "transporte de container Suape" e "armazenagem Pernambuco".

### Critérios de sucesso

- A jornada 3D roda a 60 fps em desktop e a pelo menos 30 fps em celular intermediário.
- LCP < 2,5 s, CLS ≈ 0, INP < 200 ms. Lighthouse ≥ 90 em desktop e ≥ 85 em mobile.
- WCAG 2.1 AA.
- O formulário de cotação entrega o e-mail com 100% de sucesso nos testes. Se falhar, o usuário vê erro e a alternativa de WhatsApp.

### Fora do escopo

- Blog e notícias.
- Área do cliente e rastreamento de carga.
- Versão em inglês. A estrutura de rotas e textos fica preparada para ela.
- CMS. As alterações de conteúdo são feitas pelo desenvolvedor.

## 2. Insumos do cliente

| Item | Status |
|---|---|
| Logo em vetor | Disponível |
| Fotos e vídeos em alta (frota, terminal, drone) | **Pendente.** Usar fotos do site atual, se a resolução permitir, e imagens licenciadas ou geradas como apoio |
| Logos de clientes, com autorização | **Pendente.** A seção fica pronta e oculta até chegar o material |
| Certificações e números atualizados | **Pendente.** Usar os números do site atual |
| Acesso ao DNS de `apgtransportes.com.br` | **Pendente.** Necessário para o lançamento e para verificar o domínio no Resend |
| Confirmar se `rh@apgtransportes.com.br` está ativo e qual e-mail recebe cotações | **Pendente** |

Números confirmados (fonte: site atual): fundada em 1996; média de 1.900 TEUs por mês; 500 entregas fracionadas por dia; 35.000 m² de pátio; 46 docas niveladoras eletro-hidráulicas; 5.000 m² de estrutura coberta (cross-docking); terminal com capacidade para 4.000 TEUs estáticos; frota 100% própria e rastreada; atendimento 24 h.

Endereços:
- **Matriz:** BR-101, Km 96,4, Condomínio CONE Multimodal 1, Galpão – Distrito Industrial Diper, Cabo de Santo Agostinho – PE, CEP 54503-900.
- **Filial:** Rua Bico Doce, S/N, Palestina – Gl Sala 01, Salvador – BA, CEP 41308-066.
- **Telefone:** (81) 3202-1800.

## 3. Jornada 3D da Home

> **Revisão 2026-10-28:** a versão anterior (mundo 3D contínuo com céu, mar e névoa) foi substituída. Motivo: em tempo real, simular o mundo inteiro lia como "desenho animado". A análise da referência (`docs/reference-analysis.md`) mostrou que o impacto vem de **objetos impecáveis isolados** e **vistas de cima**, não de cenário.

A jornada é uma sequência de **palcos** (stages), um por capítulo, num único canvas. Não há céu, horizonte nem névoa. Cada palco tem fundo de cor sólida da marca, luz de estúdio e uma câmera própria. A troca de palco acontece por movimento de câmera e por transição da cor de fundo, sincronizados ao scroll.

| # | Faixa | Fundo | Palco | Texto |
|---|---|---|---|---|
| 0 | Hero | navy-900 | **Mapa do litoral do Nordeste** em 3D inclinado (malha IBGE em linhas finas e pontos). Rotas de cabotagem chegam do mar em arcos luminosos e convergem em Suape, que pulsa. Câmera orbita devagar, guiada por tempo | Logo APG, "Transportando confiança desde 1996", CTA |
| → | 0–0.05 | navy → sand-50 | A câmera mergulha em Suape e o fundo clareia | — |
| 1 | 0–0.2 | sand-50 | **Planta técnica, elevação lateral:** portêiner e um corte do navio (proa e pilhas) se "constroem" em traço navy; cotas mostram 45 m de altura e 55 m de lança. O spreader desce e trava no container APG, o único objeto sólido (navy com faixa vermelha) | "1.900 TEUs por mês" (contador) |
| 2 | 0.2–0.4 | sand-50 | **Planta técnica, elevação:** o container cruza o quadro e assenta na carreta APG desenhada em traço; cota "12,19 m · 40'" no container; o logo APG em sólido na porta | "O braço rodoviário da cabotagem no Brasil" |
| 3 | 0.4–0.6 | navy-900 | **Elevação em traço claro sobre navy:** carreta em perfil rodando (rodas com raios girando), linhas da pista e postes passando em parallax, feixe dos faróis em traço. A linha vermelha corre sob as rodas | "Frota 100% própria e rastreada · 24h" |
| 4 | 0.6–0.8 | sand-50 | **Planta baixa:** terminal CONE visto de cima em traço (pátio, pilhas, galpão com as 46 docas numeradas). A carreta segue a linha vermelha e encosta numa doca. Números aparecem como cotas de planta, em mono | "35.000 m² · 4.000 TEUs estáticos · 46 docas" |
| 5 | 0.8–1 | sand-50 → navy-900 | **Vista de cima, zoom out:** o terminal vira um ponto no mapa de PE e BA. A linha vermelha ramifica em 24 rotas com vans até os dois estados | "500 entregas fracionadas por dia" |
| — | Saída | navy-900 | O mapa escurece e dá lugar à seção Serviços | — |

- **Assinatura visual:** a seta vermelha do logo é a linha do trajeto. Ela aparece no hero (rotas), corre sob a carreta (capítulo 3) e guia a carreta e as vans nos capítulos 4 e 5.
- **Estilo: "planta técnica" (revisão 2026-10-30).** A mesma linguagem do hero em toda a jornada: desenho técnico 3D animado. Objetos com preenchimento chapado (sem PBR) e arestas em traço fino; cotas e anotações em mono; grade técnica de fundo muito sutil. Os objetos se "constroem" quando o palco entra (arestas se desenham, depois o preenchimento aparece). Só o container APG e a linha vermelha são sólidos e coloridos; todo o resto é traço e tom. Motivo: em tempo real, objetos procedurais semirrealistas liam como brinquedo; como desenho técnico, a simplicidade vira estilo.
- **Cores por fundo:** sobre navy, traço sand-50 (60–80%) e preenchimento navy um tom acima; sobre sand, traço navy-900 e preenchimento sand mais claro. Acento único: red-500.
- **Ritmo de cor:** navy (hero) → sand (capítulos 1–2) → navy (3) → sand (4–5) → navy (Serviços).
- **Opcional (momentos-chave):** os capítulos 1 e 2 podem ser renderizados offline com path tracing (`three-gpu-pathtracer`) a partir da mesma cena e tocados como sequência de frames no tier alto. Fica para depois do marco 2, se o tempo real não bastar.

## 4. Estrutura do site

### Home, depois da jornada

1. **Serviços:** três cards (Containers Suape · Operação Bahia · Logística e Armazenagem). No hover, uma miniatura 3D da operação gira.
2. **Números:** faixa escura com contadores: 1996 · 1.900 TEUs/mês · 35.000 m² · 4.000 TEUs · 500 entregas/dia · 24h.
3. **Por que a APG:** frota própria · terminal próprio integrado a Suape · rastreamento · atendimento 24h.
4. **Clientes:** carrossel de logos. Fica oculto enquanto não houver logos autorizados.
5. **Mapa de atuação:** mapa estilizado do Nordeste, com linhas vermelhas animadas saindo de Suape e de Salvador.
6. **CTA final:** "Fale com um especialista", com cotação e WhatsApp.

### Páginas

| Rota | Conteúdo |
|---|---|
| `/` | Jornada 3D + seções acima |
| `/sobre` | História desde 1996, fundador Paulo Germano de Albuquerque Ramos, linha do tempo animada no scroll, missão e valores |
| `/servicos/containers-suape` | Operação de containers em Suape: estrutura, diferenciais, FAQ, CTA |
| `/servicos/operacao-bahia` | Operação de containers na Bahia (BR-324): estrutura, diferenciais, FAQ, CTA |
| `/servicos/logistica-armazenagem` | Entregas fracionadas, armazenagem, cross-docking, supply chain: estrutura, diferenciais, FAQ, CTA |
| `/estrutura` | Terminal CONE: pátio, docas, cross-docking, galeria, vista 3D do terminal |
| `/contato` | Formulário de cotação, endereços de Matriz e Filial com mapa, telefones |
| `/trabalhe-conosco` | Texto institucional + formulário com upload de currículo |
| `/privacidade` | Política de Privacidade (LGPD) |

Cada página interna tem um hero curto com um recorte da cena 3D, em câmera fixa e versão leve.

### Navegação

- Header fixo e minimalista, transparente sobre o 3D e sólido depois do scroll. O botão "Solicitar cotação" fica sempre visível.
- Menu fullscreen com links grandes.
- Transição entre páginas: cortina navy com a seta vermelha cruzando a tela.
- Botão flutuante de WhatsApp em todas as páginas.

## 5. Identidade visual

### Paleta

| Token | Valor | Uso |
|---|---|---|
| `navy-900` | `#0A1338` | Fundo principal, seções escuras, cortina de transição |
| `blue-600` | `#393185` | Azul do logo: links, detalhes, gradientes |
| `red-500` | `#E31E24` | Só CTA, linha do trajeto e destaques pontuais |
| `sand-50` | `#F3EFE7` | Fundo das seções claras |
| `steel-400` | `#8B94A8` | Texto secundário, divisores |
| `sunset` | `#F2913D` | Só na iluminação da cena 3D, nunca na interface |

Os valores de `blue-600` e `red-500` foram extraídos do PNG original do logo (4962×2954). Contraste de `red-500` sobre `navy-900`: 3,8:1, então o vermelho em texto só aparece em tamanho grande; em botão vermelho, o texto é branco `#FFFFFF` (4,7:1).

### Tipografia

- **Archivo** (variável, com eixo de largura). Títulos em Condensed, grandes e em caixa alta. Corpo em largura normal.
- **JetBrains Mono** para números, rótulos e etiquetas técnicas. Números com `tabular-nums`.

### Código de container

Cada seção recebe um rótulo em mono, pequeno, no canto, inspirado no formato ISO 6346. Exemplos: `APGU 1996-01 · QUEM SOMOS`, `APGU 1996-02 · SERVIÇOS`.

### Movimento

| Elemento | Comportamento |
|---|---|
| Títulos | Revelação linha a linha, máscara de baixo para cima, `ease-out`, 700 ms, 60 ms entre linhas |
| Números | Contagem a partir de 0 ao entrar na tela |
| Imagens | `scale` de 1.08 para 1 com clip vertical |
| Botões | Feedback em 150 ms. A seta do CTA avança 4 px no hover |
| `prefers-reduced-motion` | Tudo vira fade simples. O 3D usa os quadros estáticos |

### Logo e loading

- Variações do logo: original, monocromática branca (fundos escuros) e só a seta (favicon e ícone de loading).

### Loading e abertura do hero (revisão 2026-10-28)

O loading e a entrada do hero são **uma coreografia só**: as setas do logo que carregam a página viram as rotas vermelhas que chegam em Suape no mapa do hero.

**Loading** (fundo navy-900, só na primeira visita da sessão):

| Elemento | Comportamento |
|---|---|
| As 3 setas do logo, centradas | Desenhadas em traço red-500 da esquerda para a direita, na proporção do carregamento **real** (fontes + assets 3D + primeiro frame do canvas) |
| Contador mono `000` → `100` | Tabular, abaixo das setas, sincronizado ao carregamento |
| Linha de status (mono, steel-400) | Muda por faixa: "Atracando em Suape…" (0–40%), "Içando container…" (40–80%), "Liberando carreta…" (80–100%) |
| Coordenada fixa no canto inferior | `SUAPE · PE · 08°23′S 34°57′W` |
| Saída (100%) | As setas disparam para a direita e saem da tela (450 ms, ease-in). O traço delas continua como as rotas do mapa do hero |
| Tempo | Mínimo 1,2 s, máximo 4 s. Depois de 4 s sai mesmo sem o 3D, e o mapa entra com fade quando ficar pronto |

**Entrada do hero** (a partir da saída do loading; em visitas seguintes da sessão, a mesma sequência comprimida em 600 ms):

| t (ms) | Elemento |
|---|---|
| 0 | Contornos dos estados do Nordeste se desenham (900 ms); a grade de pontos aparece em onda radial a partir de Suape |
| 300 | As 5 rotas vermelhas chegam do mar até Suape (1.200 ms, escalonadas). Suape pulsa quando a primeira chega |
| 500 | ContainerCode `APGU 1996-01 · QUEM SOMOS` digita caractere a caractere (400 ms) |
| 650 | h1 revela linha a linha com máscara (700 ms por linha, 90 ms entre linhas) |
| 1100 | Subtítulo: fade + 12 px para cima (500 ms) |
| 1300 | CTA "Solicitar cotação" e link secundário "Ver a operação ↓" (rola até o capítulo 1); header desce do topo (400 ms) |
| 1600 | Faixa inferior: indicador "Role para descobrir", relógio ao vivo `SUAPE 19:42` (fuso America/Recife) e ticker mono `1.900 TEUs/mês · 500 entregas/dia · desde 1996 · 24h` |

**Interação no hero:**
- Parallax do mapa com o mouse (inclinação de até ±2°, com damping), desligado em touch e em reduced motion.
- Hover em Suape mostra o rótulo "Terminal CONE · Cabo de Santo Agostinho".

**Regras:**
- Fundo só navy-900 com grão fino e vinheta radial muito suave. Nada de degradê colorido.
- O h1 existe no HTML desde o início (LCP). O loading é uma camada `aria-hidden` por cima e não bloqueia o paint.
- Com reduced motion: sem loading animado (fade de 200 ms) e o hero aparece completo, sem coreografia.
- Meta: o loading termina em menos de 2 s em 4G.

## 6. Arquitetura técnica

### Stack

- Next.js (App Router) + TypeScript, com páginas estáticas (SSG).
- Tailwind CSS, com os tokens da seção 5.
- React Three Fiber + drei para o 3D, GSAP ScrollTrigger para o scroll, Lenis para o scroll suave.
- Vercel para hospedagem e funções serverless (somente os formulários).
- Resend para envio de e-mail.

### Cena 3D

- **Fonte única de verdade:** um único `progress` (0–1) vindo do ScrollTrigger, guardado em `ref`. A cena lê esse valor dentro de `useFrame`, sem re-render do React por frame.
- **Palcos (`stages`):** cada capítulo é um grupo isolado (`HeroMapStage`, `CraneStage`, `LoadStage`, `HighwayStage`, `TerminalStage`, `DistributionStage`) com câmera própria. Só os palcos ativos (o atual e o vizinho numa transição) são renderizados. A câmera interpola entre as chaves do palco atual e do próximo.
- **Fundo:** cor sólida interpolada por progresso (`stageBackground(t)`), sem céu nem névoa.
- **Render de planta técnica:** materiais sem luz (preenchimento chapado com no máximo 2 tons por face, por orientação da normal) e arestas com `EdgesGeometry` (ângulo ≥ 20°) desenhadas como `LineSegments2` de espessura constante em pixels, com revelação por progresso. Cotas são componentes reutilizáveis (linha de cota + texto mono). Sem sombras, sem AO, sem environment.
- **Pós-processamento:** só SMAA, bloom leve no vermelho e granulação fina.
- **Geometria:** procedural, reaproveitando os modelos já feitos (containers instanciados, portêiner, navio, carreta, mapa IBGE extrudado, `RouteLine`).
- **Orçamento:** até 1,5 MB de assets 3D e até 200 mil triângulos por palco.

### Níveis de qualidade

| Nível | Quando | O que muda |
|---|---|---|
| Alto | GPU capaz (`PerformanceMonitor` do drei) | Pós-processamento completo (AO, bloom, SMAA, grão), sombras acumuladas |
| Leve | GPU fraca ou fps abaixo de 30 | Sem pós-processamento, menos instâncias |
| Estático | Sem WebGL ou `prefers-reduced-motion` | Imagens WebP renderizadas da própria cena, uma por capítulo, com os mesmos textos |

### Conteúdo e SEO

- Todo texto é HTML real sobre o canvas. O canvas tem `aria-hidden="true"`.
- O LCP vem do texto do hero, e o canvas carrega depois.
- Metadata por página, imagens Open Graph, `sitemap.xml` e `robots.txt`.
- JSON-LD `Organization` + `LocalBusiness` (Matriz PE e Filial BA).

### Formulários

- **Cotação** (`/contato`): nome, empresa, e-mail, telefone, origem, destino, tipo de carga, volume, mensagem e consentimento LGPD.
- **Currículo** (`/trabalhe-conosco`): nome, e-mail, telefone, área de interesse, arquivo PDF de até 5 MB e consentimento LGPD.
- **Processamento:** Route Handler do Next.js com validação **zod** no servidor, honeypot e rate limit por IP. Envio por Resend.
- **Em caso de erro:** mensagem clara para o usuário e link de WhatsApp como alternativa. Os dados digitados ficam no formulário.

### LGPD e analytics

- Página `/privacidade` e checkbox de consentimento nos formulários.
- Vercel Analytics, sem cookies, então não precisa de banner de cookies.
- Eventos de conversão: `cotacao_enviada`, `curriculo_enviado`, `whatsapp_clique`.

### Acessibilidade

- WCAG 2.1 AA.
- Navegação completa por teclado e foco visível.
- Contraste validado, em especial `red-500` sobre `navy-900`. Se não atingir 4,5:1 em texto, o vermelho fica restrito a elementos não textuais e texto grande.

## 7. Testes e qualidade

- **Playwright:**
  - todas as rotas carregam sem erro de console;
  - os formulários validam e enviam (envio simulado);
  - screenshots em 1440 px e 375 px.
- **Lighthouse CI** em cada deploy, com as metas da seção 1.
- **Teste manual em aparelhos reais:** iPhone (Safari), Android intermediário (Chrome), desktop Chrome, Safari e Firefox.
- **Teste dos níveis de qualidade:** forçar os níveis leve e estático e conferir que todo o conteúdo continua acessível.

## 8. Marcos de entrega

1. **Fundação:** design system, todas as páginas com conteúdo, formulários funcionando, site navegável sem 3D.
2. **Jornada 3D:** cena completa da Home e heros 3D das páginas internas.
3. **Polimento:** motion, transição entre páginas, loading, níveis de qualidade e fallback estático.
4. **QA e lançamento:** testes em aparelhos, SEO, apontamento de `apgtransportes.com.br`, verificação do domínio no Resend e entrega ao cliente.

## 9. Riscos

| Risco | Mitigação |
|---|---|
| Modelagem 3D é o maior esforço e pode atrasar | Primitivas em código para quase tudo. GLB só para navio e cabine. O marco 1 entrega valor sem depender do 3D |
| Faltam fotos em alta | O 3D carrega a maior parte do visual. Imagens licenciadas ou geradas como apoio. Pedir as fotos cedo |
| Sem logos de clientes autorizados | A seção fica oculta até haver autorização |
| DNS do domínio fora do nosso controle | Pedir o acesso no marco 1 e lançar primeiro no domínio da Vercel |
| Celulares fracos | Níveis de qualidade automáticos e fallback estático |
