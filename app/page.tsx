"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Repeat2, Link2 } from "lucide-react";

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

export default function Home() {
  const lottieRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animationInstance: LottieAnimation | undefined;
    let cancelled = false;

    const ensureLottie = () =>
      new Promise<LottiePlayer | undefined>((resolve) => {
        if (window.lottie) return resolve(window.lottie);
        const existing = document.querySelector(
          'script[src="https://unpkg.com/lottie-web/build/player/lottie.min.js"]',
        );
        if (existing) {
          existing.addEventListener("load", () => resolve(window.lottie), {
            once: true,
          });
          return;
        }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/lottie-web/build/player/lottie.min.js";
        script.async = true;
        script.onload = () => resolve(window.lottie);
        script.onerror = () => resolve(undefined);
        document.body.appendChild(script);
      });

    const loadAnimation = async () => {
      try {
        const res = await fetch("/animation.json");
        const data = await res.json();
        const lottieLib = await ensureLottie();
        if (cancelled || !lottieLib || !lottieRef.current) return;
        lottieRef.current.innerHTML = "";
        animationInstance = lottieLib.loadAnimation({
          container: lottieRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: data,
        });
      } catch {
        // ignore load errors
      }
    };

    loadAnimation();

    return () => {
      cancelled = true;
      animationInstance?.destroy?.();
    };
  }, []);

  return (
    <main className="bg-bg text-fg">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Multimodal product matching
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted">
              TFM project: one similarity engine for search, recommendations, and human-in-the-loop catalog matching.
            </p>
          </div>

          <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-border bg-card-muted shadow-sm ring-1 ring-border/60 md:h-72">
            <div
              ref={lottieRef}
              className="absolute inset-0"
              aria-label="Hero animation"
            />
          </div>
        </div>

        <div id="cases" className="mt-10 grid gap-6 md:grid-cols-3">
          <Link
            href="/studio/case1"
            className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Repeat2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Case 1
                </p>
                <h2 className="text-lg font-semibold">Semantic search</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Free-text search ranked by embedding similarity.
            </p>
            <p className="mt-4 text-sm font-semibold text-primary group-hover:underline">
              Go to Case 1 →
            </p>
          </Link>

          <Link
            href="/studio/case2"
            className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Search className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Case 2
                </p>
                <h2 className="text-lg font-semibold">Similar products</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Pick a product and fetch the top-K most similar items.
            </p>
            <p className="mt-4 text-sm font-semibold text-primary group-hover:underline">
              Go to Case 2 →
            </p>
          </Link>

          <Link
            href="/studio/case3"
            className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Link2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Case 3
                </p>
                <h2 className="text-lg font-semibold">Smart Connections</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Link a client catalog to competitors with scored matches and validation.
            </p>
            <p className="mt-4 text-sm font-semibold text-primary group-hover:underline">
              Go to Case 3 →
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
