/**
 * EventoCard — card principal do feed, vibe Instagram.
 *
 * Estrutura:
 *  - Cabeçalho com avatar do "autor" público (prefeitura, câmara, etc.),
 *    nome + trust hint, e tempo relativo ("ontem").
 *  - Bloco visual grande (cor + emoji/ícone) — substituto da foto.
 *  - Título conversacional e resumo curto.
 *  - CTA opcional (Abrir PDF, Ver detalhes).
 *  - Rodapé com ReacaoCivica + SaveShare.
 *
 * Mobile-first, generoso em padding, rounded-3xl. Sem grids de badges
 * empilhados — confiança aparece como ícone sutil no cabeçalho.
 */
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrustHint, type TrustLevel } from "./trust-hint";
import { FonteChip } from "./fonte-chip";
import { ReacaoCivica } from "./reacao-civica";
import { SaveShare } from "./save-share";

export interface EventoCardProps {
  /** Avatar block: organização/órgão emissor. */
  autor: {
    nome: string;
    iniciais: string;
    /** Tailwind bg classes (ex.: "bg-emerald-100 text-emerald-700"). */
    paleta?: string;
  };
  /** "ontem", "há 3 dias", "hoje". */
  tempo: string;
  /** Pequeno rótulo no header ("diário oficial", "contrato"). */
  tipoLabel: string;
  /** Confiança como ícone sutil ao lado do nome. */
  trust?: TrustLevel;
  /** Bloco visual grande — cor + emoji. */
  visual: {
    bg: string; // tailwind: "bg-amber-50"
    fg?: string; // tailwind text color for emoji
    emoji?: string;
    icone?: React.ReactNode;
  };
  titulo: string;
  resumo?: string;
  /** Quando definido, todo o card linka aqui (não usar em conjunto com cta.href). */
  href?: string;
  cta?: { label: string; href: string; externo?: boolean };
  fonte?: { label: string; url?: string };
  reacoes?: { ver?: number; duvida?: number; revisao?: number };
  /** Compartilhamento — link absoluto preferível. */
  shareUrl?: string;
  className?: string;
}

export function EventoCard({
  autor,
  tempo,
  tipoLabel,
  trust = "oficial",
  visual,
  titulo,
  resumo,
  href,
  cta,
  fonte,
  reacoes,
  shareUrl,
  className,
}: EventoCardProps) {
  return (
    <article
      className={cn(
        "rounded-3xl bg-card shadow-sm overflow-hidden",
        "border border-border/40",
        className,
      )}
    >
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 px-5 pt-4">
        <span
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
            autor.paleta ?? "bg-rose-100 text-rose-700",
          )}
          aria-hidden
        >
          {autor.iniciais}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold truncate">{autor.nome}</p>
            <TrustHint level={trust} />
          </div>
          <p className="text-xs text-muted-foreground">
            {tempo} · {tipoLabel}
          </p>
        </div>
      </header>

      {/* Bloco visual */}
      <div
        className={cn(
          "mx-5 mt-3 rounded-2xl aspect-[16/9] flex items-center justify-center",
          visual.bg,
        )}
      >
        {visual.icone ? (
          <span className={cn("text-5xl", visual.fg)}>{visual.icone}</span>
        ) : (
          <span className="text-6xl leading-none">{visual.emoji}</span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="px-5 pt-4 pb-3 flex flex-col gap-1.5">
        {href ? (
          <Link
            href={href}
            className="text-lg font-bold tracking-tight leading-tight hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
          >
            {titulo}
          </Link>
        ) : (
          <h3 className="text-lg font-bold tracking-tight leading-tight">{titulo}</h3>
        )}
        {resumo && <p className="text-sm text-foreground/75 leading-relaxed">{resumo}</p>}

        {cta && (
          <Link
            href={cta.href}
            target={cta.externo ? "_blank" : undefined}
            rel={cta.externo ? "noopener noreferrer" : undefined}
            className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[var(--political)] hover:opacity-80 self-start"
          >
            {cta.label}
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        )}

        {fonte && (
          <div className="mt-1">
            <FonteChip label={fonte.label} url={fonte.url} />
          </div>
        )}
      </div>

      {/* Rodapé de reações + save/share */}
      <footer className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-border/30">
        <ReacaoCivica contagem={reacoes} />
        <SaveShare shareUrl={shareUrl} shareTitle={titulo} />
      </footer>
    </article>
  );
}
