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
