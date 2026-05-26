/**
 * Explorar — navegar por entidades.
 *
 * Mobile-first: tiles de tipo (Contratos / Empresas / Órgãos / Pessoas /
 * Cidades / Documentos / Leis / Temas) → entidades em destaque.
 *
 * Suporta ?q= da busca universal (sem ranking moral; resultado mostra tipo+fonte).
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  FileText,
  Hammer,
  Landmark,
  MapPin,
  ScrollText,
  Tag,
  UserCircle2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { EntidadeCard } from "@/components/deolho/cards";
import { AvisoSintetico } from "@/components/deolho/blocos";
import { Card, CardContent } from "@/components/ui/card";
import { EMPRESAS_REF, PREFEITURA_REF, CONTRATO_DESTAQUE } from "@/lib/civic-data";

export const metadata: Metadata = {
  title: "Explorar — DeOlho",
  description: "Navegar por entidades públicas verificáveis.",
};

const TIPOS = [
  { tipo: "contrato", label: "Contratos", icon: FileText, href: "/contrato/ct-sint-001" },
  { tipo: "empresa", label: "Empresas", icon: Building2, href: "/entidade/empresa/construtora-sintetica-alfa" },
  { tipo: "orgao", label: "Órgãos", icon: Landmark, href: "/entidade/orgao/municipio-americana" },
  { tipo: "pessoa-publica", label: "Agentes públicos", icon: UserCircle2, href: "/explorar?q=vereador" },
  { tipo: "cidade", label: "Cidades", icon: MapPin, href: "/cidade/americana" },
  { tipo: "obra", label: "Obras", icon: Hammer, href: "/explorar?q=obra" },
  { tipo: "lei", label: "Leis", icon: ScrollText, href: "/explorar?q=lei" },
  { tipo: "tema", label: "Temas", icon: Tag, href: "/explorar?q=tema" },
] as const;

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ExplorarPage({ searchParams }: PageProps) {
  const { q } = await searchParams;

  return (
    <AppShell>
      <section className="flex flex-col gap-1 pb-1">
        <h1 className="text-xl font-bold tracking-tight leading-tight">
          Navegar por entidades
        </h1>
        <p className="text-sm text-muted-foreground">
          {q
            ? `Mostrando resultados sintéticos para "${q}".`
            : "Comece pelo tipo de informação que você quer ver com seus olhos."}
        </p>
      </section>

      {/* Grid de tipos */}
      <section className="mt-4 grid grid-cols-2 gap-2">
        {TIPOS.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.tipo}
              href={t.href}
              className="rounded-xl border border-border/60 bg-card p-3 hover:shadow-sm transition-shadow flex items-center gap-2.5"
            >
              <span className="w-9 h-9 rounded-lg bg-[var(--political-soft)] text-[var(--political)] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" aria-hidden />
              </span>
              <span className="text-sm font-medium">{t.label}</span>
            </Link>
          );
        })}
      </section>

      {/* Entidades em destaque */}
      <section className="mt-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Em destaque
        </h2>
        <div className="flex flex-col gap-2">
          <EntidadeCard
            entidade={PREFEITURA_REF}
            subtitulo="Órgão público sintético · Americana, SP"
          />
          {EMPRESAS_REF.map((e) => (
            <EntidadeCard key={e.id} entidade={e} subtitulo="Empresa sintética" />
          ))}
          <Link
            href={`/contrato/${CONTRATO_DESTAQUE.id}`}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-xl"
          >
            <Card size="sm" className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center gap-3 py-1">
                <span className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200/80 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Contrato</p>
                  <p className="text-sm font-medium truncate">
                    {CONTRATO_DESTAQUE.numero} · {CONTRATO_DESTAQUE.objeto}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      <section className="mt-6 mb-2">
        <AvisoSintetico />
      </section>
    </AppShell>
  );
}
