import { EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Experiments" };

export default function ExperimentsPage() {
  return (
    <div>
      <PageHeader title="Experiments" description="Saved cross-session analyses across all projects." />
      <EmptyState title="Cross-session experiments are not available in this build yet">
        They are implemented in Milestone 5 (decoder matrix) and Milestone 6 (subspace drift).
      </EmptyState>
    </div>
  );
}
