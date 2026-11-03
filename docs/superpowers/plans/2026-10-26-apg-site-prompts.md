# Site APG — Plano de implementação em prompts

> **Para quem executa:** cada bloco `PROMPT` abaixo é colado inteiro numa conversa **nova** do Claude no VS Code, aberto na pasta `apg-site/`. O Claude do VS Code lê o `CLAUDE.md` sozinho. Use os prompts na ordem. Antes de abrir o próximo, rode a checagem do fim de cada prompt e o **Prompt de revisão**.

**Objetivo:** construir o site da APG descrito em `docs/superpowers/specs/2026-10-26-apg-site-design.md`.

**Arquitetura:** Next.js SSG com conteúdo centralizado em `src/content/site.ts`. A Home tem uma cena React Three Fiber cujo progresso vem de um único valor mutável (`journeyProgress.value`), escrito pelo GSAP ScrollTrigger e lido no `useFrame`. Os formulários são Route Handlers na Vercel.

**Stack:** Next.js, TypeScript, Tailwind v4, React Three Fiber, drei, postprocessing, GSAP (ScrollTrigger e SplitText), Lenis, zod, Resend, Vitest, Playwright.

## Restrições globais

Valem para todos os prompts.

- Paleta: `navy-900 #0A1338`, `blue-600 #393185`, `red-500 #E31E24`, `sand-50 #F3EFE7`, `steel-400 #8B94A8`, `sunset #F2913D` (só no 3D). Azul e vermelho extraídos do PNG original do logo (4962x2954). Contraste: red-500 sobre navy-900 = 3,8:1, então vermelho em texto só ≥ 24px (ou 19px bold); em botão vermelho, o texto é #FFFFFF (4,7:1), nunca sand-50 (4,1:1).
- Fontes: Archivo (variável, eixo `wdth`) e JetBrains Mono.
- Capítulos da jornada: hero = 0 (animação por tempo); 1: 0–0.2; 2: 0.2–0.4; 3: 0.4–0.6; 4: 0.6–0.8; 5: 0.8–1.
- Orçamento 3D: até 1,5 MB de assets e até 200 mil triângulos. 60 fps em desktop, 30+ em mobile intermediário.
- Metas: LCP < 2,5 s, CLS ≈ 0, INP < 200 ms. Lighthouse ≥ 90 desktop e ≥ 85 mobile. WCAG 2.1 AA.
- Currículo: só PDF, até 5 MB. Formulários com honeypot, rate limit e zod no servidor.
- Variáveis de ambiente: `RESEND_API_KEY`, `MAIL_FROM`, `QUOTE_TO_EMAIL`, `RESUME_TO_EMAIL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`.

## Interfaces compartilhadas

Os nomes abaixo são contratos entre prompts. Não renomeie.

| Arquivo | Exporta |
|---|---|
| `src/content/site.ts` | `site` (nome, `founded`, telefones, e-mails, `addresses.matriz`/`addresses.filial`, `stats[]`, `services[]`, `differentials[]`, `timeline[]`, `faq` por serviço), tipos `Service`, `Stat` |
| `src/components/motion/useReducedMotion.ts` | `useReducedMotion(): boolean` |
| `src/components/motion/RevealText.tsx` | `<RevealText as="h1" \| "h2" \| "p" className? children: string />` |
| `src/components/motion/Counter.tsx` | `<Counter value: number suffix?: string duration?: number />` |
| `src/components/ui/ContainerCode.tsx` | `<ContainerCode index: number label: string />`, que renderiza `APGU 1996-0{index} · {LABEL}` |
| `src/components/ui/CtaButton.tsx` | `<CtaButton href variant="primary" \| "ghost">` |
| `src/components/layout/TransitionLink.tsx` | `<TransitionLink href>`: toca a cortina e navega |
| `src/three/progress.ts` | `journeyProgress: { value: number }` |
| `src/three/chapters.ts` | `type ChapterId = 'hero' \| 'crane' \| 'load' \| 'highway' \| 'terminal' \| 'distribution'`, `CHAPTERS`, `localProgress(global: number, id: ChapterId): number` (0–1, com clamp) |
| `src/three/quality.ts` | `type QualityTier = 'high' \| 'low' \| 'static'`, `pickTier(input: { webgl: boolean; reducedMotion: boolean; gpuTier: number }): QualityTier`, `useQualityTier()` |
| `src/lib/schemas.ts` | `quoteSchema`, `resumeSchema` (zod), tipos `QuoteInput`, `ResumeInput` |
| `src/lib/rate-limit.ts` | `rateLimit(key: string, limit: number, windowMs: number): boolean` |
| `src/lib/mailer.ts` | `sendMail(input: { to: string; subject: string; html: string; replyTo?: string; attachments?: { filename: string; content: Buffer }[] }): Promise<void>` |

---

## Prompt de revisão (usar depois de cada prompt)

````text
Revise o que foi feito no último commit contra o CLAUDE.md e o spec
(docs/superpowers/specs/2026-10-26-apg-site-design.md). Use a skill
superpowers:requesting-code-review. Aponte: bugs, desvios do spec,
violações das convenções (animação fora de transform/opacity, texto
fora de src/content/site.ts, falta de reduced-motion, problemas de
acessibilidade). Corrija o que for real, rode lint, typecheck, test e
e2e, e faça um commit "fix: revisão" se houver mudanças.
````

---

# Marco 1 — Fundação

## Prompt 01 — Scaffold, tokens, fontes e conteúdo

````text
Leia o CLAUDE.md, o spec (docs/superpowers/specs/2026-10-26-apg-site-design.md)
e as seções "Restrições globais" e "Interfaces compartilhadas" do plano
(docs/superpowers/plans/2026-10-26-apg-site-prompts.md).

Tarefa: criar a base do projeto Next.js dentro desta pasta (que já tem docs/,
assets-src/ e CLAUDE.md; não apague nada).

1. Crie o app com create-next-app (TypeScript, App Router, Tailwind, ESLint,
   src/, alias @/*), na versão estável atual. Se ele recusar a pasta por
   não estar vazia, gere numa pasta temporária fora do projeto e mova os
   arquivos para cá, sem sobrescrever CLAUDE.md, docs/ e assets-src/.
   Adicione: vitest, @testing-library/react, jsdom, @playwright/test.
   Scripts no package.json: dev, build, start, lint, typecheck
   (tsc --noEmit), test (vitest run), e2e (playwright test).
2. Tokens em src/app/globals.css via @theme: as cores das Restrições
   globais, como --color-navy-900 etc. Fundo padrão navy-900, texto sand-50.
3. Fontes com next/font/google: Archivo com axes ['wdth'] (variável
   --font-display) e JetBrains Mono (--font-mono). Crie utilitários
   .font-condensed (font-stretch 62%) e .font-mono-tabular
   (tabular-nums).
4. Logo: o arquivo vetorial está em assets-src/logo/. Gere em
   public/brand/: logo.svg (original otimizado), logo-white.svg
   (monocromático branco) e arrow.svg (só a seta). Extraia os hex exatos do
   azul e do vermelho do logo e atualize blue-600 e red-500 nos tokens, no
   spec e nas Restrições globais do plano. Gere src/app/icon.svg a partir
   da seta. Se o logo não estiver em SVG, pare e me avise.
5. src/content/site.ts: exporte `site` com TODOS os dados do spec (seções
   2, 3 e 4): fundação 1996, fundador, stats (1900 TEUs/mês, 500
   entregas/dia, 35000 m², 46 docas, 5000 m² cobertos, 4000 TEUs, 24h),
   endereços completos da Matriz e da Filial, telefone (81) 3202-1800,
   e-mail rh, 3 serviços (slug, título, resumo, bullets, FAQ com 4
   perguntas cada, escritas a partir do conteúdo do spec), 4 diferenciais,
   linha do tempo (1996 fundação; marque com `// confirmar com cliente`
   qualquer marco que não esteja no spec), os textos dos 6 capítulos da
   jornada, `mission` e `values` (marcados `// confirmar com cliente`),
   `gallery: { src: string; alt: string }[]` (vazio por enquanto) e
   `clients: { name: string; logo: string }[]` (vazio). O WhatsApp vem de
   process.env.NEXT_PUBLIC_WHATSAPP_NUMBER. Slugs dos serviços:
   containers-suape, operacao-bahia, logistica-armazenagem.
6. TDD (skill superpowers:test-driven-development): src/content/site.test.ts
   verifica que todo service tem slug único e 4 FAQs e que stats contém os
   7 números acima. Escreva o teste antes e veja-o falhar.
7. Layout raiz com lang="pt-BR", metadata base e página / provisória com
   o h1 "Transportando confiança desde 1996".
8. Playwright: config com projetos desktop (1440x900) e mobile (iPhone
   13), webServer rodando npm run dev. Teste e2e/smoke.spec.ts: / carrega,
   o h1 aparece e não há erros de console. Rode npx playwright install
   chromium webkit.
9. Crie .env.example com: RESEND_API_KEY, MAIL_FROM, QUOTE_TO_EMAIL,
   RESUME_TO_EMAIL, NEXT_PUBLIC_WHATSAPP_NUMBER, NEXT_PUBLIC_SITE_URL.
   Garanta que .env*.local está no .gitignore.

Pronto quando: npm run lint, npm run typecheck, npm run test e
npm run e2e passam (use a skill superpowers:verification-before-completion
e mostre a saída).
Commit: "feat: scaffold, tokens, fontes e conteúdo"
````

## Prompt 01b — Logo vetorial a partir do PNG em alta

````text
Leia o CLAUDE.md.

Contexto: assets-src/logo/logo.svg foi traçado de uma imagem de 192px e
está deformado. O site antigo tem o PNG original em 4962x2954, com duas
cores chapadas exatas: azul #393185 e vermelho #E31E24.

1. Baixe https://static.wixstatic.com/media/64205d_aa89fadd6fc64cdfb223ecf6a65dc45c~mv2.png
   para assets-src/logo/logo-original.png. Registre a origem em
   assets-src/LICENSES.md (material do cliente).
2. Crie scripts/vectorize-logo.mjs: com sharp, gera uma máscara por cor
   (tolerância de ±24 por canal em torno de cada hex) e vetoriza cada
   máscara com potrace (pacote npm potrace, turdSize 4, optTolerance 0.2).
   Junta as duas camadas num único SVG com viewBox justo (sem margem),
   fill="#393185" e fill="#E31E24". sharp e potrace entram só como
   devDependencies.
3. Saídas em public/brand/, substituindo as atuais:
   - logo.svg: duas cores;
   - logo-white.svg: tudo #FFFFFF;
   - arrow.svg: só a camada vermelha (as setas), com viewBox justo;
   - src/app/icon.svg: seta vermelha sobre navy, como hoje.
   Otimize com svgo (npx svgo, sem instalar).
4. Verificação objetiva: o script renderiza logo.svg com sharp no tamanho
   do PNG e compara pixel a pixel com o original. Falha se mais de 1,5% dos
   pixels opacos divergirem. Mostre o percentual.
5. Confira visualmente: abra o logo.svg ampliado e leia o texto da faixa,
   "Transporte e Logística". Se estiver deformado, ajuste turdSize e
   optTolerance e rode de novo.
6. Tokens: em src/app/globals.css, troque --color-blue-600 para #393185 e
   --color-red-500 para #E31E24. Apague assets-src/logo/logo.svg (o traço
   ruim) e mantenha o PNG original.

Pronto quando: diff abaixo de 1,5%, texto legível, e lint, typecheck,
test e e2e passam.
Commit: "fix: logo vetorial fiel ao original e cores exatas"
````

## Prompt 02 — Primitivas de motion e UI

````text
Leia o CLAUDE.md. Use as skills animate, emil-design-eng e
superpowers:test-driven-development.

Tarefa: criar as primitivas de motion e UI. Os nomes e props são os da
tabela "Interfaces compartilhadas" em
docs/superpowers/plans/2026-10-26-apg-site-prompts.md.

1. Instale gsap e lenis. src/components/motion/SmoothScroll.tsx (client):
   inicia o Lenis, integra com o ScrollTrigger (lenis.on('scroll',
   ScrollTrigger.update) + gsap.ticker) e fica desligado se
   useReducedMotion() for true. Coloque no layout raiz.
2. useReducedMotion: hook com matchMedia, SSR-safe (false no servidor).
3. RevealText: SplitText por linhas, máscara de baixo para cima,
   ease "power3.out", 0.7s, stagger 0.06. Dispara ao entrar na tela
   (ScrollTrigger start "top 85%"). Reduced-motion: fade de 0.3s. O texto
   fica legível sem JS (estado inicial aplicado só depois do mount).
   Refaz o split no resize.
4. Counter: conta de 0 até value ao entrar na tela, 1.6s, "power2.out",
   com Intl.NumberFormat('pt-BR'), font-mono-tabular e largura fixa (sem
   layout shift). Reduced-motion: mostra o valor final direto.
5. ContainerCode: texto mono pequeno steel-400,
   "APGU 1996-0{index} · {LABEL MAIÚSCULO}".
6. CtaButton: primary = fundo red-500, texto #FFFFFF (sand-50 não passa
   em contraste), com a seta do logo em branco (arrow.svg via CSS mask
   com background currentColor; vermelho sobre vermelho some) que avança
   4px no hover. ghost = borda sand-50/30 e seta red-500. Transição de
   150ms, foco visível
   (outline 2px sand-50, offset 3px), alvo mínimo de 44px.
7. Testes unitários: ContainerCode formata corretamente; Counter
   renderiza o valor final quando reduced-motion está ativo (mock de
   matchMedia); CtaButton renderiza um link com o href.
8. Página interna /dev/ui (só em development: notFound() em produção)
   mostrando todas as primitivas, o logo e a paleta, e um título em
   .font-condensed ao lado do mesmo título em largura normal. Confirme
   com screenshot do Playwright que o condensed está realmente estreito
   (largura medida menor que 75% da normal; adicione esse teste em
   e2e/ui.spec.ts).

Pronto quando: lint, typecheck, test e e2e passam e /dev/ui está bonita
em desktop e mobile.
Commit: "feat: primitivas de motion e UI"
````

## Prompt 03 — Header, menu, footer, WhatsApp e transição de página

````text
Leia o CLAUDE.md e o spec, seção 4 "Navegação". Use as skills
frontend-design:frontend-design, animate e emil-design-eng.

1. src/components/layout/Header.tsx: fixo, minimalista. Fica transparente
   no topo e sólido (navy-900/90 + backdrop-blur) depois de 80px de
   scroll. Logo à esquerda, CtaButton "Solicitar cotação" (/contato) e
   botão de menu à direita.
2. src/components/layout/MenuOverlay.tsx: menu fullscreen navy-900 com
   links grandes em Archivo condensed caixa alta (Home, Sobre, Serviços
   com os 3 subitens, Estrutura, Contato, Trabalhe Conosco). Entrada com
   stagger. Esc fecha. Foco preso dentro do menu, que volta ao botão ao
   fechar. aria-expanded e aria-controls corretos. Body sem scroll
   enquanto aberto (pausar o Lenis).
3. src/components/layout/Footer.tsx: endereços da Matriz e da Filial,
   telefone, e-mail, links e "© {ano} APG Transportes e Logística". Tudo
   vem de site.ts.
4. src/components/layout/WhatsAppButton.tsx: botão flutuante, link
   wa.me com mensagem padrão "Olá, vim pelo site e gostaria de uma
   cotação." Só renderiza se NEXT_PUBLIC_WHATSAPP_NUMBER existir. Chama
   track('whatsapp_clique') do @vercel/analytics (instale e coloque
   <Analytics /> no layout).
5. src/components/layout/TransitionLink.tsx + PageCurtain.tsx: no
   clique, a cortina navy sobe (transform: translateY), a seta vermelha
   cruza a tela, faz router.push, e a cortina sai quando a nova rota
   monta (usePathname). Cmd/Ctrl+clique abre em nova aba normalmente.
   Reduced-motion: navegação direta. Use TransitionLink em todo link
   interno do header, do menu e do footer.
6. e2e/navigation.spec.ts: abrir e fechar o menu com teclado (Tab até o
   botão, Enter, Esc) e navegar para /sobre pelo menu (crie páginas
   provisórias para todas as rotas do spec, cada uma com h1).

7. Correção do RevealText (piscada acima da dobra): adicione a prop
   `immediate`. Com ela, não há ScrollTrigger: o texto já nasce escondido
   via CSS antes do paint (script inline no <head> que adiciona a classe
   `js` no <html>, e a regra `.js [data-reveal-immediate] { opacity: 0 }`)
   e revela no mount. Fallback de segurança: animação CSS que força
   opacity 1 depois de 2s, caso o JS falhe. Sem JS, o texto aparece
   normal. Teste e2e: no carregamento de /dev/ui, o h1 com immediate
   nunca é visível antes da animação (capture a opacity no
   DOMContentLoaded) e termina visível.

Pronto quando: lint, typecheck, test e e2e passam.
Commit: "feat: navegação, footer, WhatsApp e transição de página"
````

## Prompt 04 — Seções HTML da Home

````text
Leia o CLAUDE.md e o spec, seções 4 e 5. Use as skills
frontend-design:frontend-design e emil-design-eng.

Tarefa: montar a Home inteira em HTML. O 3D entra no Marco 2, então por
enquanto o hero usa um placeholder.

0. Mapa: assets-src/map/nordeste-ibge.svg já está no projeto (malha
   oficial do IBGE, 9 estados). Limpe para public/images/map/nordeste.svg:
   um <path> por estado com id pela sigla (o IBGE usa códigos: 21=MA,
   22=PI, 23=CE, 24=RN, 25=PB, 26=PE, 27=AL, 28=SE, 29=BA), sem fill e
   stroke fixos, sem o transform de escala (aplique nas coordenadas),
   viewBox justo. Registre a origem em assets-src/LICENSES.md (IBGE,
   dados públicos).
1. src/components/home/Hero.tsx: altura 100svh. Placeholder de fundo:
   gradiente navy-900 → blue-600 com leve grão (SVG noise). Por cima:
   ContainerCode 1 "Quem somos", h1 RevealText "Transportando confiança
   desde 1996" (Archivo condensed, clamp(3rem, 9vw, 9rem)), subtítulo e
   CtaButton. Deixe um <div id="journey-slot"> onde o canvas vai entrar.
2. src/components/home/Services.tsx: 3 cards grandes (um por serviço de
   site.services), com imagem (next/image, em
   public/images/services/<slug>.webp; se não existir, use um bloco
   blue-600 com o ícone lucide correspondente), título, resumo e
   TransitionLink. Hover: imagem com scale 1.04, seta avança. Deixe um
   slot <div data-mini3d={slug}> para a miniatura 3D.
3. src/components/home/Stats.tsx: faixa navy com os 7 Counter de
   site.stats e legenda mono.
4. src/components/home/Differentials.tsx: 4 diferenciais em grid, com
   número grande + texto.
5. src/components/home/Clients.tsx: carrossel de logos em marquee CSS
   (pausa no hover e no reduced-motion). Só renderiza se site.clients
   tiver itens; hoje está vazio.
6. src/components/home/CoverageMap.tsx: SVG do Nordeste em
   public/images/map/nordeste.svg (veja o guia de assets), com PE e BA em
   destaque. Linhas vermelhas animadas (stroke-dashoffset) saindo de Suape
   e de Salvador quando a seção entra na tela.
7. src/components/home/FinalCta.tsx: "Fale com um especialista",
   CtaButton para /contato e o botão de WhatsApp.
8. Cada seção com ContainerCode (índices 1 a 7 em ordem). Alternância
   de fundo navy e sand-50 para dar ritmo.
9. Ajuste e2e/smoke.spec.ts: a Home mostra os 3 serviços e o texto
   "1.900" depois de rolar até os números.

10. Correções visuais vistas no print do Prompt 03:
   - RevealText corta acentos e descendentes (o "Ç" de CONFIANÇA perde a
     cedilha). Cada linha da máscara precisa de padding-block 0.12em com
     margin-block -0.12em, para o clip não comer Ç, J, Q e acentos de
     caixa alta. Teste e2e: o bounding box do glifo "Ç" inteiro fica
     dentro da área visível da linha.
   - Grid único: crie um container de layout (max-width 1440px, padding
     lateral clamp(16px, 4vw, 64px)) usado pelo Header, pelo Hero e por
     todas as seções, para o logo, o h1 e o botão de menu alinharem na
     mesma margem.
   - Logo no header: altura mínima de 40px no desktop e 32px no mobile,
     para a faixa "Transporte e Logística" não virar ruído. Se mesmo assim
     ficar ilegível, use no header a versão sem a faixa (só APG + setas)
     e deixe a completa para o footer.
   - Hero: h1 alinhado à esquerda, ocupando no máximo 2 linhas, com
     subtítulo e CTA embaixo e ContainerCode acima. Nada de texto
     centralizado solto na tela.

Pronto quando: lint, typecheck, test e e2e passam, sem overflow
horizontal em 375px.
Commit: "feat: seções HTML da Home"
````

## Prompt 05 — Páginas internas

````text
Leia o CLAUDE.md e o spec, seção 4 "Páginas". Use a skill
frontend-design:frontend-design.

1. src/components/layout/PageHero.tsx: hero curto (60svh) com
   ContainerCode, h1 RevealText e subtítulo. Deixe <div
   data-hero3d={variant}> para o recorte 3D do Marco 2. Placeholder:
   gradiente da Home.
2. /sobre: história desde 1996, fundador Paulo Germano de Albuquerque
   Ramos, linha do tempo vertical animada no scroll (linha vermelha que
   cresce com scaleY ligado ao ScrollTrigger, itens com RevealText) e
   missão/valores (site.ts).
3. /servicos/[slug]: uma rota dinâmica com generateStaticParams sobre
   site.services. Layout: PageHero, "o que fazemos", estrutura (números
   relevantes com Counter), diferenciais, FAQ em <details>/<summary>
   estilizado e acessível, FinalCta. Slug inexistente dá notFound().
4. /estrutura: números do terminal CONE, docas, cross-docking e galeria.
   A galeria usa as imagens de public/images/estrutura/*.webp listadas em
   site.gallery (alt obrigatório), com lightbox acessível (dialog nativo,
   Esc fecha, setas navegam).
5. /privacidade: Política de Privacidade (LGPD) para um site
   institucional com formulários de cotação e currículo: dados
   coletados, finalidade, base legal, retenção, direitos do titular e
   contato. Marque no topo, com comentário no código, que o texto deve ser
   validado pelo jurídico do cliente.
6. e2e/pages.spec.ts: cada rota do spec responde 200 e tem exatamente um
   h1; /servicos/inexistente dá 404.

Pronto quando: lint, typecheck, test e e2e passam.
Commit: "feat: páginas internas"
````

## Prompt 06 — Formulários de cotação e currículo

````text
Leia o CLAUDE.md e o spec, seção 6 "Formulários". Use a skill
superpowers:test-driven-development e escreva os testes antes.

1. Instale zod e resend.
2. src/lib/schemas.ts:
   - quoteSchema: name (2–100), company (opcional, até 120), email,
     phone (10–11 dígitos depois de remover a máscara), origin,
     destination, cargoType (enum: 'container-20', 'container-40',
     'fracionada', 'armazenagem', 'outro'), volume (até 100), message
     (até 2000), consent (literal true), website (honeypot: deve ser
     vazio).
   - resumeSchema: name, email, phone, area (enum: 'operacao',
     'motorista', 'administrativo', 'comercial', 'outro'), consent,
     website. O arquivo é validado à parte: application/pdf, até 5 MB, e
     os primeiros bytes devem ser "%PDF".
   Testes para cada regra, incluindo o caso do honeypot preenchido.
3. src/lib/rate-limit.ts: janela deslizante em memória (Map).
   Comentário: "shortcut: memória por instância serverless, não
   compartilhada; trocar por Upstash Redis se houver abuso". Testes com
   vi.useFakeTimers.
4. src/lib/mailer.ts: sendMail via Resend com RESEND_API_KEY e
   MAIL_FROM. Lança um erro se a variável faltar.
5. src/app/api/cotacao/route.ts (POST JSON) e
   src/app/api/curriculo/route.ts (POST multipart):
   - rate limit de 5 por 10 min por IP (header x-forwarded-for);
     se exceder, 429;
   - honeypot preenchido: responde 200 sem enviar nada;
   - erro de validação: 400 com os erros por campo;
   - falha do Resend: 502;
   - sucesso: 200.
   O HTML do e-mail escapa todos os valores. replyTo é o e-mail do
   usuário. Testes das rotas com mailer mockado (vi.mock) cobrindo
   200, 400, 429, honeypot e 502.
6. Componentes client src/components/forms/QuoteForm.tsx e
   ResumeForm.tsx:
   - labels visíveis, erros por campo com aria-describedby e máscara de
     telefone;
   - no envio, o botão mostra o estado de enviando e fica desabilitado;
   - sucesso: mensagem de confirmação + track('cotacao_enviada') ou
     track('curriculo_enviado');
   - erro: mensagem clara + link de WhatsApp, sem perder o que foi
     digitado;
   - honeypot escondido de forma acessível (fora da tela, tabIndex -1,
     aria-hidden, autocomplete off);
   - checkbox de consentimento com link para /privacidade.
   Coloque o QuoteForm em /contato (com endereços e mapa embed do Google
   Maps via iframe com loading="lazy" e title) e o ResumeForm em
   /trabalhe-conosco.
7. e2e/forms.spec.ts: intercepte /api/* com page.route. Testar o erro de
   validação visível, o sucesso e a falha 502 mostrando o WhatsApp.

Pronto quando: lint, typecheck, test e e2e passam.
Commit: "feat: formulários de cotação e currículo"
````

## Prompt 07 — SEO

````text
Leia o CLAUDE.md e o spec, seção 6 "Conteúdo e SEO". Use a skill
seo-schema para o JSON-LD.

1. metadataBase com NEXT_PUBLIC_SITE_URL. Title template
   "%s | APG Transportes e Logística". Description única por página,
   tirada de site.ts. Canonical por página.
2. Imagens Open Graph com next/og (opengraph-image.tsx) na raiz e em
   /servicos/[slug]: fundo navy, seta vermelha, título em Archivo
   condensed, ContainerCode. Carregue a fonte do arquivo local em
   src/app/fonts/ (baixe o TTF do Archivo para lá).
3. src/app/sitemap.ts (todas as rotas, incluindo os 3 serviços) e
   src/app/robots.ts (permite tudo, aponta o sitemap; bloqueia /dev e
   /api).
4. JSON-LD no layout raiz: Organization (nome, logo, telefone,
   foundingDate 1996, founder) + duas LocalBusiness (Matriz PE e Filial
   BA) com PostalAddress completo. Nas páginas de serviço, um Service e
   um FAQPage. Gere tudo a partir de site.ts.
5. Teste unitário: o JSON-LD gerado tem os dois endereços e os CEPs
   54503-900 e 41308-066. e2e: /sitemap.xml lista
   /servicos/containers-suape.

Pronto quando: lint, typecheck, test e e2e passam.
Commit: "feat: SEO, OG images e dados estruturados"
````

> **Checkpoint Marco 1:** rode `npm run dev` e navegue o site inteiro no desktop e no celular, na mesma rede, usando o IP da máquina. Faça um deploy de preview na Vercel (veja o Prompt 19) e mostre ao cliente. O site já é apresentável sem o 3D.

---

# Marco 2 — Jornada 3D

## Prompt 08 — Fundação da cena 3D

````text
Leia o CLAUDE.md e o spec, seções 3 e 6 "Cena 3D". Use as skills
superpowers:test-driven-development e animation-performance.

1. Instale three, @react-three/fiber, @react-three/drei e @types/three.
2. src/three/progress.ts: export const journeyProgress = { value: 0 }.
3. src/three/chapters.ts: ChapterId, CHAPTERS (ranges das Restrições
   globais) e localProgress(global, id), que retorna 0–1 com clamp; o
   'hero' sempre retorna 1 se global > 0. Escreva antes os testes de
   bordas: 0, 0.2, 0.1999, 1 e valores negativos.
4. src/three/camera-path.ts: dois CatmullRomCurve3 (position e target)
   com 1 ponto-chave por fronteira de capítulo (7 pontos). Exporte
   sampleCamera(t): { position: Vector3; target: Vector3 } com
   suavização (smootherstep entre pontos). Teste: t=0 retorna o primeiro
   ponto e t=1 o último.
5. src/three/CameraRig.tsx: no useFrame, lê journeyProgress.value e
   interpola a câmera com damping (THREE.MathUtils.damp, lambda 4),
   nunca saltando.
6. src/three/JourneyCanvas.tsx (client, carregado com next/dynamic
   ssr:false): Canvas sticky (top 0, 100svh) dentro de um wrapper
   #journey que contém o Hero E a trilha #journey-track. O hero é o
   capítulo 0, então o 3D já aparece atrás do h1. Quando o wrapper sai da
   tela, o canvas rola junto e para de renderizar (frameloop "never" via
   IntersectionObserver). aria-hidden, dpr [1, 2], com placeholders
   (caixas coloridas) por capítulo nas posições em que cada cena vai
   ficar. O gradiente do hero continua como fundo até o canvas montar
   (fade-in de 600ms, sem salto).
7. src/three/useJourneyScroll.ts: ScrollTrigger num wrapper
   #journey-track com altura de 600vh (scrub true) que escreve
   journeyProgress.value. Os textos dos capítulos (site.ts) ficam em
   HTML sobreposto, sticky, cada um visível na sua faixa.
8. Debug: ?p=0.35 congela journeyProgress em 0.35 (sem scroll); ?debug
   liga OrbitControls + um <input type="range"> fixo que escreve o
   progresso. Ambos funcionam também em produção, sem custo quando
   desligados.
9. Monte na Home: wrapper #journey = [Hero (com o #journey-slot) +
   #journey-track], depois Services. Os textos dos capítulos 1 a 5
   aparecem só dentro da trilha; o texto do capítulo 0 é o próprio Hero.
10. e2e: /?p=0.5 renderiza um canvas e não gera erros de console.

Pronto quando: lint, typecheck, test e e2e passam e o scroll move a
câmera suavemente por 6 grupos de caixas.
Commit: "feat: fundação da cena 3D e trilha de scroll"
````

## Prompt 09 — Ambiente: mar, céu, luz e névoa

````text
Leia o CLAUDE.md e o spec, seção 3 (progressão da luz). Use a skill
animation-performance.

Alvo visual do hero: pôr do sol em Suape. Sol baixo perto do horizonte,
à esquerda do quadro; horizonte laranja (sunset) subindo para navy no
topo; a água reflete uma faixa dourada do sol até a câmera; névoa leve
fundindo mar e céu. Tem que parecer cinema, não demo de three.js.

0. Assets (CC0/MIT; registre cada um em assets-src/LICENSES.md):
   - HDRI: consulte https://api.polyhaven.com/assets?t=hdris&c=sunrise-sunset,
     escolha um céu limpo de sol baixo sobre água ou campo aberto e baixe
     a versão 1k .hdr (URL em https://api.polyhaven.com/files/<id>) para
     public/3d/hdri/sunset-1k.hdr. Diga qual escolheu.
   - Normal map da água: baixe
     https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg
     para assets-src/3d/ e converta com sharp para
     public/3d/textures/water-normal.webp (1024px, qualidade 85).
1. Renderer: toneMapping ACESFilmic, outputColorSpace SRGB, exposure
   ligado ao progresso (vem de sampleLight).
2. src/three/lightKeys.ts: keyframes de céu (topo, horizonte), sol (cor,
   intensidade, elevação, azimute), ambient, hemisphere, névoa (cor,
   densidade) e exposure em t = 0, 0.4, 0.6, 1 (pôr do sol, pôr do sol
   tardio, anoitecer, noite). Função pura sampleLight(t) com interpolação
   suave. Teste de continuidade: nenhuma grandeza salta mais de 2% entre
   t e t+0.001 em todo o intervalo.
3. src/three/scene/Sky.tsx: esfera invertida com shader de gradiente
   (horizonte → topo) e disco do sol com halo suave, cores de
   sampleLight. Estrelas discretas (Points) que aparecem só depois de 0.6.
4. HDRI só para reflexos (scene.environment, sem background), com
   environmentIntensity de sampleLight.
5. src/three/scene/Ocean.tsx: plano com shader próprio: 3 ondas Gerstner
   leves no vertex; fresnel; reflexo da cor do céu; faixa especular do
   sol; detalhe com water-normal.webp em duas escalas rolando em direções
   diferentes. Some (opacity → 0) entre 0.38 e 0.42, quando a câmera sai
   do porto.
6. src/three/scene/Lighting.tsx: directional (sol) + ambient +
   hemisphere de sampleLight. Sombras só do sol, shadow map 2048 (o tier
   low vem no Prompt 15), com a câmera de sombra seguindo o capítulo
   atual.
7. Névoa FogExp2 com cor e densidade de sampleLight, igual ao horizonte
   do céu (sem costura visível).
8. Hero vivo: com progresso 0, a câmera "respira" (deriva por tempo de
   ±0.3 unidades e ±0.5° em ciclo de 12 s, somada ao rig). Desligado com
   reduced motion.
9. Legibilidade: atrás do texto do hero, um degradê navy (60% → 0, do
   lado do texto) em HTML. Confira o contraste do h1 sobre o céu mais
   claro no screenshot.
10. Mantenha os placeholders dos outros capítulos.
11. e2e: screenshots em /?p=0, 0.3, 0.5, 0.7 e 1 (desktop e mobile)
    salvos em e2e/__screenshots__/journey/ para eu revisar a direção de
    arte. Sem erros de console.

Pronto quando: lint, typecheck, test e e2e passam e, com ?debug,
arrastando de 0 a 1, a luz vai de pôr do sol a noite sem saltos.
Commit: "feat: céu, mar e iluminação da jornada"
````

## Prompt 09b — Correções da revisão de arte do Prompt 09

````text
Leia o CLAUDE.md. Use as skills animation-performance e
frontend-design:frontend-design.

Revisão dos screenshots de e2e/__screenshots__/journey/. A direção
(pôr do sol sobre o mar) está certa. Corrija:

1. Fonte condensed sem eixo variável (risco no iPhone): no WebKit as
   letras do h1 saem sobrepostas porque o font-stretch do eixo wdth não é
   aplicado. Baixe o zip oficial do Archivo
   (https://github.com/google/fonts/tree/main/ofl/archivo, arquivos
   estáticos, ou o "Download family" do Google Fonts), pegue
   Archivo_Condensed-Bold.ttf e Archivo_Condensed-ExtraBold.ttf
   (subset latin, convertidos para woff2) e carregue com next/font/local
   como --font-condensed. A utilidade .font-condensed passa a usar essa
   família (sem font-stretch). Mantenha o Archivo variável do Google para
   o resto do texto. O teste e2e de largura continua passando, e um
   screenshot do WebKit em mobile mostra as letras sem sobreposição.
   Registre a licença OFL em assets-src/LICENSES.md.
2. A cena é a estrela, não o h1: o título ocupa demais o quadro.
   Reduza o h1 do hero para clamp(2.5rem, 6.2vw, 6.5rem), com no máximo
   2 linhas no desktop, e max-width 14ch. O texto fica no terço inferior
   esquerdo e o terço superior direito fica livre para o sol e o navio.
3. Header no mobile: abaixo de 768px, o CTA "Solicitar cotação" do
   header some (o hero já tem um). Ficam o logo e o botão de menu.
4. HDRI fora do orçamento (1,1 MB): apague public/3d/hdri/ e gere o
   environment a partir do próprio Sky (Environment do drei com
   frames={1}, resolution 256, contendo o Sky; refaça só quando o
   progresso mudar mais de 0.02). Zero bytes e os reflexos passam a
   acompanhar a cor do céu de cada capítulo. Atualize LICENSES.md.
5. Borda do chão visível no horizonte (screenshot p=0.5: linha curva
   marcando o fim do plano): o chão precisa ir além do alcance da névoa,
   ou os shaders do chão e do mar precisam misturar com a cor do
   horizonte por distância. Não pode haver linha de horizonte além da
   natural céu/mar.
6. Sol: o disco está estourado em branco e com borda dura. Disco menor,
   cor sunset clara (não branca), borda suave e halo maior e mais tênue.
7. Mar: reduza para ~25 mil triângulos (grade com mais densidade perto
   da câmera e menos no fundo, ou plano que acompanha a câmera em x/z)
   sem perder as ondas visíveis no primeiro plano.
8. Atualize os screenshots de e2e/__screenshots__/journey/.

Pronto quando: lint, typecheck, test e e2e passam e o total de
public/3d/ fica abaixo de 300 KB.
Commit: "fix: revisão de arte do céu, mar e hero"
````

## Prompt 10 — Containers, portêiner e terminal (procedurais)

````text
Leia o CLAUDE.md e o spec, seções 3 e 6 "Geometria". Estilo
"miniatura cinematográfica": formas limpas, cantos levemente
chanfrados, sem fotorrealismo.

1. src/three/models/containerGeometry.ts: geometria de container ISO
   20' e 40' com corrugação nas laterais (via geometria, não textura),
   portas com barras e cantoneiras. Uma única BufferGeometry por tipo,
   memoizada.
2. src/three/scene/ContainerStacks.tsx: InstancedMesh para todas as
   pilhas do porto e do terminal (até 400 instâncias), com cores por
   instância de uma paleta de cores reais de armadores, dessaturadas
   (sem logos de terceiros). Containers da APG em navy com faixa
   vermelha.
3. src/three/scene/Crane.tsx: portêiner (ship-to-shore) procedural,
   com pernas, viga, lança, cabine do trolley e spreader com cabos (linhas
   que esticam). Animação no capítulo 'crane': o trolley vai sobre o
   navio, o spreader desce e trava (pequeno "clack": escala 1.0→0.98→1.0
   em 120 ms). No capítulo 'load': o container sobe, cruza e desce até
   o ponto exato da carreta (exporte TRUCK_LOAD_POINT de
   src/three/anchors.ts, que o Prompt 11 vai consumir).
4. src/three/scene/Terminal.tsx: pátio CONE com piso de concreto
   procedural (ruído no shader, 0 bytes de textura), faixas pintadas,
   pilhas (via ContainerStacks), galpão com 46 docas (portas
   instanciadas), postes com luz que acendem na noite (emissive ligado
   ao progresso) e reach stackers simplificados.
5. Somando tudo, até 120 mil triângulos (use renderer.info no ?debug
   para conferir e mostre o número no painel de debug).
6. Teste unitário: containerGeometry tem as dimensões de 20' e 40'
   proporcionais (6.06 x 2.44 x 2.59 e 12.19 x 2.44 x 2.59, em unidades
   da cena).

7. Regras herdadas do Prompt 09b:
   - todo material novo usa withSkyFog (src/three/scene/skyShared.ts),
     senão aparece a emenda de névoa no horizonte;
   - substitua as caixas provisórias dos capítulos crane, load e terminal
     pelos modelos novos (as do hero e da highway ficam para os Prompts 11
     e 12).
8. Rebake do environment: hoje ele refaz a cada 0.02 de progresso, o que
   dá cerca de 50 travadas ao longo do scroll num celular. Passe a refazer
   só quando o scroll parar por 200 ms e o progresso tiver mudado 0.05 ou
   mais. Mostre o tempo do último bake (ms) no painel do ?debug.
9. Screenshots atualizados em e2e/__screenshots__/journey/, incluindo
   /?p=0.15 (spreader travando) e /?p=0.3 (container no ar).

Pronto quando: lint, typecheck, test e e2e passam e os capítulos 1, 2 e
4 estão visualmente completos com ?debug.
Commit: "feat: containers, portêiner e terminal"
````

## Prompt 10b — Revisão de arte do porto e do terminal

````text
Leia o CLAUDE.md. Use as skills animation-performance e
frontend-design:frontend-design.

Revisão dos screenshots de e2e/__screenshots__/journey/ (p=0.15, 0.3,
0.7). A geometria está boa (corrugação, cabos, pilhas). O problema é de
luz e cor: tudo virou um único tom roxo e marrom, sem contraste de
valor. Uma "miniatura cinematográfica" precisa de cores que leiam e de
luz que desenhe a forma.

1. Paleta dos containers: troque as cores dessaturadas por 8 tons
   distintos, foscos mas legíveis: #9C3B2E (ferrugem), #2E5E8C (azul
   oceano), #2F7A78 (petróleo), #C08A2E (ocre), #3F6B45 (verde),
   #8A8F96 (cinza), #D9D6CF (branco gelo), #6E2A35 (vinho). Distribuição
   pseudoaleatória com seed fixa, sem dois vizinhos iguais na mesma
   pilha. APG: #1A2350 com faixa #E31E24 nas laterais, sempre visível
   nas pilhas do primeiro plano e no container que o portêiner pega.
2. Valor e forma: no pôr do sol, as faces voltadas para o sol recebem
   luz quente forte e as faces opostas ficam frias (hemisphere azulado).
   Ajuste lightKeys para que, em p=0.15 e 0.3, haja pelo menos 3 níveis
   de valor visíveis (luz, meio-tom, sombra). Rim light quente no
   contorno do portêiner contra o céu.
3. Silhueta do portêiner (ship-to-shore): hoje lê como um andaime
   genérico. Proporções reais em metros: pernas de 30 m de vão, viga
   principal a 45 m de altura, lança de 55 m projetada sobre a água
   (passando por cima do navio), backreach de 20 m sobre o cais,
   A-frame no topo a ~70 m com tirantes (forestays) até a ponta da lança.
   Cor cinza-claro #C9CCD1 com detalhes sand, e luzes de navegação
   vermelhas no topo do A-frame (emissive).
4. Noite no terminal (p=0.7 e 0.8): hoje o chão está mais claro que os
   containers (valor invertido) e os postes não iluminam nada.
   - Chão do pátio mais escuro à noite (~#2E2F36).
   - Poças de luz de vapor de sódio: quads aditivos instanciados no chão
     sob cada poste (cor #FFB46B, falloff radial suave), cabeça dos
     postes emissive e um leve tom quente nas faces dos containers
     próximos (light probe barato ou ajuste no shader por distância ao
     poste mais próximo; sem centenas de PointLights).
   - É a imagem "pátio à noite com luzes acesas" do spec: tem que ser
     bonita sozinha.
5. Orçamento: o limite total da cena é 200 mil triângulos. Os frames do
   porto podem chegar a 140 mil neste prompt, deixando 60 mil para o
   navio e a carreta do Prompt 11. Se passar, tire a sombra das pilhas
   distantes antes de cortar detalhe do primeiro plano.
6. Atualize os screenshots (inclua p=0.15, 0.3, 0.7 e 0.8).

Pronto quando: lint, typecheck, test e e2e passam e os 4 screenshots
mostram cor distinta nos containers e poças de luz no terminal à noite.
Commit: "fix: revisão de arte do porto e do terminal"
````

## Prompt 11 — Navio e carreta APG (procedurais)

````text
Leia o CLAUDE.md e o spec, seção 3. Estilo "miniatura cinematográfica",
coerente com o portêiner e os containers, que já são procedurais.
Escala: 1 unidade = 1 m. Todo material usa withSkyFog.

Decisão: os dois modelos são feitos em código, não em GLB. Assim ficam
no mesmo estilo do resto da cena e não dependem de asset externo. Se no
futuro existir public/3d/models/ship.glb ou truck-cab.glb, carregue-o no
lugar do procedural (useGLTF + ErrorBoundary voltando ao procedural),
mas não crie nem baixe GLB agora.

1. src/three/models/shipGeometry.ts + src/three/scene/Ship.tsx:
   navio porta-containers de cabotagem (feeder), 140 m x 22 m.
   - Casco: seções transversais interpoladas ao longo do comprimento
     (proa com flare e bulbo, popa com espelho), em uma BufferGeometry.
     Costado #1B1E2B, faixa vermelha #7A1F1F abaixo da linha d'água,
     linha d'água branca fina.
   - Superestrutura na popa: bloco de 5 conveses com janelas (faixas
     emissive à noite), passadiço com asas, mastro, chaminé.
   - Convés com porões e pilhas de containers via ContainerStacks (3 a 4
     de altura), incluindo o container APG que o portêiner pega
     (posição em src/three/anchors.ts como SHIP_PICK_POINT, usado pelo
     Crane).
   - Hero: entra devagar, guiado por tempo (desliza 30 m em 12 s e
     para), com balanço leve em z (±0.6°). No 'crane', atracado no cais,
     sob a lança.
   - Rastro: faixa de espuma em shader atrás do casco, ligada à
     velocidade; some quando atraca.
   - Até 35 mil triângulos.
2. src/three/models/truckGeometry.ts + src/three/scene/Truck.tsx:
   cavalo mecânico cara-chata 6x2 (estilo europeu, sem marca) +
   carreta porta-container 40' esqueleto.
   - Cabine: caixa com chanfros, para-brisa em vidro escuro com reflexo
     do environment, grade, para-choque, faróis, retrovisores, quebra-sol,
     saias laterais, tanques. Pintura branca #EDEBE6 com faixa navy
     #1A2350 e a seta vermelha #E31E24 do logo correndo na lateral.
   - Logo APG como Decal do drei nas portas (rasterize
     public/brand/logo.svg para public/3d/textures/apg-decal.webp,
     1024px, transparente).
   - Rodas instanciadas (pneus 22.5", aro cinza), quinta roda, chassi da
     carreta com longarinas, twist locks nos cantos.
   - O container APG do Crane assenta exatamente em TRUCK_LOAD_POINT no
     fim do 'load' (os twist locks alinham com as cantoneiras).
   - Faróis: a partir de 0.45, spotlights + cone volumétrico falso
     (cone com material aditivo e falloff), luz de posição âmbar.
   - Até 20 mil triângulos.
3. Remova os stand-ins "shortcut:" do Prompt 10 (casco sob o porão e
   prancha sob TRUCK_LOAD_POINT) e as caixas provisórias do hero.
4. Teste unitário: dimensões do casco (140 x 22, calado entre 7 e 9) e
   da carreta (comprimento útil ≥ 12.19 para o 40').
5. Teste de alinhamento: o container no fim do 'load' fica a menos de
   2 cm de TRUCK_LOAD_POINT.
6. Screenshots: p=0 (navio no hero), 0.15, 0.3, 0.4 (container na
   carreta) e 0.45 (faróis acendendo).

7. Header durante a jornada: hoje ele vira uma barra navy sólida assim
   que o scroll passa de 80px, o que corta o quadro do 3D (veja p=0.15).
   Enquanto #journey estiver na tela, o header fica transparente, com um
   degradê navy muito sutil só atrás dele (40% → 0, 120px) para o logo e
   o menu continuarem legíveis. Ele só fica sólido depois que #journey
   sai da tela. Teste e2e: em /?p=0.3 o header não tem fundo sólido.

Pronto quando: lint, typecheck, test e e2e passam, total abaixo de 200
mil triângulos em todos os frames, e o hero mostra o navio entrando ao
pôr do sol.
Commit: "feat: navio e carreta APG procedurais"
````

## Prompt 12 — Estrada, distribuição e linha do trajeto

````text
Leia o CLAUDE.md e o spec, seção 3 (capítulos 3, 5 e assinatura).

1. src/three/scene/Highway.tsx: trecho da BR-101 com asfalto procedural
   (ruído no shader, como o concreto; 0 bytes de textura), faixas pintadas, guard
   rail instanciado, postes instanciados com luz e vegetação baixa
   estilizada (instanced cones/esferas). Ilusão de movimento: a estrada
   rola em loop (offset de UV e reposicionamento das instâncias) enquanto
   a câmera faz travelling lateral no capítulo 'highway'. Placa verde
   "BR-101 · SUAPE" em estilo DNIT, com texto via Text do drei usando a
   fonte Archivo.
2. src/three/scene/Distribution.tsx: capítulo 'distribution'. A câmera
   entra no galpão, depois abre para um mapa estilizado de PE e BA no
   chão (extrude do SVG de public/images/map/nordeste.svg, com
   SVGLoader). 24 vans/caminhões pequenos (instanced, procedurais) saem
   em leque por curvas até pontos nos dois estados.
3. src/three/scene/RouteLine.tsx: linha vermelha (red-500) contínua
   desenhada no chão do porto até o mapa final, com uma CatmullRomCurve3
   própria. Usa Line2/MeshLine do drei, de espessura constante, e é
   revelada por progresso global (dashOffset). Leve glow no tier high
   (emissive + bloom no Prompt 15).
4. Transição de saída: de 0.95 a 1 a cena escurece para navy-900
   (overlay HTML com opacity ligada ao progresso), encaixando
   perfeitamente com a seção Services.
5. Mostre o total de triângulos no ?debug e confirme que está abaixo de
   200 mil.

6. Regras herdadas: todo material novo usa withSkyFog; respeite as
   novas SCENE_POSITIONS (porto em z −110, o resto deslocado junto).
7. Refino da carreta APG (ela é a estrela do capítulo 'highway', em
   close): hoje a cabine lê como uma caixa e o para-brisa é um buraco
   preto.
   - Cabine com cantos arredondados (bevel maior), defletor de teto,
     para-lamas arqueados sobre as rodas, degraus, para-sol escuro.
   - Para-brisa e janelas: vidro com reflexo do céu (environment +
     fresnel) e um leve interior visível (painel, volante em silhueta),
     nunca preto chapado.
   - Faixa navy e seta vermelha mais largas e legíveis na lateral, e
     o logo APG (Decal) visível no plano lateral do travelling.
   - Faróis com glow e luz de posição âmbar acesos à noite.
   Continue até 20 mil triângulos.
8. Screenshots: p=0.45, 0.5, 0.55 (travelling na estrada), 0.85, 0.9 e
   0.97 (mapa e saída para navy).

Pronto quando: lint, typecheck, test e e2e passam e a jornada de 0 a 1
está completa e contínua.
Commit: "feat: estrada, distribuição e linha do trajeto"
````

> **Revisão 2026-10-28:** a jornada deixou de ser um mundo contínuo (céu, mar, névoa) e virou uma sequência de **palcos de estúdio e vistas de cima**. Leia a seção 3 do spec e `docs/reference-analysis.md`. Os Prompts 13 a 13c abaixo substituem o antigo Prompt 13. Os modelos dos Prompts 10 a 12 (containers, portêiner, navio, carreta, mapa, RouteLine) são reaproveitados.

## Prompt 13 — Arquitetura de palcos, luz de estúdio e hero do mapa

````text
Leia o CLAUDE.md, o spec (seção 3 revisada em 2026-10-28 e seção 6
"Cena 3D") e docs/reference-analysis.md. Use as skills
animation-performance, frontend-design:frontend-design e
superpowers:test-driven-development.

Mudança de direção: nada de céu, mar, horizonte ou névoa. Cada capítulo
é um palco isolado, com fundo de cor sólida da paleta, luz de estúdio e
câmera própria. Objetos impecáveis, não cenário.

1. Remover o mundo: apague Sky, Ocean, a névoa (skyFog/withSkyFog e
   FogExp2), o bake de environment do céu, lightKeys e o degradê do hero
   que existia por causa do céu. Remova os testes correspondentes. Os
   materiais voltam a ser MeshStandard/MeshPhysical normais.
2. src/three/stages/: um componente por palco (HeroMapStage,
   CraneStage, LoadStage, HighwayStage, TerminalStage,
   DistributionStage). Cada um exporta o grupo da cena e suas chaves de
   câmera (position, target, fov) para início, meio e fim do capítulo.
   src/three/stages/index.ts monta a tabela STAGES por ChapterId.
   Neste prompt, os palcos 1 a 5 só posicionam os modelos já existentes;
   o acabamento vem nos Prompts 13b e 13c. Cada palco fica na sua
   própria origem (afastados 1 km entre si), para que os dois palcos
   visíveis numa transição nunca se sobreponham. Remova SCENE_POSITIONS
   e o layout de mundo contínuo (porto, pista, BR-101 encadeados): o
   trajeto contínuo da carreta do Prompt 12 vira movimento dentro de cada
   palco. Reaproveite a orientação do mapa (norte para −Z), os dois tons
   de PE e BA e o TTF do Archivo para textos 3D (rótulos do mapa).
3. Render seletivo: só o palco atual e o vizinho (durante a transição)
   ficam com visible=true. Teste unitário: activeStages(t) retorna 1 ou
   2 ids, nunca mais.
4. Câmera: CameraRig passa a interpolar entre as chaves do palco atual
   e, nas transições, do palco atual para o próximo. Remova
   camera-path.ts e o spline global (e os testes). Sem paradas bruscas:
   a velocidade não zera na fronteira (teste numérico).
5. Fundo: stageBackground(t) em src/three/stages/background.ts
   interpola a cor de fundo (scene.background e a cor do HTML por trás do
   canvas): navy-900 no hero, sand-50 de 0.05 a 0.4, navy-900 de 0.42 a
   0.6, sand-50 de 0.62 a 0.9, navy-900 em 1. Transições de 0.02 a 0.05
   de progresso. Teste de continuidade.
6. Luz de estúdio (src/three/studio/Studio.tsx):
   - scene.environment = RoomEnvironment (PMREM, 0 bytes);
   - luz principal suave a 45° (sombras), preenchimento frio fraco,
     recorte (rim) atrás;
   - sombra de contato: AccumulativeShadows do drei (RandomizedLight)
     nos palcos de estúdio, ou ContactShadows quando o palco se move;
   - toneMapping ACES ou AgX (escolha o que der melhor contraste nos
     containers e diga qual escolheu).
7. Pós-processamento (@react-three/postprocessing): N8AO (oclusão de
   ambiente), SMAA, Bloom leve (só emissive acima de 1), Noise (grão de
   2–3%) e Vignette sutil. Tudo num EffectComposer.
8. HeroMapStage (palco 0, fundo navy):
   - malha do Nordeste (public/images/map/nordeste.svg) em 3D inclinado
     (~35°): contornos dos estados em linhas finas sand-50 a 35% e
     interior em grade de pontos;
   - 5 rotas de cabotagem vindas do mar (curvas 3D em arco) convergindo
     em Suape, desenhadas como linhas red-500 com brilho que percorre a
     rota em loop (por tempo);
   - Suape: ponto que pulsa (anel que expande e some, a cada 2,4 s);
   - rótulos mono pequenos: "SUAPE · PE" e "SALVADOR · BA";
   - órbita lenta da câmera guiada por tempo (±6° em 20 s), parada com
     reduced motion;
   - o texto do hero continua à esquerda e o mapa ocupa a metade direita.
9. Transição hero → crane (0 a 0.05): a câmera mergulha em direção a
   Suape enquanto o fundo vai de navy para sand e o CraneStage aparece.
10. Screenshots de e2e/__screenshots__/journey/ em p = 0, 0.03, 0.1,
    0.3, 0.5, 0.7, 0.9 e 1 (desktop e mobile).

Pronto quando: lint, typecheck, test e e2e passam, não sobra referência a
Sky/Ocean/skyFog no código, e o hero mostra o mapa com as rotas
chegando em Suape sobre navy.
Commit: "feat: jornada em palcos, luz de estúdio e hero do mapa"
````

## Prompt 13e — Loading e abertura do hero

````text
Leia o CLAUDE.md e o spec, seção 5 "Loading e abertura do hero
(revisão 2026-10-28)". As tabelas de lá são a especificação exata
(tempos, textos, faixas). Use as skills animate, emil-design-eng e
animation-performance.

Ideia central: o loading e a entrada do hero são uma coreografia só.
As setas do logo que carregam a página viram as rotas vermelhas que
chegam em Suape no mapa do hero.

1. src/components/intro/IntroTimeline.ts: uma timeline GSAP única que
   orquestra o loader e a entrada do hero, com os tempos da tabela do
   spec, exposta como playIntro({ short: boolean }). Os elementos se
   registram por data-intro="<nome>". Nenhum componente anima a própria
   entrada por conta própria no hero.
2. src/components/intro/Loader.tsx (client, só na primeira visita da
   sessão, sessionStorage com try/catch):
   - fundo navy-900 com grão fino;
   - as 3 setas de public/brand/arrow.svg em traço red-500, desenhadas
     por stroke-dashoffset na proporção do carregamento real;
   - contador mono 000 → 100 (tabular) e a linha de status por faixa;
   - coordenada "SUAPE · PE · 08°23′S 34°57′W" no canto inferior;
   - progresso real = média ponderada de document.fonts.ready (20%),
     useProgress do drei (60%) e o primeiro frame renderizado do canvas
     (20%); o contador nunca anda para trás;
   - mínimo 1,2 s e máximo 4 s; na saída, as setas disparam para a
     direita (450 ms, ease-in) e a cortina some.
   aria-hidden, sem bloquear o paint do h1.
3. Ponte loader → mapa: no momento da saída, o HeroMapStage começa o
   desenho das rotas a partir do lado do mar, para parecer que o traço
   das setas continuou dentro do mapa.
4. Entrada do HeroMapStage: contornos se desenhando (900 ms), grade
   de pontos em onda radial a partir de Suape, 5 rotas escalonadas
   (1.200 ms), pulso de Suape quando a primeira rota chega. Exponha
   isso como uma função intro(t) do palco, chamada pela timeline.
5. Hero HTML:
   - ContainerCode com efeito de digitação (400 ms);
   - h1 com RevealText controlado pela timeline (prop `manual`), 700 ms
     por linha, 90 ms entre linhas;
   - subtítulo, CTA e o link secundário "Ver a operação ↓"
     (lenis.scrollTo até o início do capítulo 1);
   - header descendo do topo;
   - faixa inferior com "Role para descobrir", relógio ao vivo
     "SUAPE 19:42" (Intl.DateTimeFormat com timeZone America/Recife,
     atualizado a cada minuto, sem hydration mismatch: renderize só no
     client) e o ticker mono com os números de site.ts (marquee lento,
     pausa no hover e em reduced motion).
6. Interação: parallax do mapa com o mouse (±2°, damping), só com
   pointer fino; hover em Suape mostra "Terminal CONE · Cabo de Santo
   Agostinho" (raycast no ponto ou hit area HTML posicionada pela
   projeção do ponto).
7. Visitas seguintes na sessão: sem loader e playIntro({ short: true }),
   a mesma sequência em 600 ms.
8. Reduced motion: sem loader (fade de 200 ms) e o hero aparece
   completo, sem coreografia.
9. Preload: os assets do primeiro palco têm prioridade; os demais
   palcos são criados depois do LCP (requestIdleCallback).
10. Testes:
   - unit: a função de progresso do loader é monotônica e chega a 100;
   - e2e: primeira visita mostra o loader e termina em menos de 4 s;
     segunda visita na sessão não mostra; com reduced motion não há
     loader; o h1 está no DOM desde o primeiro HTML;
   - grave um vídeo (Playwright video) da primeira visita em desktop e
     mobile em e2e/__videos__/intro-*.webm para revisão.

11. Correções do hero vistas nos screenshots do Prompt 13:
   - Inclinação: o mapa está quase de cima; aplique a inclinação de ~35°
     de verdade (câmera mais baixa), para dar profundidade.
   - Área segura: o mapa invade o h1 ("1996" sobre a Bahia). Defina a
     coluna do texto como área proibida e ajuste escala e posição do
     mapa para que a projeção dele nunca cruze o bounding box do bloco de
     texto em 1440x900 e 1920x1080 (teste e2e).
   - As rotas não podem sair cortadas pela borda direita: elas nascem
     dentro do quadro, no mar, a leste de Suape.
   - Pontos do mapa redondos (discard por distância no fragment shader),
     não quadrados, inclusive no mergulho.
   - Rótulos "SUAPE · PE" e "SALVADOR · BA": tamanho fixo em pixels (HTML
     posicionado pela projeção, ou sizeAttenuation=false) e fade out no
     começo do mergulho.
   - Mobile: o mapa ocupa a metade de cima da tela (Suape visível, rotas
     inteiras) e o texto fica na metade de baixo, sem sobreposição; h1
     mobile em clamp(2.25rem, 10vw, 3rem). Hoje sobram 40% de tela vazia
     no topo e o mapa fica atrás do texto.
   - Header legível em qualquer palco: logo e menu trocam de cor com o
     fundo (branco sobre navy, navy-900 sobre sand), em 200 ms, usando
     stageBackground. O CTA vermelho continua igual.

Pronto quando: lint, typecheck, test e e2e passam, o vídeo mostra a
sequência da tabela do spec sem engasgos e o Lighthouse mobile mantém
LCP < 2,5 s.
Commit: "feat: loading e abertura do hero"
````

> **Revisão 2026-10-30 — caminho A, "planta técnica":** a jornada inteira passa para a linguagem gráfica do hero (desenho técnico 3D animado). Os Prompts 13f, 13b e 13c abaixo substituem as versões de estúdio/PBR. Leia a seção 3 do spec ("Estilo: planta técnica") e a seção 6 ("Render de planta técnica").

## Prompt 13f — Motor de desenho técnico e correções de câmera

````text
Leia o CLAUDE.md e o spec: seção 3 (tabela da jornada e "Estilo:
planta técnica") e seção 6 ("Render de planta técnica"). Use as skills
animation-performance, frontend-design:frontend-design e
superpowers:test-driven-development.

Mudança de direção: nada de PBR, estúdio, sombras ou AO. A jornada
inteira vira desenho técnico 3D animado, na mesma linguagem do mapa do
hero (que é a parte mais forte do site hoje).

1. Remover o estúdio: apague RoomEnvironment, ContactShadows,
   AccumulativeShadows, N8AO, luzes direcionais e os materiais PBR dos
   palcos 1 a 5. Mantenha só SMAA, Bloom (só no red-500) e Noise (grão
   fino). Remova os testes correspondentes.
2. src/three/blueprint/theme.ts: dois temas, pela cor de fundo do palco
   (stageBackground):
   - dark (navy-900): traço sand-50 a 75%, traço secundário 35%,
     preenchimento navy um tom acima (#121C47), acento red-500;
   - light (sand-50): traço navy-900 a 85%, secundário 35%,
     preenchimento #FBF9F5, acento red-500.
   A troca de tema acompanha a transição de fundo (interpolação, sem
   salto). Teste de continuidade.
3. src/three/blueprint/BlueprintMesh.tsx: recebe uma geometry e
   desenha:
   - preenchimento sem luz (MeshBasicMaterial ou shader) com 2 tons por
     orientação da normal (faces de cima um pouco mais claras), para ler
     volume sem sombra;
   - arestas: EdgesGeometry (threshold 20°) em LineSegments2
     (LineMaterial, espessura constante em px: 1.25 principal, 0.75
     secundária), sem z-fighting com o preenchimento (polygonOffset);
   - prop `reveal` (0–1): as arestas se desenham (dashOffset por
     comprimento acumulado) e o preenchimento entra depois (opacity de
     0.6 a 1 do reveal). Teste unitário do cálculo de comprimento
     acumulado.
4. src/three/blueprint/Dimension.tsx: cota técnica reutilizável (linha
   de cota com traços de extremidade, linhas de chamada e texto mono
   centralizado, sempre legível em tamanho de tela, via Html do drei ou
   Text com sizeAttenuation compensada). Props: from, to, label, offset,
   reveal. Entra com draw-on.
5. src/three/blueprint/Grid.tsx: grade técnica de fundo muito sutil (5%
   do traço), linhas a cada 10 m e reforço a cada 50 m, que desliza
   levemente com a câmera.
6. Aplique o BlueprintMesh a todos os modelos existentes (containers,
   portêiner, navio, carreta, terminal, estrada). Containers comuns:
   só traço + preenchimento de tema. O container APG é o único objeto
   sólido: navy #1A2350 com faixa red-500, sem traço claro.
   Simplifique a geometria onde o traço ficar "sujo" (diagonais de
   triângulos aparecendo, bevels gerando ruído): o traço tem que ler como
   desenho de engenharia limpo.
7. Correções de bugs vistos no vídeo do usuário:
   - Mergulho do hero: os pontos do mapa viravam quadrados gigantes e a
     tela ficava "toda branca". Os pontos e os contornos do mapa fazem
     fade out antes de a câmera chegar perto (0.01 a 0.03), e o CraneStage
     começa a se construir (reveal) a partir de 0.03.
   - Câmera da estrada: em parte do capítulo 3 ela passava por baixo da
     pista e do guard rail. Revise as chaves: a câmera fica sempre acima
     da pista e nenhum objeto cruza o near plane (teste numérico que
     verifica a altura da câmera em todo o capítulo).
   - Remova árvores, arbustos e grama da estrada.
8. Screenshots em p = 0, 0.02, 0.05, 0.15, 0.3, 0.5, 0.7, 0.9 (desktop
   e mobile) e um vídeo do scroll completo em e2e/__videos__/.

Pronto quando: lint, typecheck, test e e2e passam, não sobra material
PBR nem sombra nos palcos, e os screenshots leem como desenho técnico
limpo (traço contínuo, sem ruído de triângulos).
Commit: "feat: motor de desenho técnico e correções de câmera"
````

## Prompts 13b, 13c e 13d — (substituídos)

> Substituídos pelos Prompts J1 a J4 (jornada por imagens). Não rode.

> **Revisão 2026-10-30 — jornada por imagens fotorrealistas.** Os Prompts J1 a J4 abaixo substituem os Prompts 13b, 13c e 13d (planta técnica), que não devem ser rodados. Leia a seção 3 do spec e a seção "Cenas da jornada". A referência de execução é `/dev/prova` (`src/components/proof/TruckPass.tsx`), aprovada pelo usuário.

## Prompt J1 — Fundação das cenas e cena 1 (Chegada)

````text
Leia o CLAUDE.md, o spec (seção 3 revisada em 2026-10-30 e "Cenas da
jornada") e src/components/proof/TruckPass.tsx (a prova aprovada: é o
padrão de qualidade e de técnica). Use as skills animate,
animation-performance e superpowers:test-driven-development.

Mudança de direção: a jornada deixa de ser 3D. Cada cena é uma seção com
palco sticky e fotos fotorrealistas recortadas, movidas pelo scroll.
O 3D fica só no hero (mapa) e, no J4, na distribuição.

1. Remover o 3D dos capítulos 1 a 5: apague CraneStage, LoadStage,
   HighwayStage, TerminalStage, PortSet, src/three/blueprint/,
   src/three/models/ e src/three/scene/ que só eles usam, o CameraRig de
   palcos, stageBackground e os testes correspondentes. Mantenha o
   HeroMapStage e o DistributionStage (este volta no J4). O canvas da
   jornada passa a existir só dentro do hero.
2. Pipeline de imagens: scripts/build-journey-images.mjs (sharp) lê
   assets-src/ai/ e public/images/journey/ (recortes já prontos) e gera
   em public/images/journey/ cada imagem em WebP e AVIF nas larguras 800,
   1200 e original, com nomes <nome>-<largura>.<ext>. npm script
   "images". Componente src/components/journey/SceneImage.tsx: <picture>
   com srcset/sizes, width/height explícitos (sem CLS), decoding="async".
   As carretas lado/vazia usam a mesma caixa de pixels (são alinhadas a
   1 px).
3. src/components/journey/Scene.tsx: base reutilizável. Props: id,
   heightVh (altura de scroll), background, children. Cria a seção, o
   palco sticky de 100svh e um ScrollTrigger (scrub) que entrega
   progress 0–1 por callback (onProgress) sem re-render do React. Expõe
   o helper segment(p, start, end, ease) para "entra → segura → sai".
   Teste unitário do segment.
4. src/components/journey/OceanArrival.tsx (cena 1, 260vh):
   - fundo: public/images/journey/oceano-cima (tela cheia, object-fit
     cover), com deriva lenta (background-position ou translate) e
     escala 1.08 → 1 ao longo da cena;
   - navio (navio-cima, recortado) entra por baixo e sobe até o terço
     superior, com um leve balanço (rotate ±0.6°); a altura do navio é
     ~80vh no desktop e ~70vh no mobile;
   - espuma: canvas 2D atrás do navio com partículas brancas suaves
     (blur), mais densas na proa (onda de proa em V) e formando o rastro
     na popa, que se alonga com a velocidade (derivada do progresso);
     sem parecer "neve": partículas pequenas, opacidade baixa, somem
     devagar;
   - linha vermelha tracejada (SVG) à frente da proa até o topo, com o
     rótulo mono "SUAPE · PE" no fim;
   - texto: ContainerCode "APGU 1996-02 · CHEGADA" + "1.900 TEUs por
     mês" com Counter, à esquerda, entrando quando o navio estabiliza;
   - reduced motion: navio parado no centro, sem espuma animada.
5. Transição hero → cena 1: no fim do hero, o mapa mergulha em Suape e
   faz fade para o azul do oceano; a cena 1 começa já com o oceano na
   tela (sem faixa branca entre as duas).
6. Monte a Home: Hero → OceanArrival → (placeholders das cenas 2 a 6
   com altura e fundo certos, só um texto) → Services. Remova o
   indicador lateral de capítulos antigo se ele depender dos palcos.
7. Header: logo e menu brancos sobre o hero e o oceano; navy sobre as
   cenas claras. Use um atributo data-header-theme em cada cena e um
   IntersectionObserver no header.
8. Testes: e2e verifica que a cena 1 renderiza o navio e o oceano, que
   não há erros de console e que o canvas 3D não existe fora do hero;
   screenshots em e2e/__screenshots__/journey/ de 5 pontos da cena 1
   (desktop e mobile). Grave o vídeo do scroll (fora do git).

Pronto quando: lint, typecheck, test e e2e passam e a cena 1 parece um
plano de drone real do navio chegando a Suape.
Commit: "feat: cenas da jornada por imagens e cena 1 (chegada)"
````

## Prompt J1b — Cena 1 por zoom de câmera e ordem da Home

> Revisão 2026-10-30b, depois do J1 (`0aa66ce`). O navio e a espuma animados separadamente não pareceram reais. Foto aprovada: `assets-src/ai/navio-mar.webp`, 6688×3764 (upscale 4× no Upscayl; o PNG de 30 MB fica fora do git em `assets-src/reference/`).

````text
Leia o CLAUDE.md, o spec (seção 3, linha da cena 1, e seção 4 "Ordem da
Home", ambas revisadas em 2026-10-30b) e
src/components/journey/OceanArrival.tsx. Use as skills animate,
animation-performance e superpowers:test-driven-development.

Parte A — Cena 1: foto parada, câmera em zoom
O navio animado sobre o oceano, com espuma em canvas, não ficou real.
Agora a cena é UMA foto (assets-src/ai/navio-mar.webp: navio no oceano,
visto de cima, com a espuma e o rastro reais da própria foto). A foto
não se mexe; só a câmera desce, como num drone.

1. Pipeline: inclua navio-mar no npm run images (WebP/AVIF 800, 1200,
   1920 e original de 6688 px). Não recorte: a foto ocupa a tela toda.
   A original só é necessária no close do desktop; no mobile, a 1920
   basta.
2. Meça na foto e registre em src/components/journey/oceanCamera.ts (px
   da imagem original): o centro do navio, a largura do casco e o FOCO:
   o centro do bloco de containers do meio do convés, num ponto com
   containers navy de faixa vermelha. Confira medindo num recorte salvo
   com sharp.
3. OceanArrival (cena 1, 280vh), no lugar do navio, do oceano e da
   espuma:
   - a foto em tela cheia (cover). No começo da cena, o enquadramento é
     largo: a foto inteira, com o navio no centro e o oceano em volta;
   - 0–0.08: segura parado (é a imagem em que o mergulho do hero
     termina);
   - 0.08–0.85: zoom contínuo até o FOCO ficar no centro da tela e o
     convés encher a tela (a largura do casco ≈ 90% da altura da tela no
     desktop, já que o navio está na vertical). Escala exponencial
     (scale = Zmax^t), para a descida ter velocidade constante (zoom
     linear acelera no fim e parece falso). A translação leva o centro
     da tela do centro do navio até o FOCO junto com a escala, sem
     desviar. Tudo num só transform (translate3d + scale) num wrapper,
     escrito no onUpdate, sem re-render;
   - 0.85–1: segura no close do convés (é onde a cena 2 começa: um
     container navy desse bloco é o que o portêiner iça);
   - Zmax: limite para que no fim cada pixel da foto original não seja
     ampliado mais que 1,5× na tela (considere o devicePixelRatio). Se o
     convés não encher a tela com esse limite, pare no limite e registre
     no relatório até onde chegou;
   - nitidez: a camada inicial usa a largura do srcset; uma segunda
     camada com a original carrega quando a cena se aproxima
     (IntersectionObserver com rootMargin) e entra em crossfade antes
     de p=0.3. Sem salto de posição entre as duas;
   - linha vermelha tracejada (SVG em coordenadas da foto, dentro do
     wrapper que dá zoom) saindo à frente da proa até a borda superior,
     com vector-effect="non-scaling-stroke" para o traço continuar fino;
     o rótulo "SUAPE · PE" fica fora do wrapper, preso ao topo da tela,
     e some antes do close;
   - texto à esquerda: código da cena + "1.900 TEUs por mês" (Counter),
     entra quando o navio enche a tela (~0.35) e sai antes de 0.75;
   - mobile: mesma foto e mesma câmera, cover centrado no navio;
   - reduced motion: foto parada no enquadramento do meio (navio
     enchendo a tela), texto visível, sem zoom;
   - zero movimento próprio na foto: nada de deriva, balanço ou
     partículas.
4. Apague o que ficou sem uso: foam.ts, foam.test.ts, Ocean.tsx (se só a
   cena 1 usava), navio-cima e oceano-cima em public/images/journey/ (se
   nenhum lugar usar; o mergulho do hero passa a terminar na foto
   navio-mar no enquadramento largo).
5. Teste unitário de oceanCamera: em p=0.08 a câmera está no
   enquadramento largo; em p=0.85 o FOCO está no centro da tela; a escala
   é exponencial (a razão entre passos iguais de p é constante); Zmax
   respeita o limite de 1,5×.

Parte B — Ordem da Home
6. Home: Hero → cenas 1–6 → Serviços → Por que a APG → Clientes → CTA
   final. Tire Números (Stats) e Mapa de atuação (CoverageMap) da Home;
   se o componente não for usado em nenhuma outra página, apague o
   componente, o teste e o conteúdo em site.ts.
7. Códigos APGU 1996-NN: uma única lista ordenada das seções da Home
   gera os números (01 Hero, 02–07 cenas, 08 Serviços, 09 Por que a APG,
   10 Clientes, 11 CTA). Seção oculta (Clientes sem logos) não consome
   número. Nenhum index escrito à mão nos componentes. Teste unitário:
   sem número repetido e sem buraco, com e sem Clientes.
8. O placeholder do Terminal passa a dizer "35.000 m² · 4.000 TEUs
   estáticos · 46 docas · 5.000 m² cobertos".

Testes e entrega
9. e2e: a cena 1 renderiza a foto, o zoom muda o transform ao rolar, não
   há canvas de espuma, não há erros de console, e os códigos da Home
   aparecem em ordem crescente sem repetição. Screenshots de 5 pontos da
   cena 1 (p = 0, 0.3, 0.5, 0.75, 1) em desktop e mobile, em
   e2e/__screenshots__/journey/. Vídeo do scroll do hero até o fim da
   cena 1 (fora do git).
10. No relatório: Zmax atingido no desktop e no mobile, peso das imagens
    da cena 1 baixadas (desktop e mobile) e se o close final está nítido.

Pronto quando: lint, typecheck, test e e2e passam, a foto não se move
por conta própria, o close final do convés está nítido e os códigos
da Home seguem 01 a 11 sem repetição.
Commit: "feat: cena 1 por zoom de câmera e ordem da Home"
````

## Prompt J1c — Roteiro da cena 1 e correções do hero

> Revisão 2026-10-30c, depois do J1b (`d81f01d`). O zoom ficou real, mas sem roteiro: texto ao lado sem relação com a imagem, duas roladas sem nada mudar e a linha "SUAPE" invisível.

````text
Leia o CLAUDE.md, o spec (seção 3, linha da cena 1, revisada em
2026-10-30c), src/components/journey/OceanArrival.tsx e
src/components/journey/oceanCamera.ts. Use as skills animate,
animation-performance e superpowers:test-driven-development.

Objetivo: o zoom da cena 1 passa a ter um motivo. A câmera desce para
ACHAR O CONTAINER DA APG dentro do navio. Cada texto aponta para algo na
foto, como anotações de desenho técnico. A foto continua parada; só a
câmera se move.

1. Hero: o bloco de textos está abaixo do centro. Centralize na vertical
   pela área visível abaixo do header (não pela tela toda). Confira com
   screenshot em 1440×900, 1920×1080 e 390×844.
2. Sem rolagem morta: hoje o usuário rola duas vezes e nada muda (o
   deslize por cima do hero mais a pausa de 0–0.08). O zoom começa no
   instante em que a foto cobre a tela; tire a pausa inicial e ajuste a
   altura da cena para não sobrar trecho parado. Teste: entre o fim do
   deslize e o close, todo passo de 10vh de scroll muda a escala.
3. Medições em oceanCamera.ts (px da foto original, conferidas em
   recortes salvos com sharp): a ponta da proa; os retângulos de 5 a 8
   containers navy com faixa vermelha espalhados pelo convés; e o
   CONTAINER-ALVO, um navy perto do centro do convés. O FOCO do close
   passa a ser o centro do container-alvo.
4. Anotações, desenhadas em coordenadas de tela (traço fino de 1px que
   não engorda com o zoom) e presas à foto pela câmera: a cada frame,
   converta o ponto da foto para a tela com a mesma matemática do
   transform. Só transform e opacity; nada de re-render.
   a. Começo (navio inteiro): rótulo mono branco "CABOTAGEM · RUMO A
      SUAPE · PE", com uma linha guia fina saindo da ponta da proa até o
      rótulo. Some quando a proa sai da tela.
   b. Meio (convés enche a tela): os containers navy medidos ganham um
      contorno red-500 de 1.5px, um por vez (stagger pelo progresso), e
      uma nota mono "CONTAINERS APG" com linha guia até o primeiro deles.
      Junto entra o contador "1.900 TEUs por mês" (ContainerCode da cena
      + Counter), à esquerda.
   c. Close: os outros contornos somem; o container-alvo fica no centro
      com marcadores de canto vermelhos (4 cantos em L, como mira) e o
      rótulo mono "SEU CONTAINER". O texto do contador sai antes.
   d. Fim: segura o close parado (é onde a cena 2 começa: este container
      é o que o portêiner iça).
5. Remova a linha vermelha tracejada e o rótulo "SUAPE · PE" do header;
   o rumo agora está na anotação (a).
6. Contraste: os rótulos sobre a foto usam fundo navy-900 a 70% com
   padding pequeno (ou sombra de texto forte) e passam AA. No mobile, o
   contador fica embaixo, sobre o fundo translúcido que já existe, sem
   cobrir o container-alvo.
7. Reduced motion: foto parada no meio do zoom, com os contornos, a nota
   e o contador visíveis, sem stagger.
8. Testes: unitário da conversão foto→tela (um ponto medido cai no
   lugar certo em 3 escalas). e2e: as anotações a, b e c ficam visíveis
   cada uma no seu trecho e somem fora dele; não há erros de console.
   Screenshots da cena 1 em p = 0, 0.25, 0.5, 0.75, 1 (desktop e mobile)
   e do hero (3 tamanhos) em e2e/__screenshots__/. Vídeo do hero até o
   close (fora do git).

Pronto quando: lint, typecheck, test e e2e passam, o hero está
centralizado, nenhum trecho do scroll fica sem mudança e, no vídeo, dá
para entender sem ler o código: o navio chega a Suape, mostramos os
containers da APG e a câmera para no container do cliente.
Commit: "feat: roteiro da cena 1 e hero centralizado"
````

## Prompt J2 — Cenas 2 e 3 (Portêiner e Carga)

````text
Leia o CLAUDE.md, o spec (seção 3) e src/components/journey/Scene.tsx.
Use as skills animate e animation-performance.

0. Antes, ajustes da cena 1 (OceanArrival), vistos nos screenshots do
   J1c: no desktop as anotações quase não aparecem.
   - Rótulos ("CABOTAGEM · RUMO A SUAPE · PE", "CONTAINERS APG", "SEU
     CONTAINER"): mono de no mínimo 12px no desktop e 11px no mobile,
     tracking 0.12em, sobre fundo navy-900 a 80% com padding 4px 8px.
   - Contornos dos containers APG: 2px red-500 com um halo escuro
     (sombra/contorno navy-900 a 60% de 2px por fora), para destacar
     sobre a pintura vermelha e navy.
   - Mira do container-alvo: cantos de 3px, cada perna com 28% do lado
     menor do alvo, e uma pulsação lenta de opacidade (0.7↔1, 1.6 s,
     só quando parada no close; sem pulsar em reduced motion).
   - Linhas guia: 1px branco a 85% com o mesmo halo escuro.
   - Mobile do hero: centralize o mapa e o bloco de texto juntos na
     vertical (hoje sobra um vazio embaixo) e garanta que o rótulo
     "SUAPE · PE" do mapa não encoste na borda direita (margem ≥ 16px).
   - Screenshots de conferência: cena 1 em p = 0.05, 0.5 e 1 (desktop e
     mobile) e hero 390×844.

Imagens: porteiner-lado (recortado), carreta-lado-vazia, carreta-lado
(com logo). As duas carretas estão alinhadas a 1 px.

1. Prepare as camadas do portêiner com sharp (script em scripts/):
   - porteiner-base: o portêiner sem o spreader e sem os cabos abaixo do
     carrinho (área do spreader e dos cabos apagada para transparente;
     confira que nenhuma parte da estrutura foi cortada);
   - porteiner-spreader: só o spreader amarelo, recortado da imagem
     original com transparência;
   - container-apg-lado: o container recortado da própria carreta-lado
     (retângulo do container, fundo transparente), para ter exatamente a
     mesma aparência da carreta carregada.
   Meça e registre em src/components/journey/craneAnchors.ts as
   coordenadas (em px da imagem de origem) do ponto de içamento do
   carrinho, do topo do spreader e da largura do spreader.
2. CraneLift.tsx (cena 2, fundo #FEFEFE, 240vh):
   - o portêiner inteiro à direita, ocupando ~85svh de altura;
   - o spreader com o container APG (escalado para a largura do
     spreader) sobe de baixo do quadro até o carrinho e trava, com um
     pequeno "assentamento" (2 px para baixo e volta, 180 ms
     equivalentes de scroll);
   - 4 cabos em SVG do carrinho até o spreader, que encurtam junto;
   - sombra de contato suave no chão sob as pernas;
   - texto à esquerda: ContainerCode + "O braço rodoviário da
     cabotagem no Brasil".
3. Load.tsx (cena 3, fundo #FEFEFE, 220vh), close:
   - carreta-lado-vazia parada, ocupando ~90vw;
   - o container (container-apg-lado, mesma escala da carreta) desce do
     alto com 4 cabos SVG saindo pelo topo do quadro, e alinha
     exatamente sobre o chassi;
   - no encaixe: 4 pontos red-500 aparecem nas travas (twist locks) e a
     imagem troca para a carreta-lado (crossfade de 120 ms equivalentes),
     sem salto de pixel;
   - os cabos sobem e somem.
4. A cena 3 termina com a carreta carregada no mesmo enquadramento em
   que a cena 4 (Estrada) começa, para a passagem ser contínua.
5. Screenshots de 5 pontos de cada cena (desktop e mobile) e vídeo.

Pronto quando: lint, typecheck, test e e2e passam e o encaixe do
container na carreta é perfeito (sem salto na troca de imagem).
Commit: "feat: cenas 2 e 3 (portêiner e carga)"
````

## Prompt J3 — Cenas 4 e 5 (Estrada e Terminal)

````text
Leia o CLAUDE.md, o spec (seção 3), src/components/proof/TruckPass.tsx e
src/components/journey/Scene.tsx. Use as skills animate e
frontend-design:frontend-design.

0. Antes, ajustes das cenas 2 e 3 (vistos nos screenshots do J2):
   a. Cena 2 com câmera: a cena 1 termina no close de um container; a
      cena 2 passa a começar no mesmo tipo de close (o container APG
      preso ao spreader enchendo ~45% da largura da tela) e a câmera
      RECUA enquanto ele sobe, até revelar o portêiner inteiro, como na
      cena 1 (um só transform translate3d + scale num wrapper, escala
      exponencial, a câmera segue o spreader). Hoje o guindaste fica
      pequeno, com muito branco em volta, e a cena parece parada.
      Fonte em alta: assets-src/ai/porteiner-lado.webp, agora 4488×5608
      (upscale 4×; a de 1122 px ficou em assets-src/reference/). No
      spreader há pseudo-letras geradas pela IA: pinte por cima com o
      amarelo vizinho antes do close, para nenhum texto falso aparecer.
      Refaça a partir dela o recorte (scripts/cutout-white.mjs, modo
      --global, limiar 244), as camadas porteiner-base e
      porteiner-spreader e as medidas de craneAnchors.ts (escale as
      coordenadas atuais ×4 e confira em recortes). Mesmo limite de
      ampliação da cena 1 (1,5× por pixel da foto, com devicePixelRatio).
   b. Faixa cinza no topo: no desktop, em p ≥ 0.75 da cena 2, aparece um
      degradê cinza atrás do header; no mobile, em p=0 da cena 2, aparece
      uma faixa colorida da cena anterior no topo. Ache a causa (fundo do
      header na fronteira entre cenas ou 1px do palco anterior) e corrija.
   c. Cena 3 no mobile: a carreta a 100vw fica pequena, com muito branco
      em cima e embaixo. No mobile, enquadre mais perto (o container e o
      chassi ocupando ~140% da largura, com a câmera centrada no
      container) e, depois do encaixe, recue até a carreta inteira
      caber, que é o enquadramento em que a cena 4 começa.
   d. Screenshots de conferência das cenas 2 e 3 (desktop e mobile).

1. Road.tsx (cena 4): promova a prova TruckPass para a jornada usando
   Scene, com a imagem carreta-lado (com logo) e as mesmas coordenadas
   de rodas (a carreta com logo está alinhada a 1 px com a original).
   Ela começa parada no enquadramento final da cena 3 e sai para a
   esquerda. Mantenha rodas girando, faixas, linha vermelha e o
   velocímetro mono. Apague src/app/dev/prova e
   src/components/proof/ depois de migrar.
2. Terminal.tsx (cena 5, fundo sand-50, 260vh):
   - planta baixa do terminal CONE em SVG desenhado à mão no código,
     traço navy-900 a 60% (fino), sem preenchimento: perímetro do
     pátio, blocos de pilhas (retângulos com o número de TEUs em mono
     pequeno), galpão com as 46 docas numeradas, portaria e vias com
     setas de sentido; o traço se desenha (stroke-dashoffset) na entrada
     da cena;
   - a carreta vista de cima (carreta-cima, recortada) entra pela
     portaria e segue um caminho (SVG path) até uma doca, girando para
     acompanhar a tangente do caminho (getPointAtLength); a linha
     vermelha é o próprio caminho, revelado atrás dela;
   - cotas de planta (linhas de cota + texto mono) entram uma a uma:
     "35.000 m²", "4.000 TEUs", "46 docas", "5.000 m² cobertos";
   - a carreta tem tamanho coerente com a planta (largura de uma via).
3. Screenshots de 5 pontos de cada cena (desktop e mobile) e vídeo.

Pronto quando: lint, typecheck, test e e2e passam, a carreta da cena 4
continua exatamente de onde a cena 3 parou, e a planta do terminal lê
como desenho técnico limpo com a foto da carreta por cima.
Commit: "feat: cenas 4 e 5 (estrada e terminal)"
````

## Prompt H1 — Hero cinematográfico e ajustes das cenas 2 e 5

> Revisão 2026-10-31, depois do J3 (`589ba5f`). O hero de texto sobre navy ficou simples demais para a primeira impressão. Referência visual aprovada pelo usuário: foto de porto ao nascer do sol, mapa no céu, "DESDE 1996" em vermelho, menu aberto e faixa de pilares. Foto: `assets-src/ai/hero-porto.webp` (3840×1645, upscale 2×).

````text
Leia o CLAUDE.md, o spec (seção 3 e seção 5, "Loading e abertura do
hero") e os componentes do hero (src/components/home/Hero.tsx e o que
ele usa). Use as skills animate, animation-performance, emil-design-eng e
frontend-design:frontend-design.

Parte A — Hero cinematográfico
1. Foto de fundo: assets-src/ai/hero-porto.webp (navio chegando ao porto
   ao nascer do sol, portêineres à direita, mar e céu vazios à esquerda).
   Inclua no npm run images (AVIF/WebP 800, 1200, 1920, 2560, 3840). É o
   LCP: <link rel="preload"> com imagesrcset, fetchpriority="high", sem
   lazy. Orçamento: ≤ 250 KB no desktop e ≤ 120 KB no mobile (AVIF).
   - Tela cheia (cover), foco no navio (object-position ~68% 55%; no
     mobile, enquadre a proa e os portêineres).
   - Degradê navy-900 da esquerda (≈92% na borda até 0% em ~60% da
     largura) e outro de baixo para cima sob a faixa de pilares. No
     mobile, o degradê vem de baixo, sob o texto.
   - Movimento: depois do loading, zoom lento de 1.08 → 1.0 em ~2.4 s
     (ease-out), junto com a entrada dos textos; depois, paralaxe leve
     com o mouse (foto ±8px, mapa ±14px), só em pointer: fine. Nada em
     reduced motion.
2. Título: "TRANSPORTANDO / CONFIANÇA / DESDE 1996", com "DESDE 1996" em
   red-500 numa linha própria (texto grande: passa AA sobre o degradê).
   Mantenha a entrada com SplitText.
3. Mapa: menor, no céu, acima e à esquerda dos portêineres (sem cobrir o
   navio), com Suape marcado por um ponto red-500 com brilho que pulsa
   devagar (2.4 s; parado em reduced motion). Mantenha os rótulos
   "SUAPE · PE" e "SALVADOR · BA" e as rotas.
4. Header no desktop (≥ 1280px): links visíveis inline, vindos de
   site.nav (sem inventar itens), mono pequeno com tracking, o ativo com
   sublinhado red-500; "Serviços" abre o submenu que já existe. Abaixo
   de 1280px continua o botão de menu.
5. Faixa de baixo: troque o letreiro corrido por 4 pilares com ícone de
   linha (lucide-react, se já estiver instalado; se não, SVG inline),
   título mono e subtítulo:
   CABOTAGEM · Suape → Nordeste | FROTA PRÓPRIA · 500 entregas/dia |
   ATENDIMENTO 24H · desde 1996 | TERMINAL PRÓPRIO · Suape · PE.
   Separadores em barra inclinada. No mobile: grade 2×2.
6. Passagem para a cena 1: ao rolar, o mapa e os textos saem para cima,
   a foto avança em direção ao convés do navio (scale 1 → ~1.35, foco no
   convés) e escurece levemente; a cena 1 entra no enquadramento largo
   como hoje. Sem rolagem morta (todo passo de 10vh muda algo) e sem
   faixa entre os dois. Se o mergulho 3D do mapa não fizer mais sentido
   sobre a foto, troque-o por essa saída e registre no relatório.
7. Contraste: meça nos screenshots os pixels atrás de cada texto e
   confirme AA (4.5:1 texto normal, 3:1 grande).

Parte B — Correções das cenas
8. Cena 2 no desktop: em p=0.5 o portêiner some e só o spreader aparece
   (screenshot desktop-porteiner-0.5). Ache a causa (provável troca da
   camada de alta resolução sem a base carregada) e garanta que nenhum
   frame fique sem o guindaste. Teste e2e: em 10 pontos da cena, a
   camada do portêiner está visível e carregada.
9. Cena 5 (terminal):
   - desktop: rótulos das cotas e do galpão com no mínimo 12px (hoje
     ~9px) e a planta um pouco maior (até 80vw / 70svh);
   - mobile: gire a planta 90° (retrato) para ela ocupar a altura da
     tela, mantendo os textos na horizontal e as cotas legíveis; a
     carreta e o caminho giram junto.

Testes e entrega
10. Screenshots do hero em 1440×900, 1920×1080 e 390×844, da passagem
    hero → cena 1 (3 pontos), da cena 2 desktop (p 0.4, 0.5, 0.6) e da
    cena 5 (desktop e mobile). Vídeo do topo até a cena 2. Lighthouse
    mobile da Home: informe LCP e o peso da foto do hero.

Pronto quando: lint, typecheck, test e e2e passam, o hero tem impacto de
capa (foto, título com DESDE 1996 em vermelho, mapa no céu, pilares), o
LCP fica < 2.5 s no Lighthouse mobile, o portêiner nunca some e a planta
do terminal enche a tela no mobile.
Commit: "feat: hero cinematográfico e ajustes das cenas 2 e 5"
````

## Prompt H2 — Mapa como destaque do hero e cena 1 animada

> Rodar depois que o H1 terminar e for commitado. Referência visual do hero: `docs/reference/hero-mapa-2026-10-31.webp` (mockup do usuário; não copiar pixel a pixel).

````text
Leia o CLAUDE.md, o spec (seção 3, incluindo a "Revisão 2026-10-31") e
os componentes do hero e da cena 1 (Hero.tsx, HeroStage.tsx,
HeroCanvas.tsx, HeroMapStage.tsx, heroPhoto.ts, OceanArrival.tsx,
ArrivalFrame.tsx, oceanCamera.ts). Veja o mockup em
docs/reference/hero-mapa-2026-10-31.webp. Use as skills animate,
animation-performance, emil-design-eng e frontend-design:frontend-design.

Parte A — Hero: o mapa é o destaque
1. O mapa do Nordeste volta a ser a peça principal: grande, à direita
   (~55% da largura no desktop, de ~12% a ~78% da altura), estados em
   pontilhado claro com divisas finas, Suape com ponto red-500 e brilho
   pulsando (2.4 s), rotas red-500 em arco saindo de Suape (desenham
   na entrada, depois um pulso de luz corre por elas a cada ~4 s).
   Rótulos "SUAPE · PE" e "SALVADOR · BA" em mono, ≥ 14px.
2. A foto hero-porto vira só fundo: escurecida para noite (camada
   navy-900 ~75% + leve duotone azul), com as luzes do porto aparecendo
   no canto inferior direito, abaixo do mapa. O navio não precisa
   aparecer inteiro. Mantenha preload/LCP do H1; se a foto deixar de
   ser o LCP (o título passa a ser), ajuste o preload e registre.
3. Mantenha do H1: título com DESDE 1996 em red-500, menu inline,
   botões, faixa de 4 pilares, paralaxe do mouse (mapa ±14px, foto
   ±6px). Texto à esquerda, mapa à direita, sem sobreposição em
   1280–1920px. Mobile (390×844): mapa em cima ocupando a largura,
   texto embaixo, pilares em 2×2.
4. Saída para a cena 1: ao rolar, os textos sobem e somem, a câmera
   mergulha no ponto de Suape (o mapa escala para o ponto vermelho,
   que cresce e vira um brilho), e o brilho se abre na foto do navio da
   cena 1 no enquadramento largo. Sem faixa entre os dois e sem
   rolagem morta. Reaproveite heroCamera/heroDive (ficaram sem uso no
   H1); o que continuar sem uso depois disso, remova, junto com as
   dependências de pós-processamento.
4b. Desempenho (o H1 deixou LCP simulado em 4,4 s e TBT ~1,2 s com CPU
   lenta): o canvas do mapa só monta depois do primeiro paint (idle ou
   após o load), com um SVG/PNG estático do mapa no lugar até lá. O
   elemento de LCP (foto ou título) precisa estar pintado no primeiro
   paint: revele o título com clip/transform, nunca opacity 0 até o
   loading acabar. Meta: LCP < 2,5 s e TBT < 400 ms no Lighthouse
   mobile simulado; informe os dois.

Parte B — Cena 1: não é só zoom
A foto continua parada (não animar água). O zoom da câmera fica, mas
cada trecho do scroll tem uma camada animada por cima, em coordenadas
da foto (mesma matemática das anotações atuais):
5. 0–20%: HUD de navegação no canto (mono, sand-50 com halo):
   LAT/LONG correndo até "08°23′S 34°57′W", "DESTINO: SUAPE · PE",
   "CABOTAGEM". Uma rota tracejada red-500 se desenha na água à frente
   da proa até sair pelo topo do quadro (rumo a Suape).
6. 20–45%: anel de sonar/radar pulsa a partir do navio (2 ondas,
   opacidade baixa). Rótulo "CABOTAGEM · RUMO A SUAPE · PE" na proa.
7. 45–75%: os contornos red-500 dos containers navy se desenham um a
   um (stroke-dashoffset, em sequência) e o contador "1.900 TEUs por
   mês" sobe junto. Rótulo "CONTAINERS APG".
8. 75–100%: a mira de cantos fecha sobre o container-alvo (de grande
   para justa, com uma "trava" de 120 ms) e aparece uma ficha técnica
   ao lado: "APGU 1996-07 · 40′ · DESTINO: TERMINAL CONE" (use o
   ContainerCode). Esse container é o que desce na cena 2.
9. Todo passo de 10vh muda algo visível. Textos ≥ 12px, AA sobre a
   foto (halo ou placa navy translúcida). Reduced motion: estado final
   estático com HUD, contornos e ficha.

Testes e entrega
10. Screenshots: hero 1440×900, 1920×1080, 390×844; passagem hero →
    cena 1 (3 pontos); cena 1 em p 0.1, 0.3, 0.6, 0.9 (desktop e
    mobile). Vídeo do topo até o fim da cena 1. Lighthouse mobile:
    LCP.

Pronto quando: lint, typecheck, test e e2e passam, o mapa domina o hero
como no mockup, o mergulho em Suape leva ao navio e a cena 1 tem
animação em todo o percurso.
Commit: "feat: mapa como destaque do hero e cena 1 animada"
````

## Prompt J3b — Portêiner descendo

````text
Leia o CLAUDE.md, o spec (seção 3, "Revisão 2026-10-31") e os
componentes CraneLift.tsx, craneAnchors.ts e Load.tsx. Use as skills
animate, animation-performance e emil-design-eng.

0. Cena 1, correção (screenshot desktop-chegada-0.9 do H2): a ficha
   "SEU CONTAINER · APGU 1996-07 …" está translúcida e ilegível sobre
   os containers. Em p ≥ 0.85 ela fica 100% opaca, em placa navy-900
   sólida, mono ≥ 13px, com linha de chamada até a mira; a mira em
   stroke 2px red-500 com halo. Confira o contraste no screenshot.
1. Câmera ao contrário da atual (pedido do usuário): a cena 2 abre SEM
   zoom, com o portêiner inteiro em quadro e o container APG preso ao
   spreader no alto, junto ao carrinho. Ao rolar, o container DESCE
   (cabos alongando, presos ao carrinho e ao spreader) e, ao mesmo
   tempo, a câmera vai DANDO ZOOM, acompanhando o container: começa
   larga e termina em close no container chegando à carreta que
   espera embaixo (item 2b). A cena 3 continua desse close, com o
   container caindo na carreta (confira a continuidade: mesmo
   container, mesma escala aparente na troca). Zoom exponencial e
   limite de 1.5× por pixel da fonte, como na cena 1.
2. Camadas animadas para a cena não ser só "guindaste + texto":
   - cota vertical red-500 ao lado do container com a altura em metros
     diminuindo até 0 (calcule pela escala da foto: container 2,59 m de
     altura);
   - chamadas técnicas com linha de chamada, entrando quando a peça
     aparece: "CARRINHO", "SPREADER · TWISTLOCKS", "CONTAINER 40′";
   - o texto "O braço rodoviário da cabotagem no Brasil" entra em
     SplitText na metade da descida.
2b. Contexto, para o portêiner não ficar solto no branco (revisão do
   usuário: "seção sem vida"):
   - CAIS: linha de chão em traço navy sob as pernas, com régua de
     cotas; à esquerda, sob a lança, o costado do navio em traço fino
     (silhueta, sem foto) com a linha d'água e 2–3 pilhas de
     containers no convés: é de onde o container veio.
   - CARRETA ESPERANDO: sob o spreader, entre as pernas, a
     carreta-lado-vazia pequena, na escala do portêiner (container 40′
     = 12,2 m). Com o zoom, ela cresce até o close final e o container
     encaixa na escala certa: é a ponte para a cena 3.
   - FUNDO: palavra gigante "SUAPE" em cinza muito claro (#EDEBE6)
     atrás do portêiner, deslizando devagar no sentido oposto ao
     scroll, como o "OUR SERVICES" da referência.
   - COTA DO PORTÊINER: cota vertical do chão ao topo da lança
     ("≈ 50 m", calcule pela escala; marque "confirmar com cliente").
   - TÍTULO: reduza para ~2/3 do tamanho atual e coloque abaixo dele
     2 números com contador: "1.900 TEUs / mês" e "24 h / operação".
   - Mobile: navio e régua somem; carreta esperando e cotas ficam.
3. O portêiner nunca some (mantenha o teste do H1 item 8).
4. Screenshots da cena 2 (p 0, 0.25, 0.5, 0.75, 1) e da passagem 2 → 3,
   desktop e mobile. Vídeo da cena 1 ao fim da cena 3.

Pronto quando: lint, typecheck, test e e2e passam e o container desce
do alto e chega à carreta sem salto.
Commit: "feat: portêiner descendo o container"
````

## Prompt J3c — Estrada contínua: de lado, vira vista de cima, pista com a história

> Referência: unitedcarriers.com (sequência de prints do usuário em 2026-10-31). Usa `assets-src/ai/carreta-alto-30.png` e `carreta-alto-60.png` (sem logo, cavalo com 2 eixos; aceitas pelo usuário em 2026-10-31).

````text
Leia o CLAUDE.md, o spec (seção 3, "Revisão 2026-10-31b") e Road.tsx,
Terminal.tsx, Load.tsx, homeSections.ts e site.ts. Use as skills
animate, animation-performance, emil-design-eng,
frontend-design:frontend-design e mobile-native.

Parte 0 — Correções da cena 2 (prints do usuário após o J3b)
0a. Close da cena 2: a perna e os truques amarelos do portêiner, ao
   lado da carreta, ficam borrados e com artefatos de upscale. A
   partir de ~60% do zoom, aplique profundidade de campo: portêiner,
   cais e régua ganham blur progressivo (0 → 8px) e esmaecem até
   ~25%, deixando nítidos só carreta, container e spreader. O blur só
   na camada do portêiner (filter numa camada já rasterizada, sem
   repintar a cada frame; confira no Performance que não cai de 60fps).
0b. A sombra sob a carreta e o chão no close aparecem em blocos (borda
   do recorte). Troque por uma sombra de contato desenhada (elipse com
   radial-gradient, opacidade ~0.18) e limpe a borda do recorte da
   carreta-lado-vazia e da carreta-lado (cutout-white com feather).
0c. No quadro largo, o costado do navio fica cortado na base e cruza a
   régua do cais. Assente o navio na linha d'água, à esquerda da régua,
   sem cruzar a linha do cais, e deixe o casco inteiro em quadro
   (ou saindo só pela esquerda).
0d. Header sobre as cenas: os links passam por cima da lança e do
   spreader e ficam ilegíveis. Em todas as cenas da jornada, o header
   esconde ao rolar para baixo e volta ao rolar para cima (translateY,
   200 ms), e quando visível sobre cena clara ganha fundo #FEFEFE/85
   com backdrop-blur.
0e. Mobile: a cota de altura da cena 3 fica fora da tela. Coloque-a do
   lado de dentro do container (ou acima dele) sempre em quadro.

As cenas 4 (Estrada) e 5 (Terminal) viram UMA cena contínua, a
"Estrada", com a carreta sempre em quadro e a câmera subindo da vista
lateral até a vista de cima. A planta baixa do terminal sai.

Fase A — De lado (fundo branco, ~300vh)
1. A carreta lateral (carreta-lado, vinda da cena 3) anda para a
   esquerda devagar; o velocímetro marca a velocidade real do
   deslocamento e as rodas giram.
2. Atrás dela, uma palavra gigante em contorno/cinza claro
   ("FROTA PRÓPRIA") desliza no sentido oposto, como na referência.
3. Abaixo da linha da estrada, uma faixa navy-900 com o título
   "DO PORTO AO DESTINO FINAL." e cartões que entram deslizando na
   horizontal conforme a carreta anda (ícone de linha, título mono,
   1 frase): os 3 serviços de site.services e os diferenciais
   (Frota 100% própria · 100% rastreada · Atendimento 24h ·
   1.900 TEUs por mês). Cada cartão entra quando a carreta passa por
   ele (rastro), não todos de uma vez.

Fase B — A câmera sobe (~150vh)
4. A faixa navy sobe e vira o asfalto sob a carreta (mesma cor
   navy-900, faixas tracejadas sand-50 surgindo). Ao mesmo tempo a
   câmera "sobe": troca de imagem lateral → alto-30 → alto-60 → cima
   (carreta-cima girada para apontar para a esquerda). Imagens em
   assets-src/ai/: carreta-lado.webp, carreta-alto-30.png e
   carreta-alto-60.png (1916×821; converta para WebP/AVIF como as
   outras e recorte o fundo branco), carreta-cima.webp. Cada troca com
   cross-fade curto (~6% da fase) e ajuste de escala/posição para o
   comprimento e a traseira coincidirem entre os quadros. As de 30° e
   60° não têm logo e o cavalo tem 2 eixos (a lateral tem 1): faça a
   troca lateral → alto-30 em movimento, nunca com a carreta parada.
   Se a troca saltar, ajuste os encaixes por imagem (como o
   TRUCK_FRAME) até ficar sem pulo; registre os valores.

Fase C — Pista vista de cima (~100vh por capítulo)
5. A pista navy-900 faz curvas largas (S) e depois vira para baixo; a
   câmera acompanha a carreta, que gira conforme a tangente
   (getPointAtLength), deixando a linha red-500 como rastro.
6. Ao lado da pista, alternando lados, os capítulos da história (do
   site original da APG), cada um revelado quando a carreta chega na
   altura dele (número/título grande + título mono + 1 frase):
   - 1996 · "A FUNDAÇÃO": Paulo Germano de Albuquerque Ramos, vindo de
     grandes empresas de logística, funda a APG para atender bem o
     transporte rodoviário de containers, que era mal servido.
   - "O BRAÇO RODOVIÁRIO DA CABOTAGEM": parceira dos grandes players
     da cabotagem no Brasil, com 1.900 TEUs por mês.
   - "SUAPE": frota 100% própria e rastreada, atendimento 24 h.
   - "LOGÍSTICA EM PERNAMBUCO": armazenagem, cross-docking, supply
     chain e 500 entregas fracionadas por dia.
   - "BAHIA": operação às margens da BR-324, em Salvador.
   Não invente anos além de 1996. Textos em site.ts
   (journeyScene.history), comentário "confirmar com cliente".
   Título fixo da fase, à esquerda no desktop, como na referência:
   "CONFIANÇA / EM CADA / QUILÔMETRO" (a 1ª linha em cinza).

Fase D — Chegada ao terminal CONE (~120vh)
7. A pista termina numa doca do terminal CONE vista de cima (galpão
   em traço, docas numeradas); a carreta encosta e os números entram
   como placar: 35.000 m² · 4.000 TEUs estáticos · 46 docas ·
   5.000 m² (texto conforme site.ts). Depois, a Distribuição.

Geral
8. Remova a cena "terminal" de homeSections/journey e reajuste os
   códigos APGU 1996-NN (sem buracos nem repetidos). Apague o código
   da planta que ficar sem uso.
9. Todo passo de 10vh move a carreta e revela ou desloca algo.
   Mobile (×0.75 de altura): fase A com cartões um por vez sob a
   carreta; fase C com a pista vertical no centro e os textos em
   cartões acima/abaixo, ≥ 14px. Reduced motion: cada fase como
   quadro estático com todos os textos.
10. Orçamento: as 4 imagens da carreta em AVIF/WebP responsivo;
    carregue alto-30/alto-60/cima só quando a fase A começar.
11. Screenshots desktop e mobile em p 0, 0.1 … 1 da cena; vídeo da
    cena 3 ao início da Distribuição.

Pronto quando: lint, typecheck, test e e2e passam, a carreta passa da
vista lateral à de cima sem pulo, segue a pista sem sair dela, cada
cartão e capítulo aparece quando ela passa e a cena termina na doca.
Commit: "feat: estrada contínua da vista lateral à pista com a história"
````

## Prompt J3d — Ajustes da cena 2, do encaixe e da estrada

````text
Leia o CLAUDE.md, o spec (seção 3, "Revisão 2026-10-31b") e
CraneLift.tsx, Load.tsx, Estrada.tsx e estradaScript.ts. Use as skills
animate, animation-performance, emil-design-eng e
frontend-design:frontend-design.

1. Cena 2: tire o costado do navio em traço e as pilhas de containers
   desenhadas (com a linha d'água tracejada). Ficou estranho (avaliação
   do usuário). Mantenha o cais, a régua, a carreta esperando, "SUAPE"
   e as cotas.

2. Encaixe 2 → 3 sem trava: hoje o usuário precisa rolar duas vezes
   sem nada acontecer antes do container encaixar. Ache a causa (a
   cena 3 deslizando transparente sobre o close? trecho final da cena
   2 parado?) e garanta que a descida continue sem parar: o container
   segue descendo em todo passo de 10vh até encaixar na carreta, e o
   encaixe acontece logo no início da cena 3. Teste e2e: do fim da
   cena 2 ao encaixe, cada 5vh muda a altura do container (a cota em
   metros diminui).

3. Fase B mais natural (lateral → de cima). Hoje a carreta muda de
   tamanho aos saltos (grande → média → pequena) e as vistas trocam
   cedo. Refaça como um movimento de câmera contínuo:
   - Uma única variável de ângulo θ de 0° a 90° ao longo da fase. A
     escala da carreta e o zoom de câmera derivam de θ por uma curva
     suave (sem degraus); a carreta mantém o centro fixo na tela.
   - O chão é um plano em 3D: a faixa navy é um plano com
     perspective + rotateX = 90° − θ, então de lado ela é uma linha
     fina sob as rodas e vai se abrindo em pista conforme a câmera
     sobe; as faixas tracejadas ficam no plano e ganham perspectiva.
   - Cross-fades sobrepostos e longos (~20% da fase cada), centrados
     em θ = 30° e 60°, alinhados pelo ponto de contato das rodas
     traseiras e pela frente da cabine (calcule os encaixes por imagem
     medindo os bboxes; não a olho).
   - A carreta continua andando para a esquerda (o asfalto passa) e a
     sombra acompanha o ângulo.
   Depois de implementar, grave um vídeo só da fase B em câmera lenta e
   confira quadro a quadro que não há salto de tamanho nem de posição.

4. Fase A: no print, a faixa navy sob a carreta aparece vazia e a
   palavra "FROTA PRÓPRIA" quase não aparece. Garanta que pelo menos um
   cartão esteja visível em toda a fase A e que a palavra tenha
   contraste perceptível (contorno 1.5px #D9D6CF ou preenchimento
   #EDEBE6).

5. Fase C — capítulos com vida. Hoje são texto solto em fundo branco.
   Para cada capítulo:
   - um marco na pista: pino red-500 com o número/ano, que acende e
     pulsa quando a carreta passa, ligado ao cartão por uma linha de
     chamada que se desenha (stroke-dashoffset);
   - número grande com contador (1996 rola de 1990; 1.900 sobe de 0;
     500 sobe de 0), título com SplitText linha a linha, ícone de
     linha animado (lucide ou SVG: navio, carreta, guindaste, galpão,
     mapa da BA) que se desenha ao entrar;
   - código do capítulo com o ContainerCode ("APGU 1996-05 · 01/05")
     e uma barra de progresso dos capítulos;
   - saída: o cartão anterior sai deslizando e esmaecendo quando o
     próximo entra.
   Tire o bloco cinza atrás do título "CONFIANÇA / EM CADA /
   QUILÔMETRO": se o título cruza a pista, mude a posição da pista ou
   do título para não se cruzarem (ou título sobre placa sand-50
   sólida com borda fina, nunca o cinza translúcido atual).

6. Screenshots desktop e mobile: cena 2 (p 0, 0.5, 1), passagem 2 → 3
   em 5 pontos, Estrada em p 0, 0.1 … 1, e um vídeo só da fase B.

Pronto quando: lint, typecheck, test e e2e passam, não há trecho morto
no encaixe, a câmera sobe da lateral à vista de cima sem salto, e cada
capítulo entra com marco, contador e ícone animados.
Commit: "fix: encaixe contínuo, câmera da estrada e capítulos animados"
````

## Prompt J4 — Distribuição, transições, indicador e mobile

````text
Leia o CLAUDE.md, o spec (seção 3, revisões 2026-10-31 e 2026-10-31b)
e homeSections.ts, Estrada.tsx, HeroMapStage.tsx e DistributionStage.
Use as skills animate, animation-performance, emil-design-eng e
mobile-native.

A jornada hoje: Hero (mapa) → Chegada → Portêiner → Carga → Estrada
(termina na doca do terminal CONE) → Distribuição (falta).

1. Distribuição (última cena da jornada, fundo navy-900): reaproveite o
   mapa do hero (mesmo estilo pontilhado e rotas). Começa com zoom no
   ponto do terminal CONE e se afasta até PE e BA; a linha vermelha
   ramifica em 24 rotas com destinos que acendem em sequência. Texto
   "500 entregas fracionadas por dia" com contador. No fim, passagem
   para a seção Serviços. O canvas só monta perto da cena e para de
   renderizar fora da tela.
2. Estrada → Distribuição sem corte: a carreta encosta na doca, a
   câmera se afasta, o fundo sand escurece para navy e a doca vira o
   ponto vermelho do terminal no mapa (mesma posição na tela).
3. Revise todas as passagens (hero → 1, 1 → 2, 2 → 3, 3 → Estrada,
   Estrada → Distribuição → Serviços): sem faixa entre cenas, sem
   salto de pixel e sem trecho morto. Um e2e por passagem.
4. Indicador lateral: 6 marcas (hero + 5 cenas), a ativa em red-500,
   clicáveis (lenis.scrollTo), aria-label por cena, escondido no
   mobile.
5. Mobile (< 768px): confira cada cena em 390×844 e 375×667; nenhum
   texto sobre imagem sem AA, nenhum texto cortado, alturas de scroll
   ×0.75.
6. Reduced motion: cada cena mostra o estado final estático com o
   texto, sem scrub.
7. Orçamento: meça o total de imagens baixadas na Home (desktop e
   mobile) e garanta ≤ 2 MB e ≤ 1 MB; pré-carregue só a próxima cena.
   Informe o peso por cena.
8. Screenshots finais e vídeo do scroll completo, do hero ao rodapé,
   desktop e mobile.

Pronto quando: lint, typecheck, test e e2e passam e o vídeo mostra a
Home inteira contínua, do mapa ao rodapé, sem cortes secos.
Commit: "feat: distribuição, transições e mobile da jornada"
````

## Prompt 14 — Imagens dos serviços e heros internos (revisão 2026-11-03: fotorrealista, sem 3D)

> Substitui a versão 3D. Usa `assets-src/ai/armazem-docas.webp` (3344×1882) e `terminal-aereo.webp` (3840×2161), ampliadas 4× com Upscayl em 2026-11-03; originais em `assets-src/reference/`.

````text
Leia o CLAUDE.md, o spec (seções 3 e 4) e Services.tsx e as páginas
src/app/sobre, src/app/servicos, src/app/estrutura. Use as skills
animate, emil-design-eng e frontend-design:frontend-design.

O 3D procedural foi descartado; o site usa fotos de IA recortadas
(assets-src/ai/). Nada de canvas WebGL nesta etapa.

1. Cards de serviço (Home e /servicos): troque os slots data-mini3d por
   imagens recortadas no mesmo padrão da jornada:
   - containers-suape: porteiner-lado com o container no spreader
     (recorte da região do spreader);
   - operacao-bahia: carreta-lado;
   - logistica-armazenagem: armazem-docas.
   Hover (só pointer: fine): a imagem sobe 6px e escala 1.03 em 240 ms
   ease-out; reduced motion: nada. AVIF/WebP com sizes corretos.
2. Heros internos, cada um com foto, degradê navy e título com
   SplitText, no padrão do hero da Home (sem mapa):
   - /sobre: hero-porto (noturno, como fundo da Home) e a linha do
     tempo da Estrada (journeyScene.history) em versão estática;
   - /servicos/*: a imagem do card, grande, com paralaxe leve no scroll;
   - /estrutura: terminal-aereo, com os números do terminal (mesmo
     placar da doca da Estrada).
3. Apague os slots data-mini3d/data-hero3d e qualquer código 3D que
   ficar sem uso.
4. Rode npm run images; orçamento por página interna ≤ 600 KB desktop
   e ≤ 350 KB mobile.

Pronto quando: lint, typecheck, test e e2e passam, nenhuma página
interna cria canvas WebGL e os screenshots de /sobre, /servicos/* e
/estrutura (desktop e mobile) estão em e2e/__screenshots__/.
Commit: "feat: imagens dos serviços e heros internos"
````

## Prompt 14b — Heros dos serviços em fundo claro e ajustes das páginas internas

````text
Leia o CLAUDE.md, o spec (seções 3 e 4), PageHero.tsx, as páginas
src/app/servicos/[slug] e scripts/build-service-images.mjs. Use as
skills emil-design-eng e frontend-design:frontend-design.

Os heros de /sobre e /estrutura (foto de cena com degradê navy) ficaram
bons. Os três de /servicos/* não: o recorte em fundo branco flutua solto
sobre o navy chapado e parece barato.

1. Heros de /servicos/* passam a fundo claro #FEFEFE, no mesmo padrão
   das cenas da jornada (é onde esses recortes ficam bem):
   - título navy-900, texto navy/70, código APGU do serviço;
   - palavra gigante ao fundo em #EDEBE6, deslizando devagar com o
     scroll: "SUAPE", "BAHIA" e "CROSS-DOCKING";
   - linha de chão em traço navy com a sombra de contato desenhada
     (TruckShadow) sob o objeto, e uma ou duas cotas red-500 finas
     (ex.: "40′ · 12,2 m" no container, "46 docas" no armazém);
   - o header fica no tema claro sobre esses heros.
2. containers-suape: o recorte atual corta a grua no meio (pedaço de
   lança e de perna) e, no celular, o topo fica sob o header. Use o
   portêiner inteiro com o container no spreader, como o quadro largo
   da cena 2, ocupando a altura do hero.
3. logistica-armazenagem: a borda do pátio de concreto do armazém sai
   serrilhada no recorte. Faça o chão sumir num degradê para o branco
   (máscara linear nos 15% de baixo) em vez do corte.
4. "Outros serviços" no celular aparece com as imagens dos cards em
   branco no screenshot de página inteira. Confira se é só o lazy load
   do screenshot ou se as imagens não carregam; se for o screenshot,
   role a página antes de capturar.
5. Marque com o comentário "confirmar com cliente" os textos de hero
   que você escreveu em site.pages (/sobre e /estrutura).
6. Screenshots desktop e mobile das 5 páginas internas, com a página
   rolada até o fim antes de capturar.

Pronto quando: lint, typecheck, test e e2e passam e os três heros de
serviço têm fundo claro, objeto inteiro apoiado no chão e nada sob o
header.
Commit: "fix: heros dos serviços em fundo claro"
````

## Prompt H3 — Serviços, Por que a APG e CTA no padrão da jornada

````text
Leia o CLAUDE.md, o spec (seções 3, 4 e 5), Services.tsx,
Differentials.tsx, FinalCta.tsx e ServiceHero.tsx. Use as skills animate, animation-performance,
emil-design-eng, frontend-design:frontend-design e mobile-native.

O usuário achou Serviços, Por que a APG e o CTA final genéricos para o
padrão do projeto (cards brancos, 4 números soltos, título sozinho com
meia tela vazia). As três seções passam a ter a mesma linguagem da
jornada: fotos recortadas, traço técnico, cotas red-500, código APGU,
palavra gigante ao fundo e movimento atrelado ao scroll.

Parte A — Serviços (APGU 1996-07)
1. Troque a grade de 3 cards por um trecho fixado com rolagem
   horizontal: 3 painéis de tela cheia, um por serviço, cada um na
   composição do ServiceHero (fundo #FEFEFE, palavra gigante SUAPE /
   BAHIA / CROSS-DOCKING, objeto inteiro na linha de chão com sombra,
   cota red-500), com título, 1 frase, 3 itens do que inclui e "Ver
   serviço →". Ao passar de um painel ao outro, o objeto entra pela
   direita andando sobre a linha de chão (a carreta com as rodas
   girando; grua e armazém deslizando), e a palavra gigante corre mais
   devagar (paralaxe). Contador "01/03" e barra de progresso.
2. Mobile: sem rolagem horizontal fixada; os 3 painéis empilhados, com
   o objeto entrando lateralmente ao aparecer.

Parte B — Por que a APG (APGU 1996-08)
3. Mantenha o fundo navy-900 e os 4 números, mas cada um ganha uma
   micro-visualização animada ao entrar (scrub ou disparo único):
   - Frota 100% própria: fileira de 10 carretas-ícone em traço que se
     acendem uma a uma até 100%;
   - 35.000 m² / 4.000 TEUs: grade de containers vista de cima que vai
     se preenchendo (navy com faixa red-500), com a cota do pátio;
   - 100% rastreada: mini mapa pontilhado de PE com 5 pontos que se
     movem devagar por rotas, cada um com o pulso de GPS;
   - 24h: mostrador de relógio em traço com o ponteiro dando a volta e
     o horário real de Recife (America/Recife) em mono.
   Números com contador, título mono, frase. Layout em 2×2 grande no
   desktop (não 4 colunas estreitas), com linhas de grade técnicas.
4. Ao fundo, a palavra "CONFIANÇA" gigante em navy-800, deslizando.

Parte C — CTA final (APGU 1996-09)
5. "FALE COM UM ESPECIALISTA" passa para dentro de um container: um
   container APG de frente (portas fechadas, travas e código APGU
   1996-09) ocupa a metade direita; ao rolar, as duas portas abrem em
   3D (rotateY, perspective) e de dentro saem, em sequência, os
   contatos: botão Solicitar cotação, WhatsApp (se configurado),
   telefone 24 h (81) 3202-1800 e o endereço do terminal com a
   coordenada 08°23′S 34°57′W. O texto atual fica à esquerda.
6. Mobile: o container fica acima do texto, menor, e as portas abrem
   quando ele entra na tela.

Testes e entrega
7. Reduced motion: cada seção no estado final, parada. Nada de texto
   sobre imagem sem AA.
8. Screenshots desktop e mobile das 3 seções em 3 pontos cada; vídeo
   do desktop e do celular da seção Serviços ao rodapé.

Pronto quando: lint, typecheck, test e e2e passam, as três seções têm
movimento e linguagem da jornada.
Commit: "feat: serviços, diferenciais e CTA no padrão da jornada"
````

> **Checkpoint Marco 2:** gravar um vídeo da Home completa (desktop e celular) e mandar ao cliente.

---

# Marco 3 — Polimento

## Prompt 15 — Aparelhos fracos e fallback sem WebGL (revisão 2026-11-03)

````text
Leia o CLAUDE.md, o spec (seção 6) e HeroCanvas.tsx,
DistributionCanvas.tsx e as cenas da jornada. Use a skill
animation-performance e superpowers:test-driven-development para
pickTier.

O WebGL só existe nos dois mapas (hero e Distribuição); o resto é
imagem + transform.

0. Ajustes do 14b (screenshots desktop de /servicos/*): sobre os heros
   claros o header ganha uma barra cinza-lilás e, em operacao-bahia, o
   logo fica desbotado. Sobre fundo #FEFEFE a barra deve ser #FEFEFE/85
   com blur e o logo navy-900 100%. Em operacao-bahia o texto do hero
   passa por cima do "BAHIA" gigante; afaste a palavra para baixo do
   texto (como em containers-suape).
0b. Do H3: rode o e2e inteiro (não rodou de novo depois da correção do
   teste dos códigos APGU) e estabilize o teste de tempo da intro que
   falhou uma vez na rodada completa (ache a causa: espera fixa,
   corrida com fontes ou com o cache; não só aumente o timeout). Os
   rastreadores do mapa de PE podem continuar com animateMotion, mas
   param no tier 'low' e em reduced motion.

1. src/lib/quality.ts: pickTier({ webgl, reducedMotion, saveData,
   lowMemory }) → 'static' | 'low' | 'high'. Sem WebGL ou com reduced
   motion: 'static'; saveData ou deviceMemory ≤ 4: 'low'. Testes para
   as combinações. Sem dependência nova (não instale detect-gpu).
2. 'static': os mapas mostram o SVG/PNG estático que já existe como
   placeholder, com Suape e as rotas desenhadas; nada de canvas.
3. 'low': dpr máximo 1.5 nos canvas; a cópia desfocada da grua e a
   pulsação das rotas desligadas; imagens da jornada uma largura
   abaixo no srcset.
4. e2e: com reducedMotion 'reduce' e com WebGL desligado
   (--disable-webgl), a Home não cria canvas e mostra o mapa estático.

Pronto quando: lint, typecheck, test e e2e passam, e com CPU 6x no
DevTools a jornada continua sem travar (informe o fps médio).
Commit: "feat: níveis de qualidade e fallback sem WebGL"
````

## Prompt 16 — (removido)

> O loading e o pré-carregamento foram incorporados ao **Prompt 13e**, junto com a abertura do hero. Pule para o Prompt 17.

## Prompt 17 — Passe de motion e acessibilidade

````text
Leia o CLAUDE.md. Use as skills improve-animations,
find-animation-opportunities e break-ui, nesta ordem.

1. Revise todo o motion do site contra o spec (seção 5 "Movimento"):
   durações, easings e consistência. Corrija o que destoar. Liste no
   commit o que mudou.
2. Rode break-ui em: cards de serviço, Stats, FAQ, formulários e footer.
   Corrija tudo que quebrar (textos longos, 320px, zoom 200%).
3. Acessibilidade:
   - instale @axe-core/playwright e crie e2e/a11y.spec.ts rodando axe
     em todas as rotas, sem violações serious ou critical;
   - confirme o contraste de red-500 sobre navy-900; se ficar abaixo de
     4,5:1, use o vermelho só em elementos não textuais e texto grande;
   - navegação completa por teclado, com skip link "Pular para o
     conteúdo";
   - lang e títulos únicos.
4. Teste no Safari (WebKit no Playwright) e corrija diferenças.

Pronto quando: lint, typecheck, test e e2e (incluindo a11y) passam em
chromium, webkit e mobile.
Commit: "fix: passe de motion e acessibilidade"
````

---

# Marco 4 — QA e lançamento

## Prompt 18 — Lighthouse CI e orçamento de performance

````text
Leia o CLAUDE.md e as metas do spec (seção 1).

1. Instale @lhci/cli. Crie lighthouserc.json rodando contra
   `npm run build && npm run start` nas rotas /, /sobre,
   /servicos/containers-suape e /contato, em mobile e desktop. Asserções:
   performance ≥ 0.85 mobile e ≥ 0.90 desktop, accessibility ≥ 0.95,
   seo ≥ 0.95, best-practices ≥ 0.95, LCP < 2500, CLS < 0.05.
   npm script "lhci".
2. Script scripts/check-image-budget.ts: soma os bytes das imagens que
   a Home baixa (desktop AVIF ≤ 2 MB, mobile AVIF ≤ 1 MB; hoje 1,21 MB
   e 722 KB) e das páginas internas (≤ 600 KB / 350 KB). npm script
   "budget". Inclua no "test".
2b. LCP e TBT (pendentes desde o H1: LCP simulado 4,4 s, TBT ~1,2 s
   com CPU lenta): carregue o gsap e o código das cenas da jornada
   depois do primeiro paint (dynamic import ao primeiro scroll ou em
   requestIdleCallback), mantendo o hero pintado sem JS. Meta: LCP
   simulado < 2,5 s e TBT < 300 ms no mobile.
3. Rode tudo e corrija o que falhar (imagens com sizes corretos, code
   split do 3D, fontes).
4. Gere e2e de screenshots de todas as rotas (desktop e mobile) para a
   revisão final.

Pronto quando: npm run lhci e npm run budget passam.
Commit: "chore: Lighthouse CI e orçamento de performance"
````

## Prompt 19 — Deploy na Vercel

````text
Leia o CLAUDE.md. Use a skill vercel:deploy e vercel:env-vars.

1. Vincule o projeto à Vercel (vercel link) e configure as variáveis
   do .env.example nos ambientes Preview e Production. Peça os valores
   que eu não tiver passado; não invente.
2. Faça um deploy de preview e rode o smoke e2e contra a URL de preview
   (PLAYWRIGHT_BASE_URL).
3. Me passe a lista exata de registros DNS para:
   (a) apontar apgtransportes.com.br e www para a Vercel;
   (b) verificar o domínio no Resend (SPF, DKIM, MX de retorno).
   Não altere nada fora da Vercel.

4. Rode o Lighthouse mobile contra a URL de preview (rede real) e
   informe LCP, TBT e CLS da Home.

Pronto quando: o preview está no ar e o smoke passa contra ele.
````

> **Lançamento (manual, com o cliente):** aplicar os registros DNS, esperar a propagação, verificar o domínio no Resend, enviar uma cotação e um currículo de teste reais e depois promover para produção (`vercel --prod`). Por fim, cadastrar o site no Google Search Console e enviar o sitemap.

---

## Cobertura do spec

| Seção do spec | Prompts |
|---|---|
| 1. Objetivo e metas | 15, 16, 17, 18 |
| 2. Insumos | Guia de assets + 01 |
| 3. Jornada 3D | 08–12, 13, 13b, 13c, 13d |
| 4. Estrutura e páginas | 03, 04, 05, 14 |
| 5. Identidade visual | 01, 02, 16, 17 |
| 6. Arquitetura (formulários, SEO, LGPD, a11y) | 06, 07, 15, 17 |
| 7. Testes | Todos (cada um termina com testes), 17, 18 |
| 8. Marcos | Divisão deste documento |
| 9. Riscos | Fallbacks dos Prompts 11 e 15, checkpoint do Marco 1 |
