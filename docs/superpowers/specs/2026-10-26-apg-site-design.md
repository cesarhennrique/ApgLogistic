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

Uma cena 3D contínua, sem cortes. A câmera avança conforme o scroll, e cada capítulo exibe um texto em HTML sobreposto.

| # | Faixa de scroll | Cena | Texto |
|---|---|---|---|
| 0 | Hero (antes de 0%) | Pôr do sol em Suape. Navio de cabotagem entra devagar, com reflexo e rastro na água | Logo APG, "Transportando confiança desde 1996", CTA "Solicitar cotação" |
| 1 | 0–20% | A câmera sobe até o portêiner. O spreader desce e trava no container | "1.900 TEUs por mês" (contador) |
| 2 | 20–40% | O container é içado, cruza o quadro e desce na carreta APG (cabine com logo e vermelho da marca) | "O braço rodoviário da cabotagem no Brasil" |
| 3 | 40–60% | A carreta sai do porto. Travelling lateral pela BR-101, com faróis acendendo e postes passando | "Frota 100% própria e rastreada · 24h" |
| 4 | 60–80% | Chegada ao terminal CONE. Vista aérea do pátio com pilhas de containers | "35.000 m² · 4.000 TEUs estáticos · 46 docas" |
| 5 | 80–100% | A câmera entra num galpão. Vans e caminhões pequenos saem em leque sobre o mapa de PE e BA | "500 entregas fracionadas por dia" |
| — | Saída | A cena escurece em navy e dá lugar às seções HTML da Home | — |

- **Assinatura visual:** uma linha vermelha, derivada da seta do logo, desenha o trajeto no chão da cena durante toda a jornada, ligando porto, estrada, terminal e cliente.
- **Estilo:** "miniatura cinematográfica". Os modelos são limpos e estilizados, não fotorrealistas. A luz é de cinema, com névoa, reflexo na água e bloom nas luzes.
- **Progressão da luz:** pôr do sol (capítulos 0–2), anoitecer na estrada (capítulo 3) e noite com luzes acesas (capítulos 4–5).

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
- Tela de loading: fundo navy, a seta vermelha desenha o percurso, contador de %. Meta: menos de 2 s em 4G.

## 6. Arquitetura técnica

### Stack

- Next.js (App Router) + TypeScript, com páginas estáticas (SSG).
- Tailwind CSS, com os tokens da seção 5.
- React Three Fiber + drei para o 3D, GSAP ScrollTrigger para o scroll, Lenis para o scroll suave.
- Vercel para hospedagem e funções serverless (somente os formulários).
- Resend para envio de e-mail.

### Cena 3D

- **Fonte única de verdade:** um único `progress` (0–1) vindo do ScrollTrigger, guardado em `ref`. A cena lê esse valor dentro de `useFrame`, sem re-render do React por frame.
- **Câmera (`CameraRig`):** um spline CatmullRom para a posição e outro para o ponto de foco. Cada capítulo corresponde a um trecho do spline.
- **Componentes:** `Ship`, `Crane`, `Truck`, `Highway`, `Terminal`, `Distribution`, `RouteLine`, `Lighting`, `CameraRig`.
  - Cada componente recebe só o progresso local do seu capítulo (0–1) e não conhece os demais.
  - `Lighting` e `RouteLine` recebem o progresso global.
- **Geometria:**
  - containers, portêiner, pátio e galpão são construídos com primitivas em código, com `InstancedMesh` para os containers;
  - o casco do navio e a cabine do caminhão são GLB, comprimidos com meshopt e texturas WebP via gltf-transform.
- **Orçamento:** até 1,5 MB de assets 3D e até 200 mil triângulos.

### Níveis de qualidade

| Nível | Quando | O que muda |
|---|---|---|
| Alto | GPU capaz (`PerformanceMonitor` do drei) | Pós-processamento, bloom, reflexo na água |
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
