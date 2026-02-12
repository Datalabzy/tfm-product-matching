"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Ban, SlidersHorizontal, RefreshCw, Link2 } from "lucide-react";

type Product = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  image?: string;
  category_path?: string;
  brand?: string;
  price?: number;
};

type Candidate = Product & {
  similarity?: number; // 0..1 o 0..100 según tu API
  score?: number; // por si en tu JSON viene "score"
  is_active?: boolean; // default true
};

// Este endpoint ahora leerá los datos locales generados por el notebook 4
type ApiResponse = {
  client?: Product;
  competitors?: Candidate[];
  clientIds?: string[];
  clients?: Product[];
  total?: number;
  error?: string;
};

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function scoreToPct(c: Candidate) {
  // soporta similarity en 0..1 o 0..100 o score 0..1
  if (typeof c.similarity === "number") {
    return c.similarity > 1 ? Math.round(c.similarity) : Math.round(clamp01(c.similarity) * 100);
  }
  if (typeof c.score === "number") {
    return c.score > 1 ? Math.round(c.score) : Math.round(clamp01(c.score) * 100);
  }
  // sin score disponible
  return null;
}

function renderImage(url?: string, alt?: string) {
  const FALLBACK_IMG =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIxMTkiIGhlaWdodD0iMTE5IiByeD0iMTEiIHJ5PSIxMSIgZmlsbD0iI0VGRkZGRiIgLz48cGF0aCBkPSJNNDIgNjljLTAuMjc2IDEuMzA3LTEuNTAyIDIuMjktMi44NTIgMi4yOS0xLjU1MyAwLTIuODEtMS4zMDQtMi44NDEtMi44NjEtMC4xMS0zLjkwNyA2LjE5NC02LjA3NSA2LjIxNy0yLjgzNyAwLjAwOSAyLjQ3Ny0yLjc4NSA0LjkyNS02LjUxNCA0Ljk5LTAuMDg3IDAtMC4xNy0wLjAwMS0wLjI1Ni0wLjAwM2MtMi4xMzItMC4wNTYtNC4wNjYgMS4yNzctNC44MTIgMy4yNjUtMC4zNzkgMC45NzgtMS4zODYgMS42MjUtMi40OTQgMS42MjUtMS40ODUgMC0yLjY5OC0xLjIyMi0yLjY5OC0yLjcyMSAwLTMuODk0IDQuMjU0LTcuMDU1IDkuNTkzLTYuNzUxIDYuMjA1IDAuMzggNi45NzggNS44NjIgNi4xMDEgOC43NjdMNjYuMTE5IDc3aDUuNzgzYy0yLjA5Ni00LjEyMy0wLjY5OC04Ljk4MyAzLjA0LTEyLjUzNSAzLjMxNC0zLjEyMiA4LjE0MS00LjA3NCAxMi4zMjUtMi43NDUgNC45MTYgMS41ODkgNy43OTMgNi44MjEgNi4wMDggMTEuNjg3LTAuNTc3IDEuNzI3LTIuNDA1IDIuNjgxLTQuMTM3IDIuMDk5LTEuNzE0LTAuNTY3LTIuNjc1LTIuNDEtMi4xMTEtNC4xMzggMC44ODYtMi42NDItMC43MS01LjQ4MS0zLjU5MS02LjQ1Mi0zLjAwNS0xLjA1NC02LjMyMyAwLjQxNC03LjM5IDMuMjQ3LTAuNTM3IDEuNTE0LTAuNDE1IDMuMDE1IDAuMjMxIDQuMjgxSDEyMC45N1YxMjBINjguOTI3bC01LjM3My05LjhMNTguOTY0IDEyMGgtNi4zODNsLTYuMjktOS44MjVMMzkuNDAxIDEyMEgyLjAzNVY3Ny4wMTNsMjguODM5LTI0LjM4NWMxLjczMy0xLjQ2OCAzLjg3NC0yLjI5NSA2LjEyOS0yLjMyNiAyLjAwNS0wLjAyNSAzLjc4NiAwLjYwMyA1LjE3MyAxLjc0M0w2MCA1NC43NzZMMjcuMTMyIDgyLjY3MWgtNC43MjQgTDMuMDQgNzcuODcyYy0xLjg4OC0yLjAwNC0yLjM1OC00LjU1NS0xLjMwMy02Ljk5N2MxLjA3Ny0yLjU5NyAzLjY1OC00LjQyNiA2LjQ2Mi00LjQ1NWMzLjAzOS0wLjAzIDUuNTIzIDIuMTQgNi4wNjkgNC42NTggMC4yMjMgMS4wMTEgMS4yNjIgMS42NzYgMi4zMTggMS42NzYgMS40OTQgMCAyLjcxLTEuMTg1IDIuNzU2LTIuNjc5IDAuMDkzLTIuOTU1LTIuMTA2LTUuNTc4LTQuMzQ4LTcuMTk2TDYuNDg3IDU4LjcxIDEuNDE5IDYzLjk2OCAyLjg2NCA2OC44MTZDMy40OTMgNzAuNzg4IDUuMTgxIDcxLjk1NyA2Ljg5IDcxLjk1N2MxLjc2IDAgMy40NTctMC45MjQgNC4zMDMtMi40MjQgMC43ODItMS4zMiAyLjM4Mi0xLjcxNiAzLjY1OS0wLjkzMyAxLjM2IDAuODIzIDEuNzc2IDIuNjUyIDAuOTU0IDMuOTU5QzE0LjM3MSA3Mi42NTMgMTIuMzgzIDczLjg3IDkuNTM3IDczLjc2NiA3LjI5NyA3My42NyA1LjQxNyA3MS45NjggNS4zMjkgNjkuNzIzeiIgZmlsbD0iI0Q5REVFRCIvPjwvc3ZnPg==";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url || FALLBACK_IMG}
      alt={alt || "product image"}
      className="h-full w-full object-contain"
      referrerPolicy="no-referrer"
      onError={(e) => {
        if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
      }}
    />
  );
}

function SmartConnectionsContent() {
  const params = useSearchParams();
  const clientProductId = params.get("productId") || ""; // reutiliza query param
  const [loading, setLoading] = useState(false);

  const [origin, setOrigin] = useState<Product | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allClientIds, setAllClientIds] = useState<string[]>([]);
  const [clientList, setClientList] = useState<Product[]>([]);
  const [clientPage, setClientPage] = useState(0);
  const [clientTotal, setClientTotal] = useState<number>(0);
  const CLIENT_PAGE_SIZE = 8;

  // UI controls
  const [topK, setTopK] = useState(25);
  const [threshold, setThreshold] = useState(60); // %
  const [sortBy, setSortBy] = useState<"score" | "title">("score");
  const [showDiscarded, setShowDiscarded] = useState(false);

  // validation state
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [discardedIds, setDiscardedIds] = useState<Set<string>>(new Set());

  const selectedMatch = origin;

  const fetchConnections = async (clientId: string) => {
    if (!clientId) return;
    setLoading(true);
    setCandidates([]);
    setSelectedMatchId(null);
    setDiscardedIds(new Set());
    try {
      const res = await fetch(`/api/matchings?clientId=${encodeURIComponent(clientId)}`);
      const text = await res.text();
      if (!text) {
        setOrigin(null);
        setCandidates([]);
        return;
      }
      const data: ApiResponse = JSON.parse(text);
      if (data.clientIds) setAllClientIds(data.clientIds);
      if (!res.ok || data.error) {
        setOrigin(null);
        setCandidates([]);
        return;
      }
      setOrigin(data.client ?? null);
      setCandidates((data.competitors ?? []).map((c) => ({ ...c, is_active: c.is_active ?? true })) as Candidate[]);
      setSelectedMatchId(null);
      setDiscardedIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  const loadClientPage = async (page: number) => {
    const offset = page * CLIENT_PAGE_SIZE;
    const res = await fetch(`/api/matchings?list=1&offset=${offset}&limit=${CLIENT_PAGE_SIZE}`);
    const text = await res.text();
    if (!text) return;
    const data: ApiResponse = JSON.parse(text);
    if (data.clientIds) setAllClientIds(data.clientIds);
    if (typeof data.total === "number") setClientTotal(data.total);
    setClientList(data.clients ?? []);
    setClientPage(page);
    if (!origin && (data.clients?.length ?? 0) > 0) {
      fetchConnections(data.clients![0].id);
    }
  };

  useEffect(() => {
    if (clientProductId) {
      fetchConnections(clientProductId);
      return;
    }

    // fallback: cargamos primera página de clientes y seleccionamos el primero
    loadClientPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientProductId]);

  // En esta vista topK solo filtra en cliente/competidor precomputado, así que no recarga.

  const visibleCandidates = useMemo(() => {
    const base = candidates.map((c) => {
      const pct = scoreToPct(c);
      const active = !discardedIds.has(c.id) && (c.is_active ?? true);
      return { ...c, _pct: pct, _active: active } as Candidate & { _pct: number | null; _active: boolean };
    });

    const filtered = base.filter((c) => {
      if (!showDiscarded && !c._active) return false;
      if (c._pct !== null && c._pct < threshold && c._active) return false; // aplica threshold solo cuando hay score
      return true;
    });

    const sorted =
      sortBy === "score"
        ? [...filtered].sort((a, b) => {
            const pa = a._pct ?? -1;
            const pb = b._pct ?? -1;
            return pb - pa;
          })
        : [...filtered].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));

    return sorted.slice(0, topK);
  }, [candidates, discardedIds, showDiscarded, threshold, sortBy]);

  const discardCandidate = (id: string) => {
    setDiscardedIds((prev) => new Set(prev).add(id));
    if (selectedMatchId === id) setSelectedMatchId(null);
  };

  const restoreCandidate = (id: string) => {
    setDiscardedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const confirmMatch = async () => {
    if (!origin?.id || !selectedMatchId) return;

    // TODO: luego lo mandas a Supabase / DB
    // endpoint sugerido: POST /api/feedback/match
    // body: { clientProductId, competitorProductId, decision: "match" }
    alert(`MATCH confirmado: ${origin.id} -> ${selectedMatchId}`);
  };

  const markNoMatch = async () => {
    if (!origin?.id) return;

    // TODO: POST /api/feedback/match con decision "no_match"
    alert(`Marcado como SIN MATCH para: ${origin.id}`);
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
        {/* Breadcrumb */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-primary">
            <Link href="/" className="inline-flex items-center gap-2 hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <span className="text-muted">/</span>
            <span className="text-muted font-normal">Smart Connections</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
                <Link2 className="h-6 w-6 text-primary" />
                Smart Connections (1→N)
              </h1>
              <p className="text-lg text-muted">
                Pick the best competitor equivalent for a client product. Includes thresholding and manual validation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedMatchId(null);
                  setDiscardedIds(new Set());
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-card-muted"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </header>

        <main className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-[460px_1fr]">
          {/* LEFT: Catálogo y origen */}
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Catálogo cliente</p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>
                  Mostrando {clientList.length} de {clientTotal || allClientIds.length || "?"}
                </span>
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={() => clientPage > 0 && loadClientPage(clientPage - 1)}
                    disabled={clientPage === 0}
                    className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-fg disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => {
                      const maxPage = Math.floor(((clientTotal || allClientIds.length || 0) - 1) / CLIENT_PAGE_SIZE);
                      if (clientPage < maxPage) loadClientPage(clientPage + 1);
                    }}
                    disabled={clientList.length < CLIENT_PAGE_SIZE}
                    className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-fg disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: "1fr" }}>
                {clientList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => fetchConnections(c.id)}
                    className={`flex flex-col items-start gap-2 rounded-2xl border px-3 py-3 text-left transition ${
                      origin?.id === c.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card-muted hover:border-primary/40"
                    }`}
                  >
                    <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded-xl bg-white text-[11px] text-muted">
                      {c.image_url ? renderImage(c.image_url, c.title) : "No image"}
                    </div>
                    <p className="text-sm font-semibold text-fg line-clamp-2">{c.title}</p>
                    <p className="text-[11px] text-muted line-clamp-1">{c.category_path}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Client product seleccionado</p>

              <div className="mt-4 flex gap-4">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-border bg-card-muted text-[11px] text-slate-500">
                  {origin?.image_url || origin?.image ? renderImage(origin.image_url || origin.image, origin.title) : "No image"}
                </div>

                <div className="flex-1 space-y-2">
                  <p className="text-md font-semibold text-fg line-clamp-3">{origin?.title ?? "Selecciona un producto"}</p>
                  <p className="text-xs text-muted">{origin?.category_path}</p>
                  <p className="text-xs text-muted line-clamp-3">{origin?.description}</p>

                  <div className="flex flex-wrap gap-2 pt-1 text-xs">
                    {origin?.brand && (
                      <span className="rounded-full border border-border bg-card-muted px-3 py-1 text-muted">
                        brand: {origin.brand}
                      </span>
                    )}
                    {typeof origin?.price === "number" && (
                      <span className="rounded-full border border-border bg-card-muted px-3 py-1 text-muted">
                        price: {origin.price}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3 rounded-2xl border border-dashed border-primary/30 bg-card-muted p-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">Controls</span>
              </div>

              <div className="grid gap-3 text-sm">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-muted">Top-K</span>
                  <select
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    className="rounded-full border border-border bg-card px-3 py-1 text-fg"
                  >
                    {[10, 25, 50, 100].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Threshold</span>
                    <span className="text-xs font-semibold text-primary">{threshold}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted">
                    Shows active candidates with score ≥ threshold. Toggle “Show discarded” to review excluded ones.
                  </p>
                </label>

                <label className="flex items-center justify-between gap-3">
                  <span className="text-muted">Sort</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "score" | "title")}
                    className="rounded-full border border-border bg-card px-3 py-1 text-fg"
                  >
                    <option value="score">Relevance</option>
                    <option value="title">Title</option>
                  </select>
                </label>

                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showDiscarded}
                    onChange={(e) => setShowDiscarded(e.target.checked)}
                    className="h-4 w-4 rounded border border-border bg-card"
                  />
                  <span className="text-muted">Show discarded</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="grid gap-2">
              <button
                disabled={!selectedMatchId}
                onClick={confirmMatch}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm match
              </button>

              <button
                onClick={markNoMatch}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-card-muted"
              >
                <XCircle className="h-4 w-4 text-primary" />
                Mark as no-match
              </button>

              <p className="text-xs text-muted">
                Tip: confirm one selected competitor item. If none is correct, mark as no-match.
              </p>
            </div>
          </section>

          {/* RIGHT: Candidate list */}
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-primary">Competitor candidates</p>
                <p className="text-sm text-muted">Select exactly one candidate as the final match.</p>
              </div>

              <div className="text-[11px] font-semibold text-primary">
                <span className="rounded-full bg-primary/10 px-3 py-1">
                  showing {visibleCandidates.length}
                </span>
              </div>
            </div>

            <div className="relative mt-4">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-bg/70 backdrop-blur-sm text-sm text-primary">
                  Loading candidates...
                </div>
              )}

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                {visibleCandidates.map((c, idx) => {
                  const pct = scoreToPct(c);
                  const isDiscarded = discardedIds.has(c.id) || c.is_active === false;

                  return (
                    <div
                      key={`${c.id}-${idx}`}
                      className={`rounded-2xl border p-4 transition ${
                        selectedMatchId === c.id
                          ? "border-primary/60 bg-primary/5 shadow-sm"
                          : "border-border/70 bg-card-muted hover:border-primary/30 hover:shadow-sm"
                      } ${isDiscarded ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-border bg-white text-[11px] text-slate-500">
                          {c.image_url || c.image ? renderImage(c.image_url || c.image, c.title) : "No image"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-fg line-clamp-2">{c.title}</p>
                          <p className="mt-1 text-xs text-muted line-clamp-2">{c.description}</p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                              {pct === null ? "—" : `${pct}%`}
                            </span>
                            {c.category_path && (
                              <span className="text-xs text-muted line-clamp-1">{c.category_path}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-2 text-sm font-semibold">
                          <input
                            type="radio"
                            name="selectedMatch"
                            checked={selectedMatchId === c.id}
                            onChange={() => setSelectedMatchId(c.id)}
                            disabled={isDiscarded}
                            className="h-4 w-4"
                          />
                          <span className={isDiscarded ? "text-muted" : "text-fg"}>Select match</span>
                        </label>

                        <div className="flex items-center gap-2">
                          {!isDiscarded ? (
                            <button
                              onClick={() => discardCandidate(c.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-card-muted"
                            >
                              <Ban className="h-4 w-4 text-primary" />
                              Discard
                            </button>
                          ) : (
                            <button
                              onClick={() => restoreCandidate(c.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-card-muted"
                            >
                              <RefreshCw className="h-4 w-4 text-primary" />
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!loading && visibleCandidates.length === 0 && (
                <div className="mt-6 rounded-2xl border border-border bg-card-muted p-6 text-sm text-muted">
                  No candidates above the current threshold. Try lowering it or enabling “Show discarded”.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default function SmartConnectionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg text-fg px-6 py-12">Loading Smart Connections…</div>}>
      <SmartConnectionsContent />
    </Suspense>
  );
}
