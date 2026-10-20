// Personal profile: the single source for the home hero, the About page, the navigation
// and the footer. This repository is public, so only details the owner chose to publish
// belong here (no phone number, no unpublished manuscript titles).

export const PROFILE = {
  name: "Qin Liu",
  field: "Computational neuroscience",
  affiliation: "Computer Science & Neurobiology · University of Wisconsin–Madison",
  tagline:
    "I study how populations of neurons encode movement and vision — building the decoding pipelines, statistics, and recording hardware that let us read intention out of cortex.",
  interests: ["Neural decoding", "Population geometry", "Brain–machine interfaces", "Visual neuroscience", "Reinforcement learning", "Recording hardware"],
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
    years: "2026 — Present",
    institution: "University of Chicago",
    pi: "Prof. Nicholas Hatsopoulos",
    summary:
      "Building a cross-day neural decoding pipeline for marmoset motor cortex — spike binning, causal smoothing, PCA/CCA manifold alignment, and Kalman decoding of reach kinematics. Discovered and characterized a directional asymmetry in cross-day transfer, validated with decoder-independent controls and bootstrap statistics.",
    tags: ["Neural decoding", "Manifold alignment", "Kalman filter"],
    stories: ["cross-day-decoding"],
  },
  {
    name: "Hai Lab",
    years: "2025 — Present",
    institution: "UW–Madison",
    pi: "Prof. Aviad Hai",
    summary:
      "Neural data pipelines for multi-channel recordings — spike detection, sorting, firing-rate and functional-connectivity analysis across cortical regions — and RF characterization of miniature neural devices through automated VNA frequency sweeps fused with microscope imaging.",
    tags: ["Connectivity", "RF / VNA", "Automation"],
    stories: [],
  },
  {
    name: "Rosenberg Lab",
    years: "2024 — Present",
    institution: "UW–Madison",
    pi: "Prof. Ari Rosenberg",
    summary:
      "3D stereoscopic visual stimulation for primate electrophysiology in Psychtoolbox — disparity manipulation, multi-view rendering, and fusion-based fixation control — with population analysis of disparity coding and an ~80% runtime reduction on population-level models.",
    tags: ["Vision", "Psychtoolbox", "Kilosort"],
    stories: ["3d-vision", "spike-sorting"],
  },
  {
    name: "Hui Lab",
    years: "2022 — 2023",
    institution: "Ocean University of China",
    pi: "Prof. Hui Ma",
    summary:
      "Model-free reinforcement-learning controllers for trajectory tracking, and decentralized multi-agent path-planning in simulation — with a focus on stability, convergence, and real-time decision making.",
    tags: ["Reinforcement learning", "Optimal control", "Multi-agent"],
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
  { school: "UW–Madison", years: "2023 — Present", detail: "B.S. Computer Science & Neurobiology" },
  { school: "Heriot-Watt University", years: "2020 — 2022", detail: "Robotics · Edinburgh" },
  { school: "Ocean University of China", years: "2020 — 2022", detail: "Computer Science · Qingdao" },
];

export const RECOGNITION = [
  { title: "National Prize — Mathematical Modeling", detail: "National Student Competition · 2022" },
  { title: "Dean's List", detail: "UW–Madison · 2025" },
  { title: "Innovation & Entrepreneurship Scholarship", detail: "Ocean University of China · 2021" },
];

// Merged from the research site's Toolbox and the personal site's Toolkit.
export const TOOLKIT = [
  {
    label: "Neural data analysis",
    items: [
      "Decoding: Kalman and Wiener filters, ridge regression, support vector machines",
      "Dimensionality reduction and alignment: PCA, CCA, manifold alignment, subspace angles",
      "Statistics: block bootstrap, permutation and sign-flip tests, multiple-comparison control",
      "Firing-rate modeling, LFP and functional connectivity",
    ],
  },
  {
    label: "Electrophysiology",
    items: [
      "Single- and multi-unit recordings from tetrodes and multi-electrode implants",
      "Spike sorting with Kilosort 4 and Plexon Offline Sorter",
      "Receptive-field mapping and waveform classification",
      "Recording and stimulus hardware: Ripple (xippmex), Datapixx",
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
      "Python (NumPy, SciPy, scikit-learn), MATLAB, C / C++",
      "Git, Linux, LaTeX",
      "Reproducible pipelines with integrity checks and checksummed result snapshots",
      "Full-stack web apps: this site (Next.js, FastAPI, Docker)",
    ],
  },
];
