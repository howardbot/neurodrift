import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GLOSSARY, glossaryEntries } from "@/content/research";

const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "app");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return name.endsWith(".tsx") ? [p] : [];
  });
}

/** Route of an app/…/page.tsx file, e.g. app/research/3d-vision/page.tsx -> /research/3d-vision. */
function route(file: string): string {
  const rel = path.relative(APP, path.dirname(file)).split(path.sep).join("/");
  return rel ? `/${rel}` : "/";
}

// Where each glossary term is used, read from the sources. Any prop order or line break.
const TERM = /<Term\b[^>]*?\bid="([^"]+)"/gs;
const used = new Map<string, Set<string>>();
const outsidePages: string[] = [];
for (const file of [...sources(APP), ...sources(path.join(ROOT, "components"))]) {
  for (const m of readFileSync(file, "utf8").matchAll(TERM)) {
    if (path.basename(file) !== "page.tsx" || !file.startsWith(APP)) {
      outsidePages.push(path.relative(ROOT, file));
      continue;
    }
    const id = m[1]!;
    if (!used.has(id)) used.set(id, new Set());
    used.get(id)!.add(route(file));
  }
}

describe("glossary", () => {
  it("defines every term a page uses", () => {
    expect([...used.keys()].filter((id) => !(id in GLOSSARY))).toEqual([]);
  });

  it("finds terms only in pages, where their route is known", () => {
    // A <Term id> in a shared component would appear on pages the usedIn lists cannot see.
    expect(outsidePages).toEqual([]);
  });

  it("lists exactly the pages that use each term", () => {
    for (const [id, entry] of Object.entries(GLOSSARY)) {
      expect(entry.usedIn.length, id).toBeGreaterThan(0);
      expect([...entry.usedIn].sort(), id).toEqual([...(used.get(id) ?? [])].sort());
    }
  });

  it("sorts entries alphabetically and gives each a definition", () => {
    const terms = glossaryEntries().map((e) => e.term.toLowerCase());
    expect(terms).toEqual([...terms].sort((a, b) => a.localeCompare(b)));
    expect(glossaryEntries().every((e) => e.definition.length > 20)).toBe(true);
  });
});
