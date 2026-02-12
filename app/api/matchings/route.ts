import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import readline from "readline";

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
      const bucket = byClient.get(pair.client_id) || { client, competitors: [] };
      if (competitor) bucket.competitors.push(competitor);
      byClient.set(pair.client_id, bucket);
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
