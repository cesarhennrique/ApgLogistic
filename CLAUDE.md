# APG Transportes — site institucional

Projeto premium (R$ 15 mil). Padrão de execução: nível unitedcarriers.com. Nada genérico, nada de template.

## Fonte de verdade

- Design aprovado: `docs/superpowers/specs/2026-10-26-apg-site-design.md`. Leia antes de qualquer tarefa. Não invente seções, textos ou números fora dele.
- Plano em prompts: `docs/superpowers/plans/2026-10-26-apg-site-prompts.md`.
- Assets: `docs/assets/2026-10-26-apg-assets-guide.md`.
- Todo texto, número, endereço e telefone vem de `src/content/site.ts`. Nunca escreva esses dados direto num componente.

## Stack

- Next.js (App Router) + TypeScript strict, páginas estáticas (SSG). Versões estáveis atuais.
- Tailwind CSS v4, com tokens em `src/app/globals.css` (`@theme`).
- React Three Fiber + drei + postprocessing, GSAP + ScrollTrigger + SplitText, Lenis.
- Vitest + Testing Library (unit), Playwright (e2e).
- Resend (e-mail), zod (validação), @vercel/analytics, lucide-react (ícones).
- Não adicione outra dependência sem justificar no commit.

## Convenções

- Código e identificadores em inglês. Textos do site em PT-BR.
- Componentes: `src/components/<área>/<Nome>.tsx`. 3D: `src/three/`. Utilitários: `src/lib/`.
- Server Components por padrão. `"use client"` só onde há estado, efeito ou animação.
- Animação: só `transform` e `opacity`. Nunca anime `width`, `height`, `top` ou `left`.
- Todo movimento respeita `prefers-reduced-motion` via `useReducedMotion()` (`src/components/motion/useReducedMotion.ts`).
- 3D: nunca use `setState` por frame. O progresso do scroll vive em `journeyProgress.value` (`src/three/progress.ts`) e é lido no `useFrame`.
- Acessibilidade: WCAG 2.1 AA, foco visível, canvas com `aria-hidden="true"`.

## Skills a usar

- Antes de UI: `frontend-design:frontend-design` e `emil-design-eng`.
- Antes de motion: `animate`. Se travar: `animation-performance`.
- Código com lógica: `superpowers:test-driven-development`.
- Antes de dizer que terminou: `superpowers:verification-before-completion`.

## Comandos

- `npm run dev`: servidor local.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run e2e`: todos devem passar antes de cada commit.

## Debug da cena 3D

- `?p=0.35` congela a jornada no progresso 0.35.
- `?debug` liga OrbitControls e um slider de progresso.
