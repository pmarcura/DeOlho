/**
 * Home — feed cívico de Americana montado por ÁTOMOS reais.
 *
 * Cada post no feed é UM ato individual extraído do texto do diário:
 *  - 1 contrato = 1 post (com valor R$ destacado)
 *  - 1 lei = 1 post
 *  - 1 decreto/portaria = 1 post
 *  - 1 pregão/edital = 1 post
 *
 * @CNPJs mencionados viram pills clicáveis → /empresa/[cnpj]. A edição PDF
 * de origem fica como proveniência no rodapé do post.
 */
import Link from "next/link";
import { Eye } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AtomCard } from "@/components/feed/atom-card";
import { FeedFilter } from "@/components/feed/feed-filter";
import { StoriesRow, type StoryItem } from "@/components/feed/stories-row";
import { GeoBreadcrumb } from "@/components/feed/geo-breadcrumb";
import { EmptyState } from "@/components/feed/empty-state";
import { getAtoms, getAtomsStats, type CategoriaFeed } from "@/lib/atoms";
import { BAIRROS_AMERICANA } from "@/lib/civic-data";

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
    getAtoms({ categoria: cat, limit: 20 }),
    getAtomsStats(),
  ]);

  const stories: StoryItem[] = [
    { id: "tudo", label: "tudo", href: "/", iniciais: "✨", novo: true, bg: "bg-foreground/5", fg: "text-foreground" },
    { id: "dinheiro", label: "dinheiro", href: "/?cat=dinheiro", iniciais: "💰" },
    { id: "leis", label: "leis", href: "/?cat=leis", iniciais: "📜" },
    { id: "atos", label: "atos", href: "/?cat=atos", iniciais: "📃" },
    ...BAIRROS_AMERICANA.slice(0, 5).map((b) => ({
      id: b.toLowerCase().replace(/\s+/g, "-"),
      label: b.toLowerCase(),
      href: `/explorar?bairro=${encodeURIComponent(b)}`,
    })),
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
          {stats.total} atos extraídos do diário. {atoms.length > 0
            ? `Aqui vai o que rolou${cat !== "tudo" ? ` em ${cat}` : ""}.`
            : "Ainda não temos nada dessa categoria coletado."}
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
        <StoriesRow items={stories} />
      </section>

      {/* Filtro do feed */}
      <section className="mt-4">
        <FeedFilter ativo={cat} basePath="/" />
      </section>

      {/* Feed de átomos */}
      <section className="mt-4 flex flex-col gap-4">
        {atoms.length === 0 ? (
          <EmptyState
            icone="🪴"
            titulo="Sem atos nesta categoria"
            descricao={`Nenhum ato do tipo "${cat}" foi extraído ainda. Volte mais tarde — o coletor roda periodicamente.`}
            acao={
              <Link
                href="/"
                className="text-sm font-semibold text-[var(--political)] mt-1"
              >
                voltar pra tudo
              </Link>
            }
          />
        ) : (
          atoms.map((a) => <AtomCard key={a.id} atom={a} />)
        )}

        {atoms.length >= 20 && (
          <Link
            href="/radar"
            className="inline-flex items-center justify-center gap-1 h-10 rounded-full bg-foreground/5 text-foreground/80 font-medium hover:bg-foreground/10 transition-colors"
          >
            ver tudo no radar
          </Link>
        )}
      </section>

      <p className="text-[11px] text-muted-foreground/70 text-center mt-6 mb-2">
        {stats.total} atos atômicos extraídos de {stats.edicoesProcessadas} edições reais do
        Diário Oficial de Americana
      </p>
    </AppShell>
  );
}
