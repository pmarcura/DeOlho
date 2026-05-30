/**
 * Linha do tempo cívica — a fundação de dados (civic_events) finalmente VISÍVEL.
 *
 * Lista os acontecimentos verificáveis de Americana vindos do banco canônico:
 * pagamentos, contratos, atos do diário, sanções, receitas. Cada item mostra
 * FONTE e (quando há) VALOR — fonte antes de conclusão, sempre.
 *
 * force-dynamic: lê o Postgres em runtime (não prerenderiza no build sem banco).
 */
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { GeoBreadcrumb } from "@/components/feed/geo-breadcrumb";
import { EmptyState } from "@/components/feed/empty-state";
import {
  getEventos,
  getEventosStats,
  categoriaMeta,
  fonteLabel,
  valorBRL,
  dataExtensa,
  type CategoriaEvento,
} from "@/lib/eventos";

export const dynamic = "force-dynamic";

const CATS_VALIDAS: CategoriaEvento[] = [
  "contratacao",
  "pagamento",
  "receita",
  "ato_normativo",
  "nomeacao_exoneracao",
  "sancao",
  "audiencia_conselho",
  "obra_zeladoria",
];

interface PageProps {
  searchParams: Promise<{ cat?: string }>;
}

export default async function EventosPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const cat = (CATS_VALIDAS as readonly string[]).includes(sp.cat ?? "")
    ? (sp.cat as CategoriaEvento)
    : undefined;

  const [eventos, stats] = await Promise.all([
    getEventos({ categoria: cat, limit: 50 }),
    getEventosStats(),
  ]);

  return (
    <AppShell>
      <section className="pt-1">
        <p className="text-xs text-muted-foreground">linha do tempo cívica</p>
        <h1 className="text-2xl font-bold tracking-tight leading-tight mt-1">
          O que aconteceu em Americana
        </h1>
        <p className="text-sm text-foreground/70 mt-0.5">
          {stats.total > 0
            ? `${stats.total.toLocaleString("pt-BR")} acontecimentos públicos verificáveis — cada um com a fonte oficial.`
            : "Conecte o banco (DATABASE_URL) para ver os eventos coletados."}
        </p>
      </section>

      <div className="mt-3">
        <GeoBreadcrumb
          niveis={[
            { label: "Brasil", href: "/explorar" },
            { label: "SP", href: "/explorar?uf=SP" },
            { label: "Americana", href: "/eventos", ativo: true },
          ]}
        />
      </div>

      {/* Filtros por categoria (com contagem real) */}
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar por tipo de acontecimento">
        <FiltroChip label="tudo" emoji="✨" href="/eventos" ativo={!cat} />
        {stats.porCategoria.map((c) => {
          const meta = categoriaMeta(c.categoria);
          return (
            <FiltroChip
              key={c.categoria}
              label={`${meta.label} (${c.total.toLocaleString("pt-BR")})`}
              emoji={meta.emoji}
              href={`/eventos?cat=${c.categoria}`}
              ativo={cat === c.categoria}
            />
          );
        })}
      </nav>

      {/* Lista de eventos */}
      <section className="mt-4 flex flex-col gap-3">
        {eventos.length === 0 ? (
          <EmptyState
            icone="🪴"
            titulo="Nada aqui ainda"
            descricao="O coletor roda periodicamente. Se o banco estiver vazio, rode os mapeadores (map:pncp, map:tce, map:diario-atoms)."
          />
        ) : (
          eventos.map((e) => <EventoCard key={e.id} evento={e} />)
        )}
      </section>
    </AppShell>
  );
}

function FiltroChip({
  label,
  emoji,
  href,
  ativo,
}: {
  label: string;
  emoji: string;
  href: string;
  ativo: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        ativo
          ? "border-[var(--political)] bg-[var(--political)]/10 text-[var(--political)]"
          : "border-foreground/15 text-foreground/70 hover:bg-foreground/5"
      }`}
    >
      <span aria-hidden>{emoji}</span>
      {label}
    </Link>
  );
}

function EventoCard({ evento }: { evento: Awaited<ReturnType<typeof getEventos>>[number] }) {
  const meta = categoriaMeta(evento.categoria);
  const valor = valorBRL(evento.valor);

  return (
    <article className="rounded-xl border border-foreground/10 bg-card p-4">
      <header className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/60">
          <span aria-hidden>{meta.emoji}</span>
          {meta.label}
        </span>
        <span className="text-[11px] text-muted-foreground">{dataExtensa(evento.dataEvento)}</span>
      </header>

      <h2 className="mt-1.5 text-[15px] font-semibold leading-snug text-foreground">
        {evento.titulo}
      </h2>

      {valor && (
        <p className="mt-1 text-lg font-bold tracking-tight text-foreground">{valor}</p>
      )}

      {evento.resumo && (
        <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{evento.resumo}</p>
      )}

      <footer className="mt-3 flex items-center justify-between gap-2 border-t border-foreground/5 pt-2.5">
        <span className="text-[11px] text-muted-foreground">
          Fonte: {fonteLabel(evento.sourceId)}
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
