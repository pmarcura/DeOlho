/**
 * /radar — lista completa de átomos (sem limite), ordenada por relevância.
 *
 * A trilha horizontal é o único filtro — mesma estrutura que a Home.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AtomCard } from "@/components/feed/atom-card";
import { StoriesRow, type StoryItem } from "@/components/feed/stories-row";
import { EmptyState } from "@/components/feed/empty-state";
import { getAtomsRanqueados, getAtomsStats, type CategoriaFeed } from "@/lib/atoms";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "Radar — DeOlho",
  description: "Todos os atos do diário de Americana ranqueados por relevância.",
};

const CATEGORIAS_VALIDAS: CategoriaFeed[] = ["tudo", "dinheiro", "leis", "atos", "convenios"];

interface PageProps {
  searchParams: Promise<{ cat?: string }>;
}

export default async function RadarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const cat: CategoriaFeed = (CATEGORIAS_VALIDAS as readonly string[]).includes(sp.cat ?? "")
    ? (sp.cat as CategoriaFeed)
    : "tudo";

  const [atoms, stats] = await Promise.all([
    getAtomsRanqueados({ categoria: cat }),
    getAtomsStats(),
  ]);

  const stories: StoryItem[] = [
    { id: "tudo", label: "tudo", href: "/radar", iniciais: "✨", ativo: cat === "tudo", bg: "bg-foreground/8", fg: "text-foreground" },
    { id: "dinheiro", label: "dinheiro", href: "/radar?cat=dinheiro", iniciais: "💰", ativo: cat === "dinheiro" },
    { id: "leis", label: "leis", href: "/radar?cat=leis", iniciais: "📜", ativo: cat === "leis" },
    { id: "atos", label: "atos", href: "/radar?cat=atos", iniciais: "📃", ativo: cat === "atos" },
    { id: "convenios", label: "convênios", href: "/radar?cat=convenios", iniciais: "🤝", ativo: cat === "convenios" },
  ];

  return (
    <AppShell>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      <header className="mb-3">
        <h1 className="text-2xl font-bold tracking-tight leading-tight">Radar</h1>
        <p className="text-sm text-foreground/70 mt-0.5">
          {atoms.length} de {stats.total} atos · ranqueados por relevância
        </p>
      </header>

      <section className="mb-4">
        <StoriesRow items={stories} ariaLabel="Filtrar por categoria" />
      </section>

      <section className="flex flex-col gap-4">
        {atoms.length === 0 ? (
          <EmptyState
            icone="🪴"
            titulo="Nada nessa categoria"
            descricao="Volte mais tarde — o coletor roda periodicamente e novos atos aparecem aqui."
          />
        ) : (
          atoms.map((a) => <AtomCard key={a.id} atom={a} />)
        )}
      </section>
    </AppShell>
  );
}
