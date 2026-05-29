/**
 * /orgao/[slug] — página de um ÓRGÃO público (Secretaria, DAE, Guarda Municipal…).
 *
 * Resposta direta ao pedido: "guarda municipal de americana também, clicar e
 * ver tudo que ela foi citada". Lista todos os atos que mencionam o órgão, as
 * pessoas ligadas a ele e o período de aparições — com fonte.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Landmark, CalendarClock, FileStack, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AtomCard } from "@/components/feed/atom-card";
import { PessoasChips } from "@/components/feed/entidade-chips";
import { getOrgao, getPessoas } from "@/lib/entidades";
import { getAtomsPorIds } from "@/lib/atoms";
import { periodoLabel } from "@/lib/periodo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function valorCurto(n: number): string {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (n >= 1_000) return `R$ ${Math.round(n / 1_000)} mil`;
  return `R$ ${n}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const o = await getOrgao(slug);
  if (!o) return { title: "Órgão não encontrado — DeOlho" };
  return {
    title: `${o.nome} — DeOlho`,
    description: `Atos do Diário de Americana que citam ${o.nome}.`,
  };
}

export default async function OrgaoPage({ params }: PageProps) {
  const { slug } = await params;
  const orgao = await getOrgao(slug);
  if (!orgao) notFound();

  const [atoms, pessoasAll] = await Promise.all([
    getAtomsPorIds(orgao.atomIds),
    getPessoas(),
  ]);
  const pessoaMap = new Map(pessoasAll.map((p) => [p.slug, p]));
  const pessoasLigadas = orgao.pessoas
    .map((s) => pessoaMap.get(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .sort((a, b) => b.mencoes - a.mencoes)
    .map((p) => ({ nome: p.nome, slug: p.slug, sobrenome: p.sobrenome, papel: p.papeis[0] ?? "citado", cargo: p.cargos[0] ?? null }));

  const periodo = periodoLabel(orgao.anos, orgao.primeiraData, orgao.ultimaData);

  return (
    <AppShell>
      <Link href="/explorar" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      <header className="flex items-start gap-3 mb-4">
        <span
          aria-hidden
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 text-indigo-700 flex items-center justify-center shrink-0"
        >
          <Landmark className="w-7 h-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-indigo-700/80 font-medium">órgão público</p>
          <h1 className="text-xl font-bold tracking-tight leading-tight">{orgao.nome}</h1>
          {orgao.sigla && (
            <span className="inline-block text-[11px] rounded-full bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200/70 px-2 py-0.5 mt-1.5">
              {orgao.sigla}
            </span>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Stat icon={<FileStack className="w-4 h-4" />} valor={String(orgao.mencoes)} label={orgao.mencoes === 1 ? "ato" : "atos"} />
        <Stat icon={<CalendarClock className="w-4 h-4" />} valor={periodo ?? "—"} label="período" />
        <Stat icon={<Wallet className="w-4 h-4" />} valor={orgao.valorTotal > 0 ? valorCurto(orgao.valorTotal) : "—"} label="em atos citados" />
      </div>

      {/* Pessoas ligadas */}
      {pessoasLigadas.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-semibold mb-2">pessoas ligadas a este órgão</h2>
          <PessoasChips pessoas={pessoasLigadas} max={20} />
        </section>
      )}

      {/* Atos */}
      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2">
          {atoms.length} {atoms.length === 1 ? "ato cita" : "atos citam"} {orgao.sigla ?? orgao.nome}
        </h2>
        <div className="flex flex-col gap-4">
          {atoms.map((a) => <AtomCard key={a.id} atom={a} />)}
        </div>
      </section>

      <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-4 px-1">
        Aparições do órgão no Diário Oficial de Americana. O valor é a soma dos valores
        citados nos atos onde o órgão aparece — um indicador, não o orçamento oficial.
      </p>
    </AppShell>
  );
}

function Stat({ icon, valor, label }: { icon: React.ReactNode; valor: string; label: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border/40 shadow-sm px-3 py-2.5 flex flex-col gap-0.5">
      <span className="text-muted-foreground" aria-hidden>{icon}</span>
      <span className="text-base font-bold tracking-tight leading-none truncate">{valor}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
