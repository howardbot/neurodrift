import Link from "next/link";
import { FamilyTree } from "@/components/learn/FamilyTree";
import { GuideHero, NextGuide, Timeline } from "@/components/learn/GuideBits";
import { Callout, Figure, Section, Steps, Term } from "@/components/showcase/Story";
import { BCI_TIMELINE, TREE_LINKS, TREE_PEOPLE, guideBySlug } from "@/content/learn";

const guide = guideBySlug("family-tree");
export const metadata = { title: "Family tree", description: guide.hook };

const linkClass = "font-medium text-accent-600 hover:underline dark:text-accent-300";

export default function FamilyTreeGuide() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <GuideHero guide={guide} />

      <Section eyebrow="A family trade" title="Scientists have family trees too">
        <p>
          Researchers are trained by researchers. A PhD student spends years in one lab with a <Term id="doctoral-advisor">doctoral advisor</Term>,
          then often moves to another as a <Term id="postdoc">postdoc</Term> before starting a lab of their own. Along the way they inherit
          techniques, questions and habits of mind, and pass them on. Follow those links back and you get a family tree.
        </p>
        <p>
          Here are {TREE_PEOPLE.length - 1} people from computational neuroscience and{" "}
          <Term id="brain-computer-interface">brain–computer interfaces</Term>, joined by {TREE_LINKS.length} mentoring links. Click anyone to
          light up their lineage, or ask how two people are connected.
        </p>
      </Section>

      <Figure
        label="Interactive · family tree"
        caption={
          <>
            A selected, simplified slice of a much larger family: most people here had more mentors and many more trainees than shown. Rows show
            roughly when each person trained. Each link was checked against CVs, lab and university pages, memoirs, Wikipedia,{" "}
            <a href="https://neurotree.org" className="underline hover:text-accent-600" target="_blank" rel="noreferrer">
              Neurotree
            </a>{" "}
            or the{" "}
            <a href="https://mathgenealogy.org" className="underline hover:text-accent-600" target="_blank" rel="noreferrer">
              Mathematics Genealogy Project
            </a>
            .
          </>
        }
      >
        <FamilyTree />
      </Figure>

      <Section eyebrow="Reading the tree" title="Three things it shows">
        <Steps
          items={[
            {
              title: "Tools travel with people",
              body: "Vernon Mountcastle was among the first to record single neurons in awake monkeys as they felt, looked and moved. His postdoc Apostolos Georgopoulos used that approach to discover the population vector, and Georgopoulos's postdoc Andrew Schwartz used it to drive robotic arms from brain activity.",
            },
            {
              title: "Physicists and AI researchers walked in",
              body: "John Hopfield, a physicist, supervised Terry Sejnowski and co-supervised Maneesh Sahani. Geoffrey Hinton, who trained Peter Dayan as a postdoc, shared the 2024 Nobel Prize in Physics with Hopfield for the ideas behind modern neural networks.",
            },
            {
              title: "Many BCI labs are cousins",
              body: "Krishna Shenoy trained with Richard Andersen, who trained with Mountcastle and Michael Merzenich. Mark Churchland and Byron Yu were both in Shenoy's lab. Turn on famous partnerships to see how branches that look separate worked together.",
            },
          ]}
        />
      </Section>

      <Section eyebrow="Firsts" title="How brain–computer interfaces grew up">
        <p>Many of the people in the tree appear in this short history. A branch of the tree often shows up as a run of firsts.</p>
      </Section>
      <div className="mb-12 max-w-3xl">
        <Timeline events={BCI_TIMELINE} />
      </div>

      <Section eyebrow="My branch" title="Where I fit in">
        <p>
          I work with three labs, so I have three academic parents on this map. Nicholas Hatsopoulos trained with Gilles Laurent and then John
          Donoghue, whose BrainGate team put the first Utah arrays in people. Ari Rosenberg trained with Dora Angelaki, who studies how the senses
          combine. Aviad Hai trained with Micha Spira, who builds interfaces between neurons and electronics, and with Alan Jasanoff, who makes
          brain activity visible in MRI.
        </p>
        <p>
          Those three branches match the three kinds of work on this site:{" "}
          <Link href="/research/cross-day-decoding" className={linkClass}>
            decoding movement
          </Link>
          ,{" "}
          <Link href="/research/3d-vision" className={linkClass}>
            seeing in 3D
          </Link>{" "}
          and{" "}
          <Link href="/learn/electrodes" className={linkClass}>
            recording hardware
          </Link>
          .
        </p>
      </Section>

      <div className="mb-12 max-w-3xl">
        <Callout title="Selected and simplified" tone="caution">
          This map leaves out far more people than it shows, including many of the women and the researchers outside Europe and North America
          who shaped these fields. Links describe one period of training each, not a whole relationship. Neurotree holds the full, community-edited
          tree.
        </Callout>
      </div>

      <NextGuide current={guide.slug} />
    </article>
  );
}
