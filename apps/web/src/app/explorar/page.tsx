/**
 * /explorar — reformulado depois do feedback do Pedro.
 *
 * Saiu o grid genérico "tipos de entidade". Entra DESCOBERTA:
 *  1. Empresas em alta (CNPJs com mais menções no diário)
 *  2. Atos em destaque (átomos top-score da semana)
 *  3. Bairros de Americana (placeholder até dado real entrar)
 *  4. Vereadores e Escolas (placeholders honestos — exigem novas fontes)
 *
 * Mantém a vibe Instagram-explore mas focado em civic, não social.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, GraduationCap, Users, Landmark } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AtomCard } from "@/components/feed/atom-card";
import { EmptyState } from "@/components/feed/empty-state";
import { GeoBreadcrumb } from "@/components/feed/geo-breadcrumb";
import { getAtomsRanqueados, getTopCnpjs } from "@/lib/atoms";
import { getPessoas, getOrgaos } from "@/lib/entidades";
import { BAIRROS_AMERICANA } from "@/lib/civic-data";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "Explorar — DeOlho",
  description: "Descobrir empresas em alta, atos em destaque, bairros e mais.",
};

function formatarCnpj(d: string): string {
  if (d.length !== 14) return d;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export default async function ExplorarPage() {
  const [topCnpjs, destaques, topPessoas, topOrgaos] = await Promise.all([
    getTopCnpjs(8),
    getAtomsRanqueados({ categoria: "tudo", limit: 3 }),
    getPessoas(6),
    getOrgaos(8),
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
        <h1 className="text-2xl font-bold tracking-tight leading-tight">Explorar</h1>
        <p className="text-sm text-foreground/70 mt-0.5">
          Descubra empresas, atos em destaque, lugares e pessoas públicas.
        </p>
      </header>

      <GeoBreadcrumb
        niveis={[
          { label: "Brasil", href: "/explorar" },
          { label: "SP", href: "/explorar?uf=SP" },
          { label: "Americana", href: "/explorar", ativo: true },
        ]}
        className="mb-5"
      />

      {/* Atos em destaque (top 3 ranqueados) */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2 px-1">🔥 em destaque agora</h2>
        <div className="flex flex-col gap-3">
          {destaques.map((a) => (
            <AtomCard key={a.id} atom={a} />
          ))}
        </div>
        <Link
          href="/radar"
          className="inline-flex items-center justify-center w-full h-10 mt-3 rounded-full bg-foreground/5 text-foreground/80 text-sm font-medium hover:bg-foreground/10"
        >
          ver tudo no radar
        </Link>
      </section>

      {/* Empresas em alta (CNPJs com mais menções no diário) */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2 px-1 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-foreground/70" aria-hidden />
          empresas em alta
        </h2>
        {topCnpjs.length === 0 ? (
          <EmptyState
            icone="🏢"
            titulo="Ainda sem empresas detectadas"
            descricao="A extração de CNPJs do texto dos PDFs vai melhorando à medida que o regex é refinado."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {topCnpjs.map((e) => (
              <Link
                key={e.cnpj}
                href={`/empresa/${e.cnpj}`}
                className="rounded-2xl bg-card border border-border/40 shadow-sm px-4 py-3 hover:shadow-md transition-shadow flex items-center gap-3"
              >
                <span
                  aria-hidden
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-100 to-rose-100 text-violet-700 flex items-center justify-center text-xs font-semibold shrink-0"
                >
                  {e.cnpj.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    CNPJ
                  </p>
                  <p className="text-sm font-mono">{formatarCnpj(e.cnpj)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[var(--political)] tabular-nums">
                    {e.mencoes}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {e.mencoes === 1 ? "menção" : "menções"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bairros de Americana */}
      <section className="mb-6">
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
        <p className="text-[11px] text-muted-foreground/80 mt-2 px-1 leading-relaxed">
          Filtro real por bairro entra quando os atos do diário forem geo-tageados.
        </p>
      </section>

      {/* Órgãos públicos — REAL (Secretarias, DAE, Guarda Municipal…) */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2 px-1 flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-foreground/70" aria-hidden />
          órgãos públicos
        </h2>
        {topOrgaos.length === 0 ? (
          <EmptyState icone="🏛️" titulo="Sem órgãos detectados" descricao="O extrator identifica Secretarias, departamentos e a Guarda Municipal direto do texto do diário." />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {topOrgaos.map((o) => (
              <Link
                key={o.slug}
                href={`/orgao/${o.slug}`}
                className="rounded-2xl bg-card border border-border/40 shadow-sm px-3 py-3 hover:shadow-md transition-shadow"
              >
                <p className="text-sm font-medium leading-tight line-clamp-2">{o.nome}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {o.sigla ? `${o.sigla} · ` : ""}{o.mencoes} {o.mencoes === 1 ? "ato" : "atos"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Agentes públicos citados — REAL */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2 px-1 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-foreground/70" aria-hidden />
          agentes públicos citados
        </h2>
        {topPessoas.length === 0 ? (
          <EmptyState icone="🗳️" titulo="Sem pessoas detectadas" descricao="O extrator captura agentes públicos citados em nomeações, exonerações e assinaturas." />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {topPessoas.map((p) => (
                <Link
                  key={p.slug}
                  href={`/pessoa/${p.slug}`}
                  className="rounded-2xl bg-card border border-border/40 shadow-sm px-4 py-3 hover:shadow-md transition-shadow flex items-center gap-3"
                >
                  <span
                    aria-hidden
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-100 to-orange-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0"
                  >
                    {p.nome.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{p.nome}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.cargos[0] ?? p.papeis[0]}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[var(--political)] tabular-nums">{p.mencoes}</p>
                    <p className="text-[10px] text-muted-foreground">{p.mencoes === 1 ? "ato" : "atos"}</p>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href="/familias"
              className="inline-flex items-center justify-center w-full h-10 mt-3 rounded-full bg-foreground/5 text-foreground/80 text-sm font-medium hover:bg-foreground/10"
            >
              sobrenomes em atos oficiais →
            </Link>
          </>
        )}
      </section>

      {/* Escolas — placeholder honesto */}
      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2 px-1 flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-foreground/70" aria-hidden />
          escolas públicas
        </h2>
        <EmptyState
          icone="🏫"
          titulo="Escolas: depende do SIAFIC"
          descricao="Quando a Secretaria de Educação publicar gastos por unidade (ou o SIAFIC municipal entrar no ar), cada escola vira uma página com orçamento, contratos e obras."
        />
      </section>
    </AppShell>
  );
}
