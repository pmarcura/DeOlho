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
import { ArrowLeft, CalendarDays, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { ReacaoCivica } from "@/components/feed/reacao-civica";
import { SaveShare } from "@/components/feed/save-share";
import { FonteChip } from "@/components/feed/fonte-chip";
import { TrustHint } from "@/components/feed/trust-hint";
import { ValorGrande } from "@/components/feed/valor-grande";
import { EmptyState } from "@/components/feed/empty-state";
import { TextoComMencoes } from "@/components/feed/entity-highlight";
import { PessoasChips, OrgaosChips } from "@/components/feed/entidade-chips";
import { getAtomPorId, limparResumo, TIPO_META } from "@/lib/atoms";
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
  const tituloFinal = atom.tituloHumano ?? atom.titulo;
  const pessoas = atom.pessoas ?? [];
  const orgaos = atom.orgaos ?? [];
  const textoDoc = atom.textoDocumento ?? limparResumo(atom.resumo);

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

      {/* Título humano + nº técnico + ano clicável */}
      <h1 className="text-2xl font-bold tracking-tight leading-tight">{tituloFinal}</h1>
      <div className="flex flex-wrap items-center gap-2 mt-1.5">
        {atom.tituloHumano && <span className="text-xs text-muted-foreground">{atom.titulo}</span>}
        {atom.ano && (
          <Link
            href={`/ano/${atom.ano}`}
            className="inline-flex items-center gap-1 text-[11px] rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 px-2 py-0.5"
          >
            <CalendarDays className="w-3 h-3" aria-hidden />
            {atom.ano}
          </Link>
        )}
      </div>
      {atom.subtitulo && <p className="text-sm text-foreground/70 mt-2">{atom.subtitulo}</p>}

      {/* Valor em destaque pra atos de dinheiro */}
      {isMoney && atom.valorMencionado && (
        <div className="mt-3">
          <ValorGrande valor={atom.valorMencionado} subtexto="valor citado no texto do ato" />
        </div>
      )}

      {/* Pessoas + órgãos citados */}
      {(pessoas.length > 0 || orgaos.length > 0) && (
        <section className="flex flex-col gap-2 mt-4">
          {pessoas.length > 0 && <PessoasChips pessoas={pessoas} max={10} />}
          {orgaos.length > 0 && <OrgaosChips orgaos={orgaos} max={10} />}
        </section>
      )}

      {/* Texto fiel do documento — tudo clicável */}
      <section className="rounded-2xl bg-muted/40 px-4 py-4 mt-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
          texto do documento
        </p>
        <p className="text-[15px] text-foreground/85 leading-relaxed">
          <TextoComMencoes texto={textoDoc} pessoas={pessoas} orgaos={orgaos} />
        </p>
      </section>

      {/* Reactions + Save/Share */}
      <section className="flex items-center justify-between border-y border-border/40 py-2 mt-4">
        <ReacaoCivica />
        <SaveShare shareTitle={tituloFinal} />
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

      {/* Premium — roadmap (versão free continua 100% funcional e gratuita) */}
      <section className="mt-6">
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-sky-50 ring-1 ring-violet-200/60 px-4 py-4">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-violet-700">
            <Sparkles className="w-3.5 h-3.5" aria-hidden />
            DeOlho+ · em breve
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed mt-1.5">
            Uma versão premium vai trazer resumo em linguagem simples por IA, áudio narrado e
            infográfico deste ato. A versão gratuita continua mostrando o documento real,
            de graça e por completo — como você vê acima.
          </p>
        </div>
      </section>

      {/* Engajamento — placeholder /pauta */}
      <section className="mt-4">
        <EmptyState
          icone="💬"
          titulo="Comentários cívicos: em breve"
          descricao="Em breve dá pra discutir aqui — com pseudônimo verificado e foco no ato (nunca em pessoas). Por enquanto, use as reações acima pra sinalizar."
        />
      </section>
    </AppShell>
  );
}
