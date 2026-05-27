/**
 * /empresa/[cnpj] — página REAL de uma empresa pelo CNPJ.
 *
 * Dados:
 *  - BrasilAPI (Receita Federal) — razão social, situação, endereço, QSA (sócios).
 *  - CGU CEIS — sanções, se houver (server-side fetch com chave-api-dados).
 *
 * Nada inventado. Se o CNPJ não existir/inválido, vira 404 com mensagem honesta.
 * Sócios mantidos como ATRIBUTO da empresa (doc mascarado pela própria Receita),
 * nunca como perfil de cidadão. Reações em cima da EMPRESA (objeto público), não
 * em pessoas — coerente com o sistema de confiança do projeto.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, Users, MapPin } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { ReacaoCivica } from "@/components/feed/reacao-civica";
import { SaveShare } from "@/components/feed/save-share";
import { FonteChip } from "@/components/feed/fonte-chip";
import { TrustHint } from "@/components/feed/trust-hint";
import { EmptyState } from "@/components/feed/empty-state";
import { fetchCnpj, normalizarCnpj } from "@/lib/brasilapi";
import { fetchSancoesCnpj } from "@/lib/ceis";

interface PageProps {
  params: Promise<{ cnpj: string }>;
}

export const revalidate = 3600;

function formatarCnpj(d: string): string {
  if (d.length !== 14) return d;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function iniciaisDe(nome: string): string {
  return nome
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cnpj } = await params;
  const data = await fetchCnpj(cnpj);
  if (!data) return { title: "Empresa não encontrada — DeOlho" };
  return {
    title: `${data.razao_social ?? "Empresa"} — DeOlho`,
    description: "Dados públicos do CNPJ com sócios e sanções verificáveis.",
  };
}

export default async function EmpresaPage({ params }: PageProps) {
  const { cnpj } = await params;
  const cnpjLimpo = normalizarCnpj(cnpj);
  const empresa = await fetchCnpj(cnpjLimpo);
  if (!empresa) notFound();

  const sancoes = await fetchSancoesCnpj(cnpjLimpo, "ceis", 20);
  const nome = empresa.razao_social ?? empresa.nome_fantasia ?? "Empresa";
  const iniciais = iniciaisDe(nome);

  return (
    <AppShell>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      {/* Cabeçalho da empresa */}
      <header className="flex items-start gap-4 mb-4">
        <span
          aria-hidden
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-rose-100 text-violet-700 flex items-center justify-center text-xl font-bold shrink-0"
        >
          {iniciais}
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">empresa</p>
            <TrustHint level="oficial" />
          </div>
          <h1 className="text-xl font-bold tracking-tight leading-tight">{nome}</h1>
          {empresa.nome_fantasia && empresa.nome_fantasia !== empresa.razao_social && (
            <p className="text-sm text-foreground/70 mt-0.5">{empresa.nome_fantasia}</p>
          )}
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {formatarCnpj(cnpjLimpo)}
          </p>
        </div>
      </header>

      {/* Reações + Save/Share */}
      <section className="flex items-center justify-between border-y border-border/40 py-2 mb-5">
        <ReacaoCivica />
        <SaveShare shareTitle={nome} />
      </section>

      {/* Resumo curto + fonte */}
      <section className="rounded-2xl bg-card border border-border/40 shadow-sm px-5 py-4 mb-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          o que esta empresa faz
        </p>
        <p className="text-sm text-foreground/85 mt-1 leading-relaxed">
          {empresa.cnae_fiscal_descricao ?? "Atividade principal não informada."}
        </p>
        {empresa.descricao_situacao_cadastral && (
          <p className="text-xs text-muted-foreground mt-2">
            situação: <span className="text-foreground">{empresa.descricao_situacao_cadastral}</span>
            {empresa.data_inicio_atividade && (
              <> · ativa desde {new Date(empresa.data_inicio_atividade).getFullYear()}</>
            )}
          </p>
        )}
        <div className="mt-3 pt-3 border-t border-border/30">
          <FonteChip label="Receita Federal · BrasilAPI" url={`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`} />
        </div>
      </section>

      {/* Endereço */}
      {empresa.municipio && (
        <section className="rounded-2xl bg-card border border-border/40 shadow-sm px-5 py-4 mb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              onde fica
            </p>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            {[empresa.logradouro, empresa.numero, empresa.bairro].filter(Boolean).join(", ")}
            {empresa.municipio && (
              <>
                {" — "}
                <span className="font-medium">
                  {empresa.municipio}/{empresa.uf}
                </span>
              </>
            )}
          </p>
          {empresa.cep && (
            <p className="text-xs text-muted-foreground mt-1">CEP {empresa.cep}</p>
          )}
        </section>
      )}

      {/* Sócios — QSA real */}
      <section className="mb-4">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Users className="w-4 h-4 text-foreground/70" aria-hidden />
          <h2 className="text-sm font-semibold">quem está por trás</h2>
        </div>
        {empresa.qsa && empresa.qsa.length > 0 ? (
          <div className="rounded-2xl bg-card border border-border/40 shadow-sm divide-y divide-border/40 overflow-hidden">
            {empresa.qsa.map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span
                  aria-hidden
                  className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold shrink-0"
                >
                  {iniciaisDe(s.nome_socio)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{s.nome_socio}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.qualificacao_socio}
                    {s.cnpj_cpf_do_socio && (
                      <> · <code className="font-mono">{s.cnpj_cpf_do_socio}</code></>
                    )}
                  </p>
                </div>
                {s.data_entrada_sociedade && (
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                    desde {new Date(s.data_entrada_sociedade).getFullYear()}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icone="👥"
            titulo="Sem sócios listados"
            descricao="A Receita não traz o quadro societário desta empresa ou ela é unipessoal."
          />
        )}
        <p className="text-[11px] text-muted-foreground/80 mt-2 px-1 leading-relaxed">
          Quadro societário público da Receita. O CPF dos sócios já vem mascarado na fonte —
          é atributo da empresa, não cria perfil de cidadão.
        </p>
      </section>

      {/* Sanções CEIS */}
      <section className="mb-4">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <ShieldAlert className="w-4 h-4 text-foreground/70" aria-hidden />
          <h2 className="text-sm font-semibold">sanções públicas (CEIS)</h2>
        </div>
        {sancoes.length > 0 ? (
          <div className="rounded-2xl bg-amber-50/70 ring-1 ring-amber-200/70 px-4 py-4 flex flex-col gap-3">
            <p className="text-xs text-amber-900/80 leading-relaxed">
              <strong className="font-semibold">Sinal de atenção não indica irregularidade.</strong>{" "}
              Esta empresa consta {sancoes.length === 1 ? "uma vez" : `${sancoes.length} vezes`} no
              CEIS — o sinal apenas sugere que a informação pode merecer verificação.
            </p>
            {sancoes.map((s, i) => (
              <div key={i} className="border-t border-amber-200/50 pt-3 first:border-0 first:pt-0">
                <p className="text-sm font-medium text-amber-950">
                  {s.tipoSancao?.descricaoResumida ?? "Sanção registrada"}
                </p>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  {s.orgaoSancionador?.nome ?? s.fonteSancao?.nomeExibicao}
                  {s.dataInicioSancao && (
                    <> · desde {s.dataInicioSancao}</>
                  )}
                  {s.dataFimSancao && <> · até {s.dataFimSancao}</>}
                </p>
              </div>
            ))}
            <FonteChip
              label="CGU · Portal da Transparência"
              url="https://portaldatransparencia.gov.br"
            />
          </div>
        ) : (
          <EmptyState
            icone="✅"
            titulo="Sem sanções no CEIS"
            descricao={
              process.env.PORTAL_TRANSPARENCIA_API_KEY
                ? "Esta empresa não aparece no Cadastro Nacional de Empresas Inidôneas e Suspensas. Cobertura varia conforme a fonte."
                : "Chave da CGU ainda não configurada — não dá pra checar sanções agora."
            }
          />
        )}
      </section>

      {/* Estado honesto: contratos com a prefeitura */}
      <section className="mb-4">
        <EmptyState
          icone="📋"
          titulo="Contratos com a prefeitura: em breve"
          descricao="Quando o PNCP estiver coletado, vamos mostrar aqui os contratos públicos desta empresa com Americana, com fonte e valor verificáveis."
        />
      </section>
    </AppShell>
  );
}
