/**
 * TextoComMencoes — texto vivo. Detecta e destaca, em ordem natural:
 *  - Refs jurídicas (Lei/Decreto/Portaria/Pregão/Contrato/…) → /ref/[slug]
 *  - Nº de processo administrativo                           → /ref/[slug]
 *  - CNPJ (checksum-válido)                                  → /empresa/[cnpj]
 *  - Pessoas (agentes públicos citados, exatos)              → /pessoa/[slug]
 *  - Órgãos (Secretarias, DAE, Guarda Municipal…)            → /orgao/[slug]
 *  - "Artigo Nº" → tooltip explicando o que é um artigo
 *  - Termos do glossário → <TermoTooltip> clicável inline
 *
 * Sobreposições mantêm o primeiro match (refs/pessoas/órgãos têm prioridade
 * sobre glossário).
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { cnpjValido, normalizarDocumento } from "@/lib/documento";
import { detectarTermos } from "@/lib/glossary";
import { TermoTooltip } from "./termo-tooltip";
import type { PessoaCitada, OrgaoCitado } from "@/lib/atoms";

type GrupoRef = "lei" | "ato" | "dinheiro" | "empresa" | "pessoa" | "orgao" | "processo" | "artigo" | "glossario";
type RefTipo = "lei" | "decreto" | "portaria" | "resolucao" | "edital" | "pregao" | "contrato" | "concorrencia" | "aditivo";

interface MatchRef {
  start: number;
  end: number;
  texto: string;
  href?: string;
  termo?: string;
  definicao?: string;
  grupo: GrupoRef;
}

const PADROES: Array<{ tipo: RefTipo; regex: RegExp; grupo: MatchRef["grupo"] }> = [
  { tipo: "lei", grupo: "lei", regex: /\b(?:LEI(?:\s+MUNICIPAL|\s+COMPLEMENTAR)?|Lei(?:\s+Municipal|\s+Complementar)?)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "decreto", grupo: "ato", regex: /\b(?:DECRETO|Decreto)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "portaria", grupo: "ato", regex: /\b(?:PORTARIA|Portaria)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "resolucao", grupo: "ato", regex: /\b(?:RESOLU[ÇC][ÃA]O|Resolu[çc][ãa]o)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "edital", grupo: "dinheiro", regex: /\b(?:EDITAL|Edital)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "pregao", grupo: "dinheiro", regex: /\b(?:PREG[ÃA]O|Preg[ãa]o)(?:\s+(?:ELETR[ÔO]NICO|Eletr[ôo]nico|PRESENCIAL|Presencial))?\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "contrato", grupo: "dinheiro", regex: /\b(?:CONTRATO|Contrato)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "concorrencia", grupo: "dinheiro", regex: /\b(?:CONCORR[ÊE]NCIA|Concorr[êe]ncia)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "aditivo", grupo: "dinheiro", regex: /\b(?:TERMO\s+ADITIVO|Termo\s+Aditivo|ADITIVO|Aditivo)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
];

const CNPJ_RE = /\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-\s]?\d{2}/g;
// Processo administrativo: "Processo nº 818/2025", "Proc. Adm. Dig. nº 739/2025"
const PROCESSO_RE = /\b(?:Processo|PROCESSO|Proc\.?)\s*(?:Adm\.?|ADMINISTRATIVO|Administrativo)?\s*(?:Dig\.?|DIGITAL|Digital)?\s*(?:N|n)?[º°.]?\s*([\d][\d.]*\/\d{2,4})/g;
// Artigo de lei: "Art. 5º", "artigo 12", "Art. 3°, inciso II"
const ARTIGO_RE = /\b(?:Art(?:igo)?\.?)\s*(\d+)\s*[ºo°]?(?:\s*,?\s*(?:inciso|§|par[áa]grafo)\s*[\wIVXºo°]+)?/gi;

const DEF_ARTIGO = "Artigo: cada regra numerada dentro de uma lei ou decreto. O “caput” é o texto principal; incisos (I, II…) e parágrafos (§) detalham exceções e casos.";

function slugRef(tipo: RefTipo, numero: string, ano: string | null): string {
  const numLimpo = numero.replace(/\.+$/, "").replace(/\./g, "");
  return `${tipo}-${numLimpo}${ano ? `-${ano}` : ""}`;
}

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findMatches(
  texto: string,
  pessoas: PessoaCitada[] = [],
  orgaos: OrgaoCitado[] = [],
): MatchRef[] {
  const matches: MatchRef[] = [];

  for (const { tipo, grupo, regex } of PADROES) {
    regex.lastIndex = 0;
    let safety = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(texto)) !== null && safety < 50) {
      safety++;
      const numero = (m[1] ?? "").replace(/\.+$/, "").trim();
      if (!numero || numero === "0") continue;
      const ano = (m[2] ?? "").trim() || null;
      matches.push({ start: m.index, end: m.index + m[0].length, texto: m[0], href: `/ref/${slugRef(tipo, numero, ano)}`, grupo });
    }
  }

  CNPJ_RE.lastIndex = 0;
  let sc = 0;
  let c: RegExpExecArray | null;
  while ((c = CNPJ_RE.exec(texto)) !== null && sc < 50) {
    sc++;
    const doc = normalizarDocumento(c[0]);
    if (!doc || doc.length !== 14 || !cnpjValido(doc)) continue;
    matches.push({ start: c.index, end: c.index + c[0].length, texto: c[0], href: `/empresa/${doc}`, grupo: "empresa" });
  }

  // Pessoas — match literal (case-insensitive) do nome extraído.
  for (const p of pessoas) {
    if (!p.nome || p.nome.length < 5) continue;
    const re = new RegExp(esc(p.nome), "gi");
    let safety = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(texto)) !== null && safety < 10) {
      safety++;
      matches.push({ start: m.index, end: m.index + m[0].length, texto: m[0], href: `/pessoa/${p.slug}`, grupo: "pessoa" });
    }
  }

  // Órgãos — nome canônico (com " de Americana" opcional) + sigla.
  for (const o of orgaos) {
    const alts: string[] = [];
    const semAmericana = o.nome.replace(/\s+de\s+Americana$/i, "");
    alts.push(esc(o.nome));
    if (semAmericana !== o.nome) alts.push(esc(semAmericana));
    if (o.sigla) alts.push(`\\b${esc(o.sigla)}\\b`);
    const re = new RegExp(alts.join("|"), "gi");
    let safety = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(texto)) !== null && safety < 12) {
      safety++;
      if (m[0].length < 3) continue;
      matches.push({ start: m.index, end: m.index + m[0].length, texto: m[0], href: `/orgao/${o.slug}`, grupo: "orgao" });
    }
  }

  // Processo administrativo.
  PROCESSO_RE.lastIndex = 0;
  let sp = 0;
  let pm: RegExpExecArray | null;
  while ((pm = PROCESSO_RE.exec(texto)) !== null && sp < 30) {
    sp++;
    const num = (pm[1] ?? "").trim();
    if (!num) continue;
    const slug = `processo-${num.replace(/\D+/g, "-").replace(/^-+|-+$/g, "")}`;
    matches.push({ start: pm.index, end: pm.index + pm[0].length, texto: pm[0], href: `/ref/${slug}`, grupo: "processo" });
  }

  // Artigo — tooltip educativo.
  ARTIGO_RE.lastIndex = 0;
  let sa = 0;
  let am: RegExpExecArray | null;
  while ((am = ARTIGO_RE.exec(texto)) !== null && sa < 40) {
    sa++;
    matches.push({ start: am.index, end: am.index + am[0].length, texto: am[0], termo: "Artigo", definicao: DEF_ARTIGO, grupo: "artigo" });
  }

  for (const o of detectarTermos(texto)) {
    matches.push({ start: o.start, end: o.end, texto: o.match, termo: o.termo, definicao: o.definicao, grupo: "glossario" });
  }

  matches.sort((a, b) => a.start - b.start);
  const out: MatchRef[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start < cursor) continue;
    out.push(m);
    cursor = m.end;
  }
  return out;
}

const GRUPO_CLS: Record<Exclude<MatchRef["grupo"], "glossario" | "artigo">, string> = {
  lei: "bg-amber-50 text-amber-800 ring-amber-200/70 hover:bg-amber-100",
  ato: "bg-sky-50 text-sky-800 ring-sky-200/70 hover:bg-sky-100",
  dinheiro: "bg-emerald-50 text-emerald-800 ring-emerald-200/70 hover:bg-emerald-100",
  empresa: "bg-violet-50 text-violet-800 ring-violet-200/70 hover:bg-violet-100",
  pessoa: "bg-rose-50 text-rose-800 ring-rose-200/70 hover:bg-rose-100",
  orgao: "bg-indigo-50 text-indigo-800 ring-indigo-200/70 hover:bg-indigo-100",
  processo: "bg-zinc-100 text-zinc-700 ring-zinc-200 hover:bg-zinc-200",
};

export function TextoComMencoes({
  texto,
  className,
  pessoas,
  orgaos,
}: {
  texto: string;
  className?: string;
  pessoas?: PessoaCitada[];
  orgaos?: OrgaoCitado[];
}): ReactNode {
  const matches = findMatches(texto, pessoas, orgaos);
  if (matches.length === 0) {
    return <span className={className}>{texto}</span>;
  }

  const pieces: ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]!;
    if (m.start > cursor) pieces.push(texto.slice(cursor, m.start));
    if ((m.grupo === "glossario" || m.grupo === "artigo") && m.termo && m.definicao) {
      pieces.push(
        <TermoTooltip key={`m-${i}`} termo={m.termo} definicao={m.definicao}>
          {m.texto}
        </TermoTooltip>,
      );
    } else if (m.href) {
      pieces.push(
        <Link
          key={`m-${i}`}
          href={m.href}
          className={cn(
            "inline rounded-md px-1 py-0.5 text-[0.93em] font-medium ring-1 transition-colors whitespace-nowrap",
            GRUPO_CLS[m.grupo as Exclude<MatchRef["grupo"], "glossario" | "artigo">],
          )}
        >
          {m.texto}
        </Link>,
      );
    } else {
      pieces.push(m.texto);
    }
    cursor = m.end;
  }
  if (cursor < texto.length) pieces.push(texto.slice(cursor));

  return (
    <span className={cn("leading-relaxed", className)}>
      {pieces.map((p, i) => <span key={i}>{p}</span>)}
    </span>
  );
}
