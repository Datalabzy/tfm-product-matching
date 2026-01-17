export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted">
        © {new Date().getFullYear()} — TFM (Master Data Science). Multimodal
        embeddings, semantic search and product matching.
      </div>
    </footer>
  );
}