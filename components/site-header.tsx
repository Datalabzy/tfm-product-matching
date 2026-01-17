import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white">
            TFM
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold text-fg">
              Multimodal Product Matching
            </p>
            <p className="text-sm text-muted">
              Search, recommendation & smart connections with embeddings
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/#cases"
            className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-fg hover:bg-card-muted"
          >
            Cases
          </Link>
          <Link
            href="/studio/case3"
            className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Smart Connections
          </Link>
        </nav>
      </div>
    </header>
  );
}