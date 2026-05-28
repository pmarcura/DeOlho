/**
 * TextoComMencoes — pega o trecho cru do diário e destaca referências
 * (Lei/Decreto/Portaria/Edital/Pregão + número/ano, CNPJ) como links
 * clicáveis. É o "texto vivo" que o Pedro pediu.
 *
 * CNPJ (checksum-válido) → /empresa/[cnpj]
 * Demais referências → /ref/<tipo>-<numero>-<ano> (cross-reference)
 *
 * Mantém o resto do texto inalterado. Resiliente a noise do PDF
 * (números com pontos, espaços extras).
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { cnpjValido, normalizarDocumento } from "@/lib/documento";

// Tipo de referência inline (subset dos átomos — só os que costumam ser citados).
type RefTipo = "lei" | "decreto" | "portaria" | "resolucao" | "edital" | "pregao" | "contrato" | "concorrencia" | "aditivo";

interface MatchRef {
  start: number;
  end: number;
  texto: string;
  // Quando linkado:
  href: string;
  // Visual chip color group:
  grupo: "lei" | "ato" | "dinheiro" | "empresa";
}

// Padrões — case-insensitive, capturando número e ano opcional.
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

// CNPJ — com ou sem máscara + tolerante a espaço (igual extrairCnpjs).
const CNPJ_RE = /\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-\s]?\d{2}/g;

function slugRef(tipo: RefTipo, numero: string, ano: string | null): string {
  const numLimpo = numero.replace(/\.+$/, "").replace(/\./g, "");
  return `${tipo}-${numLimpo}${ano ? `-${ano}` : ""}`;
}

function findMatches(texto: string): MatchRef[] {
  const matches: MatchRef[] = [];

  // Refs de atos (lei/decreto/etc.)
  for (const { tipo, grupo, regex } of PADROES) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(texto))) {
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

  // CNPJ — validar checksum antes de linkar (evita falso-positivo)
  CNPJ_RE.lastIndex = 0;
  let c: RegExpExecArray | null;
  while ((c = CNPJ_RE.exec(texto))) {
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

  // Ordena por posição e remove sobreposições (mantém o primeiro)
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

const GRUPO_CLS: Record<MatchRef["grupo"], string> = {
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
    if (m.start > cursor) {
      pieces.push(texto.slice(cursor, m.start));
    }
    pieces.push(
      <Link
        key={`m-${i}`}
        href={m.href}
        className={cn(
          "inline rounded-md px-1 py-0.5 text-[0.93em] font-medium ring-1 transition-colors whitespace-nowrap",
          GRUPO_CLS[m.grupo],
        )}
      >
        {m.texto}
      </Link>,
    );
    cursor = m.end;
  }
  if (cursor < texto.length) pieces.push(texto.slice(cursor));

  return (
    <span className={cn("leading-relaxed", className)}>
      {pieces.map((p, i) => (
        <span key={i}>{p}</span>
      ))}
    </span>
  );
}
