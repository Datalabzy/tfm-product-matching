import { NextResponse } from "next/server";
import { getData, topKSimilar } from "@/lib/recsysData";

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
  const similar = topKSimilar(embText[baseIndex], embText, 6, baseIndex); // 6 por si alguno repite
  const topCandidates = similar.slice(0, 5).map((s) => products[s.index]);

  // aleatorios sin repetición
  const randoms: typeof products = [];
  const used = new Set<number>([baseIndex, ...topCandidates.map((p) => products.indexOf(p))]);
  let attempts = 0;
  while (randoms.length < 5 && attempts < 200) {
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
