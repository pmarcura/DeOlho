/**
 * Início — radar social-cívico de Americana.
 *
 * Cada acontecimento publico vem do banco canonico, com fonte, confianca,
 * limitacoes e conexoes navegaveis. A camada social fica limitada a reacoes
 * estruturadas, acompanhar e compartilhar objetos publicos.
 */
import { Eye } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { EventoCivicoCard } from "@/components/feed/evento-civico-card";
import { ResumoMensalRadarCard } from "@/components/feed/resumo-mensal-radar";
import { StoriesRow, type StoryItem } from "@/components/feed/stories-row";
import { GeoBreadcrumb } from "@/components/feed/geo-breadcrumb";
import { EmptyState } from "@/components/feed/empty-state";
import {
  getEventosRanqueados,
  getEventosStats,
  getResumoMensalRadar,
  type CategoriaEvento,
  type OrdemEventos,
} from "@/lib/eventos";

export const dynamic = "force-dynamic";

function saudacao(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const CATS_VALIDAS: CategoriaEvento[] = [
  "contratacao",
  "pagamento",
  "ato_normativo",
  "sancao",
  "nomeacao_exoneracao",
  "receita",
];

interface PageProps {
  searchParams: Promise<{ cat?: string; ordem?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const cat = (CATS_VALIDAS as readonly string[]).includes(sp.cat ?? "")
    ? (sp.cat as CategoriaEvento)
    : undefined;
  const ordem: OrdemEventos = sp.ordem === "semana" || sp.ordem === "relevantes"
    ? sp.ordem
    : "recentes";

  const [eventos, stats, resumoMensal] = await Promise.all([
    getEventosRanqueados({ categoria: cat, limit: 30, ordem }),
    getEventosStats(),
    ordem === "recentes" ? getResumoMensalRadar({ categoria: cat }) : Promise.resolve(null),
  ]);

  // Não repetir na lista os eventos já destacados em "Comece por estes" do resumo.
  const idsNoResumo = new Set((resumoMensal?.recomendados ?? []).map((e) => e.id));
  const eventosLista = eventos.filter((e) => !idsNoResumo.has(e.id));

  const stories: StoryItem[] = [
    { id: "tudo", label: "tudo", href: "/", iniciais: "✨", ativo: !cat, bg: "bg-foreground/8", fg: "text-foreground", novo: !!cat },
    { id: "contratacao", label: "contratos", href: "/?cat=contratacao", iniciais: "📋", ativo: cat === "contratacao" },
    { id: "pagamento", label: "pagamentos", href: "/?cat=pagamento", iniciais: "💸", ativo: cat === "pagamento" },
    { id: "ato_normativo", label: "atos", href: "/?cat=ato_normativo", iniciais: "📜", ativo: cat === "ato_normativo" },
    { id: "sancao", label: "sanções", href: "/?cat=sancao", iniciais: "⚠️", ativo: cat === "sancao" },
    { id: "nomeacao_exoneracao", label: "cargos", href: "/?cat=nomeacao_exoneracao", iniciais: "👤", ativo: cat === "nomeacao_exoneracao" },
  ];
  const ordemHref = (o: OrdemEventos) => `/${cat ? `?cat=${cat}&ordem=${o}` : o === "recentes" ? "" : `?ordem=${o}`}`;
  const ordenacoes: Array<{ id: OrdemEventos; label: string }> = [
    { id: "recentes", label: "mais recentes" },
    { id: "semana", label: "em alta na semana" },
    { id: "relevantes", label: "mais conectados" },
  ];

  return (
    <AppShell>
      <section className="pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="w-3.5 h-3.5 text-[var(--political)]" aria-hidden />
          <span>de olho em americana</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight leading-tight mt-1">{saudacao()} 👋</h1>
        <p className="text-sm text-foreground/70 mt-0.5">
          {eventos.length > 0
            ? `${stats.total.toLocaleString("pt-BR")} acontecimentos públicos. ${cat ? "Filtrando." : "Veja o que mudou na cidade."}`
            : "Conecte o banco (DATABASE_URL) para o radar mostrar acontecimentos públicos."}
        </p>
      </section>

      <div className="mt-3">
        <GeoBreadcrumb
          niveis={[
            { label: "Brasil", href: "/explorar" },
            { label: "SP", href: "/explorar?uf=SP" },
            { label: "Americana", href: "/", ativo: true },
          ]}
        />
      </div>

      <section className="mt-4">
        <StoriesRow items={stories} ariaLabel="Filtrar por tipo de acontecimento" />
      </section>

      <nav aria-label="Ordenar acontecimentos" className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {ordenacoes.map((item) => (
          <a
            key={item.id}
            href={ordemHref(item.id)}
            aria-current={ordem === item.id ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              ordem === item.id
                ? "border-foreground bg-foreground text-background"
                : "border-border/70 bg-card text-foreground/75 hover:border-foreground/40"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {ordem === "recentes" && resumoMensal && eventos.length > 0 && (
        <section className="mt-4">
          <ResumoMensalRadarCard resumo={resumoMensal} />
        </section>
      )}

      <section className="mt-4 flex flex-col gap-4">
        {eventosLista.length === 0 ? (
          <EmptyState
            icone="🪴"
            titulo="Nada por aqui ainda"
            descricao="O coletor roda periodicamente. Se o banco estiver vazio, rode os mapeadores (map:pncp, map:tce, map:diario-atoms)."
          />
        ) : (
          eventosLista.map((e) => <EventoCivicoCard key={e.id} evento={e} variante="feed" />)
        )}
      </section>

      <p className="text-[11px] text-muted-foreground/70 text-center mt-6 mb-2">
        {stats.total.toLocaleString("pt-BR")} acontecimentos públicos de Americana · fontes oficiais
      </p>
    </AppShell>
  );
}
