/**
 * Blocos visuais de proveniência — separam o que é FATO do que é EXPLICAÇÃO
 * e expõem LIMITAÇÕES da fonte de forma neutra e auditável.
 *
 * Microcopy é mandatória (docs/patterns/conteudo-linguagem.md). Não inventar
 * texto livre — usar as estruturas-modelo dadas abaixo.
 */
import { AlertTriangle, Bot, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FonteId, Limitacao } from "@/lib/civic-types";
import { FonteBadge } from "./badges";

// ── BlocoExplicacaoIA ─────────────────────────────────────────────────────────
// Sempre rotulado, nunca parece fato oficial.
export function BlocoExplicacaoIA({
  texto,
  fontesUsadas,
  limitacoes,
  geradoEm,
  className,
}: {
  texto: string;
  fontesUsadas?: { fonte: FonteId; label?: string }[];
  limitacoes?: string[];
  geradoEm?: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "rounded-2xl bg-violet-50/60 ring-1 ring-violet-200/60 p-4 flex flex-col gap-2",
        className,
      )}
      aria-label="Explicação por IA"
    >
      <div className="flex items-center gap-1.5">
        <Bot className="w-4 h-4 text-violet-700" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-800">
          Explicação por IA
        </span>
      </div>
      <p className="text-sm leading-relaxed text-violet-950/85">
        {texto}
      </p>
      {(fontesUsadas?.length || limitacoes?.length) && (
        <div className="flex flex-col gap-1.5 mt-1">
          {fontesUsadas?.length ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-violet-900/70">Fontes usadas:</span>
              {fontesUsadas.map((f, i) => (
                <FonteBadge key={i} fonte={f.fonte} />
              ))}
            </div>
          ) : null}
          {limitacoes?.length ? (
            <ul className="text-[11px] text-violet-900/80 space-y-0.5">
              {limitacoes.map((l, i) => (
                <li key={i}>• {l}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
      <p className="text-[10px] text-violet-900/60 mt-1">
        {geradoEm ? `Gerado em ${geradoEm}. ` : ""}Esta explicação não substitui a fonte original.
      </p>
    </aside>
  );
}

// ── BlocoLimitacaoDado ────────────────────────────────────────────────────────
const LIM_TIPO_LABEL: Record<Limitacao["tipo"], string> = {
  dado_ausente: "Dado ausente",
  fonte_atrasada: "Fonte atrasada",
  fonte_indisponivel: "Fonte indisponível",
  campo_contraditorio: "Campo contraditório",
};

export function BlocoLimitacaoDado({
  limitacoes,
  className,
}: {
  limitacoes: Limitacao[];
  className?: string;
}) {
  if (!limitacoes?.length) return null;
  return (
    <div
      className={cn(
        "rounded-xl bg-amber-50/70 ring-1 ring-amber-200/70 p-3 flex flex-col gap-2",
        className,
      )}
      role="note"
      aria-label="Limitações da fonte"
    >
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4 text-amber-700" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
          Limitações dos dados
        </span>
      </div>
      <ul className="text-sm text-amber-950/85 space-y-1.5">
        {limitacoes.map((l, i) => (
          <li key={i} className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-amber-700/80">
              {LIM_TIPO_LABEL[l.tipo]}
              {l.campoAfetado && ` · ${l.campoAfetado}`}
            </span>
            <span>{l.mensagem}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── AvisoSintetico ────────────────────────────────────────────────────────────
// Pequeno aviso de rodapé/topo: "Dados sintéticos" — sempre visível em telas
// que ainda não tocam ingestão real.
export function AvisoSintetico({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 text-xs text-stone-600 bg-stone-50/80 ring-1 ring-stone-200/70 rounded-xl p-3",
        className,
      )}
      role="note"
    >
      <Info className="w-3.5 h-3.5 text-stone-500 mt-px shrink-0" aria-hidden />
      <span>
        <strong className="font-medium text-stone-700">Dados sintéticos.</strong> Nada nesta tela
        se refere a pessoa, empresa ou contrato real. Valores e nomes são para demonstração da
        estrutura — a ingestão real entra após validação de fonte, evidência, confiança e
        limitação no modelo.
      </span>
    </div>
  );
}

// ── SinalAvisoObrigatorio ─────────────────────────────────────────────────────
// Aviso embutido em SinalAtencaoCard — exigido pela regra cívica.
export function SinalAvisoObrigatorio({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-[11px] text-amber-900/75 leading-relaxed flex items-start gap-1.5",
        className,
      )}
    >
      <ShieldAlert className="w-3 h-3 mt-0.5 shrink-0 text-amber-700/80" aria-hidden />
      <span>
        <strong className="font-medium">Sinal de atenção não indica irregularidade.</strong>{" "}
        O sinal apenas sugere que a informação pode merecer verificação.
      </span>
    </p>
  );
}
