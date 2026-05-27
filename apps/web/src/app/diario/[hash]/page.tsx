/**
 * /diario/[hash] — detalhe de uma edição REAL do Diário de Americana.
 *
 * Dado real, sem fixture. Quando o hash não existe no JSON raspado, retorna 404.
 * O PDF abre direto na prefeitura (fonte oficial). Reações cívicas em cima da
 * edição (uma edição é OBJETO público, não pessoa) — válido pra emoji-reagir.
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
import { getEdicaoPorSlug, dataAmigavel, dataExtensa } from "@/lib/diario";

interface PageProps {
  params: Promise<{ hash: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { hash } = await params;
  const edicao = await getEdicaoPorSlug(hash);
  if (!edicao) return { title: "Edição não encontrada — DeOlho" };
  const titulo = edicao.isExtra
    ? `Edição extra · ${dataExtensa(edicao.date)}`
    : `Edição de ${dataExtensa(edicao.date)}`;
  return {
    title: `${titulo} — Diário de Americana`,
    description: "Edição real do diário oficial de Americana, com fonte da prefeitura.",
  };
}

export default async function DiarioDetailPage({ params }: PageProps) {
  const { hash } = await params;
  const edicao = await getEdicaoPorSlug(hash);
  if (!edicao) notFound();

  const titulo = edicao.isExtra
    ? `Edição extra · ${dataExtensa(edicao.date)}`
    : `Edição de ${dataExtensa(edicao.date)}`;

  return (
    <AppShell>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      {/* Cabeçalho com avatar + nome + tempo */}
      <header className="flex items-center gap-3 mb-4">
        <span
          aria-hidden
          className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-base font-semibold shrink-0"
        >
          PA
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="font-semibold">Prefeitura de Americana</p>
            <TrustHint level="oficial" />
          </div>
          <p className="text-xs text-muted-foreground">
            {dataAmigavel(edicao.date)} · diário oficial{edicao.isExtra && " · edição extra"}
          </p>
        </div>
      </header>

      {/* Bloco visual grande */}
      <div
        className={`rounded-3xl aspect-square sm:aspect-[4/3] flex items-center justify-center mb-4 ${
          edicao.isExtra
            ? "bg-gradient-to-br from-amber-100 via-rose-100 to-violet-100"
            : "bg-gradient-to-br from-sky-100 via-emerald-100 to-amber-50"
        }`}
      >
        <span className="text-7xl leading-none">{edicao.isExtra ? "📰" : "📜"}</span>
      </div>

      {/* Título e resumo */}
      <section className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight leading-tight">{titulo}</h1>
        <p className="text-sm text-foreground/75 leading-relaxed">
          {edicao.isExtra
            ? "Edição extra publicada fora do calendário regular. O PDF abaixo é a fonte oficial — qualquer ato citado precisa ser verificado nele."
            : "Diário oficial publicado pela prefeitura. Atos administrativos, nomeações, contratos e avisos do município ficam aqui."}
        </p>
      </section>

      {/* CTAs */}
      <section className="mt-4 flex flex-col gap-2">
        <a
          href={edicao.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-[var(--political)] text-white font-semibold hover:opacity-90 transition-opacity"
        >
          <FileText className="w-4 h-4" aria-hidden />
          abrir PDF oficial
        </a>
        <FonteChip
          label="@prefeitura-americana"
          url="https://www.americana.sp.gov.br"
          className="self-center"
        />
      </section>

      {/* Reações + Save/Share */}
      <section className="mt-5 flex items-center justify-between border-t border-border/40 pt-3">
        <ReacaoCivica />
        <SaveShare shareTitle={titulo} />
      </section>

      {/* Estado honesto: menções */}
      <section className="mt-6 rounded-2xl bg-muted/30 px-4 py-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          em breve
        </p>
        <p className="text-sm text-foreground/85 leading-relaxed mt-1">
          Vamos extrair o texto do PDF e ligar a esta edição os CNPJs e contratos mencionados —
          pra você ver, em um clique, quais empresas aparecem nos atos do dia.
        </p>
      </section>
    </AppShell>
  );
}
