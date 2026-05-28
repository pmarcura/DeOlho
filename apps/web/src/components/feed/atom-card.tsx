/**
 * AtomCard — post atômico do feed (1 contrato = 1 post, 1 lei = 1 post...).
 *
 * Hierarquia depois do feedback do Pedro (28/05):
 *  1. Header: autor + verified + tempo + CHIP de categoria (pequeno, cor sutil)
 *  2. TÍTULO em destaque (text-xl bold)
 *  3. Valor R$ grande (só pra atos de dinheiro)
 *  4. Resumo legível com MENÇÕES INLINE clicáveis (Lei nº, CNPJ etc.)
 *  5. "o que é isso?" expansível (glossário pra leigo)
 *  6. Origem da edição + fonte oficial
 *  7. Reactions (4: 👀 🤔 💸 🚩) + save/share
 *
 * Sem emoji-block dominando o card. Tipo identifica via chip de categoria.
 */
import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrustHint } from "./trust-hint";
import { FonteChip } from "./fonte-chip";
import { ReacaoCivica } from "./reacao-civica";
import { SaveShare } from "./save-share";
import { TextoComMencoes } from "./entity-highlight";
import { TipoExplicacao } from "./tipo-explicacao";
import { TIPO_META, limparResumo, type Atom } from "@/lib/atoms";

function dataAmigavel(iso: string | null): string {
  if (!iso) return "edição sem data";
  const d = new Date(iso + "T12:00:00");
  const dias = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  if (dias < 30) return `há ${Math.floor(dias / 7)} sem`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function rotuloOrigem(iso: string | null): string {
  if (!iso) return "edição em destaque";
  const fmt = new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
  return `edição de ${fmt}`;
}

// Cor de chip de categoria — sutil, não compete com o título.
const CATEGORIA_CHIP: Record<string, string> = {
  dinheiro: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  leis: "bg-amber-50 text-amber-800 ring-amber-200/70",
  atos: "bg-sky-50 text-sky-700 ring-sky-200/70",
  convenios: "bg-teal-50 text-teal-700 ring-teal-200/70",
};

export function AtomCard({ atom, className }: { atom: Atom; className?: string }) {
  const meta = TIPO_META[atom.tipo];
  const isMoney = [
    "contrato",
    "aditivo",
    "pregao",
    "convite",
    "concorrencia",
    "ata_registro",
    "edital",
  ].includes(atom.tipo);
  const chipCls = CATEGORIA_CHIP[meta.cat] ?? "bg-foreground/5 text-foreground";

  return (
    <article
      className={cn(
        "rounded-3xl bg-card shadow-sm overflow-hidden border border-border/40",
        className,
      )}
    >
      {/* Header — autor + categoria + tempo */}
      <header className="flex items-center gap-3 px-5 pt-4 pb-1">
        <span
          aria-hidden
          className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold shrink-0"
        >
          PA
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold truncate">Prefeitura de Americana</p>
            <TrustHint level="oficial" />
          </div>
          <p className="text-xs text-muted-foreground">{dataAmigavel(atom.edicaoDate)}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 text-[11px] font-medium shrink-0",
            chipCls,
          )}
        >
          <span aria-hidden>{meta.emoji}</span>
          {meta.label.toLowerCase()}
        </span>
      </header>

      {/* Título */}
      <div className="px-5 pt-2 pb-1">
        <Link
          href={`/ato/${atom.id}`}
          className="block hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
        >
          <h3 className="text-[1.35rem] font-bold tracking-tight leading-tight">
            {atom.titulo}
          </h3>
        </Link>

        {/* Valor em destaque pra dinheiro */}
        {isMoney && atom.valorMencionado && (
          <p className="text-[var(--political)] text-2xl font-bold tabular-nums tracking-tight leading-none mt-2">
            {atom.valorMencionado}
          </p>
        )}
      </div>

      {/* Resumo com menções inline destacadas */}
      <div className="px-5 pt-3 pb-3">
        <TextoComMencoes
          texto={limparResumo(atom.resumo)}
          className="text-[15px] text-foreground/85"
        />
      </div>

      {/* "o que é isso?" glossário pra leigo */}
      <div className="px-5 pb-3">
        <TipoExplicacao tipo={atom.tipo} />
      </div>

      {/* Origem (edição) + Fonte */}
      <div className="px-5 pb-3 flex items-center justify-between gap-2 border-t border-border/30 pt-3">
        <Link
          href={`/diario/${atom.edicaoSlug}`}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <FileText className="w-3 h-3" aria-hidden />
          {rotuloOrigem(atom.edicaoDate)}
        </Link>
        <FonteChip
          label="@prefeitura-americana"
          url="https://www.americana.sp.gov.br"
        />
      </div>

      {/* Reactions + save/share */}
      <footer className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-border/30">
        <ReacaoCivica />
        <SaveShare shareTitle={atom.titulo} shareUrl={`/ato/${atom.id}`} />
      </footer>
    </article>
  );
}
