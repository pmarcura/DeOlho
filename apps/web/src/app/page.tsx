"use client";

/**
 * Home — DeOlho mobile-first.
 *
 * Estrutura (docs/patterns/telas.md "Home"):
 *  - Carrossel territorial (Brasil → SP → Americana → bairro → temas).
 *  - Radar de mudanças públicas (EventoPublicoCard em lista vertical).
 *  - Entidades em destaque (EntidadeCard).
 *  - Aviso de dados sintéticos.
 *  - Navegação inferior mobile (MobileBottomNav via AppShell).
 *
 * Sem hero de marketing. Sem feed social. Sem post/like.
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Radar as RadarIcon, Eye } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { TerritorialCarousel } from "@/components/deolho/territorial-carousel";
import { EventoPublicoCard, EntidadeCard } from "@/components/deolho/cards";
import { AvisoSintetico } from "@/components/deolho/blocos";
import { Button } from "@/components/ui/button";
import { EVENTOS_RADAR, TERRITORIOS, EMPRESAS_REF, PREFEITURA_REF } from "@/lib/civic-data";

export default function HomePage() {
  const [territorio, setTerritorio] = useState<string>("americana");

  return (
    <AppShell>
      {/* Hero compacto — não vende, situa */}
      <section className="flex flex-col gap-1 pb-1">
        <div className="flex items-center gap-1.5 text-[var(--political)] text-[10px] font-semibold uppercase tracking-wider">
          <Eye className="w-3 h-3" aria-hidden />
          DeOlho · Americana, SP
        </div>
        <h1 className="text-xl font-bold tracking-tight leading-tight">
          O que mudou na coisa pública hoje?
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Atos, contratos e atualizações verificáveis — com fonte, data e grau de confiança.
        </p>
      </section>

      {/* Atualizações recentes — carrossel territorial */}
      <section className="mt-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Atualizações recentes
        </h2>
        <TerritorialCarousel
          items={TERRITORIOS}
          selectedId={territorio}
          onSelect={setTerritorio}
        />
      </section>

      {/* Radar de mudanças públicas */}
      <section className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <RadarIcon className="w-3.5 h-3.5" aria-hidden />
            Radar de mudanças públicas
          </h2>
          <Button variant="link" size="xs" asChild>
            <Link href="/radar" className="flex items-center gap-0.5">
              ver todas
              <ArrowRight className="w-3 h-3" aria-hidden />
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-2.5">
          {EVENTOS_RADAR.slice(0, 4).map((ev) => (
            <EventoPublicoCard key={ev.id} evento={ev} />
          ))}
        </div>
      </section>

      {/* Entidades em destaque */}
      <section className="mt-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Entidades em destaque
        </h2>
        <div className="flex flex-col gap-2">
          <EntidadeCard
            entidade={PREFEITURA_REF}
            subtitulo="Órgão público sintético · Americana, SP"
          />
          {EMPRESAS_REF.map((e) => (
            <EntidadeCard
              key={e.id}
              entidade={e}
              subtitulo="Empresa sintética com vínculo público sintético"
            />
          ))}
        </div>
      </section>

      {/* Atalho /financas como ponte para o que já existe */}
      <section className="mt-6">
        <Link
          href="/financas"
          className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-[var(--political-soft)] text-[var(--political)] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Painel financeiro de Americana</p>
              <p className="text-xs text-muted-foreground truncate">
                Orçamento, contratos por mês, secretarias e fornecedores.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
        </Link>
      </section>

      {/* Rodapé com aviso de dados sintéticos */}
      <section className="mt-6 mb-4">
        <AvisoSintetico />
      </section>
    </AppShell>
  );
}
