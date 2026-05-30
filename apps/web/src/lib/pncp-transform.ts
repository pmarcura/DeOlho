import "server-only";
import fs from "node:fs";
import path from "node:path";

// Tipos inline para não importar do pacote collectors no Next.js
interface PncpContrato {
  sequencialContrato: number;
  anoContrato: number;
  numeroContrato: string;
  objetoContrato: string;
  valorInicial: number;
  valorGlobal: number;
  dataVigenciaInicio: string;
  dataVigenciaFim: string;
  dataAssinatura: string;
  situacaoContrato: { codigo: number; nome: string };
  fornecedor: { cnpjCpf: string; nomeRazaoSocial: string; tipo: string };
  receita: boolean;
}

interface ResultadoColeta<T> {
  fonte: string;
  coletadoEm: string;
  municipio: string;
  ibge: string;
  totalRegistros: number;
  dados: T[];
  erros: string[];
}

// O Next.js corre com cwd=apps/web; collectors ficam dois níveis acima
const DATA_ROOT = path.join(process.cwd(), "../../packages/collectors/data");

function readLatest<T>(fonte: string): ResultadoColeta<T> | null {
  try {
    const file = path.join(DATA_ROOT, fonte, "latest.json");
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw) as ResultadoColeta<T>;
  } catch {
    return null;
  }
}

// ── Tipos que o dashboard consome ─────────────────────────────────────────────

export type ContratoMes = { mes: string; contratos: number; valor: number };
export type EmpresaTop = { empresa: string; cnpj: string; valor: number; contratos: number };
export type UltimoContrato = {
  numero: string;
  objeto: string;
  contratada: string;
  secretaria: string;
  valor: number;
  data: string;
  modalidade: string;
};

export interface DadosPncp {
  fonte: "pncp";
  coletadoEm: string;
  totalContratos: number;
  totalValor: number;
  contratosPorMes: ContratoMes[];
  topEmpresas: EmpresaTop[];
  ultimosContratos: UltimoContrato[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function mesLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "?";
  return `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
}

function parseLabel(l: string): number {
  const [m, y] = l.split("/");
  return Number(y) * 12 + MESES.indexOf(m);
}

function cnpjFormat(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 14) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
  return raw;
}

function normalizarColetadoEm(s: string): string {
  return s.replace(/-contratos$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPncpContrato(value: unknown): value is PncpContrato {
  return isRecord(value) && typeof value.objetoContrato === "string";
}

// ── Transform ─────────────────────────────────────────────────────────────────

export function loadPncpDados(): DadosPncp | null {
  // Arquivo com sufixo "-contratos" no coletadoEm
  // O save.ts usa `coletadoEm + "-contratos"` como nome — não gera latest.json separado
  // Então o latest.json é sempre o de licitações; para contratos buscamos o timestamped mais novo
  const resultado = readLatest<PncpContrato>("pncp");
  if (!resultado) return null;

  // Se latest.json contém licitações (PncpCompra), os campos são diferentes.
  // Verificamos pela presença de "objetoContrato" no primeiro registro.
  const primeiro = resultado.dados[0];
  if (!isPncpContrato(primeiro)) {
    // São licitações, não contratos — procurar arquivo de contratos
    return loadPncpContratosTimestamped();
  }

  return transformContratos(resultado as ResultadoColeta<PncpContrato>);
}

function loadPncpContratosTimestamped(): DadosPncp | null {
  const dir = path.join(DATA_ROOT, "pncp");
  try {
    const files = fs.readdirSync(dir)
      .filter((f) => f.includes("contratos") && f.endsWith(".json"))
      .sort()
      .reverse();
    if (!files.length) return null;
    const raw = fs.readFileSync(path.join(dir, files[0]), "utf-8");
    const resultado = JSON.parse(raw) as ResultadoColeta<PncpContrato>;
    return transformContratos(resultado);
  } catch {
    return null;
  }
}

function transformContratos(resultado: ResultadoColeta<PncpContrato>): DadosPncp {
  const contratos = resultado.dados;

  // Contratos por mês
  const porMesMap = new Map<string, ContratoMes>();
  for (const c of contratos) {
    const label = mesLabel(c.dataAssinatura);
    const ex = porMesMap.get(label) ?? { mes: label, contratos: 0, valor: 0 };
    ex.contratos++;
    ex.valor += c.valorGlobal || c.valorInicial || 0;
    porMesMap.set(label, ex);
  }
  const contratosPorMes = Array.from(porMesMap.values())
    .sort((a, b) => parseLabel(a.mes) - parseLabel(b.mes));

  // Top empresas
  const porEmpresaMap = new Map<string, EmpresaTop>();
  for (const c of contratos) {
    const cnpj = cnpjFormat(c.fornecedor?.cnpjCpf ?? "");
    const ex = porEmpresaMap.get(cnpj) ?? {
      empresa: c.fornecedor?.nomeRazaoSocial ?? "Desconhecida",
      cnpj,
      valor: 0,
      contratos: 0,
    };
    ex.valor += c.valorGlobal || c.valorInicial || 0;
    ex.contratos++;
    porEmpresaMap.set(cnpj, ex);
  }
  const topEmpresas = Array.from(porEmpresaMap.values())
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);

  // Últimos contratos
  const ultimosContratos = [...contratos]
    .sort((a, b) => new Date(b.dataAssinatura).getTime() - new Date(a.dataAssinatura).getTime())
    .slice(0, 10)
    .map((c) => ({
      numero: `${c.anoContrato}/${c.numeroContrato}`,
      objeto: c.objetoContrato ?? "—",
      contratada: c.fornecedor?.nomeRazaoSocial ?? "—",
      secretaria: "—",
      valor: c.valorGlobal || c.valorInicial || 0,
      data: c.dataAssinatura,
      modalidade: c.situacaoContrato?.nome ?? "Contrato",
    }));

  return {
    fonte: "pncp",
    coletadoEm: normalizarColetadoEm(resultado.coletadoEm),
    totalContratos: contratos.length,
    totalValor: contratos.reduce((s, c) => s + (c.valorGlobal || c.valorInicial || 0), 0),
    contratosPorMes,
    topEmpresas,
    ultimosContratos,
  };
}
