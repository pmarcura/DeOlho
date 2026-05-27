/**
 * /radar — feed completo de átomos do diário (sem limite).
 *
 * Filtros por categoria via ?cat=, ordenação por data (mais recentes primeiro).
 * Quando esquema DB entrar em produção, vira query paginada.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AtomCard } from "@/components/feed/atom-card";
import { FeedFilter } from "@/components/feed/feed-filter";
import { EmptyState } from "@/components/feed/empty-state";
import { getAtoms, getAtomsStats, type CategoriaFeed } from "@/lib/atoms";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "Radar — DeOlho",
  description: "Todos os atos do diário de Americana, em ordem cronológica.",
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
    getAtoms({ categoria: cat }),
    getAtomsStats(),
  ]);

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
          {atoms.length} de {stats.total} atos · extraídos de {stats.edicoesProcessadas} edições reais
        </p>
      </header>

      <section className="mb-4">
        <FeedFilter ativo={cat} basePath="/radar" />
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
