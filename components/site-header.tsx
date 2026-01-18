export function SiteHeader() {
  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6 sm:py-5 md:gap-6">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shrink-0">
            TFM
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-base font-semibold text-fg truncate">
              Multimodal Product Matching
            </p>
            <p className="text-sm text-muted hidden sm:block">
              Search, recommendation & smart connections with embeddings
            </p>
          </div>
        </div>

        {/* <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/#cases"
            className="rounded-xl border border-border px-3 py-2 text-xs sm:text-sm font-semibold text-fg hover:bg-card-muted"
          >
            Cases
          </Link>
        </nav> */}
      </div>
    </header>
  );
}
