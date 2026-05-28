/**
 * AtomCard premium — usa campos compilados (tituloHumano, subtitulo, campos
 * estruturados, glossário, complexidade) pra dar uma postagem REALMENTE
 * legível ao invés do trecho cru do PDF.
 *
 * Hierarquia:
 *  1. Header (autor + tempo + chip categoria + chip complexidade)
 *  2. TÍTULO HUMANO grande (fallback: titulo técnico)
 *  3. Subtítulo / contexto (1 linha)
 *  4. Valor R$ em destaque (atos de dinheiro)
 *  5. Campos estruturados como grid key-value (top 4 campos)
 *  6. Glossário detectado: chips clicáveis
 *  7. "Ver texto original do diário" expansível (resumo cru com mentions+glossário)
 *  8. Origem (edição PDF) + fonte
 *  9. Reactions + Save/Share
 */
import Link from "next/link";
import { FileText, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrustHint } from "./trust-hint";
import { FonteChip } from "./fonte-chip";
import { ReacaoCivica } from "./reacao-civica";
import { SaveShare } from "./save-share";
import { TextoComMencoes } from "./entity-highlight";
import { TermoTooltip } from "./termo-tooltip";
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

const CATEGORIA_CHIP: Record<string, string> = {
  dinheiro: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  leis: "bg-amber-50 text-amber-800 ring-amber-200/70",
  atos: "bg-sky-50 text-sky-700 ring-sky-200/70",
  convenios: "bg-teal-50 text-teal-700 ring-teal-200/70",
};

const COMPLEX_CHIP: Record<string, string> = {
  "muito fácil": "bg-emerald-50 text-emerald-700",
  "fácil": "bg-emerald-50/70 text-emerald-700",
  "médio": "bg-amber-50 text-amber-700",
  "técnico": "bg-orange-50 text-orange-700",
  "muito técnico": "bg-rose-50 text-rose-700",
};

// Rótulos amigáveis pra cada campo estruturado.
const CAMPO_LABEL: Record<string, string> = {
  contratante: "Quem contratou",
  contratada: "Empresa contratada",
  objeto: "Objeto",
  modalidade: "Modalidade",
  processo: "Processo",
  fundamento: "Fundamento",
  vigencia: "Vigência",
  prazo: "Prazo",
  ementa: "Ementa",
  ato: "Ato",
  cargo: "Cargo",
  agente: "Agente",
  abertura: "Abertura",
  estado: "Estado",
};

// Quais campos mostrar por tipo (top picks pra cada).
const CAMPOS_DESTAQUE: Record<string, string[]> = {
  contrato: ["contratante", "contratada", "objeto", "modalidade"],
  aditivo: ["contratante", "contratada", "objeto", "vigencia"],
  pregao: ["objeto", "modalidade", "estado", "processo"],
  edital: ["objeto", "modalidade", "processo"],
  concorrencia: ["objeto", "modalidade", "processo"],
  convite: ["objeto", "modalidade"],
  ata_registro: ["objeto", "modalidade"],
  convenio: ["objeto", "modalidade"],
  lei: ["ementa"],
  decreto: ["ato", "cargo", "fundamento"],
  portaria: ["ato", "cargo", "fundamento"],
  resolucao: ["ato", "fundamento"],
};

function truncar(s: string | undefined, max = 140): string | undefined {
  if (!s) return undefined;
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

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

  const tituloFinal = atom.tituloHumano ?? atom.titulo;
  const subtitulo = atom.subtitulo;
  const campos = (atom.campos?.dados ?? {}) as Record<string, string | undefined>;
  const camposShow = (CAMPOS_DESTAQUE[atom.tipo] ?? [])
    .map((k) => ({ k, v: truncar(campos[k]) }))
    .filter((x) => x.v);
  const glossario = atom.glossario ?? [];
  const complex = atom.complexidade;

  return (
    <article
      className={cn(
        "rounded-3xl bg-card shadow-sm overflow-hidden border border-border/40",
        className,
      )}
    >
      {/* Header */}
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
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 text-[11px] font-medium",
              chipCls,
            )}
          >
            <span aria-hidden>{meta.emoji}</span>
            {meta.label.toLowerCase()}
          </span>
          {complex && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                COMPLEX_CHIP[complex.label] ?? "bg-foreground/5 text-foreground",
              )}
              title={`${complex.label} · ${complex.tempoLeitura}s`}
            >
              <BookOpen className="w-2.5 h-2.5" aria-hidden />
              {complex.label} · {complex.tempoLeitura}s
            </span>
          )}
        </div>
      </header>

      {/* Título humano */}
      <div className="px-5 pt-2 pb-1">
        <Link
          href={`/ato/${atom.id}`}
          className="block hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
        >
          <h3 className="text-[1.35rem] font-bold tracking-tight leading-tight">
            {tituloFinal}
          </h3>
        </Link>
        {subtitulo && (
          <p className="text-sm text-foreground/70 mt-1">{subtitulo}</p>
        )}

        {isMoney && atom.valorMencionado && (
          <p className="text-[var(--political)] text-2xl font-bold tabular-nums tracking-tight leading-none mt-2">
            {atom.valorMencionado}
          </p>
        )}
      </div>

      {/* Grid de campos estruturados */}
      {camposShow.length > 0 && (
        <dl className="px-5 pt-3 pb-1 flex flex-col gap-2">
          {camposShow.map(({ k, v }) => (
            <div key={k} className="flex flex-col">
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {CAMPO_LABEL[k] ?? k}
              </dt>
              <dd className="text-sm text-foreground/90 leading-relaxed">
                <TextoComMencoes texto={v!} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Chips do glossário detectado */}
      {glossario.length > 0 && (
        <div className="px-5 pt-3 pb-1 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            termos
          </span>
          {glossario.slice(0, 5).map((t) => (
            <TermoTooltip key={t.termo} termo={t.termo} definicao={t.definicao} />
          ))}
        </div>
      )}

      {/* Texto original colapsível — pra quem quer ver o cru */}
      <details className="px-5 pt-3 pb-2 group">
        <summary className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer list-none">
          <FileText className="w-3 h-3" aria-hidden />
          <span className="group-open:hidden">ver texto original do diário</span>
          <span className="hidden group-open:inline">ocultar texto original</span>
        </summary>
        <div className="mt-2 text-[13px] text-foreground/70 leading-relaxed bg-foreground/[0.03] rounded-xl px-3 py-2.5">
          <TextoComMencoes texto={limparResumo(atom.resumo)} />
        </div>
      </details>

      {/* Origem + Fonte */}
      <div className="px-5 pb-3 flex items-center justify-between gap-2 border-t border-border/30 pt-3">
        <Link
          href={`/diario/${atom.edicaoSlug}`}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Clock className="w-3 h-3" aria-hidden />
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
        <SaveShare shareTitle={tituloFinal} shareUrl={`/ato/${atom.id}`} />
      </footer>
    </article>
  );
}
