/**
 * Home — feed cívico de Americana montado por ÁTOMOS reais.
 *
 * Stories são o ÚNICO filtro (Pedro: "só as bolinhas, nada de duas formas").
 * Cada post no feed é um ato individual extraído do diário.
 *  - 1 contrato = 1 post (com valor R$ destacado)
 *  - 1 lei = 1 post
 *  - 1 decreto/portaria = 1 post
 *  - 1 pregão/edital = 1 post
 *
 * Algoritmo de relevância: atos de dinheiro pesam mais, com CNPJ pesa mais,
 * recente pesa mais — ranqueia o feed em vez de só ordenar por data.
 */
import Link from "next/link";
import { Eye } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AtomCard } from "@/components/feed/atom-card";
import { StoriesRow, type StoryItem } from "@/components/feed/stories-row";
import { GeoBreadcrumb } from "@/components/feed/geo-breadcrumb";
import { EmptyState } from "@/components/feed/empty-state";
import { getAtomsRanqueados, getAtomsStats, type CategoriaFeed } from "@/lib/atoms";

export const revalidate = 600;

function saudacao(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const CATEGORIAS_VALIDAS: CategoriaFeed[] = ["tudo", "dinheiro", "leis", "atos", "convenios"];

interface PageProps {
  searchParams: Promise<{ cat?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const cat: CategoriaFeed = (CATEGORIAS_VALIDAS as readonly string[]).includes(sp.cat ?? "")
    ? (sp.cat as CategoriaFeed)
    : "tudo";

  const [atoms, stats] = await Promise.all([
    getAtomsRanqueados({ categoria: cat, limit: 20 }),
    getAtomsStats(),
  ]);

  // Stories = filtros principais. Sem duplicação com chip bar.
  const stories: StoryItem[] = [
    { id: "tudo", label: "tudo", href: "/", iniciais: "✨", ativo: cat === "tudo", bg: "bg-foreground/8", fg: "text-foreground", novo: cat !== "tudo" },
    { id: "dinheiro", label: "dinheiro", href: "/?cat=dinheiro", iniciais: "💰", ativo: cat === "dinheiro" },
    { id: "leis", label: "leis", href: "/?cat=leis", iniciais: "📜", ativo: cat === "leis" },
    { id: "atos", label: "atos", href: "/?cat=atos", iniciais: "📃", ativo: cat === "atos" },
    { id: "convenios", label: "convênios", href: "/?cat=convenios", iniciais: "🤝", ativo: cat === "convenios" },
  ];

  return (
    <AppShell>
      {/* Saudação */}
      <section className="pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="w-3.5 h-3.5 text-[var(--political)]" aria-hidden />
          <span>de olho em americana</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight leading-tight mt-1">
          {saudacao()} 👋
        </h1>
        <p className="text-sm text-foreground/70 mt-0.5">
          {atoms.length > 0
            ? `${stats.total} atos extraídos do diário. ${cat === "tudo" ? "Veja o que rolou." : `Filtrando por ${cat}.`}`
            : "Ainda não temos nada nessa categoria coletado."}
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

      {/* Stories = único filtro */}
      <section className="mt-4">
        <StoriesRow items={stories} ariaLabel="Filtrar por categoria" />
      </section>

      {/* Feed atômico ranqueado */}
      <section className="mt-4 flex flex-col gap-4">
        {atoms.length === 0 ? (
          <EmptyState
            icone="🪴"
            titulo="Nenhum ato nessa categoria"
            descricao="Volte mais tarde — o coletor roda periodicamente e novos atos aparecem aqui."
            acao={
              <Link href="/" className="text-sm font-semibold text-[var(--political)] mt-1">
                voltar pra tudo
              </Link>
            }
          />
        ) : (
          atoms.map((a) => <AtomCard key={a.id} atom={a} />)
        )}

        {atoms.length >= 20 && (
          <Link
            href={cat === "tudo" ? "/radar" : `/radar?cat=${cat}`}
            className="inline-flex items-center justify-center gap-1 h-11 rounded-full bg-foreground/5 text-foreground/80 font-medium hover:bg-foreground/10 transition-colors"
          >
            ver tudo no radar
          </Link>
        )}
      </section>

      <p className="text-[11px] text-muted-foreground/70 text-center mt-6 mb-2">
        {stats.total} atos atômicos · {stats.edicoesProcessadas} edições reais do diário
      </p>
    </AppShell>
  );
}
