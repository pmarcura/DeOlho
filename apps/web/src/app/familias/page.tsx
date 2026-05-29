/**
 * /familias — "quantas famílias estão no poder e há quanto tempo".
 *
 * Tratado com HONESTIDADE e ÉTICA (project-deolho.md):
 *  - só agentes públicos em função pública (nunca cidadão comum);
 *  - sobrenome igual NÃO prova parentesco — é coocorrência factual, com fonte;
 *  - sem juízo, sem "score", sem acusação.
 *
 * Duas visões reais: quem mais aparece nos atos (poder de fato) e quais
 * sobrenomes se repetem (sinal a investigar, nunca conclusão).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info, CalendarClock } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { getPessoas, getFamilias } from "@/lib/entidades";
import { periodoLabel, tempoLabel } from "@/lib/periodo";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "Sobrenomes no poder — DeOlho",
  description: "Quem ocupa funções públicas em Americana e quais sobrenomes se repetem nos atos oficiais — coocorrência factual, com fonte.",
};

export default async function FamiliasPage() {
  const [pessoas, familias] = await Promise.all([
    getPessoas(),
    getFamilias({ incluirComuns: true }),
  ]);
  const topPessoas = pessoas.filter((p) => p.cargos.length > 0 || p.mencoes >= 2).slice(0, 12);
  const repetidos = familias.filter((f) => f.totalPessoas >= 2);

  return (
    <AppShell>
      <Link href="/explorar" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      <header className="mb-3">
        <h1 className="text-2xl font-bold tracking-tight leading-tight">Quem está no poder?</h1>
        <p className="text-sm text-foreground/70 mt-0.5">
          Agentes públicos que mais aparecem no Diário de Americana e sobrenomes que se repetem.
        </p>
      </header>

      {/* Disclaimer ético — central pra esta página */}
      <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200/70 px-4 py-3 mb-5 flex gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden />
        <p className="text-[12px] text-amber-900/90 leading-relaxed">
          <strong>Sobrenome igual não prova parentesco.</strong> Isto é coocorrência factual em
          atos oficiais — um ponto de partida pra investigar, nunca uma acusação. O DeOlho só
          registra pessoas no exercício de função pública, sempre com a fonte.
        </p>
      </div>

      {/* Quem mais aparece */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2 px-1">aparecem mais nos atos</h2>
        <div className="flex flex-col gap-2">
          {topPessoas.map((p) => {
            const periodo = periodoLabel(p.anos, p.primeiraData, p.ultimaData);
            const tempo = tempoLabel(p.anos);
            return (
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
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.cargos[0] ?? p.papeis[0]}
                    {periodo && <span className="text-muted-foreground/70"> · {tempo ?? periodo}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[var(--political)] tabular-nums">{p.mencoes}</p>
                  <p className="text-[10px] text-muted-foreground">{p.mencoes === 1 ? "ato" : "atos"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Sobrenomes que se repetem */}
      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2 px-1 flex items-center gap-1.5">
          <CalendarClock className="w-4 h-4 text-foreground/70" aria-hidden />
          sobrenomes que se repetem
        </h2>
        {repetidos.length === 0 ? (
          <p className="text-[12px] text-muted-foreground/90 leading-relaxed px-1">
            Nenhum sobrenome aparece em mais de uma pessoa por enquanto.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {repetidos.map((f) => {
              const periodo = periodoLabel(f.anos, f.primeiraData, f.ultimaData);
              return (
                <Link
                  key={f.slug}
                  href={`/familia/${f.slug}`}
                  className="rounded-2xl bg-card border border-border/40 shadow-sm px-4 py-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {f.sobrenome}
                      {f.comum && (
                        <span className="ml-2 text-[10px] font-normal text-amber-700 bg-amber-50 ring-1 ring-amber-200/60 rounded-full px-1.5 py-0.5">
                          sobrenome comum
                        </span>
                      )}
                    </p>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {f.totalPessoas} pessoas{periodo ? ` · ${periodo}` : ""}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                    {f.pessoas.map((p) => p.nome).join(", ")}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground/80 mt-3 px-1 leading-relaxed">
          Hoje os repetidos são sobrenomes comuns (Silva, Oliveira…), quase sempre sem relação.
          Conforme entram anos de histórico, sobrenomes raros que se repetem em cargos viram
          sinal de atenção — sempre pra investigar, com a fonte ao lado.
        </p>
      </section>
    </AppShell>
  );
}
