/**
 * Radar de mudanças públicas — lista vertical de eventos verificáveis.
 *
 * docs/patterns/telas.md "Radar":
 *  - Filtros compactos no topo (mobile).
 *  - TerritorialCarousel.
 *  - Lista única em cards.
 *  - Estados obrigatórios visíveis (limitação inline; vazio = mensagem útil).
 */
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import { EventoPublicoCard } from "@/components/deolho/cards";
import { TerritorialCarousel } from "@/components/deolho/territorial-carousel";
import { AvisoSintetico } from "@/components/deolho/blocos";
import { EVENTOS_RADAR, TERRITORIOS } from "@/lib/civic-data";

export const metadata: Metadata = {
  title: "Radar — DeOlho",
  description: "Radar de mudanças públicas em Americana — fatos, atos, contratos e pagamentos com fonte e confiança.",
};

export default function RadarPage() {
  return (
    <AppShell>
      <section className="flex flex-col gap-1 pb-1">
        <h1 className="text-xl font-bold tracking-tight leading-tight">
          Radar de mudanças públicas
        </h1>
        <p className="text-sm text-muted-foreground">
          Eventos verificáveis em Americana, com fonte, data e grau de confiança.
        </p>
      </section>

      <section className="mt-4">
        <TerritorialCarousel items={TERRITORIOS} selectedId="americana" />
      </section>

      <section className="mt-4 flex flex-col gap-2.5">
        {EVENTOS_RADAR.map((ev) => (
          <EventoPublicoCard key={ev.id} evento={ev} />
        ))}
      </section>

      <section className="mt-5 mb-2">
        <AvisoSintetico />
      </section>
    </AppShell>
  );
}
