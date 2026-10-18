import Link from "next/link";
import { GuideCard } from "@/components/learn/GuideBits";
import { Reveal } from "@/components/motion";
import { HeroGlow } from "@/components/showcase/Story";
import { GUIDES } from "@/content/learn";

export const metadata = {
  title: "Field guide",
  description: "Short, interactive explainers on how neuroscientists record and read the brain — no background needed.",
};

export default function FieldGuide() {
  return (
    <div className="mx-auto max-w-5xl py-6">
      <header className="relative mb-12 max-w-3xl pt-2">
        <HeroGlow />
        <div className="mb-4 animate-fade-up text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">Field guide</div>
        <h1 className="animate-fade-up text-3xl font-semibold leading-tight tracking-tight [animation-delay:80ms] md:text-[2.6rem] md:leading-[1.15]">
          How do you listen to a brain?
        </h1>
        <p className="mt-4 animate-fade-up text-lg leading-relaxed text-zinc-600 [animation-delay:160ms] dark:text-zinc-400">
          The research pages on this site assume a few things: that we can record neurons, and turn those recordings into numbers. These
          short guides explain how, with something to play with on every page.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {GUIDES.map((g, i) => (
          <GuideCard key={g.slug} guide={g} index={i} />
        ))}
      </div>

      <Reveal className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/#primer" className="group font-medium text-accent-600 dark:text-accent-300">
          Neuroscience in two minutes <span className="arrow">→</span>
        </Link>
        <Link href="/glossary" className="group font-medium text-accent-600 dark:text-accent-300">
          Every term, defined <span className="arrow">→</span>
        </Link>
      </Reveal>
    </div>
  );
}
