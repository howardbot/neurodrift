// Personal profile: the single source for the home hero, the About page, the navigation
// and the footer. This repository is public, so only details the owner chose to publish
// belong here (no phone number, no unpublished manuscript titles).

export const PROFILE = {
  name: "Qin Liu",
  field: "Computational neuroscience",
  affiliation: "Computer Science & Neurobiology · University of Wisconsin–Madison",
  tagline:
    "I study how populations of neurons encode movement and vision — building the decoding pipelines, statistics, and recording hardware that let us read intention out of cortex.",
  interests: ["Neural population dynamics", "Motor control", "Neural decoding", "Intracortical brain–computer interfaces", "Computational neuroscience"],
  email: "qliu385@wisc.edu",
  github: "https://github.com/howardbot",
  location: "Madison, Wisconsin",
  about: {
    headline: "Where signal processing meets systems neuroscience.",
    paragraphs: [
      "I'm an undergraduate at the University of Wisconsin–Madison studying Computer Science and Neurobiology. Across four labs, I work on how populations of neurons encode movement and vision — and on the code and hardware that let us listen in.",
      "My work sits at the seam of machine learning and electrophysiology: decoding reach kinematics from marmoset motor cortex, aligning neural manifolds across days, and characterizing the miniature devices that do the recording.",
    ],
  },
};

export interface Lab {
  name: string;
  years: string;
  institution: string;
  pi: string;
  summary: string;
  tags: string[];
  /** Research stories on this site that come from this lab (slugs in content/research.ts). */
  stories: string[];
}

export const LABS: Lab[] = [
  {
    name: "Hatsopoulos Lab",
    years: "May 2026 — Present",
    institution: "University of Chicago",
    pi: "Prof. Nicholas Hatsopoulos",
    summary:
      "Built a cross-day neural decoding pipeline for marmoset motor cortex — spike preprocessing, PCA/CCA-based population alignment, and Kalman/Wiener decoding of reach kinematics. Identified and characterized a directional cross-session decoding asymmetry, robust across preprocessing, decoders, target variables and dimensionality, and tested competing explanations (neural variability, behavioral coverage, population subspaces, readout remapping) with decoder-independent, matched-control, bootstrap and surrogate analyses.",
    tags: ["Neural decoding", "Population alignment", "Kalman / Wiener"],
    stories: ["cross-day-decoding"],
  },
  {
    name: "Hai Lab",
    years: "Mar. 2025 — Present",
    institution: "UW–Madison",
    pi: "Prof. Aviad Hai",
    summary:
      "Analysis pipelines for multi-channel neural recordings — spike detection and sorting, firing-rate and latency analysis, and functional connectivity across neural populations — and machine-learning approaches for identifying and validating functional interactions. Also characterizes miniature neural devices through micro-probe and SMA interfaces, VNA frequency sweeps, and automated microscope/VNA pipelines for resonance detection and repeatability.",
    tags: ["Connectivity", "Machine learning", "RF / VNA"],
    stories: [],
  },
  {
    name: "Rosenberg Lab",
    years: "May 2024 — Present",
    institution: "UW–Madison",
    pi: "Prof. Ari Rosenberg",
    summary:
      "Stereoscopic visual stimulation for macaque electrophysiology with Psychtoolbox and Datapixx — disparity manipulation, multi-view rendering, and fixation control. Analyzed responses in macaque CIP and V3A, comparing traditional spike sorting with Kilosort-derived units (receptive fields, firing rates, population responses), and cut the runtime of large-scale analysis code by about 80%.",
    tags: ["Vision", "Psychtoolbox", "Kilosort"],
    stories: ["3d-vision", "spike-sorting"],
  },
  {
    name: "Hui Lab",
    years: "Aug. 2022 — May 2023",
    institution: "Qingdao, China",
    pi: "Prof. Hui Ma",
    summary:
      "Reinforcement-learning controllers and multi-agent planning algorithms for robotic trajectory tracking and decentralized coordination, in simulation.",
    tags: ["Reinforcement learning", "Robotics", "Multi-agent"],
    stories: [],
  },
];

export interface Work {
  title: string;
  summary: string;
  tags: string[];
  href?: string;
}

export const WORK: Work[] = [
  {
    title: "ScholarOS",
    summary:
      "A self-hosted research operating system: a daily literature radar ranked against my research questions, a PDF reader with structured notes, and my library as a semantic map (UMAP + HDBSCAN) and a knowledge graph. Private to my tailnet.",
    tags: ["FastAPI", "pgvector", "Next.js"],
  },
  {
    title: "Cross-day decoding pipeline",
    summary:
      "End-to-end motor decoder: spike binning → causal Gaussian smoothing → PCA → CCA manifold alignment across sessions → Kalman-filter readout of reach kinematics.",
    tags: ["Python", "NumPy / SciPy", "scikit-learn"],
    href: "/research/cross-day-decoding",
  },
  {
    title: "Manifold-alignment validation",
    summary:
      "Decoder-independent tests for cross-day alignment — held-out canonical correlation, a TME-style dynamics-destroying surrogate, and pair-level bootstrap confidence intervals.",
    tags: ["Statistics", "Surrogates", "Bootstrap"],
  },
  {
    title: "VNA measurement automation",
    summary:
      "High-throughput resonance detection for miniature neural devices: scripted VNA control fused with microscope imaging for repeatable frequency-sweep characterization.",
    tags: ["Instrumentation", "Python", "RF"],
  },
  {
    title: "3D stereo stimulation",
    summary:
      "Disparity stimulus engine for primate electrophysiology — multi-view rendering and fusion-symbol fixation control, synchronized to real-time task hardware.",
    tags: ["MATLAB", "Psychtoolbox", "Datapixx"],
    href: "/research/3d-vision",
  },
];

export const EDUCATION = [
  { school: "University of Wisconsin–Madison", years: "Sep. 2023 — Dec. 2026", detail: "B.S. Computer Science & Neurobiology, expected December 2026" },
  { school: "Heriot-Watt University", years: "Sep. 2020 — May 2023", detail: "Undergraduate, Robotics · Edinburgh, UK" },
  { school: "Ocean University of China", years: "Sep. 2020 — May 2023", detail: "Undergraduate, Computer Science · Qingdao, China" },
];

export const RECOGNITION = [
  { title: "National Second Prize", detail: "China Undergraduate Mathematical Contest in Modeling (CUMCM) · Oct. 2022" },
  { title: "Dean's List", detail: "University of Wisconsin–Madison · May 2025" },
  { title: "Innovation and Entrepreneurship Scholarship", detail: "Ocean University of China · Sep. 2021" },
];

// Merged from the research site's Toolbox and the personal site's Toolkit.
export const TOOLKIT = [
  {
    label: "Neural data analysis",
    items: [
      "Decoding: Kalman and Wiener filters, ridge regression, support vector machines",
      "Dimensionality reduction and alignment: PCA, CCA, manifold alignment, subspace angles",
      "Statistics: block bootstrap, permutation and sign-flip tests, surrogate testing, multiple-comparison control",
      "Firing-rate and latency analysis, LFP and functional connectivity",
    ],
  },
  {
    label: "Electrophysiology",
    items: [
      "Single- and multi-unit recordings from tetrodes and multi-electrode implants",
      "Spike sorting with Kilosort 4 and Plexon Offline Sorter",
      "Receptive-field mapping and waveform classification",
      "Recording and stimulus hardware: Ripple (xippmex), Datapixx; real-time behavioral task control and hardware–software synchronization",
    ],
  },
  {
    label: "Experiments and modelling",
    items: [
      "Stereo 3D stimulus rendering with OpenGL / Psychtoolbox",
      "Population models of binocular disparity processing",
      "Synthetic data and simulations to test analyses",
    ],
  },
  {
    label: "Hardware and instrumentation",
    items: ["FET characterization of miniature neural devices", "VNA frequency sweeps and RF characterization", "KiCad and DAQ"],
  },
  {
    label: "Engineering",
    items: [
      "Python (NumPy, SciPy, pandas, scikit-learn), MATLAB, C / C++",
      "Git, Linux, LaTeX",
      "Reproducible pipelines with integrity checks and checksummed result snapshots",
      "Full-stack web apps: this site (Next.js, FastAPI, Docker)",
    ],
  },
];
