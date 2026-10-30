// Notes on /ideas: open questions at the edge of neuroscience, computation, physics and
// philosophy. They are not conclusions: the page marks each claim as evidence, interpretation or
// speculation. Further reading lists only sources that say what the page says they do.

export type IdeaPart = "Mind" | "Computation" | "Reality";

export const IDEA_PARTS: { id: IdeaPart; blurb: string }[] = [
  { id: "Mind", blurb: "What consciousness does inside a much larger brain." },
  { id: "Computation", blurb: "What simulation can and cannot capture." },
  { id: "Reality", blurb: "What, if anything, lies underneath." },
];

export interface Source {
  who: string;
  year: number;
  title: string;
  /** Journal, or publisher for a book. */
  where: string;
  book?: boolean;
}

export interface Idea {
  slug: string;
  n: number;
  part: IdeaPart;
  title: string;
  /** For the contents list. */
  short: string;
  reading: Source[];
}

export const IDEAS: Idea[] = [
  {
    slug: "not-the-whole-brain",
    n: 1,
    part: "Mind",
    title: "Consciousness is not the whole brain",
    short: "Consciousness is not the whole brain",
    reading: [
      { who: "Weiskrantz, Warrington, Sanders & Marshall", year: 1974, title: "Visual capacity in the hemianopic field following a restricted occipital ablation", where: "Brain" },
      { who: "Simons & Levin", year: 1997, title: "Change blindness", where: "Trends in Cognitive Sciences" },
      { who: "Gazzaniga", year: 2005, title: "Forty-five years of split-brain research and still going strong", where: "Nature Reviews Neuroscience" },
      { who: "Pinto et al.", year: 2017, title: "Split brain: divided perception but undivided consciousness", where: "Brain" },
      { who: "Dehaene & Changeux", year: 2011, title: "Experimental and theoretical approaches to conscious processing", where: "Neuron" },
    ],
  },
  {
    slug: "agency",
    n: 2,
    part: "Mind",
    title: "Decisions and the feeling of agency",
    short: "Decisions and agency",
    reading: [
      {
        who: "Libet, Gleason, Wright & Pearl",
        year: 1983,
        title: "Time of conscious intention to act in relation to onset of cerebral activity (readiness-potential): the unconscious initiation of a freely voluntary act",
        where: "Brain",
      },
      { who: "Soon, Brass, Heinze & Haynes", year: 2008, title: "Unconscious determinants of free decisions in the human brain", where: "Nature Neuroscience" },
      { who: "Schurger, Sitt & Dehaene", year: 2012, title: "An accumulator model for spontaneous neural activity prior to self-initiated movement", where: "PNAS" },
    ],
  },
  {
    slug: "self-model",
    n: 3,
    part: "Mind",
    title: "Is the self a model constructed by the brain?",
    short: "The self as a model",
    reading: [
      { who: "Botvinick & Cohen", year: 1998, title: "Rubber hands ‘feel’ touch that eyes see", where: "Nature" },
      { who: "Dennett", year: 1991, title: "Consciousness Explained", where: "Little, Brown", book: true },
      { who: "Metzinger", year: 2003, title: "Being No One: The Self-Model Theory of Subjectivity", where: "MIT Press", book: true },
      { who: "Lamme", year: 2006, title: "Towards a true neural stance on consciousness", where: "Trends in Cognitive Sciences" },
    ],
  },
  {
    slug: "simulate-everything",
    n: 4,
    part: "Computation",
    title: "If we had infinite computing power, could we simulate everything?",
    short: "Simulating everything",
    reading: [
      { who: "Turing", year: 1936, title: "On computable numbers, with an application to the Entscheidungsproblem", where: "Proceedings of the London Mathematical Society" },
      { who: "Lorenz", year: 1963, title: "Deterministic nonperiodic flow", where: "Journal of the Atmospheric Sciences" },
      { who: "Wootters & Zurek", year: 1982, title: "A single quantum cannot be cloned", where: "Nature" },
      { who: "Wolfram", year: 2002, title: "A New Kind of Science", where: "Wolfram Media", book: true },
      { who: "Wolpert", year: 2008, title: "Physical limits of inference", where: "Physica D" },
    ],
  },
  {
    slug: "simulated-brain",
    n: 5,
    part: "Computation",
    title: "If we perfectly simulate a brain, is it conscious?",
    short: "Simulating a brain",
    reading: [
      { who: "Searle", year: 1980, title: "Minds, brains, and programs", where: "Behavioral and Brain Sciences" },
      { who: "Chalmers", year: 1995, title: "Facing up to the problem of consciousness", where: "Journal of Consciousness Studies" },
      { who: "Tononi & Koch", year: 2015, title: "Consciousness: here, there and everywhere?", where: "Philosophical Transactions of the Royal Society B" },
    ],
  },
  {
    slug: "is-computation-fundamental",
    n: 6,
    part: "Computation",
    title: "Is computation really fundamental?",
    short: "Is computation fundamental?",
    reading: [
      { who: "Searle", year: 1990, title: "Is the brain a digital computer?", where: "Proceedings and Addresses of the American Philosophical Association" },
      { who: "Piccinini", year: 2015, title: "Physical Computation: A Mechanistic Account", where: "Oxford University Press", book: true },
    ],
  },
  {
    slug: "what-is-fundamental",
    n: 7,
    part: "Reality",
    title: "If computation is not fundamental, what is?",
    short: "What is fundamental?",
    reading: [
      { who: "Bell", year: 1964, title: "On the Einstein Podolsky Rosen paradox", where: "Physics" },
      { who: "Wheeler", year: 1990, title: "Information, physics, quantum: the search for links", where: "in Complexity, Entropy, and the Physics of Information (Addison-Wesley)" },
      { who: "Landauer", year: 1991, title: "Information is physical", where: "Physics Today" },
      { who: "Bérut et al.", year: 2012, title: "Experimental verification of Landauer’s principle linking information and thermodynamics", where: "Nature" },
      { who: "Rovelli", year: 1996, title: "Relational quantum mechanics", where: "International Journal of Theoretical Physics" },
      { who: "Tegmark", year: 2008, title: "The mathematical universe", where: "Foundations of Physics" },
    ],
  },
  {
    slug: "structure",
    n: 8,
    part: "Reality",
    title: "Why does the universe look so structured?",
    short: "Why so structured?",
    reading: [{ who: "Wigner", year: 1960, title: "The unreasonable effectiveness of mathematics in the natural sciences", where: "Communications on Pure and Applied Mathematics" }],
  },
  {
    slug: "fine-tuning",
    n: 9,
    part: "Reality",
    title: "Fine-tuning and the appearance of design",
    short: "Fine-tuning and design",
    reading: [
      { who: "Carter", year: 1974, title: "Large number coincidences and the anthropic principle in cosmology", where: "IAU Symposium 63 (Reidel)" },
      { who: "Rees", year: 1999, title: "Just Six Numbers", where: "Weidenfeld & Nicolson", book: true },
      { who: "Barnes", year: 2012, title: "The fine-tuning of the universe for intelligent life", where: "Publications of the Astronomical Society of Australia" },
    ],
  },
  {
    slug: "underneath",
    n: 10,
    part: "Reality",
    title: "The question underneath all of these questions",
    short: "The question underneath",
    reading: [{ who: "Leibniz", year: 1714, title: "Principles of Nature and Grace, Based on Reason", where: "§7: “Why is there something rather than nothing?”" }],
  },
];

export function ideaBySlug(slug: string): Idea {
  const idea = IDEAS.find((i) => i.slug === slug);
  if (!idea) throw new Error(`Unknown idea: ${slug}`);
  return idea;
}
