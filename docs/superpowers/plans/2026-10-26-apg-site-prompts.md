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
   o acabamento vem nos Prompts 13b e 13c.
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

## Prompt 13b — Estúdio do portêiner e da carreta (capítulos 1 e 2)

````text
Leia o CLAUDE.md e o spec, seção 3. Use as skills
frontend-design:frontend-design e animation-performance.

Objetivo: os capítulos 1 e 2 têm que parecer foto de produto premium,
sobre fundo sand-50, com objetos isolados e impecáveis.

1. Composição do CraneStage: portêiner inteiro, um recorte do navio
   (proa + as 2 baias de pilhas perto do portêiner, sem o resto do casco)
   e um plano de cais mínimo (laje de concreto claro com borda e
   cabeços de amarração). Nada além disso no quadro. O plano do chão se
   funde ao fundo sand (sem linha de horizonte: chão com a mesma cor do
   fundo e sombra de contato).
2. Materiais premium (src/three/materials/):
   - paintedMetal(color): MeshPhysical, roughness 0.45–0.6 com
     variação por ruído, clearcoat 0.15, desgaste sutil nas arestas
     (ruído + curvatura aproximada por normal);
   - containerPaint: igual, com sujeira leve na base e marcas de
     escorrimento verticais sutis;
   - glass, rubber, chrome para a carreta;
   - concreto claro para o cais.
   Todos procedurais (0 bytes de textura).
3. Detalhe que vende realismo: placas de identificação nos containers
   (código "APGU 199601 6" em mono nas portas do container APG, via
   texto do drei ou textura de canvas), cabos do spreader com leve
   catenária, luzes de aviso no spreader.
4. LoadStage: a câmera gira até o perfil da carreta. O container cruza
   e assenta, com um pequeno "assentamento" (desce 3 cm, sobe 1 cm, em
   180 ms) quando os twist locks travam. O logo APG fica legível na
   porta da cabine nesse quadro final.
5. Câmeras: lentes longas (fov 18–28) como fotografia de produto, com
   leve dolly enquanto o capítulo avança. O objeto principal ocupa o
   terço direito e o texto fica à esquerda.
6. Sombras: AccumulativeShadows enquanto o palco está parado; quando o
   portêiner ou o container se movem, troque para ContactShadows para não
   haver rastro.
7. Screenshots em p = 0.08, 0.15, 0.25, 0.35 e 0.4 (desktop e mobile).

Pronto quando: lint, typecheck, test e e2e passam e os 5 screenshots
parecem foto de estúdio (fundo limpo, sombra suave, sem horizonte).
Commit: "feat: estúdio do portêiner e da carreta"
````

## Prompt 13c — Estrada, terminal de cima e distribuição (capítulos 3 a 5)

````text
Leia o CLAUDE.md e o spec, seção 3. Reaproveite Highway, Distribution,
RouteLine e o mapa do Prompt 12 dentro dos novos palcos.

1. HighwayStage (fundo navy-900): a carreta em perfil, em close, rodando
   no lugar. Rodas giram; faixas da pista, postes e guard rail passam em
   parallax (3 camadas em velocidades diferentes); faróis e luz de
   posição acesos com bloom. A linha vermelha corre sob as rodas, de
   ponta a ponta do quadro. Sem céu: acima da pista, só o navy.
2. TerminalStage (fundo sand-50, vista de cima ortográfica ou fov 12 de
   bem alto): planta estilizada do terminal CONE.
   - Pátio com pilhas coloridas (vistas de cima, com sombra de contato),
     galpão com as 46 docas numeradas, portaria e vias.
   - A carreta, vista de cima, entra pela portaria seguindo a linha
     vermelha e encosta numa doca no fim do capítulo.
   - Anotações de planta em mono (linhas de cota finas navy a 40%):
     "35.000 m²" no pátio, "4.000 TEUs" nas pilhas, "46 docas" no
     galpão. As anotações entram uma a uma com o progresso.
3. DistributionStage: zoom out contínuo a partir do terminal até o mapa
   de PE e BA (mesma malha do hero, agora em vista de cima sobre sand).
   A linha vermelha ramifica em 24 rotas com vans (vistas de cima)
   seguindo cada uma; os destinos acendem em pontos red-500. No fim, o
   fundo escurece para navy e o mapa some, encaixando na seção Serviços.
4. A RouteLine é uma só peça narrativa: ela nasce nas rotas do hero,
   aparece sob a carreta no capítulo 3, guia a carreta no 4 e ramifica no
   5. Cada palco desenha o seu trecho; a cor, a espessura e o brilho são
   idênticos.
5. Orçamento por palco: até 200 mil triângulos (mostre no ?debug).
6. Screenshots em p = 0.45, 0.55, 0.65, 0.75, 0.85, 0.95 e 1.

Pronto quando: lint, typecheck, test e e2e passam e a jornada de 0 a 1
roda sem cortes secos, alternando navy e sand.
Commit: "feat: estrada, terminal de cima e distribuição"
````

## Prompt 13d — Direção, textos e mobile

````text
Leia o CLAUDE.md e o spec, seção 3. Use as skills animate e
emil-design-eng.

1. Textos dos capítulos: entram com RevealText no início da faixa e
   saem com fade e translateY no fim. O número de cada capítulo usa
   Counter, com ContainerCode acima. Cor do texto acompanha o fundo
   (sand-50 sobre navy, navy-900 sobre sand), trocando junto com
   stageBackground. Contraste AA medido em cada screenshot.
2. Composição: o texto nunca cobre o objeto principal do palco. Defina,
   por palco, o lado do texto e a área segura do objeto; teste e2e que
   compara o bounding box do texto com a projeção do objeto principal na
   tela (sem sobreposição em 1440x900 e 375x812).
3. Indicador de progresso lateral: 6 marcas (uma por capítulo), a ativa
   em red-500, clicáveis (lenis.scrollTo), com aria-label.
4. "Role para descobrir" no hero, que some ao começar o scroll.
5. Mobile (< 768px): trilha de 600vh para 450vh; texto embaixo e objeto
   em cima; fov e chaves de câmera próprias por palco para o objeto caber
   inteiro (o portêiner não pode ser cortado).
6. Header: transparente sobre a jornada, com a cor do logo e do menu
   acompanhando o fundo (branco sobre navy, navy sobre sand).
7. Grave um vídeo de tela do scroll completo em desktop e em mobile
   (Playwright video) em e2e/__videos__/ para revisão.

Pronto quando: lint, typecheck, test e e2e passam e o vídeo mostra a
jornada inteira sem texto sobre objeto e sem paradas bruscas.
Commit: "feat: direção, textos e mobile da jornada"
````

## Prompt 14 — Miniaturas 3D dos serviços e heros internos

````text
Leia o CLAUDE.md e o spec, seção 4.

1. src/three/MiniScene.tsx: um único Canvas compartilhado
   (View/tunneling do drei, para não criar um contexto WebGL por card)
   que renderiza nos slots data-mini3d e data-hero3d.
2. Miniaturas dos cards de serviço (giram devagar no hover; paradas
   sem hover e com reduced-motion):
   - containers-suape: portêiner + container;
   - operacao-bahia: carreta APG;
   - logistica-armazenagem: galpão com docas e van.
   Reutilize os componentes das cenas com uma prop `static` que desliga
   as animações de progresso.
3. Heros internos com câmera fixa e tier low sempre:
   - /sobre: navio ao pôr do sol;
   - /servicos/*: a miniatura do serviço, maior;
   - /estrutura: vista aérea do terminal.
4. Fora da viewport: frameloop="demand" e pausa (IntersectionObserver).

Pronto quando: lint, typecheck, test e e2e passam e só existe 1 contexto
WebGL por página (verifique no ?debug).
Commit: "feat: miniaturas 3D e heros internos"
````

> **Checkpoint Marco 2:** gravar um vídeo da Home completa (desktop e celular) e mandar ao cliente.

---

# Marco 3 — Polimento

## Prompt 15 — Níveis de qualidade, pós-processamento e fallback estático

````text
Leia o CLAUDE.md e o spec, seção 6 "Níveis de qualidade". Use a skill
animation-performance e superpowers:test-driven-development para
pickTier.

1. Instale detect-gpu (@react-three/postprocessing já existe).
2. src/three/quality.ts: pickTier({ webgl, reducedMotion, gpuTier }):
   sem webgl ou com reducedMotion dá 'static'; gpuTier ≤ 1 dá 'low';
   senão 'high'. Testes para as 4 combinações. useQualityTier() usa
   detect-gpu (getGPUTier) e o PerformanceMonitor do drei, que rebaixa
   de high para low se o fps ficar abaixo de 30 por 2 s. Nunca sobe
   de volta na mesma sessão.
3. O EffectComposer já existe desde o Prompt 13. Tier high: composer
   completo (N8AO, SMAA, Bloom, Noise, Vignette) e AccumulativeShadows.
   Tier low: sem composer (só SMAA via antialias nativo), ContactShadows
   em resolução 512, metade das instâncias de containers do fundo, dpr
   máximo 1.5.
4. Tier static: script scripts/capture-fallbacks.ts (Playwright) que
   abre /?p=X&capture=1 para X em [0, 0.1, 0.3, 0.5, 0.7, 0.9] em 1920x1080
   e em 750x1334, salva em public/images/fallback/<chapter>-<desktop|mobile>.webp
   (sharp, qualidade 80). npm script "capture:fallbacks". No tier
   static, a trilha da jornada mostra essas imagens (next/image com
   sizes), com crossfade entre capítulos, os mesmos textos e a mesma
   altura de scroll.
5. e2e: com reducedMotion: 'reduce' no contexto Playwright, a Home não
   cria canvas e mostra a imagem do capítulo 1.

Pronto quando: lint, typecheck, test e e2e passam, e com CPU throttling
6x no DevTools o site cai para low e continua fluido.
Commit: "feat: níveis de qualidade, pós-processamento e fallback estático"
````

## Prompt 16 — Tela de loading e pré-carregamento

````text
Leia o CLAUDE.md e o spec, seção 5 "Logo e loading". Use a skill
animate.

1. src/components/layout/Loader.tsx: só na primeira visita da sessão
   (sessionStorage com try/catch). Fundo navy-900, a seta vermelha
   (arrow.svg) desenha o percurso (stroke-dashoffset) e contador mono de
   0 a 100%, ligado ao useProgress do drei (assets 3D) + document.fonts.ready.
2. Mínimo de 600 ms e máximo de 4 s: depois disso, sai mesmo que o 3D
   ainda esteja carregando (o 3D entra com fade quando ficar pronto).
3. Saída: a cortina sobe, igual à transição de página, e o h1 do hero
   dispara o RevealText.
4. O texto do hero existe no HTML desde o início (LCP). O loader só
   cobre visualmente e não bloqueia o paint do h1 (aria-hidden no
   loader, h1 no DOM).
5. Preload: os GLB e as texturas são pedidos com prioridade baixa
   depois do LCP. Fontes com display swap e preload só dos pesos usados.
6. e2e: a segunda navegação na mesma sessão não mostra o loader.

Pronto quando: lint, typecheck, test e e2e passam e o Lighthouse mobile
mostra LCP < 2,5 s.
Commit: "feat: loading e pré-carregamento"
````

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
2. Script scripts/check-3d-budget.ts: soma os bytes de public/3d/** e
   falha acima de 1,5 MB. npm script "budget". Inclua no "test".
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
