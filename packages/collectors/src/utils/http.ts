const UA = "DeOlho/0.1 (transparencia civica; contato: broomarcura@gmail.com)";

export async function get<T>(
  url: string,
  params: Record<string, string | number> = {},
  delayMs = 500
): Promise<T> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();

  const full = qs ? `${url}?${qs}` : url;

  await sleep(delayMs);

  const res = await fetch(full, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${full}`);
  }

  return res.json() as Promise<T>;
}

export async function getAll<T>(
  url: string,
  baseParams: Record<string, string | number>,
  paginaKey: string,
  extractItems: (body: unknown) => T[],
  hasMore: (body: unknown, items: T[]) => boolean,
  tamanhoPagina = 50,
  delayMs = 600
): Promise<T[]> {
  const all: T[] = [];
  let pagina = 1;

  while (true) {
    const params = { ...baseParams, [paginaKey]: pagina, tamanhoPagina };
    const body = await get<unknown>(url, params, delayMs);
    const items = extractItems(body);
    all.push(...items);

    if (!hasMore(body, items) || items.length < tamanhoPagina) break;
    pagina++;
  }

  return all;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
