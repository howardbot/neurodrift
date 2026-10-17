// Research showcase metadata. Page content lives in app/research/<slug>/page.tsx.
// Only already-public results appear on these pages; unpublished projects are
// described at the level of questions and methods.

export interface ResearchProject {
  slug: string;
  title: string;
  hook: string;
  question: string;
  tags: string[];
  status: string;
  context?: string;
  repo?: string;
}

export const RESEARCH: ResearchProject[] = [
  {
    slug: "cross-day-decoding",
    title: "Reading movement from the brain, day after day",
    hook: "A decoder can turn brain activity into hand position — but does yesterday's decoder still work after the brain learns something new?",
    question: "Does learning a new motor skill make neural decoders harder to carry across days, and in which direction?",
    tags: ["Marmosets", "Brain–computer interfaces", "Kalman decoding", "Python"],
    status: "Exploratory analysis, public code and results",
    repo: "https://github.com/howardbot/Marmoset_Decoding_Public",
  },
  {
    slug: "shared-variability",
    title: "Do two brain areas fluctuate together?",
    hook: "The same image never produces exactly the same brain response twice. Do those wobbles ripple between connected areas?",
    question: "After accounting for what the animal saw and for slow drifts, is trial-to-trial activity shared between visual area V3A and parietal area CIP?",
    tags: ["Monkey electrophysiology", "Population statistics", "Bootstrap", "Python"],
    status: "Ongoing analysis — results not yet published",
  },
  {
    slug: "3d-vision",
    title: "Seeing depth with two eyes",
    hook: "Your eyes see two slightly different pictures. The brain turns that difference into a sense of depth and tilt.",
    question: "How could populations of neurons recover a surface's tilt and distance from binocular disparity — even when the eyes look somewhere else?",
    tags: ["Stereo vision", "OpenGL stimuli", "Computational model", "MATLAB"],
    status: "Lab project — model and stimulus software",
    context: "Rosenberg Lab",
  },
  {
    slug: "spike-sorting",
    title: "Who's talking? Checking automated spike sorting",
    hook: "One electrode hears many neurons at once, like a microphone at a party. Spike sorting separates the voices.",
    question: "Do traditional manual sorting and the automated Kilosort algorithm find the same neurons, with the same quality?",
    tags: ["Spike sorting", "Kilosort 4", "Receptive fields", "MATLAB"],
    status: "Lab methods comparison",
    context: "Rosenberg Lab",
  },
];

export function projectBySlug(slug: string): ResearchProject {
  const p = RESEARCH.find((r) => r.slug === slug);
  if (!p) throw new Error(`Unknown research project: ${slug}`);
  return p;
}

// Glossary: the single source of the plain-language definitions shown by <Term id="…">
// (components/showcase/Story.tsx, drawn by TermPopover in components/Term.tsx) and listed
// on /glossary. `usedIn` lists the pages that use each
// term; lib/glossary.test.ts checks it against the source, so keep both in step.
export interface GlossaryEntry {
  term: string;
  definition: string;
  usedIn: string[];
}

export const GLOSSARY = {
  "binocular-disparity": {
    term: "Binocular disparity",
    definition: "The difference in where a point lands on the left and right retinas. Points nearer or farther than where you are looking produce disparities of opposite sign.",
    usedIn: ["/research/3d-vision"],
  },
  "brain-computer-interface": {
    term: "Brain–computer interface",
    definition: "A system that records brain activity and translates it into commands for a computer cursor, robotic arm or other device.",
    usedIn: ["/research/cross-day-decoding"],
  },
  cca: {
    term: "CCA",
    definition: "Canonical correlation analysis: rotates two sets of signals so that their shared structure lines up as closely as possible.",
    usedIn: ["/research/cross-day-decoding"],
  },
  cip: {
    term: "CIP",
    definition: "Caudal intraparietal area: a region in parietal cortex, further along the visual pathway, involved in perceiving the 3D orientation of surfaces and linking vision to action.",
    usedIn: ["/research/shared-variability"],
  },
  decoder: {
    term: "Decoder",
    definition: "A mathematical model that maps recorded neural activity to a quantity of interest, such as arm position or what the animal is looking at.",
    usedIn: ["/", "/research/cross-day-decoding"],
  },
  "disparity-gradient-detectors": {
    term: "Disparity-gradient detectors",
    definition: "Model neurons that each prefer a particular pattern of disparity across a strip of the visual field, such as the gradient produced by a surface tilted by a given amount.",
    usedIn: ["/research/3d-vision"],
  },
  "kalman-filter": {
    term: "Kalman filter",
    definition: "A decoder that combines what the neural activity says right now with a prediction of where the hand should be, given where it just was. It is widely used in brain–computer interfaces.",
    usedIn: ["/research/cross-day-decoding"],
  },
  "kilosort-4": {
    term: "Kilosort 4",
    definition: "An open-source spike-sorting algorithm that learns a template waveform for each neuron and matches it across channels and time. It is fast and reproducible but still needs checking.",
    usedIn: ["/research/spike-sorting"],
  },
  pca: {
    term: "PCA",
    definition: "Principal component analysis: finds the few combined activity patterns that capture most of the variation across many channels.",
    usedIn: ["/research/cross-day-decoding"],
  },
  "receptive-field": {
    term: "Receptive field",
    definition: "The patch of the visual field where a stimulus makes a neuron fire. A well-isolated visual neuron usually has a compact, clearly defined receptive field.",
    usedIn: ["/research/spike-sorting"],
  },
  residuals: {
    term: "Residuals",
    definition: "What remains of a measurement after subtracting everything a model predicts. If two areas' residuals still move together, something beyond the modelled factors links them.",
    usedIn: ["/research/shared-variability"],
  },
  "shared-variability": {
    term: "Shared variability",
    definition: "Trial-to-trial fluctuations that are correlated across neurons: when one fires a bit more than usual, the other tends to as well, beyond what the stimulus explains. Often called noise correlations.",
    usedIn: ["/research/shared-variability"],
  },
  "spike-sorting": {
    term: "Spike sorting",
    definition: "The process of detecting spikes in a recording and assigning each one to the neuron that most likely produced it, based on its shape across the recording channels.",
    usedIn: ["/research/spike-sorting"],
  },
  spikes: {
    term: "Spikes",
    definition: "Also called action potentials: a neuron's voltage jumps up and back down in about a millisecond, and the pulse travels to other neurons.",
    usedIn: ["/"],
  },
  "surface-normal": {
    term: "Surface normal",
    definition: "A vector pointing straight out of a surface. Lighting calculations use it to decide how bright each part of the surface should be.",
    usedIn: ["/research/3d-vision"],
  },
  tetrodes: {
    term: "Tetrodes",
    definition: "An electrode bundle of four closely spaced recording wires. A spike looks slightly different on each wire, which helps tell neighbouring neurons apart.",
    usedIn: ["/research/shared-variability", "/research/spike-sorting"],
  },
  tuning: {
    term: "Tuning",
    definition: "How a neuron's firing rate changes with some property of the world or the body. A neuron 'tuned' to rightward reaches fires most when the arm moves right.",
    usedIn: ["/"],
  },
  v3a: {
    term: "V3A",
    definition: "A visual area in the back of the brain that helps process three-dimensional structure, such as depth and surface orientation.",
    usedIn: ["/research/shared-variability"],
  },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryId = keyof typeof GLOSSARY;

/** Glossary entries in alphabetical order of their term. */
export function glossaryEntries(): (GlossaryEntry & { id: GlossaryId })[] {
  return (Object.keys(GLOSSARY) as GlossaryId[])
    .map((id) => ({ id, ...GLOSSARY[id] }))
    .sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" }));
}
