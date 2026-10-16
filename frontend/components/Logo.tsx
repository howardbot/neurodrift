/** Two slightly offset neural trajectories: the same manifold, a session apart. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 15c3-7 6-9 9-6s5 4 9-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-accent-600" />
      <path d="M3 19c3-7 6-9 9-6s5 4 9-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 2.5" className="text-zinc-400" />
    </svg>
  );
}
