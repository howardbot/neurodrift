import Link from "next/link";
import { BciLandscape, CheckedBadge, Dilemmas } from "@/components/learn/BciToday";
import { GuideHero, NextGuide, Timeline } from "@/components/learn/GuideBits";
import { Callout, Figure, Section, Steps, Term } from "@/components/showcase/Story";
import { BCI_CHECKED_LABEL, BCI_RECENT } from "@/content/bciToday";
import { guideBySlug } from "@/content/learn";

const guide = guideBySlug("bcis-today");
export const metadata = { title: "BCIs today", description: guide.hook };

const linkClass = "font-medium text-accent-600 hover:underline dark:text-accent-300";

export default function BcisTodayGuide() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <GuideHero guide={guide}>
        <CheckedBadge />
      </GuideHero>

      <Section eyebrow="Where things stand" title="From lab demos to the first approvals">
        <p>
          For twenty years, implanted <Term id="brain-computer-interface">brain–computer interfaces</Term> were research projects: a few
          people at a time, in university trials. That is changing. As of {BCI_CHECKED_LABEL}, a handful of companies have implants in people,
          the first approvals have arrived, and companies in the US and China are moving fastest.
        </p>
        <p>
          Most devices are still in an <Term id="early-feasibility-study">early feasibility study</Term>, which tests safety in a few people. The
          next step is a <Term id="pivotal-trial">pivotal trial</Term> large enough to win approval. For perspective, implants that send signals
          into the nervous system are already routine: around a million people have a <Term id="cochlear-implant">cochlear implant</Term>, and
          well over 100,000 have had <Term id="deep-brain-stimulation">deep brain stimulation</Term>.
        </p>
      </Section>

      <Figure
        label="Interactive · the landscape"
        caption={`A selection, not a complete list, as reported by ${BCI_CHECKED_LABEL}. Click a device for details and sources. Several figures come from the companies themselves, and numbers change often.`}
      >
        <BciLandscape />
      </Figure>

      <Section eyebrow="Recent history" title="The last three years">
        <p>
          The{" "}
          <Link href="/learn/family-tree" className={linkClass}>
            family tree
          </Link>{" "}
          covers the firsts from 1969 to 2023. Since then, things have moved fast.
        </p>
      </Section>
      <div className="mb-12 max-w-3xl">
        <Timeline events={BCI_RECENT} />
      </div>

      <Section eyebrow="Ethics" title="Questions worth asking">
        <p>
          A device that reads the brain raises questions a pacemaker never did. Pick an answer to each, then see what has actually happened and
          what rules exist so far.
        </p>
      </Section>
      <div className="mb-12">
        <Dilemmas />
      </div>

      <Section eyebrow="A reader's toolkit" title="How to read BCI news">
        <Steps
          items={[
            { title: "How many people?", body: "One participant shows something is possible. Ten with consistent results shows it is reliable." },
            { title: "Press release or paper?", body: "Peer-reviewed papers report methods, failures and how each participant did. Announcements and videos usually show the best moments." },
            { title: "Is the trial registered?", body: "ClinicalTrials.gov lists the plan, who can take part and what will be measured, so results can be checked against it." },
            { title: "How long has it lasted?", body: "Signals from implants often fade over months to years. Results from the first weeks say little about the tenth year." },
            { title: "What can the person now do?", body: "Words per minute, or the ability to feed oneself, matter more than the number of electrodes." },
          ]}
        />
      </Section>

      <div className="mb-12 max-w-3xl">
        <Callout title="Go deeper">
          The{" "}
          <Link href="/learn/electrodes" className={linkClass}>
            electrodes guide
          </Link>{" "}
          explains what each kind of implant can hear,{" "}
          <Link href="/learn/decoders" className={linkClass}>
            Decoders 101
          </Link>{" "}
          how spikes become a cursor, and{" "}
          <Link href="/learn/drift" className={linkClass}>
            why decoders break overnight
          </Link>{" "}
          one of the main reasons BCIs are hard to use every day.
        </Callout>
      </div>

      <NextGuide current={guide.slug} />
    </article>
  );
}
