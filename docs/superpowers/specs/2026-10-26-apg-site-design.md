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

## 3. Jornada da Home (revisão 2026-10-30 — imagens fotorrealistas)

> Histórico: a jornada foi um mundo 3D contínuo (descartado: "desenho animado"), depois palcos de estúdio PBR e depois "planta técnica" em traço (descartados pelo mesmo motivo). A análise da referência (`docs/reference-analysis.md`) mostrou que o impacto vem de **fotos fotorrealistas recortadas, movidas pelo scroll**. A prova em `/dev/prova` (carreta atravessando a tela) foi aprovada pelo usuário.

A jornada é uma sequência de **cenas** fixadas (sticky), cada uma com o seu próprio progresso de scroll. As imagens vêm de `assets-src/ai/` (geradas por IA, fundo branco recortado por `scripts/cutout-white.mjs`). O 3D em código fica só nos mapas (hero e distribuição).

| # | Cena | Fundo | O que acontece | Texto |
|---|---|---|---|---|
| 0 | Hero | navy-900 | Mapa do Nordeste com as rotas vermelhas chegando em Suape (inalterado, com o loading do Prompt 13e). No fim, a câmera mergulha em Suape e o mar do mapa vira o oceano da cena 1 | "Transportando confiança desde 1996" |
| 1 | Chegada | foto única `navio-mar` (navio no oceano, de cima, com espuma e rastro reais) | **A foto fica parada; só a câmera se move** (revisão 2026-10-30b: navio e espuma animados separadamente não pareceram reais). Começa alta, com o navio pequeno no oceano, e desce em zoom contínuo até o convés encher a tela, centrado num bloco com containers APG; um deles é o que o portêiner iça na cena 2. Uma linha vermelha tracejada à frente da proa aponta para "SUAPE · PE" e acompanha o zoom | "1.900 TEUs por mês" (contador) |
| 2 | Portêiner | branco #FEFEFE | O portêiner inteiro. O spreader com o container APG sobe de baixo (porão do navio, fora do quadro) e trava no carrinho; os cabos encurtam | "O braço rodoviário da cabotagem no Brasil" |
| 3 | Carga | branco | Close: o container desce do alto (cabos saindo do quadro) e encaixa na carreta vazia; no encaixe, 4 pontos red-500 nas travas e a imagem troca para a carreta carregada | — |
| 4 | Estrada | branco | A carreta com o logo sai rodando para a esquerda (rodas girando, faixas, linha vermelha, velocímetro) — a prova `/dev/prova` promovida | "Frota 100% própria e rastreada · 24h" |
| 5 | Terminal | sand-50 | Planta do terminal CONE em traço fino (SVG). A carreta vista de cima segue a linha vermelha e encosta numa doca; números entram como cotas | "35.000 m² · 4.000 TEUs estáticos · 46 docas · 5.000 m² cobertos" |
| 6 | Distribuição | navy-900 | Zoom out até o mapa do hero; a linha vermelha ramifica em 24 rotas por PE e BA. Depois, a seção Serviços | "500 entregas fracionadas por dia" |

- **Assinatura:** a linha vermelha da seta do logo atravessa todas as cenas: rotas do hero → rumo do navio → rastro da carreta → caminho no terminal → ramificação final.
- **Imagens:** fotorrealistas, isoladas, mesma luz de estúdio; nunca mostram marca de terceiros. Escala: cada cena mostra cada imagem no tamanho em que ela é nítida (por isso portêiner e carga são cenas separadas).
- **Movimento:** só `transform` e `opacity`; tudo atrelado ao progresso da cena (scrub), com easing por trecho (entra → segura enquanto o texto é lido → sai).

## 4. Estrutura do site

### Ordem da Home (revisão 2026-10-30b)

A Home lê como uma história só: **o que a APG faz** (jornada) → **o que você contrata** (serviços) → **por que confiar** (diferenciais, clientes) → **fale conosco**. Os códigos `APGU 1996-NN` seguem essa ordem, sem número repetido nem buraco (seção oculta não consome número).

| NN | Seção |
|---|---|
| 01 | Hero (mapa) |
| 02–07 | Jornada: Chegada · Portêiner · Carga · Frota · Terminal · Distribuição |
| 08 | **Serviços:** três cards (Containers Suape · Operação Bahia · Logística e Armazenagem) |
| 09 | **Por que a APG:** frota própria · terminal próprio integrado a Suape · rastreamento · atendimento 24h |
| 10 | **Clientes:** carrossel de logos; oculto enquanto não houver logos autorizados (aí o CTA vira 10) |
| 11 | **CTA final:** "Fale com um especialista", com cotação e WhatsApp |

Saem da Home, porque repetiam a jornada: **Números** (os números já aparecem nas cenas; o único que faltava, 5.000 m² de cross-docking, vira cota do Terminal) e **Mapa de atuação** (a cena Distribuição já é esse mapa).

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

### Cenas da jornada

- **Estrutura:** cada cena é uma seção com altura de scroll própria e um palco `sticky` de 100svh; o progresso (0–1) vem de um ScrollTrigger por cena e é lido em `onUpdate`, escrevendo estilos direto no DOM (sem re-render do React por frame).
- **Imagens:** geradas em WebP e AVIF em 3 larguras (800, 1200, original) por script a partir de `assets-src/ai/`; a cena seguinte é pré-carregada quando a anterior começa.
- **3D (Three.js):** só o mapa do hero e o mapa da distribuição. O canvas existe apenas nessas duas cenas e para de renderizar fora da tela.
- **Orçamento:** até 2 MB de imagens na jornada inteira no desktop e 1 MB no mobile.

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
