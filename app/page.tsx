import Link from "next/link";
import { Search, Repeat2, Link2 } from "lucide-react";

export default function Home() {
  return (
    <main className="bg-bg text-fg">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            TFM — Product similarity and matching using multimodal embeddings
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            This project demonstrates a single similarity engine applied to two
            scenarios: (1) semantic search & item-to-item recommendations, and
            (2) smart connections (client product → equivalent competitor
            products) with human-in-the-loop validation.
          </p>
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
              Free-text query → embedding → cosine similarity ranking.
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
              Pick a product → retrieve top-K most similar items (item-to-item).
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
              Client catalog → competitor catalogs. Suggest matches with scores,
              thresholding and manual validation.
            </p>
            <p className="mt-4 text-sm font-semibold text-primary group-hover:underline">
              Go to Case 3 →
            </p>
          </Link>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card-muted p-6">
          <h3 className="text-base font-semibold">Notes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>
              The UI is intentionally minimal: focus on embeddings, ranking,
              evaluation and validation workflows.
            </li>
            <li>
              Similarity can be computed from text-only, image-only, or a combined
              multimodal representation.
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
