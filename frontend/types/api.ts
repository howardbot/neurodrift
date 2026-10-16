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

export type DecoderKind = "ridge" | "linear";

export interface MetricSet {
  r: (number | null)[];
  r2: (number | null)[];
  rmse: number[];
  mean_r: number | null;
  mean_r2: number | null;
  mean_rmse: number;
  n_undefined: number;
}

export interface DecodeResult {
  config: { decoder: DecoderKind; alpha: number | null; zscore: boolean; outputs: number[]; train_fraction: number };
  split: { n_train: number; n_test: number; train_bins: [number, number]; test_bins: [number, number] };
  features: { n_in: number; n_used: number; n_dropped_zero_variance: number };
  metrics: MetricSet;
  traces: { time: number[]; time_unit: "s" | "bin"; actual: number[][]; predicted: number[][] };
  scatter: { actual: number[][]; predicted: number[][] };
}

export interface DecodeParams {
  decoder: DecoderKind;
  alpha: number;
  zscore: boolean;
  outputs: number[];
}

export type ExperimentStatus = "pending" | "running" | "completed" | "failed";

export interface ExperimentConfig {
  decoder: DecoderKind;
  alpha: number;
  zscore: boolean;
  n_components: 3 | 5 | 10 | 20;
  outputs: number[] | null;
  train_fraction: number;
}

export interface Experiment {
  id: string;
  project_id: string;
  name: string;
  status: ExperimentStatus;
  config: ExperimentConfig;
  sessions: { id: string; name: string; session_order: number }[];
  random_seed: number;
  software: Record<string, string>;
  progress: number;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface ExperimentCreate extends Partial<ExperimentConfig> {
  name?: string;
  session_ids?: string[];
  random_seed?: number;
}

export interface DecoderCellOk {
  status: "ok";
  metrics: MetricSet;
  n_shared: number;
  n_used: number;
  n_dropped_zero_variance: number;
  alignment: "neuron_ids" | "index";
  warning: string | null;
  n_train: number;
  n_test: number;
}

export type DecoderCell = DecoderCellOk | { status: "unavailable"; reason: string };

export type MatrixKey = "mean_r" | "mean_r2" | "mean_rmse" | "n_shared" | "n_used";

export interface DecoderResult {
  matrices: Record<MatrixKey, (number | null)[][]>;
  cells: DecoderCell[][];
  sessions: { id: string; name: string; n_samples: number; n_neurons: number; n_train: number; n_test: number }[];
}

export interface ExperimentMatrix {
  decoder: DecoderResult;
  subspace: unknown | null;
  summary: {
    decoder: Record<"mean_r" | "mean_r2" | "mean_rmse", { mean_diagonal: number | null; mean_off_diagonal: number | null }>;
    n_unavailable: number;
    session_loads: number;
  };
}
