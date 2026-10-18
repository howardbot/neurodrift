import { describe, expect, it } from "vitest";
import { MlpTrainer, evaluate, fitKalman, fitPopulationVector, makeDataset, makeNeurons, rate, trainAll } from "@/lib/decoders";

describe("toy motor cortex", () => {
  it("fires most for each neuron's preferred direction, never below zero", () => {
    const [nr] = makeNeurons(1, 4);
    const pref = rate(nr!, Math.cos(nr!.pd), Math.sin(nr!.pd));
    const anti = rate(nr!, -Math.cos(nr!.pd), -Math.sin(nr!.pd));
    expect(pref).toBeGreaterThan(anti);
    expect(anti).toBeGreaterThanOrEqual(0);
  });
});

describe("decoders", () => {
  const neurons = makeNeurons(40, 11);
  const train = makeDataset(neurons, 2400, 12);
  const test = makeDataset(neurons, 1200, 13);

  it("all three decode held-out movement, the Kalman filter best", () => {
    const r = evaluate(trainAll(train), test);
    expect(r.pv).toBeGreaterThan(0.4);
    expect(r.kalman).toBeGreaterThan(0.75);
    expect(r.mlp).toBeGreaterThan(0.6);
    expect(r.kalman).toBeGreaterThan(r.pv);
  }, 30000);

  it("the population vector suffers most with few neurons", () => {
    const few = makeNeurons(10, 11);
    const f = { pv: fitPopulationVector(makeDataset(few, 2400, 12)), kalman: fitKalman(makeDataset(few, 2400, 12)), mlp: fitPopulationVector(makeDataset(few, 2400, 12)) };
    const r = evaluate(f, makeDataset(few, 1200, 13));
    expect(r.kalman - r.pv).toBeGreaterThan(0.3);
  });

  it("the network improves as it trains", () => {
    const t = new MlpTrainer(train, 5);
    const score = () => evaluate({ pv: t.factory(), kalman: t.factory(), mlp: t.factory() }, test).mlp;
    const before = score();
    t.train(1500);
    expect(score()).toBeGreaterThan(before + 0.3);
  }, 30000);
});
