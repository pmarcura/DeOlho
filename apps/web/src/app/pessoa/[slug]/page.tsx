/**
 * /pessoa/[slug] — perfil de um AGENTE PÚBLICO citado no diário.
 *
 * Responde "nome da pessoa… clicar e ver tudo que conecta com isso": cargos,
 * papéis (assina / nomeado / exonerado…), órgãos onde aparece, há quanto tempo,
 * e todos os atos que a citam. Só pessoa_pública em função pública — nunca
 * cidadão comum (princípio do projeto).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users2, CalendarClock, FileStack } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AtomCard } from "@/components/feed/atom-card";
import { OrgaosChips, PAPEL_LABEL } from "@/components/feed/entidade-chips";
import { getPessoa, getOrgaos } from "@/lib/entidades";
import { getAtomsPorIds } from "@/lib/atoms";
import { periodoLabel, tempoLabel } from "@/lib/periodo";
import { slugify } from "@/lib/slug";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPessoa(slug);
  if (!p) return { title: "Pessoa não encontrada — DeOlho" };
  return {
    title: `${p.nome} — DeOlho`,
    description: `Atos do Diário de Americana que citam ${p.nome}${p.cargos[0] ? ` (${p.cargos[0]})` : ""}.`,
  };
}

export default async function PessoaPage({ params }: PageProps) {
  const { slug } = await params;
  const pessoa = await getPessoa(slug);
  if (!pessoa) notFound();

  const [atoms, orgaosAll] = await Promise.all([
    getAtomsPorIds(pessoa.atomIds),
    getOrgaos(),
  ]);
  const orgaoMap = new Map(orgaosAll.map((o) => [o.slug, o]));
  const orgaosLigados = pessoa.orgaos
    .map((s) => orgaoMap.get(s))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .map((o) => ({ nome: o.nome, slug: o.slug, sigla: o.sigla }));

  const periodo = periodoLabel(pessoa.anos, pessoa.primeiraData, pessoa.ultimaData);
  const tempo = tempoLabel(pessoa.anos);
  const familiaSlug = slugify(pessoa.sobrenome);

  return (
    <AppShell>
      <Link href="/explorar" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      {/* Cabeçalho */}
      <header className="flex items-start gap-3 mb-4">
        <span
          aria-hidden
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-orange-100 text-rose-700 flex items-center justify-center text-xl font-bold shrink-0"
        >
          {pessoa.nome.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-rose-700/80 font-medium">agente público</p>
          <h1 className="text-xl font-bold tracking-tight leading-tight">{pessoa.nome}</h1>
          {pessoa.cargos.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {pessoa.cargos.map((c) => (
                <span key={c} className="text-[11px] rounded-full bg-rose-50 text-rose-800 ring-1 ring-rose-200/70 px-2 py-0.5">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Stat icon={<FileStack className="w-4 h-4" />} valor={String(pessoa.mencoes)} label={pessoa.mencoes === 1 ? "ato" : "atos"} />
        <Stat icon={<CalendarClock className="w-4 h-4" />} valor={periodo ?? "—"} label={tempo ?? "período"} />
        <Stat icon={<Users2 className="w-4 h-4" />} valor={pessoa.papeis.map((p) => PAPEL_LABEL[p]).slice(0, 1).join("")} label="papel" />
      </div>

      {/* Família */}
      <Link
        href={`/familia/${familiaSlug}`}
        className="block rounded-2xl bg-card border border-border/40 shadow-sm px-4 py-3 hover:shadow-md transition-shadow mb-5"
      >
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">sobrenome</p>
        <p className="text-sm font-semibold flex items-center justify-between">
          <span>{pessoa.sobrenome}</span>
          <span className="text-xs font-normal text-muted-foreground">ver quem mais tem esse sobrenome →</span>
        </p>
      </Link>

      {/* Órgãos */}
      {orgaosLigados.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-semibold mb-2">órgãos onde aparece</h2>
          <OrgaosChips orgaos={orgaosLigados} max={12} />
        </section>
      )}

      {/* Atos */}
      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2">
          {atoms.length} {atoms.length === 1 ? "ato cita" : "atos citam"} {pessoa.nome.split(" ")[0]}
        </h2>
        <div className="flex flex-col gap-4">
          {atoms.map((a) => <AtomCard key={a.id} atom={a} />)}
        </div>
      </section>

      <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-4 px-1">
        Pessoa pública citada no Diário Oficial no exercício de função pública. O DeOlho
        não registra cidadãos comuns nem emite juízo — só mostra os atos oficiais, com fonte.
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
