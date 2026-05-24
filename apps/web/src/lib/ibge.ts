// IBGE public API — no auth required
// Docs: https://servicodados.ibge.gov.br/api/docs

const BASE = "https://servicodados.ibge.gov.br/api";

export interface MunicipioInfo {
  id: number;
  nome: string;
  uf: { sigla: string; nome: string };
  microrregiao: { nome: string };
  mesorregiao: { nome: string };
}

export interface SidraResult {
  variavel: string;
  unidade: string;
  valor: number;
  ano: string;
}

export interface PibMunicipal {
  municipio: string;
  ibge: string;
  uf: string;
  ano: string;
  pibTotal: number;       // mil R$
  agropecuaria: number;   // mil R$
  industria: number;      // mil R$
  servicos: number;       // mil R$
  outrosImpostos: number; // mil R$
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 86_400 } }); // 24h cache
  if (!res.ok) throw new Error(`IBGE ${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function sidraValue(agregado: number, variavel: number, municipio: string, ano = "2021"): Promise<number> {
  const url = `${BASE}/v3/agregados/${agregado}/periodos/${ano}/variaveis/${variavel}?localidades=N6[${municipio}]`;
  type SidraRow = { resultados: { series: { serie: Record<string, string> }[] }[] }[];
  const data = await fetchJSON<SidraRow>(url);
  const raw = data[0]?.resultados[0]?.series[0]?.serie[ano];
  return raw ? Number(raw) : 0;
}

export async function getMunicipioInfo(ibge: string): Promise<MunicipioInfo> {
  type Raw = { id: number; nome: string; microrregiao: { nome: string; mesorregiao: { nome: string; UF: { sigla: string; nome: string } } } };
  const raw = await fetchJSON<Raw>(`${BASE}/v1/localidades/municipios/${ibge}`);
  return {
    id: raw.id,
    nome: raw.nome,
    uf: { sigla: raw.microrregiao.mesorregiao.UF.sigla, nome: raw.microrregiao.mesorregiao.UF.nome },
    microrregiao: { nome: raw.microrregiao.nome },
    mesorregiao: { nome: raw.microrregiao.mesorregiao.nome },
  };
}

export async function getPibMunicipal(ibge: string, ano = "2021"): Promise<PibMunicipal> {
  const [pibTotal, agropecuaria, industria, servicos] = await Promise.all([
    sidraValue(5938, 37, ibge, ano),    // PIB a preços correntes
    sidraValue(5938, 513, ibge, ano),   // VAB agropecuária
    sidraValue(5938, 517, ibge, ano),   // VAB indústria
    sidraValue(5938, 6575, ibge, ano),  // VAB serviços (excl APU)
  ]);

  return {
    municipio: "Americana",
    ibge,
    uf: "SP",
    ano,
    pibTotal,
    agropecuaria,
    industria,
    servicos,
    outrosImpostos: Math.max(0, pibTotal - agropecuaria - industria - servicos),
  };
}
