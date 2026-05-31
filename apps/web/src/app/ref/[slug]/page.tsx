/**
 * /ref/[slug] — "tudo que se correlaciona com esta referência".
 *
 * Quando um evento público cita "Lei nº 6.274/2019", o usuário clica e
 * cai aqui: a lista de todos os átomos (no diário inteiro) que tocam essa
 * lei. Resposta direta ao pedido do Pedro: "clicar e ver tudo que
 * correlaciona com essa informação, com resumo breve".
 *
 * Slug format: <tipo>-<numero>-<ano>  (ex.: lei-6274-2019, pregao-055-2025)
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AtomCard } from "@/components/feed/atom-card";
import { EmptyState } from "@/components/feed/empty-state";
import { TipoExplicacao } from "@/components/feed/tipo-explicacao";
import { getAtomsPorRef, getAtomsPorProcesso, TIPO_META, type TipoAto, type Atom } from "@/lib/atoms";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const TIPOS_VALIDOS: TipoAto[] = [
  "lei",
  "decreto",
  "portaria",
  "resolucao",
  "contrato",
  "aditivo",
  "edital",
  "pregao",
  "convite",
  "concorrencia",
  "convenio",
  "ata_registro",
];

interface ParsedRef {
  tipo: TipoAto;
  numero: string;
  ano: string | null;
}

/** "processo-818-2025" → "818/2025"; "processo-11-634-2025" → "11.634/2025". */
function numeroProcesso(slug: string): string {
  const partes = slug.replace(/^processo-/, "").split("-").filter(Boolean);
  if (partes.length === 0) return slug;
  const ultimo = partes[partes.length - 1]!;
  if (/^\d{4}$/.test(ultimo) && partes.length > 1) {
    return `${partes.slice(0, -1).join(".")}/${ultimo}`;
  }
  return partes.join(".");
}

function parseSlug(slug: string): ParsedRef | null {
  // Slug: tipo-numero(-ano). Tipo pode ter "_" (ata_registro).
  const decoded = decodeURIComponent(slug);
  // Tenta casar TIPOS_VALIDOS no começo da string (maior primeiro evita ambiguidade).
  const tiposOrdenados = [...TIPOS_VALIDOS].sort((a, b) => b.length - a.length);
  for (const t of tiposOrdenados) {
    if (decoded.startsWith(t + "-")) {
      const rest = decoded.slice(t.length + 1);
      // rest = numero[-ano]
      const m = rest.match(/^([\d.]+)(?:-(\d{2,4}))?$/);
      if (!m) continue;
      return { tipo: t, numero: m[1]!, ano: m[2] ?? null };
    }
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug.startsWith("processo-")) {
    const num = numeroProcesso(slug);
    return { title: `Processo nº ${num} — DeOlho`, description: `Atos ligados ao processo ${num} no diário de Americana.` };
  }
  const ref = parseSlug(slug);
  if (!ref) return { title: "Referência não encontrada — DeOlho" };
  const meta = TIPO_META[ref.tipo];
  const titulo = `${meta.label} nº ${ref.numero}${ref.ano ? `/${ref.ano}` : ""}`;
  return {
    title: `${titulo} — DeOlho`,
    description: `Tudo o que se correlaciona com ${titulo} no diário de Americana.`,
  };
}

export default async function RefPage({ params }: PageProps) {
  const { slug } = await params;

  // Processo administrativo — cross-ref por varredura de texto.
  if (slug.startsWith("processo-")) {
    const numero = numeroProcesso(slug);
    const atoms = await getAtomsPorProcesso(slug.replace(/^processo-/, ""));
    return <ProcessoView numero={numero} atoms={atoms} />;
  }

  const ref = parseSlug(slug);
  if (!ref) notFound();

  const atoms = await getAtomsPorRef(ref.tipo, ref.numero, ref.ano);
  const meta = TIPO_META[ref.tipo];
  const tituloRef = `${meta.label} nº ${ref.numero}${ref.ano ? `/${ref.ano}` : ""}`;

  return (
    <AppShell>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      {/* Header da referência */}
      <header className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span
            aria-hidden
            className={cn(
              "inline-flex items-center justify-center w-12 h-12 rounded-2xl text-2xl bg-gradient-to-br",
              meta.cor,
            )}
          >
            {meta.emoji}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              referência
            </p>
            <h1 className="text-xl font-bold tracking-tight leading-tight">{tituloRef}</h1>
          </div>
        </div>
        <p className="text-sm text-foreground/70 mt-2">
          {atoms.length === 0
            ? "Nenhum ato no diário menciona essa referência (ainda)."
            : atoms.length === 1
              ? "Uma menção encontrada no diário de Americana."
              : `${atoms.length} menções encontradas no diário de Americana.`}
        </p>
        <div className="mt-3">
          <TipoExplicacao tipo={ref.tipo} />
        </div>
      </header>

      <section className="flex flex-col gap-4">
        {atoms.length === 0 ? (
          <EmptyState
            icone="🔎"
            titulo="Sem menções por aqui"
            descricao="Talvez essa referência ainda não tenha sido extraída, ou seja externa ao diário de Americana. O coletor segue raspando."
            acao={
              <Link href="/" className="text-sm font-semibold text-[var(--political)] mt-1">
                voltar ao radar
              </Link>
            }
          />
        ) : (
          atoms.map((a) => <AtomCard key={a.id} atom={a} />)
        )}
      </section>
    </AppShell>
  );
}

function ProcessoView({ numero, atoms }: { numero: string; atoms: Atom[] }) {
  return (
    <AppShell>
      <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      <header className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span aria-hidden className="inline-flex items-center justify-center w-12 h-12 rounded-2xl text-2xl bg-zinc-100">
            📁
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">processo administrativo</p>
            <h1 className="text-xl font-bold tracking-tight leading-tight">Processo nº {numero}</h1>
          </div>
        </div>
        <p className="text-sm text-foreground/70 mt-2">
          {atoms.length === 0
            ? "Nenhum ato menciona esse processo (ainda)."
            : `${atoms.length} ${atoms.length === 1 ? "ato menciona" : "atos mencionam"} esse processo — licitação, contrato, aditivo e pagamentos costumam compartilhar o mesmo nº.`}
        </p>
      </header>

      <section className="flex flex-col gap-4">
        {atoms.length === 0 ? (
          <EmptyState
            icone="🔎"
            titulo="Sem menções por aqui"
            descricao="Esse processo pode não ter sido extraído ainda, ou estar fora do diário de Americana."
          />
        ) : (
          atoms.map((a) => <AtomCard key={a.id} atom={a} />)
        )}
      </section>
    </AppShell>
  );
}
