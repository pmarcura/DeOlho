/**
 * Home — feed cívico de Americana com dados REAIS.
 *
 * Sem fixtures. O feed é montado a partir das edições reais do Diário Oficial
 * de Americana (raspadas pelo coletor — 60 edições com PDFs reais). Reações
 * cívicas em CADA edição (👀 🤔 🚩 nunca em pessoa). Stories de bairros e temas
 * pra navegação rápida. Tom conversacional, mobile-first, sem cara de SaaS.
 */
import Link from "next/link";
import { Eye, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { EventoCard } from "@/components/feed/event-card";
import { StoriesRow, type StoryItem } from "@/components/feed/stories-row";
import { GeoBreadcrumb } from "@/components/feed/geo-breadcrumb";
import { EmptyState } from "@/components/feed/empty-state";
import { getDiarioEdicoes, getDiarioMeta, dataAmigavel, dataExtensa } from "@/lib/diario";
import { BAIRROS_AMERICANA } from "@/lib/civic-data";

export const revalidate = 600; // 10 min — combina com cadência do scraper

function saudacao(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function HomePage() {
  const [edicoes, meta] = await Promise.all([getDiarioEdicoes(), getDiarioMeta()]);
  const feed = edicoes.filter((e) => e.date).slice(0, 12); // só com data
  const ultimaData = feed[0]?.date ?? null;

  const stories: StoryItem[] = [
    { id: "tudo", label: "tudo", href: "/", iniciais: "✨", novo: true, bg: "bg-foreground/5", fg: "text-foreground" },
    { id: "saude", label: "saúde", href: "/explorar?tema=saude", iniciais: "💚" },
    { id: "educacao", label: "educação", href: "/explorar?tema=educacao", iniciais: "📚" },
    { id: "infra", label: "infra", href: "/explorar?tema=infra", iniciais: "🏗️" },
    { id: "cultura", label: "cultura", href: "/explorar?tema=cultura", iniciais: "🎭" },
    ...BAIRROS_AMERICANA.slice(0, 6).map((b) => ({
      id: b.toLowerCase().replace(/\s+/g, "-"),
      label: b.toLowerCase(),
      href: `/explorar?bairro=${encodeURIComponent(b)}`,
    })),
  ];

  return (
    <AppShell>
      {/* Saudação amigável */}
      <section className="pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="w-3.5 h-3.5 text-[var(--political)]" aria-hidden />
          <span>de olho em americana</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight leading-tight mt-1">
          {saudacao()} 👋
        </h1>
        <p className="text-sm text-foreground/70 mt-0.5">
          {ultimaData
            ? `Última atualização do diário: ${dataAmigavel(ultimaData)}.`
            : "Conferindo o que rolou na prefeitura."}
        </p>
      </section>

      {/* Geo breadcrumb */}
      <div className="mt-3">
        <GeoBreadcrumb
          niveis={[
            { label: "Brasil", href: "/explorar" },
            { label: "SP", href: "/explorar?uf=SP" },
            { label: "Americana", href: "/", ativo: true },
          ]}
        />
      </div>

      {/* Stories de temas/bairros */}
      <section className="mt-4">
        <StoriesRow items={stories} />
      </section>

      {/* Feed real */}
      <section className="mt-4 flex flex-col gap-4">
        {feed.map((e, idx) => (
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
                ? "A prefeitura publicou uma edição extra. PDF oficial disponível pra consulta."
                : "Diário oficial do dia, com atos, nomeações e publicações da prefeitura."
            }
            href={`/diario/${e.slug}`}
            cta={{ label: "abrir PDF", href: e.url, externo: true }}
            fonte={{
              label: "@prefeitura-americana",
              url: "https://www.americana.sp.gov.br",
            }}
            shareUrl={`/diario/${e.slug}`}
          />
        ))}

        {/* Estado honesto: o que ainda não temos */}
        <EmptyState
          icone="🚧"
          titulo="Contratos e pagamentos: estamos chegando"
          descricao={`Pra Americana, a execução orçamentária (despesas e pagamentos com credor) ainda não foi publicada pela prefeitura. Os contratos do PNCP entram quando o coletor passar pela API. Por enquanto, fica só o diário — que já são ${meta.total} edições reais.`}
          acao={
            <Link
              href="/financas"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--political)] mt-1"
            >
              ver painel financeiro
              <ArrowRight className="w-3.5 h-3.5" aria-hidden />
            </Link>
          }
        />
      </section>

      <p className="text-[11px] text-muted-foreground/70 text-center mt-6 mb-2">
        {meta.total} edições reais carregadas · última coleta {dataAmigavel(meta.ultimaColeta.slice(0, 10))}
      </p>
    </AppShell>
  );
}
