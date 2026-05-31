import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Database,
  ExternalLink,
  FileText,
  HelpCircle,
  Link2,
  MapPin,
  SearchCheck,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { TipoInformacaoBadge, FonteBadge, ConfiancaBadge } from "@/components/deolho/badges";
import { BlocoExplicacaoIA, BlocoLimitacaoDado } from "@/components/deolho/blocos";
import { EventoCivicoCard } from "@/components/feed/evento-civico-card";
import { ReacaoCivica } from "@/components/feed/reacao-civica";
import { SaveShare } from "@/components/feed/save-share";
import { comporEvento, leituraLocalInterpretativa, type Conexao, type EventoComposto } from "@/lib/evento-compositor";
import { dataExtensa, fonteLabel, getEventoDetalhe, type EventoDetalhe } from "@/lib/eventos";
import { contextoWikipediaEvento } from "@/lib/wikipedia";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventoPage({ params }: PageProps) {
  const { id } = await params;
  const detalhe = await getEventoDetalhe(id);
  if (!detalhe) notFound();

  const composto = comporEvento(detalhe.evento);
  const evidenciaPrincipal = detalhe.evidencias[0];
  const apresentacao = composto.apresentacaoIA;
  const leituraTexto = apresentacao?.leituraCompleta
    ?? leituraLocalInterpretativa(detalhe.evento);
  const leituraModo = apresentacao?.modo ?? "local";
  const contextosWiki = await contextoWikipediaEvento({
    evento: detalhe.evento,
    evidencias: detalhe.evidencias,
    limite: 5,
  });
  const contextoHero = contextosWiki.find((item) => item.info.foto) ?? contextosWiki[0];
  const dataLabel = dataExtensa(
    detalhe.evento.dataEvento ?? detalhe.evento.publishedAt?.toISOString().slice(0, 10) ?? null,
  );
  const fichaPublica = montarFichaPublica(detalhe, composto);

  return (
    <AppShell>
      <Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        voltar ao radar
      </Link>

      <article className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm">
        <div
          className={`min-h-32 bg-gradient-to-br bg-cover bg-center ${composto.media.gradiente} px-4 py-4`}
          style={contextoHero?.info.foto ? { backgroundImage: `linear-gradient(90deg, color-mix(in oklab, var(--card) 96%, transparent) 0%, color-mix(in oklab, var(--card) 82%, transparent) 48%, transparent 100%), url(${contextoHero.info.foto})` } : undefined}
        >
          <div className="flex flex-wrap items-center gap-1.5">
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
          <div className="mt-5 max-w-2xl">
            <p className="text-xs font-semibold text-foreground/65">{composto.selo.emoji} {composto.selo.label}</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight">{composto.titulo}</h1>
            {composto.resumo && (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/75">{composto.resumo}</p>
            )}
            {composto.valorLabel && (
              <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-[var(--political)]">
                {composto.valorLabel}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {composto.avisos.map((aviso) => (
            <p key={aviso} className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs leading-snug text-amber-700 dark:text-amber-400">
              {aviso}
            </p>
          ))}

          <FichaPublicaEvidencia ficha={fichaPublica} />

          {leituraTexto && (
            <BlocoExplicacaoIA
              titulo={tituloLeituraAgente(leituraModo)}
              texto={leituraTexto}
              fontesUsadas={[{ fonte: composto.fonte.id }]}
              geradoEm={apresentacao?.geradoEm ? dataHoraCurta(apresentacao.geradoEm) : undefined}
              meta={[
                metaModoAgente(leituraModo, apresentacao?.modelo),
                apresentacao?.evidenciasLidas !== undefined
                  ? `${apresentacao.evidenciasLidas} evidência(s) lida(s)`
                  : `${detalhe.evidencias.length} evidência(s) disponível(is)`,
                apresentacao?.desde ? `desde ${apresentacao.desde}` : "ao vivo",
              ].filter((item): item is string => Boolean(item))}
              limitacoes={[
                apresentacao
                  ? "Organiza texto e leitura; fatos, valores e vínculos continuam vindo da evidência oficial."
                  : "Leitura local ao vivo, sem tokens externos; fatos, valores e vínculos continuam vindo da evidência oficial.",
              ]}
            />
          )}

          <section className="rounded-lg border border-border/50 bg-background/50 p-3">
            <div className="mb-3">
              <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <BookOpen className="h-4 w-4 text-[var(--source)]" aria-hidden />
                Contexto enciclopédico · Wikipedia
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Personalizado pelas entidades, leis e conceitos citados. Não é fonte do evento; a prova continua nas evidências oficiais.
              </p>
            </div>
            {contextosWiki.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {contextosWiki.map((ctx) => (
                  <article key={ctx.id} className="flex min-w-0 gap-3 rounded-md border border-border/50 bg-card/60 p-2.5">
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted bg-cover bg-center text-[10px] font-semibold uppercase text-muted-foreground ring-1 ring-border/40"
                      style={ctx.info.foto ? { backgroundImage: `url(${ctx.info.foto})` } : undefined}
                      role="img"
                      aria-label={ctx.info.foto ? `Imagem de ${ctx.info.titulo}` : `Contexto ${ctx.label}`}
                    >
                      {!ctx.info.foto && labelTipoWiki(ctx.tipo)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {labelTipoWiki(ctx.tipo)} · {ctx.label}
                      </p>
                      <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold">{ctx.info.titulo}</h3>
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-foreground/70">
                        {ctx.info.resumo ?? ctx.motivo}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {ctx.info.url && (
                          <a
                            href={ctx.info.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--source)] hover:underline"
                          >
                            abrir Wikipedia <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        )}
                        <span className="text-[11px] text-muted-foreground">{ctx.motivo}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                Nenhum contexto enciclopédico seguro encontrado para este evento.
              </p>
            )}
          </section>

          {(composto.conexoes.length > 0 || detalhe.relacoes.length > 0) && (
            <section>
              <h2 className="mb-2 text-sm font-semibold">Conexões</h2>
              {composto.conexoes.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {composto.conexoes.map((c, i) => <ConexaoChip key={`${c.tipo}-${i}`} conexao={c} />)}
                </div>
              )}
              {detalhe.relacoes.length > 0 && (
                <div className="flex flex-col gap-2">
                  {detalhe.relacoes.map((relacao) => (
                    <div key={relacao.id} className="rounded-lg border border-border/50 bg-background/50 p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <EntidadeLink href={relacao.fromHref} label={relacao.fromLabel} />
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          <Link2 className="h-3 w-3" aria-hidden /> {relacao.tipo}
                        </span>
                        <EntidadeLink href={relacao.toHref} label={relacao.toLabel} />
                      </div>
                      {relacao.descricao && <p className="mt-1 text-xs text-foreground/65">{relacao.descricao}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                        <span className="rounded-full bg-muted px-2 py-0.5">Fonte: {fonteLabel(relacao.sourceId)}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5">Confiança: {formatarConfiancaRelacao(relacao.confianca)}</span>
                        {relacao.trustType !== "fato_oficial" && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-400">
                            sinal neutro; não indica irregularidade
                          </span>
                        )}
                      </div>
                      {relacao.evidenceHref && (
                        <a
                          href={relacao.evidenceHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--source)] hover:underline"
                        >
                          ver evidência <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {(evidenciaPrincipal || detalhe.evidencias.length > 1) && (
            <section className="rounded-lg border border-border/50 bg-background/50 p-3">
              <h2 className="mb-2 text-sm font-semibold">Provas e documentos</h2>
              {evidenciaPrincipal && (
                <div className="mb-3">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="min-w-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {evidenciaPrincipal.titulo} · {evidenciaPrincipal.metodoExtracao}
                      {evidenciaPrincipal.publishedAt ? ` · publicado em ${dataHoraCurta(evidenciaPrincipal.publishedAt)}` : ""}
                      {evidenciaPrincipal.fetchedAt ? ` · coletado em ${dataHoraCurta(evidenciaPrincipal.fetchedAt)}` : ""}
                    </p>
                    {evidenciaPrincipal.sourceUrl && (
                      <a
                        href={evidenciaPrincipal.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--source)] hover:underline"
                      >
                        abrir fonte <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                  </div>
                  {evidenciaPrincipal.trecho && (
                    <p className="max-h-80 overflow-y-auto rounded-md bg-muted/50 px-3 py-2 text-sm leading-relaxed text-foreground/80">
                      {evidenciaPrincipal.trecho}
                    </p>
                  )}
                </div>
              )}
              {detalhe.evidencias.length > 1 && (
                <div className="flex flex-col gap-2">
                  {detalhe.evidencias.slice(1).map((ev) => (
                    <a
                      key={ev.id}
                      href={ev.sourceUrl ?? "#"}
                      target={ev.sourceUrl ? "_blank" : undefined}
                      rel={ev.sourceUrl ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-2 rounded-md border border-border/50 bg-card/60 p-2.5 text-sm hover:border-[var(--source)]"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{ev.titulo}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {ev.metodoExtracao}
                          {ev.pagina ? ` · página ${ev.pagina}` : ""}
                          {ev.publishedAt ? ` · ${dataHoraCurta(ev.publishedAt)}` : ""}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          {composto.limitacoes.length > 0 && <BlocoLimitacaoDado limitacoes={composto.limitacoes} />}
        </div>

        {composto.permiteAcoesCivicas && (
          <footer className="flex items-center justify-between gap-2 border-t border-border/40 px-3 py-2">
            <ReacaoCivica />
            <SaveShare shareTitle={composto.titulo} shareUrl={`/evento/${detalhe.evento.id}`} />
          </footer>
        )}
      </article>

      {detalhe.relacionados.length > 0 && (
        <section className="mt-5">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Relacionados</h2>
              <p className="text-xs text-muted-foreground">Eventos conectados por entidade quando houver; fallback por mesma fonte/categoria.</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {detalhe.relacionados.map((evento) => <EventoCivicoCard key={evento.id} evento={evento} />)}
          </div>
        </section>
      )}

      <p className="mt-5 text-center text-[11px] text-muted-foreground">
        {composto.fonte.nome} · {dataLabel}
      </p>
    </AppShell>
  );
}

type FichaItemId = "aconteceu" | "porque" | "envolvidos" | "quando" | "onde" | "divulgado" | "valor";

interface FichaPublicaItem {
  id: FichaItemId;
  titulo: string;
  valor: string;
  detalhe?: string;
}

interface FichaPublica {
  itens: FichaPublicaItem[];
}

function FichaPublicaEvidencia({ ficha }: { ficha: FichaPublica }) {
  return (
    <section className="rounded-lg border border-border/50 bg-background/50 p-3">
      <div className="mb-3">
        <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <SearchCheck className="h-4 w-4 text-[var(--source)]" aria-hidden />
          Ficha pública da evidência
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Campos extraídos dos dados coletados, evidências e vínculos documentados. A ficha responde o que, por que, quem, quando e onde sem transformar conexão em acusação.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {ficha.itens.map((item) => (
          <article key={item.id} className="rounded-md border border-border/50 bg-card/60 p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <FichaIcon id={item.id} />
              {item.titulo}
            </div>
            <p className="mt-1 text-sm font-medium leading-snug text-foreground">{item.valor}</p>
            {item.detalhe && <p className="mt-1 text-xs leading-relaxed text-foreground/65">{item.detalhe}</p>}
          </article>
        ))}
      </div>

    </section>
  );
}

function FichaIcon({ id }: { id: FichaItemId }) {
  const className = "h-3.5 w-3.5";
  if (id === "aconteceu") return <ClipboardList className={className} aria-hidden />;
  if (id === "porque") return <HelpCircle className={className} aria-hidden />;
  if (id === "envolvidos") return <Users className={className} aria-hidden />;
  if (id === "quando") return <CalendarDays className={className} aria-hidden />;
  if (id === "onde") return <MapPin className={className} aria-hidden />;
  if (id === "divulgado") return <Database className={className} aria-hidden />;
  return <FileText className={className} aria-hidden />;
}

function montarFichaPublica(detalhe: EventoDetalhe, composto: EventoComposto): FichaPublica {
  const evento = detalhe.evento;
  const textosEvidencia = detalhe.evidencias
    .map((ev) => ev.trecho?.replace(/\s+/g, " ").trim())
    .filter((trecho): trecho is string => Boolean(trecho));
  const textoBase = [evento.titulo, evento.resumo, ...textosEvidencia].filter(Boolean).join("\n");
  const envolvidos = listarEnvolvidos(detalhe, textoBase);
  const quando = descreverQuando(detalhe);
  const onde = descreverTerritorio(evento.territorio);
  const porque = extrairMotivoOuObjeto(textoBase) ?? composto.resumo ?? "A fonte pública não separou justificativa ou objeto em campo próprio.";
  const divulgado = detalhe.evidencias.length > 0
    ? `${detalhe.evidencias.length} evidência(s) coletada(s) de ${fonteLabel(evento.sourceId)}.`
    : "A fonte principal foi registrada, mas ainda não há evidência granular ligada ao evento.";

  const itens: FichaPublicaItem[] = [
    {
      id: "aconteceu",
      titulo: "O que aconteceu",
      valor: composto.titulo,
      detalhe: resumoCurto(composto.resumo ?? evento.resumo ?? textosEvidencia[0] ?? "Evento público registrado no banco canônico.", 280),
    },
    {
      id: "porque",
      titulo: "Por que / objeto",
      valor: resumoCurto(porque, 220),
      detalhe: "Campo organizado a partir do objeto, finalidade, ação orçamentária ou texto do documento quando a fonte não traz campo dedicado.",
    },
    {
      id: "envolvidos",
      titulo: "Quem está envolvido",
      valor: envolvidos.length > 0 ? envolvidos.slice(0, 5).join(" · ") : "Envolvidos não destacados em campo estruturado.",
      detalhe: envolvidos.length > 5 ? `Mais ${envolvidos.length - 5} menção(ões) aparecem nas evidências abaixo.` : undefined,
    },
    {
      id: "quando",
      titulo: "Quando aconteceu",
      valor: quando.valor,
      detalhe: quando.detalhe,
    },
    {
      id: "onde",
      titulo: "Onde aconteceu",
      valor: onde.valor,
      detalhe: onde.detalhe,
    },
    {
      id: "divulgado",
      titulo: "Base pública",
      valor: divulgado,
      detalhe: `Fonte principal: ${fonteLabel(evento.sourceId)}. Confiança: ${composto.confianca.replace(/_/g, " ")}.`,
    },
  ];

  if (composto.valorLabel) {
    itens.splice(1, 0, {
      id: "valor",
      titulo: "Valor citado",
      valor: composto.valorLabel,
      detalhe: "Valor publicado pela fonte; não é juízo de mérito nem sinal automático.",
    });
  }

  return { itens };
}

function listarEnvolvidos(detalhe: EventoDetalhe, textoBase: string): string[] {
  const nomes = new Set<string>();
  const entidades = (detalhe.evento.entidades ?? {}) as {
    orgaoNome?: string | null;
    orgaos?: Array<{ nome?: string | null; sigla?: string | null }>;
    pessoas?: Array<{ nome?: string | null; papel?: string | null; cargo?: string | null }>;
  };
  const push = (valor: string | null | undefined) => {
    const limpo = limparValorExtraido(valor);
    if (limpo && limpo.length >= 3) nomes.add(limpo);
  };

  push(entidades.orgaoNome);
  for (const orgao of entidades.orgaos ?? []) push(orgao.sigla ? `${orgao.nome} (${orgao.sigla})` : orgao.nome);
  for (const pessoa of entidades.pessoas ?? []) {
    if (!pessoa.nome) continue;
    push([pessoa.nome, pessoa.cargo ?? pessoa.papel].filter(Boolean).join(" — "));
  }
  for (const relacao of detalhe.relacoes) {
    push(relacao.fromLabel);
    push(relacao.toLabel);
  }
  for (const label of ["Fornecedor", "Credor", "Contratado", "Contratada", "Empresa", "Órg[ãa]o", "Secretaria", "Quem"]) {
    push(extrairCampo(textoBase, label));
  }

  return [...nomes].slice(0, 12);
}

function descreverQuando(detalhe: EventoDetalhe): { valor: string; detalhe?: string } {
  const evento = detalhe.evento;
  const partes = [
    evento.dataEvento ? `data do evento: ${dataExtensa(evento.dataEvento)}` : null,
    evento.publishedAt ? `publicado em ${dataHoraCurta(evento.publishedAt)}` : null,
    evento.fetchedAt ? `coletado em ${dataHoraCurta(evento.fetchedAt)}` : null,
  ].filter((item): item is string => Boolean(item));
  const evidenciasComData = detalhe.evidencias
    .flatMap((ev) => [ev.publishedAt, ev.fetchedAt])
    .filter((data): data is Date => Boolean(data));
  const primeiraDataEvidencia = evidenciasComData[0];
  if (partes.length === 0 && primeiraDataEvidencia) {
    return {
      valor: `evidência datada em ${dataHoraCurta(primeiraDataEvidencia)}`,
      detalhe: "O evento não trouxe data própria; a data veio da evidência coletada.",
    };
  }
  if (partes.length === 0) {
    return { valor: "Sem data pública confiável.", detalhe: "Este evento não deve ser tratado como recente enquanto a fonte não trouxer data." };
  }
  return {
    valor: partes[0] ?? "Data pública registrada.",
    detalhe: partes.slice(1).join(" · ") || undefined,
  };
}

function descreverTerritorio(raw: unknown): { valor: string; detalhe?: string } {
  if (!raw || typeof raw !== "object") return { valor: "Americana/SP", detalhe: "Território padrão da coleta local." };
  const territorio = raw as {
    municipio?: string;
    uf?: string;
    bairro?: string;
    endereco?: string;
    mencoes?: Array<{ tipo?: string; nome?: string }>;
  };
  const cidade = [territorio.municipio ?? "Americana", territorio.uf ?? "SP"].filter(Boolean).join("/");
  const mencoes = (territorio.mencoes ?? [])
    .map((m) => [m.tipo, m.nome].filter(Boolean).join(": "))
    .filter(Boolean)
    .slice(0, 4);
  const detalhes = [territorio.endereco, territorio.bairro, ...mencoes].filter(Boolean);
  return {
    valor: cidade || "Americana/SP",
    detalhe: detalhes.length > 0 ? detalhes.join(" · ") : "A fonte não trouxe rua, bairro ou equipamento público separado.",
  };
}

function extrairMotivoOuObjeto(texto: string): string | null {
  for (const label of ["Objeto", "Finalidade", "Justificativa", "Ação orçament[áa]ria", "Programa", "Descrição"]) {
    const valor = extrairCampo(texto, label);
    if (valor) return valor;
  }
  const primeiraFrase = texto.match(/[^.!?]+[.!?]?/)?.[0]?.trim();
  return primeiraFrase && primeiraFrase.length > 20 ? primeiraFrase : null;
}

function extrairCampo(texto: string | null, label: string): string | null {
  if (!texto) return null;
  const re = new RegExp(`${label}\\s*:?\\s*([^\\n.]+?)(?:\\.\\s|\\.$|\\n|$)`, "i");
  return limparValorExtraido(re.exec(texto)?.[1]);
}

function limparValorExtraido(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const limpo = valor
    .replace(/\s+/g, " ")
    .replace(/\s+-\s+$/, "")
    .trim();
  if (!limpo || /^não informado$/i.test(limpo)) return null;
  return resumoCurto(limpo, 120);
}

function resumoCurto(texto: string, max: number): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  return limpo.length > max ? `${limpo.slice(0, max - 1).trimEnd()}…` : limpo;
}

function formatarConfiancaRelacao(valor: string): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return valor || "não informada";
  return `${Math.round(numero * 100)}% documentada`;
}

function EntidadeLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return <span className="font-medium text-foreground">{label}</span>;
  return (
    <Link href={href} className="font-medium text-[var(--political)] hover:underline">
      {label}
    </Link>
  );
}

function dataHoraCurta(input: string | Date): string {
  const data = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(data.getTime())) return String(input);
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tituloLeituraAgente(modo?: string): string {
  if (modo === "openai") return "Leitura completa organizada por IA";
  if (modo === "ollama") return "Leitura completa organizada por IA local";
  return "Leitura completa organizada pelo agente local";
}

function metaModoAgente(modo?: string, modelo?: string | null): string {
  if (modo === "openai") return modelo ?? "OpenAI";
  if (modo === "ollama") return modelo ? `Ollama · ${modelo}` : "Ollama local";
  if (modo === "local") return "modo local sem tokens";
  return "fallback local";
}

function ConexaoChip({ conexao }: { conexao: Conexao }) {
  const emoji = iconeConexao(conexao.tipo);
  const cls = "inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-background/50 px-2.5 py-1 text-[11px] font-medium text-foreground/80 transition-colors hover:border-[var(--political)] hover:text-[var(--political)]";
  if (!conexao.href) {
    return (
      <span
        title={conexao.tooltip}
        className="inline-flex cursor-help items-center gap-1 rounded-full border border-dashed border-foreground/20 px-2.5 py-1 text-[11px] font-medium text-foreground/60"
      >
        {emoji} {conexao.label}
      </span>
    );
  }
  if (/^https?:\/\//i.test(conexao.href)) {
    return (
      <a href={conexao.href} target="_blank" rel="noopener noreferrer" className={cls}>
        {emoji} {conexao.label}
      </a>
    );
  }
  return (
    <Link href={conexao.href} className={cls}>
      {emoji} {conexao.label}
    </Link>
  );
}

function iconeConexao(tipo: Conexao["tipo"]): string {
  switch (tipo) {
    case "empresa": return "🏢";
    case "pessoa_publica": return "👤";
    case "orgao": return "🏛️";
    case "termo": return "📖";
    case "evidencia": return "📄";
    case "ia": return "✨";
    default: return "•";
  }
}

function labelTipoWiki(tipo: string): string {
  const labels: Record<string, string> = {
    cidade: "cidade",
    territorio: "território",
    orgao: "instituição",
    unidade_orgao: "órgão",
    lugar_publico: "lugar",
    empresa: "empresa",
    pessoa_publica: "pessoa pública",
    lei: "lei",
    conceito_publico: "conceito",
  };
  return labels[tipo] ?? "contexto";
}
