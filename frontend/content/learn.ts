// Field guide content: general-knowledge pages under /learn. Facts here are textbook or
// from widely cited papers (named where a number comes from one); numbers are rounded and
// meant to convey orders of magnitude, not device specifications.

export type GuideGroup = "Recording" | "Decoding" | "The brain" | "The field";

export const GUIDE_GROUPS: { id: GuideGroup; blurb: string }[] = [
  { id: "Recording", blurb: "How we listen to neurons and turn their chatter into data." },
  { id: "Decoding", blurb: "How that data becomes a moving cursor, and why it stops working." },
  { id: "The brain", blurb: "Where my recordings come from, and what those areas do." },
  { id: "The field", blurb: "The people, the companies and the questions." },
];

export interface Guide {
  slug: string;
  title: string;
  short: string;
  hook: string;
  minutes: number;
  group: GuideGroup;
  /** Shown on the home page. */
  featured?: boolean;
}

export const GUIDES: Guide[] = [
  {
    slug: "electrodes",
    title: "Listening to the brain: a field guide to electrodes",
    short: "Electrodes",
    hook: "From a frog's leg in 1791 to probes with thousands of contacts: how we pick up the brain's electrical chatter, and what each kind of electrode can and cannot hear.",
    minutes: 8,
    group: "Recording",
    featured: true,
  },
  {
    slug: "signal-chain",
    title: "From a spike to a dataset",
    short: "Spike to dataset",
    hook: "A recording is just a wiggly voltage. Follow it through filtering, spike detection and sorting until it becomes the table of numbers a decoder reads.",
    minutes: 6,
    group: "Recording",
  },
  {
    slug: "sorting-methods",
    title: "Who said that? A short history of spike sorting",
    short: "Sorting methods",
    hook: "One electrode hears several neurons at once. From voltage windows set by hand to algorithms that sort thousands of channels: how researchers tell neurons apart, and how they choose a method today.",
    minutes: 8,
    group: "Recording",
  },
  {
    slug: "decoders",
    title: "Decoders 101: from spikes to a moving cursor",
    short: "Decoders 101",
    hook: "Move your pointer and three cursors chase it, each driven by the same simulated neurons through a different decoder: the population vector, a Kalman filter and a small neural network.",
    minutes: 7,
    group: "Decoding",
    featured: true,
  },
  {
    slug: "drift",
    title: "Why decoders break overnight",
    short: "Decoder drift",
    hook: "The neurons an implant hears change from day to day, so yesterday's decoder slowly fails. Watch it happen over a simulated month, then fix it by lining up the brain's activity patterns.",
    minutes: 6,
    group: "Decoding",
  },
  {
    slug: "brain-map",
    title: "Where in the brain?",
    short: "Brain map",
    hook: "Twenty-one areas on a real 3D brain you can turn: what each does, how signals travel from seeing to doing and from hearing to speaking, and where brain–computer interfaces record.",
    minutes: 10,
    group: "The brain",
  },
  {
    slug: "seeing-3d",
    title: "Seeing in 3D: two flat pictures, one deep world",
    short: "Seeing in 3D",
    hook: "Each eye sees a slightly different picture. Drag an object to see how the difference changes, then find a shape hidden in random dots that only both eyes together can see.",
    minutes: 6,
    group: "The brain",
    featured: true,
  },
  {
    slug: "bcis-today",
    title: "Brain–computer interfaces today",
    short: "BCIs today",
    hook: "Who is implanting what, where each device sits, how far along it is, and the ethical questions that come with reading the brain. Dated, sourced and recently checked.",
    minutes: 8,
    group: "The field",
  },
  {
    slug: "family-tree",
    title: "Who trained whom: a family tree of brain decoders",
    short: "Family tree",
    hook: "Science is passed down like a family trade. Trace who trained whom, from the Nobel laureates who discovered the synapse to the labs building brain–computer interfaces today, and see where I fit in.",
    minutes: 7,
    group: "The field",
  },
];

export function guideBySlug(slug: string): Guide {
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) throw new Error(`Unknown guide: ${slug}`);
  return g;
}

export type ElectrodeId = "eeg" | "ecog" | "stentrode" | "utah" | "tetrode" | "neuropixels" | "patch";

export type TraceKind = "eeg" | "ecog" | "stentrode" | "utah" | "tetrode" | "neuropixels" | "patch";

export interface ElectrodeType {
  id: ElectrodeId;
  name: string;
  where: string;
  hears: string;
  /** Rough order of magnitude of how many neurons contribute to one channel. */
  neurons: string;
  /** Position on a 0 (one cell) … 1 (millions) scale, for the "how many neurons" meter. */
  crowd: number;
  resolution: string;
  channels: string;
  invasiveness: "none" | "surgery on the surface" | "through a blood vessel" | "inside the tissue" | "inside one cell";
  since: string;
  uses: string;
  trace: TraceKind;
  traceLabel: string;
}

export const ELECTRODES: ElectrodeType[] = [
  {
    id: "eeg",
    name: "EEG",
    where: "Metal discs on the scalp, held by a cap or paste.",
    hears: "The summed activity of large patches of cortex firing in step. The skull smears the signal, so it is sharp in time but blurry in space.",
    neurons: "millions",
    crowd: 1,
    resolution: "centimetres",
    channels: "up to ~256",
    invasiveness: "none",
    since: "1924, Hans Berger",
    uses: "Sleep studies, epilepsy diagnosis, attention and cognition research, consumer headsets.",
    trace: "eeg",
    traceLabel: "Slow rhythms: the 10 Hz alpha wave of a relaxed brain",
  },
  {
    id: "ecog",
    name: "ECoG",
    where: "A soft grid of disc electrodes laid on the brain's surface, under the skull.",
    hears: "Like EEG without the skull in the way: sharper in space and richer in fast rhythms, but still the combined activity of many cells.",
    neurons: "hundreds of thousands",
    crowd: 0.82,
    resolution: "millimetres",
    channels: "tens to hundreds",
    invasiveness: "surgery on the surface",
    since: "1950s, epilepsy surgery",
    uses: "Locating seizure sources before surgery; speech and movement brain–computer interfaces.",
    trace: "ecog",
    traceLabel: "Faster rhythms riding on slower waves",
  },
  {
    id: "stentrode",
    name: "Stentrode",
    where: "A stent covered in electrodes, slid through a blood vessel until it lies next to motor cortex.",
    hears: "Signals similar to ECoG, picked up through the vessel wall. No open-brain surgery is needed.",
    neurons: "hundreds of thousands",
    crowd: 0.78,
    resolution: "millimetres",
    channels: "16",
    invasiveness: "through a blood vessel",
    since: "late 2010s, first human implants",
    uses: "Brain–computer interfaces that let people with paralysis text and browse.",
    trace: "stentrode",
    traceLabel: "Smooth population rhythms, similar to ECoG",
  },
  {
    id: "utah",
    name: "Utah array",
    where: "A 4 × 4 mm bed of 100 silicon needles, each 1–1.5 mm long, pressed into the cortex.",
    hears: "Spikes from the few neurons near each needle tip, plus the slower local field potential, at 100 places at once.",
    neurons: "a few per needle",
    crowd: 0.32,
    resolution: "~0.1 mm per needle, 0.4 mm apart",
    channels: "100",
    invasiveness: "inside the tissue",
    since: "early 1990s, University of Utah",
    uses: "Most human brain–computer interface trials to date; primate motor and visual research.",
    trace: "utah",
    traceLabel: "Spikes from nearby neurons on top of the local field potential",
  },
  {
    id: "tetrode",
    name: "Tetrode",
    where: "Four hair-thin wires twisted together, lowered into the brain.",
    hears: "Spikes from neurons within about a tenth of a millimetre. Each spike looks slightly different on the four wires, which helps tell neighbours apart.",
    neurons: "a handful per tetrode",
    crowd: 0.18,
    resolution: "tens of micrometres",
    channels: "4 per tetrode, often many tetrodes",
    invasiveness: "inside the tissue",
    since: "1983 (stereotrode), tetrodes by the early 1990s",
    uses: "Place cells in the hippocampus; the CIP and V3A recordings in my projects.",
    trace: "tetrode",
    traceLabel: "The same spikes seen on four neighbouring wires",
  },
  {
    id: "neuropixels",
    name: "Neuropixels",
    where: "A silicon shank about as wide as a hair and 10 mm long, with recording sites all along it.",
    hears: "Spikes from hundreds of neurons across many brain layers or regions in a single insertion.",
    neurons: "hundreds per probe",
    crowd: 0.22,
    resolution: "~20 µm between sites",
    channels: "960 sites, 384 recorded at once (1.0)",
    invasiveness: "inside the tissue",
    since: "2017",
    uses: "Large-scale recordings across the mouse brain; increasingly in primates and people during surgery.",
    trace: "neuropixels",
    traceLabel: "One spike spreading across neighbouring sites along the shank",
  },
  {
    id: "patch",
    name: "Patch pipette",
    where: "A glass pipette with a tip about a micrometre wide, sealed onto one neuron's membrane.",
    hears: "The voltage inside a single cell, including the small inputs that never become a spike.",
    neurons: "exactly one",
    crowd: 0,
    resolution: "one cell",
    channels: "1",
    invasiveness: "inside one cell",
    since: "1976, Neher & Sakmann",
    uses: "How single neurons and ion channels work; Nobel Prize 1991.",
    trace: "patch",
    traceLabel: "Membrane voltage: small bumps, and full spikes when it crosses threshold",
  },
];

export interface TimelineEvent {
  year: string;
  title: string;
  body: string;
}

export const TIMELINE: TimelineEvent[] = [
  { year: "1791", title: "Animal electricity", body: "Luigi Galvani makes frog legs twitch with electricity and argues that nerves carry an electrical signal." },
  { year: "1875", title: "The brain's own currents", body: "Richard Caton records electrical activity from the exposed brains of rabbits and monkeys." },
  { year: "1924", title: "The first human EEG", body: "Hans Berger records brain waves through the human scalp and names the alpha rhythm (published 1929)." },
  { year: "1926", title: "One fibre at a time", body: "Edgar Adrian records the impulses of single sensory nerve fibres, showing that stronger stimuli mean more spikes, not bigger ones." },
  { year: "1939", title: "Inside an axon", body: "Alan Hodgkin and Andrew Huxley slide a fine salt-filled glass capillary inside the giant axon of a squid and record a full action potential from within." },
  { year: "1949", title: "Glass micropipettes", body: "Gilbert Ling and Ralph Gerard pull glass into tips fine enough to pierce a single cell without killing it." },
  { year: "1950s", title: "Electrodes on the brain's surface", body: "Neurosurgeons such as Wilder Penfield and Herbert Jasper record and stimulate the exposed cortex during epilepsy surgery: the start of ECoG." },
  { year: "1957", title: "The tungsten microelectrode", body: "David Hubel's sharpened, insulated tungsten wire records single neurons for hours, leading to the discovery of orientation-tuned cells in visual cortex." },
  { year: "1970", title: "Electrodes on a chip", body: "Kensall Wise and colleagues build a silicon microelectrode with integrated-circuit methods: the ancestor of today's silicon probes." },
  { year: "1976", title: "The patch clamp", body: "Erwin Neher and Bert Sakmann seal a glass pipette onto a membrane and record single ion channels opening and closing." },
  { year: "1983", title: "Two wires, then four", body: "The stereotrode, then the tetrode: several wires close together let researchers tell neighbouring neurons apart by how their spikes differ across wires." },
  { year: "1990s", title: "The Utah array", body: "Richard Normann's group micromachines a bed of 100 silicon needles that records from 100 cortical sites at once." },
  { year: "2006", title: "Thought to cursor", body: "In the BrainGate trial, a man with tetraplegia moves a computer cursor using a Utah array in his motor cortex." },
  { year: "2017", title: "Neuropixels", body: "A probe with 960 recording sites along a 10 mm shank records hundreds of neurons across brain regions in one insertion." },
  { year: "2019", title: "Threads and stents", body: "Flexible polymer threads inserted by a robot, and electrode-covered stents delivered through blood vessels, show new routes into the brain." },
  { year: "2021", title: "Neuropixels 2.0", body: "Four shanks and 5,120 sites on a smaller probe, built to record the same neurons stably for weeks." },
];

export interface DevicePoint {
  year: number;
  label: string;
  sites: number;
  /** Channels recordable at the same time, when fewer than the sites. */
  simultaneous?: number;
}

// Recording contacts on one device. Neuralink figure from its 2019 white paper (in rats).
export const DEVICE_POINTS: DevicePoint[] = [
  { year: 1957, label: "Tungsten microelectrode", sites: 1 },
  { year: 1983, label: "Stereotrode", sites: 2 },
  { year: 1993, label: "Tetrode", sites: 4 },
  { year: 1992, label: "Utah array", sites: 100 },
  { year: 2017, label: "Neuropixels 1.0", sites: 960, simultaneous: 384 },
  { year: 2019, label: "Neuralink threads", sites: 3072 },
  { year: 2021, label: "Neuropixels 2.0", sites: 5120, simultaneous: 384 },
];

/** Stevenson & Kording (2011): simultaneously recorded neurons double roughly every 7 years. */
export const DOUBLING_YEARS = 7;

// ---------------------------------------------------------------------------------------
// Brain map (/learn/brain-map)
// ---------------------------------------------------------------------------------------

export type AreaGroup = "Vision" | "Movement & touch" | "Language & hearing" | "Planning" | "Deep structures";

export const AREA_GROUPS: AreaGroup[] = ["Vision", "Movement & touch", "Language & hearing", "Planning", "Deep structures"];

export type AreaId =
  | "v1"
  | "v3a"
  | "mt"
  | "it"
  | "cip"
  | "ppc"
  | "pmd"
  | "m1"
  | "s1"
  | "cerebellum"
  | "a1"
  | "wernicke"
  | "smg"
  | "broca"
  | "speech"
  | "pfc"
  | "fef"
  | "thalamus"
  | "basal-ganglia"
  | "hippocampus"
  | "amygdala";

export type RouteId = "action" | "what" | "language";

/** Routes a signal takes across the brain map, as the areas it passes through. */
export const BRAIN_ROUTES: { id: RouteId; label: string; steps: AreaId[] }[] = [
  { id: "action", label: "Seeing to doing", steps: ["v1", "v3a", "cip", "pmd", "m1"] },
  { id: "what", label: "Seeing to knowing what", steps: ["v1", "it"] },
  { id: "language", label: "Hearing to speaking", steps: ["a1", "wernicke", "broca", "speech"] },
];

export interface BrainArea {
  id: AreaId;
  short: string;
  /** Shorter label on the map, when `short` is too long. */
  mapLabel?: string;
  name: string;
  group: AreaGroup;
  where: string;
  does: string;
  fact: string;
  /** Research stories that record from this area (slugs in content/research.ts). */
  projects: string[];
  /** Where on the schematic (viewBox 600 × 410): label anchor. */
  label: [number, number];
}

// Plain-language summaries of textbook knowledge. Positions on the map are schematic. Areas in
// "Deep structures" lie beneath the cortex and are drawn where they would sit under the surface.
export const BRAIN_AREAS: BrainArea[] = [
  {
    id: "v1",
    short: "V1",
    name: "Primary visual cortex",
    group: "Vision",
    where: "At the very back of the brain.",
    does: "The first stop in the cortex for signals from the eyes. Each neuron watches a small patch of the visual field and responds best to edges at a particular angle; many also compare the two eyes' views, the first step towards depth.",
    fact: "David Hubel and Torsten Wiesel discovered these edge-detecting cells with tungsten microelectrodes in the late 1950s, work recognised with the 1981 Nobel Prize.",
    projects: [],
    label: [588, 236],
  },
  {
    id: "v3a",
    short: "V3A",
    name: "Visual area V3A",
    group: "Vision",
    where: "Just in front of V1, near the top of the back of the brain.",
    does: "Part of the visual pathway that deals with space. Its neurons care about the 3D layout of a scene — how far things are and which way surfaces face — partly by comparing the images from the two eyes.",
    fact: "Much of V3A lies hidden inside folds of the cortex, so experimenters usually rely on brain scans to aim electrodes at it.",
    projects: ["shared-variability", "3d-vision"],
    label: [534, 94],
  },
  {
    id: "mt",
    short: "MT",
    name: "Middle temporal area (MT, or V5)",
    group: "Vision",
    where: "Where the occipital and temporal lobes meet; in monkeys it lies inside the superior temporal sulcus.",
    does: "Specialised for motion. Most of its neurons respond best to movement in one direction at a preferred speed, whatever the moving object looks like.",
    fact: "In 1990 William Newsome's lab passed tiny currents through small clusters of MT neurons and changed which way monkeys reported a pattern of dots was moving: stimulating neurons can change what is perceived.",
    projects: [],
    label: [478, 226],
  },
  {
    id: "it",
    short: "IT",
    name: "Inferior temporal cortex",
    group: "Vision",
    where: "Along the lower side of the temporal lobe.",
    does: "The end of the “what” route: recognising objects and faces, whatever their size, position or lighting.",
    fact: "Charles Gross found neurons here in the 1970s that responded best to hands and faces. In 2006 Doris Tsao and colleagues found patches in monkey IT where almost every neuron prefers faces.",
    projects: [],
    label: [368, 292],
  },
  {
    id: "cip",
    short: "CIP",
    name: "Caudal intraparietal area",
    group: "Vision",
    where: "At the back end of the intraparietal sulcus, a deep groove in the parietal lobe.",
    does: "Combines depth cues into the 3D orientation of surfaces: whether a plane tilts towards you or away, left or right. It sits where seeing a surface turns into using it, for example to reach for it or look at it.",
    fact: "Neurons here can signal a surface's tilt from different cues, such as the difference between the two eyes' images or the texture on the surface.",
    projects: ["shared-variability", "3d-vision"],
    label: [470, 36],
  },
  {
    id: "ppc",
    short: "PPC",
    name: "Posterior parietal cortex: reach and grasp",
    group: "Movement & touch",
    where: "The upper parietal lobe, in front of CIP, around the intraparietal sulcus.",
    does: "Turns where things are into plans to act on them: where to reach (area 5d and its neighbours) and how to shape the hand to grasp (the anterior intraparietal area, AIP). Its activity reflects the goal of a movement more than the muscles that make it.",
    fact: "Damage here can cause optic ataxia: people see an object perfectly well but reach for it in the wrong place.",
    projects: [],
    label: [400, 86],
  },
  {
    id: "pmd",
    short: "PMd",
    name: "Dorsal premotor cortex",
    group: "Movement & touch",
    where: "Near the top of the brain, just in front of the primary motor cortex.",
    does: "Helps plan movements. Its activity changes while an animal prepares to reach, often well before the arm starts to move.",
    fact: "Because it carries plans, not just commands, some brain–computer interfaces record here as well as in the primary motor cortex.",
    projects: [],
    label: [254, 98],
  },
  {
    id: "m1",
    short: "M1",
    name: "Primary motor cortex",
    group: "Movement & touch",
    where: "A strip just in front of the central sulcus. Shown here is its upper part, for the legs, arms and hands; the face and mouth part is the speech motor cortex.",
    does: "Sends commands down the spinal cord to move the body, with different parts of the strip controlling different body parts. Many of its neurons fire most for movements in one preferred direction — the idea behind the decoding demo on the home page.",
    fact: "In the 1980s Apostolos Georgopoulos showed that adding up many motor-cortex neurons' preferred directions, each weighted by its activity, predicts the direction of the arm's movement: the population vector.",
    projects: ["cross-day-decoding"],
    label: [316, 22],
  },
  {
    id: "s1",
    short: "S1",
    name: "Primary somatosensory cortex",
    group: "Movement & touch",
    where: "A strip just behind the central sulcus, alongside M1.",
    does: "Receives touch, pressure, vibration and the sense of where your limbs are. Like M1 it holds a map of the body, in which the hands and lips take up far more space than the back or legs.",
    fact: "Wilder Penfield mapped it from the 1930s by gently stimulating the exposed cortex of awake patients during epilepsy surgery and asking what they felt. Drawn to scale, the result is the famous homunculus, with huge hands and lips.",
    projects: [],
    label: [354, 22],
  },
  {
    id: "cerebellum",
    short: "Cerebellum",
    name: "Cerebellum",
    group: "Movement & touch",
    where: "Tucked under the back of the brain, behind the brainstem.",
    does: "Coordinates and times movements, and keeps them accurate by comparing what you meant to do with what actually happened. It also helps learn new motor skills.",
    fact: "It holds about 69 of the brain's 86 billion neurons, roughly four in five, in about a tenth of its mass (Azevedo et al., 2009).",
    projects: [],
    label: [506, 316],
  },
  {
    id: "a1",
    short: "A1",
    name: "Primary auditory cortex",
    group: "Language & hearing",
    where: "On the upper surface of the temporal lobe, mostly hidden inside the lateral fissure (Heschl's gyrus).",
    does: "The first stop in the cortex for sound. Its neurons are laid out by pitch, from low to high, like the keys of a piano: a tonotopic map.",
    fact: "Cochlear implants, the most widely used neural prosthesis, stimulate the auditory nerve rather than the cortex, and the auditory cortex learns to make sense of their coarse signal.",
    projects: [],
    label: [330, 239],
  },
  {
    id: "wernicke",
    short: "Wernicke",
    name: "Wernicke's area",
    group: "Language & hearing",
    where: "The back of the superior temporal gyrus, usually on the left.",
    does: "Helps understand spoken and written language: matching the sounds of words to their meaning.",
    fact: "In 1874 Carl Wernicke described patients with damage here who spoke fluently but with little meaning, and struggled to understand others.",
    projects: [],
    label: [404, 231],
  },
  {
    id: "smg",
    short: "SMG",
    name: "Supramarginal gyrus",
    group: "Language & hearing",
    where: "The lower parietal lobe, curving around the back end of the lateral fissure.",
    does: "Handles the sounds of words, for example keeping a phone number in mind by repeating it silently, and helps plan skilled actions such as using a tool.",
    fact: "Damage on the left side can cause apraxia: trouble making skilled movements on request, such as miming the use of a toothbrush, despite normal strength.",
    projects: [],
    label: [392, 172],
  },
  {
    id: "broca",
    short: "Broca",
    name: "Broca's area",
    group: "Language & hearing",
    where: "The lower frontal lobe (inferior frontal gyrus, areas 44 and 45), usually on the left.",
    does: "Part of the network for producing language and handling grammar. Its exact role is still debated.",
    fact: "Named after Paul Broca, who in 1861 described a patient who understood speech but could say only one syllable, “tan”, and found damage here after his death.",
    projects: [],
    label: [185, 226],
  },
  {
    id: "speech",
    short: "Speech motor",
    mapLabel: "Speech",
    name: "Speech motor cortex",
    group: "Language & hearing",
    where: "The lower end of the motor strip and the premotor cortex just in front of it (ventral precentral gyrus, including area 6v), just above the lateral fissure.",
    does: "Controls the lips, jaw, tongue and larynx. Speaking is one of the most complex movements we make, using about a hundred muscles.",
    fact: "Years after people lose the ability to speak, through ALS or a brainstem stroke, this area still becomes active when they try to: the signal speech BCIs decode.",
    projects: [],
    label: [254, 222],
  },
  {
    id: "pfc",
    short: "PFC",
    name: "Prefrontal cortex",
    group: "Planning",
    where: "The front of the frontal lobe.",
    does: "Holds information in mind, follows rules and goals, and plans ahead: the brain's working memory and executive control.",
    fact: "In 1989 Patricia Goldman-Rakic's lab showed that prefrontal neurons keep firing while a monkey remembers a location during a delay, a neural trace of working memory.",
    projects: [],
    label: [142, 144],
  },
  {
    id: "fef",
    short: "FEF",
    name: "Frontal eye field",
    group: "Planning",
    where: "In front of the premotor cortex, where two grooves (the superior frontal and precentral sulci) meet.",
    does: "Moves the eyes and directs attention to a place in the visual field.",
    fact: "A tiny current here makes the eyes jump to a particular point. In the early 2000s Tirin Moore showed that currents too weak to move the eyes still sharpen attention at that point.",
    projects: [],
    label: [210, 138],
  },
  {
    id: "thalamus",
    short: "Thalamus",
    name: "Thalamus",
    group: "Deep structures",
    where: "Deep in the middle of the brain, above the brainstem.",
    does: "A relay hub: nearly every sense except smell passes through it on the way to the cortex, and it loops with the cortex and basal ganglia to shape movement and attention.",
    fact: "Deep brain stimulation of one of its nuclei is an established treatment for essential tremor.",
    projects: [],
    label: [356, 196],
  },
  {
    id: "basal-ganglia",
    short: "Basal ganglia",
    name: "Basal ganglia",
    group: "Deep structures",
    where: "Deep beneath the cortex, beside the thalamus.",
    does: "Help select which movement to make and hold back the others, and take part in habits and reward learning.",
    fact: "Parkinson's disease kills the dopamine neurons that feed them. Deep brain stimulation of one of these nuclei, the subthalamic nucleus, has eased its symptoms since the 1990s.",
    projects: [],
    label: [280, 200],
  },
  {
    id: "hippocampus",
    short: "Hippocampus",
    name: "Hippocampus",
    group: "Deep structures",
    where: "Curled inside the temporal lobe, on its inner side.",
    does: "Forms new memories of events and places. Some of its neurons, place cells, fire when an animal is in one particular spot.",
    fact: "After surgery in 1953 removed much of the hippocampus on both sides to treat his epilepsy, the patient H.M. could no longer form new lasting memories of events, although older memories remained and he could still learn new motor skills.",
    projects: [],
    label: [350, 282],
  },
  {
    id: "amygdala",
    short: "Amygdala",
    name: "Amygdala",
    group: "Deep structures",
    where: "In front of the hippocampus, deep in the temporal lobe.",
    does: "Flags what is threatening or important, drives emotional reactions, and strengthens memories of emotional events.",
    fact: "S.M., a woman with damage to both amygdalae, has been studied for decades because she shows strikingly little fear.",
    projects: [],
    label: [266, 290],
  },
];

export interface Species {
  id: "human" | "macaque" | "marmoset";
  name: string;
  /** Typical adult brain mass, grams (rounded). */
  grams: number;
  /** Neurons in the whole brain (Azevedo et al. 2009; Herculano-Houzel et al. 2007). */
  neurons: string;
  neuronsUnit: string;
  folds: string;
  note: string;
}

export const SPECIES: Species[] = [
  {
    id: "human",
    name: "Human",
    grams: 1350,
    neurons: "86",
    neuronsUnit: "billion neurons",
    folds: "Deeply folded",
    note: "Most areas have a counterpart in monkeys, which is why monkey recordings teach us about our own brains.",
  },
  {
    id: "macaque",
    name: "Rhesus macaque",
    grams: 90,
    neurons: "6.4",
    neuronsUnit: "billion neurons",
    folds: "Folded",
    note: "The classic animal for studies of vision, including the surface-orientation experiments that V3A and CIP are best known from.",
  },
  {
    id: "marmoset",
    name: "Common marmoset",
    grams: 8,
    neurons: "0.6",
    neuronsUnit: "billion neurons",
    folds: "Almost smooth",
    note: "With few folds, most of the motor cortex lies on the surface, where an electrode array can reach it. The cross-day decoding recordings are from marmosets.",
  },
];

// ---------------------------------------------------------------------------------------
// Family tree (/learn/family-tree)
// ---------------------------------------------------------------------------------------

export type TreeTheme = "movement" | "computation" | "senses" | "cells";

export const TREE_THEMES: { id: TreeTheme; label: string }[] = [
  { id: "movement", label: "Movement & BCIs" },
  { id: "computation", label: "Theory & computation" },
  { id: "senses", label: "Vision & the senses" },
  { id: "cells", label: "Cells, circuits & devices" },
];

export interface TreePerson {
  id: string;
  name: string;
  /** Label on the tree (usually the surname). */
  short: string;
  theme: TreeTheme | "you";
  life?: string;
  where: string;
  knownFor: string;
  honour?: string;
  /** Layout: era row (TREE_ERAS index) and horizontal centre in the 1100-wide drawing. */
  row: number;
  x: number;
}

/** Rows of the tree: roughly when the people in each row trained. */
export const TREE_ERAS = ["1880s", "1920s", "1930s–40s", "1950s–60s", "1970s", "1980s", "1990s", "2000s", "2010s–now"];

// A small, simplified slice of a very large family. Each link was checked against a CV,
// university or lab page, an obituary or memoir, Wikipedia, Neurotree or the Mathematics
// Genealogy Project. People with no parent here had mentors too; they are just off the map.
export const TREE_PEOPLE: TreePerson[] = [
  { id: "sherrington", name: "Charles Sherrington", short: "Sherrington", theme: "cells", life: "1857–1952", where: "Liverpool and Oxford", knownFor: "Showed how reflexes are built from neurons talking to each other, and named the junction between them: the synapse.", honour: "Nobel Prize 1932", row: 0, x: 225 },
  { id: "eccles", name: "John Eccles", short: "Eccles", theme: "cells", life: "1903–1997", where: "Sydney, Dunedin and Canberra", knownFor: "Recorded from inside neurons in the spinal cord to show how synapses excite or inhibit the next cell.", honour: "Nobel Prize 1963", row: 1, x: 225 },
  { id: "bard", name: "Philip Bard", short: "Bard", theme: "cells", life: "1898–1977", where: "Johns Hopkins", knownFor: "Studied how the brain produces emotion (the Cannon–Bard theory) and built the Johns Hopkins physiology department where Mountcastle trained.", row: 1, x: 600 },
  { id: "kuffler", name: "Stephen Kuffler", short: "Kuffler", theme: "senses", life: "1913–1980", where: "Johns Hopkins, then Harvard", knownFor: "Discovered that retinal cells respond to a spot of light surrounded by darkness (or the reverse), and founded Harvard's neurobiology department.", row: 2, x: 225 },
  { id: "mountcastle", name: "Vernon Mountcastle", short: "Mountcastle", theme: "senses", life: "1918–2015", where: "Johns Hopkins", knownFor: "Discovered that the cortex is organised in columns of neurons sharing a job, and pioneered recording from awake, behaving monkeys.", row: 2, x: 600 },
  { id: "rose", name: "Jerzy Rose", short: "Rose", theme: "senses", where: "Johns Hopkins, then UW–Madison", knownFor: "Mapped how the auditory nerve and brain encode the pitch and timing of sounds, much of it at the University of Wisconsin–Madison.", row: 2, x: 700 },
  { id: "hubel", name: "David Hubel", short: "Hubel", theme: "senses", life: "1926–2013", where: "Johns Hopkins, then Harvard", knownFor: "Found, with Torsten Wiesel, that neurons in visual cortex respond to edges at particular angles. He also built the tungsten microelectrode they used.", honour: "Nobel Prize 1981", row: 3, x: 300 },
  { id: "wiesel", name: "Torsten Wiesel", short: "Wiesel", theme: "senses", where: "Johns Hopkins, Harvard, then Rockefeller", knownFor: "Worked with David Hubel for over twenty years on how visual cortex is organised and how early experience shapes it.", honour: "Nobel Prize 1981", row: 3, x: 175 },
  { id: "hopfield", name: "John Hopfield", short: "Hopfield", theme: "computation", where: "Caltech and Princeton", knownFor: "A physicist who showed in 1982 that a network of simple model neurons can store memories as the low points of an energy landscape: the Hopfield network.", honour: "Nobel Prize in Physics 2024", row: 3, x: 525 },
  { id: "rumelhart", name: "David Rumelhart", short: "Rumelhart", theme: "computation", life: "1942–2011", where: "UC San Diego, then Stanford", knownFor: "Co-led the 'parallel distributed processing' movement and, with Geoffrey Hinton and Ronald Williams, showed in 1986 how networks learn by backpropagation.", row: 3, x: 400 },
  { id: "merzenich", name: "Michael Merzenich", short: "Merzenich", theme: "senses", where: "UC San Francisco", knownFor: "Showed that the brain's maps of the body and of sound are redrawn by experience, and helped develop the cochlear implant.", honour: "Kavli Prize 2016", row: 3, x: 700 },
  { id: "ebner", name: "Ford Ebner", short: "Ebner", theme: "senses", where: "Brown, then Vanderbilt", knownFor: "Studied how the touch map in cortex is wired and how it changes with experience.", row: 3, x: 925 },
  { id: "burrows", name: "Malcolm Burrows", short: "Burrows", theme: "cells", where: "Cambridge", knownFor: "Worked out the neurons that control insect legs, and how locusts and froghoppers make their record-breaking jumps.", row: 3, x: 1025 },
  { id: "sejnowski", name: "Terry Sejnowski", short: "Sejnowski", theme: "computation", where: "Salk Institute", knownFor: "Invented the Boltzmann machine with Geoffrey Hinton and co-wrote The Computational Brain; a founder of computational neuroscience as a field.", row: 4, x: 250 },
  { id: "hinton", name: "Geoffrey Hinton", short: "Hinton", theme: "computation", where: "Toronto", knownFor: "A founder of deep learning: backpropagation, Boltzmann machines and the networks behind modern AI.", honour: "Nobel Prize in Physics 2024", row: 4, x: 150 },
  { id: "georgopoulos", name: "Apostolos Georgopoulos", short: "Georgopoulos", theme: "movement", where: "Johns Hopkins, then Minnesota", knownFor: "Showed that adding up motor-cortex neurons' preferred directions predicts where the arm will move: the population vector behind many brain–computer interfaces.", row: 4, x: 600 },
  { id: "lisberger", name: "Stephen Lisberger", short: "Lisberger", theme: "movement", where: "UC San Francisco, then Duke", knownFor: "Uses the eyes' smooth tracking of moving targets to study how the brain controls and learns movements.", row: 4, x: 475 },
  { id: "adelson", name: "Edward Adelson", short: "Adelson", theme: "senses", where: "MIT", knownFor: "Modelled how the brain senses motion, created the famous checker-shadow illusion, and co-invented the GelSight touch sensor for robots.", row: 4, x: 775 },
  { id: "donoghue", name: "John Donoghue", short: "Donoghue", theme: "movement", where: "Brown", knownFor: "Led BrainGate, whose 2006 study let a man with paralysis move a cursor with a Utah array in his motor cortex, and co-founded Cyberkinetics.", row: 4, x: 950 },
  { id: "spira", name: "Micha Spira", short: "Spira", theme: "cells", where: "Hebrew University of Jerusalem", knownFor: "Builds interfaces between neurons and electronics, such as gold mushroom-shaped electrodes that cells wrap around.", row: 4, x: 1100 },
  { id: "chapin", name: "John Chapin", short: "Chapin", theme: "movement", where: "SUNY Downstate", knownFor: "In 1999, with Miguel Nicolelis, showed rats moving a robotic lever directly with neural activity.", row: 4, x: 50 },
  { id: "jordan", name: "Michael I. Jordan", short: "Jordan", theme: "computation", where: "UC Berkeley", knownFor: "A leading figure in machine learning and statistics, who began with models of how the brain learns and controls movement.", row: 5, x: 400 },
  { id: "schwartz", name: "Andrew Schwartz", short: "Schwartz", theme: "movement", where: "University of Pittsburgh", knownFor: "His lab let monkeys feed themselves with a robotic arm (2008), and then people with paralysis control robotic arms.", row: 5, x: 600 },
  { id: "andersen", name: "Richard Andersen", short: "Andersen", theme: "movement", where: "Caltech", knownFor: "Showed that parietal cortex holds plans and intentions, not just sensations, and built brain–computer interfaces that read them.", row: 5, x: 700 },
  { id: "angelaki", name: "Dora Angelaki", short: "Angelaki", theme: "senses", where: "WashU, Baylor, then NYU", knownFor: "Studies how the brain combines balance, vision and other senses to tell where we are heading.", row: 5, x: 825 },
  { id: "laurent", name: "Gilles Laurent", short: "Laurent", theme: "cells", where: "Caltech, then Max Planck Institute for Brain Research", knownFor: "Studies how brain circuits compute: smell in locusts, sleep in lizards, camouflage in cuttlefish.", row: 5, x: 1000 },
  { id: "nicolelis", name: "Miguel Nicolelis", short: "Nicolelis", theme: "movement", where: "Duke", knownFor: "Recorded from many neurons at once to drive robot arms, and led the brain-controlled exoskeleton that kicked off the 2014 World Cup.", row: 6, x: 50 },
  { id: "dayan", name: "Peter Dayan", short: "Dayan", theme: "computation", where: "Gatsby Unit (UCL), then Max Planck Tübingen", knownFor: "Linked dopamine to the 'prediction errors' of reinforcement learning, and co-wrote the textbook Theoretical Neuroscience.", honour: "The Brain Prize 2017", row: 6, x: 225 },
  { id: "wolpert", name: "Daniel Wolpert", short: "Wolpert", theme: "movement", where: "Cambridge, then Columbia", knownFor: "Showed how the brain predicts the results of its own movements with internal models, and argues the brain exists to produce movement.", row: 6, x: 400 },
  { id: "sahani", name: "Maneesh Sahani", short: "Sahani", theme: "computation", where: "Gatsby Unit, UCL", knownFor: "Builds statistical models that find the hidden structure in recordings from many neurons.", row: 6, x: 550 },
  { id: "shenoy", name: "Krishna Shenoy", short: "Shenoy", theme: "movement", where: "Stanford", knownFor: "Built some of the fastest brain–computer interfaces and showed motor cortex works as a dynamical system. He died in 2023.", row: 6, x: 650 },
  { id: "simoncelli", name: "Eero Simoncelli", short: "Simoncelli", theme: "computation", where: "NYU", knownFor: "Studies how the visual system is tuned to the statistics of natural images; co-created SSIM, a measure of image quality used across the video industry.", row: 6, x: 750 },
  { id: "hatsopoulos", name: "Nicholas Hatsopoulos", short: "Hatsopoulos", theme: "movement", where: "University of Chicago", knownFor: "Studies how motor cortex plans and controls movement, including waves of activity that sweep across it; co-founded Cyberkinetics, which developed BrainGate.", row: 6, x: 925 },
  { id: "jasanoff", name: "Alan Jasanoff", short: "Jasanoff", theme: "cells", where: "MIT", knownFor: "Designs molecular sensors that make brain chemistry and activity visible in MRI scans.", row: 6, x: 1025 },
  { id: "carmena", name: "Jose Carmena", short: "Carmena", theme: "movement", where: "UC Berkeley", knownFor: "Showed monkeys reaching and grasping with a robot arm (2003), then studied how brains learn to control a BMI like a new limb.", row: 7, x: 50 },
  { id: "kording", name: "Konrad Kording", short: "Kording", theme: "computation", where: "University of Pennsylvania", knownFor: "Showed that people combine sensory evidence and prior expectation almost optimally; also found that recorded neuron counts double about every seven years.", row: 7, x: 400 },
  { id: "churchland", name: "Mark Churchland", short: "Churchland", theme: "movement", where: "Columbia", knownFor: "Showed that motor-cortex activity during reaching rotates through a few patterns, like a dynamical system, not a list of commands.", row: 7, x: 500 },
  { id: "yu", name: "Byron Yu", short: "Yu", theme: "computation", where: "Carnegie Mellon", knownFor: "Develops methods (such as GPFA) that summarise many neurons by a few hidden signals, and uses BCIs to study how brains learn.", row: 7, x: 600 },
  { id: "paninski", name: "Liam Paninski", short: "Paninski", theme: "computation", where: "Columbia", knownFor: "Develops statistical tools for decoding spike trains and analysing huge recordings; a co-founder of the International Brain Laboratory.", row: 7, x: 775 },
  { id: "rosenberg", name: "Ari Rosenberg", short: "Rosenberg", theme: "senses", where: "UW–Madison", knownFor: "Studies how the brain builds a 3D world from flat images on the eyes, including how CIP and V3A encode the tilt of surfaces.", row: 7, x: 875 },
  { id: "hai", name: "Aviad Hai", short: "Hai", theme: "cells", where: "UW–Madison", knownFor: "Builds miniature, wireless sensors that report neural activity to an MRI scanner or radio receiver, without wires through the skull.", row: 7, x: 1075 },
  { id: "ganguly", name: "Karunesh Ganguly", short: "Ganguly", theme: "movement", where: "UC San Francisco", knownFor: "Studies how brains learn to use BCIs, the role of sleep in that learning, and recovery after stroke.", row: 8, x: 50 },
  { id: "orsborn", name: "Amy Orsborn", short: "Orsborn", theme: "movement", where: "University of Washington", knownFor: "Designs BCIs that adapt to the brain while the brain adapts to them.", row: 8, x: 150 },
  { id: "qin", name: "Qin Liu", short: "Me", theme: "you", where: "UW–Madison", knownFor: "An undergraduate researcher decoding movement from marmoset motor cortex, studying 3D vision in primates, and analysing recordings from miniature neural devices.", row: 8, x: 950 },
];

export type TreeLinkKind = "phd" | "postdoc" | "research";

export const TREE_LINK_LABEL: Record<TreeLinkKind, string> = {
  phd: "PhD",
  postdoc: "Postdoc",
  research: "Research training",
};

export interface TreeLink {
  from: string;
  to: string;
  kind: TreeLinkKind;
  /** Where and when, in a few words. */
  when: string;
}

export const TREE_LINKS: TreeLink[] = [
  { from: "sherrington", to: "eccles", kind: "phd", when: "Oxford, 1929" },
  { from: "eccles", to: "kuffler", kind: "postdoc", when: "Sydney, late 1930s" },
  { from: "kuffler", to: "wiesel", kind: "postdoc", when: "Johns Hopkins, 1955" },
  { from: "kuffler", to: "hubel", kind: "postdoc", when: "Johns Hopkins, 1958" },
  { from: "kuffler", to: "sejnowski", kind: "postdoc", when: "Harvard, 1979–81" },
  { from: "hopfield", to: "sejnowski", kind: "phd", when: "Princeton, 1978" },
  { from: "sejnowski", to: "dayan", kind: "postdoc", when: "Salk Institute, 1991–93" },
  { from: "hinton", to: "dayan", kind: "postdoc", when: "Toronto, 1993–95" },
  { from: "bard", to: "mountcastle", kind: "postdoc", when: "Johns Hopkins, 1940s" },
  { from: "mountcastle", to: "merzenich", kind: "phd", when: "Johns Hopkins, 1968" },
  { from: "rose", to: "merzenich", kind: "postdoc", when: "UW–Madison, late 1960s" },
  { from: "mountcastle", to: "georgopoulos", kind: "postdoc", when: "Johns Hopkins, 1970s" },
  { from: "mountcastle", to: "andersen", kind: "postdoc", when: "Johns Hopkins, around 1980" },
  { from: "merzenich", to: "andersen", kind: "phd", when: "UC San Francisco, 1979" },
  { from: "georgopoulos", to: "schwartz", kind: "postdoc", when: "Johns Hopkins, 1980s" },
  { from: "andersen", to: "shenoy", kind: "postdoc", when: "Caltech, late 1990s" },
  { from: "andersen", to: "sahani", kind: "phd", when: "Caltech, 1999" },
  { from: "hopfield", to: "sahani", kind: "phd", when: "Caltech, 1999" },
  { from: "shenoy", to: "churchland", kind: "postdoc", when: "Stanford, 2001–08" },
  { from: "lisberger", to: "churchland", kind: "phd", when: "UC San Francisco" },
  { from: "shenoy", to: "yu", kind: "phd", when: "Stanford, 2007" },
  { from: "sahani", to: "yu", kind: "postdoc", when: "Gatsby Unit, UCL, 2007–09" },
  { from: "chapin", to: "nicolelis", kind: "postdoc", when: "Hahnemann University, 1989–94" },
  { from: "nicolelis", to: "carmena", kind: "postdoc", when: "Duke, 2002–05" },
  { from: "carmena", to: "ganguly", kind: "postdoc", when: "UC Berkeley, late 2000s" },
  { from: "carmena", to: "orsborn", kind: "phd", when: "UC Berkeley, 2013" },
  { from: "rumelhart", to: "jordan", kind: "phd", when: "UC San Diego, 1985" },
  { from: "jordan", to: "wolpert", kind: "postdoc", when: "MIT, 1992–95" },
  { from: "wolpert", to: "kording", kind: "postdoc", when: "UCL, 2002–04" },
  { from: "adelson", to: "simoncelli", kind: "phd", when: "MIT, 1993" },
  { from: "simoncelli", to: "paninski", kind: "phd", when: "NYU, 2003" },
  { from: "donoghue", to: "paninski", kind: "research", when: "Brown, as an undergraduate" },
  { from: "ebner", to: "donoghue", kind: "phd", when: "Brown, 1979" },
  { from: "burrows", to: "laurent", kind: "postdoc", when: "Cambridge, 1985–90" },
  { from: "laurent", to: "hatsopoulos", kind: "postdoc", when: "Caltech, 1992–95" },
  { from: "donoghue", to: "hatsopoulos", kind: "postdoc", when: "Brown, 1995–98" },
  { from: "angelaki", to: "rosenberg", kind: "postdoc", when: "Washington University in St. Louis" },
  { from: "spira", to: "hai", kind: "phd", when: "Hebrew University of Jerusalem" },
  { from: "jasanoff", to: "hai", kind: "postdoc", when: "MIT" },
  { from: "hatsopoulos", to: "qin", kind: "research", when: "University of Chicago, 2026–" },
  { from: "rosenberg", to: "qin", kind: "research", when: "UW–Madison, 2024–" },
  { from: "hai", to: "qin", kind: "research", when: "UW–Madison, 2025–" },
];

/** Firsts in brain–computer interfaces; names in the tree appear in it. */
export const BCI_TIMELINE: TimelineEvent[] = [
  { year: "1969", title: "A neuron learns a trick", body: "Eberhard Fetz rewards monkeys for making a single motor-cortex neuron fire faster, and they learn to do it: an early hint that brains can learn to drive a device." },
  { year: "1973", title: "A name for the idea", body: "Jacques Vidal coins the term brain–computer interface and proposes using brain signals recorded from the scalp to control a computer." },
  { year: "1986", title: "The population vector", body: "Georgopoulos, Schwartz and Kettner show that motor-cortex neurons, each voting for its preferred direction, together predict the direction of the arm in three dimensions." },
  { year: "1998", title: "An implant in a person", body: "Philip Kennedy and Roy Bakay report that a person with paralysis learned to control a cursor through an implanted electrode." },
  { year: "1999", title: "Rats move a robot arm", body: "Chapin, Nicolelis and colleagues show rats moving a robotic arm to fetch water using neural activity alone." },
  { year: "2002", title: "Instant neural control", body: "Serruya, Hatsopoulos, Paninski, Fellows and Donoghue let monkeys move a cursor from decoded motor-cortex activity; the same year, Taylor, Tillery and Schwartz show control in 3D." },
  { year: "2003", title: "Reach and grasp", body: "Carmena, Nicolelis and colleagues show monkeys reaching and grasping with a robot arm controlled by their brain activity." },
  { year: "2006", title: "BrainGate", body: "A man with tetraplegia moves a cursor and opens email with a Utah array in his motor cortex (Hochberg, Donoghue and colleagues). In the same issue of Nature, Shenoy's lab reports a much faster BCI." },
  { year: "2008", title: "Feeding with a robotic arm", body: "In Andrew Schwartz's lab, monkeys feed themselves with a robotic arm driven by motor-cortex activity." },
  { year: "2012", title: "People reach again", body: "BrainGate participants control robotic arms in three dimensions; one drinks coffee on her own for the first time in years. Pittsburgh's team follows in 2013." },
  { year: "2021", title: "Handwriting", body: "Willett, Henderson, Shenoy and colleagues decode imagined handwriting at about 90 characters a minute." },
  { year: "2023", title: "Speech", body: "Two teams decode attempted speech at 62 and 78 words a minute, one from a Utah array and one from ECoG on the brain's surface." },
];

export interface TreeTie {
  a: string;
  b: string;
  what: string;
}

/** Famous partnerships between people in the tree (not mentorship). */
export const TREE_TIES: TreeTie[] = [
  { a: "hubel", b: "wiesel", what: "Worked side by side for over twenty years; shared the 1981 Nobel Prize" },
  { a: "rumelhart", b: "hinton", what: "Backpropagation paper with Ronald Williams, Nature 1986" },
  { a: "sejnowski", b: "hinton", what: "Invented the Boltzmann machine, 1983–85" },
  { a: "hopfield", b: "hinton", what: "Shared the 2024 Nobel Prize in Physics" },
  { a: "hatsopoulos", b: "paninski", what: "'Instant neural control of a movement signal', Nature 2002, with Donoghue" },
  { a: "donoghue", b: "shenoy", what: "Partners in the BrainGate clinical trials" },
];

// ---------------------------------------------------------------------------------------
// Spike sorting (/learn/sorting-methods)
// ---------------------------------------------------------------------------------------

export const SORTING_TIMELINE: TimelineEvent[] = [
  { year: "1960s", title: "Knobs and an oscilloscope", body: "A window discriminator counts a spike only if its peak falls inside a voltage window set by hand. Researchers usually tuned it to one clear neuron per electrode and ignored the rest." },
  { year: "1977", title: "Naming the problem", body: "Moshe Abeles and Morton Goldstein's review sets out how to pull several neurons' spike trains out of one recording, using each spike's shape rather than its height alone." },
  { year: "1983", title: "More wires, better fingerprints", body: "The stereotrode, then the tetrode: a spike looks bigger on the wire nearest its neuron, so the pattern of sizes across wires tells neighbours apart." },
  { year: "1990s", title: "Cutting clusters by hand", body: "Software such as MClust and commercial offline sorters plots spike features against each other. The researcher draws boundaries around each cloud, one recording at a time." },
  { year: "1998", title: "Taking stock", body: "Michael Lewicki's review compares the methods of the day and warns that overlapping spikes and changing waveforms defeat simple approaches." },
  { year: "2000", title: "Ground truth, and KlustaKwik", body: "Kenneth Harris and colleagues record the same neurons with tetrodes and an electrode inside the cell, measuring how often sorting goes wrong. Harris also writes KlustaKwik, an automatic clustering program used for years afterwards." },
  { year: "2004", title: "Wave_clus", body: "Rodrigo Quian Quiroga's method describes spikes with wavelets and groups them without being told how many neurons to expect. It becomes a standard for single wires, including recordings from people being monitored before epilepsy surgery." },
  { year: "2009", title: "BCIs skip the step", body: "Fraser and colleagues show a brain–computer interface works well from threshold crossings alone, with no sorting. Most clinical BCIs still decode this way." },
  { year: "2016", title: "Kilosort", body: "Marius Pachitariu and colleagues fit a template for each neuron and match it across hundreds of channels at once, on a graphics card. Dense silicon probes become practical to sort." },
  { year: "2017–18", title: "A wave of sorters", body: "MountainSort and SpyKING CIRCUS join Kilosort, each aiming to sort large recordings with less hand work. Phy becomes the common tool for checking the results by eye." },
  { year: "2019", title: "Dynamics without sorting", body: "Trautmann and colleagues in Krishna Shenoy's lab show that population-level analyses come out almost the same from unsorted threshold crossings." },
  { year: "2020", title: "Comparing sorters fairly", body: "SpikeInterface lets one script run many sorters on the same data and compare them; SpikeForest scores them against recordings with known answers. Different sorters often disagree." },
  { year: "2021", title: "Correcting for drift", body: "Kilosort 2.5 tracks how the probe moves through the brain and undoes it before sorting, part of the Neuropixels 2.0 work on recording the same neurons for weeks." },
  { year: "2024", title: "Kilosort4", body: "A new version uses graph-based clustering and is published in Nature Methods. Automated sorting is now the default for dense probes, with a person still checking the output." },
];

export type SortMethodId = "threshold" | "window" | "manual" | "clustering" | "template" | "ensemble";

export interface SortMethod {
  id: SortMethodId;
  name: string;
  since: string;
  examples: string;
  bestFor: string;
  watchOut: string;
}

export const SORT_METHODS: SortMethod[] = [
  {
    id: "threshold",
    name: "Threshold crossings, no sorting",
    since: "about 2009, in BCIs",
    examples: "Most clinical brain–computer interfaces, including BrainGate",
    bestFor: "Real-time decoding, and population analyses where it matters what the group does, not which cell did it.",
    watchOut: "Each channel mixes several neurons, so you cannot claim anything about a single cell.",
  },
  {
    id: "window",
    name: "Windows and boxes, set live",
    since: "the 1960s",
    examples: "Window discriminators; the box or 'hoop' sorting built into acquisition systems",
    bestFor: "Following one or two clear neurons while the experiment runs, for example to adjust the stimulus to them.",
    watchOut: "Subjective, hard to reproduce, and silently wrong once the waveform drifts.",
  },
  {
    id: "manual",
    name: "Cutting clusters by hand",
    since: "the 1980s",
    examples: "MClust; Plexon Offline Sorter",
    bestFor: "A few channels (single wires, tetrodes) when you can afford careful attention to every neuron.",
    watchOut: "Slow, and different people draw different boundaries on the same data.",
  },
  {
    id: "clustering",
    name: "Automatic clustering of spike shapes",
    since: "2000",
    examples: "Wave_clus, KlustaKwik, MountainSort",
    bestFor: "Single wires and tetrodes, or modest channel counts, when you want the same answer every time.",
    watchOut: "Overlapping spikes and drifting waveforms; scales poorly to dense probes.",
  },
  {
    id: "template",
    name: "Template matching across many channels",
    since: "2016",
    examples: "Kilosort, SpyKING CIRCUS",
    bestFor: "Dense probes such as Neuropixels: hundreds of channels, overlapping spikes, drift.",
    watchOut: "Needs a graphics card and a person to curate the output (usually in Phy); less suited to isolated single wires.",
  },
  {
    id: "ensemble",
    name: "Run several sorters and compare",
    since: "2020",
    examples: "SpikeInterface, with SpikeForest benchmarks",
    bestFor: "When results must hold up: check which neurons several sorters agree on before trusting them.",
    watchOut: "More computing time, and someone still has to decide what to do when sorters disagree.",
  },
];

export interface SortQuestion {
  id: "probe" | "goal" | "when" | "drift" | "time";
  question: string;
  options: { id: string; label: string }[];
}

export const SORT_QUESTIONS: SortQuestion[] = [
  {
    id: "probe",
    question: "What are you recording with?",
    options: [
      { id: "wire", label: "Single wires" },
      { id: "tetrode", label: "Tetrodes" },
      { id: "array", label: "A Utah-style array" },
      { id: "dense", label: "A dense probe (Neuropixels)" },
    ],
  },
  {
    id: "goal",
    question: "What do you need from the spikes?",
    options: [
      { id: "cells", label: "Which individual neurons fired" },
      { id: "population", label: "The population's overall pattern" },
    ],
  },
  {
    id: "when",
    question: "When do you need the answer?",
    options: [
      { id: "live", label: "Live, during the experiment" },
      { id: "offline", label: "Afterwards" },
    ],
  },
  {
    id: "drift",
    question: "Will the electrode move relative to the neurons?",
    options: [
      { id: "stable", label: "Barely" },
      { id: "drifts", label: "Yes, noticeably" },
    ],
  },
  {
    id: "time",
    question: "How long can you spend checking by hand?",
    options: [
      { id: "minutes", label: "Minutes" },
      { id: "hours", label: "Hours" },
      { id: "days", label: "Days" },
    ],
  },
];

export interface SortRule {
  method: SortMethodId;
  question: SortQuestion["id"];
  answer: string;
  delta: number;
  why: string;
}

// How each answer shifts each method: a summary of common practice, not a law.
export const SORT_RULES: SortRule[] = [
  { method: "threshold", question: "goal", answer: "population", delta: 3, why: "Decoders and population analyses lose little without sorting (Christie et al. 2015; Trautmann et al. 2019)." },
  { method: "threshold", question: "goal", answer: "cells", delta: -4, why: "Threshold crossings mix neurons, so they cannot tell you what one cell did." },
  { method: "threshold", question: "when", answer: "live", delta: 2, why: "Nothing to compute: a spike is counted the moment it crosses the line." },
  { method: "threshold", question: "probe", answer: "array", delta: 1, why: "Utah arrays have one site per needle, so neighbours are hard to separate anyway." },
  { method: "threshold", question: "drift", answer: "drifts", delta: 1, why: "There are no clusters to lose track of when the electrode moves." },
  { method: "threshold", question: "time", answer: "minutes", delta: 1, why: "No curation needed." },

  { method: "window", question: "when", answer: "live", delta: 2, why: "Built into recording systems and fast enough to run during the experiment." },
  { method: "window", question: "when", answer: "offline", delta: -3, why: "Offline, better tools look at the whole recording at once." },
  { method: "window", question: "goal", answer: "cells", delta: 1, why: "Good for isolating one clear neuron per electrode." },
  { method: "window", question: "probe", answer: "wire", delta: 1, why: "Works well on a single wire with one or two clear neurons." },
  { method: "window", question: "probe", answer: "dense", delta: -4, why: "Hand-set windows cannot keep up with hundreds of channels." },
  { method: "window", question: "drift", answer: "drifts", delta: -2, why: "A fixed window misses spikes once their shape changes." },

  { method: "manual", question: "when", answer: "live", delta: -3, why: "Cutting clusters by hand takes far longer than the experiment." },
  { method: "manual", question: "goal", answer: "cells", delta: 2, why: "Careful hand sorting is the traditional way to claim well-isolated single neurons." },
  { method: "manual", question: "probe", answer: "wire", delta: 2, why: "A few channels are manageable by hand." },
  { method: "manual", question: "probe", answer: "tetrode", delta: 2, why: "Tetrode features separate well in the 2D views that hand sorting uses." },
  { method: "manual", question: "probe", answer: "dense", delta: -4, why: "Hundreds of overlapping channels are impractical to cut by hand." },
  { method: "manual", question: "time", answer: "days", delta: 2, why: "You have the time it needs." },
  { method: "manual", question: "time", answer: "minutes", delta: -3, why: "Hand sorting takes hours per recording." },
  { method: "manual", question: "drift", answer: "drifts", delta: -1, why: "Drift stretches clusters, making boundaries harder to draw." },

  { method: "clustering", question: "when", answer: "live", delta: -2, why: "Usually run after the recording." },
  { method: "clustering", question: "goal", answer: "cells", delta: 2, why: "Separates neurons without a person drawing boundaries, and gives the same answer every time." },
  { method: "clustering", question: "probe", answer: "wire", delta: 2, why: "Methods such as Wave_clus were designed for single wires." },
  { method: "clustering", question: "probe", answer: "tetrode", delta: 2, why: "KlustaKwik was built and tested on tetrodes." },
  { method: "clustering", question: "probe", answer: "array", delta: 1, why: "Can sort each array channel on its own." },
  { method: "clustering", question: "probe", answer: "dense", delta: -1, why: "Struggles when one neuron's spike spreads over many neighbouring sites." },
  { method: "clustering", question: "time", answer: "hours", delta: 1, why: "A quick check of the clusters is usually enough." },
  { method: "clustering", question: "drift", answer: "drifts", delta: -1, why: "A drifting neuron can be split into two clusters." },

  { method: "template", question: "when", answer: "live", delta: -2, why: "Runs on the whole recording afterwards (online versions exist but are less common)." },
  { method: "template", question: "goal", answer: "cells", delta: 2, why: "Resolves overlapping spikes from neighbouring neurons." },
  { method: "template", question: "probe", answer: "dense", delta: 4, why: "Built for dense probes: a template spans all the sites a neuron reaches." },
  { method: "template", question: "probe", answer: "array", delta: 1, why: "Works on arrays too, though each neuron reaches only one needle." },
  { method: "template", question: "probe", answer: "wire", delta: -2, why: "Its advantages come from many closely spaced sites." },
  { method: "template", question: "drift", answer: "drifts", delta: 1, why: "Kilosort 2.5 and later correct for probe motion before sorting." },
  { method: "template", question: "time", answer: "minutes", delta: -1, why: "Output still needs curating, typically in Phy." },
  { method: "template", question: "time", answer: "hours", delta: 1, why: "Hours are enough to curate a typical recording." },

  { method: "ensemble", question: "when", answer: "live", delta: -3, why: "Running several sorters is an offline job." },
  { method: "ensemble", question: "goal", answer: "cells", delta: 2, why: "Neurons that several sorters agree on are the ones to trust." },
  { method: "ensemble", question: "goal", answer: "population", delta: -1, why: "Population questions rarely need this much care about each cell." },
  { method: "ensemble", question: "time", answer: "days", delta: 2, why: "You have time to compare results in depth." },
  { method: "ensemble", question: "time", answer: "minutes", delta: -2, why: "Comparing sorters takes time." },
  { method: "ensemble", question: "probe", answer: "dense", delta: 1, why: "Sorters disagree most on dense recordings, so checking pays off." },
];
