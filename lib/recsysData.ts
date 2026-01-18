import fs from "fs";
import path from "path";

export type Product = {
  id: string;
  title: string;
  description: string;
  image?: string;
  image_url?: string;
  category_path?: string;
};

type DataCache = {
  products: Product[];
  embText: number[][];
  embImg: (number[] | undefined)[];
};

const DATA_FILE = path.join(process.cwd(), "data", "products.jsonl");
const VECTOR_SIZE = 256;
let cache: DataCache | null = null;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function hashToken(token: string): number {
  let h = 0;
  for (let i = 0; i < token.length; i++) {
    h = (h << 5) - h + token.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (!norm) return vec;
  return vec.map((v) => v / norm);
}

function embedText(text: string, size = VECTOR_SIZE): number[] {
  const vec = new Array<number>(size).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (const t of tokens) {
    const idx = hashToken(t) % size;
    vec[idx] += 1;
  }

  return normalize(vec);
}

function parseJsonl(filePath: string): Product[] {
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  if (!raw) return [];

  const mapArr = (arr: unknown[]) =>
    arr
      .map((obj, idx) => ({
        id: obj?.id?.toString() ?? `prod-${idx}`,
        title: decodeHtmlEntities(obj?.title ?? ""),
        description: decodeHtmlEntities(obj?.description ?? ""),
        image: obj?.image ?? obj?.image_url ?? "",
        image_url: obj?.image_url ?? obj?.image ?? "",
        category_path: obj?.category_path ?? "",
      }))
      .filter((p) => p.title || p.description);

  // Supports JSON array
  if (raw.startsWith("[")) {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? mapArr(arr) : [];
  }

  // First try standard JSONL
  const lines = raw.split("\n").filter(Boolean);
  let parsed = lines
    .map((line, idx) => {
      try {
        const obj = JSON.parse(line);
        return {
          id: obj?.id?.toString() ?? `prod-${idx}`,
          title: decodeHtmlEntities(obj?.title ?? ""),
          description: decodeHtmlEntities(obj?.description ?? ""),
          image: obj?.image ?? obj?.image_url ?? "",
          image_url: obj?.image_url ?? obj?.image ?? "",
          category_path: obj?.category_path ?? "",
        } as Product;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Product[];

  // Some dumps come concatenated without newlines: {...}{...}
  if (parsed.length <= 1 && raw.includes("}{")) {
    try {
      const fixed = `[${raw.replace(/}\s*{/g, "},{")}]`;
      const arr = JSON.parse(fixed);
      if (Array.isArray(arr)) {
        parsed = mapArr(arr);
      }
    } catch {
      // ignore
    }
  }

  return parsed;
}

export function getData(): DataCache {
  if (cache) return cache;

  const products = parseJsonl(DATA_FILE);

  const embText = products.map((p) => embedText(`${p.title} ${p.description}`));
  // Without real image embeddings, reuse text embeddings to keep API consistent
  const embImg = embText.map((v) => v);

  cache = { products, embText, embImg };
  return cache;
}

export function embedQuery(query: string): number[] {
  return embedText(query || "");
}

export function combineAndNormalize(vecA?: number[], vecB?: number[]): number[] | undefined {
  if (!vecA && !vecB) return undefined;
  if (vecA && !vecB) return normalize([...vecA]);
  if (!vecA && vecB) return normalize([...vecB]);
  const combined = vecA!.map((v, i) => v + (vecB?.[i] ?? 0));
  return normalize(combined);
}

export function topKSimilar(
  queryVec: number[],
  candidates: (number[] | undefined)[],
  topK: number,
  excludeIndex?: number,
): { index: number; score: number }[] {
  const scored: { index: number; score: number }[] = [];
  const q = normalize([...queryVec]);

  candidates.forEach((cand, idx) => {
    if (!cand) return;
    if (excludeIndex !== undefined && idx === excludeIndex) return;
    let dot = 0;
    for (let i = 0; i < Math.min(q.length, cand.length); i++) {
      dot += q[i] * cand[i];
    }
    scored.push({ index: idx, score: dot });
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
