/**
 * Início — o FEED CÍVICO de Americana, unificado.
 *
 * Uma rede social viva: cada acontecimento público (contrato, pagamento, ato,
 * sanção) vira um POST legível e navegável, vindo do banco canônico (civic_events,
 * ~130 mil eventos das fontes oficiais). O algoritmo de relevância (getEventosRanqueados)
 * dá vida ao feed — dinheiro e recência sobem, os 124k pagamentos não afogam.
 *
 * Substitui as antigas superfícies separadas (início de átomos + /eventos): agora
 * é UM lugar só, alimentado automaticamente pelo que os coletores trazem.
 */
import { Eye } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { PostCard } from "@/components/feed/post-card";
import { StoriesRow, type StoryItem } from "@/components/feed/stories-row";
import { GeoBreadcrumb } from "@/components/feed/geo-breadcrumb";
import { EmptyState } from "@/components/feed/empty-state";
import { getEventosRanqueados, getEventosStats, type CategoriaEvento } from "@/lib/eventos";

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
  searchParams: Promise<{ cat?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const cat = (CATS_VALIDAS as readonly string[]).includes(sp.cat ?? "")
    ? (sp.cat as CategoriaEvento)
    : undefined;

  const [eventos, stats] = await Promise.all([
    getEventosRanqueados({ categoria: cat, limit: 30 }),
    getEventosStats(),
  ]);

  const stories: StoryItem[] = [
    { id: "tudo", label: "tudo", href: "/", iniciais: "✨", ativo: !cat, bg: "bg-foreground/8", fg: "text-foreground", novo: !!cat },
    { id: "contratacao", label: "contratos", href: "/?cat=contratacao", iniciais: "📋", ativo: cat === "contratacao" },
    { id: "pagamento", label: "pagamentos", href: "/?cat=pagamento", iniciais: "💸", ativo: cat === "pagamento" },
    { id: "ato_normativo", label: "atos", href: "/?cat=ato_normativo", iniciais: "📜", ativo: cat === "ato_normativo" },
    { id: "sancao", label: "sanções", href: "/?cat=sancao", iniciais: "⚠️", ativo: cat === "sancao" },
    { id: "nomeacao_exoneracao", label: "cargos", href: "/?cat=nomeacao_exoneracao", iniciais: "👤", ativo: cat === "nomeacao_exoneracao" },
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
            ? `${stats.total.toLocaleString("pt-BR")} acontecimentos públicos. ${cat ? "Filtrando." : "Veja o que rolou na cidade."}`
            : "Conecte o banco (DATABASE_URL) para o feed ganhar vida."}
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

      <section className="mt-4 flex flex-col gap-4">
        {eventos.length === 0 ? (
          <EmptyState
            icone="🪴"
            titulo="Nada por aqui ainda"
            descricao="O coletor roda periodicamente. Se o banco estiver vazio, rode os mapeadores (map:pncp, map:tce, map:diario-atoms)."
          />
        ) : (
          eventos.map((e) => <PostCard key={e.id} evento={e} />)
        )}
      </section>

      <p className="text-[11px] text-muted-foreground/70 text-center mt-6 mb-2">
        {stats.total.toLocaleString("pt-BR")} acontecimentos públicos de Americana · fontes oficiais
      </p>
    </AppShell>
  );
}
