"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Repeat2, Link2, Sparkles, Workflow } from "lucide-react";

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
          'script[src="https://unpkg.com/lottie-web/build/player/lottie.min.js"]'
        );
        if (existing) {
          existing.addEventListener("load", () => resolve(window.lottie), {
            once: true,
          });
          return;
        }

        const script = document.createElement("script");
        script.src =
          "https://unpkg.com/lottie-web/build/player/lottie.min.js";
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
        // ignore
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
      <section className="mx-auto w-full max-w-screen-2xl px-6 py-14">
        {/* HERO */}
        <div className="grid items-center gap-10 lg:grid-cols-2 pb-7">
          <div className="max-w-3xl">
            {/* TAG */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold text-fg">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-primary">
                <Sparkles className="h-3 w-3" />
              </span>
              TFM — Master Data Science
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Multimodal Product Similarity & Matching
            </h1>

            <p className="mt-3 text-base leading-relaxed text-muted">
              Search and match products using multimodal embeddings (text and
              image), with a human validation step for ambiguous cases
            </p>

            {/* TECH TAGS */}
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-border/70 bg-primary/5 px-3 py-1 text-muted">
                cosine similarity
              </span>
              <span className="rounded-full border border-border/70 bg-primary/5 px-3 py-1 text-muted">
                multimodal embeddings
              </span>
            </div>
          </div>

          {/* ANIMATION */}
          <div className="relative hidden h-64 w-full overflow-hidden rounded-3xl md:block md:h-72">
            <div className="pointer-events-none absolute inset-0 from-transparent to-black/5" />
            <div
              ref={lottieRef}
              className="absolute inset-0 opacity-90 scale-[1.02]"
              aria-label="Hero animation"
            />
          </div>
        </div>

        {/* CASES */}
        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
            <Workflow className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Explore
            </p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Use cases
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <CaseCard
            href="/search"
            icon={<Search className="h-5 w-5" />}
            tag="Case 1"
            title="Semantic search"
            desc="Free-text queries ranked by embedding similarity."
            cta="Go to Case 1 →"
          />

          <CaseCard
            href="/recommender"
            icon={<Repeat2 className="h-5 w-5" />}
            tag="Case 2"
            title="Product recommender"
            desc="Item-to-item recommendations based on vector similarity."
            cta="Go to Case 2 →"
          />

          <CaseCard
            href="/similar"
            icon={<Link2 className="h-5 w-5" />}
            tag="Case 3"
            title="Smart Connections"
            desc="Client–competitor product matching with scoring and validation."
            cta="Go to Case 3 →"
          />
        </div>
      </section>
    </main>
  );
}

function CaseCard({
  href,
  icon,
  tag,
  title,
  desc,
  cta,
}: {
  href: string;
  icon: React.ReactNode;
  tag: string;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border/70 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/15">
          {icon}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {tag}
          </p>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted">{desc}</p>

      <p className="mt-4 text-sm font-semibold text-primary group-hover:underline">
        {cta}
      </p>
    </Link>
  );
}
