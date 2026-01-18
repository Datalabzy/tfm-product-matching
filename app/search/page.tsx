"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Search as SearchIcon } from "lucide-react";

type Result = { id: string; title: string; description: string; image_url?: string; image?: string };
type LottieAnimation = { destroy?: () => void };
type LottiePlayer = {
  loadAnimation: (options: {
    container: Element;
    renderer: "svg" | "canvas" | "html";
    loop?: boolean;
    autoplay?: boolean;
    animationData: unknown;
  }) => LottieAnimation;
};

declare global {
  interface Window {
    lottie?: LottiePlayer;
  }
}

function NoResults() {
  const lottieRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let anim: LottieAnimation | undefined;
    const loadLottie = async () => {
      if (!window.lottie) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/lottie-web/build/player/lottie.min.js";
        script.async = true;
        script.onload = start;
        document.body.appendChild(script);
      } else {
        start();
      }
    };
    const start = async () => {
      try {
        const res = await fetch("/no-results.json");
        const data = await res.json();
        if (!lottieRef.current || !window.lottie) return;
        lottieRef.current.innerHTML = "";
        anim = window.lottie.loadAnimation({
          container: lottieRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: data,
        });
      } catch {
        /* ignore */
      }
    };
    loadLottie();
    return () => anim?.destroy?.();
  }, []);

  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card-muted px-6 py-8 text-center">
      <div className="space-y-1">
        <p className="text-base font-semibold text-fg md:text-lg">No matches found</p>
        <p className="text-sm text-muted">Try another query, broaden terms, or clear filters.</p>
      </div>
      <div ref={lottieRef} className="h-48 w-full max-w-[360px] md:h-64" />
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [allResults, setAllResults] = useState<Result[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 28;

  const handleSearch = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("query", query.trim());
    params.set("topK", "500");
    params.set("mode", "mixto");
    fetch(`/api/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setAllResults(data.results ?? []);
        setCurrentPage(1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allResults;
    return allResults.filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [allResults, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [pageCount, currentPage]);

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
            <span className="text-muted font-normal">Search</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight md:text-4xl">
                <SearchIcon className="h-6 w-6 text-primary" />
                Semantic search
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-muted">
                Free-text queries ranked by embedding similarity across your catalog.
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-4 rounded-2xl border border-border/80 bg-card-muted p-5">
              <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-white px-4 py-3">
                <span className="text-primary">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Search products..."
                  className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
                />
              </div>
              <p className="text-xs text-muted">Search by attributes, style, color, or product type.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
                >
                  Search
                </button>
                <button
                  onClick={() => setQuery("")}
                  className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold text-fg hover:bg-card-muted"
                >
                  Clear
                </button>
              </div>
            </aside>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                <p>
                  Showing {paginated.length} of {filtered.length} results
                </p>
                <span className="rounded-full border border-border/70 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary">
                  Similarity search
                </span>
              </div>
              {paginated.length === 0 ? (
                <NoResults />
              ) : (
                <>
                  <div
                    className="grid justify-start gap-5"
                    style={{
                      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    }}
                  >
                    {paginated.map((r, idx) => (
                      <Link
                        href={`/recommender?productId=${encodeURIComponent(r.id)}`}
                        key={`${r.title}-${idx}`}
                        className="flex flex-col rounded-2xl border border-border/70 bg-card-muted p-4 transition hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
                        style={{ minHeight: "320px" }}
                      >
                        <div className="flex h-44 items-center justify-center overflow-hidden rounded-xl bg-white text-[11px] text-muted">
                          {r.image_url || r.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.image_url || r.image} alt={r.title} className="h-full w-full object-contain" />
                          ) : (
                            "No image"
                          )}
                        </div>
                        <div className="mt-3 flex-1 space-y-1">
                          <p className="line-clamp-3 text-lg font-semibold text-fg">{r.title}</p>
                          <p className="text-md line-clamp-2 text-muted">{r.description}</p>
                        </div>
                      </Link>
                    ))}
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
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
