// Field guide content: general-knowledge pages under /learn. Facts here are textbook or
// from widely cited papers (named where a number comes from one); numbers are rounded and
// meant to convey orders of magnitude, not device specifications.

export interface Guide {
  slug: string;
  title: string;
  short: string;
  hook: string;
  minutes: number;
}

export const GUIDES: Guide[] = [
  {
    slug: "electrodes",
    title: "Listening to the brain: a field guide to electrodes",
    short: "Electrodes",
    hook: "From a frog's leg in 1791 to probes with thousands of contacts: how we pick up the brain's electrical chatter, and what each kind of electrode can and cannot hear.",
    minutes: 8,
  },
  {
    slug: "signal-chain",
    title: "From a spike to a dataset",
    short: "Spike to dataset",
    hook: "A recording is just a wiggly voltage. Follow it through filtering, spike detection and sorting until it becomes the table of numbers a decoder reads.",
    minutes: 6,
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
