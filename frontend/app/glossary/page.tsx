import Link from "next/link";
import { HeroGlow } from "@/components/showcase/Story";
import { glossaryEntries, RESEARCH } from "@/content/research";

export const metadata = {
  title: "Glossary",
  description: "Plain-language definitions of the neuroscience and analysis terms used on this site.",
};

// Page names for the "Used in" links: the home page's primer and the research stories.
const PAGE_NAMES: Record<string, string> = {
  "/": "Neuroscience in two minutes",
  ...Object.fromEntries(RESEARCH.map((r) => [`/research/${r.slug}`, r.title])),
};

export default function Glossary() {
  const entries = glossaryEntries();
  // Each letter links to its first entry's card, so the whole card lands below the header.
  const letters = new Map<string, string>();
  for (const e of entries) {
    const letter = e.term[0]!.toUpperCase();
    if (!letters.has(letter)) letters.set(letter, e.id);
  }
  return (
    <article className="mx-auto max-w-3xl py-6">
      <header className="relative mb-10">
        <HeroGlow />
        <div className="mb-1.5 animate-fade-up text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">Reference</div>
        <h1 className="animate-fade-up text-3xl font-semibold tracking-tight [animation-delay:80ms] md:text-4xl">Glossary</h1>
        <p className="mt-3 animate-fade-up text-lg leading-relaxed text-zinc-600 [animation-delay:160ms] dark:text-zinc-400">
          Every term with a dotted underline on this site, in one place. Tap or hover a term in the text to see its definition there.
        </p>
        <nav aria-label="Jump to letter" className="mt-5 flex animate-fade-up flex-wrap gap-1.5 [animation-delay:240ms]">
          {[...letters].map(([l, id]) => (
            <a key={l} href={`#${id}`} className="flex h-8 min-w-8 items-center justify-center rounded-md border border-zinc-200 bg-white/80 px-2 font-mono text-xs font-medium text-zinc-600 hover:border-accent-500/60 hover:text-accent-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-accent-200">
              {l}
            </a>
          ))}
        </nav>
      </header>

      <dl className="space-y-3">
        {entries.map((e) => {
          return (
            <div key={e.id} id={e.id} className="card p-4">
              <dt className="font-semibold">{e.term}</dt>
              <dd className="mt-1 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{e.definition}</dd>
              <dd className="mt-2 text-xs text-zinc-500">
                Used in:{" "}
                {e.usedIn.map((href, k) => (
                  <span key={href}>
                    {k > 0 && ", "}
                    <Link href={href === "/" ? "/#primer" : href} className="text-accent-600 underline-offset-2 hover:underline dark:text-accent-300">{PAGE_NAMES[href] ?? href}</Link>
                  </span>
                ))}
              </dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}
