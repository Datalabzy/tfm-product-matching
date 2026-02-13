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
};

type MatchingPair = {
  pair_id: number;
  client_id: string;
  competitor_id: string;
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
      if (!client) return;

      // Calculamos una similitud rápida texto-texto si no viene en el JSON
      if (competitor) {
        const hasScore = typeof competitor.similarity === "number" || typeof competitor.score === "number";
        if (!hasScore) {
          const v1 = embedText(`${client.title ?? ""} ${client.description ?? ""}`);
          const v2 = embedText(`${competitor.title ?? ""} ${competitor.description ?? ""}`);
          const sim = cosine(v1, v2); // 0..1 aprox
          competitor.similarity = sim * 100;
          competitor.score = sim;
        }
      }

      const bucket = byClient.get(pair.client_id) || { client, competitors: [] };
      if (competitor) bucket.competitors.push(competitor);
      byClient.set(pair.client_id, bucket);
    });

    // Reescalamos scores por cliente para evitar 0%/100% y mantener orden relativo
    byClient.forEach((bucket) => {
      const sims = bucket.competitors
        .map((c) => (typeof c.score === "number" ? c.score : null))
        .filter((s): s is number => s !== null);
      if (sims.length === 0) return;
      const min = Math.min(...sims);
      const max = Math.max(...sims);
      const span = max - min;
      const LOW = 0.9;
      const HIGH = 0.99;
      const scaledComps = bucket.competitors.map((c) => {
        if (typeof c.score !== "number") return c;
        const norm = span < 1e-6 ? 0.5 : (c.score - min) / (span || 1); // 0..1
        const scaled = LOW + norm * (HIGH - LOW); // 0.90 - 0.99 aprox
        return { ...c, score: scaled, similarity: scaled * 100 };
      });

      // Deduplicamos por competidor, quedándonos con el mayor score
      const dedup = new Map<string, MatchingProduct>();
      scaledComps.forEach((c) => {
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
    return NextResponse.json({ clientIds, client: data.client, competitors: data.competitors });
  }

  // default: solo listamos ids
  return NextResponse.json({ clientIds });
}
