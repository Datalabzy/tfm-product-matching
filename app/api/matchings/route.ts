import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import readline from "readline";

// Embedding ligero: hashing tipo bag-of-words (alineado con lib/recsysData)
const VECTOR_SIZE = 256;
function hashToken(token: string): number {
  let h = 0;
  for (let i = 0; i < token.length; i++) {
    h = (h << 5) - h + token.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
function embedText(text: string): number[] {
  const vec = new Array<number>(VECTOR_SIZE).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  for (const t of tokens) {
    const idx = hashToken(t) % VECTOR_SIZE;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot;
}

function brandScore(a?: string, b?: string): number {
  if (!a || !b) return 0;
  return a.trim().toLowerCase() === b.trim().toLowerCase() ? 1 : 0;
}

function categoryScore(a?: string, b?: string): number {
  if (!a || !b) return 0;
  const split = (s: string) => s.toLowerCase().split(">").map((x) => x.trim()).filter(Boolean);
  const ca = split(a);
  const cb = split(b);
  if (!ca.length || !cb.length) return 0;
  const setA = new Set(ca);
  const common = cb.filter((x) => setA.has(x)).length;
  const denom = Math.max(ca.length, cb.length);
  return denom ? common / denom : 0;
}

type MatchingProduct = {
  id: string;
  title: string;
  description?: string;
  brand?: string;
  price?: number;
  image_url?: string;
  category_path?: string;
  source: "client" | "competitor";
  pair_id: number;
  similarity?: number;
  score?: number;
  is_active?: boolean;
  is_distractor?: boolean;
};

type MatchingPair = {
  pair_id: number;
  client_id: string;
  competitor_id: string;
  label?: number;
  is_distractor?: boolean;
  score?: number;
  similarity?: number;
};

type Cache = {
  products: MatchingProduct[];
  pairs: MatchingPair[];
  byClient: Map<
    string,
    {
      client: MatchingProduct;
      competitors: MatchingProduct[];
    }
  >;
  clientIds: string[];
};

const PRODUCTS_FILE = path.join(process.cwd(), "data", "matchings_products.jsonl");
const PAIRS_FILE = path.join(process.cwd(), "data", "matchings_pairs.jsonl");

let cache: Cache | null = null;
let cachePromise: Promise<Cache> | null = null;

async function parseJsonlStream<T = any>(file: string): Promise<T[]> {
  if (!fs.existsSync(file)) return [];
  const stream = fs.createReadStream(file, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const rows: T[] = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      rows.push(JSON.parse(trimmed) as T);
    } catch {
      // ignore bad lines
    }
  }
  return rows;
}

async function loadCache(): Promise<Cache> {
  if (cache) return cache;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    const productsRaw = await parseJsonlStream<MatchingProduct>(PRODUCTS_FILE);
    const products = productsRaw.map((p) => ({
      ...p,
      source: p.source === "competitor" ? "competitor" : "client",
      similarity: typeof p.similarity === "number" ? p.similarity : undefined,
      score: typeof p.score === "number" ? p.score : undefined,
      is_active: p.is_active !== false,
    })) as MatchingProduct[];

    const pairs = await parseJsonlStream<MatchingPair>(PAIRS_FILE);

    const byId = new Map<string, MatchingProduct>();
    products.forEach((p) => {
      if (p.id) byId.set(p.id, p);
    });

    const byClient = new Map<string, { client: MatchingProduct; competitors: MatchingProduct[] }>();

    pairs.forEach((pair) => {
      const client = byId.get(pair.client_id);
      const competitor = byId.get(pair.competitor_id);
      if (!client || !competitor) return;

      // Propagamos scores precalculados desde pairs si existen
      const score = typeof pair.score === "number" ? pair.score : competitor.score;
      const sim = typeof pair.similarity === "number" ? pair.similarity : competitor.similarity;
      const enrichedCompetitor: MatchingProduct = {
        ...competitor,
        score: score,
        similarity: sim,
        is_active: competitor.is_active !== false,
        is_distractor: pair.is_distractor ?? competitor.is_distractor ?? false,
      };

      const bucket = byClient.get(pair.client_id) || { client, competitors: [] };
      bucket.competitors.push(enrichedCompetitor);
      byClient.set(pair.client_id, bucket);
    });

    // Pool de competidores (solo si quisieras añadir ruido desde el backend; desactivado por defecto)
    const competitorPool = products.filter((p) => p.source === "competitor");

    // Recalcular scores crudos (0-100). Distractores se desactivan; se recomienda generarlos en notebook 4.
    const NUM_DISTRACTORS = 0;
    byClient.forEach((bucket) => {
      const clientVec = embedText(`${bucket.client.title ?? ""} ${bucket.client.description ?? ""}`);

      // Calcular score real a 0-100 para los gold
      const scoredGold = bucket.competitors.map((c) => {
        const vec = embedText(`${c.title ?? ""} ${c.description ?? ""}`);
        const sim = cosine(clientVec, vec);
        return { ...c, score: sim, similarity: sim * 100, is_active: c.is_active ?? true };
      });

      // Añadimos distractores aleatorios que no estén ya en la lista
      const existingIds = new Set(scoredGold.map((c) => c.id));
      const distractors: MatchingProduct[] = [];
      for (let i = 0; i < competitorPool.length && distractors.length < NUM_DISTRACTORS; i++) {
        const cand = competitorPool[Math.floor(Math.random() * competitorPool.length)];
        if (existingIds.has(cand.id)) continue;
        existingIds.add(cand.id);
        const vec = embedText(`${cand.title ?? ""} ${cand.description ?? ""}`);
        const sim = cosine(clientVec, vec);
        distractors.push({ ...cand, score: sim, similarity: sim * 100, is_active: true });
      }

      const merged = [...scoredGold, ...distractors];

      // Deduplicamos por competidor, quedándonos con el mayor score
      const dedup = new Map<string, MatchingProduct>();
      merged.forEach((c) => {
        const existing = dedup.get(c.id);
        if (!existing) {
          dedup.set(c.id, c);
          return;
        }
        const sNew = typeof c.score === "number" ? c.score : -1;
        const sOld = typeof existing.score === "number" ? existing.score : -1;
        if (sNew > sOld) dedup.set(c.id, c);
      });

      bucket.competitors = Array.from(dedup.values());
    });

    cache = { products, pairs, byClient, clientIds: Array.from(byClient.keys()) };
    return cache;
  })();

  return cachePromise;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");
  const listParam = url.searchParams.get("list");
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit")) || 12, 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const noCache = url.searchParams.get("nocache");
  const topKParam = Number(url.searchParams.get("topK")) || 12;

  if (noCache) {
    cache = null;
    cachePromise = null;
  }

  const { byClient, clientIds } = await loadCache();

  if (listParam) {
    const slice = clientIds.slice(offset, offset + limit);
    const clients = slice
      .map((id) => byClient.get(id)?.client)
      .filter(Boolean);
    return NextResponse.json({ clientIds, clients, total: clientIds.length, offset, limit });
  }

  // detalle de un cliente concreto
  if (clientId) {
    const data = byClient.get(clientId);
    if (!data) {
      return NextResponse.json({ error: "client not found", clientIds }, { status: 404 });
    }
    const sorted = [...data.competitors].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const limited = sorted.slice(0, Math.max(1, topKParam));

    // Reescalado de presentación 0.6 - 0.99 manteniendo orden relativo
    const scores = limited.map((c) => (typeof c.score === "number" ? c.score : null)).filter((s): s is number => s !== null);
    const min = scores.length ? Math.min(...scores) : 0;
    const max = scores.length ? Math.max(...scores) : 0;
    const span = max - min;
    const LOW = 0.6;
    const HIGH = 0.99;

    const presented = limited.map((c) => {
      const raw = typeof c.score === "number" ? c.score : null;
      if (raw === null) return { ...c, similarity: null, score: null };
      const norm = span <= 1e-8 ? 0.75 : (raw - min) / (span || 1);
      const scaled = LOW + norm * (HIGH - LOW);
      return { ...c, score: scaled, similarity: scaled * 100 };
    });

    return NextResponse.json({ clientIds, client: data.client, competitors: presented });
  }

  // default: solo listamos ids
  return NextResponse.json({ clientIds });
}
