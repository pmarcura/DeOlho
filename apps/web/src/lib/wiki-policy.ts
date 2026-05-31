export type WikiEntityKind =
  | "cidade"
  | "territorio"
  | "orgao"
  | "unidade_orgao"
  | "lugar_publico"
  | "empresa"
  | "pessoa_publica"
  | "pessoa_comum"
  | "lei"
  | "conceito_publico";

const TIPOS_PERMITIDOS = new Set<WikiEntityKind>([
  "cidade",
  "territorio",
  "orgao",
  "unidade_orgao",
  "lugar_publico",
  "empresa",
  "pessoa_publica",
  "lei",
  "conceito_publico",
]);

export function podeEnriquecerComWikipedia(tipo: WikiEntityKind): boolean {
  return TIPOS_PERMITIDOS.has(tipo);
}
