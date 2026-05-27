/**
 * AtomCard — card por ATO ATÔMICO (1 contrato = 1 post, 1 lei = 1 post...).
 *
 * Visual varia por tipo (cor de gradiente, emoji) mas a estrutura é a mesma:
 *  - Header com avatar do órgão + tempo relativo + tipo label
 *  - Bloco visual grande em gradiente + emoji grande
 *  - Título conversacional (Lei nº X, Contrato nº Y)
 *  - Resumo curto com trecho de texto do diário
 *  - Valor R$ destacado quando capturado
 *  - @CNPJs mencionados como pills clicáveis → /empresa/[cnpj]
 *  - Proveniência: origem na edição PDF (deep link)
 *  - Reactions + save/share
 */
import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrustHint } from "./trust-hint";
import { FonteChip } from "./fonte-chip";
import { ReacaoCivica } from "./reacao-civica";
import { SaveShare } from "./save-share";
import { TIPO_META, type Atom } from "@/lib/atoms";

function formatarCnpj(d: string): string {
  if (d.length !== 14) return d;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

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

export function AtomCard({ atom, className }: { atom: Atom; className?: string }) {
  const meta = TIPO_META[atom.tipo];
  const isMoney = ["contrato", "aditivo", "pregao", "convite", "concorrencia", "ata_registro"].includes(atom.tipo);

  return (
    <article
      className={cn(
        "rounded-3xl bg-card shadow-sm overflow-hidden border border-border/40",
        className,
      )}
    >
      {/* Cabeçalho — quem publicou */}
      <header className="flex items-center gap-3 px-5 pt-4">
        <span
          aria-hidden
          className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0"
        >
          PA
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold truncate">Prefeitura de Americana</p>
            <TrustHint level="oficial" />
          </div>
          <p className="text-xs text-muted-foreground">
            {dataAmigavel(atom.edicaoDate)} · {meta.label.toLowerCase()}
          </p>
        </div>
      </header>

      {/* Bloco visual */}
      <Link
        href={`/ato/${atom.id}`}
        aria-label={`Abrir detalhes de ${atom.titulo}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 mx-5 mt-3 rounded-2xl overflow-hidden"
      >
        <div
          className={cn(
            "aspect-[16/9] flex items-center justify-center bg-gradient-to-br",
            meta.cor,
          )}
        >
          <span className="text-6xl leading-none drop-shadow-sm">{meta.emoji}</span>
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="px-5 pt-4 pb-3 flex flex-col gap-2">
        <Link
          href={`/ato/${atom.id}`}
          className="text-lg font-bold tracking-tight leading-tight hover:underline"
        >
          {atom.titulo}
        </Link>

        {/* Valor em destaque pra atos de dinheiro */}
        {isMoney && atom.valorMencionado && (
          <p className="text-[var(--political)] text-2xl font-bold tabular-nums tracking-tight leading-none">
            {atom.valorMencionado}
          </p>
        )}

        <p className="text-sm text-foreground/75 leading-relaxed">{atom.resumo}</p>

        {/* @menções (CNPJs validados) */}
        {atom.cnpjsMencionados.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {atom.cnpjsMencionados.slice(0, 4).map((cnpj) => (
              <Link
                key={cnpj}
                href={`/empresa/${cnpj}`}
                className="inline-flex items-center gap-1 px-2 h-7 rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-200/60 text-[11px] font-medium hover:bg-violet-100 transition-colors"
              >
                @{formatarCnpj(cnpj)}
              </Link>
            ))}
            {atom.cnpjsMencionados.length > 4 && (
              <span className="inline-flex items-center px-2 h-7 text-[11px] text-muted-foreground">
                +{atom.cnpjsMencionados.length - 4} CNPJs
              </span>
            )}
          </div>
        )}

        {/* Proveniência — origem da edição (PDF) */}
        <div className="flex items-center justify-between gap-2 mt-1 pt-2 border-t border-border/30">
          <Link
            href={`/diario/${atom.edicaoSlug}`}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="w-3 h-3" aria-hidden />
            origem: edição {atom.edicaoDate ? new Date(atom.edicaoDate + "T12:00:00").toLocaleDateString("pt-BR") : "destacada"}
          </Link>
          <FonteChip label="@prefeitura-americana" url="https://www.americana.sp.gov.br" />
        </div>
      </div>

      {/* Rodapé: reactions + save/share */}
      <footer className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-border/30">
        <ReacaoCivica />
        <SaveShare shareTitle={atom.titulo} shareUrl={`/ato/${atom.id}`} />
      </footer>
    </article>
  );
}
