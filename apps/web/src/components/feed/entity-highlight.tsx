/**
 * TextoComMencoes — texto vivo. Detecta e destaca:
 *  - Refs jurídicas (Lei/Decreto/Portaria/Pregão/Contrato/etc.) → /ref/[slug]
 *  - CNPJ (checksum-válido) → /empresa/[cnpj]
 *  - Termos do glossário → <TermoTooltip> clicável inline
 *
 * Renderiza em ordem natural do texto. Sobreposições mantêm o primeiro match.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { cnpjValido, normalizarDocumento } from "@/lib/documento";
import { detectarTermos } from "@/lib/glossary";
import { TermoTooltip } from "./termo-tooltip";

type GrupoRef = "lei" | "ato" | "dinheiro" | "empresa" | "glossario";
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
  { tipo: "lei", grupo: "lei", regex: /\b(?:LEI(?:\s+MUNICIPAL)?|Lei(?:\s+Municipal)?)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "decreto", grupo: "ato", regex: /\b(?:DECRETO|Decreto)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "portaria", grupo: "ato", regex: /\b(?:PORTARIA|Portaria)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "resolucao", grupo: "ato", regex: /\b(?:RESOLU[ÇC][ÃA]O|Resolu[çc][ãa]o)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "edital", grupo: "dinheiro", regex: /\b(?:EDITAL|Edital)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "pregao", grupo: "dinheiro", regex: /\b(?:PREG[ÃA]O|Preg[ãa]o)(?:\s+(?:ELETR[ÔO]NICO|Eletr[ôo]nico))?\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "contrato", grupo: "dinheiro", regex: /\b(?:CONTRATO|Contrato)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "concorrencia", grupo: "dinheiro", regex: /\b(?:CONCORR[ÊE]NCIA|Concorr[êe]ncia)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
  { tipo: "aditivo", grupo: "dinheiro", regex: /\b(?:TERMO\s+ADITIVO|Termo\s+Aditivo|ADITIVO|Aditivo)\s+(?:N|n)[º°.]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g },
];

const CNPJ_RE = /\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-\s]?\d{2}/g;

function slugRef(tipo: RefTipo, numero: string, ano: string | null): string {
  const numLimpo = numero.replace(/\.+$/, "").replace(/\./g, "");
  return `${tipo}-${numLimpo}${ano ? `-${ano}` : ""}`;
}

function findMatches(texto: string): MatchRef[] {
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
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        texto: m[0],
        href: `/ref/${slugRef(tipo, numero, ano)}`,
        grupo,
      });
    }
  }

  CNPJ_RE.lastIndex = 0;
  let safety = 0;
  let c: RegExpExecArray | null;
  while ((c = CNPJ_RE.exec(texto)) !== null && safety < 50) {
    safety++;
    const doc = normalizarDocumento(c[0]);
    if (!doc || doc.length !== 14 || !cnpjValido(doc)) continue;
    matches.push({
      start: c.index,
      end: c.index + c[0].length,
      texto: c[0],
      href: `/empresa/${doc}`,
      grupo: "empresa",
    });
  }

  for (const o of detectarTermos(texto)) {
    matches.push({
      start: o.start,
      end: o.end,
      texto: o.match,
      termo: o.termo,
      definicao: o.definicao,
      grupo: "glossario",
    });
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

const GRUPO_CLS: Record<Exclude<MatchRef["grupo"], "glossario">, string> = {
  lei: "bg-amber-50 text-amber-800 ring-amber-200/70 hover:bg-amber-100",
  ato: "bg-sky-50 text-sky-800 ring-sky-200/70 hover:bg-sky-100",
  dinheiro: "bg-emerald-50 text-emerald-800 ring-emerald-200/70 hover:bg-emerald-100",
  empresa: "bg-violet-50 text-violet-800 ring-violet-200/70 hover:bg-violet-100",
};

export function TextoComMencoes({
  texto,
  className,
}: {
  texto: string;
  className?: string;
}): ReactNode {
  const matches = findMatches(texto);
  if (matches.length === 0) {
    return <span className={className}>{texto}</span>;
  }

  const pieces: ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]!;
    if (m.start > cursor) pieces.push(texto.slice(cursor, m.start));
    if (m.grupo === "glossario" && m.termo && m.definicao) {
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
            GRUPO_CLS[m.grupo as Exclude<MatchRef["grupo"], "glossario">],
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
