/**
 * Chips clicáveis de PESSOAS e ÓRGÃOS citados num ato. Garantem descoberta
 * mesmo quando o nome não bate exatamente no texto destacado inline.
 *
 * Pessoas → /pessoa/[slug] (rose). Órgãos → /orgao/[slug] (indigo).
 * Só agentes públicos em função pública (pessoa_pública), nunca cidadão comum.
 */
import Link from "next/link";
import { Landmark, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PessoaCitada, OrgaoCitado, PapelPessoa } from "@/lib/atoms";

const PAPEL_LABEL: Record<PapelPessoa, string> = {
  signatario: "assina",
  nomeado: "nomeação",
  exonerado: "exoneração",
  designado: "designação",
  revogado: "revogação",
  citado: "citado",
};

export function PessoasChips({
  pessoas,
  className,
  max = 6,
}: {
  pessoas: PessoaCitada[];
  className?: string;
  max?: number;
}) {
  if (!pessoas || pessoas.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {pessoas.slice(0, max).map((p) => (
        <Link
          key={p.slug}
          href={`/pessoa/${p.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-800 ring-1 ring-rose-200/70 hover:bg-rose-100 transition-colors pl-1.5 pr-2.5 py-1"
        >
          <span
            aria-hidden
            className="w-5 h-5 rounded-full bg-rose-200/70 text-rose-800 flex items-center justify-center text-[10px] font-semibold shrink-0"
          >
            {p.nome.slice(0, 1)}
          </span>
          <span className="text-[12px] font-medium leading-none">{p.nome}</span>
          {p.cargo && (
            <span className="text-[10px] text-rose-700/70 leading-none hidden xs:inline">
              · {p.cargo.split(/\s+/).slice(0, 2).join(" ")}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

export function OrgaosChips({
  orgaos,
  className,
  max = 5,
}: {
  orgaos: OrgaoCitado[];
  className?: string;
  max?: number;
}) {
  if (!orgaos || orgaos.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {orgaos.slice(0, max).map((o) => (
        <Link
          key={o.slug}
          href={`/orgao/${o.slug}`}
          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200/70 hover:bg-indigo-100 transition-colors px-2.5 py-1"
        >
          <Landmark className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
          <span className="text-[12px] font-medium leading-none">{o.nome}</span>
          {o.sigla && <span className="text-[10px] text-indigo-700/70 leading-none">{o.sigla}</span>}
        </Link>
      ))}
    </div>
  );
}

export { PAPEL_LABEL };

/** Rótulo amigável pro papel principal (mais "forte") de uma pessoa. */
export function papelPrincipal(papeis: PapelPessoa[]): { label: string; icon: typeof UserRound } {
  const ordem: PapelPessoa[] = ["nomeado", "exonerado", "designado", "revogado", "signatario", "citado"];
  const p = ordem.find((x) => papeis.includes(x)) ?? "citado";
  return { label: PAPEL_LABEL[p], icon: UserRound };
}
