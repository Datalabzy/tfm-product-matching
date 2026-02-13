"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Save, Sparkles } from "lucide-react";
import Link from "next/link";

type Product = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  image?: string;
  category_path?: string;
  brand?: string;
};

function EvalContent() {
  const params = useSearchParams();
  const router = useRouter();
  const seedParam = params.get("seed") || params.get("user") || "1";
  const REQUIRED = 3;
  const [base, setBase] = useState<Product | null>(null);
  const [cands, setCands] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const total = cands.length || 0;

  const fetchSet = async (seed: string) => {
    setSelected(new Set());
    const res = await fetch(`/api/eval-set?seed=${encodeURIComponent(seed)}`);
    if (!res.ok) return;
    const data = await res.json();
    setBase(data.base);
    setCands(data.candidates || []);
  };

  useEffect(() => {
    fetchSet(seedParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedParam]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (!base || selected.size < REQUIRED) return;
    setSaving(true);
    try {
      await fetch("/api/eval-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: seedParam, base_id: base.id, selected_ids: Array.from(selected) }),
      });
      // avanzar a la siguiente semilla para agilizar paneles
      const nextSeed = String((Number(seedParam) || 0) + 1);
      router.push(`/eval?seed=${encodeURIComponent(nextSeed)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg" suppressHydrationWarning>
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-primary">
          <Link href="/" className="inline-flex items-center gap-2 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Inicio
          </Link>
          <span className="text-muted">/</span>
          <span className="text-muted font-normal">Evaluación</span>
        </div>

        <header className="space-y-2">
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Sparkles className="h-6 w-6 text-primary" />
            Evaluación humana
          </h1>
          <p className="text-muted">
            Selecciona {REQUIRED} candidatos (de {total || "…"}) que más se parezcan al producto base. Semilla: {seedParam}
          </p>
          <div className="text-sm text-muted max-w-3xl rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 space-y-1">
            <p>Recoge feedback humano: tus elecciones se guardan en un JSON local y sirven para validar la calidad de los embeddings.</p>
            <p className="text-xs">Persistencia local: <code className="text-primary">data/eval_feedback.jsonl</code></p>
          </div>
        </header>

        {base && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase text-primary">Producto base</p>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex h-64 w-full md:w-80 items-center justify-center overflow-hidden rounded-2xl from-white to-primary/5 text-[11px] text-muted shadow-inner border border-border/60">
                {base.image_url || base.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={base.image_url || base.image} alt={base.title} className="h-full w-full object-contain" />
                ) : (
                  "No image"
                )}
              </div>
              <div className="space-y-3 md:flex-1">
                <p className="text-2xl font-semibold leading-tight">{base.title}</p>
                <p className="text-sm text-muted line-clamp-4 md:line-clamp-5">{base.description}</p>
                <p className="text-xs text-muted">{base.category_path}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {cands.map((c) => {
            const id = c.id;
            const isSel = selected.has(id);
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className={`relative flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition ${
                  isSel ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-xl bg-white text-[11px] text-muted">
                  {c.image_url || c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image_url || c.image} alt={c.title} className="h-full w-full object-contain" />
                  ) : (
                    "No image"
                  )}
                </div>
                <p className="text-sm font-semibold line-clamp-2">{c.title}</p>
                <p className="text-xs text-muted line-clamp-2">{c.description}</p>
                {isSel && (
                  <span className="absolute right-3 top-3 rounded-full bg-primary text-white p-1">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-sm text-muted sm:flex-row sm:justify-between sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <span>Seleccionados: {selected.size}/{REQUIRED}</span>
            <span>Semilla: {seedParam}</span>
            <span>URL: /eval?seed={seedParam}</span>
          </div>
          <button
            onClick={submit}
            disabled={!base || selected.size < REQUIRED || saving}
            className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-105 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Guardar feedback
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EvalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Cargando evaluación…</div>}>
      <EvalContent />
    </Suspense>
  );
}
