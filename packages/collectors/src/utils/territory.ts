export type TerritorioTipo = "logradouro" | "bairro" | "equipamento";

export interface TerritorioMention {
  tipo: TerritorioTipo;
  nome: string;
  contexto: string;
}

function janela(texto: string, index: number, tamanho = 140): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(texto.length, index + tamanho);
  return texto.slice(start, end).replace(/\s+/g, " ").trim();
}

function normalizarNome(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/[;:,.)]+$/g, "")
    .trim();
}

function adicionar(
  out: Map<string, TerritorioMention>,
  tipo: TerritorioTipo,
  nome: string,
  contexto: string,
): void {
  const limpo = normalizarNome(nome);
  if (limpo.length < 4 || limpo.length > 90) return;
  const key = `${tipo}:${limpo.toLowerCase()}`;
  if (!out.has(key)) out.set(key, { tipo, nome: limpo, contexto });
}

export function extrairTerritorios(texto: string): TerritorioMention[] {
  const out = new Map<string, TerritorioMention>();
  const t = texto.replace(/\s+/g, " ");

  const logradouroRe =
    /\b(?:Rua|Avenida|Av\.|Travessa|Estrada|Alameda|Pra[çc]a|Viaduto)\s+[A-ZÀ-Ý0-9][^.;\n]{3,80}/g;
  let m: RegExpExecArray | null;
  while ((m = logradouroRe.exec(t))) {
    adicionar(out, "logradouro", m[0], janela(t, m.index));
  }

  const bairroRe =
    /\b(?:bairro\s+(?:do\s+|da\s+|de\s+)?|Jardim|Vila|Parque|Residencial|Cidade\s+Jardim|Ant[oô]nio\s+Zanaga)\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ0-9\s-]{2,55}/g;
  while ((m = bairroRe.exec(t))) {
    adicionar(out, "bairro", m[0].replace(/^bairro\s+/i, ""), janela(t, m.index));
  }

  const equipamentoRe =
    /\b(?:UBS|UPA|EMEF|CIEP|CRAS|CREAS|Escola\s+Municipal|Creche|Hospital|Pronto\s+Socorro|Pra[çc]a|Parque\s+Ecol[oó]gico)\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ0-9\s-]{2,70}/g;
  while ((m = equipamentoRe.exec(t))) {
    adicionar(out, "equipamento", m[0], janela(t, m.index));
  }

  return Array.from(out.values()).slice(0, 12);
}

export function temSinalZeladoria(texto: string): boolean {
  return /\b(?:buraco|tapa-?buraco|recape|asfalto|pavimenta[çc][ãa]o|ilumina[çc][ãa]o|poda|sarjeta|cal[çc]ada|drenagem|galeria|limpeza\s+urbana)\b/i.test(texto);
}

