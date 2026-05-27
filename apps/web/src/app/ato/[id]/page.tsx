/**
 * /ato/[id] — detalhe de um ÁTOMO individual (lei, decreto, contrato, etc.).
 *
 * Mostra o trecho do diário, valor R$ se houver, CNPJs mencionados como
 * pills → /empresa, link pra edição PDF original (proveniência),
 * reactions/save/share. Comentários cívicos identificados (pseudônimo
 * verificado) ficam como placeholder /pauta/[id] na próxima rodada.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { ReacaoCivica } from "@/components/feed/reacao-civica";
import { SaveShare } from "@/components/feed/save-share";
import { FonteChip } from "@/components/feed/fonte-chip";
import { TrustHint } from "@/components/feed/trust-hint";
import { ValorGrande } from "@/components/feed/valor-grande";
import { EmptyState } from "@/components/feed/empty-state";
import { getAtomPorId, TIPO_META } from "@/lib/atoms";
import { getEdicaoPorSlug } from "@/lib/diario";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatarCnpj(d: string): string {
  if (d.length !== 14) return d;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function dataExtensa(iso: string | null): string {
  if (!iso) return "sem data";
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const atom = await getAtomPorId(id);
  if (!atom) return { title: "Ato não encontrado — DeOlho" };
  return {
    title: `${atom.titulo} — DeOlho`,
    description: atom.resumo.slice(0, 160),
  };
}

export default async function AtoPage({ params }: PageProps) {
  const { id } = await params;
  const atom = await getAtomPorId(id);
  if (!atom) notFound();

  const meta = TIPO_META[atom.tipo];
  const edicao = await getEdicaoPorSlug(atom.edicaoSlug);
  const isMoney = ["contrato", "aditivo", "pregao", "convite", "concorrencia", "ata_registro"].includes(atom.tipo);

  return (
    <AppShell>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      {/* Cabeçalho */}
      <header className="flex items-center gap-3 mb-3">
        <span
          aria-hidden
          className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0"
        >
          PA
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="font-semibold">Prefeitura de Americana</p>
            <TrustHint level="oficial" />
          </div>
          <p className="text-xs text-muted-foreground">
            {dataExtensa(atom.edicaoDate)} · {meta.label.toLowerCase()}
          </p>
        </div>
      </header>

      {/* Bloco visual */}
      <div
        className={cn(
          "rounded-3xl aspect-[4/3] flex items-center justify-center mb-4 bg-gradient-to-br",
          meta.cor,
        )}
      >
        <span className="text-7xl leading-none drop-shadow-sm">{meta.emoji}</span>
      </div>

      {/* Título */}
      <h1 className="text-2xl font-bold tracking-tight leading-tight">{atom.titulo}</h1>

      {/* Valor em destaque pra atos de dinheiro */}
      {isMoney && atom.valorMencionado && (
        <div className="mt-3">
          <ValorGrande valor={atom.valorMencionado} subtexto="valor citado no texto do ato" />
        </div>
      )}

      {/* Trecho do diário */}
      <section className="rounded-2xl bg-muted/40 px-4 py-4 mt-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
          trecho do diário
        </p>
        <p className="text-[15px] text-foreground/85 leading-relaxed">{atom.resumo}</p>
      </section>

      {/* Reactions + Save/Share */}
      <section className="flex items-center justify-between border-y border-border/40 py-2 mt-4">
        <ReacaoCivica />
        <SaveShare shareTitle={atom.titulo} />
      </section>

      {/* @CNPJs mencionados */}
      {atom.cnpjsMencionados.length > 0 && (
        <section className="mt-5">
          <h2 className="text-sm font-semibold mb-2">empresas mencionadas</h2>
          <div className="flex flex-col gap-2">
            {atom.cnpjsMencionados.map((cnpj) => (
              <Link
                key={cnpj}
                href={`/empresa/${cnpj}`}
                className="rounded-2xl bg-card border border-border/40 shadow-sm px-4 py-3 hover:shadow-md transition-shadow flex items-center gap-3"
              >
                <span
                  aria-hidden
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-100 to-rose-100 text-violet-700 flex items-center justify-center text-xs font-semibold"
                >
                  {cnpj.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    CNPJ
                  </p>
                  <p className="text-sm font-medium font-mono">{formatarCnpj(cnpj)}</p>
                </div>
                <span className="text-muted-foreground">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Origem — edição PDF */}
      <section className="mt-5">
        <h2 className="text-sm font-semibold mb-2">origem desta informação</h2>
        {edicao ? (
          <Link
            href={`/diario/${edicao.slug}`}
            className="rounded-2xl bg-card border border-border/40 shadow-sm px-4 py-3 hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <span
              aria-hidden
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-100 to-emerald-100 flex items-center justify-center text-xl"
            >
              📜
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Diário Oficial
              </p>
              <p className="text-sm font-medium">
                Edição{edicao.isExtra && " extra"} · {dataExtensa(edicao.date)}
              </p>
            </div>
            <span className="text-muted-foreground">→</span>
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground">edição original não localizada.</p>
        )}
        <div className="mt-2">
          <FonteChip
            label="@prefeitura-americana"
            url={edicao?.url ?? "https://www.americana.sp.gov.br"}
          />
        </div>
      </section>

      {/* Engajamento — placeholder /pauta */}
      <section className="mt-6">
        <EmptyState
          icone="💬"
          titulo="Comentários cívicos: em breve"
          descricao="Em breve dá pra discutir aqui — com pseudônimo verificado e foco no ato (nunca em pessoas). Por enquanto, use as reações acima pra sinalizar."
        />
      </section>
    </AppShell>
  );
}
