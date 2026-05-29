/**
 * /ano/[ano] — atos de um ano específico (pela edição ou pelo ano do ato).
 * Resposta a "ano… em destaque para conseguir visualizar tudo que conecta".
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AtomCard } from "@/components/feed/atom-card";
import { EmptyState } from "@/components/feed/empty-state";
import { getAtomsPorAno } from "@/lib/atoms";

interface PageProps {
  params: Promise<{ ano: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ano } = await params;
  return { title: `Atos de ${ano} — DeOlho`, description: `Atos do Diário de Americana de ${ano}.` };
}

export default async function AnoPage({ params }: PageProps) {
  const { ano } = await params;
  if (!/^(19|20)\d{2}$/.test(ano)) notFound();
  const atoms = await getAtomsPorAno(ano);

  return (
    <AppShell>
      <Link href="/explorar" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      <header className="mb-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ano</p>
        <h1 className="text-2xl font-bold tracking-tight leading-tight">{ano}</h1>
        <p className="text-sm text-foreground/70 mt-0.5">
          {atoms.length === 0 ? "Nenhum ato deste ano por aqui." : `${atoms.length} ${atoms.length === 1 ? "ato" : "atos"} no Diário de Americana.`}
        </p>
      </header>

      <section className="flex flex-col gap-4">
        {atoms.length === 0 ? (
          <EmptyState icone="🗓️" titulo="Sem atos deste ano" descricao="Talvez o histórico desse ano ainda não tenha sido coletado." />
        ) : (
          atoms.map((a) => <AtomCard key={a.id} atom={a} />)
        )}
      </section>
    </AppShell>
  );
}
