/**
 * /familia/[slug] — pessoas que compartilham um sobrenome em função pública.
 *
 * Coocorrência factual, com fonte — nunca prova de parentesco nem acusação.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AtomCard } from "@/components/feed/atom-card";
import { getFamilia } from "@/lib/entidades";
import { getAtomsPorIds } from "@/lib/atoms";
import { periodoLabel } from "@/lib/periodo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const f = await getFamilia(slug);
  if (!f) return { title: "Sobrenome não encontrado — DeOlho" };
  return {
    title: `Sobrenome ${f.sobrenome} — DeOlho`,
    description: `Agentes públicos com o sobrenome ${f.sobrenome} no Diário de Americana.`,
  };
}

export default async function FamiliaPage({ params }: PageProps) {
  const { slug } = await params;
  const familia = await getFamilia(slug);
  if (!familia) notFound();

  const atoms = await getAtomsPorIds(familia.atomIds);
  const periodo = periodoLabel(familia.anos, familia.primeiraData, familia.ultimaData);

  return (
    <AppShell>
      <Link href="/familias" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        sobrenomes
      </Link>

      <header className="mb-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">sobrenome</p>
        <h1 className="text-2xl font-bold tracking-tight leading-tight">
          {familia.sobrenome}
          {familia.comum && (
            <span className="ml-2 align-middle text-[10px] font-normal text-amber-700 bg-amber-50 ring-1 ring-amber-200/60 rounded-full px-1.5 py-0.5">
              sobrenome comum
            </span>
          )}
        </h1>
        <p className="text-sm text-foreground/70 mt-1">
          {familia.totalPessoas} {familia.totalPessoas === 1 ? "pessoa" : "pessoas"} em função pública
          {periodo ? ` · ${periodo}` : ""}
        </p>
      </header>

      <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200/70 px-4 py-3 mb-5 flex gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden />
        <p className="text-[12px] text-amber-900/90 leading-relaxed">
          Sobrenome igual <strong>não comprova parentesco</strong>. Esta é uma visão de
          coocorrência em atos oficiais — pra investigar, nunca uma conclusão.
        </p>
      </div>

      {/* Pessoas */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2">pessoas</h2>
        <div className="flex flex-col gap-2">
          {familia.pessoas.map((p) => (
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
                {p.cargos.length > 0 && (
                  <p className="text-[11px] text-muted-foreground truncate">{p.cargos.join(" · ")}</p>
                )}
              </div>
              <span className="text-muted-foreground shrink-0">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Atos */}
      {atoms.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-2">atos relacionados</h2>
          <div className="flex flex-col gap-4">
            {atoms.slice(0, 12).map((a) => <AtomCard key={a.id} atom={a} />)}
          </div>
        </section>
      )}
    </AppShell>
  );
}
