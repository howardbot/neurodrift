import type { TimelineEvent } from "@/content/learn";

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
