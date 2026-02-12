import { NextResponse } from "next/server";
import { embedQuery, getData, topKSimilar } from "@/lib/recsysData";

export async function GET(request: Request) {
  const { products, embText } = getData();
  const url = new URL(request.url);
  const query = url.searchParams.get("query") || url.searchParams.get("q") || "";
  const topK = Number(url.searchParams.get("topK")) || 24;
  const modeParam = (url.searchParams.get("mode") || "texto").toLowerCase();
  const mode: "texto" | "imagen" | "mixto" = modeParam === "imagen" ? "imagen" : modeParam === "mixto" || modeParam === "todo" ? "mixto" : "texto";
  const total = products.length;

  // Signals are accepted but not yet applied; future: weight fields accordingly
  let signals: Record<string, boolean> | undefined;
  const signalsRaw = url.searchParams.get("signals");
  if (signalsRaw) {
    try {
      signals = JSON.parse(signalsRaw);
    } catch {
      signals = undefined;
    }
  }

  // En /search solo hay query de texto. Si el modo es imagen/mixto, degradamos a texto.
  const queryVector = embedQuery(query);
  const similar = topKSimilar(queryVector, embText, topK);
  const results = similar.map(({ index, score }) => {
    const p = products[index];
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      category_path: p.category_path ?? "",
      image_url: p.image_url ?? p.image ?? "",
      image: p.image ?? p.image_url ?? "",
      score,
    };
  });

  return NextResponse.json({ results, total, mode, signals: signals ?? null });
}
