/**
 * Catálogo cívico do DeOlho — APENAS dados reais ou estruturais (sem fixtures).
 *
 * Removido o conteúdo sintético anterior. As páginas agora carregam:
 *  - Edições reais do Diário (lib/diario.ts)
 *  - CNPJs reais via BrasilAPI (lib/brasilapi.ts)
 *  - Sanções reais via CGU (lib/ceis.ts)
 */
import type { TerritorioItem } from "./civic-types";

/** Catálogo territorial real (códigos IBGE oficiais). */
export const TERRITORIOS: TerritorioItem[] = [
  { id: "br", label: "Brasil", tipo: "brasil" },
  { id: "sp", label: "São Paulo", tipo: "estado" },
  { id: "americana", label: "Americana", tipo: "cidade" },
  { id: "saude", label: "Saúde", tipo: "tema" },
  { id: "educacao", label: "Educação", tipo: "tema" },
  { id: "infra", label: "Infraestrutura", tipo: "tema" },
  { id: "cultura", label: "Cultura", tipo: "tema" },
];

/**
 * Bairros conhecidos de Americana. Lista MANUAL e estrutural — usada apenas para
 * navegação geo enquanto a tipagem por bairro nos dados públicos não existir.
 * Quando houver atos/contratos com bairro real, esta lista pode evoluir para vir
 * da fonte (CT/UF nos dados do município).
 */
export const BAIRROS_AMERICANA = [
  "Centro",
  "Vila Belvedere",
  "Antônio Zanaga",
  "Jardim São Domingos",
  "Cidade Jardim",
  "Mathiensen",
  "Praia Azul",
  "Jardim Werner Plaas",
  "Jardim Brasília",
  "São Vito",
] as const;

/**
 * CNPJs reais EXTRAÍDOS do Diário Oficial de Americana
 * (checksum-validados em mappers/diario-mentions.ts em 25/05).
 * Servem como pontos de entrada reais pra páginas de empresa.
 */
export const CNPJS_DO_DIARIO = [
  "47145224000155",
  "23228076000174",
] as const;
