/**
 * /explorar — entrada para entidades REAIS.
 *
 * Mostra os CNPJs reais que já apareceram no diário (extraídos com checksum
 * validado), as cidades e os temas. Sem fixtures. Cada CNPJ leva para
 * /empresa/[cnpj] que carrega BrasilAPI + CEIS reais.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Tag } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { StoriesRow, type StoryItem } from "@/components/feed/stories-row";
import { GeoBreadcrumb } from "@/components/feed/geo-breadcrumb";
import { CNPJS_DO_DIARIO, BAIRROS_AMERICANA } from "@/lib/civic-data";

export const metadata: Metadata = {
  title: "Explorar — DeOlho",
  description: "Empresas, cidades, bairros e temas com dado público verificável.",
};

interface PageProps {
  searchParams: Promise<{ q?: string; tema?: string; bairro?: string }>;
}

function formatarCnpj(d: string): string {
  if (d.length !== 14) return d;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export default async function ExplorarPage({ searchParams }: PageProps) {
  const { q, tema, bairro } = await searchParams;

  const stories: StoryItem[] = [
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
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      <header className="mb-3">
        <h1 className="text-2xl font-bold tracking-tight leading-tight">Explorar</h1>
        <p className="text-sm text-foreground/70 mt-0.5">
          {q
            ? `Resultados para "${q}".`
            : tema
              ? `Filtrando por ${tema}.`
              : bairro
                ? `Bairro: ${bairro}.`
                : "Empresas, bairros e temas — só o que existe de verdade."}
        </p>
      </header>

      <GeoBreadcrumb
        niveis={[
          { label: "Brasil", href: "/explorar" },
          { label: "SP", href: "/explorar?uf=SP" },
          { label: "Americana", href: "/explorar", ativo: true },
        ]}
        className="mb-3"
      />

      <StoriesRow items={stories} className="mb-5" />

      {/* CNPJs reais que apareceram no diário */}
      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2 px-1 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-foreground/70" aria-hidden />
          empresas que apareceram no diário
        </h2>
        <div className="flex flex-col gap-2">
          {CNPJS_DO_DIARIO.map((cnpj) => (
            <Link
              key={cnpj}
              href={`/empresa/${cnpj}`}
              className="rounded-2xl bg-card border border-border/40 shadow-sm px-4 py-3 hover:shadow-md transition-shadow flex items-center gap-3 group"
            >
              <span
                aria-hidden
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-100 to-rose-100 text-violet-700 flex items-center justify-center text-xs font-semibold shrink-0"
              >
                {cnpj.slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  CNPJ
                </p>
                <p className="text-sm font-medium font-mono">{formatarCnpj(cnpj)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  toque para ver razão social, sócios e sanções
                </p>
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                →
              </span>
            </Link>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/80 mt-2 px-1">
          Mais empresas aparecem aqui à medida que o extrator de texto do PDF for completando o
          cruzamento diário ↔ CNPJ.
        </p>
      </section>

      {/* Temas — placeholder honesto */}
      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2 px-1 flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-foreground/70" aria-hidden />
          temas
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {["Saúde", "Educação", "Infraestrutura", "Cultura"].map((t) => (
            <Link
              key={t}
              href={`/explorar?tema=${t.toLowerCase()}`}
              className="rounded-2xl bg-card border border-border/40 shadow-sm px-4 py-3 text-sm font-medium hover:shadow-md transition-shadow"
            >
              {t}
            </Link>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/80 mt-2 px-1">
          Filtro por tema entra quando os atos do diário forem classificados.
        </p>
      </section>

      {/* Bairros — placeholder honesto */}
      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2 px-1 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-foreground/70" aria-hidden />
          bairros de Americana
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {BAIRROS_AMERICANA.slice(0, 6).map((b) => (
            <Link
              key={b}
              href={`/explorar?bairro=${encodeURIComponent(b)}`}
              className="rounded-2xl bg-card border border-border/40 shadow-sm px-4 py-3 text-sm font-medium hover:shadow-md transition-shadow"
            >
              {b}
            </Link>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/80 mt-2 px-1">
          Lista manual enquanto não houver tipagem geo nos atos. O drill-down deep
          (rua → bairro → cidade) entra quando a fonte publicar localização.
        </p>
      </section>
    </AppShell>
  );
}
