// Mirrors backend/app/schemas. Keep in sync when the API changes.

export interface Project {
  id: string;
  name: string;
  description: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  n_sessions: number;
  latest_experiment: { id: string; name: string; status: string; created_at: string } | null;
}

export interface QcSummary {
  n_samples: number;
  n_neurons: number;
  n_outputs: number;
  duration_s: number | null;
  nan_count: number;
  pct_zero: number;
  mean_activity: number;
  median_neuron_mean: number;
  median_neuron_var: number;
  n_zero_variance_neurons: number;
  n_silent_neurons: number;
  count_like: boolean;
  target_mean: number[];
  target_var: number[];
  target_std: number[];
  n_trials: number | null;
}

export interface Session {
  id: string;
  project_id: string;
  name: string;
  session_order: number;
  subject: string | null;
  recording_date: string | null;
  bin_size_ms: number | null;
  notes: string;
  extra_metadata: Record<string, unknown>;
  n_samples: number;
  n_neurons: number;
  n_outputs: number;
  has_timestamps: boolean;
  has_trial_ids: boolean;
  has_neuron_ids: boolean;
  duration_s: number | null;
  file_size_bytes: number;
  sha256: string;
  original_filename: string;
  qc_summary: QcSummary;
  warnings: string[];
  created_at: string;
}

export interface ProjectDetail extends Project {
  sessions: Session[];
}

export interface Histogram {
  counts: number[];
  edges: number[];
}

export interface SessionQc {
  summary: QcSummary;
  neurons: {
    labels: string[];
    mean: number[];
    var: number[];
    frac_zero: number[];
    zero_variance: boolean[];
  };
  targets: { mean: number[]; var: number[]; histograms: Histogram[] };
  traces: {
    time: number[];
    time_unit: "s" | "bin";
    window_bins: number;
    targets: number[][];
    neuron_indices: number[];
    neuron_labels: string[];
    neurons: number[][];
  };
}

export interface Health {
  status: string;
  database: string;
  version: string;
}
