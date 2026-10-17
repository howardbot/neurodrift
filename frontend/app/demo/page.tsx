import Link from "next/link";
import { DemoButton } from "@/components/DemoButton";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Demo" };

export default function DemoPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Demo project"
        description="Creates a new project with six synthetic recording sessions (96 units, 2-D cursor velocity, 8,000 bins of 20 ms each) whose tuning drifts gradually and non-monotonically across sessions."
      />
      <div className="card space-y-3 p-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <p>
          Latent 2-D velocity is generated as a smooth random process. Each unit has cosine-like linear tuning to that
          velocity; between sessions the tuning matrix is rotated by a small random amount, a few units are replaced
          (turnover), baseline rates wander, and the behaviour statistics change slightly. Spike counts are Poisson.
        </p>
        <p>The generator is seeded, so every demo project is identical.</p>
        <p>
          NeuroDrift was inspired by the research story{" "}
          <Link href="/research/cross-day-decoding" className="text-accent-600 underline-offset-2 hover:underline dark:text-accent-300">
            Reading movement from the brain, day after day
          </Link>
          ; the demo data are synthetic, not from those recordings.
        </p>
        <DemoButton label="Create demo project" />
      </div>
    </div>
  );
}
