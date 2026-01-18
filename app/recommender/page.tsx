"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Repeat2 } from "lucide-react";

type Result = { id: string; title: string; description: string; image_url?: string; image?: string; similarity?: number };

export default function RecommenderPage() {
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
    const signalsParam = JSON.stringify(signals);
    const modeApi = mode === "Todo" ? "mixto" : mode === "Solo texto" ? "texto" : "imagen";
    const qs = new URLSearchParams({
      productId,
      topK: String(topK),
      mode: modeApi,
      signals: signalsParam,
    });
    try {
      const res = await fetch(`/api/similar?${qs.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.origin) {
        setSelectedProduct(data.origin);
      }
      if (data.results) {
        setItems(data.results);
      }
      setCurrentPage(1);
    } catch {
      // ignore errors for now
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialId = paramId || "";
    if (initialId) {
      fetchSimilar(initialId);
      return;
    }

    // No productId provided: pick a random item from search results as origin
    (async () => {
      try {
        const res = await fetch("/api/search?topK=200");
        const data = await res.json();
        const pool: Result[] = data.results ?? [];
        if (pool.length === 0) return;
        const random = pool[Math.floor(Math.random() * pool.length)];
        if (random?.id) {
          fetchSimilar(random.id);
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  const related = useMemo(() => {
    if (!selectedProduct) return [];
    return items.filter((i) => i.id !== selectedProduct.id);
  }, [items, selectedProduct]);
  const sorted = useMemo(
    () => (sortBy === "score" ? [...related].sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0)) : [...related].sort((a, b) => a.title.localeCompare(b.title))),
    [related, sortBy],
  );
  const perPage = topK;
  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [pageCount, currentPage]);

  const toggleSignal = (key: "title" | "description" | "category" | "image") => {
    setSignals((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (mode === "Solo imagen" && !signals.image) {
      setSignals((prev) => ({ ...prev, image: true }));
    }
  }, [mode, signals.image]);

  useEffect(() => {
    if (selectedProduct) {
      fetchSimilar(selectedProduct.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, signals, topK]);

  return (
    <div className="min-h-screen bg-bg text-fg" suppressHydrationWarning>
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-primary">
            <Link href="/" className="inline-flex items-center gap-2 hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <span className="text-muted">/</span>
            <span className="text-muted font-normal">Recommender</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 text-lg">
              <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight text-fg">
                <Repeat2 className="h-6 w-6 text-primary" />
                Product recommender
              </h1>
              <p className="text-lg text-muted">Choose an origin product and see the closest items by similarity.</p>
            </div>
          </div>
        </header>

        <main className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
          <section className="rounded-3xl border border-border bg-card p-5 text-lg shadow-sm">
            <p className="mt-2 text-md font-semibold uppercase text-primary">Origin product</p>
            <div className="mt-4">
              <div className="flex gap-4">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl bg-white text-[11px] text-slate-500">
                  {selectedProduct?.image_url || selectedProduct?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedProduct.image_url || selectedProduct.image || ""} alt={selectedProduct.title} className="h-full w-full object-contain" />
                  ) : (
                    "No image"
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-md font-semibold text-fg line-clamp-3">{selectedProduct?.title}</p>
                  <p className="text-xs text-muted">{selectedProduct?.category}</p>
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
                    <div className="font-semibold uppercase tracking-wide text-primary">Text signals</div>
                    {(["title", "description", "category"] as const).map((key) => (
                      <label key={key} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={signals[key]}
                          onChange={() => toggleSignal(key)}
                          className="h-3 w-3 rounded border border-border bg-card"
                        />
                        <span className="text-muted">{key === "title" ? "Title" : key === "description" ? "Description" : "Category"}</span>
                      </label>
                    ))}
                  </>
                )}
                {mode !== "Solo texto" && mode !== "Solo imagen" && (
                  <>
                    <div className="font-semibold uppercase tracking-wide text-primary">Visual signal</div>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={signals.image}
                        onChange={() => toggleSignal("image")}
                        className="h-3 w-3 rounded border border-border bg-card"
                      />
                      <span className="text-muted">Image</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-primary">Suggestions</p>
                <p className="text-sm text-muted">Similar items ranked by embeddings.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-primary">
                <span className="rounded-full bg-primary/10 px-3 py-1">Top‑{topK}</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 capitalize">
                  {sortBy === "score" ? "Relevance" : "Title"}
                </span>
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
                  <span className="text-muted">Sort by</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "score" | "title")}
                    className="rounded-full border border-border bg-card px-3 py-1 text-fg"
                  >
                    <option value="score">Relevance</option>
                    <option value="title">Title</option>
                  </select>
                </label>
              </div>
            </section>
            <div className="relative mt-4">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-bg/70 backdrop-blur-sm text-sm text-primary">
                  Loading similar items...
                </div>
              )}
              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                {paginated.map((item, idx) => (
                  <Link
                    key={`${item.title}-${idx}`}
                    href={`/recommender?productId=${encodeURIComponent(item.id)}`}
                    className="flex flex-col rounded-2xl border border-border/70 bg-card-muted p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                    style={{ minHeight: "320px" }}
                    aria-label={`View similar items to ${item.title}`}
                  >
                    <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-white text-[11px] text-slate-500">
                      {item.image_url || item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url || item.image} alt={item.title} className="h-full w-full object-contain" />
                      ) : (
                        "No image"
                      )}
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
                  </Link>
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
                  Prev
                </button>
                <span>
                  Page {currentPage} / {pageCount}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                  disabled={currentPage >= pageCount}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-fg hover:bg-card-muted disabled:opacity-40"
                >
                  Next
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
