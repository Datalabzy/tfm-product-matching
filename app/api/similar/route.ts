import { NextResponse } from "next/server";
import { embedQuery, getData, topKSimilar, combineAndNormalize } from "@/lib/recsysData";

export async function GET(request: Request) {
  const { products, embText, embImg } = getData();
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const topK = Number(url.searchParams.get("topK")) || 12;
  const modeParam = (url.searchParams.get("mode") || "mixto").toLowerCase();
  const mode: "texto" | "imagen" | "mixto" = modeParam === "imagen" ? "imagen" : modeParam === "texto" ? "texto" : "mixto";

  // Signals accepted but not yet applied; placeholder for future weighting
  let signals: Record<string, boolean> | undefined;
  const signalsRaw = url.searchParams.get("signals");
  if (signalsRaw) {
    try {
      signals = JSON.parse(signalsRaw);
    } catch {
      signals = undefined;
    }
  }

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const idx = products.findIndex((p) => p.id === productId);
  if (idx === -1) {
    return NextResponse.json({ error: "product not found" }, { status: 404 });
  }

  const origin = products[idx];

  const allowImage = signals?.image !== false;
  const queryVector =
    mode === "imagen" && allowImage
      ? embImg[idx] ?? embText[idx] ?? embedQuery(origin.title)
      : mode === "texto"
        ? embText[idx] ?? embedQuery(origin.title)
        : allowImage
          ? combineAndNormalize(embText[idx], embImg[idx]) || embedQuery(origin.title)
          : embText[idx] ?? embedQuery(origin.title);

  const candidateVectors = embText.map((tVec, i) => {
    if (mode === "imagen" && allowImage) return embImg[i] ?? tVec;
    if (mode === "texto") return tVec;
    // mixto
    if (allowImage) return combineAndNormalize(tVec, embImg[i]);
    return tVec;
  });

  const similar = topKSimilar(queryVector, candidateVectors, topK, idx);
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
      similarity: Math.round(score * 100),
    };
  });

  return NextResponse.json({
    origin: {
      id: origin.id,
      title: origin.title,
      description: origin.description,
      category_path: origin.category_path ?? "",
      image_url: origin.image_url ?? origin.image ?? "",
      image: origin.image ?? origin.image_url ?? "",
    },
    results,
    mode,
    signals: signals ?? null,
  });
}
