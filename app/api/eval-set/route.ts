import { NextResponse } from "next/server";
import { getData, topKSimilar } from "@/lib/recsysData";
import fs from "fs";
import path from "path";

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export async function GET(request: Request) {
  const { products, embText } = getData();
  const url = new URL(request.url);
  const seedParam = url.searchParams.get("seed") || url.searchParams.get("user") || "1";
  const seed = Number(seedParam) || 1;

  if (!products.length) {
    return NextResponse.json({ error: "no products" }, { status: 500 });
  }

  const baseIndex = seed % products.length;
  const base = products[baseIndex];

  // top similares
  const TOP_K = 7;
  const similar = topKSimilar(embText[baseIndex], embText, TOP_K + 10, baseIndex); // margen por duplicados
  const topCandidates = similar
    .filter((s) => s.score !== undefined)
    .slice(0, TOP_K)
    .map((s) => products[s.index]);

  // aleatorios sin repetición
  const RANDOM_K = 8;
  const randoms: typeof products = [];
  const used = new Set<number>([baseIndex, ...topCandidates.map((p) => products.indexOf(p))]);
  let attempts = 0;
  while (randoms.length < RANDOM_K && attempts < 400) {
    const r = Math.floor(seededRandom(seed + attempts + 1) * products.length);
    if (!used.has(r)) {
      used.add(r);
      randoms.push(products[r]);
    }
    attempts++;
  }

  // mezcla top + random
  const all = [...topCandidates, ...randoms].map((p, idx) => ({ ...p, candidate_id: `${p.id}-${idx}` }));
  // shuffle determinista
  const shuffled = all
    .map((p, i) => ({ p, k: seededRandom(seed + i + 99) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.p);

  return NextResponse.json({ base, candidates: shuffled, seed });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { seed, base_id, selected_ids } = body || {};
    if (!base_id || !Array.isArray(selected_ids)) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "data", "eval_feedback.jsonl");
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const rec = { ts: Date.now(), seed: seed ?? null, base_id, selected_ids };
    fs.appendFileSync(filePath, JSON.stringify(rec) + "\n", "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "failed to save" }, { status: 500 });
  }
}
