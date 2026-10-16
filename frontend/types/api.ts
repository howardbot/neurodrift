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

export interface DiagSummary {
  mean_diagonal: number | null;
  mean_off_diagonal: number | null;
}

export interface ExperimentMatrix {
  decoder: DecoderResult;
  subspace: SubspaceResult | null;
  summary: {
    decoder: Record<"mean_r" | "mean_r2" | "mean_rmse", DiagSummary>;
    subspace?: Record<"mean_angle" | "alignment_index", DiagSummary>;
    n_unavailable: number;
    session_loads: number;
  };
}

export type SubspaceKey = "mean_angle" | "max_angle" | "projection_distance" | "alignment_index" | "chance_mean_angle" | "n_used";

export interface SubspaceCellOk {
  status: "ok";
  k: number;
  n_neurons_used: number;
  n_shared: number;
  alignment: "neuron_ids" | "index";
  angles_deg: number[];
  mean_angle: number;
  max_angle: number;
  projection_distance: number;
  alignment_index: number;
  chance_mean_angle: number;
  chance_p05_angle: number;
  degenerate: boolean;
}

export interface SubspaceResult {
  matrices: Record<SubspaceKey, (number | null)[][]>;
  cells: (SubspaceCellOk | { status: "unavailable"; reason: string })[][];
  n_components: number;
  zscore: boolean;
}

export interface SessionPca {
  n_components_requested: number;
  n_components: number;
  zscore: boolean;
  n_features_used: number;
  n_features_dropped: number;
  explained_variance_ratio: number[];
  cumulative_explained_variance: number[];
  variance_explained_by_k: number;
  trajectory: { time: number[]; time_unit: "s" | "bin"; smooth_bins: number; pcs: number[][]; behaviour: number[][] };
}

export interface PairSessionMeta {
  id: string;
  name: string;
  subject: string | null;
  recording_date: string | null;
  bin_size_ms: number | null;
  n_samples: number;
  n_neurons: number;
  n_outputs: number;
  n_trials: number | null;
  duration_s: number | null;
  pct_zero: number | null;
  has_neuron_ids: boolean;
}

export interface PairComparison {
  experiment: { id: string; name: string; config: ExperimentConfig };
  train: PairSessionMeta;
  test: PairSessionMeta;
  indices: [number, number];
  outputs: number[];
  reference: { within_train_r?: number | null; within_test_r?: number | null; transfer_r?: number | null; within_train_angle?: number | null; within_test_angle?: number | null };
  alignment: { method: "neuron_ids" | "index"; n_shared: number; warning: string | null } | null;
  alignment_error?: string;
  representation_error?: string;
  decoder: {
    metrics: MetricSet;
    n_used: number;
    n_train: number;
    n_test: number;
    traces: { time: number[]; time_unit: "s" | "bin"; actual: number[][]; predicted: number[][] };
    scatter: { actual: number[][]; predicted: number[][] };
  } | null;
  representation: (Omit<SubspaceCellOk, "status" | "n_shared" | "alignment"> & {
    explained_variance_a: number[];
    explained_variance_b: number[];
    variance_capture: { k: number[]; captured_by_a: number[]; captured_by_own: number[] };
  }) | null;
  activity: {
    unit: string;
    labels: string[];
    mean_a: number[];
    mean_b: number[];
    diff: number[];
    pearson_r: number | null;
    mean_abs_diff: number;
    median_relative_change: number | null;
    population_mean_a: number;
    population_mean_b: number;
  } | null;
  behaviour: {
    outputs: {
      mean_a: number; mean_b: number; var_a: number; var_b: number; std_a: number; std_b: number;
      var_change_pct: number | null; ks_statistic: number; hist_edges: number[]; hist_a: number[]; hist_b: number[];
    }[];
    mean_euclidean_difference: number;
    total_var_change_pct: number | null;
    speed_mean_a: number | null;
    speed_mean_b: number | null;
    example_a: number[][];
    example_b: number[][];
  };
}
