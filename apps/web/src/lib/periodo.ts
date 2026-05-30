/** Rótulo de período a partir de anos (preferido) ou datas ISO. */
export function periodoLabel(
  anos: number[],
  primeira?: string | null,
  ultima?: string | null,
): string | null {
  if (anos && anos.length > 0) {
    const min = Math.min(...anos);
    const max = Math.max(...anos);
    return min === max ? `${min}` : `${min}–${max}`;
  }
  const a = primeira?.slice(0, 4);
  const b = ultima?.slice(0, 4);
  if (a && b) return a === b ? a : `${a}–${b}`;
  return a ?? b ?? null;
}

/** "há X anos" a partir do menor ano observado em atos oficiais. */
export function tempoLabel(anos: number[]): string | null {
  if (!anos || anos.length === 0) return null;
  const min = Math.min(...anos);
  const dur = new Date().getFullYear() - min;
  if (dur <= 0) return "este ano";
  if (dur === 1) return "há 1 ano";
  return `há ${dur} anos`;
}
