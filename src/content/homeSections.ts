import { site } from "./site";

// The Home's sections in order (spec §4, "Ordem da Home"): the one list the APGU 1996-NN codes come from.
export const HOME_SECTIONS = [
  "hero",
  "chegada",
  "porteiner",
  "carga",
  "estrada",
  "distribuicao",
  "services",
  "differentials",
  "clients",
  "finalCta",
] as const;

export type HomeSection = (typeof HOME_SECTIONS)[number];

// 1, 2, 3… over the sections shown: a hidden one takes no number.
export function homeCodes(hidden: readonly HomeSection[]) {
  const codes: Partial<Record<HomeSection, number>> = {};
  let n = 0;
  for (const s of HOME_SECTIONS) if (!hidden.includes(s)) codes[s] = ++n;
  return codes;
}

// Clients stays hidden until there are logos (spec §2).
const codes = homeCodes(site.clients.length === 0 ? ["clients"] : []);
export const homeCode = (section: HomeSection) => codes[section] ?? 0;
