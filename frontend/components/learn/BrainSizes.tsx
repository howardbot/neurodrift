import { OUTLINE, SULCI } from "@/components/learn/brainShapes";
import { CountUp, Reveal } from "@/components/motion";
import { SPECIES, type Species } from "@/content/learn";

// Extra wiggles for the most folded brain (human): short gyral grooves inside the outline.
const HUMAN_FOLDS = [
  "M120 120 C140 110, 150 130, 170 118",
  "M100 180 C120 170, 135 190, 160 178",
  "M150 230 C170 215, 190 235, 205 220",
  "M220 70 C230 95, 215 120, 228 150",
  "M250 160 C265 175, 255 195, 270 205",
  "M360 60 C350 85, 365 100, 352 128",
  "M410 140 C430 150, 425 170, 445 178",
  "M400 70 C420 80, 440 70, 455 82",
  "M540 110 C530 130, 545 150, 535 170",
  "M320 300 C350 290, 370 300, 400 288",
  "M300 250 C330 245, 340 258, 370 248",
];

function BrainSilhouette({ species }: { species: Species["id"] }) {
  const sulci = species === "marmoset" ? SULCI.slice(0, 1) : SULCI;
  return (
    <svg viewBox="40 20 560 320" className="w-full" aria-hidden="true">
      <path d={OUTLINE} className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-800 dark:stroke-zinc-500" strokeWidth={6} />
      {sulci.map((s, i) => (
        <path key={i} d={s.d} fill="none" className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth={species === "marmoset" ? 4 : 6} strokeLinecap="round" />
      ))}
      {species === "human" &&
        HUMAN_FOLDS.map((d, i) => <path key={i} d={d} fill="none" className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth={5} strokeLinecap="round" />)}
    </svg>
  );
}

/** Three primate brains drawn to scale: width proportional to the cube root of mass. */
export function BrainSizes() {
  const maxRoot = Math.cbrt(Math.max(...SPECIES.map((s) => s.grams)));
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:items-start">
      {SPECIES.map((s, i) => {
        const width = (Math.cbrt(s.grams) / maxRoot) * 100;
        return (
          <Reveal key={s.id} delay={i * 120} className="flex flex-col">
            <div className="flex h-36 items-end justify-center">
              <div style={{ width: `${width}%` }} className="min-w-[2.25rem] transition-transform duration-500 hover:scale-105">
                <BrainSilhouette species={s.id} />
              </div>
            </div>
            <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <div className="font-semibold">{s.name}</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-semibold tracking-tight">
                  <CountUp value={s.neurons} />
                </span>
                <span className="text-xs text-zinc-500">{s.neuronsUnit}</span>
              </div>
              <div className="mt-0.5 text-xs text-zinc-500">
                about {s.grams.toLocaleString("en-US")} g · {s.folds.toLowerCase()}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{s.note}</p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
