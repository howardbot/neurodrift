import Link from "next/link";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";

function Point({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li>
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{title}</span> {children}
    </li>
  );
}

/**
 * "How to read these results" for an experiment page. Everything here restates the
 * analysis conventions in docs/DESIGN.md §2 and app/documentation/page.tsx, filled in
 * with this experiment's own split, k and chance level. A native <details>, so it works
 * without JavaScript.
 */
export function ReadingGuide({
  trainFraction,
  subspaceK,
  chance,
}: {
  trainFraction: number;
  /** PCA dimensionality of the subspace analysis, or null when it was not computed. */
  subspaceK: number | null;
  /** The chance angle over all pairs (see matrixRange in lib/stats.ts). */
  chance: { mean: number; min: number; max: number } | null;
}) {
  const train = Math.round(trainFraction * 100);
  return (
    <details className="card group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        How to read these results
        <span aria-hidden="true" className="text-zinc-400 transition-transform duration-200 group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="border-t border-zinc-200 px-4 py-3 text-sm leading-relaxed text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <ul className="list-disc space-y-2 pl-5 marker:text-zinc-400">
          <Point title="Rows train, columns test.">
            The decoder for each row is trained on the first {train}% of the row&apos;s session, and every cell in a column is tested
            on the last {100 - train}% of the column&apos;s session, using only the neurons the two sessions share (so a row&apos;s
            decoder is refit for each set of shared neurons). Every cell in a row trains on the same block, and every cell in a
            column tests on the same block.
          </Point>
          <Point title="The diagonal is the reference.">
            Same session, later block: a held-out within-session estimate, which the other cells in its row can be compared with.
          </Point>
          {subspaceK !== null && (
            <Point title="Subspace drift uses the same data.">
              Cell (i, j) compares a top-{subspaceK} PCA fit on the training block of session i with an independent fit on the test
              block of session j, on the neurons the pair shares, so it describes exactly the data behind decoder cell (i, j). The
              matrix is not symmetric, and its diagonal is a within-session reference (estimation noise plus change within the
              session), not 0°.
            </Point>
          )}
          {subspaceK !== null && (
            <Point title="Compare angles with chance, not with 90°.">
              Random {subspaceK}-dimensional subspaces of the same neuron space are not at right angles on average. The chance
              level depends on k and on how many neurons a pair shares
              {chance &&
                (chance.max - chance.min >= 0.05 ? (
                  <>
                    ; here it is about {formatNumber(chance.mean, 1)}° on average, from {formatNumber(chance.min, 1)}° to{" "}
                    {formatNumber(chance.max, 1)}° across pairs
                  </>
                ) : (
                  <>; here it is about {formatNumber(chance.mean, 1)}°</>
                ))}
              .
            </Point>
          )}
          <Point title="Lower transfer is not by itself drift.">
            A decoder can transfer worse because behaviour, recording quality or the recorded neurons differ between sessions, not
            only because the neural representation changed. Decoder transfer, representation similarity, activity and behaviour are
            reported separately, and none of them is a causal claim.
          </Point>
          <Point title="Descriptive only.">
            There are no uncertainty estimates. Pairs share sessions, so they are not independent
            {subspaceK !== null && <>, and the Spearman ρ of the drift-vs-decoding scatter is a description, not a test</>}.
            Cross-session R² can be strongly negative: values are not clipped, only the colour scale is bounded.
          </Point>
        </ul>
        <p className="mt-3 text-xs">
          Details: <Link href="/documentation#cross-session-generalisation" className="text-accent-600 underline-offset-2 hover:underline dark:text-accent-300">documentation</Link>.
        </p>
      </div>
    </details>
  );
}
