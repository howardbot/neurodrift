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
    usedIn: ["/research/3d-vision", "/learn/brain-map", "/learn/seeing-3d"],
  },
  "brain-computer-interface": {
    term: "Brain–computer interface",
    definition: "A system that records brain activity and translates it into commands for a computer cursor, robotic arm or other device.",
    usedIn: ["/research/cross-day-decoding", "/learn/electrodes", "/learn/brain-map", "/learn/sorting-methods", "/learn/family-tree", "/learn/decoders", "/learn/drift", "/learn/bcis-today"],
  },
  cca: {
    term: "CCA",
    definition: "Canonical correlation analysis: rotates two sets of signals so that their shared structure lines up as closely as possible.",
    usedIn: ["/research/cross-day-decoding", "/learn/drift"],
  },
  cip: {
    term: "CIP",
    definition: "Caudal intraparietal area: a region in parietal cortex, further along the visual pathway, involved in perceiving the 3D orientation of surfaces and linking vision to action.",
    usedIn: ["/research/shared-variability", "/learn/brain-map", "/learn/seeing-3d"],
  },
  decoder: {
    term: "Decoder",
    definition: "A mathematical model that maps recorded neural activity to a quantity of interest, such as arm position or what the animal is looking at.",
    usedIn: ["/", "/research/cross-day-decoding", "/learn/signal-chain", "/learn/sorting-methods", "/learn/decoders", "/learn/drift"],
  },
  "disparity-gradient-detectors": {
    term: "Disparity-gradient detectors",
    definition: "Model neurons that each prefer a particular pattern of disparity across a strip of the visual field, such as the gradient produced by a surface tilted by a given amount.",
    usedIn: ["/research/3d-vision"],
  },
  "kalman-filter": {
    term: "Kalman filter",
    definition: "A decoder that combines what the neural activity says right now with a prediction of where the hand should be, given where it just was. It is widely used in brain–computer interfaces.",
    usedIn: ["/research/cross-day-decoding", "/learn/decoders"],
  },
  "kilosort-4": {
    term: "Kilosort 4",
    definition: "An open-source spike-sorting algorithm that learns a template waveform for each neuron and matches it across channels and time. It is fast and reproducible but still needs checking.",
    usedIn: ["/research/spike-sorting", "/learn/sorting-methods"],
  },
  pca: {
    term: "PCA",
    definition: "Principal component analysis: finds the few combined activity patterns that capture most of the variation across many channels.",
    usedIn: ["/research/cross-day-decoding", "/learn/drift"],
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
    usedIn: ["/research/spike-sorting", "/learn/signal-chain", "/learn/sorting-methods"],
  },
  spikes: {
    term: "Spikes",
    definition: "Also called action potentials: a neuron's voltage jumps up and back down in about a millisecond, and the pulse travels to other neurons.",
    usedIn: ["/", "/learn/electrodes", "/learn/signal-chain"],
  },
  "surface-normal": {
    term: "Surface normal",
    definition: "A vector pointing straight out of a surface. Lighting calculations use it to decide how bright each part of the surface should be.",
    usedIn: ["/research/3d-vision"],
  },
  tetrodes: {
    term: "Tetrodes",
    definition: "An electrode bundle of four closely spaced recording wires. A spike looks slightly different on each wire, which helps tell neighbouring neurons apart.",
    usedIn: ["/research/shared-variability", "/research/spike-sorting", "/learn/electrodes", "/learn/sorting-methods"],
  },
  tuning: {
    term: "Tuning",
    definition: "How a neuron's firing rate changes with some property of the world or the body. A neuron 'tuned' to rightward reaches fires most when the arm moves right.",
    usedIn: ["/", "/learn/decoders"],
  },
  v3a: {
    term: "V3A",
    definition: "A visual area in the back of the brain that helps process three-dimensional structure, such as depth and surface orientation.",
    usedIn: ["/research/shared-variability", "/learn/brain-map", "/learn/seeing-3d"],
  },
  ecog: {
    term: "ECoG",
    definition: "Electrocorticography: a grid of disc electrodes laid directly on the surface of the brain, usually during epilepsy surgery. Sharper than EEG because the skull is out of the way.",
    usedIn: ["/learn/electrodes"],
  },
  eeg: {
    term: "EEG",
    definition: "Electroencephalography: electrodes on the scalp pick up the summed electrical activity of millions of neurons. Safe and painless, but blurry in space.",
    usedIn: ["/learn/electrodes"],
  },
  "local-field-potential": {
    term: "Local field potential",
    definition: "The slow part of the voltage recorded inside the brain, below a few hundred hertz. It mostly reflects the inputs arriving at many neurons near the electrode rather than individual spikes.",
    usedIn: ["/learn/electrodes", "/learn/signal-chain"],
  },
  neuropixels: {
    term: "Neuropixels",
    definition: "A silicon probe about as wide as a hair with hundreds to thousands of recording sites along its shank, used to record hundreds of neurons across brain regions at once.",
    usedIn: ["/learn/electrodes", "/learn/sorting-methods"],
  },
  "patch-clamp": {
    term: "Patch clamp",
    definition: "A glass pipette with a tip about a micrometre wide is sealed onto one neuron's membrane, so it can record the voltage inside that single cell, including inputs too small to trigger a spike.",
    usedIn: ["/learn/electrodes"],
  },
  "utah-array": {
    term: "Utah array",
    definition: "A 4 × 4 mm bed of 100 silicon needles, each 1–1.5 mm long, pressed into the cortex. It records spikes at 100 places at once and is the sensor in most human brain–computer interface trials.",
    usedIn: ["/learn/electrodes", "/learn/sorting-methods"],
  },
  "dorsal-stream": {
    term: "Dorsal stream",
    definition: "The 'where' or 'how' pathway: a chain of visual areas running from the back of the brain up into the parietal lobe, specialised for space, depth and guiding actions such as reaching.",
    usedIn: ["/learn/brain-map"],
  },
  sulcus: {
    term: "Sulcus",
    definition: "A groove in the folded surface of the brain (plural: sulci). Sulci such as the central sulcus serve as landmarks for finding brain areas; the ridges between them are called gyri.",
    usedIn: ["/learn/brain-map"],
  },
  "doctoral-advisor": {
    term: "Doctoral advisor",
    definition: "The professor who supervises a PhD student's research, usually for four to six years. Academic family trees are mostly built from these links.",
    usedIn: ["/learn/family-tree"],
  },
  postdoc: {
    term: "Postdoc",
    definition: "A postdoctoral researcher: someone who has finished a PhD and spends a few years in an established lab, learning new methods, before starting a lab of their own.",
    usedIn: ["/learn/family-tree"],
  },
  "threshold-crossings": {
    term: "Threshold crossings",
    definition: "Every moment the voltage on a channel dips past a set level, counted as a spike without working out which neuron fired it. Most clinical brain–computer interfaces decode from these.",
    usedIn: ["/learn/sorting-methods"],
  },
  "template-matching": {
    term: "Template matching",
    definition: "Spike sorting that learns each neuron's typical waveform across all the nearby channels (its template), then finds every place that template occurs in the recording, even where spikes overlap.",
    usedIn: ["/learn/sorting-methods"],
  },
  "electrode-drift": {
    term: "Electrode drift",
    definition: "Slow movement of an electrode relative to the brain tissue, over minutes to days. It changes how each neuron's spikes look on the channels, which can confuse spike sorting and decoders.",
    usedIn: ["/learn/sorting-methods", "/learn/drift"],
  },
  "neural-manifold": {
    term: "Neural manifold",
    definition: "The small set of coordinated activity patterns a large population of neurons actually uses, out of all the patterns it could in principle produce. Many neurons, few patterns.",
    usedIn: ["/learn/drift"],
  },
  "early-feasibility-study": {
    term: "Early feasibility study",
    definition: "A small first trial of a new medical device in people, usually under ten participants, to check that it is safe and works well enough to justify a larger trial.",
    usedIn: ["/learn/bcis-today"],
  },
  "pivotal-trial": {
    term: "Pivotal trial",
    definition: "The larger trial a regulator relies on to decide whether a medical device can be sold, with goals and measurements fixed in advance.",
    usedIn: ["/learn/bcis-today"],
  },
  "cochlear-implant": {
    term: "Cochlear implant",
    definition: "An implant that turns sound into electrical pulses delivered to the hearing nerve, giving a sense of sound to people with severe deafness. The most widely used neural implant.",
    usedIn: ["/learn/bcis-today"],
  },
  "deep-brain-stimulation": {
    term: "Deep brain stimulation",
    definition: "Electrodes placed deep in the brain that deliver steady electrical pulses, used mainly to reduce the tremor and stiffness of Parkinson's disease.",
    usedIn: ["/learn/bcis-today"],
  },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryId = keyof typeof GLOSSARY;

/** Glossary entries in alphabetical order of their term. */
export function glossaryEntries(): (GlossaryEntry & { id: GlossaryId })[] {
  return (Object.keys(GLOSSARY) as GlossaryId[])
    .map((id) => ({ id, ...GLOSSARY[id] }))
    .sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" }));
}
