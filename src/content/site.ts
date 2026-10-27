export type Stat = { value: number; suffix?: string; label: string };

export type Faq = { question: string; answer: string };

export type Service = {
  slug: "containers-suape" | "operacao-bahia" | "logistica-armazenagem";
  title: string;
  summary: string;
  bullets: string[];
  faq: Faq[];
};

export type Address = {
  label: string;
  street: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zip: string;
};

export type ChapterText = {
  id: "hero" | "crane" | "load" | "highway" | "terminal" | "distribution";
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

  stats: [
    { value: 1900, suffix: " TEUs", label: "movimentados por mês, em média" },
    { value: 500, label: "entregas fracionadas por dia" },
    { value: 35000, suffix: " m²", label: "de pátio" },
    { value: 46, label: "docas niveladoras eletro-hidráulicas" },
    { value: 5000, suffix: " m²", label: "de estrutura coberta (cross-docking)" },
    { value: 4000, suffix: " TEUs", label: "de capacidade estática no terminal" },
    { value: 24, suffix: "h", label: "de atendimento" },
  ] satisfies Stat[],

  services: [
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
  ] satisfies Service[],

  differentials: [
    { title: "Frota própria", text: "Frota 100% própria, sem terceirização." },
    {
      title: "Terminal próprio integrado a Suape",
      text: "35.000 m² de pátio e capacidade para 4.000 TEUs estáticos.",
    },
    { title: "Rastreamento", text: "Todos os veículos rastreados." },
    { title: "Atendimento 24h", text: "Equipe disponível 24 horas por dia." },
  ],

  timeline: [
    { year: 1996, text: "Fundação da APG por Paulo Germano de Albuquerque Ramos." },
    // confirmar com cliente: demais marcos (anos e eventos) não estão no spec
  ],

  journey: [
    { id: "hero", text: "Transportando confiança desde 1996" },
    { id: "crane", text: "1.900 TEUs por mês" },
    { id: "load", text: "O braço rodoviário da cabotagem no Brasil" },
    { id: "highway", text: "Frota 100% própria e rastreada · 24h" },
    { id: "terminal", text: "35.000 m² · 4.000 TEUs estáticos · 46 docas" },
    { id: "distribution", text: "500 entregas fracionadas por dia" },
  ] satisfies ChapterText[],

  // confirmar com cliente
  mission:
    "Transportar e armazenar a carga dos nossos clientes com segurança e pontualidade, do porto ao destino final, com estrutura e frota próprias.",
  // confirmar com cliente
  values: ["Segurança", "Pontualidade", "Transparência", "Compromisso com o cliente"],

  cta: { quote: "Solicitar cotação", specialist: "Fale com um especialista" },

  gallery: [] as { src: string; alt: string }[],
  clients: [] as { name: string; logo: string }[],
};
