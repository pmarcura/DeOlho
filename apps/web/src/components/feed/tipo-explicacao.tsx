"use client";

/**
 * TipoExplicacao — micro-glossário inline em linguagem de leigo.
 *
 * "O que é isso?" expansível. Pra cada tipo de ato, uma explicação curta
 * em até 2 frases, sem jargão. Quem nunca ouviu "Ata de Registro de Preços"
 * agora entende em 5 segundos.
 */
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TipoAto } from "@/lib/atoms";

const EXPLICACOES: Record<TipoAto, string> = {
  lei: "Uma regra nova que vale pra cidade inteira. Tem que passar pela Câmara de Vereadores antes de virar oficial.",
  decreto: "Uma ordem do prefeito pra colocar uma lei em prática ou organizar como o município funciona no dia a dia.",
  portaria: "Documento administrativo. Geralmente nomeia pessoas pra cargos ou organiza o trabalho interno dos órgãos.",
  resolucao: "Uma regra interna de um órgão público (conselho, secretaria) sobre como ele mesmo se organiza.",
  contrato: "Um acordo entre a prefeitura e uma empresa: a empresa entrega um serviço ou produto, a prefeitura paga.",
  aditivo: "Mudança num contrato que já existe — geralmente mais prazo, mais valor ou troca de detalhes.",
  edital: "Aviso público chamando empresas pra disputarem um contrato. É o ponto de partida de uma licitação.",
  pregao: "Tipo de licitação onde as empresas competem em preço, ao vivo. Mais comum pra compras simples.",
  convite: "Licitação mais simples e rápida — a prefeitura convida algumas empresas pra cotar.",
  concorrencia: "Licitação maior, pra obras e contratos de valor alto, aberta a qualquer empresa.",
  convenio: "Acordo entre a prefeitura e outra entidade (ONG, governo, etc.) pra fazer alguma coisa juntos.",
  ata_registro: "Catálogo de preços fixados. A prefeitura registra valores combinados pra comprar quando precisar — sem nova licitação a cada vez.",
};

export function TipoExplicacao({
  tipo,
  className,
}: {
  tipo: TipoAto;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const explicacao = EXPLICACOES[tipo];

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <HelpCircle className="w-3 h-3" aria-hidden />
        {open ? "ocultar explicação" : "o que é isso?"}
        <ChevronDown
          className={cn("w-3 h-3 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && (
        <p className="mt-2 text-sm text-foreground/80 leading-relaxed bg-foreground/[0.03] rounded-xl px-3 py-2.5">
          {explicacao}
        </p>
      )}
    </div>
  );
}
