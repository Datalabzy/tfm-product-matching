"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Repeat2 } from "lucide-react";

type Result = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  image?: string;
  similarity?: number;
  category_path?: string;
};

const FALLBACK_IMG =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIxMTkiIGhlaWdodD0iMTE5IiByeD0iMTEiIHJ5PSIxMSIgZmlsbD0iI0VGRkZGRiIgLz48cGF0aCBkPSJNNDIgNjljLTAuMjc2IDEuMzA3LTEuNTAyIDIuMjktMi44NTIgMi4yOS0xLjU1MyAwLTIuODEtMS4zMDQtMi44NDEtMi44NjEtMC4xMS0zLjkwNyA2LjE5NC02LjA3NSA2LjIxNy0yLjgzNyAwLjAwOSAyLjQ3Ny0yLjc4NSA0LjkyNS02LjUxNCA0Ljk5LTAuMDg3IDAtMC4xNy0wLjAwMS0wLjI1Ni0wLjAwM2MtMi4xMzItMC4wNTYtNC4wNjYgMS4yNzctNC44MTIgMy4yNjUtMC4zNzkgMC45NzgtMS4zODYgMS42MjUtMi40OTQgMS42MjUtMS40ODUgMC0yLjY5OC0xLjIyMi0yLjY5OC0yLjcyMSAwLTMuODk0IDQuMjU0LTcuMDU1IDkuNTkzLTYuNzUxIDYuMjA1IDAuMzggNi45NzggNS44NjIgNi4xMDEgOC43NjdMNjYuMTE5IDc3aDUuNzgzYy0yLjA5Ni00LjEyMy0wLjY5OC04Ljk4MyAzLjA0LTEyLjUzNSAzLjMxNC0zLjEyMiA4LjE0MS00LjA3NCAxMi4zMjUtMi43NDUgNC45MTYgMS41ODkgNy43OTMgNi44MjEgNi4wMDggMTEuNjg3LTAuNTc3IDEuNzI3LTIuNDA1IDIuNjgxLTQuMTM3IDIuMDk5LTEuNzE0LTAuNTY3LTIuNjc1LTIuNDEtMi4xMTEtNC4xMzggMC44ODYtMi42NDItMC43MS01LjQ4MS0zLjU5MS02LjQ1Mi0zLjAwNS0xLjA1NC02LjMyMyAwLjQxNC03LjM5IDMuMjQ3LTAuNTM3IDEuNTE0LTAuNDE1IDMuMDE1IDAuMjMxIDQuMjgxSDEyMC45N1YxMjBINjguOTI3bC01LjM3My05LjhMNTguOTY0IDEyMGgtNi4zODNsLTYuMjktOS44MjVMMzkuNDAxIDEyMEgyLjAzNVY3Ny4wMTNsMjguODM5LTI0LjM4NWMxLjczMy0xLjQ2OCAzLjg3NC0yLjI5NSA2LjEyOS0yLjMyNiAyLjAwNS0wLjAyNSAzLjc4NiAwLjYwMyA1LjE3MyAxLjc0M0w2MCA1NC43NzZMMjcuMTMyIDgyLjY3MWgtNC43MjQgTDMuMDQgNzcuODcyYy0xLjg4OC0yLjAwNC0yLjM1OC00LjU1NS0xLjMwMy02Ljk5N2MxLjA3Ny0yLjU5NyAzLjY1OC00LjQyNiA2LjQ2Mi00LjQ1NWMzLjAzOS0wLjAzIDUuNTIzIDIuMTQgNi4wNjkgNC42NTggMC4yMjMgMS4wMTEgMS4yNjIgMS42NzYgMi4zMTggMS42NzYgMS40OTQgMCAyLjcxLTEuMTg1IDIuNzU2LTIuNjc5IDAuMDkzLTIuOTU1LTIuMTA2LTUuNTc4LTQuMzQ4LTcuMTk2TDYuNDg3IDU4LjcxIDEuNDE5IDYzLjk2OCAyLjg2NCA2OC44MTZDMy40OTMgNzAuNzg4IDUuMTgxIDcxLjk1NyA2Ljg5IDcxLjk1N2MxLjc2IDAgMy40NTctMC45MjQgNC4zMDMtMi40MjQgMC43ODItMS4zMiAyLjM4Mi0xLjcxNiAzLjY1OS0wLjkzMyAxLjM2IDAuODIzIDEuNzc2IDIuNjUyIDAuOTU0IDMuOTU5QzE0LjM3MSA3Mi42NTMgMTIuMzgzIDczLjg3IDkuNTM3IDczLjc2NiA3LjI5NyA3My42NyA1LjQxNyA3MS45NjggNS4zMjkgNjkuNzIzeiIgZmlsbD0iI0Q5REVFRCIvPjwvc3ZnPg==";

function RecommenderContent() {
  const params = useSearchParams();
  const [items, setItems] = useState<Result[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Result | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [topK, setTopK] = useState(50);
  const [mode, setMode] = useState<"Todo" | "Solo texto" | "Solo imagen">("Todo");
  const [sortBy, setSortBy] = useState<"score" | "title">("score");
  const [signals, setSignals] = useState<{ title: boolean; description: boolean; category: boolean; image: boolean }>({
    title: true,
    description: true,
    category: false,
    image: true,
  });

  const paramId = params.get("productId");

  const fetchSimilar = async (productId: string) => {
    if (!productId) return;
    setLoading(true);
    const qs = new URLSearchParams({
      productId,
      topK: String(topK),
      mode: mode === "Todo" ? "mixto" : mode === "Solo texto" ? "texto" : "imagen",
      signals: JSON.stringify(signals),
    });
    try {
      const res = await fetch(`/api/similar?${qs.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setSelectedProduct(data.origin ?? null);
      setItems(data.results ?? []);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramId) {
      fetchSimilar(paramId);
      return;
    }
    // fallback: pick first product
    fetchSimilar("0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  useEffect(() => {
    if (mode === "Solo imagen" && !signals.image) {
      setSignals((prev) => ({ ...prev, image: true }));
    }
  }, [mode, signals.image]);

  useEffect(() => {
    if (selectedProduct?.id) {
      fetchSimilar(selectedProduct.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, signals, topK]);

  const related = selectedProduct ? items.filter((i) => i.id !== selectedProduct.id) : items;
  const sorted =
    sortBy === "score"
      ? [...related].sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
      : [...related].sort((a, b) => a.title.localeCompare(b.title));
  const perPage = topK;
  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [pageCount, currentPage]);

  const renderImage = (url?: string, alt?: string) => {
    if (!url) return "No image";
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={`${alt}-${url}`}
        src={url || FALLBACK_IMG}
        alt={alt || "product image"}
        className="h-full w-full object-contain"
        referrerPolicy="no-referrer"
        onError={(e) => {
          if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-bg text-fg" suppressHydrationWarning>
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-primary">
            <Link href="/" className="inline-flex items-center gap-2 hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </Link>
            <span className="text-muted">/</span>
            <span className="text-muted font-normal">Recomendador</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 text-lg">
              <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight text-fg">
                <Repeat2 className="h-6 w-6 text-primary" />
                Recomendador de productos
              </h1>
              <p className="text-lg text-muted">Elige un producto origen y visualiza los más similares por embeddings.</p>
              <div className="text-sm text-muted max-w-3xl rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
                Recomendación item-to-item con filtros por señales de texto e imagen. Cambia el modo o las señales para recalcular en vivo.
              </div>
            </div>
          </div>
        </header>

        <main className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
          <section className="rounded-3xl border border-border bg-card p-5 text-lg shadow-sm">
            <p className="mt-2 text-md font-semibold uppercase text-primary">Producto origen</p>
            <div className="mt-4">
              <div className="flex gap-4">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-border bg-white text-[11px] text-muted">
                  {renderImage(selectedProduct?.image_url || selectedProduct?.image, selectedProduct?.title)}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-md font-semibold text-fg line-clamp-3">{selectedProduct?.title}</p>
                  <p className="text-xs text-muted">{selectedProduct?.category_path}</p>
                  <p
                    className="text-xs text-muted"
                    style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
                  >
                    {selectedProduct?.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-3 rounded-2xl border border-dashed border-primary/30 bg-card-muted p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">Similarity mode</span>
                <div className="inline-flex rounded-full border border-border px-1 py-1 text-xs bg-card">
                  {(["Todo", "Solo texto", "Solo imagen"] as const).map((label) => (
                    <button
                      key={label}
                      onClick={() => setMode(label)}
                      className={`rounded-full px-3 py-1 transition ${mode === label ? "bg-primary text-white" : "text-fg hover:bg-card-muted"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                {mode !== "Solo imagen" && (
                  <>
                    <div className="font-semibold uppercase tracking-wide text-primary">Señales de texto</div>
                    {(["title", "description", "category"] as const).map((key) => (
                      <label key={key} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={signals[key]}
                          onChange={() => setSignals((prev) => ({ ...prev, [key]: !prev[key] }))}
                          className="h-3 w-3 rounded border border-border bg-card"
                        />
                        <span className="text-muted">{key === "title" ? "Título" : key === "description" ? "Descripción" : "Categoría"}</span>
                      </label>
                    ))}
                  </>
                )}
                {mode !== "Solo texto" && mode !== "Solo imagen" && (
                  <>
                    <div className="font-semibold uppercase tracking-wide text-primary">Señal visual</div>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={signals.image}
                        onChange={() => setSignals((prev) => ({ ...prev, image: !prev.image }))}
                        className="h-3 w-3 rounded border border-border bg-card"
                      />
                      <span className="text-muted">Imagen</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-primary">Sugerencias</p>
                <p className="text-sm text-muted">Ítems similares ordenados por embeddings.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-primary">
                <span className="rounded-full bg-primary/10 px-3 py-1">Top‑{topK}</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 capitalize">{sortBy === "score" ? "Relevance" : "Title"}</span>
              </div>
            </div>
            <section className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-2">
                  <span className="text-muted">Top-K</span>
                  <select
                    value={topK}
                    onChange={(e) => {
                      setTopK(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-full border border-border bg-card px-3 py-1 text-fg"
                  >
                    {[12, 24, 50, 75].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-muted">Ordenar por</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "score" | "title")}
                    className="rounded-full border border-border bg-card px-3 py-1 text-fg"
                  >
                    <option value="score">Relevancia</option>
                    <option value="title">Título</option>
                  </select>
                </label>
              </div>
            </section>
            <div className="relative mt-4">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-bg/70 backdrop-blur-sm text-sm text-primary">
                  Cargando similares...
                </div>
              )}
              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                {paginated.map((item, idx) => (
                  <button
                    key={`${item.title}-${idx}`}
                    onClick={() => {
                      setSelectedProduct(item);
                      setCurrentPage(1);
                      fetchSimilar(item.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex flex-col rounded-2xl border border-border/70 bg-card-muted p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                    style={{ minHeight: "320px" }}
                      aria-label={`Ver similares a ${item.title}`}
                  >
                    <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-white text-[11px] text-muted">
                      {renderImage(item.image_url || item.image, item.title)}
                    </div>
                    <div className="mt-3 flex-1 space-y-1">
                      <p className="text-lg font-semibold text-fg line-clamp-3" title={item.title}>
                        {item.title}
                      </p>
                      <p
                        className="text-md text-muted"
                        style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                        title={item.description}
                      >
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-md">
                      <span className="text-xs font-semibold uppercase text-primary">similarity</span>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {item.similarity !== undefined ? item.similarity : Math.round(((item as { score?: number }).score ?? 0) * 100)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {pageCount > 1 && (
              <div className="flex items-center justify-between pt-4 text-sm text-muted">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-fg hover:bg-card-muted disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <span>
                  Página {currentPage} / {pageCount}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                  disabled={currentPage >= pageCount}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-fg hover:bg-card-muted disabled:opacity-40"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default function RecommenderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg text-fg px-6 py-12">Loading recommender…</div>}>
      <RecommenderContent />
    </Suspense>
  );
}
