/**
 * PostCard — um acontecimento público como POST (estilo feed/Instagram).
 *
 * Recebe um evento ranqueado, compõe o post (título humano, valor, capa, conexões)
 * e renderiza de forma legível e navegável: cada conexão (empresa, pessoa, órgão,
 * termo) é clicável, levando o cidadão a ir fundo na informação.
 */
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { comporPost } from "@/lib/post-compositor";
import { fonteLabel, dataExtensa, type EventoRanqueado } from "@/lib/eventos";

export function PostCard({ evento }: { evento: EventoRanqueado }) {
  const post = comporPost(evento);

  return (
    <article className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      {/* Capa temática — a "imagem" do post (gradiente + ícone + valor em destaque) */}
      <div className={`relative flex items-center justify-between gap-3 bg-gradient-to-br ${post.capa.gradiente} px-4 py-3`}>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/70">
          <span className="text-base" aria-hidden>{post.selo.emoji}</span>
          {post.selo.label}
        </span>
        {post.valorLabel && (
          <span className="text-lg font-bold tracking-tight text-foreground tabular-nums">
            {post.valorLabel}
          </span>
        )}
      </div>

      <div className="p-4">
        <h2 className="text-[15px] font-semibold leading-snug text-foreground">{post.titulo}</h2>
        {post.linhaFina && (
          <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{post.linhaFina}</p>
        )}

        {post.disclaimer && (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-700 dark:text-amber-400">
            {post.disclaimer}
          </p>
        )}

        {/* Conexões clicáveis — o "navegar clicando nos nomes" */}
        {post.conexoes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.conexoes.map((c, i) =>
              c.href ? (
                <Link
                  key={`${c.tipo}-${i}`}
                  href={c.href}
                  className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-background/50 px-2.5 py-1 text-[11px] font-medium text-foreground/80 hover:border-[var(--political)] hover:text-[var(--political)] transition-colors"
                >
                  {iconePorTipo(c.tipo)} {c.label}
                </Link>
              ) : (
                <span
                  key={`${c.tipo}-${i}`}
                  title={c.tooltip}
                  className="inline-flex cursor-help items-center gap-1 rounded-full border border-dashed border-foreground/20 px-2.5 py-1 text-[11px] font-medium text-foreground/60"
                >
                  {iconePorTipo(c.tipo)} {c.label}
                </span>
              ),
            )}
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-border/40 px-4 py-2.5">
        <span className="text-[11px] text-muted-foreground">
          {fonteLabel(evento.sourceId)} · {dataExtensa(evento.dataEvento)}
        </span>
        {evento.sourceUrl && (
          <a
            href={evento.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--source)] hover:underline"
          >
            ver documento
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
      </footer>
    </article>
  );
}

function iconePorTipo(tipo: string): string {
  switch (tipo) {
    case "empresa":
      return "🏢";
    case "pessoa":
      return "👤";
    case "orgao":
      return "🏛️";
    case "termo":
      return "📖";
    default:
      return "•";
  }
}
