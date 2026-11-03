
export type Faq = { question: string; answer: string };

export type Service = {
  slug: "containers-suape" | "operacao-bahia" | "logistica-armazenagem";
  title: string;
  summary: string;
  bullets: string[];
  faq: Faq[];
};

export type NavLink = { href: string; label: string };
export type NavItem = NavLink | { label: string; children: NavLink[] };

export type Address = {
  label: string;
  street: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zip: string;
};

// A journey scene after the hero (spec §3): its ContainerCode label and its line.
export type JourneyScene = {
  id: "chegada" | "porteiner" | "carga" | "estrada" | "distribuicao";
  code: string;
  text: string;
};

const matriz: Address = {
  label: "Matriz",
  street: "BR-101, Km 96,4",
  complement: "Condomínio CONE Multimodal 1, Galpão",
  district: "Distrito Industrial Diper",
  city: "Cabo de Santo Agostinho",
  state: "PE",
  zip: "54503-900",
};

const filial: Address = {
  label: "Filial",
  street: "Rua Bico Doce, S/N",
  complement: "Gl Sala 01",
  district: "Palestina",
  city: "Salvador",
  state: "BA",
  zip: "41308-066",
};

const services = [
  {
    slug: "containers-suape",
    title: "Containers Suape",
    summary:
      "Transporte rodoviário de containers no Porto de Suape, integrado à cabotagem e ao nosso terminal no Condomínio CONE Multimodal.",
    bullets: [
      "Média de 1.900 TEUs movimentados por mês",
      "Terminal com capacidade para 4.000 TEUs estáticos",
      "35.000 m² de pátio às margens da BR-101",
      "Frota 100% própria e rastreada",
      "Atendimento 24 h",
    ],
    faq: [
      {
        question: "A APG transporta containers no Porto de Suape?",
        answer:
          "Sim. Somos o braço rodoviário da cabotagem em Suape: levamos o container do porto ao terminal CONE e ao destino da carga. Movimentamos, em média, 1.900 TEUs por mês.",
      },
      {
        question: "Onde fica o terminal da APG?",
        answer:
          "No Condomínio CONE Multimodal 1, na BR-101, Km 96,4, Distrito Industrial Diper, em Cabo de Santo Agostinho – PE, perto do Porto de Suape.",
      },
      {
        question: "Qual é a capacidade do terminal?",
        answer:
          "O terminal comporta 4.000 TEUs estáticos em 35.000 m² de pátio, com 46 docas niveladoras eletro-hidráulicas.",
      },
      {
        question: "Como acompanho a minha carga?",
        answer:
          "Toda a frota é própria e rastreada, e a equipe atende 24 h por telefone e WhatsApp.",
      },
    ],
  },
  {
    slug: "operacao-bahia",
    title: "Operação Bahia",
    summary:
      "Operação de containers na Bahia pela BR-324, com filial em Salvador e a mesma estrutura de frota própria da matriz.",
    bullets: [
      "Filial em Salvador – BA",
      "Transporte de containers pela BR-324",
      "Frota 100% própria e rastreada",
      "Integração com a matriz em Pernambuco",
      "Atendimento 24 h",
    ],
    faq: [
      {
        question: "A APG atende a Bahia?",
        answer:
          "Sim. Temos filial em Salvador e operamos o transporte de containers na Bahia pela BR-324.",
      },
      {
        question: "Onde fica a filial da Bahia?",
        answer:
          "Na Rua Bico Doce, S/N, Gl Sala 01, Palestina, Salvador – BA, CEP 41308-066.",
      },
      {
        question: "A frota da operação Bahia também é própria?",
        answer:
          "Sim. A frota da APG é 100% própria e rastreada, em Pernambuco e na Bahia.",
      },
      {
        question: "Como peço uma cotação para a Bahia?",
        answer:
          "Pelo formulário de cotação do site ou pelo WhatsApp. O atendimento funciona 24 h.",
      },
    ],
  },
  {
    slug: "logistica-armazenagem",
    title: "Logística e Armazenagem",
    summary:
      "Entregas fracionadas, armazenagem, cross-docking e supply chain a partir do terminal CONE, em Cabo de Santo Agostinho.",
    bullets: [
      "500 entregas fracionadas por dia",
      "5.000 m² de estrutura coberta para cross-docking",
      "46 docas niveladoras eletro-hidráulicas",
      "35.000 m² de pátio",
      "Gestão de supply chain",
    ],
    faq: [
      {
        question: "Quantas entregas fracionadas a APG faz?",
        answer:
          "Em média, 500 entregas fracionadas por dia, em Pernambuco e na Bahia.",
      },
      {
        question: "Que estrutura de armazenagem a APG oferece?",
        answer:
          "5.000 m² de estrutura coberta para cross-docking, 46 docas niveladoras eletro-hidráulicas e 35.000 m² de pátio no Condomínio CONE Multimodal.",
      },
      {
        question: "O que é cross-docking?",
        answer:
          "É receber a carga, separar e expedir em seguida, sem estocagem longa. Isso encurta o tempo entre a chegada do container e a entrega final.",
      },
      {
        question: "A APG cuida da cadeia logística inteira?",
        answer:
          "Sim. Integramos transporte de containers, armazenagem, cross-docking e distribuição fracionada numa só operação, com frota própria.",
      },
    ],
  },
] satisfies Service[];

const nav: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/sobre", label: "Sobre" },
  {
    label: "Serviços",
    children: services.map((s) => ({ href: `/servicos/${s.slug}`, label: s.title })),
  },
  { href: "/estrutura", label: "Estrutura" },
  { href: "/contato", label: "Contato" },
  { href: "/trabalhe-conosco", label: "Trabalhe Conosco" },
];

export const site = {
  name: "APG Transportes e Logística",
  shortName: "APG",
  tagline: "Transportando confiança desde 1996",
  description:
    "Transporte de containers em Suape, operação na Bahia, armazenagem, cross-docking e entregas fracionadas. Frota 100% própria e rastreada, atendimento 24 h.",
  founded: 1996,
  founder: "Paulo Germano de Albuquerque Ramos",
  domain: "apgtransportes.com.br",
  phones: [{ label: "Central", display: "(81) 3202-1800", href: "tel:+558132021800" }],
  emails: {
    rh: "rh@apgtransportes.com.br", // confirmar com cliente: e-mail ativo?
  },
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  addresses: { matriz, filial },

  services,

  differentials: [
    { figure: "100%", title: "Frota própria", text: "Frota 100% própria, sem terceirização." },
    {
      figure: "35.000 m²",
      title: "Terminal próprio integrado a Suape",
      text: "35.000 m² de pátio e capacidade para 4.000 TEUs estáticos.",
    },
    { figure: "100%", title: "Rastreamento", text: "Todos os veículos rastreados." },
    { figure: "24h", title: "Atendimento 24h", text: "Equipe disponível 24 horas por dia." },
  ],

  timeline: [
    { year: 1996, text: "Fundação da APG por Paulo Germano de Albuquerque Ramos." },
    // confirmar com cliente: demais marcos (anos e eventos) não estão no spec
  ],

  // Scenes 1–5 of the journey (spec §3); the hero is scene 0. Scene 1's line is its counter: 1.900 + text.
  journey: [
    { id: "chegada", code: "Chegada", text: "TEUs por mês" },
    { id: "porteiner", code: "Portêiner", text: "O braço rodoviário da cabotagem no Brasil" },
    // No line of its own (spec §3): the image carries it.
    { id: "carga", code: "Carga", text: "" },
    { id: "estrada", code: "Estrada", text: "Frota 100% própria e rastreada · 24h" },
    { id: "distribuicao", code: "Distribuição", text: "500 entregas fracionadas por dia" },
  ] satisfies JourneyScene[],
  journeyScene: {
    // Scene 1: the TEUs a month it counts up to, and its photo's alt text.
    arrivalTeus: 1900,
    shipAlt: "Navio porta-contêineres visto de cima, chegando a Suape",
    truckAlt: "Carreta APG com container de 40 pés",
    // Small labels on the hero's map.
    mapLabels: { suape: "SUAPE · PE", salvador: "SALVADOR · BA" },
    // Scene 2: the callouts on the crane, the giant word behind it, its two numbers under the line.
    crane: {
      callouts: { trolley: "Carrinho", spreader: "Spreader · twistlocks", container: "Container 40′" },
      word: "Suape",
      stats: [
        { value: 1900, unit: "TEUs / mês" },
        { value: 24, unit: "h / operação" },
      ],
    },
    // Scene 4, "Estrada", side on: its speedometer (the road and the unit around the speed), the giant word behind
    // the truck, the navy band's title and its cards, revealed as the truck passes them (the services, then the
    // differentials).
    road: {
      highway: "BR-101",
      unit: "KM/H",
      word: "Frota própria",
      title: "Do porto ao destino final.",
      cards: [
        { title: services[0].title, text: "Containers no Porto de Suape, integrados à cabotagem e ao terminal CONE." },
        { title: services[1].title, text: "Containers na Bahia pela BR-324, com filial em Salvador." },
        { title: services[2].title, text: "Armazenagem, cross-docking e entregas fracionadas a partir do terminal CONE." },
        { title: "Frota 100% própria", text: "Caminhões e carretas da APG, sem terceirização." },
        { title: "100% rastreada", text: "Todos os veículos rastreados, do porto à entrega." },
        { title: "Atendimento 24h", text: "Equipe disponível 24 horas por dia, por telefone e WhatsApp." },
        { title: "1.900 TEUs por mês", text: "A média que movimentamos entre o navio e o destino." },
      ],
    },
    // Scene 4 from above: the track's title (its first line grey) and the history's chapters, one as the truck
    // reaches each (a big mark, counted up from count.from when it is a number, a title, one line).
    track: { title: ["Confiança", "em cada", "quilômetro"] },
    // confirmar com cliente: os textos dos capítulos (o único ano confirmado é 1996)
    history: [
      { mark: "1996", count: { from: 1990, to: 1996 }, title: "A fundação", text: "Paulo Germano de Albuquerque Ramos funda a APG, em Pernambuco." },
      { mark: "1.900", count: { from: 0, to: 1900 }, title: "O braço rodoviário da cabotagem", text: "Em média, 1.900 TEUs por mês levados do navio ao destino." },
      { mark: "Suape", title: "Frota própria no porto", text: "Frota 100% própria e rastreada em Suape, com atendimento 24 h." },
      { mark: "500", count: { from: 0, to: 500 }, title: "Logística em Pernambuco", text: "Armazenagem, cross-docking, supply chain e 500 entregas fracionadas por dia." },
      { mark: "Bahia", title: "BR-324 · Salvador", text: "A operação de containers chega à Bahia pela BR-324, com filial em Salvador." },
    ],
    // Scene 4's arrival: the CONE terminal's dock and its numbers, as a scoreboard.
    dock: {
      label: "Terminal CONE",
      stats: [
        { value: 35000, unit: "m²", label: "de pátio" },
        { value: 4000, unit: "TEUs", label: "estáticos" },
        { value: 46, unit: "", label: "docas" },
        { value: 5000, unit: "m²", label: "cobertos" },
      ],
    },
    // Scene 1's notes on the photo, as on a technical drawing: the ship's heading at its bow, the APG containers
    // on the deck, the client's container at the close.
    notes: { heading: "CABOTAGEM · RUMO A SUAPE · PE", containers: "CONTAINERS APG", target: "SEU CONTAINER" },
    // Scene 1's navigation HUD: the position runs from the open sea to Suape's (degrees, minutes).
    hud: {
      from: { lat: [5, 40], lon: [32, 20] },
      to: { lat: [8, 23], lon: [34, 57] },
      destination: "Destino: Suape · PE",
      mode: "Cabotagem",
    },
    // The target container's card at the close (its ContainerCode: number and label); the one scene 2 lowers.
    targetCard: { index: 7, label: "40′ · Destino: Terminal CONE" },
    // Scene 5, the distribution: its counter and the line under it.
    distribution: { count: 500, unit: "entregas fracionadas por dia" },
    // Shown when the pointer is over Suape on the hero's map.
    suapeHover: "Terminal CONE · Cabo de Santo Agostinho",
  },

  // The first-visit loader (spec §5, "Loading e abertura do hero"): status line per band of progress.
  intro: {
    status: [
      { until: 40, text: "Atracando em Suape…" },
      { until: 80, text: "Içando container…" },
      { until: 100, text: "Liberando carreta…" },
    ],
    coordinate: "SUAPE · PE · 08°23′S 34°57′W",
  },

  // confirmar com cliente
  mission:
    "Transportar e armazenar a carga dos nossos clientes com segurança e pontualidade, do porto ao destino final, com estrutura e frota próprias.",
  // confirmar com cliente
  values: ["Segurança", "Pontualidade", "Transparência", "Compromisso com o cliente"],

  cta: { quote: "Solicitar cotação", specialist: "Fale com um especialista" },

  // Home sections. `code` is the ContainerCode label (spec §5); titles follow the section names in spec §4.
  home: {
    hero: {
      code: "Quem somos",
      subtitle:
        "Do navio de cabotagem em Suape à entrega fracionada: frota própria, terminal próprio e atendimento 24 h.",
      // The tagline set in three lines, the last one in red.
      title: { lines: ["Transportando", "confiança"], accent: "desde 1996" },
      // Secondary link: scrolls to chapter 1.
      seeOperation: "Ver a operação",
      photoAlt: "Navio porta-contêineres chegando ao porto ao nascer do sol, com portêineres no cais",
      // The band at the bottom: four pillars of the operation.
      pillars: [
        { title: "Cabotagem", text: "Suape → Nordeste" },
        { title: "Frota própria", text: "500 entregas/dia" },
        { title: "Atendimento 24h", text: "desde 1996" },
        { title: "Terminal próprio", text: "Suape · PE" },
      ],
    },
    services: { code: "Serviços", title: "Do porto ao destino final", more: "Ver serviço" },
    differentials: { code: "Por que a APG", title: "Por que a APG" },
    clients: { code: "Clientes", title: "Clientes" },
    // Where APG works: the hubs and routes of the hero's and the distribution's maps.
    coverage: {
      highlight: ["PE", "BA"],
      hubs: [
        { label: "Suape", lon: -34.96, lat: -8.39 },
        { label: "Salvador", lon: -38.5, lat: -12.97 },
      ],
      // confirmar com cliente: destinos ilustrativos dentro de PE e BA, sem rótulo no mapa
      routes: [
        { from: "Suape", lon: -35.98, lat: -8.28 },
        { from: "Suape", lon: -36.49, lat: -8.89 },
        { from: "Suape", lon: -40.5, lat: -9.39 },
        { from: "Suape", lon: -38.5, lat: -12.97 },
        { from: "Salvador", lon: -38.97, lat: -12.27 },
        { from: "Salvador", lon: -40.84, lat: -14.86 },
        { from: "Salvador", lon: -45.0, lat: -12.15 },
        { from: "Salvador", lon: -40.5, lat: -9.41 },
      ],
    },
    finalCta: {
      code: "Contato",
      title: "Fale com um especialista",
      text: "Cotação de transporte de containers, armazenagem e entregas fracionadas. Atendimento 24 h.",
    },
  },

  nav,

  legal: { privacy: { href: "/privacidade", label: "Política de Privacidade" } },

  ui: {
    openMenu: "Menu",
    closeMenu: "Fechar",
    menuLabel: "Menu principal",
    footerNav: "Mapa do site",
    zip: "CEP",
    phone: "Telefone",
    email: "E-mail (RH)",
    whatsappLabel: "Falar no WhatsApp",
    // The journey's side index: its name and each mark's label ("Ir para" + the scene).
    journeyNav: "Cenas da jornada",
    goTo: "Ir para",
    whatsappMessage: "Olá, vim pelo site e gostaria de uma cotação.",
  },

  gallery: [] as { src: string; alt: string }[],
  clients: [] as { name: string; logo: string }[],
};
