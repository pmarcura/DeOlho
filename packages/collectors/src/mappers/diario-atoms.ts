import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { closeDb, getDb } from "../utils/ingest.js";
import { AMERICANA } from "../config.js";
import { temSinalZeladoria, type TerritorioMention } from "../utils/territory.js";
import { upsertCivicEvent, upsertEvidence } from "../utils/civic.js";

type TipoAto =
  | "lei"
  | "decreto"
  | "portaria"
  | "resolucao"
  | "contrato"
  | "aditivo"
  | "edital"
  | "pregao"
  | "convite"
  | "concorrencia"
  | "convenio"
  | "ata_registro"
  | "indefinido";

interface AtomPessoa {
  nome: string;
  slug: string;
  papel: string;
  cargo: string | null;
}

interface AtomOrgao {
  nome: string;
  slug: string;
  sigla: string | null;
}

interface Atom {
  id: string;
  edicaoSlug: string;
  edicaoDate: string | null;
  tipo: TipoAto;
  numero: string;
  ano: string | null;
  titulo: string;
  resumo: string;
  posicao: number;
  cnpjsMencionados: string[];
  valorMencionado: string | null;
  territorios?: TerritorioMention[];
  tituloHumano?: string | null;
  subtitulo?: string | null;
  resumoLimpo?: string;
  textoDocumento?: string;
  pessoas?: AtomPessoa[];
  orgaos?: AtomOrgao[];
}

interface AtomsFile {
  atomos: Atom[];
}

const ATOMS_JSON = path.resolve(process.cwd(), "data/diario-americana/atoms.json");

function sourceUrl(atom: Atom): string {
  return `https://www.americana.sp.gov.br/download/diarioOficial/${atom.edicaoSlug}.pdf`;
}

function valorNumero(valor: string | null): number {
  if (!valor) return 0;
  const m = valor.match(/R\$\s*([\d.]+,\d{2})/);
  if (!m) return 0;
  return Number.parseFloat(m[1]!.replace(/\./g, "").replace(",", "."));
}

function categoria(atom: Atom):
  | "contratacao"
  | "obra_zeladoria"
  | "ato_normativo"
  | "nomeacao_exoneracao"
  | "audiencia_conselho"
  | "limitacao_fonte" {
  const texto = `${atom.titulo} ${atom.resumo}`;
  if (["contrato", "aditivo", "edital", "pregao", "convite", "concorrencia", "ata_registro", "convenio"].includes(atom.tipo)) {
    return temSinalZeladoria(texto) ? "obra_zeladoria" : "contratacao";
  }
  if (atom.tipo === "portaria" && atom.pessoas?.some((p) => ["nomeado", "exonerado", "designado"].includes(p.papel))) {
    return "nomeacao_exoneracao";
  }
  if (/\b(?:audi[êe]ncia|conselho)\b/i.test(texto)) return "audiencia_conselho";
  if (temSinalZeladoria(texto)) return "obra_zeladoria";
  if (atom.tipo === "indefinido") return "limitacao_fonte";
  return "ato_normativo";
}

function tipoEvento(atom: Atom): "ato_publicado" | "contrato_publicado" | "contrato_atualizado" | "limitacao_detectada" {
  if (atom.tipo === "contrato" || atom.tipo === "pregao" || atom.tipo === "edital" || atom.tipo === "ata_registro") {
    return "contrato_publicado";
  }
  if (atom.tipo === "aditivo") return "contrato_atualizado";
  if (atom.tipo === "indefinido") return "limitacao_detectada";
  return "ato_publicado";
}

function titulo(atom: Atom): string {
  if (atom.tituloHumano) return atom.tituloHumano;
  if (atom.tipo === "indefinido") return "Publicação oficial sem classificação automática";
  return atom.titulo;
}

function resumo(atom: Atom): string {
  return atom.subtitulo ?? atom.textoDocumento ?? atom.resumoLimpo ?? atom.resumo;
}

function limitacoes(atom: Atom): Array<{ campo: string; mensagem: string; tipo?: string; fonte?: string }> | null {
  const out: Array<{ campo: string; mensagem: string; tipo?: string; fonte?: string }> = [];
  if (atom.tipo === "indefinido") {
    out.push({
      campo: "tipo",
      mensagem: "A publicação foi segmentada, mas ainda não foi classificada com segurança.",
      tipo: "dado_ausente",
      fonte: "diario-americana",
    });
  }
  if (!atom.edicaoDate) {
    out.push({
      campo: "data pública",
      mensagem: "O Diário Oficial de Americana não informou data para esta publicação; ela não deve ser tratada como recente.",
      tipo: "dado_ausente",
      fonte: "diario-americana",
    });
  }
  return out.length > 0 ? out : null;
}

export async function mapearAtomosDiario(): Promise<void> {
  const db = getDb();
  if (!db) {
    console.error("[map:diario-atoms] DATABASE_URL não definida.");
    return;
  }

  let parsed: AtomsFile;
  try {
    parsed = JSON.parse(await fs.readFile(ATOMS_JSON, "utf8")) as AtomsFile;
  } catch (e) {
    console.error(`[map:diario-atoms] não foi possível ler ${ATOMS_JSON}: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }

  let n = 0;
  for (const atom of parsed.atomos) {
    const valor = valorNumero(atom.valorMencionado);
    const url = sourceUrl(atom);
    const civicEventId = await upsertCivicEvent(db, {
      sourceId: "diario-americana",
      sourceKey: atom.id,
      tipo: tipoEvento(atom),
      categoria: categoria(atom),
      titulo: titulo(atom),
      resumo: resumo(atom).slice(0, 1200),
      dataEvento: atom.edicaoDate,
      valor: valor > 0 ? String(valor) : null,
      municipioIbge: AMERICANA.ibge,
      uf: AMERICANA.uf,
      territorio: {
        municipio: AMERICANA.nome,
        ibge: AMERICANA.ibge,
        uf: AMERICANA.uf,
        mencoes: atom.territorios ?? [],
      },
      entidades: {
        cnpjs: atom.cnpjsMencionados,
        pessoas: atom.pessoas ?? [],
        orgaos: atom.orgaos ?? [],
      },
      limitacoes: limitacoes(atom),
      sourceUrl: url,
      publishedAt: atom.edicaoDate ? new Date(atom.edicaoDate) : null,
      fetchedAt: null,
      trustType: atom.tipo === "indefinido" ? "sinal_atencao" : "fato_oficial",
    });

    await upsertEvidence(db, {
      evidenceKey: `diario-americana:${atom.id}:trecho`,
      civicEventId,
      sourceId: "diario-americana",
      sourceKey: atom.id,
      fieldPath: "textoDocumento",
      titulo: "Trecho do Diário Oficial de Americana",
      sourceUrl: url,
      trecho: atom.textoDocumento ?? atom.resumo,
      posicaoInicio: atom.posicao,
      posicaoFim: atom.posicao + atom.resumo.length,
      metodoExtracao: atom.tipo === "indefinido" ? "pdf-segmentacao" : "pdf-regex",
      publishedAt: atom.edicaoDate ? new Date(atom.edicaoDate) : null,
      trustType: "fato_oficial",
    });
    n++;
  }

  console.log(`[map:diario-atoms] ${n} eventos/evidências gerados a partir dos átomos do Diário`);
}

if (
  process.argv[1]?.endsWith("diario-atoms.ts") ||
  process.argv[1]?.endsWith("diario-atoms.js")
) {
  mapearAtomosDiario()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => closeDb());
}
