"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
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

export default function EvalPage() {
  const params = useSearchParams();
  const seedParam = params.get("seed") || params.get("user") || "1";
  const [base, setBase] = useState<Product | null>(null);
  const [cands, setCands] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  return (
    <div className="min-h-screen bg-bg text-fg" suppressHydrationWarning>
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-primary">
          <Link href="/" className="inline-flex items-center gap-2 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span className="text-muted">/</span>
          <span className="text-muted font-normal">Eval</span>
        </div>

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Human eval</h1>
          <p className="text-muted">Selecciona los 5 candidatos que más se parezcan al producto base. Semilla: {seedParam}</p>
        </header>

        {base && (
          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-primary">Producto base</p>
            <div className="mt-3 flex gap-3">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-white text-[11px] text-muted">
                {base.image_url || base.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={base.image_url || base.image} alt={base.title} className="h-full w-full object-contain" />
                ) : (
                  "No image"
                )}
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold">{base.title}</p>
                <p className="text-sm text-muted line-clamp-2">{base.description}</p>
                <p className="text-xs text-muted">{base.category_path}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
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

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>Seleccionados: {selected.size}</span>
          <span>Semilla actual: {seedParam}</span>
          <span>URL compartible: /eval?seed={seedParam}</span>
        </div>
      </div>
    </div>
  );
}
