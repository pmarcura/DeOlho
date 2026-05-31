import Link from "next/link";
import {
  BookOpen,
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  Landmark,
  MapPin,
  Sparkles,
  Target,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { TipoInformacaoBadge, FonteBadge, ConfiancaBadge } from "@/components/deolho/badges";
import { BlocoLimitacaoDado } from "@/components/deolho/blocos";
import { comporEvento, type Conexao, type EventoComposto } from "@/lib/evento-compositor";
import { dataExtensa, type EventoRanqueado } from "@/lib/eventos";
import { ReacaoCivica } from "./reacao-civica";
import { SaveShare } from "./save-share";

export function EventoCivicoCard({
  evento,
  variante = "completo",
}: {
  evento: EventoRanqueado;
  /** "feed" = card enxuto (lista); "completo" = card cheio (relacionados/detalhe). */
  variante?: "feed" | "completo";
}) {
  const composto = comporEvento(evento);
  const apresentacaoIA = composto.apresentacaoIA;
  const dataLabel = dataExtensa(evento.dataEvento ?? evento.publishedAt?.toISOString().slice(0, 10) ?? null);
  const feed = variante === "feed";
  // No feed o card respira: sem mini-ficha completa, sem limitações longas, sem
  // ações cívicas e com no máximo 3 conexões. O detalhe fica na página do evento.
  const miniFicha = feed ? [] : montarMiniFicha(evento, composto);
  const conexoes = feed ? composto.conexoes.slice(0, 3) : composto.conexoes;

  return (
    <article className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm">
      <div
        className={`relative flex min-h-36 items-start justify-between gap-3 bg-gradient-to-br bg-cover bg-center ${composto.media.gradiente} px-4 py-3`}
        role="img"
        aria-label={composto.media.alt}
        style={composto.media.imagemUrl
          ? { backgroundImage: `linear-gradient(90deg, color-mix(in oklab, var(--card) 82%, transparent), color-mix(in oklab, var(--card) 28%, transparent)), url(${composto.media.imagemUrl})` }
          : undefined}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-background/75 px-2.5 py-1 text-xs font-semibold text-foreground/75 ring-1 ring-border/40 backdrop-blur">
          <span className="text-base" aria-hidden>{composto.selo.emoji}</span>
          {composto.selo.label}
        </span>
        {composto.valorLabel && (
          <span className="rounded-full bg-background/80 px-3 py-1 text-lg font-bold tracking-tight text-foreground tabular-nums ring-1 ring-border/40 backdrop-blur">
            {composto.valorLabel}
          </span>
        )}
        <span className="absolute bottom-3 left-4 text-4xl drop-shadow-sm" aria-hidden>{composto.selo.emoji}</span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <TipoInformacaoBadge tipo={composto.tipoInformacao} size="xs" />
          <FonteBadge
            fonte={composto.fonte.id}
            url={composto.fonte.url}
            estadoFonte={composto.fonte.estado}
            dataColeta={composto.fonte.dataColeta}
            isSynthetic={composto.fonte.isSynthetic}
          />
          <ConfiancaBadge nivel={composto.confianca} ultimaVerificacao={composto.fonte.dataColeta} />
        </div>

        {apresentacaoIA && (
          <div className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-[var(--source)]/25 bg-[var(--source)]/10 px-2.5 py-1 text-[11px] font-medium text-foreground/70">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--source)]" aria-hidden />
            <span className="truncate">
              {rotuloAgente(apresentacaoIA.modo)}
            </span>
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold leading-tight tracking-tight text-foreground">
            <Link href={`/evento/${evento.id}`} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
              {composto.titulo}
            </Link>
          </h2>
          {composto.resumo && (
            <p className={`mt-1 ${feed ? "line-clamp-2" : "line-clamp-4"} text-sm leading-relaxed text-foreground/70`}>{composto.resumo}</p>
          )}
        </div>

        {miniFicha.length > 0 && (
          <div className="grid gap-2 rounded-md bg-muted/35 px-3 py-2">
            {miniFicha.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs leading-relaxed">
                  <Icon className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <div>
                    <span className="font-semibold text-foreground/75">{item.label}: </span>
                    <span className="text-foreground/70">{item.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {composto.avisos.map((aviso) => (
          <p
            key={aviso}
            className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-700 dark:text-amber-400"
          >
            {aviso}
          </p>
        ))}

        {!feed && composto.limitacoes.length > 0 && (
          <BlocoLimitacaoDado limitacoes={composto.limitacoes} className="text-xs" />
        )}

        {conexoes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {conexoes.map((c, i) => (
              <ConexaoChip key={`${c.tipo}-${i}`} conexao={c} />
            ))}
          </div>
        )}
      </div>

      <footer className="flex flex-col gap-1.5 border-t border-border/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[11px] leading-snug text-muted-foreground">
          {composto.fonte.nome} · {dataLabel}
        </span>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/evento/${evento.id}`}
            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[var(--political)] hover:underline"
          >
            ler tudo
          </Link>
          {composto.evidencias[0] && (
            <a
              href={composto.evidencias[0].href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[var(--source)] hover:underline"
            >
              ver evidência
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>
      </footer>

      {!feed && composto.permiteAcoesCivicas && (
        <div className="flex items-center justify-between gap-2 border-t border-border/40 px-3 py-2">
          <ReacaoCivica />
          <SaveShare shareTitle={composto.titulo} shareUrl={`/evento/${evento.id}`} />
        </div>
      )}
    </article>
  );
}

function rotuloAgente(modo?: string): string {
  if (modo === "openai") return "IA formatou título e resumo";
  if (modo === "ollama") return "IA local formatou título e resumo";
  return "agente local organizou título e resumo";
}

interface MiniFichaItem {
  label: string;
  value: string;
  icon: LucideIcon;
}

function montarMiniFicha(evento: EventoRanqueado, composto: EventoComposto): MiniFichaItem[] {
  const texto = [evento.titulo, evento.resumo].filter(Boolean).join(". ");
  const objetivo = extrairCampo(texto, "Objeto/finalidade")
    ?? extrairCampo(texto, "Objeto")
    ?? extrairCampo(texto, "Finalidade")
    ?? extrairCampo(texto, "Ação orçament[áa]ria")
    ?? composto.resumo
    ?? evento.resumo
    ?? null;
  const envolvidos = listarEnvolvidos(evento, texto);
  const onde = territorioLabel(evento.territorio);
  const data = evento.dataEvento ?? evento.publishedAt?.toISOString().slice(0, 10) ?? null;

  return [
    objetivo ? { label: "Para que", value: resumoCurto(objetivo, 180), icon: Target } : null,
    envolvidos ? { label: "Envolvidos", value: envolvidos, icon: Users } : null,
    onde ? { label: "Onde", value: onde, icon: MapPin } : null,
    data ? { label: "Quando", value: dataExtensa(data), icon: CalendarDays } : null,
  ].filter((item): item is MiniFichaItem => Boolean(item));
}

function listarEnvolvidos(evento: EventoRanqueado, texto: string): string | null {
  const entidades = evento.entidades;
  const nomes = new Set<string>();
  const push = (value: string | null | undefined) => {
    const limpo = limparValor(value);
    if (limpo) nomes.add(limpo);
  };
  push(entidades?.orgaoNome);
  for (const orgao of entidades?.orgaos ?? []) push(orgao.sigla ? `${orgao.nome} (${orgao.sigla})` : orgao.nome);
  for (const pessoa of entidades?.pessoas ?? []) {
    if (pessoa.nome) push([pessoa.nome, pessoa.cargo ?? pessoa.papel].filter(Boolean).join(" — "));
  }
  for (const label of ["Envolvido", "Órg[ãa]o citado", "Fornecedor", "Credor", "Contratado", "Contratada", "Empresa", "Órg[ãa]o"]) {
    push(extrairCampo(texto, label));
  }
  const lista = [...nomes].slice(0, 3);
  return lista.length > 0 ? lista.join(" · ") : null;
}

function territorioLabel(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return "Americana/SP";
  const territorio = raw as {
    municipio?: string;
    uf?: string;
    bairro?: string;
    endereco?: string;
    mencoes?: Array<{ tipo?: string; nome?: string }>;
  };
  const cidade = [territorio.municipio ?? "Americana", territorio.uf ?? "SP"].filter(Boolean).join("/");
  const mencao = territorio.endereco
    ?? territorio.bairro
    ?? territorio.mencoes?.find((m) => m.nome)?.nome
    ?? null;
  return mencao ? `${cidade} · ${mencao}` : cidade || null;
}

function extrairCampo(texto: string | null, label: string): string | null {
  if (!texto) return null;
  const labels = "Envolvido|Órg[ãa]o citado|Fornecedor|Credor|Contratado|Contratada|Empresa|Órg[ãa]o|Objeto\\/finalidade|Objeto|Finalidade|Ação orçament[áa]ria|Valor|Fonte";
  const re = new RegExp(`${label}\\s*:\\s*([^\\n.]+?)(?=\\s+(?:${labels})\\s*:|\\.\\s|\\.$|\\n|$)`, "i");
  return limparValor(re.exec(texto)?.[1]);
}

function limparValor(value: string | null | undefined): string | null {
  if (!value) return null;
  const limpo = value.replace(/\s+/g, " ").trim();
  if (!limpo || /^não informado$/i.test(limpo)) return null;
  return resumoCurto(limpo, 110);
}

function resumoCurto(texto: string, max: number): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  return limpo.length > max ? `${limpo.slice(0, max - 1).trimEnd()}…` : limpo;
}

function ConexaoChip({ conexao }: { conexao: Conexao }) {
  const className = "inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-background/50 px-2.5 py-1 text-[11px] font-medium text-foreground/80 hover:border-[var(--political)] hover:text-[var(--political)] transition-colors";
  if (!conexao.href) {
    return (
      <span
        title={conexao.tooltip}
        className="inline-flex cursor-help items-center gap-1 rounded-full border border-dashed border-foreground/20 px-2.5 py-1 text-[11px] font-medium text-foreground/60"
      >
        {iconePorTipo(conexao.tipo)} {conexao.label}
      </span>
    );
  }
  if (/^https?:\/\//i.test(conexao.href)) {
    return (
      <a href={conexao.href} target="_blank" rel="noopener noreferrer" className={className}>
        {iconePorTipo(conexao.tipo)} {conexao.label}
      </a>
    );
  }
  return (
    <Link href={conexao.href} className={className}>
      {iconePorTipo(conexao.tipo)} {conexao.label}
    </Link>
  );
}

function iconePorTipo(tipo: Conexao["tipo"]) {
  const cls = "h-3 w-3";
  switch (tipo) {
    case "empresa":
      return <Building2 className={cls} aria-hidden />;
    case "pessoa_publica":
      return <UserRound className={cls} aria-hidden />;
    case "orgao":
      return <Landmark className={cls} aria-hidden />;
    case "termo":
      return <BookOpen className={cls} aria-hidden />;
    case "evidencia":
      return <FileText className={cls} aria-hidden />;
    case "ia":
      return <Sparkles className={cls} aria-hidden />;
    default:
      return "•";
  }
}
