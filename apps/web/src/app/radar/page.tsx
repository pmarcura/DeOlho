/**
 * /radar — feed completo do diário oficial (dados reais).
 *
 * Variação de Home pra quem quer ver TUDO que o coletor pegou. Sem fixtures,
 * só edições reais ordenadas por data. Mesmo EventoCard, mesma vibe.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { EventoCard } from "@/components/feed/event-card";
import { EmptyState } from "@/components/feed/empty-state";
import { getDiarioEdicoes, getDiarioMeta, dataAmigavel, dataExtensa } from "@/lib/diario";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "Radar — DeOlho",
  description: "Tudo o que rolou no diário oficial de Americana, em ordem cronológica.",
};

export default async function RadarPage() {
  const [edicoes, meta] = await Promise.all([getDiarioEdicoes(), getDiarioMeta()]);
  const feed = edicoes.filter((e) => e.date);

  return (
    <AppShell>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight leading-tight">Radar</h1>
        <p className="text-sm text-foreground/70 mt-0.5">
          Todas as {feed.length} edições reais do diário de Americana. Atualizado{" "}
          {dataAmigavel(meta.ultimaColeta.slice(0, 10))}.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        {feed.length === 0 ? (
          <EmptyState
            icone="📭"
            titulo="Nada coletado ainda"
            descricao="O scraper do diário ainda não rodou. Volte mais tarde."
          />
        ) : (
          feed.map((e) => (
            <EventoCard
              key={e.slug}
              autor={{
                nome: "Prefeitura de Americana",
                iniciais: "PA",
                paleta: "bg-emerald-100 text-emerald-700",
              }}
              tempo={dataAmigavel(e.date)}
              tipoLabel={e.isExtra ? "diário · edição extra" : "diário oficial"}
              trust="oficial"
              visual={
                e.isExtra
                  ? { bg: "bg-gradient-to-br from-amber-100 to-rose-100", emoji: "📰" }
                  : { bg: "bg-gradient-to-br from-sky-100 to-emerald-100", emoji: "📜" }
              }
              titulo={
                e.isExtra
                  ? `Edição extra · ${dataExtensa(e.date)}`
                  : `Edição de ${dataExtensa(e.date)}`
              }
              resumo={
                e.isExtra
                  ? "Edição extra publicada fora do calendário regular."
                  : "Atos administrativos, nomeações e publicações do dia."
              }
              href={`/diario/${e.slug}`}
              cta={{ label: "abrir PDF", href: e.url, externo: true }}
              fonte={{
                label: "@prefeitura-americana",
                url: "https://www.americana.sp.gov.br",
              }}
              shareUrl={`/diario/${e.slug}`}
            />
          ))
        )}
      </section>
    </AppShell>
  );
}
