import { PlacesGlobe } from "@/components/profile/PlacesGlobe";
import { Figure, HeroGlow } from "@/components/showcase/Story";
import { PROFILE } from "@/content/profile";

export const metadata = {
  title: "Places",
  description: `Where ${PROFILE.name} has lived, studied and travelled, on a globe you can turn.`,
};

export default function Places() {
  return (
    <div className="mx-auto max-w-5xl py-6">
      <section className="relative mb-6 pt-2">
        <HeroGlow />
        <div className="mb-3 flex animate-fade-up items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">
          <span className="h-px w-5 bg-gradient-to-r from-accent-500 to-transparent" />
          Places
        </div>
        <h1 className="animate-fade-up text-[2rem] font-semibold leading-[1.15] tracking-tight [animation-delay:60ms] md:text-[2.6rem]">
          Where I&apos;ve been
        </h1>
        <p className="mt-4 max-w-2xl animate-fade-up text-lg leading-relaxed text-zinc-700 [animation-delay:140ms] dark:text-zinc-300">
          The cities I have lived and studied in, and the places I have travelled to.
        </p>
      </section>

      <Figure label="Interactive · globe" caption="Land from Natural Earth (public domain), drawn as an even grid of dots on the sphere.">
        <div className="p-4 md:p-6">
          <PlacesGlobe />
        </div>
      </Figure>
    </div>
  );
}
