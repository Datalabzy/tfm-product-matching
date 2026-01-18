import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type Product = { title: string; description: string; image?: string };

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase().trim() ?? "";
    const limitParam = Number(searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 200;

    // Preferimos el sample exportado en /data; fallback al nombre legacy si no existe
    const finalPath = path.join(process.cwd(), "data", "products.jsonl");
    const legacyPath = path.join(process.cwd(), "data", "meta_Cell_Phones_and_Accessories_sample.jsonl");
    const filePath = (await fs.stat(finalPath).then(() => finalPath).catch(() => null)) ?? legacyPath;

    const raw = await fs.readFile(filePath, "utf-8");
    const trimmed = raw.trim();

    let parsed: Product[] = [];
    try {
      if (trimmed.startsWith("[")) {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr)) {
          parsed = arr
            .map((obj) => ({
              title: obj?.title || "",
              description: obj?.description || "",
              image: obj?.image || "",
            }))
            .filter((p) => p.title || p.description);
        }
      } else {
        const lines = raw.split("\n").filter(Boolean);
        parsed = lines
          .map((line) => {
            try {
              const obj = JSON.parse(line);
              return {
                title: obj.title || "",
                description: obj.description || "",
                image: obj.image || "",
              } as Product;
            } catch {
              return null;
            }
          })
          .filter(Boolean) as Product[];
      }
    } catch {
      parsed = [];
    }

    const filtered = query
      ? parsed.filter((p) => p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query))
      : parsed;

    const items = shuffle(filtered).slice(0, limit);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error leyendo sample jsonl", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
