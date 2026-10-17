"use client";

import { useEffect } from "react";
import { ExperimentsTable } from "@/components/ExperimentsTable";
import { warmPlotly } from "@/lib/plotly";
import { Card, EmptyState, ErrorBox, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";

export default function ExperimentsPage() {
  const { data, error, loading } = useApi(api.listExperiments, "experiments");
  // Every experiment link leads to plots: fetch the chart library while the page is idle.
  useEffect(() => warmPlotly(), []);
  return (
    <div>
      <PageHeader title="Experiments" description="Saved cross-session analyses across all projects. Completed results reopen without recomputation." />
      {loading && !data && <Spinner />}
      {error && <ErrorBox error={error} title="Could not load experiments" />}
      {data && data.length === 0 && (
        <EmptyState title="No experiments yet">Open a project and choose “Run Cross-Session Analysis”.</EmptyState>
      )}
      {data && data.length > 0 && (
        <Card>
          <ExperimentsTable experiments={data} showProject />
        </Card>
      )}
    </div>
  );
}
