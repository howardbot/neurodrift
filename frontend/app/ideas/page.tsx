import { ScrollProgress } from "@/components/motion";
import { Chain, Claim, Contents, Legend, Note, OpenQuestion, Relation, Sub } from "@/components/ideas/IdeaBits";
import { HeroGlow } from "@/components/showcase/Story";
import { ideaBySlug } from "@/content/ideas";
import { PROFILE } from "@/content/profile";

export const metadata = {
  title: "Ideas",
  description: `Open questions ${PROFILE.name} keeps thinking about: consciousness, computation, information and physical reality.`,
};

export default function Ideas() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <header className="relative mb-10 max-w-3xl pt-2">
        <ScrollProgress />
        <HeroGlow />
        <div className="mb-3 flex animate-fade-up items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">
          <span className="h-px w-5 bg-gradient-to-r from-accent-500 to-transparent" />
          Ideas
        </div>
        <h1 className="animate-fade-up text-[2rem] font-semibold leading-[1.15] tracking-tight [animation-delay:60ms] md:text-[2.6rem]">
          Questions worth thinking about
        </h1>
        <p className="mt-4 animate-fade-up text-lg leading-relaxed text-zinc-700 [animation-delay:140ms] dark:text-zinc-300">
          Notes at the meeting point of neuroscience, computation, physics and philosophy, around one theme: what is the relationship between
          consciousness, computation, information and physical reality?
        </p>
        <p className="mt-3 animate-fade-up text-[15px] leading-relaxed text-zinc-600 [animation-delay:200ms] dark:text-zinc-400">
          These are questions I find compelling, not conclusions. To keep what we know apart from what we suspect, every passage that makes a
          claim carries one of three labels:
        </p>
        <div className="mt-5 animate-fade-up [animation-delay:260ms]">
          <Legend />
        </div>
      </header>

      <div className="mb-14">
        <Contents />
      </div>

      <Note idea={ideaBySlug("not-the-whole-brain")}>
        <p>One idea that fascinates me is that the conscious “self” does not seem to have access to everything the brain is doing.</p>
        <Claim kind="evidence">
          <p>
            A huge amount of neural processing happens outside conscious awareness. Perception, motor preparation, emotional evaluation, memory
            retrieval and decision formation can all begin before we become aware of them. People with blindsight respond to objects they say
            they cannot see; words flashed too briefly to be noticed still speed up responses to related words; and large changes to a scene
            can go unnoticed. Together with split-brain studies and studies of voluntary action, these results point the same way:
          </p>
          <Relation>brain computation ≫ conscious awareness</Relation>
        </Claim>
        <Claim kind="evidence">
          <p>
            Split-brain experiments are especially striking. With the connection between the hemispheres cut, each hemisphere can process
            different information and guide behaviour on its own, and the language-dominant hemisphere may construct an explanation afterwards
            without access to the actual cause of the behaviour. How divided consciousness itself becomes is still debated: some later studies
            of split-brain patients found more unity than the classic results suggest.
          </p>
        </Claim>
        <Claim kind="interpretation">
          <p>
            Consciousness may be a limited interface through which certain information becomes globally available for reasoning, memory,
            planning, language and action. Global workspace theories propose a version of this.
          </p>
        </Claim>
        <Claim kind="speculation">
          <p>
            This raises an uncomfortable but interesting possibility: perhaps the conscious self is not a central executive that observes the
            whole brain and issues commands. The analogy I like is the graphical interface of a computer. The GUI is real and functionally
            important, but it is not the whole computer: beneath it are an operating system, processes, memory management and hardware that it
            never displays. Similarly:
          </p>
          <Relation>conscious self ≠ whole brain</Relation>
        </Claim>
        <Claim kind="evidence">
          <p>
            None of this means consciousness is separate from the brain. Changing brain states, through sleep, anaesthesia, injury or
            stimulation, reliably changes conscious experience.
          </p>
        </Claim>
        <p>The more precise question is:</p>
        <OpenQuestion>What role does conscious awareness play inside a much larger system of unconscious neural computation?</OpenQuestion>
      </Note>

      <Note idea={ideaBySlug("agency")}>
        <p>Does the feeling “I decided to do this” accurately reflect how decisions are generated?</p>
        <Claim kind="evidence">
          <p>
            In Benjamin Libet’s experiments in the 1980s, a slow build-up of brain activity before a simple voluntary movement, the readiness
            potential, began several hundred milliseconds before people reported the moment they decided to move. Later brain-imaging studies
            could predict which of two buttons a person would press several seconds before they reported deciding, though only modestly better
            than chance.
          </p>
        </Claim>
        <Claim kind="interpretation">
          <p>
            What these signals mean is contested. One influential model suggests that the readiness potential partly reflects ongoing random
            fluctuations drifting towards a threshold, rather than a decision that has already been made.
          </p>
        </Claim>
        <p>
          None of this proves that free will is an illusion. But it does suggest that conscious awareness may enter the decision process later
          than intuition suggests.
        </p>
        <Claim kind="interpretation">
          <p>One possible sequence:</p>
          <Chain
            steps={[
              "unconscious neural processing",
              "competition between possible actions",
              "one action begins to stabilise",
              "conscious awareness of the intention",
              "the experience: “I decided”",
            ]}
          />
        </Claim>
        <p>So the important question is not simply whether free will exists. It is:</p>
        <OpenQuestion>What exactly is the conscious “I” doing during decision formation?</OpenQuestion>
        <Claim kind="speculation">
          <p>
            Perhaps conscious thought matters most for long-term planning, counterfactual reasoning, social reasoning, self-monitoring and
            flexible behaviour, rather than serving as a moment-to-moment command centre.
          </p>
        </Claim>
      </Note>

      <Note idea={ideaBySlug("self-model")}>
        <p>The feeling of being one continuous person is extremely stable. I experience myself as the same “I” across time:</p>
        <Chain across steps={["past self", "present self", "future self"]} />
        <Claim kind="evidence">
          <p>
            Yet parts of this feeling can be taken apart. In the rubber hand illusion, watching a rubber hand being stroked in time with your
            own hidden hand makes the rubber hand feel like part of your body.
          </p>
        </Claim>
        <Claim kind="interpretation">
          <p>
            This suggests that the unity of the self is something the brain constructs. It continuously integrates memory, bodily state,
            perception, goals, emotions, actions and social information, and produces a coherent model: “This is my body.” “These are my
            memories.” “This was my decision.” “This is what I am thinking.”
          </p>
        </Claim>
        <Claim kind="speculation">
          <p>
            Perhaps the subjective self is a self-model: a useful representation generated by the nervous system, rather than a separate
            observer sitting inside the brain.
          </p>
        </Claim>
        <p>
          The classic problem with imagining an internal observer is the homunculus problem. If the brain sends information to
          “consciousness”, who or what inside consciousness reads it? Whatever it is would need an observer of its own, and so on, in an
          infinite regress.
        </p>
        <Claim kind="interpretation">
          <p>
            A more plausible possibility is that conscious experience is not information displayed to another observer at all. Instead, a
            certain kind of globally integrated or recurrent neural processing may itself be what conscious awareness consists of. Global
            workspace and recurrent processing theories propose versions of this; neither is settled.
          </p>
        </Claim>
      </Note>

      <Note idea={ideaBySlug("simulate-everything")}>
        <p>
          This leads naturally into computation. Suppose we had a computer with effectively unlimited resources. Could it simulate the entire
          universe? At first this sounds like a hardware problem, but it quickly becomes deeper: unlimited computation does not, by itself,
          solve several fundamental issues.
        </p>
        <Sub>Initial information</Sub>
        <p>
          Infinite computing power is not infinite knowledge. If the initial state of a system is unknown, more computing cannot reconstruct
          it perfectly.
        </p>
        <Claim kind="evidence">
          <p>
            Chaotic systems amplify tiny uncertainties in their initial conditions, so deterministic laws do not imply practical
            predictability. Quantum mechanics adds a further limit: an unknown quantum state cannot be copied, nor fully determined from a
            single measurement.
          </p>
        </Claim>
        <Sub>Quantum mechanics</Sub>
        <Claim kind="evidence">
          <p>Standard quantum mechanics predicts probabilities for measurement outcomes, and those probabilities match experiment extremely well.</p>
        </Claim>
        <Claim kind="interpretation">
          <p>
            If quantum randomness is genuinely fundamental (interpretations of quantum mechanics disagree on this), a perfect simulator could
            compute the probability distribution exactly without being able to predict which individual outcome will occur.
          </p>
          <Relation>perfect probability prediction ≠ perfect prediction of the future</Relation>
        </Claim>
        <Sub>Computability</Sub>
        <Claim kind="evidence">
          <p>
            Some problems are not merely difficult; they are mathematically undecidable. Alan Turing’s halting problem shows that there can be
            no algorithm that decides, for every possible program, whether it will eventually halt.
          </p>
          <Relation>infinite resources ≠ computable in principle</Relation>
        </Claim>
        <Sub>Self-reference</Sub>
        <p>
          A universe simulator located inside the universe would also have to simulate itself. And if its predictions become visible to the
          systems being predicted, they can change what those systems do. A machine predicts that I will choose A; I read the prediction and
          deliberately choose B. The prediction has become part of the causal system.
        </p>
        <Claim kind="evidence">
          <p>David Wolpert has turned versions of this argument into formal theorems about the limits of prediction by devices inside the universe they predict.</p>
        </Claim>
        <Sub>Computational irreducibility</Sub>
        <Claim kind="speculation">
          <p>
            Some systems may have no shortcut: the only way to know their future state may be to let the computation unfold (Stephen Wolfram
            calls this computational irreducibility). In that case the most accurate simulation of a universe might effectively be another
            universe, evolving at the same level of detail.
          </p>
          <Relation>simulation ≠ prediction</Relation>
        </Claim>
      </Note>

      <Note idea={ideaBySlug("simulated-brain")}>
        <p>
          This connects computation directly back to consciousness. Imagine a perfect simulation of a human brain: every neuron, synapse,
          membrane potential, neurotransmitter interaction, circuit and population dynamic is reproduced. The simulated person says “I see
          red.” “I am afraid.” “I remember being a child.” “I feel conscious.”
        </p>
        <OpenQuestion>Is there actually something it is like to be that simulated person?</OpenQuestion>
        <Claim kind="speculation">
          <p>
            A computational functionalist may say yes. If consciousness depends on the causal and computational organisation of a system,
            reproducing that organisation should reproduce consciousness:
          </p>
          <Relation>same functional organisation → same conscious experience</Relation>
        </Claim>
        <Claim kind="speculation">
          <p>
            Another view is that consciousness depends on the physical substrate itself: perhaps specific biological, chemical, quantum or
            still unknown physical properties are necessary. Then:
          </p>
          <Relation>simulation of a conscious brain ≠ conscious brain</Relation>
        </Claim>
        <Claim kind="interpretation">
          <p>
            Theories of consciousness can disagree sharply here. Integrated information theory, for example, implies that even a perfect brain
            simulation running on a conventional digital computer would be barely conscious, because what matters in that theory is the
            causal structure of the hardware, not the computation it carries out.
          </p>
        </Claim>
        <p>
          A common analogy, from John Searle, is that a simulated fire does not burn anything. But the analogy may mislead: some processes
          depend on their substrate and others are abstract. A simulated calculator really does calculate.
        </p>
        <OpenQuestion>Is consciousness more like combustion, or more like computation?</OpenQuestion>
        <p>We currently do not know.</p>
      </Note>

      <Note idea={ideaBySlug("is-computation-fundamental")}>
        <p>This raises another question: what if the universe is not fundamentally a computation? It is tempting to imagine reality as</p>
        <Chain across steps={["state", "rule", "next state"]} />
        <p>like a computer executing an algorithm.</p>
        <Claim kind="speculation">
          <p>
            But computation may simply be one language humans use to describe physical change. A falling object is not necessarily
            “calculating” its trajectory; it moves according to physical law. Likewise, the universe may not be running equations. It may
            simply behave in ways that our equations describe.
          </p>
        </Claim>
        <p>This is an important distinction:</p>
        <Relation>ontology ≠ description</Relation>
        <p>
          The fact that mathematics, computation or information theory describes reality extremely well does not automatically mean that
          reality literally is mathematics, computation or information.
        </p>
      </Note>

      <Note idea={ideaBySlug("what-is-fundamental")}>
        <p>Several possibilities become interesting.</p>
        <Sub>Quantum fields</Sub>
        <Claim kind="evidence">
          <p>In modern physics, particles are described as excitations of underlying quantum fields, a framework tested to extraordinary precision.</p>
        </Claim>
        <Claim kind="speculation">
          <p>Perhaps fields and their dynamics are more fundamental than computation.</p>
        </Claim>
        <Sub>Quantum states</Sub>
        <Claim kind="speculation">
          <p>Perhaps the most basic description is a quantum state evolving according to physical law.</p>
        </Claim>
        <Sub>Geometry</Sub>
        <Claim kind="evidence">
          <p>
            General relativity describes gravity as the curvature of spacetime, and its predictions, from the bending of starlight to
            gravitational waves, have been confirmed again and again.
          </p>
        </Claim>
        <Claim kind="speculation">
          <p>Perhaps geometry is more fundamental than matter or force.</p>
        </Claim>
        <Sub>Symmetry</Sub>
        <Claim kind="evidence">
          <p>
            Modern physics is deeply organised around symmetry. Conservation laws follow from symmetries (Noether’s theorem), and gauge
            symmetries strongly constrain which particles and interactions can exist.
          </p>
        </Claim>
        <Claim kind="speculation">
          <p>Perhaps the deepest layer of reality is better described by symmetries and constraints than by objects.</p>
        </Claim>
        <Sub>Relations</Sub>
        <Claim kind="evidence">
          <p>
            Experiments testing Bell’s inequalities show that entangled particles are correlated in ways that no theory can reproduce if each
            particle carries its own pre-set properties and no influence travels faster than light. The state of the whole cannot always be
            reduced to independent properties of the parts.
          </p>
        </Claim>
        <Claim kind="speculation">
          <p>Perhaps objects are not fundamentally independent entities at all, and their identities emerge from their relationships with other systems.</p>
        </Claim>
        <Sub>Information</Sub>
        <Claim kind="evidence">
          <p>Information is physical: erasing a bit of information has a minimum energy cost (Landauer’s principle), and experiments have measured it.</p>
        </Claim>
        <Claim kind="speculation">
          <p>
            Information may be more fundamental than computation. Computation is the transformation of information, but information itself may
            simply be distinguishable physical states and constraints on possible correlations. Quantum information theory makes this
            especially intriguing; John Wheeler’s slogan “it from bit” takes it to the extreme.
          </p>
        </Claim>
        <Sub>Mathematical structure</Sub>
        <Claim kind="speculation">
          <p>
            An even more radical possibility is that physical reality is a mathematical structure, and that matter, spacetime, information and
            computation are all aspects of it (Max Tegmark’s mathematical universe hypothesis).
          </p>
        </Claim>
        <p>But this immediately produces another question:</p>
        <OpenQuestion>Why does that mathematical structure physically exist at all?</OpenQuestion>
        <p>At this point physics begins to merge with metaphysics.</p>
      </Note>

      <Note idea={ideaBySlug("structure")}>
        <p>This is perhaps the question that ties everything together. The universe feels surprisingly structured.</p>
        <Claim kind="evidence">
          <p>
            Its physical laws appear stable, holding across enormous distances and billions of years. A relatively small number of equations
            describe an extraordinary range of phenomena. And physicists have sometimes derived consequences of those equations before
            observing them: antimatter, gravitational waves and the Higgs boson were all predicted on paper first, the last two by decades.
          </p>
        </Claim>
        <p>This raises a question deeper than “why is the universe suitable for life?”:</p>
        <OpenQuestion>Why is the universe mathematically intelligible at all?</OpenQuestion>
        <p>
          Why is reality not completely irregular? Why are there compact, discoverable regularities? Why can an organism that evolved on one
          small planet develop mathematical models that describe black holes, quantum fields, gravitational waves and the early universe?
          Eugene Wigner called this the “unreasonable effectiveness of mathematics”.
        </p>
      </Note>

      <Note idea={ideaBySlug("fine-tuning")}>
        <Claim kind="evidence">
          <p>
            The values of several physical constants and cosmological parameters appear compatible with long-lived stars, complex chemistry,
            heavy elements, planets and, eventually, life, and calculations suggest that some of them could not be very different without
            losing these. How finely tuned they really are is itself debated.
          </p>
        </Claim>
        <p>This creates the intuitive impression that the universe is “set up” unusually well. There are several broad explanations.</p>
        <Claim kind="speculation">
          <ol className="list-decimal space-y-2 pl-5 marker:text-zinc-400">
            <li>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Chance.</span> The parameters simply have the values they have.
            </li>
            <li>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Anthropic selection.</span> Observers can only exist in universes
              compatible with observers, so it is unsurprising that any observer finds itself in one.
            </li>
            <li>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">A multiverse.</span> If many universes exist with different
              parameters, observers arise in the subset that permits enough complexity.
            </li>
            <li>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Deeper necessity.</span> The constants that now look arbitrary may
              not be free parameters at all; a deeper theory may show that they could not have taken other values.
            </li>
            <li>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Design.</span> Some form of intelligence selected the laws or
              parameters. This is logically possible, but it currently lacks a clear, unique, falsifiable prediction that distinguishes it
              scientifically from the alternatives.
            </li>
          </ol>
        </Claim>
        <p>
          So the scientifically careful position is neither “the universe is definitely designed” nor “science has proven that the universe was
          not designed”. It is:
        </p>
        <OpenQuestion>
          The universe displays striking regularity, mathematical structure and apparent parameter sensitivity, but we do not yet know the
          ultimate explanation.
        </OpenQuestion>
      </Note>

      <Note idea={ideaBySlug("underneath")}>
        <p>The deeper theme behind all of this is:</p>
        <OpenQuestion>What is fundamentally real?</OpenQuestion>
        <p>Is reality fundamentally</p>
        <ul className="flex flex-wrap gap-1.5">
          {["matter?", "fields?", "spacetime?", "information?", "computation?", "relations?", "mathematical structure?", "consciousness?", "something we have not yet conceived of?"].map((w) => (
            <li key={w} className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
              {w}
            </li>
          ))}
        </ul>
        <p>And how do these levels relate?</p>
        <Claim kind="speculation">
          <p>One possible hierarchy:</p>
          <Chain steps={["physical structure", "information", "computation", "biological neural systems", "cognition", "conscious experience", "self-model"]} />
          <p>But this hierarchy may be wrong, incomplete, or reversed in ways we do not yet understand.</p>
        </Claim>
        <p>
          What interests me most is not choosing a philosophical position too early. It is understanding where empirical science ends, where
          theoretical interpretation begins, and where metaphysical speculation becomes unavoidable. The questions I want these notes to explore
          are:
        </p>
        <ol className="card list-decimal space-y-1.5 py-4 pl-10 pr-5 text-[15px] marker:font-mono marker:text-xs marker:text-zinc-400">
          <li>What is consciousness?</li>
          <li>What is the “self”?</li>
          <li>Does conscious awareness cause decisions, observe them, or take part in a larger distributed process?</li>
          <li>Can every physical system be simulated?</li>
          <li>Is the universe fundamentally computable?</li>
          <li>Is information more fundamental than matter?</li>
          <li>Why is mathematics so effective at describing reality?</li>
          <li>Why are there laws of nature at all?</li>
          <li>Why does the universe appear ordered enough for complex structures and observers to exist?</li>
        </ol>
        <p>And ultimately:</p>
        <OpenQuestion>Why is there a reality with structure, rather than something completely different, or nothing at all?</OpenQuestion>
      </Note>

      <p className="max-w-3xl border-t border-zinc-200 pt-6 text-sm leading-relaxed text-zinc-500 dark:border-zinc-800">
        These notes document questions, not answers. They will change as I read and think more.
      </p>
    </article>
  );
}
