import type { AreaId, TimelineEvent } from "@/content/learn";

// The state of implanted brain–computer interfaces (/learn/bcis-today). This page goes
// stale quickly: every entry says what was reported and when, links its source, and the
// page warns readers once BCI_CHECKED is a few months old. To refresh it, re-check each
// entry, update the text and sources, and move BCI_CHECKED forward.

export const BCI_CHECKED = "2026-10-18";
export const BCI_CHECKED_LABEL = new Date(`${BCI_CHECKED}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export type BciDepth = "cortex" | "vessel" | "surface" | "eye";
export type BciStage = "early" | "larger" | "approved";
export type BciGoal = "movement" | "speech" | "walking" | "sight" | "mapping";

export const BCI_DEPTHS: { id: BciDepth; label: string; note: string }[] = [
  { id: "cortex", label: "Inside the cortex", note: "Needles or threads in the brain tissue: individual neurons, the most detail." },
  { id: "vessel", label: "In a blood vessel", note: "Delivered through a vein, like a heart stent: no open-brain surgery." },
  { id: "surface", label: "On or above the brain's surface", note: "Thin sheets on the brain or on its outer membrane: populations of neurons, less surgery." },
  { id: "eye", label: "In the eye", note: "Stimulates the retina to restore some sight." },
];

export const BCI_STAGES: { id: BciStage; label: string }[] = [
  { id: "early", label: "First people / early trials" },
  { id: "larger", label: "Larger trials" },
  { id: "approved", label: "Approved for use somewhere" },
];

export const BCI_GOALS: { id: BciGoal; label: string }[] = [
  { id: "movement", label: "Control a computer or arm" },
  { id: "speech", label: "Speak" },
  { id: "walking", label: "Walk" },
  { id: "sight", label: "See" },
  { id: "mapping", label: "Map the brain in surgery" },
];

export interface BciEntry {
  id: string;
  name: string;
  who: string;
  where: string;
  depth: BciDepth;
  stage: BciStage;
  goals: BciGoal[];
  status: string;
  sources: { label: string; url: string }[];
}

export const BCI_LANDSCAPE: BciEntry[] = [
  {
    id: "braingate",
    name: "BrainGate",
    who: "A consortium of universities and hospitals, using Utah arrays made by Blackrock Neurotech",
    where: "United States",
    depth: "cortex",
    stage: "early",
    goals: ["movement", "speech"],
    status:
      "Academic studies since 2004, behind many of the field's firsts. In 2024 a participant with ALS at UC Davis used four arrays to speak through a computer with about 97% of words correct. Blackrock's arrays are also used by most other academic teams.",
    sources: [{ label: "UC Davis Health", url: "https://www.ucdavis.edu/news/clinical-trial-aims-develop-new-methods-restore-speech-brain-computer-interface" }],
  },
  {
    id: "neuralink",
    name: "Neuralink",
    who: "Neuralink: flexible threads placed by a surgical robot, with a wireless implant in the skull",
    where: "United States, Canada, United Kingdom, United Arab Emirates",
    depth: "cortex",
    stage: "early",
    goals: ["movement", "speech"],
    status:
      "21 participants as of January 2026, controlling computers and robotic arms. A speech study (VOICE) is enrolling and showed a participant's imagined words spoken aloud in September 2026. A vision implant, Blindsight, has been announced but not yet placed in a person. Peer-reviewed results are still limited.",
    sources: [
      { label: "Reuters via Yahoo News, Jan 2026", url: "https://www.yahoo.com/news/articles/elon-musks-neuralink-says-21-183038116.html" },
      { label: "VOICE on ClinicalTrials.gov", url: "https://clinicaltrials.gov/study/NCT07224256" },
    ],
  },
  {
    id: "paradromics",
    name: "Paradromics Connexus",
    who: "Paradromics: a high-channel-count implant aimed at restoring speech",
    where: "United States",
    depth: "cortex",
    stage: "early",
    goals: ["speech", "movement"],
    status:
      "The FDA allowed its Connect-One study in November 2025. The first participant, a woman with motor neuron disease, was implanted in June 2026 at University of Michigan Health and has since held real-time conversations.",
    sources: [
      { label: "Paradromics, June 2026", url: "https://www.businesswire.com/news/home/20260617963732/en/Paradromics-and-University-of-Michigan-Complete-First-Connexus-BCI-Implantation-for-the-FDA-Approved-Connect-One-Clinical-Study" },
      { label: "Connect-One on ClinicalTrials.gov", url: "https://clinicaltrials.gov/study/NCT07357428" },
    ],
  },
  {
    id: "synchron",
    name: "Synchron Stentrode",
    who: "Synchron: electrodes on a stent, placed through the jugular vein next to motor cortex",
    where: "Australia, United States",
    depth: "vessel",
    stage: "early",
    goals: ["movement"],
    status:
      "Ten people implanted in early studies: four in Australia and six in the US COMMAND study, which reported no device-related serious adverse events after a year. The company says it plans to file for a larger, pivotal trial by the end of 2026.",
    sources: [
      { label: "COMMAND results (MassDevice)", url: "https://www.massdevice.com/synchron-command-study-results-stentrode-bci-implant/" },
      { label: "Pivotal-trial plans (Tech Times, June 2026)", url: "https://www.techtimes.com/articles/317929/20260606/synchron-brain-implant-targets-2026-pivotal-trial-first-fda-approved-bci.htm" },
    ],
  },
  {
    id: "onward",
    name: "ONWARD ARC-BCI",
    who: "ONWARD Medical with Clinatec and CHUV: a brain implant in the skull that drives spinal cord stimulation",
    where: "Switzerland",
    depth: "surface",
    stage: "early",
    goals: ["walking", "movement"],
    status:
      "A 'digital bridge' over a spinal cord injury: intended movements, read from the brain's surface, trigger stimulation of the spinal cord below the injury. First shown in 2023 with a man who walked again; the company reports seven people implanted in Lausanne.",
    sources: [{ label: "ONWARD Medical", url: "https://www.biospace.com/press-releases/onward-medical-completes-two-additional-brain-computer-interface-implants-paired-with-spinal-cord-stimulation-technology-to-restore-thought-driven-movement" }],
  },
  {
    id: "beinao",
    name: "Beinao-1",
    who: "NeuCyber and the Chinese Institute for Brain Research, Beijing: a semi-invasive implant",
    where: "China",
    depth: "surface",
    stage: "larger",
    goals: ["movement", "speech"],
    status:
      "16 people implanted by June 2026 and in registered clinical trials, with wider hospital trials planned for 2027. Several other Chinese companies, including StairMed and NeuroXess, have implants in trials.",
    sources: [
      { label: "Global Times, June 2026", url: "https://www.globaltimes.cn/page/202606/1362571.shtml" },
      { label: "Landscape of BCI trials in China (arXiv)", url: "https://arxiv.org/pdf/2607.07185" },
    ],
  },
  {
    id: "precision",
    name: "Precision Layer 7",
    who: "Precision Neuroscience: a film thinner than a hair with 1,024 electrodes, slid onto the brain",
    where: "United States",
    depth: "surface",
    stage: "approved",
    goals: ["mapping"],
    status:
      "FDA 510(k) clearance in April 2025 to record from and stimulate the brain's surface for up to 30 days, for example to map function during surgery. Tested in dozens of patients, mostly during operations already under way; a permanent BCI is the long-term goal.",
    sources: [{ label: "CNBC, April 2025", url: "https://www.cnbc.com/2025/04/17/brain-implant-cleared-fda-musk-neuralink-rival-precision-neuroscience.html" }],
  },
  {
    id: "neuracle",
    name: "Neuracle NEO",
    who: "Neuracle Medical Technology: a wireless implant with electrodes resting on the brain's outer membrane",
    where: "China",
    depth: "surface",
    stage: "approved",
    goals: ["movement"],
    status:
      "Approved for sale by China's medical products regulator on 13 March 2026, to restore some hand function after cervical spinal cord injury. Widely reported as the first implanted BCI approved for sale anywhere; its electrodes sit outside the brain tissue, so some call it semi-invasive.",
    sources: [
      { label: "Bird & Bird, 2026", url: "https://www.twobirds.com/en/insights/2026/china/china-clears-worlds-first-invasive-braincomputer-interface-for-commercial-use-what-the-regulatory-la" },
      { label: "NEO trial on ClinicalTrials.gov", url: "https://clinicaltrials.gov/study/NCT06990412" },
    ],
  },
  {
    id: "prima",
    name: "Science PRIMA",
    who: "Science Corporation: a 2 mm wireless chip under the retina, powered by infrared light from camera glasses",
    where: "Europe (United States planned)",
    depth: "eye",
    stage: "approved",
    goals: ["sight"],
    status:
      "In a trial of 38 people with advanced dry macular degeneration, published in NEJM in 2025, 26 of the 32 assessed at a year read clinically meaningfully better. CE-marked for sale in Europe in 2026; vision is black-and-white and narrow, like looking through a straw.",
    sources: [{ label: "STAT, July 2026", url: "https://www.statnews.com/2026/07/22/prima-retinal-implant-for-macular-degeneration-us-timeline/" }],
  },
];

// ---------------------------------------------------------------------------------------
// Where BCIs record (/learn/brain-map). Each entry is one program at one brain area, with
// its main reported result and a source, and where it goes on the flat and 3D maps.
// Re-check with BCI_LANDSCAPE and move BCI_SITES_CHECKED forward.
// ---------------------------------------------------------------------------------------

export const BCI_SITES_CHECKED = "2026-10-30";

export type BciSiteHow = "cortex" | "surface" | "vessel" | "deep";

export const BCI_SITE_HOW: Record<BciSiteHow, string> = {
  cortex: "Electrodes in the cortex",
  surface: "Electrodes on or above the surface",
  vessel: "Electrodes in a blood vessel",
  deep: "Leads deep in the brain",
};

export interface BciSite {
  id: string;
  who: string;
  area: AreaId;
  how: BciSiteHow;
  /** What it is used for. */
  what: string;
  result: string;
  /** Entry in BCI_LANDSCAPE, for programs that page covers. */
  landscape?: string;
  sources: { label: string; url: string }[];
  /** Marker on the flat map (viewBox 600 × 410). */
  at: [number, number];
  /**
   * Approximate MNI coordinate (mm) for the 3D brain: the reported target, or the centre of the
   * named area where no coordinate is published. Surface implants snap to the nearest cortex.
   */
  mni: [number, number, number];
}

export const BCI_SITES: BciSite[] = [
  {
    id: "synchron",
    who: "Synchron",
    area: "m1",
    how: "vessel",
    what: "Clicks and selections to control a computer",
    result: "The Stentrode is guided up the jugular vein into the large vein along the top of the brain (the superior sagittal sinus), where it lies next to motor cortex.",
    landscape: "synchron",
    sources: [{ label: "IEEE Spectrum", url: "https://spectrum.ieee.org/brain-implant-close-to-market" }],
    mni: [-4, -20, 80],
    at: [330, 33],
  },
  {
    id: "onward",
    who: "ONWARD, Clinatec and EPFL",
    area: "m1",
    how: "surface",
    what: "Walking again, through spinal cord stimulation",
    result: "Two 64-electrode implants rest above the leg areas on both sides. In 2023 a man with a spinal cord injury used them to stand, walk and climb stairs.",
    landscape: "onward",
    sources: [{ label: "Lorach et al., Nature 2023", url: "https://www.nature.com/articles/s41586-023-06094-5" }],
    mni: [-10, -28, 76],
    at: [306, 52],
  },
  {
    id: "braingate-hand",
    who: "BrainGate (Stanford, Brown, Mass General and others)",
    area: "m1",
    how: "cortex",
    what: "Cursors, typing and robotic arms",
    result: "Utah arrays in the hand area. In 2021 a participant wrote by imagining handwriting, at 90 characters a minute.",
    landscape: "braingate",
    sources: [{ label: "Willett et al., Nature 2021", url: "https://www.nature.com/articles/s41586-021-03506-2" }],
    mni: [-34, -24, 64],
    at: [297, 106],
  },
  {
    id: "neuralink",
    who: "Neuralink",
    area: "m1",
    how: "cortex",
    what: "Computer and robotic-arm control",
    result: "Threads are placed in the part of the precentral gyrus that controls the hand, located for each person with fMRI.",
    landscape: "neuralink",
    sources: [{ label: "Neuralink PRIME update", url: "https://neuralink.com/blog/prime-study-progress-update/" }],
    mni: [-40, -16, 58],
    at: [289, 132],
  },
  {
    id: "neuracle",
    who: "Neuracle NEO (with Tsinghua University)",
    area: "m1",
    how: "surface",
    what: "Grasping with a powered glove after spinal cord injury",
    result: "Two sets of four electrodes rest on the brain's outer membrane over the hand area, one each side of the central sulcus.",
    landscape: "neuracle",
    sources: [{ label: "Preprint, medRxiv", url: "https://www.medrxiv.org/content/10.1101/2024.09.05.24313041" }],
    mni: [-44, -24, 58],
    at: [310, 120],
  },
  {
    id: "touch",
    who: "Pittsburgh and Chicago (Cortical Bionics)",
    area: "s1",
    how: "cortex",
    what: "Touch feedback from a robotic hand",
    result: "Stimulating the hand area makes the participant feel touch on their own fingers and palm. With this feedback, a 2021 participant took half as long to grasp and move objects with a robotic arm.",
    sources: [{ label: "Flesher et al., Science 2021", url: "https://pubmed.ncbi.nlm.nih.gov/34016775/" }],
    mni: [-44, -32, 58],
    at: [325, 112],
  },
  {
    id: "caltech-ppc",
    who: "Caltech (Andersen lab)",
    area: "ppc",
    how: "cortex",
    what: "Reach and grasp goals for a robotic arm or cursor",
    result: "Arrays in a reach area (5d) and a grasp area (AIP) decoded the goals of imagined movements in 2015, a higher-level signal than motor cortex gives.",
    sources: [{ label: "Aflalo et al., Science 2015", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4896830/" }],
    mni: [-36, -42, 54],
    at: [382, 72],
  },
  {
    id: "stanford-speech",
    who: "Stanford (BrainGate)",
    area: "speech",
    how: "cortex",
    what: "Attempted and imagined speech",
    result: "62 words a minute in 2023 from arrays in area 6v. In 2025 the team decoded sentences participants only imagined saying, with a mental password to keep the decoder locked.",
    landscape: "braingate",
    sources: [
      { label: "Willett et al., Nature 2023", url: "https://www.nature.com/articles/s41586-023-06377-x" },
      { label: "NIH on Kunz et al., Cell 2025", url: "https://www.ninds.nih.gov/news-events/news/press-releases/decoding-inner-speech-brain-signals" },
    ],
    mni: [-58, 0, 28],
    at: [247, 178],
  },
  {
    id: "ucdavis",
    who: "UC Davis (BrainGate)",
    area: "speech",
    how: "cortex",
    what: "Speech as text and a synthesised voice",
    result: "Four arrays in the ventral precentral gyrus of a man with ALS: about 97% of words correct in 2024.",
    landscape: "braingate",
    sources: [{ label: "Card et al., NEJM 2024", url: "https://www.nejm.org/doi/full/10.1056/NEJMoa2314132" }],
    mni: [-58, -8, 34],
    at: [263, 174],
  },
  {
    id: "paradromics",
    who: "Paradromics",
    area: "speech",
    how: "cortex",
    what: "Real-time speech",
    result: "One 421-electrode array in the part of motor cortex that controls the lips, tongue and larynx; the first participant was implanted in 2026.",
    landscape: "paradromics",
    sources: [{ label: "Paradromics, 2026", url: "https://www.biospace.com/press-releases/paradromics-and-university-of-michigan-complete-first-connexus-bci-implantation-for-the-fda-approved-connect-one-clinical-study" }],
    mni: [-60, -6, 22],
    at: [279, 186],
  },
  {
    id: "ucsf-speech",
    who: "UCSF (Chang lab)",
    area: "speech",
    how: "surface",
    what: "Text, voice and a talking avatar",
    result: "A 253-electrode sheet over speech motor cortex and the superior temporal gyrus decoded speech in 2023, 18 years after a brainstem stroke took the participant's voice.",
    sources: [{ label: "Metzger et al., Nature 2023", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10826467/" }],
    mni: [-62, -14, 16],
    at: [262, 197],
  },
  {
    id: "stanford-44",
    who: "Stanford (BrainGate)",
    area: "broca",
    how: "cortex",
    what: "Tested as a source for speech decoding",
    result: "Two arrays in area 44, part of Broca's area, carried little information about the movements of speaking in 2023, unlike area 6v next door.",
    landscape: "braingate",
    sources: [{ label: "Willett et al., Nature 2023", url: "https://www.nature.com/articles/s41586-023-06377-x" }],
    mni: [-54, 12, 12],
    at: [190, 206],
  },
  {
    id: "caltech-smg",
    who: "Caltech (Andersen lab)",
    area: "smg",
    how: "cortex",
    what: "Inner speech",
    result: "In 2024 single neurons here responded to words that participants only imagined saying, as well as to words they said.",
    sources: [{ label: "Caltech, 2024", url: "https://neuroscience.caltech.edu/news/brain-machine-interface-device-predicts-internal-speech-in-second-patient" }],
    mni: [-58, -36, 34],
    at: [376, 156],
  },
  {
    id: "cortivis",
    who: "CORTIVIS (Miguel Hernández University, Spain)",
    area: "v1",
    how: "cortex",
    what: "Artificial vision for blind people",
    result: "In 2021 a 96-electrode array near the border of V1 and V2 let a blind volunteer see spots of light and recognise some letters.",
    sources: [{ label: "Fernández et al., JCI 2021", url: "https://www.jci.org/articles/view/151331" }],
    mni: [14, -100, 6],
    at: [548, 152],
  },
  {
    id: "adbs",
    who: "Medtronic BrainSense adaptive DBS",
    area: "basal-ganglia",
    how: "deep",
    what: "Self-adjusting stimulation for Parkinson's disease",
    result: "Approved by the FDA in February 2025: the stimulator reads brain signals through its own leads and adjusts stimulation to match.",
    sources: [{ label: "Medical Economics, 2025", url: "https://www.medicaleconomics.com/view/fda-approves-first-adaptive-deep-brain-stimulation-system-for-parkinson-s" }],
    mni: [-12, -14, -7],
    at: [280, 190],
  },
  {
    id: "rns",
    who: "NeuroPace RNS",
    area: "hippocampus",
    how: "deep",
    what: "Detecting and stopping seizures",
    result: "Approved in the US since 2013 for focal epilepsy. Leads at the seizure focus, often the hippocampus, watch for a seizure starting and respond with stimulation.",
    sources: [{ label: "Review, Medical Devices 2015", url: "https://www.dovepress.com/critical-review-of-the-responsive-neurostimulator-system-for-epilepsy-peer-reviewed-fulltext-article-MDER" }],
    mni: [-28, -20, -14],
    at: [330, 256],
  },
  {
    id: "memory",
    who: "Wake Forest and USC",
    area: "hippocampus",
    how: "deep",
    what: "A memory prosthesis (research)",
    result: "In 2018, stimulation patterned on each person's own hippocampal activity improved short-term memory in patients who already had electrodes for epilepsy.",
    sources: [{ label: "Hampson et al., J Neural Eng 2018", url: "https://pubmed.ncbi.nlm.nih.gov/29589592/" }],
    mni: [-30, -28, -8],
    at: [372, 244],
  },
  {
    id: "ucsf-depression",
    who: "UCSF (closed-loop DBS)",
    area: "amygdala",
    how: "deep",
    what: "Severe depression (one patient)",
    result: "In 2021 an activity pattern in the amygdala triggered brief stimulation of the ventral striatum, and the patient's depression went into remission.",
    sources: [{ label: "Physics World on Scangos et al., 2021", url: "https://physicsworld.com/a/personalized-brain-stimulation-could-treat-untreatable-depression/" }],
    mni: [-22, -4, -18],
    at: [284, 268],
  },
];

export const BCI_RECENT: TimelineEvent[] = [
  { year: "Jan 2024", title: "Neuralink's first participant", body: "A man with quadriplegia controls a computer with Neuralink's implant. Months later the company discloses that many of its threads had pulled out of the brain, and adjusts its software to compensate." },
  { year: "Aug 2024", title: "Speech at 97%", body: "At UC Davis, a man with ALS speaks through a BCI with about 97% of words correct (NEJM)." },
  { year: "Apr 2025", title: "A first FDA clearance", body: "Precision Neuroscience's surface array is cleared for use for up to 30 days, which the company called the first clearance for a next-generation BCI." },
  { year: "Oct 2025", title: "Restoring reading vision", body: "The PRIMA retinal implant trial is published in NEJM: most participants with advanced macular degeneration read better a year later." },
  { year: "Nov 2025", title: "Global ethics rules", body: "UNESCO's member states adopt the first global recommendation on the ethics of neurotechnology, including consent for collecting neural data." },
  { year: "Mar 2026", title: "Approved for sale", body: "China approves Neuracle's NEO, an implant with electrodes over the brain, for hand function after spinal cord injury." },
  { year: "Jun 2026", title: "More players, more people", body: "Paradromics implants its first participant in an FDA-approved study; Beijing's Beinao-1 reaches 16 implants." },
  { year: "Mid 2026", title: "A neural implant on the market in Europe", body: "Science Corporation's PRIMA receives a CE mark, allowing sale in Europe." },
  { year: "Sep 2026", title: "Speech from imagined words", body: "Paradromics and Neuralink both report participants whose attempted or imagined speech is turned into spoken words in real time." },
];

export interface Dilemma {
  id: string;
  question: string;
  options: string[];
  context: string;
  sources: { label: string; url: string }[];
}

export const BCI_DILEMMAS: Dilemma[] = [
  {
    id: "data",
    question: "Your implant's company wants to use your brain recordings to build its next product. Should it have to ask you separately?",
    options: ["Yes, every time", "No, it was in the sign-up form", "Only if the data can identify me"],
    context:
      "Medical privacy laws protect health records, but neural data, especially from consumer headsets, often falls outside them. Colorado and California added neural data to their privacy laws in 2024, Chile wrote 'neurorights' into its constitution in 2021, and in November 2025 UNESCO's recommendation called for prior, free and informed consent before neural data is collected or shared. A US Senate bill, the MIND Act, proposes a federal study of the question.",
    sources: [
      { label: "UNESCO recommendation", url: "https://www.unesco.org/en/legal-affairs/recommendation-ethics-neurotechnology" },
      { label: "MIND Act (S.2925)", url: "https://www.congress.gov/bill/119th-congress/senate-bill/2925/text/is" },
    ],
  },
  {
    id: "abandonment",
    question: "You have relied on an implant for four years. The company stops supporting it. What should happen?",
    options: ["The company must keep supporting it", "Someone else should take over", "It should be removed"],
    context:
      "This has already happened. Second Sight stopped supporting its Argus II retinal implant, leaving more than 350 people with devices that could not be repaired or upgraded; some kept electrodes that no longer worked because removing them was riskier than leaving them. Ethicists now argue that trials should plan long-term support, and the option of removal, before the first implant.",
    sources: [{ label: "IEEE Spectrum, 2022", url: "https://spectrum.ieee.org/bionic-eye-obsolete" }],
  },
  {
    id: "words",
    question: "A speech BCI uses an AI language model to turn rough decoded sounds into fluent sentences. When it gets a word wrong, whose words are they?",
    options: ["Still the person's", "The machine's", "Shared"],
    context:
      "Most speech BCIs now use language models, like a phone's autocorrect, to choose likely words, and some speak them in an AI-generated version of the user's own voice. That makes them faster and more accurate, but harder to tell apart what the person meant from what the model guessed. Many systems let the user check a sentence before it is spoken.",
    sources: [],
  },
  {
    id: "evidence",
    question: "A company livestreams a participant using its implant. Is that evidence that it works?",
    options: ["Yes, I saw it work", "It shows what is possible", "Not until it is published"],
    context:
      "A demonstration shows one person on a good day. Trials registered on ClinicalTrials.gov, and peer-reviewed papers, report how many people took part, how well it worked for each, and what went wrong, such as the threads that retracted in Neuralink's first participant. Both kinds of information matter, but only one can be checked.",
    sources: [],
  },
  {
    id: "access",
    question: "A BCI is approved. Who should pay for it?",
    options: ["Health insurance", "Governments", "The people who want it"],
    context:
      "Approval is not access. Insurers and health systems decide what they will pay for, surgeons must be trained to implant the device, and users need support for years. The most successful neural implants so far, cochlear implants and deep brain stimulation, took decades to become routine treatments.",
    sources: [],
  },
];
