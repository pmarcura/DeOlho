// Dados sintéticos de Americana, SP — IBGE 3501608
// Baseados na estrutura do PNCP e Portal da Transparência.
// Substituir por dados reais após scraper operacional.

export const MUNICIPIO = {
  nome: "Americana",
  uf: "SP",
  ibge: "3501608",
  populacao: 241_332,
  orcamento_2025: 1_087_500_000,
} as const;

// Receita por origem (estimativa orçamento 2025)
export const receitaOrigem = [
  { categoria: "FPM", valor: 98_000_000, cor: "#e05a00" },
  { categoria: "ICMS", valor: 187_000_000, cor: "#c94f0a" },
  { categoria: "ISS", valor: 143_000_000, cor: "#f07830" },
  { categoria: "IPTU", valor: 78_000_000, cor: "#f59c58" },
  { categoria: "Convênios", valor: 64_000_000, cor: "#f8bc8a" },
  { categoria: "Outros", valor: 517_500_000, cor: "#3a3a3a" },
];

// Despesa por secretaria
export const despesaSecretaria = [
  { secretaria: "Saúde", valor: 326_250_000, pct: 30, cor: "#e05a00" },
  { secretaria: "Educação", valor: 228_375_000, pct: 21, cor: "#c94f0a" },
  { secretaria: "Infraestrutura", valor: 130_500_000, pct: 12, cor: "#f07830" },
  { secretaria: "Assistência Social", valor: 108_750_000, pct: 10, cor: "#f59c58" },
  { secretaria: "Administração", valor: 87_000_000, pct: 8, cor: "#f8bc8a" },
  { secretaria: "Segurança", valor: 65_250_000, pct: 6, cor: "#fdd8b8" },
  { secretaria: "Meio Ambiente", valor: 43_500_000, pct: 4, cor: "#4a4a4a" },
  { secretaria: "Outras", valor: 97_875_000, pct: 9, cor: "#3a3a3a" },
];

// Contratos por mês — PNCP (out/2024 → mai/2026)
export const contratosPorMes = [
  { mes: "Out/24", contratos: 34, valor: 8_200_000 },
  { mes: "Nov/24", contratos: 28, valor: 6_100_000 },
  { mes: "Dez/24", contratos: 19, valor: 4_800_000 },
  { mes: "Jan/25", contratos: 41, valor: 12_400_000 },
  { mes: "Fev/25", contratos: 56, valor: 18_700_000 },
  { mes: "Mar/25", contratos: 63, valor: 22_100_000 },
  { mes: "Abr/25", contratos: 72, valor: 31_500_000 },
  { mes: "Mai/25", contratos: 58, valor: 24_900_000 },
  { mes: "Jun/25", contratos: 49, valor: 19_300_000 },
  { mes: "Jul/25", contratos: 67, valor: 28_600_000 },
  { mes: "Ago/25", contratos: 81, valor: 35_200_000 },
  { mes: "Set/25", contratos: 74, valor: 29_800_000 },
  { mes: "Out/25", contratos: 68, valor: 26_100_000 },
  { mes: "Nov/25", contratos: 52, valor: 21_400_000 },
  { mes: "Dez/25", contratos: 38, valor: 15_700_000 },
  { mes: "Jan/26", contratos: 44, valor: 17_900_000 },
  { mes: "Fev/26", contratos: 59, valor: 23_500_000 },
  { mes: "Mar/26", contratos: 77, valor: 38_400_000 },
  { mes: "Abr/26", contratos: 83, valor: 41_200_000 },
  { mes: "Mai/26", contratos: 71, valor: 33_700_000 },
];

// Top empresas contratadas (valor total de contratos)
export const topEmpresas = [
  { empresa: "Construções Paulista S/A", cnpj: "12.345.678/0001-90", valor: 48_700_000, contratos: 12 },
  { empresa: "MedFarma Distribuidora", cnpj: "23.456.789/0001-01", valor: 37_200_000, contratos: 8 },
  { empresa: "Omega Engenharia Ltda", cnpj: "34.567.890/0001-12", valor: 31_900_000, contratos: 7 },
  { empresa: "TechGov Sistemas", cnpj: "45.678.901/0001-23", valor: 24_600_000, contratos: 15 },
  { empresa: "Educa Fornecimentos", cnpj: "56.789.012/0001-34", valor: 19_800_000, contratos: 23 },
  { empresa: "Saúde Total ME", cnpj: "67.890.123/0001-45", valor: 16_300_000, contratos: 11 },
  { empresa: "Via Asfalto SP", cnpj: "78.901.234/0001-56", valor: 14_100_000, contratos: 6 },
  { empresa: "Limpeza Certa Ambiental", cnpj: "89.012.345/0001-67", valor: 11_700_000, contratos: 4 },
];

// Modalidades de licitação
export const modalidades = [
  { modalidade: "Pregão Eletrônico", pct: 48, valor: 221_400_000 },
  { modalidade: "Dispensa", pct: 22, valor: 101_400_000 },
  { modalidade: "Inexigibilidade", pct: 14, valor: 64_500_000 },
  { modalidade: "Concorrência", pct: 10, valor: 46_100_000 },
  { modalidade: "Outros", pct: 6, valor: 27_600_000 },
];

// Últimos contratos
export const ultimosContratos = [
  {
    numero: "2026/042",
    objeto: "Aquisição de medicamentos para UBS",
    contratada: "MedFarma Distribuidora",
    secretaria: "Saúde",
    valor: 2_340_000,
    data: "2026-05-20",
    modalidade: "Pregão Eletrônico",
  },
  {
    numero: "2026/041",
    objeto: "Manutenção de vias públicas — Lote 3",
    contratada: "Via Asfalto SP",
    secretaria: "Infraestrutura",
    valor: 1_870_000,
    data: "2026-05-19",
    modalidade: "Pregão Eletrônico",
  },
  {
    numero: "2026/040",
    objeto: "Merenda escolar — 2º semestre 2026",
    contratada: "Educa Fornecimentos",
    secretaria: "Educação",
    valor: 3_120_000,
    data: "2026-05-17",
    modalidade: "Pregão Eletrônico",
  },
  {
    numero: "2026/039",
    objeto: "Serviços de TI — helpdesk",
    contratada: "TechGov Sistemas",
    secretaria: "Administração",
    valor: 480_000,
    data: "2026-05-15",
    modalidade: "Dispensa",
  },
  {
    numero: "2026/038",
    objeto: "Obras de drenagem pluvial — Monte Libano",
    contratada: "Omega Engenharia Ltda",
    secretaria: "Infraestrutura",
    valor: 4_780_000,
    data: "2026-05-14",
    modalidade: "Concorrência",
  },
];

export function formatBRL(valor: number): string {
  if (valor >= 1_000_000_000) {
    return `R$ ${(valor / 1_000_000_000).toFixed(1).replace(".", ",")} bi`;
  }
  if (valor >= 1_000_000) {
    return `R$ ${(valor / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  }
  if (valor >= 1_000) {
    return `R$ ${(valor / 1_000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export function formatBRLFull(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}
